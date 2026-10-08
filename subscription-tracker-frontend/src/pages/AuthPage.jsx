import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

const calendarDays = Array.from({ length: 31 }, (_, index) => index + 1);

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <aside className="brand-panel" aria-label="Subledger">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Subledger</span>
        </div>

        <div className="brand-calendar" aria-hidden="true">
          <div className="calendar-heading">
            <span>OCTOBER 2026</span>
            <span className="calendar-current">08 / THU</span>
          </div>
          <div className="calendar-weekdays">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="calendar-days">
            {calendarDays.map((day) => (
              <span
                className={day === 8 ? "calendar-today" : day === 12 || day === 30 ? "calendar-marked" : ""}
                key={day}
              >
                {day}
              </span>
            ))}
          </div>
          <div className="calendar-footer">
            <span><i className="legend-dot legend-today" /> TODAY</span>
            <span><i className="legend-dot legend-bill" /> BILL DATE</span>
          </div>
        </div>

        <div className="brand-bottom">
          <span>PERSONAL FINANCE</span>
          <span>01 — 12</span>
        </div>
      </aside>

      <section className="auth-main">
        <div className="auth-content">
          <p className="eyebrow">YOUR ACCOUNT</p>
          <h1>{isRegister ? "Create account" : "Welcome back"}</h1>
          <p className="auth-intro">
            {isRegister ? "A fresh start for your subscriptions." : "Sign in to your account."}
          </p>

          <form className="auth-form" onSubmit={submit}>
            {isRegister && (
              <label className="field">
                <span>Name</span>
                <input
                  autoComplete="name"
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={change}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={change}
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                name="password"
                type="password"
                minLength={isRegister ? 8 : undefined}
                placeholder={isRegister ? "At least 8 characters" : "Your password"}
                value={form.password}
                onChange={change}
                required
              />
            </label>
            {error && <p className="error-message" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy} type="submit">
              {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? (
              <>Already have an account? <Link to="/login">Sign in</Link></>
            ) : (
              <>New to Subledger? <Link to="/register">Create an account</Link></>
            )}
          </p>
        </div>
        <footer className="auth-footer">SUBLEDGER <span>•</span> PRIVATE BY DESIGN</footer>
      </section>
    </main>
  );
}