const express = require("express");
const { getExams, getExam, postExam, postQuestion } = require("../controllers/examsController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", getExams);
router.get("/:id", getExam);
router.post("/", requireRole("admin", "faculty"), postExam);
router.post("/:id/questions", requireRole("admin", "faculty"), postQuestion);

module.exports = router;
