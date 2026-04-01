const { signUpWithEmail, signInWithEmail, studentAccess } = require("../services/authService");
const { handleServerError, badRequest, forbidden } = require("../utils/http");
const { isStrongPassword, isValidEmail } = require("../utils/validation");

async function postSignUp(req, res) {
  try {
    const { email, password, role = "student" } = req.body;
    if (!email || !password) {
      return badRequest(res, "email and password are required.");
    }
    if (!isValidEmail(email)) {
      return badRequest(res, "Please enter a valid email address.");
    }
    if (!isStrongPassword(password)) {
      return badRequest(res, "Password must be at least 8 characters long.");
    }

    const requestedRole = String(role).toLowerCase();
    if (requestedRole !== "student") {
      return forbidden(res, "Public signup can only create student accounts.");
    }

    const { data, error } = await signUpWithEmail({ email, password, role });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to sign up user.");
  }
}

async function postLogin(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res, "email and password are required.");
    }
    if (!isValidEmail(email)) {
      return badRequest(res, "Please enter a valid email address.");
    }

    const { data, error } = await signInWithEmail({ email, password });

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to log in user.");
  }
}

async function postStudentAccess(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return badRequest(res, "email and password are required.");
    }
    if (!isValidEmail(email)) {
      return badRequest(res, "Please enter a valid email address.");
    }
    if (!isStrongPassword(password)) {
      return badRequest(res, "Password must be at least 8 characters long.");
    }

    const { data, error, mode } = await studentAccess({ email, password });
    if (error) {
      throw error;
    }

    return res.status(mode === "signup" ? 201 : 200).json({
      ...data,
      mode
    });
  } catch (error) {
    return handleServerError(res, error, "Unable to continue with student access.");
  }
}

async function getCurrentUser(req, res) {
  return res.json({
    id: req.user.id,
    authUserId: req.user.authUserId,
    email: req.user.email,
    role: req.user.role
  });
}

module.exports = { postSignUp, postLogin, postStudentAccess, getCurrentUser };
