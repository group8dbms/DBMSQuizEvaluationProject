const express = require("express");
const {
  postSubmissionStart,
  postSubmissionSave,
  postSubmissionSubmit,
  getSubmission
} = require("../controllers/submissionsController");
const { getIntegrityLogs } = require("../controllers/integrityLogsController");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.post("/start", requireRole("student"), postSubmissionStart);
router.post("/:id/save", requireRole("student"), postSubmissionSave);
router.post("/:id/submit", requireRole("student"), postSubmissionSubmit);
router.get("/:id", requireAuth, getSubmission);
router.get("/:submissionId/integrity-logs", requireRole("admin", "faculty", "proctor"), getIntegrityLogs);

module.exports = router;
