import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth } from "../utils/auth.js";
import { hasReachedDailyLimit, trackActivity, removeActivityPoints } from "../utils/activity.js";

const router = express.Router();

// GET all posts with pagination
router.get("/", async (req, res) => {
  const { limit = 20, offset = 0, userId } = req.query;

  try {
    // 1. Fetch posts with counts and author info
    const { data: posts, error, count } = await supabase
      .from("posts")
      .select("*, profiles!user_id(name, profile_image_url, department, year_of_study), post_comments(count), post_likes(count)", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) return res.status(500).json({ error: error.message });

    // 2. If userId is provided, check if this user has liked each post
    let enrichedPosts = posts;
    if (userId) {
      const postIds = posts.map(p => p.id);
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds);
      
      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
      enrichedPosts = posts.map(p => ({
        ...p,
        user_has_liked: likedPostIds.has(p.id)
      }));
    }

    res.json({ posts: enrichedPosts, total: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a post
router.post("/", verifyAuth, async (req, res) => {
  const { content, title, media_urls, post_type } = req.body;
  const userId = req.user.id;

  if (!content) return res.status(400).json({ error: "Content is required" });

  try {
    // 1. Get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) return res.status(404).json({ error: "Profile not found" });

    // 2. ONLY clubs/admins can post media
    const canPostMedia = ['club', 'founder', 'super_admin'].includes(profile.role);
    if (media_urls && media_urls.length > 0 && !canPostMedia) {
      return res.status(403).json({ error: "Only club accounts or admins can post media to the main feed." });
    }

    // 3. Check daily limit
    if (await hasReachedDailyLimit(userId, profile.role)) {
      return res.status(429).json({ error: "Daily activity limit reached. Consider upgrading to Premium!" });
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([{ 
        user_id: userId, 
        content, 
        title, 
        media_urls, 
        post_type 
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // 4. Track activity and add 1 point
    await trackActivity(userId, 1);

    res.status(201).json({ message: "Post created!", post: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a post
router.delete("/:postId", verifyAuth, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Check ownership or superadmin role
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) return res.status(404).json({ error: "Post not found" });

    // In a real app, I'd also check for role 'super_admin' or 'founder' in profiles
    if (post.user_id !== userId) {
        // Need to check for super_admin role if not the owner
        const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', userId).single();
        if (profile?.role !== 'super_admin' && profile?.role !== 'founder' && profile?.role !== 'moderator') {
            return res.status(403).json({ error: "Unauthorized" });
        }
    }

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) return res.status(500).json({ error: deleteError.message });

    // Remove 1 point if it's the owner deleting or if it was flagged-deleted?
    // User spec: "if he deletes it , remove the point"
    await removeActivityPoints(post.user_id, 1);

    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LIKE/UNLIKE post
router.post("/:postId/like", verifyAuth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const { data: existing } = await supabase
            .from("post_likes")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", userId)
            .single();

        if (existing) {
            // Unlike
            await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
            return res.json({ message: "Post unliked" });
        }

        // Like
        await supabase.from("post_likes").insert([{ post_id: postId, user_id: userId }]);
        res.json({ message: "Post liked" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
