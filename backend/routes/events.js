import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth } from "../utils/auth.js";
import { logAuditAction } from "../utils/audit.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { created_by, all } = req.query;

  // 1. Fetch all profiles with role = 'club' to map club names/logos in-memory safely
  const { data: clubs } = await supabase
    .from("profiles")
    .select("user_id, name, profile_image_url")
    .eq("role", "club");

  const clubsMap = new Map(clubs?.map(c => [c.user_id, c]) || []);

  let query = supabase.from("events").select("*").order("started_at", { ascending: true });
  
  if (created_by) {
    query = query.eq("created_by", created_by);
  }

  // 2. Check if user is admin via Authorization header manually
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", userData.user.id)
          .single();
        if (profile && ["super_admin", "founder", "moderator"].includes(profile.role)) {
          isAdmin = true;
        }
      }
    } catch (e) {
      console.error("Auth check failed in GET /events:", e.message);
    }
  }

  // 3. Filter out unapproved events for students
  if (!isAdmin && all !== "true") {
    // Detect columns dynamically on the first row to determine if we check is_approved or status
    const { data: eventSample } = await supabase.from("events").select("*").limit(1);
    if (eventSample && eventSample.length > 0) {
      if ("is_approved" in eventSample[0]) {
        query = query.eq("is_approved", true);
      } else if ("status" in eventSample[0]) {
        query = query.eq("status", "approved");
      }
    }
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Map club_name and club_logo to matching events in memory
  const processed = data.map(event => {
    const club = clubsMap.get(event.club_id);
    return {
      ...event,
      club_name: club?.name || event.club_id || "Campus Event",
      club_logo: club?.profile_image_url || null
    };
  });

  res.json(processed);
});

router.post("/", verifyAuth, async (req, res) => {
  const {
    title,
    description,
    started_at,
    ended_at,
    poster_url,
    location,
  } = req.body;
  
  const userId = req.user.id;

  // Validation
  if (!title || !description || !started_at || !location) {
    return res.status(400).json({
      error: "Missing required fields: title, description, started_at, location",
    });
  }

  // Get user profile to check role and set club_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  if (profile.role !== "club" && profile.role !== "super_admin" && profile.role !== "founder") {
    return res.status(403).json({ error: "Only clubs or admins can create events" });
  }

  const insertPayload = {
    title,
    description,
    started_at,
    ended_at,
    poster_url,
    location,
    club_id: userId,
    created_by: userId,
  };

  const { data: eventSample } = await supabase.from("events").select("*").limit(1);
  const isSuperAdminOrFounder = ["super_admin", "founder"].includes(profile.role);

  if (eventSample && eventSample.length > 0) {
    if ("is_approved" in eventSample[0]) {
      insertPayload.is_approved = isSuperAdminOrFounder ? true : false;
    }
    if ("status" in eventSample[0]) {
      insertPayload.status = isSuperAdminOrFounder ? "approved" : "pending";
    }
  } else {
    insertPayload.is_approved = isSuperAdminOrFounder ? true : false;
    insertPayload.status = isSuperAdminOrFounder ? "approved" : "pending";
  }

  const { data, error } = await supabase
    .from("events")
    .insert([insertPayload])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Notify followers
  import("../utils/notifications.js").then(({ notifyFollowers }) => {
    notifyFollowers(userId, 'club_event', {
      club_id: userId,
      club_name: profile.name || 'A club you follow',
      event_title: title,
      event_id: data[0].event_id,
      preview: description ? (description.length > 60 ? description.substring(0, 60) + '...' : description) : 'Upcoming event!',
      link: `/events` // Link to events page
    });
  });

  res.status(201).json(data);
});

router.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("event_id", req.params.id)
    .single();
  if (error) {
    return res.status(404).json({ error: "Event not found" });
  }
  res.json(data);
});

// UPDATE event
router.put("/:id", verifyAuth, async (req, res) => {
  const { title, description, started_at, ended_at, location, poster_url, is_approved, status } = req.body;
  const userId = req.user.id;
  
  // Verify ownership or admin
  const { data: event } = await supabase.from("events").select("created_by").eq("event_id", req.params.id).single();
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
  
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  const isAdmin = profile && ["super_admin", "founder", "moderator"].includes(profile.role);
  if (event.created_by !== userId && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
  }

  const updatePayload = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  if (started_at !== undefined) updatePayload.started_at = started_at;
  if (ended_at !== undefined) updatePayload.ended_at = ended_at;
  if (location !== undefined) updatePayload.location = location;
  if (poster_url !== undefined) updatePayload.poster_url = poster_url;

  if (isAdmin) {
    if (is_approved !== undefined) updatePayload.is_approved = is_approved;
    if (status !== undefined) updatePayload.status = status;
  }

  const { data, error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("event_id", req.params.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (isAdmin && (is_approved !== undefined || status !== undefined)) {
    const actionType = is_approved ? "APPROVE_EVENT" : "REJECT_EVENT";
    await logAuditAction(userId, actionType, req.params.id, {
      event_title: title || (data && data[0]?.title) || "Event",
      is_approved,
      status
    });
  }

  res.json(data);
});

// DELETE event
router.delete("/:id", verifyAuth, async (req, res) => {
  const userId = req.user.id;
  
  // Verify ownership or admin
  const { data: event } = await supabase.from("events").select("created_by, title").eq("event_id", req.params.id).single();
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
  
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  if (event.created_by !== userId && profile?.role !== 'super_admin' && profile?.role !== 'founder') {
      return res.status(403).json({ error: "Unauthorized" });
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("event_id", req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Log action
  await logAuditAction(userId, "DELETE_EVENT", req.params.id, { title: event.title });

  res.json({ message: "Event deleted successfully" });
});

export default router;
