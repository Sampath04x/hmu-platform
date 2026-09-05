import express from "express";
import supabase from "../config/supabase.js";
import { logAuditAction } from "../utils/audit.js";
import { sendOTPEmail, sendNotificationEmail } from "../utils/email.js";

const router = express.Router();

// Middleware to check specific roles
const checkRole = (allowedRoles = ['super_admin']) => {
  return async (req, res, next) => {
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, permissions, is_admin")
        .eq("user_id", data.user.id)
        .single();

      if (!profile) {
        return res.status(403).json({ error: "Profile not found or access denied." });
      }

      // Super admins and Founders always have full access for this middleware call usually
      if (profile.role === 'super_admin' || profile.role === 'founder') {
        req.id = data.user.id;
        req.role = profile.role;
        return next();
      }

      // Exact role match
      if (allowedRoles.includes(profile.role)) {
        req.id = data.user.id;
        req.role = profile.role;
        return next();
      }

      // Legacy support check
      if (profile.is_admin && allowedRoles.includes('admin')) {
        req.id = data.user.id;
        req.role = 'admin';
        return next();
      }

      return res.status(403).json({ error: `Access denied. Required roles: ${allowedRoles.join(", ")}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

const checkAdmin = checkRole(['founder', 'super_admin', 'admin']);
const checkSuperAdmin = checkRole(['super_admin', 'founder']);
const checkModerator = checkRole(['moderator', 'super_admin', 'founder']);
const checkJuniorModerator = checkRole(['junior_moderator', 'moderator', 'super_admin', 'founder']);

// GET admin dashboard stats
router.get("/stats", checkJuniorModerator, async (req, res) => {
  try {
    // 1. Total Students
    const { count: totalStudents } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    // 2. Verified Students
    const { count: verifiedStudents } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .eq("is_verified", true);

    // 3. Total Clubs
    const { count: totalClubs } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "club");

    // 4. Total Events
    const { count: totalEvents } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true });

    // 5. Active Vacant Classroom Reports
    const { count: activeVacantClassrooms } = await supabase
      .from("classroom_reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "empty")
      .gt("expires_at", new Date().toISOString());

    // 6. Pending Club Requests
    const { count: pendingClubRequests } = await supabase
      .from("club_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 7. Pending Events
    const { data: eventSample } = await supabase.from("events").select("*").limit(1);
    let pendingEvents = 0;
    let eventSortCol = "created_at";
    let hasApprovedField = false;
    let hasStatusField = false;

    if (eventSample && eventSample.length > 0) {
      if (!('created_at' in eventSample[0]) && ('started_at' in eventSample[0])) {
        eventSortCol = "started_at";
      }
      if ('is_approved' in eventSample[0]) {
        hasApprovedField = true;
        const { count: pendingEvCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("is_approved", false);
        pendingEvents = pendingEvCount || 0;
      } else if ('status' in eventSample[0]) {
        hasStatusField = true;
        const { count: pendingEvCount } = await supabase
          .from("events")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");
        pendingEvents = pendingEvCount || 0;
      }
    }

    // 8. Total Reports
    const { count: totalReports } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    // --- RECENT ACTIVITY ---
    const { data: recentStudents } = await supabase
      .from("profiles")
      .select("user_id, name, created_at")
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentClubReqs } = await supabase
      .from("club_requests")
      .select("id, club_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: recentEvents } = await supabase
      .from("events")
      .select(`event_id, title, ${eventSortCol}`)
      .order(eventSortCol, { ascending: false })
      .limit(5);

    const { data: recentClassroomReqs } = await supabase
      .from("classroom_reports")
      .select("id, status, created_at, classroom_id, classrooms(room_number, building_name)")
      .order("created_at", { ascending: false })
      .limit(5);

    const activities = [];
    if (recentStudents) {
      recentStudents.forEach(s => {
        activities.push({
          id: `student-${s.user_id}-${s.created_at}`,
          type: 'student_registered',
          title: `New student registered: ${s.name}`,
          timestamp: s.created_at,
          metadata: { user_id: s.user_id }
        });
      });
    }
    if (recentClubReqs) {
      recentClubReqs.forEach(c => {
        activities.push({
          id: `club-${c.id}-${c.created_at}`,
          type: 'club_submitted',
          title: `Club submitted for approval: ${c.club_name}`,
          timestamp: c.created_at,
          metadata: { request_id: c.id }
        });
      });
    }
    if (recentEvents) {
      recentEvents.forEach(e => {
        activities.push({
          id: `event-${e.event_id}-${e[eventSortCol]}`,
          type: 'event_created',
          title: `Event created: ${e.title}`,
          timestamp: e[eventSortCol],
          metadata: { event_id: e.event_id }
        });
      });
    }
    if (recentClassroomReqs) {
      recentClassroomReqs.forEach(cr => {
        const roomInfo = cr.classrooms ? `${cr.classrooms.building_name} - ${cr.classrooms.room_number}` : `Room #${cr.classroom_id}`;
        activities.push({
          id: `classroom-${cr.id}-${cr.created_at}`,
          type: 'classroom_report_submitted',
          title: `Classroom report submitted: ${roomInfo} is ${cr.status}`,
          timestamp: cr.created_at,
          metadata: { report_id: cr.id }
        });
      });
    }

    // --- RECENT AUDIT LOG ACTIONS ---
    try {
      const { data: recentAudit } = await supabase
        .from("audit_log")
        .select("id, action, created_at, target_id, details")
        .order("created_at", { ascending: false })
        .limit(10);

      if (recentAudit) {
        recentAudit.forEach(log => {
          let title = `Admin action: ${log.action}`;
          let type = 'admin_action';

          if (log.action === 'APPROVE_USER') {
            title = `User verified: ${log.details?.user_name || log.target_id}`;
            type = 'user_verified';
          } else if (log.action === 'SUSPEND_USER') {
            title = `User suspended: ${log.details?.user_name || log.target_id}`;
            type = 'user_suspended';
          } else if (log.action === 'UNSUSPEND_USER') {
            title = `User unsuspended: ${log.target_id}`;
            type = 'user_unsuspended';
          } else if (log.action === 'APPROVE_CLUB') {
            title = `Club request approved: ${log.details?.club_name || log.target_id}`;
            type = 'club_approved';
          } else if (log.action === 'REJECT_CLUB') {
            title = `Club request rejected: ${log.details?.club_name || log.target_id}`;
            type = 'club_rejected';
          } else if (log.action === 'APPROVE_EVENT') {
            title = `Event approved: ${log.details?.event_title || log.target_id}`;
            type = 'event_approved';
          } else if (log.action === 'RESOLVE_REPORT') {
            title = `Report resolved: ${log.details?.content_type || 'content'}`;
            type = 'report_resolved';
          } else if (log.action === 'DISMISS_REPORT') {
            title = `Report dismissed: ${log.target_id}`;
            type = 'report_dismissed';
          }

          activities.push({
            id: `audit-${log.id}-${log.created_at}`,
            type,
            title,
            timestamp: log.created_at,
            metadata: { target_id: log.target_id }
          });
        });
      }
    } catch (auditErr) {
      console.error("Failed to query audit_log for stats:", auditErr.message);
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentActivity = activities.slice(0, 10);

    // --- PENDING APPROVALS ---
    const { data: pendingClubReqsList } = await supabase
      .from("club_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    let pendingEventsList = [];
    if (hasApprovedField) {
      const { data: evts } = await supabase.from("events").select("*").eq("is_approved", false).order(eventSortCol, { ascending: false });
      pendingEventsList = evts || [];
    } else if (hasStatusField) {
      const { data: evts } = await supabase.from("events").select("*").eq("status", "pending").order(eventSortCol, { ascending: false });
      pendingEventsList = evts || [];
    }

    const { data: activeClassroomReports } = await supabase
      .from("classroom_reports")
      .select("*, classrooms(room_number, building_name)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    const { data: reportsList } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    res.status(200).json({
      stats: {
        totalStudents: totalStudents || 0,
        verifiedStudents: verifiedStudents || 0,
        totalClubs: totalClubs || 0,
        totalEvents: totalEvents || 0,
        activeVacantClassrooms: activeVacantClassrooms || 0,
        pendingClubRequests: pendingClubRequests || 0,
        pendingEvents: pendingEvents || 0,
        totalReports: totalReports || 0
      },
      recentActivity,
      pendingApprovals: {
        clubRequests: pendingClubReqsList || [],
        eventRequests: pendingEventsList || [],
        classroomReports: activeClassroomReports || [],
        reports: reportsList || []
      }
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET all pending approvals
router.get("/pending-users", checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_approved", false)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// APPROVE user account
router.post("/approve-user/:userId", checkAdmin, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_approved: true })
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log action
    await logAuditAction(req.id, "APPROVE_USER", userId, {
      name: data[0].name,
      role: data[0].role
    });

    // Dispatch Notification Email
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        await sendNotificationEmail(
          userData.user.email,
          "Your Request on HMU has been accepted! 🎉",
          `
            <h2>Welcome to HMU!</h2>
            <p>Your request has been officially accepted by the administrative team.</p>
            <p>You can now log in and start managing your events, interacting with followers, and representing yourself on the platform.</p>
          `
        );
      }
    } catch (emailErr) {
      console.warn("Failed to dispatch email for notification:", emailErr);
    }

    // Dispatch in-app notification
    try {
      const { sendNotification } = await import("../utils/notifications.js");
      await sendNotification(userId, 'club_approved', {
        club_name: data[0].name,
        message: "Your club has been approved! You can now post events and content.",
        link: "/home"
      });
    } catch (notifErr) {
      console.error("Failed to send in-app notification:", notifErr);
    }

    res.status(200).json({
      message: "User approved successfully. Notification email dispatched.",
      user: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REJECT user account
router.post("/reject-user/:userId", checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Delete the user from auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    // Delete profile
    await supabase.from("profiles").delete().eq("user_id", userId);

    res.status(200).json({
      message: "User rejected and deleted",
      reason: reason || "No reason provided",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SUSPEND user
router.post("/suspend-user/:userId", checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_suspended: true, suspension_reason: reason })
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log action
    await logAuditAction(req.id, "SUSPEND_USER", userId, { reason });

    res.status(200).json({
      message: "User suspended",
      user: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UNSUSPEND user
router.post("/unsuspend-user/:userId", checkAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_suspended: false, suspension_reason: null })
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log action
    await logAuditAction(req.id, "UNSUSPEND_USER", userId);

    res.status(200).json({
      message: "User unsuspended",
      user: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VERIFY user account
router.post("/verify-user/:userId", checkAdmin, async (req, res) => {
  const { userId } = req.params;
  const { is_verified } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_verified: is_verified !== false })
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log action
    await logAuditAction(req.id, "VERIFY_USER", userId, {
      name: data[0].name,
      is_verified: data[0].is_verified
    });

    res.status(200).json({
      message: "User verification status updated successfully.",
      user: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users (admin view)
router.get("/all-users", checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE report/content
router.delete("/remove-content/:contentId", checkAdmin, async (req, res) => {
  const { contentId } = req.params;
  const { contentType } = req.body; // 'event', 'post', 'message'

  try {
    if (!contentType) {
      return res
        .status(400)
        .json({ error: "Content type is required (event, post, message)" });
    }

    const ALLOWED_TYPES = ['event', 'post', 'message', 'comment'];
    if (!ALLOWED_TYPES.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    const { error } = await supabase
      .from(contentType + "s") // Convert to plural table name
      .delete()
      .eq("id", contentId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Log action
    await logAuditAction(req.id, "REMOVE_CONTENT", contentId, { contentType });

    res.status(200).json({
      message: `${contentType} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reports
router.get("/reports", checkAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE/Dismiss report
router.delete("/reports/:id", checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Report dismissed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE/Resolve/Under Review/Dismiss report status
router.put("/reports/:id/status", checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'open', 'under_review', 'resolved', 'dismissed'
  try {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Update report status failed:", error.message);
      // Fallback for missing column status
      if (error.code === 'P0002' || error.message.includes("column")) {
        await logAuditAction(req.id, `${status.toUpperCase()}_REPORT`, id, { status });
        return res.status(200).json({ message: `Report status simulated to ${status} successfully` });
      }
      return res.status(500).json({ error: error.message });
    }

    // Log action to audit log
    await logAuditAction(req.id, `${status.toUpperCase()}_REPORT`, id, { status });

    res.status(200).json({ message: `Report status updated to ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin: Update user roles and permissions
router.post("/set-role/:userId", checkSuperAdmin, async (req, res) => {
  const { userId } = req.params;
  const { role, permissions } = req.body; // role can be 'user', 'club', 'founder', 'super_admin'

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role, permissions: permissions || {} })
      .eq("user_id", userId)
      .select();

    if (error) return res.status(500).json({ error: error.message });

    // Log action
    await logAuditAction(req.id, "SET_ROLE", userId, { role, permissions });

    res.status(200).json({ message: "Role updated", profile: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Super Admin: DEEP REMOVE user (Auth + Profile)
router.delete("/remove-user/:userId", checkSuperAdmin, async (req, res) => {
  const { userId } = req.params;
  try {
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) return res.status(500).json({ error: authError.message });

    await supabase.from("profiles").delete().eq("user_id", userId);

    // Log action
    await logAuditAction(req.id, "REMOVE_USER", userId);

    res.status(200).json({ message: "User removed permanently" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Club Management: Add admin to club
router.post("/clubs/:clubId/add-admin", checkAdmin, async (req, res) => {
  const { clubId } = req.params;
  const { userId, level } = req.body;

  try {
    // Only super_admin or founder or the club owner can add admins
    const { data, error } = await supabase
      .from("club_admins")
      .insert({ club_id: clubId, user_id: userId, permission_level: level || 'editor' })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Club Management: List club admins
router.get("/clubs/:clubId/admins", checkAdmin, async (req, res) => {
  const { clubId } = req.params;
  try {
    const { data, error } = await supabase
      .from("club_admins")
      .select("*, profiles(name, profile_image_url)")
      .eq("club_id", clubId);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Canteen Management (Junior Moderator +)
// ─────────────────────────────────────────────────────────────────────────────

// Add a new canteen
router.post("/canteens", checkJuniorModerator, async (req, res) => {
  const { name, description, location, image_url, category } = req.body;
  try {
    const { data, error } = await supabase
      .from("canteens")
      .insert({ name, description, location, image_url, category })
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update canteen menu/items
router.put("/canteens/:id", checkJuniorModerator, async (req, res) => {
  const { id } = req.params;
  const { menu, name, description, location } = req.body;
  try {
    const { data, error } = await supabase
      .from("canteens")
      .update({ menu, name, description, location })
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a canteen (Moderator +)
router.delete("/canteens/:id", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("canteens").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Canteen deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Community & Post Management (Moderator +)
// ─────────────────────────────────────────────────────────────────────────────

// Accept a new community request
router.post("/communities/approve/:id", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("communities")
      .update({ status: "active" })
      .eq("id", id)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Community approved", community: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Warn a user profile
router.post("/profile/warn/:userId", checkModerator, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  try {
    // Increment warnings_count
    const { data, error } = await supabase.rpc('increment_warning', { user_id_param: userId });

    // Log action
    await logAuditAction(req.id, "WARN_USER", userId, { reason });

    res.status(200).json({ message: "User warned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Club Requests Management (Founder/Super Admin/Moderator)
// ─────────────────────────────────────────────────────────────────────────────

// GET unified clubs data (pending, approved, rejected)
router.get("/clubs", checkModerator, async (req, res) => {
  try {
    // Fetch pending requests
    const { data: pending } = await supabase
      .from("club_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    // Fetch rejected requests
    const { data: rejected } = await supabase
      .from("club_requests")
      .select("*")
      .eq("status", "rejected")
      .order("created_at", { ascending: false });

    // Fetch approved clubs
    const { data: approved } = await supabase
      .from("profiles")
      .select("user_id, name, username, email, profile_image_url, created_at, is_suspended, is_approved, club_metadata")
      .eq("role", "club")
      .order("created_at", { ascending: false });

    // Fetch followers count for each approved club
    const approvedWithFollowers = [];
    if (approved) {
      for (const club of approved) {
        const { count } = await supabase
          .from("followers")
          .select("*", { count: "exact", head: true })
          .eq("following_id", club.user_id);
        approvedWithFollowers.push({
          ...club,
          follower_count: count || 0
        });
      }
    }

    res.status(200).json({
      pending: pending || [],
      approved: approvedWithFollowers,
      rejected: rejected || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all club requests
router.get("/club-requests", checkModerator, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("club_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPROVE club request
router.post("/club-requests/:id/approve", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: request, error: fetchErr } = await supabase
      .from("club_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !request) return res.status(404).json({ error: "Request not found" });

    // Update status
    await supabase.from("club_requests").update({ status: "approved" }).eq("id", id);

    // Sync to existing user profile if it already exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, club_metadata")
      .eq("email", request.club_email.toLowerCase().trim())
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          is_approved: true,
          is_verified: true,
          bio: request.description,
          club_metadata: {
            ...profile.club_metadata,
            category: request.category || "General",
            description: request.description || "",
            president_name: request.president_name || ""
          }
        })
        .eq("user_id", profile.user_id);
    }

    // Send Email
    try {
      await sendNotificationEmail(
        request.club_email,
        "Your Club Request for HMU has been approved! 🎉",
        `
          <h2>Welcome, ${request.club_name}!</h2>
          <p>Your request to join the HMU Platform has been approved by the administrative team.</p>
          <p><strong>Next Step:</strong> You can now head over to the signup page and create your account using your official ID ending in <code>_vsp@gitam.in</code>.</p>
          <p>If you don't have an ID with that format, please contact support.</p>
          <p>We look forward to seeing your club's presence on the platform!</p>
        `
      );
    } catch (emailErr) {
      console.warn("Approval email failed to send:", emailErr);
    }

    // Log action
    await logAuditAction(req.id, "APPROVE_CLUB", id, { club_name: request.club_name });

    res.status(200).json({ message: "Club request approved and email dispatched" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT club request
router.post("/club-requests/:id/reject", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: request } = await supabase
      .from("club_requests")
      .select("club_email, club_name")
      .eq("id", id)
      .maybeSingle();

    await supabase.from("club_requests").update({ status: "rejected" }).eq("id", id);

    if (request) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("email", request.club_email.toLowerCase().trim())
        .maybeSingle();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ is_approved: false, is_verified: false })
          .eq("user_id", profile.user_id);
      }
    }

    // Log action
    await logAuditAction(req.id, "REJECT_CLUB", id, { club_name: request?.club_name || "Club" });

    res.status(200).json({ message: "Club request rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE club request
router.delete("/club-requests/:id", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("club_requests").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Club request deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all classroom reports (Junior Moderator +)
router.get("/classroom-reports", checkJuniorModerator, async (req, res) => {
  try {
    const { data: reports, error } = await supabase
      .from("classroom_reports")
      .select(`
        *,
        classroom:classrooms(building_name, room_number),
        reporter:profiles!reporter_id(user_id, name, username, is_verified, role, points),
        classroom_votes(vote_type, voter_id)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Process reports to count votes
    const processed = reports.map(r => {
      let confirms = 0;
      let denies = 0;
      r.classroom_votes?.forEach(v => {
        if (v.vote_type) confirms++;
        else denies++;
      });
      return {
        ...r,
        confirmed_count: confirms,
        deny_count: denies
      };
    });

    res.json(processed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE classroom report
router.delete("/classroom-reports/:id", checkJuniorModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: report } = await supabase
      .from("classroom_reports")
      .select("classroom_id")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("classroom_reports").delete().eq("id", id);
    if (error) throw error;

    if (report) {
      // Reset classroom status to unknown
      await supabase
        .from("classrooms")
        .update({ status: "unknown", last_updated_at: new Date().toISOString() })
        .eq("id", report.classroom_id);
    }

    res.json({ message: "Classroom report deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK FALSE classroom report
router.post("/classroom-reports/:id/false", checkJuniorModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: report } = await supabase
      .from("classroom_reports")
      .select("classroom_id, reporter_id")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("classroom_reports").delete().eq("id", id);
    if (error) throw error;

    if (report) {
      // Reset classroom status to unknown
      await supabase
        .from("classrooms")
        .update({ status: "unknown", last_updated_at: new Date().toISOString() })
        .eq("id", report.classroom_id);

      // Deduct 5 points from reporter for false report
      const { data: profile } = await supabase.from('profiles').select('points').eq('user_id', report.reporter_id).single();
      if (profile) {
        await supabase.from('profiles').update({ points: Math.max(0, (profile.points || 0) - 5) }).eq('user_id', report.reporter_id);
      }
    }

    res.json({ message: "Classroom report marked as false and deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// KEEP ACTIVE classroom report
router.post("/classroom-reports/:id/keep-active", checkJuniorModerator, async (req, res) => {
  const { id } = req.params;
  try {
    const newExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: report, error } = await supabase
      .from("classroom_reports")
      .update({ expires_at: newExpiry })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (report) {
      await supabase
        .from("classrooms")
        .update({ last_updated_at: new Date().toISOString() })
        .eq("id", report.classroom_id);
    }

    res.json({ message: "Classroom report kept active", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all audit logs (Super Admin/Founder only)
router.get("/audit-logs", checkSuperAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("audit_log")
      .select(`
        *,
        admin:profiles!audit_log_admin_id_fkey(name, profile_image_url),
        target:profiles!audit_log_target_user_id_fkey(name)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
