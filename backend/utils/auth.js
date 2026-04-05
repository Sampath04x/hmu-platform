import supabase from "../config/supabase.js";

export const verifyAuth = async (req, res, next) => {
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

    // CHECK FOR PARALLEL LOGINS (EXEMPT Founders and Clubs for multi-login support)
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_session_id, role")
      .eq("user_id", data.user.id)
      .single();

    if (profile && ['founder', 'super_admin', 'club'].includes(profile.role)) {
       req.user = data.user;
       return next();
    }

    if (profile && profile.current_session_id && profile.current_session_id !== token.slice(-20)) {
       return res.status(401).json({ error: "New login detected elsewhere. Please sign in again." });
    }

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
