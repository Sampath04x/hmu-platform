console.log("AUTH ROUTES FILE LOADED");
import express from "express";
import supabase from "../config/supabase.js";
import { verifyAuth, verifyAuthLight } from "../utils/auth.js";
import { sendOTPEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Memory stores for Rate Limiting
const rateLimits = new Map();

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
router.post("/initialize-profile", verifyAuthLight, async (req, res) => {
  const { user_id, email, name, username, interests, aiProfile, phone, club_details } = req.body;

  if (!user_id || !email || !username) {
    return res.status(400).json({ error: "Missing required profile data" });
  }

  if (req.user.id !== user_id) {
    return res.status(403).json({ error: "Forbidden: user_id mismatch" });
  }

  try {
    // Determine initial role
    let initialRole = "user";
    let isApproved = true;
    let isVerified = true;
    let requestData = null;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if they are in the admin_whitelist table
    const { data: adminData } = await supabase
      .from("admin_whitelist")
      .select("designation")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    // Check if an approved club request exists for this email
    const { data: request } = await supabase
      .from("club_requests")
      .select("*")
      .eq("club_email", normalizedEmail)
      .maybeSingle();

    // Check if user is already associated with an existing completed club account/profile
    const { data: existingAdminCheck } = await supabase
      .from("club_admins")
      .select("club_id")
      .eq("user_id", user_id)
      .maybeSingle();

    const { data: existingClubByCreatorCheck } = await supabase
      .from("clubs")
      .select("club_id")
      .eq("created_by", user_id)
      .maybeSingle();

    // Check if profile already exists with role = club
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("role, username")
      .eq("user_id", user_id)
      .maybeSingle();

    if (
      existingAdminCheck?.club_id ||
      existingClubByCreatorCheck?.club_id ||
      (existingProfile && existingProfile.role === "club" && existingProfile.username)
    ) {
      return res.status(400).json({
        error: "You already have a club account.",
        alreadyExists: true
      });
    }

    if (adminData) {
      // Map designation to role, default to super_admin if unknown
      const designation = (adminData.designation || "").toLowerCase();
      if (designation.includes("founder")) {
        initialRole = "founder";
      } else if (designation.includes("moderator")) {
        initialRole = "moderator";
      } else {
        initialRole = "super_admin";
      }
      isApproved = true;
      isVerified = true;
    } else if (SUPER_ADMINS.includes(normalizedEmail)) {
      initialRole = "founder";
      isApproved = true;
      isVerified = true;
    } else if (MODERATORS.includes(normalizedEmail)) {
      initialRole = "moderator";
      isApproved = true;
      isVerified = true;
    } else if (request?.status === "approved" || existingProfile?.role === "club" || isClubEmail(normalizedEmail)) {
      initialRole = "club";
      isApproved = true;
      isVerified = true;
      requestData = request;
    } else if (request && request.status !== "approved") {
      return res.status(403).json({ error: "Forbidden: Club request is not approved." });
    }

    const clubMetadataObj = initialRole === "club" ? {
      category: req.body.category || requestData?.category || "General",
      description: req.body.description || requestData?.description || "",
      president_name: requestData?.president_name || "",
      social_links: req.body.social_links || {
        instagram: req.body.instagram || "",
        linkedin: req.body.linkedin || "",
        website: req.body.website || "",
        other: req.body.other_links || req.body.other || ""
      },
      ...(club_details || {})
    } : (club_details || null);

    const profilePayload = {
      user_id,
      name: name || requestData?.club_name,
      username: username.toLowerCase().trim(),
      role: initialRole,
      is_verified: isVerified,
      is_approved: isApproved,
      ai_profile: aiProfile || null,
      phone: phone || requestData?.phone_number || null,
      bio: req.body.description || requestData?.description || null,
      profile_image_url: req.body.logo_url || req.body.profile_image_url || null,
      club_metadata: clubMetadataObj,
      points: initialRole === "founder" ? 9999 : 0,
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "user_id" })
      .select()
      .single();

    if (profileError) {
      console.error("[initialize-profile] Operation: profiles.upsert | Table: profiles | Code:", profileError.code, "| Message:", profileError.message);
      if (profileError.code === '23505' && profileError.message.includes('username')) {
        return res.status(409).json({ error: "Username is already taken. Please choose another." });
      }
      return res.status(500).json({ error: `Failed to initialize profile: ${profileError.message}` });
    }

    // Handlers for Club Entity & Club Admin Relationship
    let clubRecord = null;
    if (initialRole === "club") {
      try {
        const clubName = name || requestData?.club_name || "Club";
        const clubDesc = req.body.description || requestData?.description || "";
        const clubLogo = req.body.logo_url || req.body.profile_image_url || null;

        // 1. Check if user is already linked in public.club_admins
        const { data: existingAdmin } = await supabase
          .from("club_admins")
          .select("club_id")
          .eq("user_id", user_id)
          .maybeSingle();

        // 2. Check if a club already exists with created_by = user_id
        const { data: existingClubByCreator } = await supabase
          .from("clubs")
          .select("*")
          .eq("created_by", user_id)
          .maybeSingle();

        const targetClubId = existingAdmin?.club_id || existingClubByCreator?.club_id;

        if (targetClubId) {
          // Update existing public.clubs entry with valid columns
          const { data: updatedClub, error: updateErr } = await supabase
            .from("clubs")
            .update({
              club_name: clubName,
              description: clubDesc,
              logo_url: clubLogo,
            })
            .eq("club_id", targetClubId)
            .select()
            .maybeSingle();

          if (updateErr) {
            console.error("[initialize-profile] Operation: clubs.update | Table: clubs | Code:", updateErr.code, "| Message:", updateErr.message);
          }
          clubRecord = updatedClub || existingClubByCreator;

          // Ensure link in club_admins exists
          if (!existingAdmin) {
            await supabase.from("club_admins").insert({
              club_id: targetClubId,
              user_id: user_id,
              permission_level: "owner",
            });
          }
        } else {
          // Create new public.clubs entry with valid columns
          const clubInsertPayload = {
            club_name: clubName,
            description: clubDesc,
            logo_url: clubLogo,
            created_by: user_id,
          };

          const { data: newClub, error: createClubErr } = await supabase
            .from("clubs")
            .insert(clubInsertPayload)
            .select()
            .single();

          if (createClubErr) {
            console.error("[initialize-profile] Operation: clubs.insert | Table: clubs | Code:", createClubErr.code, "| Message:", createClubErr.message);
          } else if (newClub) {
            clubRecord = newClub;
            // Link user as owner in public.club_admins
            const { error: adminLinkErr } = await supabase.from("club_admins").insert({
              club_id: newClub.club_id,
              user_id: user_id,
              permission_level: "owner",
            });
            if (adminLinkErr) {
              console.error("[initialize-profile] Operation: club_admins.insert | Table: club_admins | Code:", adminLinkErr.code, "| Message:", adminLinkErr.message);
            }
          }
        }
      } catch (clubErr) {
        console.error("Error creating/linking club entity:", clubErr);
      }
    }

    // Handle interests
    if (interests && Array.isArray(interests) && interests.length > 0) {
      const { data: existingInterests } = await supabase
        .from('interests')
        .select('*')
        .in('interest', interests);

      const existingMap = new Map();
      if (existingInterests) {
        existingInterests.forEach(i => existingMap.set(i.interest, i.interest_id));
      }

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
      profile,
      club: clubRecord,
      club_id: clubRecord?.club_id || null
    });
  } catch (error) {
    console.error("Initialization error:", error);
    res.status(500).json({ error: error.message });
  }
});

