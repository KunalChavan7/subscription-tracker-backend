const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    amountPaise: { type: Number, required: true, min: 0 },
    cycle: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },
    nextDueDate: { type: Date, required: true, index: true },
    category: {
      type: String,
      enum: ["entertainment", "utilities", "rent", "emi", "insurance", "education", "other"],
      default: "other",
    },
    status: { type: String, enum: ["active", "paused", "cancelled"], default: "active" },
    paymentMethod: {
      type: String,
      enum: ["upi_autopay", "card", "manual", "other"],
      default: "manual",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

subscriptionSchema.virtual("amount").get(function () {
  return this.amountPaise / 100;
});
subscriptionSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);