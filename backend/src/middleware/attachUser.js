const { authClient } = require("../db/supabase");
const { findUserByAuthUserId } = require("../services/usersService");

async function attachUser(req, _res, next) {
  req.user = {
    id: null,
    authUserId: null,
    email: null,
    role: null,
    isAuthenticated: false
  };

  const authHeader = req.header("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return next();
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return next();
  }

  try {
    const { data, error } = await authClient.auth.getUser(accessToken);
    if (error || !data.user) {
      return next();
    }

    const authUser = data.user;
    const { data: profile, error: profileError } = await findUserByAuthUserId(authUser.id);
    if (profileError) {
      return next(profileError);
    }

    req.user = {
      id: profile?.id || null,
      authUserId: authUser.id,
      email: authUser.email || null,
      role: profile?.role || null,
      isAuthenticated: true
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { attachUser };
