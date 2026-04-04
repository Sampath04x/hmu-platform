import express from "express";
import supabase from "../config/supabase.js";
const router = express.Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("events").select("*");
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});
router.post("/", async (req, res) => {
  const {
    title,
    description,
    started_at,
    ended_at,
    poster_url,
    location,
    club_id,
    created_by,
  } = req.body;

  // Validation
  if (
    !title ||
    !description ||
    !started_at ||
    !poster_url ||
    !location ||
    !created_by
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: title, description, started_at, poster_url, location, created_by",
    });
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
        club_id,
        created_by,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
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
router.put("/:id", async (req, res) => {
  const { title, description, started_at, ended_at, location, poster_url } =
    req.body;

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
router.delete("/:id", async (req, res) => {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("event_id", req.params.id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: "Event deleted successfully" });
});
export default router;
