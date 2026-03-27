import { useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  assignExam,
  createExam,
  createIntegrityLog,
  createQuestion,
  getCases,
  getCurrentUser,
  getExamAssignments,
  getExams,
  getUsers,
  login,
  saveSubmission,
  signup,
  startSubmission,
  submitSubmission
} from "./api";

const storageKey = "dbmsquiz-session";

const initialAuthForm = { email: "", password: "" };
const initialSignupForm = { email: "", password: "", role: "student" };
const initialExamForm = { title: "", start_time: "", end_time: "", duration_minutes: 60, tab_switch_limit: 3 };
const initialQuestionForm = { examId: "", text: "", type: "short_answer", correct_answer: "", marks: 2 };

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

function clearStoredSession() {
  localStorage.removeItem(storageKey);
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString();
}

function authHeaderHint(role) {
  if (role === "student") return "Assigned exams appear here. You can start only inside the active window.";
  if (role === "admin") return "Admin mode: create exams, assign them to students, and review suspicious activity.";
  if (role === "faculty") return "Faculty mode: create exams and add questions.";
  return "Reviewer mode: inspect cases and integrity events.";
}

function getExamWindowStatus(exam) {
  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);
  if (now < start) return "upcoming";
  if (now > end) return "closed";
  return "active";
}

