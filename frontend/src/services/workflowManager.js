import api from '../api/axios';

class WorkflowManager {
  // Contributor submits a new file explicitly
  async submitUpdate({ projectId, fileName, fileContent, changeComment }) {
    const res = await api.post('/workflow/submit', {
      projectId,
      fileName,
      fileContent,
      changeComment
    });
    return res.data;
  }

  // Admin edits a file that is pending review
  async adminModify({ fileId, fileContent, adminComment }) {
    const res = await api.post('/workflow/admin-modify', {
      fileId,
      fileContent,
      adminComment
    });
    return res.data;
  }

  // Admin approves a specific version
  async approveVersion(fileId, versionId) {
    const res = await api.post('/workflow/approve', { fileId, versionId });
    return res.data;
  }

  // Admin rejects a specific version
  async rejectVersion(fileId, versionId) {
    const res = await api.post('/workflow/reject', { fileId, versionId });
    return res.data;
  }

  // Admin fetches all submissions
  async getSubmissions(projectId) {
    const res = await api.get(`/workflow/submissions`, { params: { projectId } });
    return res.data;
  }

  // Get specific file version history (Useful for the timeline)
  async getVersionHistory(projectId, fileName) {
    const res = await api.get('/workflow/version-history', { params: { projectId, fileName } });
    return res.data;
  }

  // Contributor fetches the latest approved content to sync their branch
  async syncLatest(projectId, fileName) {
    const res = await api.get('/workflow/sync', { params: { projectId, fileName } });
    return res.data;
  }
}

export default new WorkflowManager();
