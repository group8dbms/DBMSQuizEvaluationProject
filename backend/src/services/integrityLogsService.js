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

async function listRecentIntegrityFlags() {
  return supabase
    .from("integrity_logs")
    .select("*, submissions!inner(id, status, final_hash, student_id, exam_id, users!submissions_student_id_fkey(email), exams(id, title))")
    .order("timestamp", { ascending: false })
    .limit(50);
}

module.exports = { createIntegrityLog, listIntegrityLogsBySubmission, listRecentIntegrityFlags };
