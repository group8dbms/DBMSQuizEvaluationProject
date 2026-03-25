const express = require("express");
const { postIntegrityLog } = require("../controllers/integrityLogsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.post("/", requireRole("student", "proctor", "admin"), postIntegrityLog);

module.exports = router;
