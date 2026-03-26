const {
  createIntegrityLog,
  listIntegrityLogsBySubmission
} = require("../services/integrityLogsService");
const { getSubmissionById } = require("../services/submissionsService");
const { handleServerError, badRequest, forbidden, notFound } = require("../utils/http");

async function postIntegrityLog(req, res) {
  try {
    const { submission_id, event_type, event_details } = req.body;
    if (!submission_id || !event_type) {
      return badRequest(res, "submission_id and event_type are required.");
    }

    const submissionResult = await getSubmissionById(submission_id);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    if (req.user.role === "student" && submissionResult.data.student_id !== req.user.id) {
      return forbidden(res, "You can only log events for your own submission.");
    }

    const { data, error } = await createIntegrityLog({
      submission_id,
      event_type,
      event_details
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create integrity log.");
  }
}

async function getIntegrityLogs(req, res) {
  try {
    const submissionResult = await getSubmissionById(req.params.submissionId);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    const { data, error } = await listIntegrityLogsBySubmission(req.params.submissionId);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch integrity logs.");
  }
}

module.exports = { postIntegrityLog, getIntegrityLogs };
