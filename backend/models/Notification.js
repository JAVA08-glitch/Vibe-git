const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
  message: { type: String, required: true },
  type: { type: String, enum: ["remix-request", "remix-approved", "remix-rejected", "sync-request", "sync-approved", "sync-rejected", "general"], default: "general" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);

