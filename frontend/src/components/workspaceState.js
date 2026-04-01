export const initialAuthForm = { email: "", password: "" };
export const initialSignupForm = { email: "", password: "", role: "student" };
export const initialExamForm = { title: "", start_time: "", end_time: "", duration_minutes: 60, tab_switch_limit: 3 };
export const initialQuestionForm = {
  examId: "",
  text: "",
  type: "short_answer",
  correct_answer: "",
  marks: 2,
  options: [
    { option_text: "", is_correct: true },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false }
  ]
};
export const initialAllocationForm = { emailsText: "", selectedStudentIds: [] };
export const initialEvaluationForm = { total_score: "", feedback: "" };
export const initialCaseForm = { status: "in_review", verdict: "" };
export const initialEvidenceForm = { source_type: "manual_note", notes: "" };
export const initialRecheckForm = { reason: "" };
export const initialStaffForm = { email: "", password: "", role: "proctor" };

export const rolePanels = {
  admin: ["mission", "builder", "allocation", "users", "results", "compliance"],
  faculty: ["mission", "builder"],
  student: ["mission", "exam-desk", "results"],
  proctor: ["mission", "monitoring", "investigation"],
  evaluator: ["mission", "evaluation", "results"],
  auditor: ["mission", "audit", "investigation"]
};

export const roleTitles = {
  admin: "Admin Control Room",
  faculty: "Faculty Builder",
  student: "Student Exam Desk",
  proctor: "Proctor Monitoring Deck",
  evaluator: "Evaluator Review Bench",
  auditor: "Auditor Trace Console"
};

const storageKey = "dbmsquiz-session";

export function loadStoredSession() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(storageKey);
}

export function getRoleMessage(role) {
  if (role === "admin") return "Create exam policy, allocate candidates, publish results, and keep integrity reporting visible.";
  if (role === "student") return "Only assigned exams appear here, with autosave, suspicious-event simulation, and result tracking.";
  if (role === "proctor") return "Watch flagged behavior, open evidence trails, and close cases with a reasoned verdict.";
  if (role === "evaluator") return "Review submissions, assign marks, and resolve re-check requests.";
  if (role === "auditor") return "Inspect audit history, decision trails, and integrity evidence without changing candidate data.";
  return "Build exam windows, question banks, and controlled assessment rules.";
}

export function panelLabel(panel) {
  return {
    mission: "Mission",
    builder: "Builder",
    allocation: "Allocation",
    users: "Users",
    "exam-desk": "Exam Desk",
    monitoring: "Monitoring",
    investigation: "Investigation",
    evaluation: "Evaluation",
    results: "Results",
    audit: "Audit",
    compliance: "Compliance"
  }[panel] || panel;
}

export function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

export function getExamWindowStatus(exam) {
  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  if (now < start) return "upcoming";
  if (now > end) return "closed";
  return "active";
}

export function parseEmails(rawText) {
  return Array.from(
    new Set(
      rawText
        .split(/[\n,;]+/)
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export const suspiciousEventButtons = [
  { type: "tab_switch", label: "Trigger Tab Switch", details: { count: 3, note: "Simulated tab switch event from frontend." } },
  { type: "copy_paste", label: "Trigger Copy Attempt", details: { note: "Simulated copy attempt from frontend." } },
  { type: "ip_change", label: "Trigger IP Change", details: { old_ip: "10.0.0.5", new_ip: "10.0.0.9" } }
];

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateAccessForm({ email, password }) {
  if (!isValidEmail(email)) return "Enter a valid email address.";
  if (!password || password.length < 8) return "Password must be at least 8 characters long.";
  return "";
}

export function validateExamForm(form) {
  if (!form.title?.trim()) return "Exam title is required.";
  if (!form.start_time || !form.end_time) return "Start time and end time are required.";
  if (new Date(form.end_time) <= new Date(form.start_time)) return "End time must be after start time.";
  if (Number(form.duration_minutes) <= 0) return "Duration must be greater than zero.";
  if (Number(form.tab_switch_limit) < 0) return "Tab switch limit cannot be negative.";
  return "";
}

export function validateQuestionForm(form) {
  if (!form.examId) return "Choose an exam first.";
  if (!form.text?.trim()) return "Question text is required.";
  if (Number(form.marks) <= 0) return "Marks must be greater than zero.";
  return "";
}

export function validateStaffForm(form) {
  if (!isValidEmail(form.email)) return "Enter a valid staff email address.";
  if (!form.password || form.password.length < 8) return "Staff password must be at least 8 characters long.";
  if (!form.role) return "Choose a role.";
  return "";
}
