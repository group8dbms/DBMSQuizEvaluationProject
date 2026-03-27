const { listAuditLogs } = require("../services/auditLogsService");
const { handleServerError } = require("../utils/http");

async function getAuditLogs(_req, res) {
  try {
    const { data, error } = await listAuditLogs();
    if (error) {
      throw error;
    }

    return res.json(data || []);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch audit logs.");
  }
}

module.exports = { getAuditLogs };
