import { useEffect, useState } from "react";
import { api } from "../api";
import "./SubscriptionsSection.css";

const CYCLES = ["weekly", "monthly", "quarterly", "yearly"];
const CATEGORIES = ["entertainment", "utilities", "rent", "emi", "insurance", "education", "other"];
const EMPTY = { name: "", amount: "", cycle: "monthly", category: "other", nextDueDate: "" };
const DAY = 24 * 60 * 60 * 1000;
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateText = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function dueLabel(date) {
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.round((new Date(date).getTime() - today) / DAY);
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  return { text: `Due in ${days} day${days === 1 ? "" : "s"}`, overdue: false };
}

export default function SubscriptionsSection({ onChange }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setSubs(await api("/subscriptions?status=active"));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api("/subscriptions?status=active")
      .then((data) => {
        if (active) setSubs(data);
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

  async function refresh() {
    await load();
    await onChange?.();
  }

  const change = (event) =>
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function add(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/subscriptions", {
        method: "POST",
        body: { ...form, amount: Number(form.amount) },
      });
      setForm(EMPTY);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function run(id, request) {
    setBusyId(id);
    setError("");
    try {
      await request();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const markPaid = (sub) =>
    run(sub._id, () => api(`/subscriptions/${sub._id}/pay`, { method: "POST", body: {} }));

  const remove = (sub) => {
    if (!window.confirm(`Delete ${sub.name}?`)) return;
    run(sub._id, () => api(`/subscriptions/${sub._id}`, { method: "DELETE" }));
  };

  return (
    <section className="subs" aria-labelledby="subs-title">
      <div className="subs-heading">
        <div>
          <p className="subs-kicker">RECURRING BILLS</p>
          <h2 id="subs-title">Your subscriptions</h2>
        </div>
        <span className="subs-count">{loading ? "…" : `${subs.length} ACTIVE`}</span>
      </div>

      <form className="subs-form" onSubmit={add}>
        <label className="subs-field subs-name-field">
          <span>Name</span>
          <input
            autoComplete="off"
            name="name"
            placeholder="e.g. Netflix"
            value={form.name}
            onChange={change}
            required
          />
        </label>
        <label className="subs-field subs-amount-field">
          <span>Amount (₹)</span>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={change}
            required
          />
        </label>
        <label className="subs-field">
          <span>Cycle</span>
          <select name="cycle" value={form.cycle} onChange={change}>
            {CYCLES.map((cycle) => <option key={cycle} value={cycle}>{cycle}</option>)}
          </select>
        </label>
        <label className="subs-field">
          <span>Category</span>
          <select name="category" value={form.category} onChange={change}>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="subs-field subs-date-field">
          <span>Next due date</span>
          <input name="nextDueDate" type="date" value={form.nextDueDate} onChange={change} required />
        </label>
        <button className="subs-add-button" disabled={saving} type="submit">
          {saving ? "Adding…" : "Add subscription"}
        </button>
      </form>

      {error && <p className="subs-error" role="alert">{error}</p>}

      {loading ? (
        <p className="subs-status" role="status">Loading subscriptions…</p>
      ) : subs.length === 0 ? (
        <p className="subs-empty">No subscriptions yet. Add your first one above.</p>
      ) : (
        <ul className="subs-list">
          {subs.map((sub) => {
            const due = dueLabel(sub.nextDueDate);
            return (
              <li className="subs-item" key={sub._id}>
                <div className="subs-main">
                  <div className="subs-name-line">
                    <strong>{sub.name}</strong>
                    <span className="subs-amount">{money.format(sub.amount)}</span>
                  </div>
                  <span className="subs-meta">{sub.cycle} <i /> {sub.category}</span>
                  <span className={`subs-due${due.overdue ? " overdue" : ""}`}>
                    {due.text} <i /> {dateText(sub.nextDueDate)}
                  </span>
                </div>
                <div className="subs-actions">
                  <button
                    className="subs-pay-button"
                    disabled={busyId === sub._id}
                    onClick={() => markPaid(sub)}
                    type="button"
                  >
                    {busyId === sub._id ? "Saving…" : "Mark paid"}
                  </button>
                  <button
                    className="subs-delete-button"
                    disabled={busyId === sub._id}
                    onClick={() => remove(sub)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}