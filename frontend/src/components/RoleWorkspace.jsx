import { useEffect, useState } from "react";
import {
  addCaseEvidence,
  assignExam,
  createExam,
  createIntegrityLog,
  createQuestion,
  createUser,
  evaluateSubmission,
  getAuditLogs,
  getArtifacts,
  getCaseEvidence,
  getCases,
  getExamAssignments,
  getExams,
  getIntegrityFlags,
  getRecheckRequests,
  getResults,
  getSubmissions,
  getUsers,
  patchCase,
  publishResult,
  requestRecheck,
  saveSubmission,
  startSubmission,
  submitSubmission,
  updateRecheckRequest,
  verifySubmissionHash
} from "../api";
import {
  formatDate,
  getExamWindowStatus,
  getRoleMessage,
  initialAllocationForm,
  initialCaseForm,
  initialEvaluationForm,
  initialEvidenceForm,
  initialExamForm,
  initialQuestionForm,
  initialRecheckForm,
  initialStaffForm,
  panelLabel,
  parseEmails,
  rolePanels,
  roleTitles,
  suspiciousEventButtons,
  validateExamForm,
  validateQuestionForm,
  validateStaffForm
} from "./workspaceState";

export function RoleWorkspace({
  currentUser,
  activePanel,
  setActivePanel,
  loading,
  message,
  setMessage,
  onLogout,
  data,
  state,
  setters,
  token
}) {
  const {
    exams,
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
    selectedCaseId,
    draftAnswers,
    submissionsByExam,
    hashChecks,
    filteredStudents,
    unmatchedEmails
  } = data;

  const {
    examForm,
    questionForm,
    allocationForm,
    evaluationForm,
    caseForm,
    evidenceForm,
    recheckForm,
    staffForm
  } = state;

  const {
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
    setStaffForm,
    setFilteredStudents,
    setUnmatchedEmails
  } = setters;

  const [staffRoster, setStaffRoster] = useState([]);
  const [artifacts, setArtifacts] = useState([]);

  useEffect(() => {
    if (!token || !selectedCaseId || !["admin", "proctor", "auditor"].includes(currentUser.role)) {
      setCaseEvidence([]);
      return;
    }

    getCaseEvidence(token, selectedCaseId)
      .then(setCaseEvidence)
      .catch((error) => {
        setCaseEvidence([]);
        setMessage(error.message);
      });
  }, [token, selectedCaseId, currentUser.role, setCaseEvidence, setMessage]);

  useEffect(() => {
    if (!token || currentUser.role !== "admin") {
      setStaffRoster([]);
      return;
    }

    getUsers(token)
      .then(setStaffRoster)
      .catch((error) => setMessage(error.message));
  }, [token, currentUser.role, setMessage]);

  useEffect(() => {
    if (!token || !["admin", "auditor", "evaluator", "proctor"].includes(currentUser.role)) {
      setArtifacts([]);
      return;
    }

    getArtifacts(token)
      .then(setArtifacts)
      .catch(() => setArtifacts([]));
  }, [token, currentUser.role]);

  async function refreshExams() {
    const rows = await getExams(token);
    setExams(rows);
    setSelectedExamId((prev) => prev || rows[0]?.id || "");
    return rows;
  }

  async function refreshAssignments(examId = selectedExamId) {
    if (!examId || currentUser.role !== "admin") return [];
    const rows = await getExamAssignments(token, examId);
    setAssignments(rows);
    return rows;
  }

  async function refreshSubmissions() {
    const rows = await getSubmissions(token);
    setSubmissions(rows);
    setSelectedSubmissionId((prev) => prev || rows[0]?.id || "");
    return rows;
  }

  async function refreshCases() {
    if (!["admin", "proctor", "auditor"].includes(currentUser.role)) return [];
    const rows = await getCases(token);
    setCases(rows);
    setSelectedCaseId((prev) => prev || rows[0]?.id || "");
    return rows;
  }

  async function refreshResults() {
    if (!["admin", "evaluator", "auditor", "student"].includes(currentUser.role)) return [];
    const rows = await getResults(token);
    setResults(rows);
    return rows;
  }

  async function refreshFlags() {
    if (!["admin", "proctor", "auditor"].includes(currentUser.role)) return [];
    const rows = await getIntegrityFlags(token);
    setIntegrityFlags(rows);
    return rows;
  }

  async function refreshAuditLogs() {
    if (!["admin", "auditor"].includes(currentUser.role)) return [];
    const rows = await getAuditLogs(token);
    setAuditLogs(rows);
    return rows;
  }

  async function refreshRecheckRequests() {
    if (!["admin", "evaluator", "auditor"].includes(currentUser.role)) return [];
    const rows = await getRecheckRequests(token);
    setRecheckRequests(rows);
    return rows;
  }

  async function withFeedback(work) {
    try {
      await work();
    } catch (error) {
      setMessage(error.message);
    }
  }

  const actions = {
    createExam: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        const validationMessage = validateExamForm(examForm);
        if (validationMessage) throw new Error(validationMessage);
        const exam = await createExam(token, {
          title: examForm.title,
          start_time: new Date(examForm.start_time).toISOString(),
          end_time: new Date(examForm.end_time).toISOString(),
          config_json: { duration_minutes: Number(examForm.duration_minutes), tab_switch_limit: Number(examForm.tab_switch_limit) }
        });
        await refreshExams();
        setSelectedExamId(String(exam.id));
        setQuestionForm((prev) => ({ ...prev, examId: String(exam.id) }));
        setExamForm(initialExamForm);
        setActivePanel(currentUser.role === "admin" ? "allocation" : "builder");
        setMessage(`Exam "${exam.title}" created.`);
      });
    },
    createQuestion: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        const examId = questionForm.examId || selectedExam?.id;
        const validationMessage = validateQuestionForm({ ...questionForm, examId });
        if (validationMessage) throw new Error(validationMessage);
        if (questionForm.type === "mcq") {
          const filledOptions = questionForm.options.filter((option) => option.option_text.trim());
          if (filledOptions.length < 2) throw new Error("MCQ questions need at least two options.");
          if (filledOptions.filter((option) => option.is_correct).length !== 1) throw new Error("Choose exactly one correct MCQ option.");
        }

        await createQuestion(token, examId, {
          text: questionForm.text,
          type: questionForm.type,
          correct_answer: questionForm.correct_answer,
          marks: Number(questionForm.marks),
          options: questionForm.options
        });
        await refreshExams();
        setQuestionForm(initialQuestionForm);
        setMessage("Question added to the bank.");
      });
    },
    filterStudents: async () => {
      await withFeedback(async () => {
        const emails = parseEmails(allocationForm.emailsText);
        if (!emails.length) throw new Error("Paste one or more student email IDs first.");
        const matches = await getUsers(token, emails, "student");
        const matchedEmails = new Set(matches.map((item) => item.email.toLowerCase()));
        setFilteredStudents(matches);
        setUnmatchedEmails(emails.filter((email) => !matchedEmails.has(email)));
        setAllocationForm((prev) => ({ ...prev, selectedStudentIds: matches.map((item) => String(item.id)) }));
        setMessage(`Matched ${matches.length} student account(s).`);
      });
    },
    assignExam: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        if (!selectedExamId || !allocationForm.selectedStudentIds.length) throw new Error("Choose an exam and at least one filtered student.");
        const result = await assignExam(token, selectedExamId, { student_ids: allocationForm.selectedStudentIds.map(Number) });
        await refreshAssignments(selectedExamId);
        setUnmatchedEmails(result.unmatched_emails || []);
        setAllocationForm(initialAllocationForm);
        setFilteredStudents([]);
        setMessage(`Exam assigned to ${result.created?.length || 0} student(s).`);
      });
    },
    startSubmission: async (exam) => {
      await withFeedback(async () => {
        const submission = await startSubmission(token, { exam_id: exam.id, answer_data: [] });
        setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: submission }));
        await refreshSubmissions();
        setMessage(`Secure draft opened for ${exam.title}.`);
      });
    },
    saveDraft: async (exam) => {
      await withFeedback(async () => {
        const submission = submissionsByExam[exam.id] || (await startSubmission(token, { exam_id: exam.id, answer_data: [] }));
        const answerData = (exam.questions || []).map((question) => ({ question_id: question.id, answer: draftAnswers[question.id] || "" }));
        const saved = await saveSubmission(token, submission.id, { answer_data: answerData });
        setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: saved }));
        await refreshSubmissions();
        setMessage(`Autosave complete for submission ${saved.id}.`);
      });
    },
    submitExam: async (exam) => {
      await withFeedback(async () => {
        const existing = submissionsByExam[exam.id];
        if (!existing) throw new Error("Start the exam before final submission.");
        const answerData = (exam.questions || []).map((question) => ({ question_id: question.id, answer: draftAnswers[question.id] || "" }));
        const submitted = await submitSubmission(token, existing.id, { answer_data: answerData });
        setSubmissionsByExam((prev) => ({ ...prev, [exam.id]: submitted }));
        await refreshSubmissions();
        setMessage(`Submission ${submitted.id} locked with tamper-detection hash.`);
      });
    },
    triggerEvent: async (eventType, details) => {
      await withFeedback(async () => {
        if (!selectedSubmission) throw new Error("Start or load a submission before simulating suspicious activity.");
        await createIntegrityLog(token, { submission_id: selectedSubmission.id, event_type: eventType, event_details: details });
        await Promise.all([refreshFlags(), refreshCases()]);
        setMessage(`${eventType} logged. Proctor dashboards refreshed.`);
      });
    },
    verifyHash: async (submissionId) => {
      await withFeedback(async () => {
        const result = await verifySubmissionHash(token, submissionId);
        setHashChecks((prev) => ({ ...prev, [submissionId]: result }));
        setMessage(result.valid ? "Submission hash verified successfully." : "Submission hash mismatch detected.");
      });
    },
    updateCase: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        if (!selectedCaseId) throw new Error("Choose a case before updating it.");
        await patchCase(token, selectedCaseId, caseForm);
        await Promise.all([refreshCases(), refreshFlags(), refreshAuditLogs()]);
        setMessage("Case decision updated.");
      });
    },
    addEvidence: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        if (!selectedCaseId) throw new Error("Choose a case before adding evidence.");
        await addCaseEvidence(token, selectedCaseId, { source_type: evidenceForm.source_type, notes: evidenceForm.notes, payload: { note: evidenceForm.notes } });
        setEvidenceForm(initialEvidenceForm);
        setCaseEvidence(await getCaseEvidence(token, selectedCaseId));
        await refreshAuditLogs();
        setMessage("Evidence added to the investigation trail.");
      });
    },
    evaluateSubmission: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        if (!selectedSubmission) throw new Error("Choose a submission before evaluation.");
        await evaluateSubmission(token, selectedSubmission.id, { total_score: Number(evaluationForm.total_score), feedback: evaluationForm.feedback });
        setEvaluationForm(initialEvaluationForm);
        await Promise.all([refreshResults(), refreshSubmissions(), refreshRecheckRequests()]);
        setMessage("Evaluation recorded.");
      });
    },
    publishResult: async (resultId) => {
      await withFeedback(async () => {
        await publishResult(token, resultId);
        await Promise.all([refreshResults(), refreshAuditLogs()]);
        setMessage("Result published to the student portal.");
      });
    },
    requestRecheck: async (event, resultId) => {
      event.preventDefault();
      await withFeedback(async () => {
        await requestRecheck(token, resultId, { reason: recheckForm.reason });
        setRecheckForm(initialRecheckForm);
        setMessage("Re-check request submitted.");
      });
    },
    updateRecheck: async (requestId, status) => {
      await withFeedback(async () => {
        await updateRecheckRequest(token, requestId, { status });
        await Promise.all([refreshRecheckRequests(), refreshAuditLogs()]);
        setMessage("Re-check workflow updated.");
      });
    },
    provisionStaff: async (event) => {
      event.preventDefault();
      await withFeedback(async () => {
        const validationMessage = validateStaffForm(staffForm);
        if (validationMessage) throw new Error(validationMessage);
        await createUser(token, staffForm);
        setStaffForm(initialStaffForm);
        setStaffRoster(await getUsers(token));
        setMessage("Staff account provisioned successfully.");
      });
    },
    refreshAssignments
  };

  return (
    <section className="panel workspace-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Role Workspace</p>
          <h2>{roleTitles[currentUser.role] || "Workspace"}</h2>
        </div>
        <div className="profile-chip">
          <div>
            <strong>{currentUser.email}</strong>
            <p className="muted">Role: {currentUser.role}</p>
          </div>
          <button className="ghost-button" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="role-tabs">
        {(rolePanels[currentUser.role] || ["mission"]).map((panel) => (
          <button key={panel} className={activePanel === panel ? "tab active" : "tab"} onClick={() => setActivePanel(panel)}>
            {panelLabel(panel)}
          </button>
        ))}
      </div>

      <div className="status-banner">{message}</div>

      {activePanel === "mission" ? <MissionPanel currentUser={currentUser} exams={exams} submissions={submissions} cases={cases} results={results} /> : null}
      {activePanel === "builder" ? <BuilderPanel exams={exams} selectedExam={selectedExam} questionForm={questionForm} examForm={examForm} setExamForm={setExamForm} setQuestionForm={setQuestionForm} onCreateExam={actions.createExam} onCreateQuestion={actions.createQuestion} /> : null}
      {activePanel === "allocation" ? <AllocationPanel exams={exams} assignments={assignments} allocationForm={allocationForm} filteredStudents={filteredStudents} unmatchedEmails={unmatchedEmails} selectedExamId={selectedExamId} setAllocationForm={setAllocationForm} setSelectedExamId={setSelectedExamId} setFilteredStudents={setFilteredStudents} onFilterStudents={actions.filterStudents} onAssignExam={actions.assignExam} onRefreshAssignments={actions.refreshAssignments} /> : null}
      {activePanel === "users" ? <UsersPanel staffForm={staffForm} setStaffForm={setStaffForm} staffRoster={staffRoster} onProvisionStaff={actions.provisionStaff} /> : null}
      {activePanel === "exam-desk" ? <StudentDeskPanel exams={exams} selectedExam={selectedExam} submissions={submissions} hashChecks={hashChecks} draftAnswers={draftAnswers} setDraftAnswers={setDraftAnswers} loading={loading} onSelectExam={setSelectedExamId} onStartSubmission={actions.startSubmission} onSaveDraft={actions.saveDraft} onSubmitExam={actions.submitExam} onTriggerEvent={actions.triggerEvent} onVerifyHash={actions.verifyHash} /> : null}
      {activePanel === "monitoring" ? <MonitoringPanel integrityFlags={integrityFlags} /> : null}
      {activePanel === "investigation" ? <InvestigationPanel readOnly={currentUser.role === "auditor"} cases={cases} caseEvidence={caseEvidence} selectedCase={selectedCase} caseForm={caseForm} evidenceForm={evidenceForm} setSelectedCaseId={setSelectedCaseId} setCaseForm={setCaseForm} setEvidenceForm={setEvidenceForm} onUpdateCase={actions.updateCase} onAddEvidence={actions.addEvidence} /> : null}
      {activePanel === "evaluation" ? <EvaluationPanel submissions={submissions} selectedSubmission={selectedSubmission} evaluationForm={evaluationForm} recheckRequests={recheckRequests} setSelectedSubmissionId={setSelectedSubmissionId} setEvaluationForm={setEvaluationForm} onEvaluateSubmission={actions.evaluateSubmission} onUpdateRecheck={actions.updateRecheck} /> : null}
      {activePanel === "results" ? <ResultsPanel role={currentUser.role} results={results} recheckForm={recheckForm} setRecheckForm={setRecheckForm} onRequestRecheck={actions.requestRecheck} onPublishResult={actions.publishResult} /> : null}
      {activePanel === "audit" ? <AuditPanel auditLogs={auditLogs} /> : null}
      {activePanel === "compliance" ? <CompliancePanel integrityFlags={integrityFlags} auditLogs={auditLogs} artifacts={artifacts} /> : null}
    </section>
  );
}

