const express = require("express");
const { postIntegrityLog, getIntegrityFlags } = require("../controllers/integrityLogsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.post("/", requireRole("student", "proctor", "admin"), postIntegrityLog);
router.get("/flags", requireRole("admin", "proctor", "auditor"), getIntegrityFlags);

module.exports = router;
