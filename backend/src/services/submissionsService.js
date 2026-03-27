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

async function listSubmissions() {
  return supabase
    .from("submissions")
    .select("*, users!submissions_student_id_fkey(email, role), exams(id, title, start_time, end_time)")
    .order("id", { ascending: false });
}

async function listSubmissionsByStudent(studentId) {
  return supabase
    .from("submissions")
    .select("*, users!submissions_student_id_fkey(email, role), exams(id, title, start_time, end_time)")
    .eq("student_id", studentId)
    .order("id", { ascending: false });
}

async function updateSubmissionStatus(id, status) {
  return supabase
    .from("submissions")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
}

function verifySubmissionHash(submission) {
  const expectedHash = createFinalHash(submission.answer_data || []);
  return {
    valid: submission.final_hash === expectedHash,
    expectedHash,
    storedHash: submission.final_hash
  };
}

module.exports = {
  startSubmission,
  saveSubmissionAnswers,
  submitSubmission,
  getSubmissionById,
  getSubmissionByStudentAndExam,
  listSubmissions,
  listSubmissionsByStudent,
  updateSubmissionStatus,
  verifySubmissionHash
};
