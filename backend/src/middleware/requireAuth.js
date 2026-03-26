function requireAuth(req, res, next) {
  if (!req.user || !req.user.isAuthenticated) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "A valid Bearer token is required."
    });
  }

  if (!req.user.id) {
    return res.status(403).json({
      error: "ProfileMissing",
      message: "Authenticated user does not have an application profile in the users table."
    });
  }

  return next();
}

module.exports = { requireAuth };
