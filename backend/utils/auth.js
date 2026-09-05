import supabase from "../config/supabase.js";

// Full auth check WITH parallel login detection
// Use this on most routes
export const verifyAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.error("verifyAuth failed! error:", error, "data:", data);
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch profile to check role and session
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_session_id, role")
      .eq("user_id", data.user.id)
      .single();

    // Exempt these roles from parallel login check
    if (profile && ['founder', 'super_admin', 'club'].includes(profile.role)) {
      req.user = data.user;
      return next();
    }

    // Extract session ID from JWT
    let jwtSessionId = null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      jwtSessionId = payload.session_id || payload.sid;
    } catch (e) {
      console.warn("Could not parse JWT payload to extract sid");
    }

    // Block if a different session is active
    if (
      profile &&
      profile.current_session_id &&
      jwtSessionId &&
      profile.current_session_id !== jwtSessionId
    ) {
      return res.status(401).json({ error: "New login detected elsewhere. Please sign in again." });
    }

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Light auth check WITHOUT parallel login detection
// Use this ONLY on /initialize-profile because the profile doesn't exist yet
export const verifyAuthLight = async (req, res, next) => {
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