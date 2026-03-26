const express = require("express");
const { postSignUp, postLogin, getCurrentUser } = require("../controllers/authController");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.post("/signup", postSignUp);
router.post("/login", postLogin);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
