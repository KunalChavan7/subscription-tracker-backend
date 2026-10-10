import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import "./Settings.css";

const OPTIONS = [
  { value: 14, label: "14 days before" },
  { value: 7, label: "7 days before" },
  { value: 5, label: "5 days before" },
  { value: 3, label: "3 days before" },
  { value: 2, label: "2 days before" },
  { value: 1, label: "1 day before" },
  { value: 0, label: "On the due date" },
];

export default function Settings() {
  const [account, setAccount] = useState(null);
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api("/settings")
      .then((data) => {
        if (!active) return;
        setAccount({ name: data.name, email: data.email });
        setEnabled(data.reminderPrefs.enabled);
        setDays(data.reminderPrefs.days);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function toggleDay(value) {
    setSaved(false);
    setDays((current) =>
      current.includes(value) ? current.filter((day) => day !== value) : [...current, value]
    );
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    if (enabled && days.length === 0) {
      setError("Pick at least one reminder day, or turn reminders off.");
      return;
    }

    setSaving(true);
    try {
      const data = await api("/settings", {
        method: "PATCH",
        body: { reminderPrefs: { enabled, days } },
      });
      setEnabled(data.reminderPrefs.enabled);
      setDays(data.reminderPrefs.days);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="settings-shell">
      <header className="app-header">
        <Link className="brand-lockup app-brand" to="/" aria-label="Subledger home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Subledger</span>
        </Link>
        <Link className="settings-back" to="/">Back to dashboard</Link>
      </header>

      <main className="settings-main">
        <div className="settings-heading">
          <p className="eyebrow">ACCOUNT PREFERENCES</p>
          <h1>Settings</h1>
          <p>Choose when Subledger emails you about an upcoming bill.</p>
        </div>

        {loading ? (
          <p className="settings-status" role="status">Loading your settings…</p>
        ) : !account ? (
          <p className="settings-error" role="alert">{error || "Could not load settings"}</p>
        ) : (
          <form className="settings-form" onSubmit={save}>
            <p className="settings-account">
              <span>{account.name}</span>
              <span>{account.email}</span>
            </p>

            <section className="settings-section" aria-labelledby="reminder-heading">
              <div className="settings-section-heading">
                <div>
                  <p className="settings-kicker">EMAIL REMINDERS</p>
                  <h2 id="reminder-heading">Bill notifications</h2>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(event) => {
                      setEnabled(event.target.checked);
                      setSaved(false);
                    }}
                  />
                  <span className="settings-switch-track" aria-hidden="true" />
                  <span className="settings-visually-hidden">Send me email reminders</span>
                </label>
              </div>

              <p className="settings-description">
                {enabled ? "Select one or more days before each bill is due." : "Email reminders are turned off."}
              </p>

              <fieldset className="settings-days" disabled={!enabled}>
                <legend>Remind me</legend>
                {OPTIONS.map((option) => (
                  <label className="settings-day" key={option.value}>
                    <input
                      type="checkbox"
                      checked={days.includes(option.value)}
                      onChange={() => toggleDay(option.value)}
                    />
                    <span className="settings-checkmark" aria-hidden="true" />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            </section>

            {error && <p className="settings-error" role="alert">{error}</p>}
            {saved && <p className="settings-saved" role="status">Settings saved</p>}
            <button className="settings-save" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save settings"}
            </button>
          </form>
        )}
      </main>

      <footer className="dashboard-footer">
        <span>SUBLEDGER</span>
        <span>ACCOUNT PREFERENCES</span>
      </footer>
    </div>
  );
}