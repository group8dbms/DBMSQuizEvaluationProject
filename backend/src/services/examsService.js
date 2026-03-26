const { supabase } = require("../db/supabase");

async function listExams() {
  return supabase
    .from("exams")
    .select("*, questions(*)")
    .order("id", { ascending: true });
}

async function getExamById(id) {
  return supabase
    .from("exams")
    .select("*, questions(*)")
    .eq("id", id)
    .single();
}

async function createExam(payload) {
  return supabase.from("exams").insert(payload).select().single();
}

async function createQuestion(payload) {
  return supabase.from("questions").insert(payload).select().single();
}

function isExamActive(exam) {
  const now = new Date();
  const startTime = new Date(exam.start_time);
  const endTime = new Date(exam.end_time);

  return now >= startTime && now <= endTime;
}

module.exports = {
  listExams,
  getExamById,
  createExam,
  createQuestion,
  isExamActive
};
