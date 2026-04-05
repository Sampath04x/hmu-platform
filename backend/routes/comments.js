import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth } from "../utils/auth.js";
import { trackActivity, removeActivityPoints, hasReachedDailyLimit } from "../utils/activity.js";

const router = express.Router();

// GET all comments for a post
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*, profiles!user_id(name, profile_image_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a comment
router.post("/", verifyAuth, async (req, res) => {
  const { postId, comment } = req.body;
  const userId = req.user.id;

  if (!postId || !comment) return res.status(400).json({ error: "Missing required fields" });

  try {
    // 1. Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) return res.status(404).json({ error: "Profile not found" });

    // 2. Check daily limit
    if (await hasReachedDailyLimit(userId, profile.role)) {
      return res.status(429).json({ error: "Daily activity limit reached. Consider upgrading to Premium!" });
    }

    const { data, error } = await supabase
      .from("post_comments")
      .insert([{ 
        user_id: userId, 
        post_id: postId,
        comment
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Track activity and add 1 point
    await trackActivity(userId, 1);

    res.status(201).json({ message: "Comment added!", comment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a comment
router.delete("/:commentId", verifyAuth, async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  try {
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) return res.status(404).json({ error: "Comment not found" });

    // Role check
    if (comment.user_id !== userId) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
        if (profile?.role !== 'super_admin' && profile?.role !== 'founder' && profile?.role !== 'moderator') {
            return res.status(403).json({ error: "Unauthorized" });
        }
    }

    const { error: deleteError } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    // Remove 1 point
    await removeActivityPoints(comment.user_id, 1);

    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
