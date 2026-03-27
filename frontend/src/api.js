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

function buildUserQuery(emails = [], role = "") {
  const params = new URLSearchParams();
  if (emails.length) {
    params.set("emails", emails.join(","));
  }
  if (role) {
    params.set("role", role);
  }

  return params.toString() ? `?${params.toString()}` : "";
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

export async function getUsers(token, emails = [], role = "") {
  return request(`/api/users${buildUserQuery(emails, role)}`, { token });
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

export async function assignExam(token, examId, payload) {
  return request(`/api/exams/${examId}/assignments`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getExamAssignments(token, examId) {
  return request(`/api/exams/${examId}/assignments`, { token });
}

export async function getSubmissions(token) {
  return request("/api/submissions", { token });
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

export async function verifySubmissionHash(token, submissionId) {
  return request(`/api/submissions/${submissionId}/verify-hash`, { token });
}

export async function getSubmissionIntegrityLogs(token, submissionId) {
  return request(`/api/submissions/${submissionId}/integrity-logs`, { token });
}

export async function createIntegrityLog(token, payload) {
  return request("/api/integrity-logs", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getIntegrityFlags(token) {
  return request("/api/integrity-logs/flags", { token });
}

export async function getCases(token) {
  return request("/api/cases", { token });
}

export async function patchCase(token, caseId, payload) {
  return request(`/api/cases/${caseId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getCaseEvidence(token, caseId) {
  return request(`/api/cases/${caseId}/evidence`, { token });
}

export async function addCaseEvidence(token, caseId, payload) {
  return request(`/api/cases/${caseId}/evidence`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getResults(token) {
  return request("/api/results", { token });
}

export async function evaluateSubmission(token, submissionId, payload) {
  return request(`/api/results/submission/${submissionId}/evaluate`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function publishResult(token, resultId) {
  return request(`/api/results/${resultId}/publish`, {
    method: "PATCH",
    token
  });
}

export async function requestRecheck(token, resultId, payload) {
  return request(`/api/results/${resultId}/recheck`, {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getRecheckRequests(token) {
  return request("/api/results/recheck-requests/all", { token });
}

export async function updateRecheckRequest(token, requestId, payload) {
  return request(`/api/results/recheck-requests/${requestId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getAuditLogs(token) {
  return request("/api/audit-logs", { token });
}

export { API_BASE_URL };
