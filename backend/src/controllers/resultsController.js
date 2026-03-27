const {
  listResults,
  listResultsForStudent,
  getResultById,
  getResultBySubmissionId,
  createResult,
  updateResult,
  listRecheckRequests,
  createRecheckRequest,
  updateRecheckRequest
} = require("../services/resultsService");
const { getSubmissionById, updateSubmissionStatus } = require("../services/submissionsService");
const { recordAuditLog } = require("../services/auditLogsService");
const { handleServerError, badRequest, forbidden, notFound } = require("../utils/http");

async function getResults(req, res) {
  try {
    const result = req.user.role === "student"
      ? await listResultsForStudent(req.user.id)
      : await listResults();

    if (result.error) {
      throw result.error;
    }

    return res.json(result.data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch results.");
  }
}

async function postEvaluateSubmission(req, res) {
  try {
    const { total_score, feedback } = req.body;
    if (typeof total_score !== "number") {
      return badRequest(res, "total_score is required and must be numeric.");
    }

    const submissionResult = await getSubmissionById(req.params.submissionId);
    if (submissionResult.error || !submissionResult.data) {
      return notFound(res, "Submission not found.");
    }

    const existingResult = await getResultBySubmissionId(req.params.submissionId);
    if (existingResult.error) {
      throw existingResult.error;
    }

    const payload = {
      submission_id: Number(req.params.submissionId),
      evaluator_id: req.user.id,
      total_score,
      feedback,
      status: existingResult.data?.status || "draft"
    };

    const mutation = existingResult.data
      ? await updateResult(existingResult.data.id, payload)
      : await createResult(payload);

    if (mutation.error) {
      throw mutation.error;
    }

    await updateSubmissionStatus(req.params.submissionId, "evaluated");
    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "submission_evaluated",
      entity_type: "result",
      entity_id: mutation.data.id,
      metadata: {
        submission_id: Number(req.params.submissionId),
        total_score
      }
    });

    return res.status(existingResult.data ? 200 : 201).json(mutation.data);
  } catch (error) {
    return handleServerError(res, error, "Unable to evaluate submission.");
  }
}

async function patchPublishResult(req, res) {
  try {
    const result = await getResultById(req.params.id);
    if (result.error || !result.data) {
      return notFound(res, "Result not found.");
    }

    const mutation = await updateResult(req.params.id, {
      status: "published",
      published_at: new Date().toISOString()
    });

    if (mutation.error) {
      throw mutation.error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "result_published",
      entity_type: "result",
      entity_id: mutation.data.id,
      metadata: {
        submission_id: mutation.data.submission_id
      }
    });

    return res.json(mutation.data);
  } catch (error) {
    return handleServerError(res, error, "Unable to publish result.");
  }
}

async function postRecheckRequest(req, res) {
  try {
    const { reason } = req.body;
    if (!reason) {
      return badRequest(res, "reason is required.");
    }

    const result = await getResultById(req.params.id);
    if (result.error || !result.data) {
      return notFound(res, "Result not found.");
    }

    if (req.user.role === "student" && result.data.submissions.student_id !== req.user.id) {
      return forbidden(res, "You can only request re-check for your own published result.");
    }

    const mutation = await createRecheckRequest({
      result_id: Number(req.params.id),
      student_id: result.data.submissions.student_id,
      reason
    });

    if (mutation.error) {
      throw mutation.error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "recheck_requested",
      entity_type: "result",
      entity_id: Number(req.params.id),
      metadata: {
        recheck_request_id: mutation.data.id
      }
    });

    return res.status(201).json(mutation.data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create re-check request.");
  }
}

async function getRecheckRequests(_req, res) {
  try {
    const result = await listRecheckRequests();
    if (result.error) {
      throw result.error;
    }

    return res.json(result.data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch re-check requests.");
  }
}

async function patchRecheckRequest(req, res) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return badRequest(res, "At least one field is required.");
    }

    const payload = { ...req.body };
    if (payload.status === "closed" && !payload.resolved_at) {
      payload.resolved_at = new Date().toISOString();
    }

    const mutation = await updateRecheckRequest(req.params.id, payload);
    if (mutation.error) {
      throw mutation.error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "recheck_updated",
      entity_type: "recheck_request",
      entity_id: mutation.data.id,
      metadata: {
        status: mutation.data.status
      }
    });

    return res.json(mutation.data);
  } catch (error) {
    return handleServerError(res, error, "Unable to update re-check request.");
  }
}

module.exports = {
  getResults,
  postEvaluateSubmission,
  patchPublishResult,
  postRecheckRequest,
  getRecheckRequests,
  patchRecheckRequest
};
