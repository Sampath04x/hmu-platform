import supabase from "../config/supabase.js";

/**
 * Sends a notification to a specific user.
 * @param {string} userId - ID of the user to notify.
 * @param {string} type - Notification type (e.g., 'club_event', 'club_post').
 * @param {object} metadata - Optional metadata for the notification.
 */
export const sendNotification = async (userId, type, metadata = {}) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          type,
          metadata,
          is_read: false,
        },
      ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`[sendNotification] Error: ${error.message}`);
    return false;
  }
};

/**
 * Notifies all followers of a specific user.
 * @param {string} followingId - ID of the user being followed (e.g., the club).
 * @param {string} type - Notification type.
 * @param {object} metadata - Optional metadata for the notification.
 */
export const notifyFollowers = async (followingId, type, metadata = {}) => {
  try {
    // 1. Fetch all follower IDs
    const { data: followers, error: fetchError } = await supabase
      .from("followers")
      .select("follower_id")
      .eq("following_id", followingId);

    if (fetchError) throw fetchError;
    if (!followers || followers.length === 0) return true;

    // 2. Batch insert notifications
    const notifications = followers.map((f) => ({
      user_id: f.follower_id,
      type,
      metadata,
      is_read: false,
    }));

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error(`[notifyFollowers] Error: ${error.message}`);
    return false;
  }
};
