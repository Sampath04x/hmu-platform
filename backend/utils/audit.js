import supabase from "../config/supabase.js";

/**
 * Logs an administrative action to the audit_log table.
 * @param {string} adminId - The user_id of the administrator performing the action.
 * @param {string} action - The action type (e.g., 'APPROVE_USER', 'DELETE_POST').
 * @param {string} targetId - The ID of the user, club, or content being acted upon.
 * @param {object} details - Any additional metadata for the log.
 */
export const logAuditAction = async (adminId, action, targetId, details = {}) => {
  try {
    const { error } = await supabase.from("audit_log").insert({
      admin_id: adminId,
      action: action,
      target_id: targetId,
      details: details,
    });

    if (error) {
      console.error(`[AUDIT LOG ERROR] Failed to log action ${action}:`, error.message);
    }
  } catch (err) {
    console.error(`[AUDIT LOG ERROR] Unexpected error during logging ${action}:`, err.message);
  }
};
