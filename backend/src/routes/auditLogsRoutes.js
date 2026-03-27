const express = require("express");
const { getAuditLogs } = require("../controllers/auditLogsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("admin", "auditor"), getAuditLogs);

module.exports = router;
