import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth } from "../utils/auth.js";
import { trackActivity, hasReachedDailyLimit, removeActivityPoints } from "../utils/activity.js";

const router = express.Router();

// GET all canteens
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("canteens")
      .select("*")
      .order("average_rating", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET specific canteen details
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("canteens")
      .select("*, canteen_reviews(*, profiles(name, profile_image_url))")
      .eq("id", req.params.id)
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a review (Limit 1 per person per canteen)
router.post("/:id/review", verifyAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, comment, tips, is_anonymous } = req.body;
  const userId = req.user.id;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

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
      .from("canteen_reviews")
      .insert({
        canteen_id: id,
        user_id: userId,
        rating,
        comment,
        tips,
        is_anonymous
      })
      .select();

    if (error) {
        if (error.code === '23505') { // Unique constraint
          return res.status(400).json({ error: "You have already rated this canteen. You can delete your existing review if you wish to post a new one." });
        }
       return res.status(500).json({ error: error.message });
    }

    // Track activity and add 1 point
    await trackActivity(userId, 1);

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a review
router.delete("/review/:reviewId", verifyAuth, async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  try {
    const { data: review, error: fetchError } = await supabase
      .from("canteen_reviews")
      .select("user_id, canteen_id")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) return res.status(404).json({ error: "Review not found" });

    // Role check
    if (review.user_id !== userId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
      if (profile?.role !== 'super_admin' && profile?.role !== 'founder' && profile?.role !== 'moderator') {
        return res.status(403).json({ error: "Unauthorized" });
      }
    }

    const { error: deleteError } = await supabase
      .from("canteen_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    // Update canteen core stats (this would normally be handled by a DB trigger, but we could also do it here)
    // For now, removing points is the priority
    await removeActivityPoints(review.user_id, 1);

    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

