const {
  listExams,
  listAssignedExamsForStudent,
  getExamById,
  createExam,
  createQuestion,
  createExamAssignment,
  listExamAssignments,
  findExamAssignment
} = require("../services/examsService");
const { handleServerError, badRequest, notFound } = require("../utils/http");

async function getExams(req, res) {
  try {
    const result = req.user.role === "student"
      ? await listAssignedExamsForStudent(req.user.id)
      : await listExams();

    const { data, error } = result;
    if (error) {
      throw error;
    }

    if (req.user.role === "student") {
      return res.json((data || []).map((assignment) => ({
        ...assignment.exams,
        assignment_id: assignment.id,
        assigned_at: assignment.assigned_at
      })));
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch exams.");
  }
}

async function getExam(req, res) {
  try {
    const { data, error } = await getExamById(req.params.id);
    if (error) {
      throw error;
    }

    if (req.user.role === "student") {
      const assignmentResult = await findExamAssignment(req.params.id, req.user.id);
      if (assignmentResult.error) {
        throw assignmentResult.error;
      }

      if (!assignmentResult.data) {
        return notFound(res, "Exam not found.");
      }
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch exam.");
  }
}

async function postExam(req, res) {
  try {
    const { title, start_time, end_time, config_json } = req.body;
    if (!title || !start_time || !end_time) {
      return badRequest(res, "title, start_time, and end_time are required.");
    }

    const { data, error } = await createExam({
      title,
      start_time,
      end_time,
      config_json,
      created_by: req.user.id
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create exam.");
  }
}

async function postQuestion(req, res) {
  try {
    const { text, type, correct_answer, marks } = req.body;
    if (!text || !type) {
      return badRequest(res, "text and type are required.");
    }

    const examResult = await getExamById(req.params.id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    const { data, error } = await createQuestion({
      exam_id: Number(req.params.id),
      text,
      type,
      correct_answer,
      marks
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create question.");
  }
}

async function postExamAssignment(req, res) {
  try {
    const { student_id } = req.body;
    if (!student_id) {
      return badRequest(res, "student_id is required.");
    }

    const examResult = await getExamById(req.params.id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    const { data, error } = await createExamAssignment({
      exam_id: Number(req.params.id),
      student_id: Number(student_id),
      assigned_by: req.user.id
    });

    if (error) {
      if (error.code === "23505") {
        return badRequest(res, "This student is already assigned to the exam.");
      }
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to assign exam to student.");
  }
}

async function getExamAssignments(req, res) {
  try {
    const examResult = await getExamById(req.params.id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    const { data, error } = await listExamAssignments(req.params.id);
    if (error) {
      throw error;
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch exam assignments.");
  }
}

module.exports = {
  getExams,
  getExam,
  postExam,
  postQuestion,
  postExamAssignment,
  getExamAssignments
};
