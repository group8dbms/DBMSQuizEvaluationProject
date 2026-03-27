const { supabase } = require("../db/supabase");

async function createAuditLog(payload) {
  return supabase.from("audit_logs").insert(payload).select().single();
}

async function recordAuditLog(payload) {
  const result = await createAuditLog(payload);
  if (result.error) {
    console.warn("Audit log insert failed:", result.error.message);
  }
  return result;
}

async function listAuditLogs() {
  return supabase
    .from("audit_logs")
    .select("*, users!audit_logs_actor_id_fkey(email, role)")
    .order("created_at", { ascending: false });
}

module.exports = {
  createAuditLog,
  recordAuditLog,
  listAuditLogs
};
