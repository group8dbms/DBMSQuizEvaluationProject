const {
  startSubmission,
  saveSubmissionAnswers,
  submitSubmission,
  getSubmissionById,
  getSubmissionByStudentAndExam
} = require("../services/submissionsService");
const { getExamById, isExamActive } = require("../services/examsService");
const {
  handleServerError,
  badRequest,
  forbidden,
  notFound
} = require("../utils/http");

async function postSubmissionStart(req, res) {
  try {
    const { exam_id, answer_data = [] } = req.body;
    if (!exam_id) {
      return badRequest(res, "exam_id is required.");
    }

    const examResult = await getExamById(exam_id);
    if (examResult.error || !examResult.data) {
      return notFound(res, "Exam not found.");
    }

    if (!isExamActive(examResult.data)) {
      return forbidden(res, "This exam is not currently active.");
    }

    const existingResult = await getSubmissionByStudentAndExam(req.user.id, exam_id);
    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      return res.json(existingResult.data);
    }

    const { data, error } = await startSubmission({
      exam_id,
      student_id: req.user.id,
      answer_data,
      status: "draft"
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to start submission.");
  }
}

async function postSubmissionSave(req, res) {
  try {
    const { answer_data = [] } = req.body;
    const submissionResult = await getSubmissionById(req.params.id);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    if (submissionResult.data.student_id !== req.user.id) {
      return forbidden(res, "You can only modify your own submission.");
    }

    if (submissionResult.data.status === "submitted" || submissionResult.data.status === "evaluated") {
      return forbidden(res, "Submitted or evaluated submissions cannot be edited.");
    }

    if (!isExamActive(submissionResult.data.exams)) {
      return forbidden(res, "This exam is no longer active.");
    }

    const { data, error } = await saveSubmissionAnswers(req.params.id, answer_data);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to save submission.");
  }
}

async function postSubmissionSubmit(req, res) {
  try {
    const { answer_data = [] } = req.body;
    const submissionResult = await getSubmissionById(req.params.id);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    if (submissionResult.data.student_id !== req.user.id) {
      return forbidden(res, "You can only submit your own submission.");
    }

    if (!isExamActive(submissionResult.data.exams)) {
      return forbidden(res, "This exam is no longer active.");
    }

    const { data, error } = await submitSubmission(req.params.id, answer_data);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to submit answers.");
  }
}

async function getSubmission(req, res) {
  try {
    const { data, error } = await getSubmissionById(req.params.id);
    if (error) {
      throw error;
    }

     if (!data) {
      return notFound(res, "Submission not found.");
    }

    if (req.user.role === "student" && data.student_id !== req.user.id) {
      return forbidden(res, "You can only view your own submission.");
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch submission.");
  }
}

module.exports = {
  postSubmissionStart,
  postSubmissionSave,
  postSubmissionSubmit,
  getSubmission
};
