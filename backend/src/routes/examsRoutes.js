const express = require("express");
const { getExams, getExam, postExam, postQuestion } = require("../controllers/examsController");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireAuth, getExams);
router.get("/:id", requireAuth, getExam);
router.post("/", requireRole("admin", "faculty"), postExam);
router.post("/:id/questions", requireRole("admin", "faculty"), postQuestion);

module.exports = router;
