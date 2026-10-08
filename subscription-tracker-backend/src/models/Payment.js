const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
      index: true,
    },
    amountPaise: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ subscription: 1, dueDate: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);