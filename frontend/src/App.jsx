import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, getCurrentUser, getExamAssignments, getExams, getAuditLogs, getCases, getIntegrityFlags, getRecheckRequests, getResults, getSubmissions, getUsers, login, signup } from "./api";
import { GuestAccess } from "./components/GuestAccess";
import { RoleWorkspace } from "./components/RoleWorkspace";
import {
  initialAllocationForm,
  initialAuthForm,
  initialCaseForm,
  initialEvaluationForm,
  initialEvidenceForm,
  initialExamForm,
  initialQuestionForm,
  initialRecheckForm,
  initialSignupForm,
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  rolePanels,
  roleTitles,
  getRoleMessage
} from "./components/workspaceState";

export default function App() {
  const [session, setSession] = useState(() => loadStoredSession());
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Secure exam lifecycle workspace is ready.");
  const [activePanel, setActivePanel] = useState("mission");

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [results, setResults] = useState([]);
  const [recheckRequests, setRecheckRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [integrityFlags, setIntegrityFlags] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [caseEvidence, setCaseEvidence] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const [draftAnswers, setDraftAnswers] = useState({});
  const [submissionsByExam, setSubmissionsByExam] = useState({});
  const [hashChecks, setHashChecks] = useState({});

  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [examForm, setExamForm] = useState(initialExamForm);
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [allocationForm, setAllocationForm] = useState(initialAllocationForm);
  const [evaluationForm, setEvaluationForm] = useState(initialEvaluationForm);
  const [caseForm, setCaseForm] = useState(initialCaseForm);
  const [evidenceForm, setEvidenceForm] = useState(initialEvidenceForm);
  const [recheckForm, setRecheckForm] = useState(initialRecheckForm);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [unmatchedEmails, setUnmatchedEmails] = useState([]);

  const token = session?.access_token || "";
  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.id) === String(selectedExamId)) || exams[0] || null,
    [exams, selectedExamId]
  );
  const selectedSubmission = useMemo(
    () => submissions.find((submission) => String(submission.id) === String(selectedSubmissionId)) || submissions[0] || null,
    [submissions, selectedSubmissionId]
  );
  const selectedCase = useMemo(
    () => cases.find((item) => String(item.id) === String(selectedCaseId)) || cases[0] || null,
    [cases, selectedCaseId]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1" || params.get("type") === "signup") {
      setMessage("Email verification returned to the frontend correctly. Sign in to continue.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setCurrentUser(null);
      setExams([]);
      setStudents([]);
      setAssignments([]);
      setSubmissions([]);
      setResults([]);
      setRecheckRequests([]);
      setCases([]);
      setIntegrityFlags([]);
      setAuditLogs([]);
      setCaseEvidence([]);
      return;
    }

    async function bootstrap() {
      setLoading(true);
      try {
        const user = await getCurrentUser(session.access_token);
        setCurrentUser(user);
        setActivePanel(rolePanels[user.role]?.[0] || "mission");
        await loadWorkspace(user, session.access_token);
        setMessage(`Signed in as ${user.email}. ${getRoleMessage(user.role)}`);
      } catch (error) {
        clearStoredSession();
        setSession(null);
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, [session]);

  async function loadWorkspace(user, accessToken = token) {
    const commonExams = ["admin", "faculty", "student"].includes(user.role) ? await getExams(accessToken) : [];
    setExams(commonExams);
    setSelectedExamId((prev) => prev || commonExams[0]?.id || "");

    if (user.role === "admin" || user.role === "faculty") {
      setStudents(await getUsers(accessToken, [], "student"));
    } else {
      setStudents([]);
    }

    if (["admin", "proctor", "evaluator", "auditor", "student"].includes(user.role)) {
      const submissionRows = await getSubmissions(accessToken);
      setSubmissions(submissionRows);
      setSelectedSubmissionId((prev) => prev || submissionRows[0]?.id || "");
    } else {
      setSubmissions([]);
    }

    if (["admin", "proctor", "auditor"].includes(user.role)) {
      const caseRows = await getCases(accessToken);
      setCases(caseRows);
      setSelectedCaseId((prev) => prev || caseRows[0]?.id || "");
      setIntegrityFlags(await getIntegrityFlags(accessToken));
    } else {
      setCases([]);
      setIntegrityFlags([]);
    }

    if (["admin", "evaluator", "auditor", "student"].includes(user.role)) {
      setResults(await getResults(accessToken));
    } else {
      setResults([]);
    }

    if (["admin", "evaluator", "auditor"].includes(user.role)) {
      setRecheckRequests(await getRecheckRequests(accessToken));
    } else {
      setRecheckRequests([]);
    }

    if (["admin", "auditor"].includes(user.role)) {
      setAuditLogs(await getAuditLogs(accessToken));
    } else {
      setAuditLogs([]);
    }

    if (user.role === "admin" && commonExams[0]?.id) {
      setAssignments(await getExamAssignments(accessToken, commonExams[0].id));
    } else {
      setAssignments([]);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await login(authForm);
      setSession(result.session);
      saveStoredSession(result.session);
      setAuthForm(initialAuthForm);
      setMessage("Login successful. Loading your role workspace.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await signup(signupForm);
      setSignupForm(initialSignupForm);
      setMessage("Student signup created. Use the verification email, then sign in from the student desk.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredSession();
    setSession(null);
    setCurrentUser(null);
    setDraftAnswers({});
    setSubmissionsByExam({});
    setHashChecks({});
    setFilteredStudents([]);
    setUnmatchedEmails([]);
    setAllocationForm(initialAllocationForm);
    setMessage("Session cleared. You are back in guest mode.");
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero">
        <div>
          <p className="eyebrow">Tamper-Aware Exam Platform</p>
          <h1>Secure Exam Operations Workspace</h1>
          <p className="hero-copy">
            Create timed exams, secure answer scripts with hash verification, log suspicious behavior, investigate cheating cases, evaluate answers, publish results, and preserve a full audit trail.
          </p>
        </div>
        <div className="hero-card">
          <p className="hero-card-label">Backend API</p>
          <p className="hero-card-value">{API_BASE_URL}</p>
          <p className="hero-card-label">Current Mode</p>
          <p className="hero-card-value">{loading ? "Working..." : currentUser ? currentUser.role : "guest"}</p>
          <p className="hero-card-label">Hosting</p>
          <p className="hero-card-value">Still pending. Keep this as the next phase after functionality is stable.</p>
        </div>
      </header>

      <main className="layout">
        {!currentUser ? (
          <GuestAccess
            authForm={authForm}
            signupForm={signupForm}
            loading={loading}
            onAuthChange={setAuthForm}
            onSignupChange={setSignupForm}
            onLogin={handleLogin}
            onSignup={handleSignup}
          />
        ) : (
          <RoleWorkspace
            currentUser={currentUser}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            loading={loading}
            message={message}
            setMessage={setMessage}
            onLogout={handleLogout}
            data={{
              exams,
              students,
              assignments,
              submissions,
              results,
              recheckRequests,
              cases,
              integrityFlags,
              auditLogs,
              caseEvidence,
              selectedExam,
              selectedSubmission,
              selectedCase,
              selectedExamId,
              selectedSubmissionId,
              selectedCaseId,
              draftAnswers,
              submissionsByExam,
              hashChecks,
              filteredStudents,
              unmatchedEmails
            }}
            state={{
              examForm,
              questionForm,
              allocationForm,
              evaluationForm,
              caseForm,
              evidenceForm,
              recheckForm
            }}
            setters={{
              setExams,
              setStudents,
              setAssignments,
              setSubmissions,
              setResults,
              setRecheckRequests,
              setCases,
              setIntegrityFlags,
              setAuditLogs,
              setCaseEvidence,
              setSelectedExamId,
              setSelectedSubmissionId,
              setSelectedCaseId,
              setDraftAnswers,
              setSubmissionsByExam,
              setHashChecks,
              setExamForm,
              setQuestionForm,
              setAllocationForm,
              setEvaluationForm,
              setCaseForm,
              setEvidenceForm,
              setRecheckForm,
              setFilteredStudents,
              setUnmatchedEmails
            }}
            token={token}
          />
        )}
      </main>
    </div>
  );
}
