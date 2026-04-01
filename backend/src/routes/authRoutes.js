const express = require("express");
const { postSignUp, postLogin, postStudentAccess, getCurrentUser } = require("../controllers/authController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/signup", postSignUp);
router.post("/login", postLogin);
router.post("/access", postStudentAccess);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
