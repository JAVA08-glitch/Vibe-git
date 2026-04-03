const mongoose = require("mongoose");

const workflowVersionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  fileContent: { type: String, default: "" },
  contributorComment: { type: String, default: "" },
  adminComment: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["draft", "pending_review", "admin_modified", "approved", "rejected"], default: "draft" },
  timestamp: { type: Date, default: Date.now }
});

const workflowFileSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  fileName: { type: String, required: true },
  currentVersion: { type: Number, default: 1 },
  workflowStatus: { type: String, enum: ["draft", "pending_review", "admin_modified", "approved", "rejected"], default: "draft" },
  versions: [workflowVersionSchema],
  isEditing: { type: Boolean, default: false },
  isSyncing: { type: Boolean, default: false },
  isReviewing: { type: Boolean, default: false },
});

module.exports = {
  WorkflowFile: mongoose.model("WorkflowFile", workflowFileSchema),
  WorkflowVersion: mongoose.model("WorkflowVersion", workflowVersionSchema)
};
