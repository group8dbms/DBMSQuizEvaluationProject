function handleServerError(res, error, fallbackMessage) {
  return res.status(500).json({
    error: "InternalServerError",
    message: fallbackMessage,
    details: error.message
  });
}

function badRequest(res, message) {
  return res.status(400).json({
    error: "BadRequest",
    message
  });
}

function unauthorized(res, message) {
  return res.status(401).json({
    error: "Unauthorized",
    message
  });
}

function forbidden(res, message) {
  return res.status(403).json({
    error: "Forbidden",
    message
  });
}

function notFound(res, message) {
  return res.status(404).json({
    error: "NotFound",
    message
  });
}

module.exports = {
  handleServerError,
  badRequest,
  unauthorized,
  forbidden,
  notFound
};
