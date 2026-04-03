const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

// POST /branches/:branchId/merge
router.post("/:branchId/merge", auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.branchId);
    if (!branch) return res.status(404).json({ message: "Branch not found" });

    const project = await Project.findById(branch.sourceProjectId);
    if (!project) return res.status(404).json({ message: "Source project not found" });

    const ownerId = project.owner?.toString() || project.userId?.toString();
    if (ownerId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: Only the project owner can merge branches." });
    }

    const remixProject = await Project.findById(branch.remixProjectId);
    if (!remixProject) return res.status(404).json({ message: "Remix project not found" });

    // Snapshot original's current state first
    if (!Array.isArray(project.versions)) project.versions = [];
    if (!project.currentVersion) project.currentVersion = 1;

    project.versions.push({
      versionNumber: project.currentVersion,
      title:         project.title,
      description:   project.description,
      codeSnippet:   project.codeSnippet || "",
      about:         project.about,
      status:        project.status || "idea",
      tags:          project.tags || [],
      domain:        project.domain || "",
      editedAt:      new Date()
    });

    // Apply remix content to original
    project.title       = remixProject.title.replace(" (Remix)", "").trim();
    project.description = remixProject.description;
    project.codeSnippet = remixProject.codeSnippet;
    project.about       = remixProject.about;
    project.tags        = remixProject.tags;
    project.domain      = remixProject.domain;
    project.files       = remixProject.files;
    project.currentVersion += 1;
    project.updatedAt   = new Date();

    await project.save();

    // Mark branch as merged
    branch.status = "merged";
    await branch.save();

    res.json({ message: "Branch merged successfully and project updated.", project });
  } catch (err) {
    res.status(500).json({ message: "Error merging branch: " + err.message });
  }
});

module.exports = router;
