import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Admin/Founder emails from Environment Variables (comma-separated strings)
const getEnvList = (key) => (process.env[key] ? process.env[key].split(',').map(e => e.trim().toLowerCase()) : []);
const SUPER_ADMINS = getEnvList("SUPER_ADMINS");
const MODERATORS = getEnvList("MODERATORS");

// Validate institutional email
const validateInstitutionalEmail = (email) => {
  const allowedDomains = ["@gitam.in", "@student.gitam.edu", "_vsp@gitam.in"];
  const isInstitutional = allowedDomains.some(domain => email.toLowerCase().endsWith(domain));
  const isSuperAdmin = SUPER_ADMINS.includes(email.toLowerCase());
  const isModerator = MODERATORS.includes(email.toLowerCase());
  return isInstitutional || isSuperAdmin || isModerator;
};

const isClubEmail = (email) => email.toLowerCase().endsWith("_vsp@gitam.in");

/**
 * INITIALIZE PROFILE
 * This endpoint is called by the frontend AFTER Supabase OTP verification is successful.
 * It ensures a profile exists in the public.profiles table with the correct initial role.
 */
router.post("/initialize-profile", async (req, res) => {
  const { user_id, email, name, username, interests, aiProfile, phone, club_details } = req.body;

  if (!user_id || !email || !username) {
    return res.status(400).json({ error: "Missing required profile data" });
  }

  try {
    // Determine initial role
    let initialRole = "user";
    let isApproved = true;
    let isVerified = true;

    if (SUPER_ADMINS.includes(email.toLowerCase())) {
      initialRole = "founder";
      isApproved = true;
      isVerified = true;
    } else if (MODERATORS.includes(email.toLowerCase())) {
      initialRole = "moderator";
      isApproved = true;
      isVerified = true;
    } else if (isClubEmail(email)) {
      initialRole = "club";
      isApproved = false; // Clubs MUST be manually approved
      isVerified = false; // Stay unverified until approved/manual check
    }

    const profilePayload = {
      user_id,
      name,
      username: username.toLowerCase().trim(),
      role: initialRole,
      is_verified: isVerified,
      is_approved: isApproved,
      ai_profile: aiProfile || null,
      phone: phone || null,
      club_metadata: club_details || null,
      points: initialRole === "founder" ? 9999 : 0,
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "user_id" })
      .select()
      .single();

    if (profileError) {
      console.error("Profile Error:", profileError);
      return res.status(500).json({ error: "Failed to initialize profile" });
    }

    // Handle interests
    if (interests && Array.isArray(interests) && interests.length > 0) {
      // Find existing interests
      const { data: existingInterests } = await supabase
        .from('interests')
        .select('*')
        .in('interest', interests);

      const existingMap = new Map();
      if (existingInterests) {
        existingInterests.forEach(i => existingMap.set(i.interest, i.interest_id));
      }

      // Identify missing interests
      const missing = interests.filter(i => !existingMap.has(i)).map(i => ({ interest: i }));
      let finalInterests = [...(existingInterests || [])];

      if (missing.length > 0) {
        const { data: newInterests } = await supabase
          .from('interests')
          .insert(missing)
          .select();

        if (newInterests) {
          finalInterests = [...finalInterests, ...newInterests];
        }
      }

      // Insert into user_interests
      const userInterests = finalInterests.map(i => ({
        user_id: user_id,
        interest_id: i.interest_id
      }));

      if (userInterests.length > 0) {
        await supabase.from('user_interests').insert(userInterests);
      }
    }

    res.status(200).json({
      message: "Profile initialized successfully",
      profile
    });
  } catch (error) {
    console.error("Initialization error:", error);
    res.status(500).json({ error: error.message });
  }
});

// CHECK USERNAME AVAILABILITY
router.get("/check-username/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();

    res.json({ available: !data });
  } catch (error) {
    res.json({ available: true }); // Assume available if error (e.g. not found)
  }
});

// GET CURRENT USER / PROFILE
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) return res.status(401).json({ error: "Invalid session" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

