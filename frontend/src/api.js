const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

export async function login(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export async function signup(payload) {
  return request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getCurrentUser(token) {
  return request("/api/auth/me", { token });
}

export async function getExams(token) {
  return request("/api/exams", { token });
}

export async function createExam(token, payload) {
  return request("/api/exams", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function createQuestion(token, examId, payload) {
  return request(`/api/exams/${examId}/questions`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function startSubmission(token, payload) {
  return request("/api/submissions/start", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function saveSubmission(token, submissionId, payload) {
  return request(`/api/submissions/${submissionId}/save`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function submitSubmission(token, submissionId, payload) {
  return request(`/api/submissions/${submissionId}/submit`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function createIntegrityLog(token, payload) {
  return request("/api/integrity-logs", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getCases(token) {
  return request("/api/cases", { token });
}

export { API_BASE_URL };
