require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const cronRoutes = require("./routes/cronRoutes");
const { startReminderJob } = require("./jobs/reminderJob");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/cron", cronRoutes);

connectDB().then(() => {
  app.listen(process.env.PORT, () =>
    console.log(`Server running on port ${process.env.PORT}`)
  );
  startReminderJob();
});