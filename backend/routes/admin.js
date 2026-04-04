import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
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

    // Check if user is admin (add is_admin column to profiles table)
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", data.user.id)
      .single();

    if (!profile.is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

    res.status(200).json({
      message: "User approved successfully",
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

    res.status(200).json({
      message: "User unsuspended",
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

    const { error } = await supabase
      .from(contentType + "s") // Convert to plural table name
      .delete()
      .eq("id", contentId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

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

export default router;
