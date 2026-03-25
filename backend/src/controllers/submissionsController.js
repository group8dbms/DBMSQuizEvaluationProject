const {
  startSubmission,
  saveSubmissionAnswers,
  submitSubmission,
  getSubmissionById
} = require("../services/submissionsService");
const { handleServerError } = require("../utils/http");

async function postSubmissionStart(req, res) {
  try {
    const { exam_id, answer_data = [] } = req.body;
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
