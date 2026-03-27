const express = require("express");
const {
  getCases,
  postCase,
  patchCase,
  getCaseEvidenceList,
  postCaseEvidence
} = require("../controllers/casesController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("admin", "proctor", "auditor"), getCases);
router.post("/", requireRole("admin", "proctor"), postCase);
router.patch("/:id", requireRole("admin", "proctor"), patchCase);
router.get("/:id/evidence", requireRole("admin", "proctor", "auditor"), getCaseEvidenceList);
router.post("/:id/evidence", requireRole("admin", "proctor"), postCaseEvidence);

module.exports = router;
