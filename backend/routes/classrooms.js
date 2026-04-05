import express from "express";
import supabase from "../config/supabase.js";
import { hasReachedDailyLimit, trackActivity } from "../utils/activity.js";

const router = express.Router();

// Middleware to authenticate and fetch user
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a new classroom (Students/Admin)
router.post("/", authenticate, async (req, res) => {
  try {
    const { building_name, room_number, floor, semester } = req.body;
    const userId = req.user.id;

    // Fetch user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Admins and moderated roles have auto-verified rooms
    // Students can add rooms but they start with is_verified = false (if we add the column)
    // For now, let's allow addition and tag it
    const isAutoVerified = ["founder", "super_admin", "moderator", "junior_moderator"].includes(profile.role);

    const { data, error } = await supabase
      .from("classrooms")
      .insert([{ 
        building_name, 
        room_number, 
        floor, 
        semester: semester || "Odd 2025",
        last_updated_by: userId,
        status: 'unknown'
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Award activity points for adding a room (3 points)
    await trackActivity(userId, 3);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk add classrooms (Admin only)
router.post("/bulk", authenticate, async (req, res) => {
  try {
    const { rooms } = req.body; // Array of { building_name, room_number, floor, semester }
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!profile || !["founder", "super_admin", "moderator"].includes(profile.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { data, error } = await supabase
      .from("classrooms")
      .insert(rooms.map(r => ({ ...r, status: 'unknown' })))
      .select();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all classrooms status (real-time)
router.get("/", async (req, res) => {
  try {
    const { building } = req.query;
    
    let query = supabase
      .from("classrooms")
      .select(`
        *,
        classroom_reports(
          id,
          status,
          created_at,
          expires_at,
          reporter_id,
          classroom_votes(
            vote_type,
            voter_id
          )
        )
      `)
      .order("building_name", { ascending: true })
      .order("room_number", { ascending: true });

    if (building) {
      query = query.eq("building_name", building);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter active reports (not expired)
    const processedData = data.map(room => {
      const activeReport = room.classroom_reports?.find(r => new Date(r.expires_at) > new Date()) || null;
      
      let finalStatus = room.status;
      let votes = { up: 0, down: 0 };
      
      if (activeReport) {
        finalStatus = activeReport.status;
        activeReport.classroom_votes?.forEach(v => {
          if (v.vote_type) votes.up++;
          else votes.down++;
        });
      }

      return {
        ...room,
        current_report: activeReport,
        live_status: finalStatus,
        votes
      };
    });

    res.json(processedData);
  } catch (error) {
    console.error("Error fetching classrooms:", error);
    res.status(500).json({ error: error.message });
  }
});

// Report classroom status
router.post("/report", authenticate, async (req, res) => {
  try {
    const { classroom_id, status } = req.body;
    const userId = req.user.id;

    // Check if user is a student or higher
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Daily Limit check
    const isLimitReached = await hasReachedDailyLimit(userId, profile.role);
    if (isLimitReached) {
      return res.status(429).json({ error: "Daily activity limit reached. Please try again tomorrow." });
    }

    // Create a new report
    const { data: report, error: reportError } = await supabase
      .from("classroom_reports")
      .insert([
        {
          classroom_id,
          reporter_id: userId,
          status,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
        }
      ])
      .select()
      .single();

    if (reportError) throw reportError;

    // Also update the main classroom status as a "cached" version
    await supabase
      .from("classrooms")
      .update({ 
        status: status, 
        last_updated_at: new Date().toISOString(),
        last_updated_by: userId 
      })
      .eq("id", classroom_id);

    // Track activity and award 2 points for reporting
    await trackActivity(userId, 2);

    res.json({ message: "Status reported successfully", report });
  } catch (error) {
    console.error("Error reporting status:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vote on a status report
router.post("/vote", authenticate, async (req, res) => {
  try {
    const { report_id, vote_type } = req.body; // vote_type: true (confirm), false (deny)
    const userId = req.user.id;

    // Check if report exists and is not expired
    const { data: report, error: reportError } = await supabase
      .from("classroom_reports")
      .select("*")
      .eq("id", report_id)
      .single();

    if (reportError || !report || new Date(report.expires_at) < new Date()) {
      return res.status(400).json({ error: "Report is expired or invalid" });
    }

    // Upsert vote
    const { error: voteError } = await supabase
      .from("classroom_votes")
      .upsert({
        report_id,
        voter_id: userId,
        vote_type,
        created_at: new Date().toISOString()
      }, { onConflict: "report_id, voter_id" });

    if (voteError) throw voteError;

    // Track activity for voting (1 point)
    await trackActivity(userId, 1);

    res.json({ message: "Vote recorded successfully" });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get room timetable
router.get("/:id/timetable", async (req, res) => {
  try {
    const { id } = req.params;
    const { semester } = req.query;

    let query = supabase
      .from("classroom_timetables")
      .select("*")
      .eq("classroom_id", id);

    if (semester) {
      query = query.eq("semester", semester);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update room timetable (Moderators/Admin)
router.post("/:id/timetable", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { semester, timetable_data } = req.body; // timetable_data: Array of { day, start, end, subject }
    const userId = req.user.id;

    // Permission Check: Founder, Super Admin, Moderator, or Junior Moderator
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const allowedRoles = ["founder", "super_admin", "moderator", "junior_moderator"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return res.status(403).json({ error: "Unauthorized to update timetables" });
    }

    // Delete existing records for this semester to bulk update
    await supabase
      .from("classroom_timetables")
      .delete()
      .eq("classroom_id", id)
      .eq("semester", semester);

    // Insert new records
    if (timetable_data && timetable_data.length > 0) {
      const recordsToInsert = timetable_data.map(item => ({
        classroom_id: id,
        semester,
        day_of_week: item.day,
        start_time: item.start,
        end_time: item.end,
        subject: item.subject
      }));

      const { error: insertError } = await supabase
        .from("classroom_timetables")
        .insert(recordsToInsert);

      if (insertError) throw insertError;
    }

    res.json({ message: "Timetable updated successfully" });
  } catch (error) {
    console.error("Error updating timetable:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
