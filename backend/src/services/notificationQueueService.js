const { supabase } = require("../db/supabase");

async function enqueueNotification(payload) {
  return supabase.from("notification_queue").insert(payload).select().single();
}

async function listPendingNotifications(limit = 20) {
  return supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);
}

async function markNotificationStatus(id, payload) {
  return supabase.from("notification_queue").update(payload).eq("id", id).select().single();
}

module.exports = {
  enqueueNotification,
  listPendingNotifications,
  markNotificationStatus
};
