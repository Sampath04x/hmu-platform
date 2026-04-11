import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth } from "../utils/auth.js";
import { logAuditAction } from "../utils/audit.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { created_by } = req.query;
  let query = supabase.from("events").select("*").order("started_at", { ascending: true });
  
  if (created_by) {
    query = query.eq("created_by", created_by);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
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

  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        title,
        description,
        started_at,
        ended_at,
        poster_url,
        location,
        club_id: profile.name, // Use the profile name as club_id
        created_by: userId,
      },
    ])
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
  const { title, description, started_at, ended_at, location, poster_url } = req.body;
  const userId = req.user.id;
  
  // Verify ownership or admin
  const { data: event } = await supabase.from("events").select("created_by").eq("event_id", req.params.id).single();
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
  
  if (!event) return res.status(404).json({ error: "Event not found" });
  
  if (event.created_by !== userId && profile?.role !== 'super_admin' && profile?.role !== 'founder') {
      return res.status(403).json({ error: "Unauthorized" });
  }

  const { data, error } = await supabase
    .from("events")
    .update({ title, description, started_at, ended_at, location, poster_url })
    .eq("event_id", req.params.id)
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
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
