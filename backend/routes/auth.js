import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Validate institutional email
const validateInstitutionalEmail = (email) => {
  return email.endsWith("@gitam.in");
};

// SIGNUP route with email validation and profile creation
router.post("/signup", async (req, res) => {
  const { name, email, password, phone, department, yearOfStudy } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Missing required fields: name, email, password",
    });
  }

  // Validate institutional email
  if (!validateInstitutionalEmail(email)) {
    return res.status(400).json({
      error: "Only @gitam.in email addresses are allowed",
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters long",
    });
  }

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        user_id: authData.user.id,
        name: name,
        department: department || null,
        year_of_study: yearOfStudy || null,
        is_verified: false, // Awaiting email verification
        is_approved: false, // Awaiting admin approval
      },
    ]);

    if (profileError) {
      return res.status(500).json({
        error: "Failed to create profile: " + profileError.message,
      });
    }

    res.status(201).json({
      message:
        "Signup successful! Please check your email for verification link.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
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

// EMAIL VERIFICATION - Send OTP (via confirmation email)
router.post("/send-verification-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Supabase sends verification email automatically on signup
    // This endpoint can resend if needed
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json({
      message: "Verification email sent! Check your inbox.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VERIFY EMAIL - Called after user clicks email link
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    // This would typically be called via email link with token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "email",
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Mark user as verified
    await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("user_id", data.user.id);

    res.status(200).json({
      message: "Email verified successfully!",
      user: data.user,
    });
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
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single();

    res.status(200).json({
      user: data.user,
      profile: profile,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