// CHECK USERNAME AVAILABILITY
router.get("/check-username/:username", async (req, res) => {
  const { username } = req.params;
  const target = username.toLowerCase().trim();
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", target)
      .maybeSingle();

    if (profileData) {
      return res.json({ available: false });
    }

    const { data: clubData } = await supabase
      .from("clubs")
      .select("username")
      .eq("username", target)
      .maybeSingle();

    if (clubData) {
      return res.json({ available: false });
    }

    res.json({ available: true });
  } catch (error) {
    res.json({ available: true }); // Fallback assume available if error
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
      .maybeSingle();

    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SUBMIT CLUB REQUEST
router.post("/club-request", async (req, res) => {
  const { club_name, club_email, president_name, category, description } = req.body;

  if (!club_name || !club_email || !president_name) {
    return res.status(400).json({ error: "Club name, email, and president name are required" });
  }

  try {
    const { data, error } = await supabase
      .from("club_requests")
      .insert({
        club_name,
        club_email: club_email.toLowerCase().trim(),
        president_name,
        category,
        description,
        status: "pending"
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "A request for this email already exists." });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      message: "Club request submitted successfully. Our team will review it soon.",
      request: data[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SEND OTP FOR CLUB STATUS CHECK
router.post("/club-status/send-otp", async (req, res) => {
  console.log("ROUTE HIT");
  console.log(req.body);
  console.log("--- CLUB OTP FLOW STARTED ---");
  console.log("Request received for /club-status/send-otp");

  const { email } = req.body;
  if (!email) {
    console.log("Validation Failed: Email is missing in request body");
    return res.status(400).json({ error: "Email is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log("Target Club Email:", normalizedEmail);

  // Simple Rate Limiting (max 3 per 5 mins)
  const now = Date.now();
  const rl = rateLimits.get(normalizedEmail) || { count: 0, resetAt: now + 5 * 60 * 1000 };
  if (now > rl.resetAt) {
    rl.count = 0;
    rl.resetAt = now + 5 * 60 * 1000;
  }
  if (rl.count >= 3) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  rl.count += 1;
  rateLimits.set(normalizedEmail, rl);

  try {
    // DO NOT expose if the email actually exists
    // The prompt: "For both existing and non-existing emails, use a generic response... Do not expose club existence/status until email ownership has been successfully verified."
    const { data: request, error } = await supabase
      .from("club_requests")
      .select("id")
      .eq("club_email", normalizedEmail)
      .maybeSingle();

    if (request) {
      console.log(`[Club Status] Calling Supabase signInWithOtp for: ${normalizedEmail}`);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail
      });

      if (otpError) {
        console.error("[Club Status] Supabase OTP send error:", {
          message: otpError.message,
          status: otpError.status,
          code: otpError.code
        });
        return res.status(500).json({ error: "Failed to send OTP. Please try again." });
      }

      console.log("[Club Status] Supabase OTP request succeeded");
    } else {
      console.log("[Club Status] No club request found in DB. Not calling Supabase Auth.");
    }

    console.log("--- CLUB OTP FLOW FINISHED ---");

    // Always return the same generic message to preserve privacy
    res.status(200).json({ message: "If a club request exists for this email, a verification code has been sent." });
  } catch (err) {
    console.error("Failed to send club status OTP:", err);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

// VERIFY OTP AND GET CLUB STATUS
router.post("/club-status/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP are required." });

  const normalizedEmail = email.toLowerCase().trim();

  try {
    console.log(`[Club Status] OTP verification requested for: ${normalizedEmail}`);
    // 1. Verify OTP using Supabase Auth
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp.toString().trim(),
      type: 'email'
    });

    if (verifyError) {
      console.error("[Club Status] Supabase OTP verification failed:", {
        message: verifyError.message,
        status: verifyError.status,
        code: verifyError.code
      });
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    console.log("[Club Status] Supabase OTP verification succeeded");

    console.log("[Club Status] Fetching club request status for verified email");
    const { data: request, error } = await supabase
      .from("club_requests")
      .select("*")
      .eq("club_email", normalizedEmail)
      .maybeSingle();

    if (error || !request) {
      return res.status(404).json({ error: "Club request not found." });
    }

    console.log(`[Club Status] Request status: ${request.status}`);

    let setupToken = null;
    if (request.status === "approved") {
      const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";
      setupToken = jwt.sign(
        { email: normalizedEmail, requestId: request.id, purpose: "club-setup" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
    }

    res.status(200).json({
      status: request.status,
      club_name: request.club_name,
      created_at: request.created_at,
      token: setupToken,
      session: verifyData?.session || null
    });
  } catch (err) {
    console.error("Failed to verify club status OTP:", err);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

export default router;

