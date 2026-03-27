const {
  createIntegrityLog,
  listIntegrityLogsBySubmission,
  listRecentIntegrityFlags
} = require("../services/integrityLogsService");
const { getSubmissionById, updateSubmissionStatus } = require("../services/submissionsService");
const { findCaseBySubmissionId, createCase } = require("../services/casesService");
const { createCaseEvidence } = require("../services/caseEvidenceService");
const { recordAuditLog } = require("../services/auditLogsService");
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

    const examConfig = submissionResult.data.exams?.config_json || {};
    const count = Number(event_details?.count || 0);
    const shouldOpenCase = ["ip_change", "copy_paste", "multiple_faces", "suspicious_activity"].includes(event_type)
      || (event_type === "tab_switch" && count >= Number(examConfig.tab_switch_limit || 3));

    if (shouldOpenCase) {
      const existingCase = await findCaseBySubmissionId(submission_id);
      if (existingCase.error) {
        throw existingCase.error;
      }

      let caseId = existingCase.data?.id;
      if (!caseId) {
        const caseResult = await createCase({
          submission_id,
          proctor_id: req.user.role === "student" ? null : req.user.id,
          status: "open",
          verdict: "System opened this case after suspicious activity."
        });

        if (caseResult.error) {
          throw caseResult.error;
        }

        caseId = caseResult.data.id;
      }

      await createCaseEvidence({
        case_id: caseId,
        source_type: "integrity_log",
        notes: `Auto-linked from ${event_type}.`,
        payload: {
          integrity_log_id: data.id,
          event_details
        },
        created_by: req.user.id || null
      });

      await updateSubmissionStatus(submission_id, "under_review");
    }

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "integrity_event_logged",
      entity_type: "submission",
      entity_id: Number(submission_id),
      metadata: {
        event_type
      }
    });

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

async function getIntegrityFlags(_req, res) {
  try {
    const { data, error } = await listRecentIntegrityFlags();
    if (error) {
      throw error;
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch integrity flags.");
  }
}

module.exports = { postIntegrityLog, getIntegrityLogs, getIntegrityFlags };
