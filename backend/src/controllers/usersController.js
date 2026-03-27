const { listUsers, listUsersByEmails, createUser } = require("../services/usersService");
const { handleServerError, badRequest } = require("../utils/http");

async function getUsers(req, res) {
  try {
    const emailQuery = typeof req.query.emails === "string" ? req.query.emails : "";
    const emails = emailQuery
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const result = emails.length ? await listUsersByEmails(emails) : await listUsers();
    const { data, error } = result;
    if (error) {
      throw error;
    }

    const roleQuery = typeof req.query.role === "string" ? req.query.role.toLowerCase() : "";
    const filtered = roleQuery
      ? (data || []).filter((item) => String(item.role).toLowerCase() === roleQuery)
      : (data || []);

    return res.json(filtered);
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
