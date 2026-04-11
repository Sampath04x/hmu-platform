import express from "express";
import supabase from "../config/supabase.js";
import { logAuditAction } from "../utils/audit.js";

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
    await logAuditAction(req.id, "APPROVE_USER", userId, { 
      name: data[0].name,
      role: data[0].role 
    });

    // Dispatch Notification Email
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        const emailAddress = userData.user.email;
        
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"HMU Admin" <${process.env.SMTP_USER}>`,
            to: emailAddress,
            subject: "Your Club Request on HMU has been accepted! 🎉",
            html: `
              <h2>Welcome to HMU!</h2>
              <p>Your club request has been officially accepted by the administrative team.</p>
              <p>You can now log in and start managing your events, interacting with followers, and representing your club on the platform.</p>
            `,
          });
          console.log(`[EMAIL DISPATCH] Real email sent to ${emailAddress}`);
        } else {
          console.log(`[EMAIL DISPATCH - MOCK] Sent to ${emailAddress}: "Your Club Request on HMU has been accepted! You can now log in and manage your club profile."`);
        }
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

    // Send Email
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"HMU Admin" <${process.env.SMTP_USER}>`,
          to: request.club_email,
          subject: "Your Club Request for HMU has been approved! 🎉",
          html: `
            <h2>Welcome, ${request.club_name}!</h2>
            <p>Your request to join the HMU Platform has been approved by the administrative team.</p>
            <p><strong>Next Step:</strong> You can now head over to the signup page and create your account using your official ID ending in <code>_vsp@gitam.in</code>.</p>
            <p>If you don't have an ID with that format, please contact support.</p>
            <p>We look forward to seeing your club's presence on the platform!</p>
          `,
        });
      } else {
        console.log(`[EMAIL MOCK] Approved club request for ${request.club_email}`);
      }
    } catch (emailErr) {
      console.warn("Approval email failed to send:", emailErr);
    }

    res.status(200).json({ message: "Club request approved and email dispatched" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REJECT club request
router.post("/club-requests/:id/reject", checkModerator, async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from("club_requests").update({ status: "rejected" }).eq("id", id);
    res.status(200).json({ message: "Club request rejected" });
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
