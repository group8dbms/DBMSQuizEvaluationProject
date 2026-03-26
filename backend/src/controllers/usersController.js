const { listUsers, createUser } = require("../services/usersService");
const { handleServerError, badRequest } = require("../utils/http");

async function getUsers(_req, res) {
  try {
    const { data, error } = await listUsers();
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to fetch users.");
  }
}

async function postUser(req, res) {
  try {
    const { email, password_hash, role, auth_user_id } = req.body;
    if (!email || !role) {
      return badRequest(res, "email and role are required.");
    }

    const { data, error } = await createUser({
      email,
      password_hash,
      role,
      auth_user_id
    });

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create user.");
  }
}

module.exports = { getUsers, postUser };
