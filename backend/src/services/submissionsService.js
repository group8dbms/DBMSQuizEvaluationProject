const crypto = require("crypto");
const { supabase } = require("../db/supabase");

function createFinalHash(answerData) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(answerData))
    .digest("hex");
}

async function startSubmission(payload) {
  return supabase.from("submissions").insert(payload).select().single();
}

async function saveSubmissionAnswers(id, answerData) {
  return supabase
    .from("submissions")
    .update({ answer_data: answerData })
    .eq("id", id)
    .select()
    .single();
}

async function submitSubmission(id, answerData) {
  const finalHash = createFinalHash(answerData);

  return supabase
    .from("submissions")
    .update({
      answer_data: answerData,
      final_hash: finalHash,
      status: "submitted",
      submitted_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
}

async function getSubmissionById(id) {
  return supabase
    .from("submissions")
    .select("*, users!submissions_student_id_fkey(email), exams(*)")
    .eq("id", id)
    .single();
}

async function getSubmissionByStudentAndExam(studentId, examId) {
  return supabase
    .from("submissions")
    .select("*")
    .eq("student_id", studentId)
    .eq("exam_id", examId)
    .maybeSingle();
}

module.exports = {
  startSubmission,
  saveSubmissionAnswers,
  submitSubmission,
  getSubmissionById,
  getSubmissionByStudentAndExam
};
