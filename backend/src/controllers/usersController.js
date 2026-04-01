const { listUsers, listUsersByEmails, createUser, createManagedAuthUser, upsertUserProfile } = require("../services/usersService");
const { handleServerError, badRequest } = require("../utils/http");
const { recordAuditLog } = require("../services/auditLogsService");
const { isStrongPassword, isValidEmail } = require("../utils/validation");

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
    const { email, password_hash, role, auth_user_id, password } = req.body;
    if (!email || !role) {
      return badRequest(res, "email and role are required.");
    }
    if (!isValidEmail(email)) {
      return badRequest(res, "Please enter a valid email address.");
    }

    if (password) {
      if (!isStrongPassword(password)) {
        return badRequest(res, "Password must be at least 8 characters long.");
      }

      const authResult = await createManagedAuthUser({ email, password, role });
      if (authResult.error) {
        throw authResult.error;
      }

      const profileResult = await upsertUserProfile({
        email,
        role,
        auth_user_id: authResult.data.user.id
      });

      if (profileResult.error) {
        throw profileResult.error;
      }

      await recordAuditLog({
        actor_id: req.user.id,
        action_type: "staff_account_provisioned",
        entity_type: "user",
        entity_id: profileResult.data.id,
        metadata: { role }
      });

      return res.status(201).json(profileResult.data);
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

    await recordAuditLog({
      actor_id: req.user.id,
      action_type: "user_profile_created",
      entity_type: "user",
      entity_id: data.id,
      metadata: { role }
    });

    return res.status(201).json(data);
  } catch (error) {
    return handleServerError(res, error, "Unable to create user.");
  }
}

module.exports = { getUsers, postUser };
