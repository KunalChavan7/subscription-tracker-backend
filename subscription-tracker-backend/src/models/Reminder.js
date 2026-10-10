const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    dueDate: { type: Date, required: true },
    daysBefore: { type: Number, required: true },
    channel: { type: String, enum: ["email"], default: "email" },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    sentAt: Date,
    error: String,
  },
  { timestamps: true }
);

reminderSchema.index(
  { subscription: 1, dueDate: 1, daysBefore: 1, channel: 1 },
  { unique: true }
);

module.exports = mongoose.model("Reminder", reminderSchema);