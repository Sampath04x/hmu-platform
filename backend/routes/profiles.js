import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Middleware to verify authentication
const verifyAuth = async (req, res, next) => {
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

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET user profile by ID
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all users with optional search and filtering
router.get("/", async (req, res) => {
  const { search, department, year } = req.query;

  try {
    let query = supabase.from("profiles").select("*");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (department) {
      query = query.eq("department", department);
    }

    if (year) {
      query = query.eq("year_of_study", parseInt(year));
    }

    const { data, error } = await query.eq("is_suspended", false);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE user profile
router.put("/:userId", verifyAuth, async (req, res) => {
  const { userId } = req.params;
  const { name, bio, department, year_of_study, profile_image_url, gender } =
    req.body;

  // Authorization check - users can only update their own profile
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "You can only update your own profile" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name,
        bio,
        department,
        year_of_study,
        profile_image_url,
        gender,
      })
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: "Profile updated successfully",
      user: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user account
router.delete("/:userId", verifyAuth, async (req, res) => {
  const { userId } = req.params;

  // Authorization check
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "You can only delete your own account" });
  }

  try {
    // Delete user profile (cascades delete auth user)
    await supabase.from("profiles").delete().eq("user_id", userId);

    // Delete auth user
    await supabase.auth.admin.deleteUser(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FOLLOW user
router.post("/:userId/follow", verifyAuth, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;

  if (userId === followerId) {
    return res.status(400).json({ error: "You cannot follow yourself" });
  }

  try {
    // Check if already following
    const { data: existing } = await supabase
      .from("followers")
      .select("*")
      .eq("follower_id", followerId)
      .eq("following_id", userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Add follow relationship
    const { error } = await supabase.from("followers").insert([
      {
        follower_id: followerId,
        following_id: userId,
      },
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Successfully followed user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UNFOLLOW user
router.delete("/:userId/follow", verifyAuth, async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user.id;

  try {
    const { error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Successfully unfollowed user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET followers list
router.get("/:userId/followers", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("followers")
      .select("follower_id, profiles!follower_id(name, profile_image_url)")
      .eq("following_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET following list
router.get("/:userId/following", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("followers")
      .select("following_id, profiles!following_id(name, profile_image_url)")
      .eq("follower_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user's events
router.get("/:userId/events", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("event_participants")
      .select(
        "event_id, events(title, started_at, location, poster_url), status",
      )
      .eq("user_id", userId)
      .order("events(started_at)", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET user's interests
router.get("/:userId/interests", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from("user_interests")
      .select("interest_id, interests(interest)")
      .eq("user_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD interest to user
router.post("/:userId/interests/:interestId", verifyAuth, async (req, res) => {
  const { userId, interestId } = req.params;

  // Authorization check
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "You can only add interests to your own profile" });
  }

  try {
    // Check if already added
    const { data: existing } = await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .eq("interest_id", interestId)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Interest already added" });
    }

    const { error } = await supabase.from("user_interests").insert([
      {
        user_id: userId,
        interest_id: interestId,
      },
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "Interest added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE interest from user
router.delete(
  "/:userId/interests/:interestId",
  verifyAuth,
  async (req, res) => {
    const { userId, interestId } = req.params;

    // Authorization check
    if (req.user.id !== userId) {
      return res.status(403).json({
        error: "You can only remove interests from your own profile",
      });
    }

    try {
      const { error } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", userId)
        .eq("interest_id", interestId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ message: "Interest removed successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// BLOCK user
router.post("/:userId/block", verifyAuth, async (req, res) => {
  const { userId } = req.params;
  const blockerId = req.user.id;

  if (userId === blockerId) {
    return res.status(400).json({ error: "You cannot block yourself" });
  }

  try {
    // Check if already blocked
    const { data: existing } = await supabase
      .from("blocked_users")
      .select("*")
      .eq("blocker_id", blockerId)
      .eq("blocked_id", userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Already blocked this user" });
    }

    const { error } = await supabase.from("blocked_users").insert([
      {
        blocker_id: blockerId,
        blocked_id: userId,
      },
    ]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET blocked users
router.get("/:userId/blocked", verifyAuth, async (req, res) => {
  const { userId } = req.params;

  // Authorization check
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "You can only view your own blocked list" });
  }

  try {
    const { data, error } = await supabase
      .from("blocked_users")
      .select("blocked_id, profiles!blocked_id(name, profile_image_url)")
      .eq("blocker_id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UNBLOCK user
router.delete("/:userId/blocked/:blockedId", verifyAuth, async (req, res) => {
  const { userId, blockedId } = req.params;

  // Authorization check
  if (req.user.id !== userId) {
    return res
      .status(403)
      .json({ error: "You can only unblock from your own list" });
  }

  try {
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
