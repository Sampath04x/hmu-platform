import express from "express";
import supabase from "../config/supabase.js";
import { sendOTPEmail } from "../utils/email.js";

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const router = express.Router();

// Admin/Founder emails
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

// SIGNUP route with email validation and profile creation
router.post("/signup", async (req, res) => {
  const { name, username, email, password, phone, department, yearOfStudy } = req.body;
  const clubDetails = req.body.club_details; // Extended details for clubs

  // Validate required fields
  if (!name || !username || !email || !password) {
    return res.status(400).json({
      error: "Missing required fields: name, username, email, password",
    });
  }

  // Validate username format (no spaces, special chars except underscore)
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({
      error: "Username must be 3-20 characters long and can only contain letters, numbers, and underscores.",
    });
  }

  // Validate institutional email
  if (!validateInstitutionalEmail(email)) {
    return res.status(400).json({
      error: "Only @gitam.in, @student.gitam.edu or _vsp@gitam.in email addresses are allowed.",
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long",
    });
  }

  try {
    // Generate OTP first
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 0. Check if username is already taken
    const { data: userWithUsername } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.toLowerCase())
      .single();

    if (userWithUsername) {
      return res.status(400).json({ error: "This username is already taken. Please try another one." });
    }

    // 1. Check if auth user exists 
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    let authUser = users.find(u => u.email === email.toLowerCase());

    if (authUser) {
      // If auth exists, check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", authUser.id)
        .single();

      if (existingProfile) {
        return res.status(400).json({ 
          error: "An account with this email already exists. Please sign in or use a different email.",
        });
      }
      // If auth exists but no profile, we'll continue to step 2-3 using this authUser.id
    }

    let authData = { user: authUser };

    if (!authUser) {
      // Create new auth user
      const { data: createData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: false,
      });

      if (authError) {
        return res.status(400).json({ error: authError.message });
      }
      authData = createData;
    }

    // Save OTP to temp_otps
    await supabase.from("temp_otps").insert([{ email, otp, expires_at: expiresAt }]);

    // Send Branded OTP Email
    await sendOTPEmail(email, otp);

    // Small delay to ensure Auth consistency (Supabase race condition fix)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Determine initial role
    let initialRole = "user";
    let isApproved = false;
    let isVerified = false;

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
    }

    // Create user profile
    const profilePayload = {
        user_id: authData.user.id,
        name: name,
        username: username.toLowerCase().trim(),
        department: department || null,
        year_of_study: yearOfStudy || null,
        role: initialRole,
        is_verified: isVerified,
        is_approved: isApproved,
        ai_profile: typeof req.body.aiProfile === 'object' ? req.body.aiProfile : null,
        points: initialRole === "founder" ? 9999 : 0,
        phone: phone || null,
    };

    // If it's a club, save extra details in JSON or dedicated fields
    if (initialRole === "club" && clubDetails) {
        profilePayload.club_metadata = clubDetails;
    }

    const { error: profileError } = await supabase.from("profiles").insert([profilePayload]);

    if (profileError) {
      if (profileError.code === '23505') { // Duplicate key
        return res.status(400).json({
          error: "Your profile is already set up or the username is taken. Please sign in.",
        });
      }
      return res.status(500).json({
        error: "Failed to finalize profile setup. Please reach out to support.",
      });
    }

    // Insert interests
    const interests = req.body.interests;
    if (interests && Array.isArray(interests) && interests.length > 0) {
      // Find existing interests
      const { data: existingInterests, error: interestsError } = await supabase
        .from('interests')
        .select('*')
        .in('interest', interests);

      const existingMap = new Map();
      if (!interestsError && existingInterests) {
        existingInterests.forEach(i => existingMap.set(i.interest, i.interest_id));
      }

      // Identify missing interests
      const missing = interests.filter(i => !existingMap.has(i)).map(i => ({ interest: i }));
      let finalInterests = [...(existingInterests || [])];

      if (missing.length > 0) {
        // Insert missing interests
        const { data: newInterests, error: insertError } = await supabase
          .from('interests')
          .insert(missing)
          .select();
        
        if (!insertError && newInterests) {
          finalInterests = [...finalInterests, ...newInterests];
        }
      }

      // Insert into user_interests
      const userInterests = finalInterests.map(i => ({
        user_id: authData.user.id,
        interest_id: i.interest_id
      }));

      if (userInterests.length > 0) {
        await supabase.from('user_interests').insert(userInterests);
      }
    }

    res.status(201).json({
      message:
        "Signup successful! We've sent a 6-digit verification code to your email. Please enter it to complete activation.",
      user_id: authData.user.id,
      email: authData.user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN route with verification check
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Missing required fields: email, password",
    });
  }

  try {
    // Authenticate user
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    // Check if user is verified
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, is_approved")
      .eq("user_id", authData.user.id)
      .single();

    if (!profile.is_verified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
      });
    }

    if (!profile.is_approved) {
      return res.status(403).json({
        error: "Your account is pending admin approval",
      });
    }

    // Update current session ID to prevent parallel logins
    await supabase
      .from("profiles")
      .update({ current_session_id: authData.session.access_token.slice(-20) }) // Store hash/suffix
      .eq("user_id", authData.user.id);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGOUT route
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VERIFY EMAIL - Called after user enters 6-digit OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // 1. Find valid OTP
    const { data: otpData, error: otpError } = await supabase
      .from("temp_otps")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return res.status(400).json({ error: "Invalid or expired verification code." });
    }

    // 2. Fetch User by Email
    const { data: { users }, error: userFetchError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    
    if (userFetchError || !user) {
        return res.status(404).json({ error: "User not found." });
    }

    // 3. Complete Verification in Auth
    const { error: verifyError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
    });

    if (verifyError) return res.status(500).json({ error: "Auth verification failed" });

    // 4. Update Profile
    await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("user_id", user.id);

    // 5. Cleanup OTP
    await supabase.from("temp_otps").delete().eq("email", email);

    res.status(200).json({
      message: "Identity verified! You can now log in.",
      user_id: user.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RESEND OTP
router.post("/resend-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await supabase.from("temp_otps").insert([{ email, otp, expires_at: expiresAt }]);
        await sendOTPEmail(email, otp);

        res.json({ message: "A new code has been sent to your email." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PASSWORD RESET - Request reset link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE PASSWORD
router.post("/update-password", async (req, res) => {
  const { newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { error } = await supabase.auth.updateUser(
      { password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET CURRENT USER
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    if (profileErr && profileErr.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return res.status(500).json({ error: profileErr.message });
    }

    res.status(200).json({
      user: data.user,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile link (to be used after Google login for onboarding)
router.put("/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "Invalid token" });

    const { username, name, phone, department, year_of_study, bio, interests } = req.body;

    try {
        // Find existing profile
        const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

        let initialRole = "user";
        let isApproved = true;
        let isVerified = true;

        if (SUPER_ADMINS.includes(user.email.toLowerCase())) {
            initialRole = "founder";
        } else if (MODERATORS.includes(user.email.toLowerCase())) {
            initialRole = "moderator";
        } else if (isClubEmail(user.email)) {
            initialRole = "club";
            isApproved = false;
            isVerified = false;
        }

        const profilePayload = {
            user_id: user.id,
            name: name || user.user_metadata?.full_name,
            username: username ? username.toLowerCase() : existingProfile?.username,
            phone: phone || null,
            department: department || null,
            year_of_study: year_of_study || null,
            bio: bio || null,
            role: existingProfile?.role || initialRole,
            is_approved: existingProfile?.hasOwnProperty('is_approved') ? existingProfile.is_approved : isApproved,
            is_verified: true, // If they logged in via Google/Email, we assume verification for now
        };

        const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(profilePayload, { onConflict: "user_id" });

        if (upsertError) {
          if (upsertError.code === '23505') {
            return res.status(400).json({ error: "Username is already taken." });
          }
          return res.status(500).json({ error: upsertError.message });
        }

        // Handle interests if provided
        if (interests && Array.isArray(interests)) {
            // Delete existing user interests
            await supabase.from("user_interests").delete().eq("user_id", user.id);

            // Fetch interest IDs
            const { data: interestDocs } = await supabase.from("interests").select("*").in("interest", interests);
            
            const userInterests = (interestDocs || []).map(i => ({
                user_id: user.id,
                interest_id: i.interest_id
            }));

            if (userInterests.length > 0) {
                await supabase.from("user_interests").insert(userInterests);
            }
        }

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
