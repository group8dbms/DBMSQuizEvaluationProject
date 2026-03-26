const {
  listCases,
  createCase,
  updateCase,
  findCaseBySubmissionId
} = require("../services/casesService");
const { getSubmissionById } = require("../services/submissionsService");
const { handleServerError, badRequest, notFound } = require("../utils/http");

async function getCases(_req, res) {
  try {
    const { data, error } = await listCases();
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch cases.");
  }
}

async function postCase(req, res) {
  try {
    const { submission_id, verdict } = req.body;
    if (!submission_id) {
      return badRequest(res, "submission_id is required.");
    }

    const submissionResult = await getSubmissionById(submission_id);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    const existingCaseResult = await findCaseBySubmissionId(submission_id);
    if (existingCaseResult.error) {
      throw existingCaseResult.error;
    }

    if (existingCaseResult.data) {
      return res.json(existingCaseResult.data);
    }

    const { data, error } = await createCase({
      submission_id,
      verdict,
      proctor_id: req.user.id,
      status: "open"
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create case.");
  }
}

async function patchCase(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return badRequest(res, "At least one field is required to update a case.");
    }

    const updatePayload = {
      ...req.body,
      proctor_id: req.user.id
    };

    if (updatePayload.status === "resolved" && !updatePayload.resolved_at) {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data, error } = await updateCase(req.params.id, updatePayload);
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to update case.");
  }
}

module.exports = { getCases, postCase, patchCase };
