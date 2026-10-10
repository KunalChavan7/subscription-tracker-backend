const router = require("express").Router();
const crypto = require("crypto");
const { runReminders } = require("../jobs/reminderJob");

router.post("/reminders", async (req, res) => {
  const secret = process.env.CRON_SECRET || "";
  const given = Buffer.from(req.headers["x-cron-secret"] || "");
  const expected = Buffer.from(secret);
  const ok = secret && given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) return res.status(401).json({ message: "Unauthorized" });

  try {
    res.json(await runReminders());
  } catch (err) {
    res.status(500).json({ message: "Reminder run failed" });
  }
});

module.exports = router;