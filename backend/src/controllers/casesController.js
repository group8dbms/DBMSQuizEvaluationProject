const {
  listCases,
  createCase,
  updateCase,
  findCaseBySubmissionId,
  getCaseById
} = require("../services/casesService");
const { getSubmissionById } = require("../services/submissionsService");
const { listCaseEvidence, createCaseEvidence } = require("../services/caseEvidenceService");
const { recordAuditLog } = require("../services/auditLogsService");
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

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "case_opened",
      entity_type: "case",
      entity_id: data.id,
      metadata: {
        submission_id: Number(submission_id)
      }
    });

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

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "case_updated",
      entity_type: "case",
      entity_id: data.id,
      metadata: {
        status: data.status,
        verdict: data.verdict
      }
    });

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to update case.");
  }
}

async function getCaseEvidenceList(req, res) {
  try {
    const caseResult = await getCaseById(req.params.id);
    if (caseResult.error || !caseResult.data) {
      return notFound(res, "Case not found.");
    }

    const { data, error } = await listCaseEvidence(req.params.id);
    if (error) {
      throw error;
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch case evidence.");
  }
}

async function postCaseEvidence(req, res) {
  try {
    const { source_type, notes, payload = {} } = req.body;
    if (!source_type) {
      return badRequest(res, "source_type is required.");
    }

    const caseResult = await getCaseById(req.params.id);
    if (caseResult.error || !caseResult.data) {
      return notFound(res, "Case not found.");
    }

    const { data, error } = await createCaseEvidence({
      case_id: Number(req.params.id),
      source_type,
      notes,
      payload,
      created_by: req.user.id
    });

    if (error) {
      throw error;
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "case_evidence_added",
      entity_type: "case",
      entity_id: Number(req.params.id),
      metadata: {
        evidence_id: data.id,
        source_type
      }
    });

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to add case evidence.");
  }
}

module.exports = { getCases, postCase, patchCase, getCaseEvidenceList, postCaseEvidence };
