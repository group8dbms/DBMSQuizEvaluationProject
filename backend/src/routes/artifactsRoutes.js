const express = require("express");
const { getArtifacts, postArtifactUploadUrl } = require("../controllers/artifactsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("admin", "proctor", "evaluator", "auditor"), getArtifacts);
router.post("/upload-url", requireRole("admin", "proctor", "evaluator", "auditor"), postArtifactUploadUrl);

module.exports = router;
