const User = require("../models/User");
const { ALLOWED_DAYS, DEFAULT_DAYS } = require("../utils/reminderDays");

const shape = (user) => ({
  name: user.name,
  email: user.email,
  reminderPrefs: {
    enabled: user.reminderPrefs?.enabled !== false,
    days: user.reminderPrefs?.days?.length ? [...user.reminderPrefs.days] : [...DEFAULT_DAYS],
  },
});

exports.get = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(shape(user));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.update = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const incoming = req.body?.reminderPrefs || {};
    let { enabled, days } = shape(user).reminderPrefs;

    if (incoming.enabled !== undefined) {
      if (typeof incoming.enabled !== "boolean") {
        return res.status(400).json({ message: "enabled must be true or false" });
      }
      enabled = incoming.enabled;
    }

    if (incoming.days !== undefined) {
      const valid =
        Array.isArray(incoming.days) &&
        incoming.days.every((day) => Number.isInteger(day) && ALLOWED_DAYS.includes(day));
      if (!valid) {
        return res.status(400).json({ message: `Days must be from: ${ALLOWED_DAYS.join(", ")}` });
      }
      days = [...new Set(incoming.days)].sort((a, b) => b - a);
    }

    if (enabled && days.length === 0) {
      return res.status(400).json({ message: "Pick at least one reminder day" });
    }

    user.reminderPrefs = { enabled, days };
    await user.save();
    res.json(shape(user));
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};