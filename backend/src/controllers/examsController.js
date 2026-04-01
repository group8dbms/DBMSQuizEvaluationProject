const {
  listExams,
  listAssignedExamsForStudent,
  getExamById,
  createExam,
  createQuestion,
  createQuestionOptions,
  createExamAssignment,
  createExamAssignments,
  listExamAssignments,
  findExamAssignment
} = require("../services/examsService");
const { listUsersByEmails } = require("../services/usersService");
const { handleServerError, badRequest, notFound } = require("../utils/http");
const { recordAuditLog } = require("../services/auditLogsService");
const { isNonEmptyString, isPositiveNumber, isValidDateRange, normalizeMcqOptions } = require("../utils/validation");

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
    if (!isNonEmptyString(title)) {
      return badRequest(res, "title cannot be empty.");
    }
    if (!isValidDateRange(start_time, end_time)) {
      return badRequest(res, "Please choose a valid start and end time.");
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

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "exam_created",
      entity_type: "exam",
      entity_id: data.id,
      metadata: {
        title
      }
    });

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create exam.");
  }
}

async function postQuestion(req, res) {
  try {
    const { text, type, correct_answer, marks, options = [] } = req.body;
    if (!text || !type) {
      return badRequest(res, "text and type are required.");
    }
    if (!isNonEmptyString(text)) {
      return badRequest(res, "text cannot be empty.");
    }
    if (marks && !isPositiveNumber(marks)) {
      return badRequest(res, "marks must be a positive number.");
    }

    const examResult = await getExamById(req.params.id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    const normalizedOptions = type === "mcq" ? normalizeMcqOptions(options) : [];
    const derivedCorrectAnswer = type === "mcq"
      ? normalizedOptions.find((item) => item.is_correct)?.option_text || null
      : correct_answer;

    const { data, error } = await createQuestion({
      exam_id: Number(req.params.id),
      text,
      type,
      correct_answer: derivedCorrectAnswer,
      marks
    });

    if (error) {
      throw error;
    }

    if (type === "mcq") {
      if (normalizedOptions.length < 2) {
        return badRequest(res, "MCQ questions need at least two options.");
      }
      if (normalizedOptions.filter((item) => item.is_correct).length !== 1) {
        return badRequest(res, "MCQ questions need exactly one correct option.");
      }

      const optionsResult = await createQuestionOptions(
        normalizedOptions.map((option) => ({
          question_id: data.id,
          option_text: option.option_text,
          is_correct: option.is_correct
        }))
      );

      if (optionsResult.error) {
        throw optionsResult.error;
      }
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "question_created",
      entity_type: "question",
      entity_id: data.id,
      metadata: {
        exam_id: Number(req.params.id),
        type
      }
    });

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create question.");
  }
}

async function postExamAssignment(req, res) {
  try {
    const examResult = await getExamById(req.params.id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    const {
      student_id,
      student_ids,
      emails
    } = req.body;

    let normalizedStudentIds = [];

    if (Array.isArray(student_ids) && student_ids.length) {
      normalizedStudentIds = student_ids.map((value) => Number(value)).filter(Number.isFinite);
    } else if (student_id) {
      normalizedStudentIds = [Number(student_id)].filter(Number.isFinite);
    } else if (Array.isArray(emails) && emails.length) {
      const normalizedEmails = emails
        .map((value) => String(value).trim().toLowerCase())
        .filter(Boolean);

      if (!normalizedEmails.length) {
        return badRequest(res, "emails must contain at least one valid email.");
      }

      const usersResult = await listUsersByEmails(normalizedEmails);
      if (usersResult.error) {
        throw usersResult.error;
      }

      normalizedStudentIds = (usersResult.data || [])
        .filter((user) => user.role === "student")
        .map((user) => user.id);

      const matchedEmails = new Set((usersResult.data || []).map((user) => user.email.toLowerCase()));
      const unmatchedEmails = normalizedEmails.filter((email) => !matchedEmails.has(email));

      if (!normalizedStudentIds.length) {
        return badRequest(res, "No matching student accounts were found for the provided emails.");
      }

      const payloads = [...new Set(normalizedStudentIds)].map((id) => ({
        exam_id: Number(req.params.id),
        student_id: id,
        assigned_by: req.user.id
      }));

      const { data, error } = await createExamAssignments(payloads);

      if (error) {
        if (error.code === "23505") {
          return badRequest(res, "One or more selected students are already assigned to the exam.");
        }
        throw error;
      }

      await recordAuditLog({
        actor_id: req.user.id,
        action_type: "exam_assigned",
        entity_type: "exam",
        entity_id: Number(req.params.id),
        metadata: {
          student_ids: payloads.map((item) => item.student_id)
        }
      });

      return res.status(201).json({
        created: data || [],
        unmatched_emails: unmatchedEmails
      });
    }

    if (!normalizedStudentIds.length) {
      return badRequest(res, "student_id, student_ids, or emails is required.");
    }

    if (normalizedStudentIds.length > 1) {
      const payloads = [...new Set(normalizedStudentIds)].map((id) => ({
        exam_id: Number(req.params.id),
        student_id: id,
        assigned_by: req.user.id
      }));

      const { data, error } = await createExamAssignments(payloads);

    if (error) {
      if (error.code === "23505") {
        return badRequest(res, "One or more selected students are already assigned to the exam.");
      }
      throw error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "exam_assigned",
      entity_type: "exam",
      entity_id: Number(req.params.id),
      metadata: {
        student_ids: payloads.map((item) => item.student_id)
      }
    });

    return res.status(201).json({
      created: data || [],
        unmatched_emails: []
      });
    }

    const { data, error } = await createExamAssignment({
      exam_id: Number(req.params.id),
      student_id: normalizedStudentIds[0],
      assigned_by: req.user.id
    });

    if (error) {
      if (error.code === "23505") {
        return badRequest(res, "This student is already assigned to the exam.");
      }
      throw error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "exam_assigned",
      entity_type: "exam",
      entity_id: Number(req.params.id),
      metadata: {
        student_ids: [normalizedStudentIds[0]]
      }
    });

    return res.status(201).json({
      created: [data],
      unmatched_emails: []
    });
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
