const cron = require("node-cron");
const Subscription = require("../models/Subscription");
const Reminder = require("../models/Reminder");
const { sendMail } = require("../services/emailService");
const { ALLOWED_DAYS, DEFAULT_DAYS } = require("../utils/reminderDays");

const DAY = 24 * 60 * 60 * 1000;

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      character
    ]
  );

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function buildEmail(sub, user, daysLeft) {
  const when = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  const amount = "₹" + (sub.amountPaise / 100).toLocaleString("en-IN");
  const date = sub.nextDueDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    subject: `${sub.name} is due ${when} (${amount})`,
    text: `Hi ${user.name},\n\n${sub.name} (${amount}) is due ${when}, on ${date}.\n\nMark it as paid in the app once you've paid it.`,
    html: `<p>Hi ${esc(user.name)},</p><p><strong>${esc(sub.name)}</strong> (${amount}) is due ${when}, on ${date}.</p><p>Mark it as paid in the app once you've paid it.</p>`,
  };
}

async function runReminders({ userId } = {}) {
  const today = todayUTC();
  const last = new Date(today.getTime() + Math.max(...ALLOWED_DAYS) * DAY);
  const filter = { status: "active", nextDueDate: { $gte: today, $lte: last } };
  if (userId) filter.user = userId;

  const subs = await Subscription.find(filter).populate("user", "name email reminderPrefs");
  const result = { checked: subs.length, sent: 0, skipped: 0, failed: 0 };

  for (const sub of subs) {
    const daysLeft = Math.round((sub.nextDueDate - today) / DAY);
    if (!sub.user) continue;
    const prefs = sub.user.reminderPrefs;
    if (prefs && prefs.enabled === false) continue;
    const days = prefs && prefs.days && prefs.days.length ? prefs.days : DEFAULT_DAYS;
    if (!days.includes(daysLeft)) continue;

    try {
      const key = {
        subscription: sub._id,
        dueDate: sub.nextDueDate,
        daysBefore: daysLeft,
        channel: "email",
      };
      let reminder = await Reminder.findOne(key);
      if (reminder && reminder.status === "sent") {
        result.skipped++;
        continue;
      }
      if (!reminder) {
        try {
          reminder = await Reminder.create({ ...key, user: sub.user._id });
        } catch (err) {
          if (err.code === 11000) {
            result.skipped++;
            continue;
          }
          throw err;
        }
      }

      try {
        await sendMail({ to: sub.user.email, ...buildEmail(sub, sub.user, daysLeft) });
        reminder.status = "sent";
        reminder.sentAt = new Date();
        reminder.error = undefined;
        result.sent++;
      } catch (err) {
        reminder.status = "failed";
        reminder.error = err.message;
        result.failed++;
      }
      await reminder.save();
    } catch (err) {
      console.error("Reminder error for", sub.name, err.message);
      result.failed++;
    }
  }
  return result;
}

function startReminderJob() {
  cron.schedule(
    "0 9 * * *",
    () =>
      runReminders()
        .then((result) => console.log("Reminders:", result))
        .catch((err) => console.error("Reminder job failed:", err.message)),
    { timezone: "Asia/Kolkata" }
  );
  console.log("Reminder job scheduled for 9:00 AM IST daily");
}

module.exports = { runReminders, startReminderJob };