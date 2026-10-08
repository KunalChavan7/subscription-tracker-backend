const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const { addCycle } = require("../utils/dates");

const ALLOWED = [
  "name",
  "amount",
  "cycle",
  "nextDueDate",
  "category",
  "status",
  "paymentMethod",
  "notes",
];

function buildData(body = {}) {
  const data = {};
  for (const key of ALLOWED) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  if (data.amount !== undefined) {
    data.amountPaise = Math.round(Number(data.amount) * 100);
    delete data.amount;
  }
  return data;
}

function handleError(err, res) {
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: "Server error" });
}

exports.create = async (req, res) => {
  try {
    const sub = await Subscription.create({ ...buildData(req.body), user: req.userId });
    res.status(201).json(sub);
  } catch (err) {
    handleError(err, res);
  }
};

exports.list = async (req, res) => {
  try {
    const filter = { user: req.userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const subs = await Subscription.find(filter).sort({ nextDueDate: 1 });
    res.json(subs);
  } catch (err) {
    handleError(err, res);
  }
};

exports.getOne = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json(sub);
  } catch (err) {
    handleError(err, res);
  }
};

exports.update = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      buildData(req.body),
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json(sub);
  } catch (err) {
    handleError(err, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    handleError(err, res);
  }
};

exports.markPaid = async (req, res) => {
  let payment;
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.userId });
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const dueDate = sub.nextDueDate;
    payment = await Payment.create({
      user: req.userId,
      subscription: sub._id,
      amountPaise: sub.amountPaise,
      dueDate,
    });

    const nextDueDate = addCycle(dueDate, sub.cycle);
    const updatedSub = await Subscription.findOneAndUpdate(
      { _id: sub._id, user: req.userId, nextDueDate: dueDate },
      { $set: { nextDueDate } },
      { new: true, runValidators: true }
    );

    if (!updatedSub) {
      await Payment.deleteOne({ _id: payment._id });
      return res.status(409).json({ message: "Subscription was already paid" });
    }

    res.status(201).json({ payment, subscription: updatedSub });
  } catch (err) {
    if (payment) await Payment.deleteOne({ _id: payment._id }).catch(() => {});
    if (err.code === 11000) {
      return res.status(409).json({ message: "Subscription was already paid" });
    }
    handleError(err, res);
  }
};

exports.listPayments = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.userId }).select("_id");
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    const payments = await Payment.find({ subscription: sub._id, user: req.userId }).sort({
      paidAt: -1,
    });
    res.json(payments);
  } catch (err) {
    handleError(err, res);
  }
};