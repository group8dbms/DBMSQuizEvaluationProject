const { signUpWithEmail, signInWithEmail } = require("../services/authService");
const { handleServerError, badRequest, forbidden } = require("../utils/http");

async function postSignUp(req, res) {
  try {
    const { email, password, role = "student" } = req.body;
    if (!email || !password) {
      return badRequest(res, "email and password are required.");
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

    const { data, error } = await signInWithEmail({ email, password });

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to log in user.");
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

module.exports = { postSignUp, postLogin, getCurrentUser };
