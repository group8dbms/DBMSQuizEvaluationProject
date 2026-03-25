const express = require("express");
const { getCases, postCase, patchCase } = require("../controllers/casesController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("admin", "proctor"), getCases);
router.post("/", requireRole("admin", "proctor"), postCase);
router.patch("/:id", requireRole("admin", "proctor"), patchCase);

module.exports = router;
