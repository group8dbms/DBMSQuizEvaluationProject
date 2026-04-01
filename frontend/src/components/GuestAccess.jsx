export function GuestAccess({
  authForm,
  loading,
  onAuthChange,
  onAccess
}) {
  return (
    <section className="panel access-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Access Gateway</p>
          <h2>Continue to the portal</h2>
        </div>
      </div>
      <div className="dual-grid">
        <form className="card" onSubmit={onAccess}>
          <h3>Student Sign In / First-Time Access</h3>
          <label>Email<input type="email" value={authForm.email} onChange={(event) => onAuthChange((prev) => ({ ...prev, email: event.target.value }))} placeholder="group8postmanadmin@gmail.com" /></label>
          <label>Password<input type="password" value={authForm.password} onChange={(event) => onAuthChange((prev) => ({ ...prev, password: event.target.value }))} placeholder="Admin@12345" /></label>
          <button className="primary-button" type="submit" disabled={loading}>Continue</button>
        </form>

        <div className="card accent-card">
          <h3>How It Works</h3>
          <p className="muted">Use the same form for both cases.</p>
          <p className="muted">If a student account already exists, the system signs you in.</p>
          <p className="muted">If it is the first time for a student email, the system creates the student account and then continues with access.</p>
          <p className="muted">Staff accounts such as admin, proctor, evaluator, and auditor should be provisioned by the admin inside the workspace.</p>
        </div>
      </div>
    </section>
  );
}
