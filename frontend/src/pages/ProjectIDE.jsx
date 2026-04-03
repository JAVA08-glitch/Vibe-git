import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import workflowManager from "../services/workflowManager";
import "./ProjectIDE.css";

const getLanguage = (filename) => {
  if (!filename) return "plaintext";
  const ext = filename.split(".").pop().toLowerCase();
  switch (ext) {
    case "js": case "jsx": return "javascript";
    case "ts": case "tsx": return "typescript";
    case "py": return "python";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    case "md": return "markdown";
    case "java": return "java";
    case "c": case "cpp": case "h": case "hpp": return "cpp";
    case "cs": return "csharp";
    case "go": return "go";
    case "rs": return "rust";
    case "rb": return "ruby";
    case "php": return "php";
    case "sql": return "sql";
    case "sh": case "bash": return "shell";
    case "env": case "example": return "ini";
    default: return "plaintext";
  }
};

export default function ProjectIDE() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncSending, setSyncSending] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [originalCode, setOriginalCode] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [changeComment, setChangeComment] = useState("");

  const hasUnsavedChanges = code !== originalCode;

  const editorRef = useRef(null);

  useEffect(() => {
    if (!user) return navigate("/login");
    const loadProject = async () => {
       try {
         const res = await api.get(`/projects/${id}`);
         setProject(res.data);
         const urlParams = new URLSearchParams(window.location.search);
         const isInspect = urlParams.get("inspect") === "true";
         const reqIdStr = urlParams.get("reqId");
         
         if (isInspect && reqIdStr) {
            // Load the pending workflow content instead of the saved original
            const versionIdStr = urlParams.get("versionId");
            // The fileId is reqIdStr for workflows. We need to find its latest content.
            // Actually, we can fetch version history and pick the specific version.
            const wRes = await api.get(`/workflow/version-history`, { params: { projectId: id, fileName: res.data.files?.[0]?.name || "codeSnippet" }});
            // This is a quick hack, but ideally we'd have a specific endpoint. 
            // In the new models, versions are returned. Let's find versionId
            const versionArray = wRes.data || [];
            const targetVersion = versionArray.find(v => v._id === versionIdStr) || versionArray[versionArray.length - 1];
            if (targetVersion) {
               setCode(targetVersion.fileContent);
               setOriginalCode(targetVersion.fileContent);
            }
         } else if (res.data.files && res.data.files.length > 0) {
           handleFileSelect(0);
         } else {
           const fallbackCode = res.data.codeSnippet || "";
           setCode(fallbackCode);
           setOriginalCode(fallbackCode);
         }
         setLoading(false);
       } catch (err) {
         navigate("/");
       }
    };
    loadProject();
  }, [id, user, navigate]);

  const handleFileSelect = async (index) => {
    setSelectedFileIndex(index);
    setFileLoading(true);
    try {
      const res = await api.get(`/projects/${id}/files/${index}/content`);
      setCode(res.data.content);
      setOriginalCode(res.data.content);
    } catch (err) {
      setCode("// Error loading file or file is not text-based.");
      setOriginalCode("");
    } finally {
      setFileLoading(false);
    }
  };

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
  }

  const handleSave = async () => {
    if (selectedFileIndex === null) {
      // Legacy snippet save
      setSaving(true);
      try {
        await api.put(`/projects/${id}`, { codeSnippet: code });
        alert("Code saved successfully!");
      } catch (err) { alert("Error saving: " + err.message); }
      finally { setSaving(false); }
      return;
    }

    setSaving(true);
    try {
      await api.put(`/projects/${id}/files/${selectedFileIndex}/content`, { content: code });
      alert("File saved successfully!");
    } catch (err) {
      alert("Error saving file: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePullUpdates = async () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("⚠️ Unsaved Changes Warning: You have unsaved edits. If you sync now, they may be overwritten. Proceed anyway?")) {
        return;
      }
    } else {
      if (!window.confirm("Pull latest approved changes from the original project?")) return;
    }

    try {
      const fileName = selectedFileIndex !== null ? project.files[selectedFileIndex].name : null;
      if (fileName) {
         // Use new workflow sync API
         const latestVersion = await workflowManager.syncLatest(project.remixedFrom._id || project.remixedFrom, fileName);
         setCode(latestVersion.fileContent);
         setOriginalCode(latestVersion.fileContent);
         alert("Successfully synced latest changes!");
      } else {
         // Legacy pull
         const res = await api.post(`/projects/${id}/pull`);
         setProject(res.data);
         setCode(res.data.codeSnippet || "");
         setOriginalCode(res.data.codeSnippet || "");
         alert("Successfully synced latest changes!");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to pull updates");
    }
  };

  const handlePushToOriginal = async () => {
    if (!changeComment.trim()) {
      alert("Please provide a comment for your changes.");
      return;
    }
    setSyncSending(true);
    try {
      const fileName = selectedFileIndex !== null ? project.files[selectedFileIndex].name : "codeSnippet";
      const projectId = project.remixedFrom ? (project.remixedFrom._id || project.remixedFrom) : project._id;
      
      await workflowManager.submitUpdate({
         projectId,
         fileName,
         fileContent: code,
         changeComment
      });

      alert("✓ Submission successful! Admin can now review your changes.");
      setShowSubmitModal(false);
      setChangeComment("");
      setOriginalCode(code); // Mark as saved
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message || "Could not submit"}`);
    } finally {
      setSyncSending(false);
    }
  };

  if (loading) return <div className="ide-loading"><div className="spinner"></div>Loading Vibe IDE...</div>;

  const isOwner = user && project && user.id === (project.userId?._id || project.userId)?.toString();
  const isRootCreator = user && project && project.rootCreatorId && user.id === (project.rootCreatorId._id || project.rootCreatorId).toString();
  const canAccess = isOwner || isRootCreator;
  const isRemix = !!project.remixedFrom;

  // Inspect mode detects if root creator is viewing
  const urlParams = new URLSearchParams(window.location.search);
  const isInspectMode = isRootCreator && !isOwner && urlParams.get("inspect") === "true";
  const reqId = urlParams.get("reqId");

  if (!canAccess) {
    return (
      <div className="ide-msg-container">
        <p>🔒 You must be the owner of this branch to use the IDE.</p>
        <button className="ide-btn" onClick={() => navigate(`/projects/${id}`)}>Go Back</button>
      </div>
    );
  }

  const handleRespondSync = async (action) => {
    try {
      if (action === "approve") {
        await workflowManager.approveVersion(reqId, urlParams.get("versionId"));
      } else if (action === "decline") {
        await workflowManager.rejectVersion(reqId, urlParams.get("versionId"));
      }
      alert(`Successfully ${action === "approve" ? "approved" : "declined"}!`);
      navigate("/dashboard");
    } catch(err) {
       alert(err.response?.data?.message || err.message || `Failed to ${action}`);
    }
  };

  const handleAdminModify = async () => {
    if (!changeComment.trim()) {
      alert("Please provide an admin comment for the modifications.");
      return;
    }
    setSaving(true);
    try {
      await workflowManager.adminModify({
        fileId: reqId,
        fileContent: code,
        adminComment: changeComment
      });
      alert("✓ Modifications uploaded successfully!");
      setShowSubmitModal(false);
      setChangeComment("");
      setOriginalCode(code);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to upload corrections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ide-container">
      <div className="ide-header">
        <div className="ide-header-left">
          <Link to={isInspectMode ? "/dashboard" : `/projects/${id}`} className="ide-back-btn">← Back</Link>
          <div className="ide-title-block">
            <span className="ide-title">{project.title}</span>
            {isRemix && <span className="ide-badge">Branch</span>}
            {isInspectMode && <span className="ide-badge inspect-mode" style={{marginLeft: "10px", background: "#f472b6"}}>Inspect Mode</span>}
          </div>
        </div>
        <div className="ide-header-right">
          <button className="ide-btn" onClick={() => window.open(`${api.defaults.baseURL}/projects/${id}/download`)} title="Download ZIP">
            📥 ZIP
          </button>
          
          {isInspectMode ? (
            <>
               <button className="ide-btn" style={{background: "#3b82f6", color: "#fff"}} onClick={() => setShowSubmitModal(true)}>✏️ Upload Corrections</button>
               <button className="ide-btn" style={{background: "#34d399", color: "#000"}} onClick={() => handleRespondSync('approve')}>✓ Approve Merge</button>
               <button className="ide-btn" style={{background: "#ff5f56", color: "#fff"}} onClick={() => handleRespondSync('decline')}>✕ Decline Merge</button>
            </>
          ) : (
            <>
              <button className="ide-btn save-btn" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "💾 Save"}
              </button>
              {isRemix && (
                <>
                  <button className="ide-btn pull-btn" onClick={handlePullUpdates}>
                    ⬇ Sync Updates
                  </button>
                  <button className="ide-btn push-btn" onClick={() => setShowSubmitModal(true)} disabled={syncSending}>
                    {syncSending ? "Submitting..." : "⬆ Submit Update"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="ide-main">
         <div className="ide-sidebar">
            <div className="sidebar-section">
              <h4>Vibe Navigator</h4>
              <div className="file-tree">
                {project.files && project.files.length > 0 ? (
                  project.files.map((file, i) => (
                    <div 
                      key={i} 
                      className={`file-item ${selectedFileIndex === i ? "active" : ""}`}
                      onClick={() => handleFileSelect(i)}
                    >
                      <span className="file-icon">📄</span>
                      <span className="file-name">{file.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-files">No project files found.</p>
                )}
              </div>
            </div>
            
            <div className="sidebar-section divider"></div>

            <div className="sidebar-section">
              <h4>Project Desc</h4>
              <p className="sidebar-desc">{project.description}</p>
            </div>
            {isRemix && (
              <div className="sidebar-section">
                <h4>Sync Control</h4>
                <div className="sidebar-hint">
                  <p><strong>Pull</strong> to fetch latest original code.</p>
                  <p><strong>Push</strong> to suggest your edits back.</p>
                </div>
              </div>
            )}
         </div>
         <div className="ide-editor-wrapper">
           {fileLoading ? (
             <div className="editor-loading">Loading file...</div>
           ) : (
             <Editor
               height="100%"
               language={selectedFileIndex !== null ? getLanguage(project.files[selectedFileIndex].name) : "javascript"}
               theme="vs-dark"
               value={code}
               onChange={(value) => setCode(value)}
               onMount={handleEditorDidMount}
               options={{
                 minimap: { enabled: false },
                 fontSize: 14,
                 wordWrap: "on",
                 fontFamily: "'Fira Code', monospace",
                 smoothScrolling: true,
                 cursorBlinking: "smooth"
               }}
             />
           )}
         </div>
      </div>
      
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: "var(--bg-secondary)", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "100%" }}>
             <h3 style={{ marginTop: 0 }}>Submit Update</h3>
             <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "16px" }}>Describe what changed so the admin can review it easily.</p>
             <textarea 
               value={changeComment} 
               onChange={e => setChangeComment(e.target.value)}
               placeholder="e.g., Fixed minor bug in header loop"
               style={{ width: "100%", padding: "12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text)", minHeight: "80px", marginBottom: "16px" }}
             />
             <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
               <button className="ide-btn" style={{ background: "transparent", border: "1px solid var(--border)" }} onClick={() => setShowSubmitModal(false)}>Cancel</button>
               {isInspectMode ? (
                 <button className="ide-btn" style={{ background: "#3b82f6", color: "#fff" }} onClick={handleAdminModify} disabled={saving}>
                   {saving ? "Uploading..." : "Upload Corrections"}
                 </button>
               ) : (
                 <button className="ide-btn" style={{ background: "var(--accent)", color: "#fff" }} onClick={handlePushToOriginal} disabled={syncSending}>
                   {syncSending ? "Submitting..." : "Submit"}
                 </button>
               )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
