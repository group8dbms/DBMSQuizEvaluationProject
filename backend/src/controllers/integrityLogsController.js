const {
  createIntegrityLog,
  listIntegrityLogsBySubmission
} = require("../services/integrityLogsService");
const { handleServerError } = require("../utils/http");

async function postIntegrityLog(req, res) {
  try {
    const { submission_id, event_type, event_details } = req.body;
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
