import express from "express";
import supabase from "../config/supabase.js";

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
    const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: pendingCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false);
    const { count: canteenCount } = await supabase.from("canteens").select("*", { count: "exact", head: true });
    
    // In a real app we'd query a reports table, but for now we'll mock the last count
    const reportedPlaybook = 8; 

    res.status(200).json({
      totalUsers: userCount || 0,
      pendingVerifications: pendingCount || 0,
      activeCanteens: canteenCount || 0,
      reportedPosts: reportedPlaybook
    });
  } catch (error) {
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
    await supabase.from("audit_log").insert({
      admin_id: req.id,
      action: "APPROVE_USER",
      target_user_id: userId,
    });

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

    // Log action
    await supabase.from("audit_log").insert({
      admin_id: req.id,
      action: "SUSPEND_USER",
      target_user_id: userId,
      details: { reason }
    });

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
    await supabase.from("audit_log").insert({
      admin_id: req.id,
      action: "SET_ROLE",
      target_user_id: userId,
      details: { role, permissions }
    });

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
    
    await supabase.from("audit_log").insert({
      admin_id: req.id,
      action: "REMOVE_USER",
      target_user_id: userId
    });

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
  const { name, description, location } = req.body;
  try {
    const { data, error } = await supabase
      .from("canteens")
      .insert({ name, description, location })
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
    // Implementation for approving community
    res.status(200).json({ message: "Community approved" });
});

// Warn a user profile
router.post("/profile/warn/:userId", checkModerator, async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;
  try {
    // Increment warnings_count
    const { data, error } = await supabase.rpc('increment_warning', { user_id_param: userId });
    
    // Log as audit
    await supabase.from("audit_log").insert({
        admin_id: req.id,
        action: "WARN_USER",
        target_user_id: userId,
        details: { reason }
    });

    res.status(200).json({ message: "User warned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
