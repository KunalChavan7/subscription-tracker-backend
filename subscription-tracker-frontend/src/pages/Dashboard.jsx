import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../useAuth";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api("/dashboard/summary")
      .then((data) => {
        if (active) setSummary(data);
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

  const metrics = summary && [
    { label: "Active subscriptions", value: summary.activeCount, detail: "CURRENT PLANS", tone: "green" },
    { label: "Monthly spend", value: money.format(summary.monthlySpend), detail: "NORMALIZED MONTHLY", tone: "blue" },
    { label: "Overdue", value: summary.overdue.length, detail: money.format(summary.overdueTotal), tone: "coral" },
    { label: "Due in 7 days", value: summary.dueSoon.length, detail: "UPCOMING PAYMENTS", tone: "lime" },
  ];

  return (
    <div className="dashboard-shell">
      <header className="app-header">
        <a className="brand-lockup app-brand" href="/" aria-label="Subledger home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>Subledger</span>
        </a>
        <div className="account-actions">
          <span className="account-name">{user.name}</span>
          <button className="logout-button" onClick={logout} type="button">Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">PERSONAL OVERVIEW</p>
            <h1>Hello, {user.name}</h1>
          </div>
          <span className="date-stamp">ALL BILLING CYCLES</span>
        </div>

        {error && <p className="error-message dashboard-error" role="alert">{error}</p>}
        {loading ? (
          <p className="dashboard-status" role="status">Loading your summary…</p>
        ) : summary ? (
          <>
            <section className="metric-grid" aria-label="Subscription summary">
              {metrics.map((metric, index) => (
                <article className={`metric-card metric-${metric.tone}`} key={metric.label}>
                  <div className="metric-topline">
                    <span>{metric.label}</span>
                    <span className="metric-index">0{index + 1}</span>
                  </div>
                  <strong>{metric.value}</strong>
                  <span className="metric-detail">{metric.detail}</span>
                </article>
              ))}
            </section>
            {summary.activeCount === 0 && (
              <section className="empty-state">
                <span className="empty-mark" aria-hidden="true">＋</span>
                <div>
                  <h2>Your ledger is clear</h2>
                  <p>No active subscriptions yet.</p>
                </div>
              </section>
            )}
          </>
        ) : null}
      </main>
      <footer className="dashboard-footer">
        <span>SUBLEDGER</span>
        <span>{summary ? `${summary.activeCount} ACTIVE ITEMS` : "ACCOUNT OVERVIEW"}</span>
      </footer>
    </div>
  );
}