const router = require("express").Router();
const auth = require("../middleware/auth");
const { runReminders } = require("../jobs/reminderJob");

router.use(auth);

router.post("/run", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }
  try {
    res.json(await runReminders({ userId: req.userId }));
  } catch (err) {
    res.status(500).json({ message: "Reminder run failed" });
  }
});

module.exports = router;