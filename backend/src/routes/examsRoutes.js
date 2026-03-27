const express = require("express");
const {
  getExams,
  getExam,
  postExam,
  postQuestion,
  postExamAssignment,
  getExamAssignments
} = require("../controllers/examsController");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireAuth, getExams);
router.get("/:id", requireAuth, getExam);
router.post("/", requireRole("admin", "faculty"), postExam);
router.post("/:id/questions", requireRole("admin", "faculty"), postQuestion);
router.get("/:id/assignments", requireRole("admin"), getExamAssignments);
router.post("/:id/assignments", requireRole("admin"), postExamAssignment);

module.exports = router;
