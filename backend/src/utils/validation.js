function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isStrongPassword(value) {
  return typeof value === "string" && value.length >= 8;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isValidDateRange(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start;
}

function normalizeMcqOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => ({
      option_text: typeof option?.option_text === "string" ? option.option_text.trim() : "",
      is_correct: Boolean(option?.is_correct)
    }))
    .filter((option) => option.option_text);
}

module.exports = {
  isValidEmail,
  isStrongPassword,
  isNonEmptyString,
  isPositiveNumber,
  isValidDateRange,
  normalizeMcqOptions
};
