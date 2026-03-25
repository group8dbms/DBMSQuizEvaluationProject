const { supabase } = require("../db/supabase");

async function createIntegrityLog(payload) {
  return supabase.from("integrity_logs").insert(payload).select().single();
}

async function listIntegrityLogsBySubmission(submissionId) {
  return supabase
    .from("integrity_logs")
    .select("*")
    .eq("submission_id", submissionId)
    .order("timestamp", { ascending: false });
}

module.exports = { createIntegrityLog, listIntegrityLogsBySubmission };
