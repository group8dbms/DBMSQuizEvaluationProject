function attachUser(req, _res, next) {
  const role = req.header("x-user-role") || "student";
  const userIdHeader = req.header("x-user-id");
  const userId = userIdHeader ? Number(userIdHeader) : null;

  req.user = {
    id: Number.isInteger(userId) ? userId : null,
    role
  };

  next();
}

module.exports = { attachUser };
