const { supabase } = require("../db/supabase");

async function listExams() {
  return supabase
    .from("exams")
    .select("*, questions(*, question_options(*))")
    .order("id", { ascending: true });
}

async function listAssignedExamsForStudent(studentId) {
  return supabase
    .from("exam_assignments")
    .select("id, assigned_at, exams(*, questions(*, question_options(*)))")
    .eq("student_id", studentId)
    .order("assigned_at", { ascending: false });
}

async function getExamById(id) {
  return supabase
    .from("exams")
    .select("*, questions(*, question_options(*))")
    .eq("id", id)
    .single();
}

async function createExam(payload) {
  return supabase.from("exams").insert(payload).select().single();
}

async function createQuestion(payload) {
  return supabase.from("questions").insert(payload).select().single();
}

async function createQuestionOptions(payloads) {
  return supabase.from("question_options").insert(payloads).select();
}

async function createExamAssignment(payload) {
  return supabase.from("exam_assignments").insert(payload).select().single();
}

async function createExamAssignments(payloads) {
  return supabase.from("exam_assignments").insert(payloads).select();
}

async function listExamAssignments(examId) {
  return supabase
    .from("exam_assignments")
    .select("*, users!exam_assignments_student_id_fkey(id, email, role)")
    .eq("exam_id", examId)
    .order("assigned_at", { ascending: false });
}

async function findExamAssignment(examId, studentId) {
  return supabase
    .from("exam_assignments")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .maybeSingle();
}

function isExamActive(exam) {
  const now = new Date();
  const startTime = new Date(exam.start_time);
  const endTime = new Date(exam.end_time);

  return now >= startTime && now <= endTime;
}

module.exports = {
  listExams,
  listAssignedExamsForStudent,
  getExamById,
  createExam,
  createQuestion,
  createQuestionOptions,
  createExamAssignment,
  createExamAssignments,
  listExamAssignments,
  findExamAssignment,
  isExamActive
};
