const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { WorkflowFile, WorkflowVersion } = require("../models/Workflow");
const Project = require("../models/Project");

// POST /workflow/submit
router.post("/submit", auth, async (req, res) => {
  try {
    const { projectId, fileName, fileContent, changeComment } = req.body;
    
    // Find or create WorkflowFile
    let workflowFile = await WorkflowFile.findOne({ projectId, fileName });
    if (!workflowFile) {
      workflowFile = new WorkflowFile({ projectId, fileName, currentVersion: 0 });
    }

    const nextVersionNumber = workflowFile.currentVersion + 1;

    const newVersion = {
      versionNumber: nextVersionNumber,
      fileContent,
      contributorComment: changeComment,
      createdBy: req.user.id,
      status: "pending_review"
    };

    workflowFile.versions.push(newVersion);
    workflowFile.currentVersion = nextVersionNumber;
    workflowFile.workflowStatus = "pending_review";
    await workflowFile.save();

    res.json({ message: "Update submitted successfully!", workflowFile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /workflow/admin-modify
router.post("/admin-modify", auth, async (req, res) => {
  try {
    const { fileId, fileContent, adminComment } = req.body;
    
    const workflowFile = await WorkflowFile.findById(fileId);
    if (!workflowFile) return res.status(404).json({ message: "File not found" });

    const nextVersionNumber = workflowFile.currentVersion + 1;

    const newVersion = {
      versionNumber: nextVersionNumber,
      fileContent,
      adminComment,
      createdBy: req.user.id,
      status: "admin_modified"
    };

    workflowFile.versions.push(newVersion);
    workflowFile.currentVersion = nextVersionNumber;
    workflowFile.workflowStatus = "admin_modified";
    await workflowFile.save();

    res.json({ message: "Admin modifications saved!", workflowFile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /workflow/approve
router.post("/approve", auth, async (req, res) => {
  try {
    const { fileId, versionId } = req.body;
    const workflowFile = await WorkflowFile.findById(fileId);
    if (!workflowFile) return res.status(404).json({ message: "File not found" });

    const version = workflowFile.versions.id(versionId);
    if (!version) return res.status(404).json({ message: "Version not found" });

    version.status = "approved";
    workflowFile.workflowStatus = "approved";
    
    // Auto-update Project files model with new approved content
    const project = await Project.findById(workflowFile.projectId);
    if (project) {
        // If content is not synced automatically, we assume it's read dynamically vs statically.
        // For now, update the project files
        // (Assuming files array is just metadata in VibeGit, but handled via physical files, we might need a physical update. 
        // We'll trust the workflow version history as the source of truth for the codebase).
    }

    await workflowFile.save();
    res.json({ message: "Version approved!", workflowFile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /workflow/reject
router.post("/reject", auth, async (req, res) => {
  try {
    const { fileId, versionId } = req.body;
    const workflowFile = await WorkflowFile.findById(fileId);
    if (!workflowFile) return res.status(404).json({ message: "File not found" });

    const version = workflowFile.versions.id(versionId);
    if (!version) return res.status(404).json({ message: "Version not found" });

    version.status = "rejected";
    workflowFile.workflowStatus = "rejected";
    await workflowFile.save();

    res.json({ message: "Version rejected!", workflowFile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /workflow/submissions
// Admin calls this to get all pending files
router.get("/submissions", auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId required" });
    
    const files = await WorkflowFile.find({ 
      projectId, 
      workflowStatus: { $in: ["pending_review", "admin_modified"] } 
    }).populate("versions.createdBy", "username avatar");

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /workflow/version-history
router.get("/version-history", auth, async (req, res) => {
  try {
    const { projectId, fileName } = req.query;
    const workflowFile = await WorkflowFile.findOne({ projectId, fileName })
                                           .populate("versions.createdBy", "username avatar");
    if (!workflowFile) return res.json([]);

    res.json(workflowFile.versions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /workflow/sync
router.get("/sync", auth, async (req, res) => {
   try {
     const { projectId, fileName } = req.query;
     const workflowFile = await WorkflowFile.findOne({ projectId, fileName })
                                            .populate("versions.createdBy", "username avatar");
     
     if (!workflowFile) {
       return res.status(404).json({ message: "No workflow found for this file." });
     }

     // Find the latest approved version
     const approvedVersions = workflowFile.versions.filter(v => v.status === "approved");
     if (approvedVersions.length === 0) {
       return res.status(404).json({ message: "No approved versions available." });
     }

     const latestApproved = approvedVersions[approvedVersions.length - 1];
     res.json(latestApproved);
   } catch (err) {
     res.status(500).json({ message: err.message });
   }
});

module.exports = router;
