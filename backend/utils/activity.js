import supabase from "../config/supabase.js";

/**
 * Reset daily limits if last reset was more than 24h ago
 * @param {string} userId 
 */
export async function resetDailyLimitIfNeeded(userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("last_activity_reset_at, daily_activity_count, is_premium")
    .eq("user_id", userId)
    .single();

  if (error || !profile) return;

  const now = new Date();
  const lastReset = new Date(profile.last_activity_reset_at);
  const diffHours = (now - lastReset) / (1000 * 60 * 60);

  if (diffHours >= 24) {
    await supabase
      .from("profiles")
      .update({
        daily_activity_count: 0,
        last_activity_reset_at: now.toISOString(),
      })
      .eq("user_id", userId);
  }
}

/**
 * Check if the user has reached their daily limit
 * @param {string} userId 
 */
export async function hasReachedDailyLimit(userId, role = 'user') {
  await resetDailyLimitIfNeeded(userId);

  // Privileged roles don't have a daily limit
  if (['super_admin', 'founder', 'moderator', 'club'].includes(role)) return false;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("daily_activity_count, is_premium, warnings_count, role")
    .eq("user_id", userId)
    .single();

  if (error || !profile) return false;
  if (profile.is_premium) return false; // No limit for premium

  // Re-check role from profile if not passed correctly
  const currentRole = role || profile.role;
  if (['super_admin', 'founder', 'moderator', 'club'].includes(currentRole)) return false;

  // Default limit is 20, but if flagged (warnings > 0), limit is 10
  const limit = profile.warnings_count > 0 ? 10 : 20;

  return profile.daily_activity_count >= limit;
}

/**
 * Increment activity count and potentially points
 * @param {string} userId 
 * @param {number} pointsToAdd 
 */
export async function trackActivity(userId, pointsToAdd = 1) {
  const { error } = await supabase.rpc("increment_user_points", {
    user_id_param: userId,
    points_to_add: pointsToAdd
  });
  
  if (error) {
    console.error("Error in trackActivity RPC:", error.message);
  }
}

/**
 * Decrement points (e.g. on delete)
 * @param {string} userId 
 * @param {number} pointsToRemove 
 */
export async function removeActivityPoints(userId, pointsToRemove = 1) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("points")
      .eq("user_id", userId)
      .single();
  
    if (error || !profile) return;
  
    await supabase
      .from("profiles")
      .update({
        points: Math.max(0, (profile.points || 0) - pointsToRemove),
      })
      .eq("user_id", userId);
}
