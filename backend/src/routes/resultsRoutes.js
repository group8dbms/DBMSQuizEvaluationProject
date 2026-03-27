const express = require("express");
const {
  getResults,
  postEvaluateSubmission,
  patchPublishResult,
  postRecheckRequest,
  getRecheckRequests,
  patchRecheckRequest
} = require("../controllers/resultsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("student", "admin", "evaluator", "auditor"), getResults);
router.post("/submission/:submissionId/evaluate", requireRole("admin", "evaluator"), postEvaluateSubmission);
router.patch("/:id/publish", requireRole("admin"), patchPublishResult);
router.post("/:id/recheck", requireRole("student"), postRecheckRequest);
router.get("/recheck-requests/all", requireRole("admin", "evaluator", "auditor"), getRecheckRequests);
router.patch("/recheck-requests/:id", requireRole("admin", "evaluator"), patchRecheckRequest);

module.exports = router;
