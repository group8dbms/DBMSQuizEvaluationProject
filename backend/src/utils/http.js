function handleServerError(res, error, fallbackMessage) {
  return res.status(500).json({
    error: "InternalServerError",
    message: fallbackMessage,
    details: error.message
  });
}

module.exports = { handleServerError };
