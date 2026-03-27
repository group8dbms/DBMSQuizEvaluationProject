export function GuestAccess({
  authForm,
  signupForm,
  loading,
  onAuthChange,
  onSignupChange,
  onLogin,
  onSignup
}) {
  return (
    <section className="panel access-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Access Gateway</p>
          <h2>Sign in to a role-specific workspace</h2>
        </div>
      </div>
      <div className="dual-grid">
        <form className="card" onSubmit={onLogin}>
          <h3>Sign In</h3>
          <label>Email<input type="email" value={authForm.email} onChange={(event) => onAuthChange((prev) => ({ ...prev, email: event.target.value }))} placeholder="group8postmanadmin@gmail.com" /></label>
          <label>Password<input type="password" value={authForm.password} onChange={(event) => onAuthChange((prev) => ({ ...prev, password: event.target.value }))} placeholder="Admin@12345" /></label>
          <button className="primary-button" type="submit" disabled={loading}>Enter Workspace</button>
        </form>

        <form className="card accent-card" onSubmit={onSignup}>
          <h3>Register Student</h3>
          <label>Email<input type="email" value={signupForm.email} onChange={(event) => onSignupChange((prev) => ({ ...prev, email: event.target.value }))} placeholder="student@college.com" /></label>
          <label>Password<input type="password" value={signupForm.password} onChange={(event) => onSignupChange((prev) => ({ ...prev, password: event.target.value }))} placeholder="Create a strong password" /></label>
          <label>Role<select value={signupForm.role} onChange={(event) => onSignupChange((prev) => ({ ...prev, role: event.target.value }))}><option value="student">student</option></select></label>
          <button className="outline-button" type="submit" disabled={loading}>Create Student Account</button>
        </form>
      </div>
    </section>
  );
}