export default function App() {
  const [session, setSession] = useState(() => loadStoredSession());
  const [currentUser, setCurrentUser] = useState(null);
  const [exams, setExams] = useState([]);
  const [cases, setCases] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [draftAnswers, setDraftAnswers] = useState({});
  const [submissionsByExam, setSubmissionsByExam] = useState({});
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [examForm, setExamForm] = useState(initialExamForm);
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Build, assign, attempt, and review exams from one command center.");
  const [activePanel, setActivePanel] = useState("overview");

  const token = session?.access_token || "";
  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.id) === String(selectedExamId)) || exams[0] || null,
    [exams, selectedExamId]
  );

  const canManageExams = currentUser?.role === "admin" || currentUser?.role === "faculty";
  const canAssignExams = currentUser?.role === "admin";
  const canReviewCases = currentUser?.role === "admin" || currentUser?.role === "proctor";
  const isStudent = currentUser?.role === "student";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "1" || params.get("type") === "signup") {
      setMessage("Your email verification landed on the frontend correctly. You can sign in now.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setCurrentUser(null);
      setExams([]);
      setCases([]);
      setStudents([]);
      setAssignments([]);
      return;
    }

    async function bootstrap() {
      setLoading(true);
      try {
        const user = await getCurrentUser(session.access_token);
        setCurrentUser(user);

        const examList = await getExams(session.access_token);
        setExams(examList);
        setSelectedExamId((prev) => prev || examList[0]?.id || null);

        if (user.role === "admin" || user.role === "proctor") {
          setCases(await getCases(session.access_token));
        } else {
          setCases([]);
        }

        if (user.role === "admin") {
          const allUsers = await getUsers(session.access_token);
          setStudents(allUsers.filter((item) => item.role === "student"));
        } else {
          setStudents([]);
        }

        setMessage(`Signed in as ${user.email}. ${authHeaderHint(user.role)}`);
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

  useEffect(() => {
    if (!token || !canAssignExams || !selectedExamId) {
      setAssignments([]);
      return;
    }

    async function loadAssignments() {
      try {
        const rows = await getExamAssignments(token, selectedExamId);
        setAssignments(rows);
      } catch (error) {
        setAssignments([]);
        setMessage(error.message);
      }
    }

    loadAssignments();
  }, [token, canAssignExams, selectedExamId]);

  async function refreshExams() {
    if (!token) return;
    const examList = await getExams(token);
    setExams(examList);
    setSelectedExamId((prev) => prev || examList[0]?.id || null);
  }

  async function refreshAssignments(examId = selectedExamId) {
    if (!token || !canAssignExams || !examId) return;
    const rows = await getExamAssignments(token, examId);
    setAssignments(rows);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await login(authForm);
      setSession(result.session);
      saveStoredSession(result.session);
      setAuthForm(initialAuthForm);
      setMessage("Login successful. Loading your role-specific dashboard.");
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
      setMessage("Student signup created. The verification email now redirects back to the frontend root page.");
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
    setExams([]);
    setCases([]);
    setStudents([]);
    setAssignments([]);
    setSelectedExamId(null);
    setSelectedStudentId("");
    setDraftAnswers({});
    setSubmissionsByExam({});
    setMessage("Session cleared. You are back in guest mode.");
  }

  async function handleCreateExam(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const exam = await createExam(token, {
        title: examForm.title,
        start_time: new Date(examForm.start_time).toISOString(),
        end_time: new Date(examForm.end_time).toISOString(),
        config_json: {
          duration_minutes: Number(examForm.duration_minutes),
          tab_switch_limit: Number(examForm.tab_switch_limit)
        }
      });
      await refreshExams();
      setSelectedExamId(exam.id);
      setQuestionForm((prev) => ({ ...prev, examId: String(exam.id) }));
      setExamForm(initialExamForm);
      setActivePanel(canAssignExams ? "allocation" : "builder");
      setMessage(`Exam "${exam.title}" created. Now add questions and assignments.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateQuestion(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const examId = questionForm.examId || selectedExam?.id;
      if (!examId) throw new Error("Choose an exam before adding a question.");

      await createQuestion(token, examId, {
        text: questionForm.text,
        type: questionForm.type,
        correct_answer: questionForm.correct_answer,
        marks: Number(questionForm.marks)
      });

      await refreshExams();
      setQuestionForm(initialQuestionForm);
      setMessage("Question added to the exam.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignExam(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (!selectedExamId || !selectedStudentId) {
        throw new Error("Choose both an exam and a student before assigning.");
      }
      await assignExam(token, selectedExamId, { student_id: Number(selectedStudentId) });
      await refreshAssignments(selectedExamId);
      setSelectedStudentId("");
      setMessage("Exam assigned to the selected student.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSubmission(exam) {
    setLoading(true);
    try {
      const firstQuestion = exam.questions?.[0];
      const submission = await startSubmission(token, {
        exam_id: exam.id,
        answer_data: firstQuestion ? [{ question_id: firstQuestion.id, answer: draftAnswers[firstQuestion.id] || "" }] : []
      });
      setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: submission }));
      setMessage(`Submission ${submission.id} opened for ${exam.title}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft(exam) {
    setLoading(true);
    try {
      const submission = submissionsByExam[exam.id] || (await startSubmission(token, { exam_id: exam.id, answer_data: [] }));
      const answer_data = (exam.questions || []).map((question) => ({
        question_id: question.id,
        answer: draftAnswers[question.id] || ""
      }));
      const saved = await saveSubmission(token, submission.id, { answer_data });
      setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: saved }));
      setMessage(`Draft saved for submission ${saved.id}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitExam(exam) {
    setLoading(true);
    try {
      const existing = submissionsByExam[exam.id];
      if (!existing) throw new Error("Start or save a submission before final submit.");

      const answer_data = (exam.questions || []).map((question) => ({
        question_id: question.id,
        answer: draftAnswers[question.id] || ""
      }));

      const submitted = await submitSubmission(token, existing.id, { answer_data });
      await createIntegrityLog(token, {
        submission_id: submitted.id,
        event_type: "tab_switch",
        event_details: { count: 0, note: "Final submission recorded from frontend demo." }
      });

      setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: submitted }));
      setMessage(`Submission ${submitted.id} finalized and integrity log recorded.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="hero">
        <div>
          <p className="eyebrow">Exam Integrity Workspace</p>
          <h1>DBMS Exam Command Center</h1>
          <p className="hero-copy">
            Build exams, assign them to students, and keep the actual attempt workflow inside the permitted time window.
          </p>
        </div>
        <div className="hero-card">
          <p className="hero-card-label">Backend Endpoint</p>
          <p className="hero-card-value">{API_BASE_URL}</p>
          <p className="hero-card-label">Current State</p>
          <p className="hero-card-value">{loading ? "Working..." : currentUser ? currentUser.role : "Guest"}</p>
        </div>
      </header>

      <main className="layout">
        <section className="panel auth-panel">
          <div className="panel-header">
            <h2>Access</h2>
            {currentUser ? <button className="ghost-button" onClick={handleLogout}>Logout</button> : null}
          </div>

          {!currentUser ? (
            <div className="auth-grid">
              <form className="card" onSubmit={handleLogin}>
                <h3>Sign In</h3>
                <label>Email<input type="email" value={authForm.email} onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))} placeholder="group8postmanstudent@gmail.com" /></label>
                <label>Password<input type="password" value={authForm.password} onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))} placeholder="Student@123" /></label>
                <button className="primary-button" type="submit" disabled={loading}>Enter Portal</button>
              </form>

              <form className="card secondary-card" onSubmit={handleSignup}>
                <h3>Create Student Account</h3>
                <label>Email<input type="email" value={signupForm.email} onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))} placeholder="student@college.com" /></label>
                <label>Password<input type="password" value={signupForm.password} onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))} placeholder="Create a strong password" /></label>
                <label>Role<select value={signupForm.role} onChange={(e) => setSignupForm((p) => ({ ...p, role: e.target.value }))}><option value="student">student</option></select></label>
                <button className="outline-button" type="submit" disabled={loading}>Register Student</button>
              </form>
            </div>
          ) : (
            <div className="card profile-card">
              <p className="eyebrow">Signed In</p>
              <h3>{currentUser.email}</h3>
              <p>Role: <strong>{currentUser.role}</strong></p>
              <p>User ID: {currentUser.id}</p>
              <p className="muted">{authHeaderHint(currentUser.role)}</p>
            </div>
          )}

          <div className="status-banner">{message}</div>
        </section>

        <section className="panel dashboard-panel">
          <div className="panel-header">
            <h2>Workspace</h2>
            <div className="tab-row">
              <button className={activePanel === "overview" ? "tab active" : "tab"} onClick={() => setActivePanel("overview")}>Overview</button>
              {canManageExams ? <button className={activePanel === "builder" ? "tab active" : "tab"} onClick={() => setActivePanel("builder")}>Builder</button> : null}
              {canAssignExams ? <button className={activePanel === "allocation" ? "tab active" : "tab"} onClick={() => setActivePanel("allocation")}>Allocation</button> : null}
              {isStudent ? <button className={activePanel === "exam" ? "tab active" : "tab"} onClick={() => setActivePanel("exam")}>Exam Desk</button> : null}
              {canReviewCases ? <button className={activePanel === "review" ? "tab active" : "tab"} onClick={() => setActivePanel("review")}>Review</button> : null}
            </div>
          </div>

          {activePanel === "overview" ? (
            <div className="workspace-grid">
              <div className="card metric-card">
                <p className="eyebrow">{isStudent ? "Assigned Exams" : "Exams Live"}</p>
                <h3>{exams.length}</h3>
                <p className="muted">{isStudent ? "Only exams allocated to this student appear here." : "Admins and faculty can create and manage the full exam catalog."}</p>
              </div>
              <div className="card metric-card warm-card">
                <p className="eyebrow">Cases Visible</p>
                <h3>{cases.length}</h3>
                <p className="muted">Admins and proctors can audit suspicious submissions from one review queue.</p>
              </div>
              <div className="card roster-card">
                <h3>{isStudent ? "Assigned Exam Roster" : "Exam Roster"}</h3>
                <div className="list-stack">
                  {exams.map((exam) => (
                    <button key={exam.id} className={selectedExam?.id === exam.id ? "list-item selected" : "list-item"} onClick={() => setSelectedExamId(exam.id)}>
                      <span>{exam.title}</span>
                      <span>{getExamWindowStatus(exam)}</span>
                    </button>
                  ))}
                  {!exams.length ? <p className="muted">{isStudent ? "No exams have been assigned to this student yet." : "No exams found yet."}</p> : null}
                </div>
              </div>
              <div className="card spotlight-card">
                <p className="eyebrow">Selected Exam</p>
                {selectedExam ? (
                  <>
                    <h3>{selectedExam.title}</h3>
                    <p>{formatDate(selectedExam.start_time)} to {formatDate(selectedExam.end_time)}</p>
                    <p className="muted">Status: {getExamWindowStatus(selectedExam)} • Questions: {selectedExam.questions?.length || 0}</p>
                    <p className="muted">Duration: {selectedExam.config_json?.duration_minutes || "N/A"} minutes, tab switch limit: {selectedExam.config_json?.tab_switch_limit || "N/A"}</p>
                  </>
                ) : <p className="muted">No exam selected yet.</p>}
              </div>
            </div>
          ) : null}

          {activePanel === "builder" && canManageExams ? (
            <div className="workspace-grid">
              <form className="card" onSubmit={handleCreateExam}>
                <h3>Create Exam</h3>
                <label>Title<input value={examForm.title} onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))} /></label>
                <label>Start Time<input type="datetime-local" value={examForm.start_time} onChange={(e) => setExamForm((p) => ({ ...p, start_time: e.target.value }))} /></label>
                <label>End Time<input type="datetime-local" value={examForm.end_time} onChange={(e) => setExamForm((p) => ({ ...p, end_time: e.target.value }))} /></label>
                <label>Duration Minutes<input type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm((p) => ({ ...p, duration_minutes: e.target.value }))} /></label>
                <label>Tab Switch Limit<input type="number" value={examForm.tab_switch_limit} onChange={(e) => setExamForm((p) => ({ ...p, tab_switch_limit: e.target.value }))} /></label>
                <button className="primary-button" type="submit" disabled={loading}>Create Exam</button>
              </form>

              <form className="card secondary-card" onSubmit={handleCreateQuestion}>
                <h3>Add Question</h3>
                <label>Exam<select value={questionForm.examId} onChange={(e) => setQuestionForm((p) => ({ ...p, examId: e.target.value }))}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
                <label>Question Text<textarea value={questionForm.text} onChange={(e) => setQuestionForm((p) => ({ ...p, text: e.target.value }))} rows={4} /></label>
                <label>Type<select value={questionForm.type} onChange={(e) => setQuestionForm((p) => ({ ...p, type: e.target.value }))}><option value="short_answer">short_answer</option><option value="mcq">mcq</option><option value="true_false">true_false</option><option value="long_answer">long_answer</option><option value="coding">coding</option></select></label>
                <label>Correct Answer / Key<input value={questionForm.correct_answer} onChange={(e) => setQuestionForm((p) => ({ ...p, correct_answer: e.target.value }))} /></label>
                <label>Marks<input type="number" value={questionForm.marks} onChange={(e) => setQuestionForm((p) => ({ ...p, marks: e.target.value }))} /></label>
                <button className="outline-button" type="submit" disabled={loading}>Add Question</button>
              </form>
            </div>
          ) : null}

          {activePanel === "allocation" && canAssignExams ? (
            <div className="workspace-grid">
              <form className="card" onSubmit={handleAssignExam}>
                <h3>Assign Exam To Student</h3>
                <label>Exam<select value={selectedExamId || ""} onChange={(e) => setSelectedExamId(e.target.value)}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
                <label>Student<select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.email}</option>)}</select></label>
                <button className="primary-button" type="submit" disabled={loading}>Assign Exam</button>
              </form>

              <div className="card secondary-card">
                <h3>Assigned Students</h3>
                <div className="list-stack">
                  {assignments.map((assignment) => (
                    <div className="list-item" key={assignment.id}>
                      <span>{assignment.users?.email || `Student #${assignment.student_id}`}</span>
                      <span>{formatDate(assignment.assigned_at)}</span>
                    </div>
                  ))}
                  {!assignments.length ? <p className="muted">No students assigned to the selected exam yet.</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {activePanel === "exam" && isStudent ? (
            <div className="exam-stage">
              {selectedExam ? (
                <>
                  <div className="card exam-card">
                    <div className="exam-card-header">
                      <div>
                        <p className="eyebrow">Student Exam Desk</p>
                        <h3>{selectedExam.title}</h3>
                      </div>
                      <div className="pill-row">
                        <span className={`pill pill-${getExamWindowStatus(selectedExam)}`}>{getExamWindowStatus(selectedExam)}</span>
                        <span className="pill">Questions: {selectedExam.questions?.length || 0}</span>
                        <span className="pill">Duration: {selectedExam.config_json?.duration_minutes || "N/A"}m</span>
                      </div>
                    </div>
                    <div className="question-stack">
                      {(selectedExam.questions || []).map((question, index) => (
                        <div className="question-card" key={question.id}>
                          <p className="question-label">Question {index + 1}</p>
                          <h4>{question.text}</h4>
                          <p className="muted">Type: {question.type} • Marks: {question.marks}</p>
                          {question.type === "mcq" || question.type === "true_false" ? (
                            <input value={draftAnswers[question.id] || ""} onChange={(e) => setDraftAnswers((p) => ({ ...p, [question.id]: e.target.value }))} placeholder={question.type === "true_false" ? "Enter True or False" : "Enter selected option"} />
                          ) : (
                            <textarea rows={question.type === "coding" ? 7 : 3} value={draftAnswers[question.id] || ""} onChange={(e) => setDraftAnswers((p) => ({ ...p, [question.id]: e.target.value }))} placeholder={question.type === "coding" ? "Write your code or SQL answer here..." : "Write your answer here..."} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="action-row">
                      <button className="outline-button" onClick={() => handleStartSubmission(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Start</button>
                      <button className="outline-button" onClick={() => handleSaveDraft(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Save Draft</button>
                      <button className="primary-button" onClick={() => handleSubmitExam(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Final Submit</button>
                    </div>
                    {getExamWindowStatus(selectedExam) !== "active" ? (
                      <p className="muted">This exam can only be started during its active time window.</p>
                    ) : null}
                  </div>

                  <div className="card side-card">
                    <h3>Submission Snapshot</h3>
                    {submissionsByExam[selectedExam.id] ? (
                      <>
                        <p>ID: {submissionsByExam[selectedExam.id].id}</p>
                        <p>Status: {submissionsByExam[selectedExam.id].status}</p>
                        <p>Hash: {submissionsByExam[selectedExam.id].final_hash || "Pending final submit"}</p>
                      </>
                    ) : <p className="muted">No submission started yet for this exam.</p>}
                  </div>
                </>
              ) : <p className="muted">No assigned exam selected yet.</p>}
            </div>
          ) : null}

          {activePanel === "review" && canReviewCases ? (
            <div className="card review-card">
              <h3>Case Review Board</h3>
              <div className="list-stack">
                {cases.map((caseItem) => (
                  <div className="case-item" key={caseItem.id}>
                    <div>
                      <p className="eyebrow">Case #{caseItem.id}</p>
                      <h4>{caseItem.status}</h4>
                      <p className="muted">Submission #{caseItem.submission_id} • Proctor: {caseItem.users?.email || "Unassigned"}</p>
                    </div>
                    <p>{caseItem.verdict || "No verdict yet"}</p>
                  </div>
                ))}
                {!cases.length ? <p className="muted">No cases available for this account yet.</p> : null}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
