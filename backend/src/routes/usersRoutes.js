const express = require("express");
const { getUsers, postUser } = require("../controllers/usersController");
const { requireRole } = require("../middleware/requireRole");

const router = express.Router();

router.get("/", requireRole("admin", "faculty", "proctor"), getUsers);
router.post("/", requireRole("admin"), postUser);

module.exports = router;
