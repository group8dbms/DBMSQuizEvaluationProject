const { supabase } = require("../db/supabase");

async function listResults() {
  return supabase
    .from("results")
    .select("*, submissions(*, users!submissions_student_id_fkey(email), exams(id, title)), users!results_evaluator_id_fkey(email)")
    .order("updated_at", { ascending: false });
}

async function listResultsForStudent(studentId) {
  return supabase
    .from("results")
    .select("*, submissions!inner(*, exams(id, title), users!submissions_student_id_fkey(email)), users!results_evaluator_id_fkey(email)")
    .eq("submissions.student_id", studentId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
}

async function getResultById(id) {
  return supabase
    .from("results")
    .select("*, submissions(*, exams(id, title), users!submissions_student_id_fkey(email)), users!results_evaluator_id_fkey(email)")
    .eq("id", id)
    .single();
}

async function getResultBySubmissionId(submissionId) {
  return supabase
    .from("results")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
}

async function createResult(payload) {
  return supabase.from("results").insert(payload).select().single();
}

async function updateResult(id, payload) {
  return supabase
    .from("results")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}

async function listRecheckRequests() {
  return supabase
    .from("recheck_requests")
    .select("*, results(*, submissions(*, exams(id, title))), users!recheck_requests_student_id_fkey(email)")
    .order("created_at", { ascending: false });
}

async function createRecheckRequest(payload) {
  return supabase.from("recheck_requests").insert(payload).select().single();
}

async function updateRecheckRequest(id, payload) {
  return supabase.from("recheck_requests").update(payload).eq("id", id).select().single();
}

module.exports = {
  listResults,
  listResultsForStudent,
  getResultById,
  getResultBySubmissionId,
  createResult,
  updateResult,
  listRecheckRequests,
  createRecheckRequest,
  updateRecheckRequest
};