function MissionPanel({ currentUser, exams, submissions, cases, results }) {
  const stats = [
    { label: "Exams", value: exams.length },
    { label: "Submissions", value: submissions.length },
    { label: "Cases", value: cases.length },
    { label: "Results", value: results.length }
  ];

  return (
    <div className="role-grid">
      <div className="card hero-card-large">
        <p className="eyebrow">{roleTitles[currentUser.role]}</p>
        <h3>{getRoleMessage(currentUser.role)}</h3>
        <p className="muted">This workspace is separated by role so candidates, reviewers, and compliance users only see the actions relevant to them.</p>
      </div>
      <div className="stat-grid">
        {stats.map((item) => (
          <div className="card stat-card" key={item.label}>
            <p className="eyebrow">{item.label}</p>
            <h3>{item.value}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuilderPanel({ exams, questionForm, examForm, selectedExam, setExamForm, setQuestionForm, onCreateExam, onCreateQuestion }) {
  return (
    <div className="role-grid">
      <form className="card" onSubmit={onCreateExam}>
        <h3>Create Exam</h3>
        <label>Title<input value={examForm.title} onChange={(event) => setExamForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
        <label>Start Time<input type="datetime-local" value={examForm.start_time} onChange={(event) => setExamForm((prev) => ({ ...prev, start_time: event.target.value }))} /></label>
        <label>End Time<input type="datetime-local" value={examForm.end_time} onChange={(event) => setExamForm((prev) => ({ ...prev, end_time: event.target.value }))} /></label>
        <label>Duration Minutes<input type="number" value={examForm.duration_minutes} onChange={(event) => setExamForm((prev) => ({ ...prev, duration_minutes: event.target.value }))} /></label>
        <label>Tab Switch Limit<input type="number" value={examForm.tab_switch_limit} onChange={(event) => setExamForm((prev) => ({ ...prev, tab_switch_limit: event.target.value }))} /></label>
        <button className="primary-button" type="submit">Create Exam</button>
      </form>

      <form className="card accent-card" onSubmit={onCreateQuestion}>
        <h3>Add Question</h3>
        <label>Exam<select value={questionForm.examId} onChange={(event) => setQuestionForm((prev) => ({ ...prev, examId: event.target.value }))}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
        <label>Question Text<textarea rows={4} value={questionForm.text} onChange={(event) => setQuestionForm((prev) => ({ ...prev, text: event.target.value }))} /></label>
        <label>Type<select value={questionForm.type} onChange={(event) => setQuestionForm((prev) => ({ ...prev, type: event.target.value }))}><option value="mcq">mcq</option><option value="true_false">true_false</option><option value="short_answer">short_answer</option><option value="long_answer">long_answer</option><option value="coding">coding</option></select></label>
        {questionForm.type === "mcq" ? (
          <div className="selection-card">
            <p className="eyebrow">MCQ Options</p>
            <div className="stack">
              {questionForm.options.map((option, index) => (
                <div className="option-row" key={index}>
                  <input
                    value={option.option_text}
                    onChange={(event) => setQuestionForm((prev) => ({
                      ...prev,
                      correct_answer: prev.options[index].is_correct ? event.target.value : prev.correct_answer,
                      options: prev.options.map((item, itemIndex) => itemIndex === index ? { ...item, option_text: event.target.value } : item)
                    }))}
                    placeholder={`Option ${index + 1}`}
                  />
                  <label className="checkbox-row">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.is_correct}
                      onChange={() => setQuestionForm((prev) => ({
                        ...prev,
                        correct_answer: option.option_text,
                        options: prev.options.map((item, itemIndex) => ({ ...item, is_correct: itemIndex === index }))
                      }))}
                    />
                    <span>Correct</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <label>Correct Answer / Key<input value={questionForm.correct_answer} onChange={(event) => setQuestionForm((prev) => ({ ...prev, correct_answer: event.target.value }))} /></label>
        )}
        <label>Marks<input type="number" value={questionForm.marks} onChange={(event) => setQuestionForm((prev) => ({ ...prev, marks: event.target.value }))} /></label>
        <button className="outline-button" type="submit">Add Question</button>
      </form>

      <div className="card full-span">
        <h3>Question Bank Snapshot</h3>
        <div className="stack">
          {exams.map((exam) => (
            <div className="list-item static" key={exam.id}>
              <div>
                <strong>{exam.title}</strong>
                <p className="muted">{formatDate(exam.start_time)} to {formatDate(exam.end_time)}</p>
              </div>
              <span>{exam.questions?.length || 0} question(s)</span>
            </div>
          ))}
          {!exams.length ? <p className="muted">No exams created yet.</p> : null}
          {selectedExam ? <p className="muted">Selected exam: {selectedExam.title}</p> : null}
        </div>
      </div>
    </div>
  );
}

function UsersPanel({ staffForm, setStaffForm, staffRoster, onProvisionStaff }) {
  return (
    <div className="role-grid">
      <form className="card" onSubmit={onProvisionStaff}>
        <h3>Provision Staff Account</h3>
        <label>Email<input type="email" value={staffForm.email} onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="proctor@college.com" /></label>
        <label>Password<input type="password" value={staffForm.password} onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))} placeholder="Minimum 8 characters" /></label>
        <label>Role<select value={staffForm.role} onChange={(event) => setStaffForm((prev) => ({ ...prev, role: event.target.value }))}><option value="proctor">proctor</option><option value="evaluator">evaluator</option><option value="auditor">auditor</option><option value="faculty">faculty</option><option value="admin">admin</option></select></label>
        <button className="primary-button" type="submit">Create Role Account</button>
      </form>

      <div className="card accent-card">
        <h3>Role Roster</h3>
        <div className="stack">
          {staffRoster.map((user) => (
            <div className="list-item static" key={user.id}>
              <span>{user.email}</span>
              <span>{user.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AllocationPanel({
  exams,
  assignments,
  allocationForm,
  filteredStudents,
  unmatchedEmails,
  selectedExamId,
  setAllocationForm,
  setSelectedExamId,
  setFilteredStudents,
  onFilterStudents,
  onAssignExam,
  onRefreshAssignments
}) {
  return (
    <div className="role-grid">
      <form className="card" onSubmit={onAssignExam}>
        <h3>Allocate Exam To Students</h3>
        <label>Exam<select value={selectedExamId || ""} onChange={(event) => { setSelectedExamId(event.target.value); onRefreshAssignments(event.target.value); }}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select></label>
        <label>Paste Email IDs<textarea rows={6} value={allocationForm.emailsText} onChange={(event) => setAllocationForm((prev) => ({ ...prev, emailsText: event.target.value }))} placeholder={"student1@college.com\nstudent2@college.com"} /></label>
        <div className="button-row">
          <button className="outline-button" type="button" onClick={onFilterStudents}>Find Students</button>
          <button className="primary-button" type="submit">Assign Exam</button>
        </div>
        {unmatchedEmails.length ? <p className="muted">No match for: {unmatchedEmails.join(", ")}</p> : null}
      </form>

      <div className="card accent-card">
        <h3>Matched Students</h3>
        <div className="stack">
          {filteredStudents.map((student) => (
            <label className="checkbox-row" key={student.id}>
              <input
                type="checkbox"
                checked={allocationForm.selectedStudentIds.includes(String(student.id))}
                onChange={(event) => {
                  setAllocationForm((prev) => ({
                    ...prev,
                    selectedStudentIds: event.target.checked
                      ? [...prev.selectedStudentIds, String(student.id)]
                      : prev.selectedStudentIds.filter((id) => id !== String(student.id))
                  }));
                }}
              />
              <span>{student.email}</span>
            </label>
          ))}
          {!filteredStudents.length ? <p className="muted">Use the email filter to build a target student list.</p> : null}
          {!!filteredStudents.length ? <button className="ghost-button" type="button" onClick={() => setFilteredStudents([])}>Clear List</button> : null}
        </div>
      </div>

      <div className="card full-span">
        <h3>Current Assignment Roster</h3>
        <div className="stack">
          {assignments.map((assignment) => (
            <div className="list-item static" key={assignment.id}>
              <span>{assignment.users?.email || `Student #${assignment.student_id}`}</span>
              <span>{formatDate(assignment.assigned_at)}</span>
            </div>
          ))}
          {!assignments.length ? <p className="muted">No students assigned to this exam yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function StudentDeskPanel({
  exams,
  selectedExam,
  submissions,
  hashChecks,
  draftAnswers,
  setDraftAnswers,
  loading,
  onSelectExam,
  onStartSubmission,
  onSaveDraft,
  onSubmitExam,
  onTriggerEvent,
  onVerifyHash
}) {
  return (
    <div className="role-grid">
      <div className="card full-span">
        <h3>Assigned Exams</h3>
        <div className="split-layout">
          <div className="stack">
            {exams.map((exam) => (
              <button key={exam.id} className={selectedExam?.id === exam.id ? "list-item selected" : "list-item"} onClick={() => onSelectExam(String(exam.id))}>
                <span>{exam.title}</span>
                <span className={`pill pill-${getExamWindowStatus(exam)}`}>{getExamWindowStatus(exam)}</span>
              </button>
            ))}
            {!exams.length ? <p className="muted">No exams allocated to this student yet.</p> : null}
          </div>

          {selectedExam ? (
            <div className="exam-sheet">
              <div className="exam-header">
                <div>
                  <p className="eyebrow">Secure Attempt</p>
                  <h3>{selectedExam.title}</h3>
                </div>
                <div className="pill-row">
                  <span className={`pill pill-${getExamWindowStatus(selectedExam)}`}>{getExamWindowStatus(selectedExam)}</span>
                  <span className="pill">Duration {selectedExam.config_json?.duration_minutes || "N/A"}m</span>
                </div>
              </div>
              <p className="muted">{formatDate(selectedExam.start_time)} to {formatDate(selectedExam.end_time)}</p>
              <div className="question-stack">
                {(selectedExam.questions || []).map((question, index) => (
                  <div className="question-card" key={question.id}>
                    <p className="question-label">Question {index + 1}</p>
                    <h4>{question.text}</h4>
                    <p className="muted">Type: {question.type} | Marks: {question.marks}</p>
                    {question.type === "mcq" ? (
                      <div className="stack">
                        {(question.question_options || []).map((option) => (
                          <label className="checkbox-row" key={option.id}>
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              checked={draftAnswers[question.id] === option.option_text}
                              onChange={() => setDraftAnswers((prev) => ({ ...prev, [question.id]: option.option_text }))}
                            />
                            <span>{option.option_text}</span>
                          </label>
                        ))}
                      </div>
                    ) : question.type === "coding" || question.type === "long_answer" || question.type === "short_answer" ? (
                      <textarea rows={question.type === "coding" ? 8 : 4} value={draftAnswers[question.id] || ""} onChange={(event) => setDraftAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))} placeholder={question.type === "coding" ? "Write code / SQL answer here..." : "Write your answer here..."} />
                    ) : (
                      <input value={draftAnswers[question.id] || ""} onChange={(event) => setDraftAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))} placeholder={question.type === "true_false" ? "Enter True or False" : "Enter selected option"} />
                    )}
                  </div>
                ))}
              </div>
              <div className="button-row">
                <button className="outline-button" type="button" onClick={() => onStartSubmission(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Start</button>
                <button className="outline-button" type="button" onClick={() => onSaveDraft(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Autosave</button>
                <button className="primary-button" type="button" onClick={() => onSubmitExam(selectedExam)} disabled={loading || getExamWindowStatus(selectedExam) !== "active"}>Final Submit</button>
              </div>
              {getExamWindowStatus(selectedExam) !== "active" ? <p className="muted">This exam can only be started within its configured time window.</p> : null}
            </div>
          ) : <p className="muted">Choose an assigned exam to begin.</p>}
        </div>
      </div>

      <div className="card">
        <h3>Suspicious Event Simulator</h3>
        <p className="muted">Use this demo section to show how integrity logs and proctor cases are created.</p>
        <div className="stack">
          {suspiciousEventButtons.map((item) => (
            <button key={item.type} className="outline-button" type="button" onClick={() => onTriggerEvent(item.type, item.details)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card accent-card">
        <h3>Submission Hash Verification</h3>
        <div className="stack">
          {submissions.map((submission) => (
            <div className="list-item static" key={submission.id}>
              <div>
                <strong>{submission.exams?.title || `Exam #${submission.exam_id}`}</strong>
                <p className="muted">Status: {submission.status}</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => onVerifyHash(submission.id)}>Verify Hash</button>
            </div>
          ))}
          {!submissions.length ? <p className="muted">No submission records yet.</p> : null}
        </div>
        {Object.values(hashChecks).map((check) => (
          <div className="hash-card" key={check.submission_id}>
            <strong>Submission #{check.submission_id}</strong>
            <p className="muted">{check.valid ? "Hash verified." : "Hash mismatch detected."}</p>
            <code>{check.storedHash || "No stored hash yet"}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonitoringPanel({ integrityFlags }) {
  return (
    <div className="role-grid">
      <div className="card full-span">
        <h3>Live Suspicious Activity</h3>
        <div className="stack">
          {integrityFlags.map((flag) => (
            <div className="list-item static" key={flag.id}>
              <div>
                <strong>{flag.event_type}</strong>
                <p className="muted">{flag.submissions?.users?.email || "Unknown student"} | {flag.submissions?.exams?.title || "Unknown exam"}</p>
              </div>
              <span>{formatDate(flag.timestamp)}</span>
            </div>
          ))}
          {!integrityFlags.length ? <p className="muted">No suspicious events logged yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function InvestigationPanel({
  readOnly,
  cases,
  caseEvidence,
  selectedCase,
  caseForm,
  evidenceForm,
  setSelectedCaseId,
  setCaseForm,
  setEvidenceForm,
  onUpdateCase,
  onAddEvidence
}) {
  return (
    <div className="role-grid">
      <div className="card">
        <h3>Cases</h3>
        <div className="stack">
          {cases.map((item) => (
            <button key={item.id} className={selectedCase?.id === item.id ? "list-item selected" : "list-item"} onClick={() => setSelectedCaseId(String(item.id))}>
              <span>Case #{item.id}</span>
              <span>{item.status}</span>
            </button>
          ))}
          {!cases.length ? <p className="muted">No cases opened yet.</p> : null}
        </div>
      </div>

      <div className="card accent-card">
        <h3>Evidence Trail</h3>
        <div className="stack">
          {caseEvidence.map((evidence) => (
            <div className="timeline-item" key={evidence.id}>
              <strong>{evidence.source_type}</strong>
              <p className="muted">{evidence.notes || "No notes"}</p>
              <span>{formatDate(evidence.created_at)}</span>
            </div>
          ))}
          {!caseEvidence.length ? <p className="muted">Choose a case to view evidence.</p> : null}
        </div>
      </div>

      {!readOnly ? (
        <>
          <form className="card" onSubmit={onUpdateCase}>
            <h3>Decision Workflow</h3>
            <label>Status<select value={caseForm.status} onChange={(event) => setCaseForm((prev) => ({ ...prev, status: event.target.value }))}><option value="open">open</option><option value="in_review">in_review</option><option value="resolved">resolved</option><option value="rejected">rejected</option></select></label>
            <label>Verdict<textarea rows={4} value={caseForm.verdict} onChange={(event) => setCaseForm((prev) => ({ ...prev, verdict: event.target.value }))} placeholder="Explain the decision and supporting reasoning." /></label>
            <button className="primary-button" type="submit">Update Case</button>
          </form>

          <form className="card" onSubmit={onAddEvidence}>
            <h3>Add Evidence</h3>
            <label>Source<select value={evidenceForm.source_type} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, source_type: event.target.value }))}><option value="manual_note">manual_note</option><option value="integrity_log">integrity_log</option><option value="submission_hash">submission_hash</option><option value="system_flag">system_flag</option></select></label>
            <label>Notes<textarea rows={4} value={evidenceForm.notes} onChange={(event) => setEvidenceForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Attach your observation or evidence summary." /></label>
            <button className="outline-button" type="submit">Attach Evidence</button>
          </form>
        </>
      ) : null}
    </div>
  );
}

function EvaluationPanel({
  submissions,
  selectedSubmission,
  evaluationForm,
  recheckRequests,
  setSelectedSubmissionId,
  setEvaluationForm,
  onEvaluateSubmission,
  onUpdateRecheck
}) {
  return (
    <div className="role-grid">
      <div className="card">
        <h3>Submitted Scripts</h3>
        <div className="stack">
          {submissions.map((submission) => (
            <button key={submission.id} className={selectedSubmission?.id === submission.id ? "list-item selected" : "list-item"} onClick={() => setSelectedSubmissionId(String(submission.id))}>
              <span>{submission.users?.email || `Student #${submission.student_id}`}</span>
              <span>{submission.status}</span>
            </button>
          ))}
          {!submissions.length ? <p className="muted">No submissions available for evaluation.</p> : null}
        </div>
      </div>

      <form className="card accent-card" onSubmit={onEvaluateSubmission}>
        <h3>Evaluate Submission</h3>
        <p className="muted">{selectedSubmission ? `Submission #${selectedSubmission.id} | ${selectedSubmission.exams?.title || "Exam"}` : "Choose a submission first."}</p>
        <label>Total Score<input type="number" value={evaluationForm.total_score} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, total_score: event.target.value }))} /></label>
        <label>Feedback<textarea rows={5} value={evaluationForm.feedback} onChange={(event) => setEvaluationForm((prev) => ({ ...prev, feedback: event.target.value }))} /></label>
        <button className="primary-button" type="submit">Save Evaluation</button>
      </form>

      <div className="card full-span">
        <h3>Re-check Requests</h3>
        <div className="stack">
          {recheckRequests.map((item) => (
            <div className="list-item static" key={item.id}>
              <div>
                <strong>{item.users?.email || "Student"}</strong>
                <p className="muted">{item.reason}</p>
              </div>
              <div className="compact-actions">
                <span>{item.status}</span>
                <button className="ghost-button" type="button" onClick={() => onUpdateRecheck(item.id, "reviewing")}>Mark Reviewing</button>
                <button className="ghost-button" type="button" onClick={() => onUpdateRecheck(item.id, "closed")}>Close</button>
              </div>
            </div>
          ))}
          {!recheckRequests.length ? <p className="muted">No re-check requests available.</p> : null}
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({ role, results, recheckForm, setRecheckForm, onRequestRecheck, onPublishResult }) {
  if (role === "student") {
    return (
      <div className="role-grid">
        <div className="card full-span">
          <h3>Published Results</h3>
          <div className="stack">
            {results.map((result) => (
              <div className="result-card" key={result.id}>
                <div>
                  <p className="eyebrow">{result.submissions?.exams?.title || "Exam"}</p>
                  <h4>{result.total_score} marks</h4>
                  <p className="muted">{result.feedback || "No evaluator feedback yet."}</p>
                </div>
                <form className="mini-form" onSubmit={(event) => onRequestRecheck(event, result.id)}>
                  <textarea rows={3} value={recheckForm.reason} onChange={(event) => setRecheckForm({ reason: event.target.value })} placeholder="Request a re-check with a reason." />
                  <button className="outline-button" type="submit">Request Re-check</button>
                </form>
              </div>
            ))}
            {!results.length ? <p className="muted">No published results yet.</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-grid">
      <div className="card full-span">
        <h3>Results Queue</h3>
        <div className="stack">
          {results.map((result) => (
            <div className="list-item static" key={result.id}>
              <div>
                <strong>{result.submissions?.users?.email || "Student"}</strong>
                <p className="muted">{result.submissions?.exams?.title || "Exam"} | Score: {result.total_score}</p>
              </div>
              <div className="compact-actions">
                <span>{result.status}</span>
                {role === "admin" && result.status !== "published" ? <button className="primary-button" type="button" onClick={() => onPublishResult(result.id)}>Publish</button> : null}
              </div>
            </div>
          ))}
          {!results.length ? <p className="muted">No results available yet.</p> : null}
        </div>
      </div>
    </div>
  );
}

function AuditPanel({ auditLogs }) {
  return (
    <div className="role-grid">
      <div className="card full-span">
        <h3>Audit Trail</h3>
        <div className="stack">
          {auditLogs.map((log) => (
            <div className="timeline-item" key={log.id}>
              <strong>{log.action_type}</strong>
              <p className="muted">{log.users?.email || "System"} | {log.entity_type} #{log.entity_id || "n/a"}</p>
              <span>{formatDate(log.created_at)}</span>
            </div>
          ))}
          {!auditLogs.length ? <p className="muted">No audit records available.</p> : null}
        </div>
      </div>
    </div>
  );
}

function CompliancePanel({ integrityFlags, auditLogs, artifacts }) {
  return (
    <div className="role-grid">
      <div className="card">
        <h3>Integrity Flags</h3>
        <div className="stack">
          {integrityFlags.slice(0, 8).map((flag) => (
            <div className="list-item static" key={flag.id}>
              <span>{flag.event_type}</span>
              <span>{flag.submissions?.users?.email || "Student"}</span>
            </div>
          ))}
          {!integrityFlags.length ? <p className="muted">No suspicious events yet.</p> : null}
        </div>
      </div>

      <div className="card accent-card">
        <h3>Audit Snapshot</h3>
        <div className="stack">
          {auditLogs.slice(0, 8).map((log) => (
            <div className="timeline-item" key={log.id}>
              <strong>{log.action_type}</strong>
              <span>{formatDate(log.created_at)}</span>
            </div>
          ))}
          {!auditLogs.length ? <p className="muted">No audit entries yet.</p> : null}
        </div>
      </div>

      <div className="card full-span">
        <h3>Stored Reports / Scripts</h3>
        <div className="stack">
          {artifacts.map((artifact) => (
            <div className="list-item static" key={artifact.id}>
              <span>{artifact.file_name}</span>
              <span>{artifact.artifact_type}</span>
            </div>
          ))}
          {!artifacts.length ? <p className="muted">No cloud artifact records yet. Upload support is ready once S3 is configured.</p> : null}
        </div>
      </div>
    </div>
  );
}
