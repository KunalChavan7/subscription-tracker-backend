const Subscription = require("../models/Subscription");

const DAY = 24 * 60 * 60 * 1000;
const MONTHLY_FACTOR = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

function startOfTodayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

const rupees = (paise) => Math.round(paise) / 100;

exports.summary = async (req, res) => {
  try {
    const subs = await Subscription.find({ user: req.userId, status: "active" }).sort({
      nextDueDate: 1,
    });

    const today = startOfTodayUTC();
    const in7 = new Date(today.getTime() + 7 * DAY);
    const in30 = new Date(today.getTime() + 30 * DAY);

    const shape = (s) => ({
      id: s._id,
      name: s.name,
      amount: rupees(s.amountPaise),
      cycle: s.cycle,
      category: s.category,
      nextDueDate: s.nextDueDate,
      daysLeft: Math.round((s.nextDueDate - today) / DAY),
    });

    const overdue = subs.filter((s) => s.nextDueDate < today);
    const dueSoon = subs.filter((s) => s.nextDueDate >= today && s.nextDueDate < in7);
    const upcoming = subs.filter((s) => s.nextDueDate >= in7 && s.nextDueDate < in30);

    const sum = (list) => list.reduce((t, s) => t + s.amountPaise, 0);

    let monthlyPaise = 0;
    const byCategory = {};
    for (const s of subs) {
      const m = s.amountPaise * MONTHLY_FACTOR[s.cycle];
      monthlyPaise += m;
      byCategory[s.category] = (byCategory[s.category] || 0) + m;
    }

    res.json({
      activeCount: subs.length,
      monthlySpend: rupees(monthlyPaise),
      yearlySpend: rupees(monthlyPaise * 12),
      overdueTotal: rupees(sum(overdue)),
      dueIn30DaysTotal: rupees(sum(dueSoon) + sum(upcoming)),
      overdue: overdue.map(shape),
      dueSoon: dueSoon.map(shape),
      upcoming: upcoming.map(shape),
      byCategory: Object.entries(byCategory)
        .map(([category, p]) => ({ category, monthlySpend: rupees(p) }))
        .sort((a, b) => b.monthlySpend - a.monthlySpend),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};