import React, { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * ContributorChanges — Path-based change review for the Code Syncs tab
 * Shows sync requests with file-level detail for admin review
 */
const ContributorChanges = ({ projectId, isOwner, syncRequests, syncLoading, respondingId, onRespond }) => {
  const [expandedReq, setExpandedReq] = useState(null);

  /* ── Styles ── */
  const s = {
    wrapper: { margin: 0 },
    desc: { margin: "0 0 1.25rem 0", fontSize: "0.82rem", color: "#a0a0a0", lineHeight: 1.7 },

    // Workflow Steps
    stepsBar: { display: "flex", alignItems: "center", gap: "0", marginBottom: "1.5rem", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)", overflow: "auto" },
    step: (active) => ({ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "8px", background: active ? "rgba(59,130,246,0.12)" : "transparent", border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent", transition: "all 0.2s", whiteSpace: "nowrap" }),
    stepNum: (active) => ({ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, background: active ? "#3b82f6" : "rgba(255,255,255,0.08)", color: active ? "#fff" : "#666", flexShrink: 0 }),
    stepLabel: (active) => ({ fontSize: "0.78rem", fontWeight: 600, color: active ? "#fff" : "#666" }),
    stepArrow: { color: "#333", fontSize: "0.8rem", margin: "0 4px", flexShrink: 0 },

    // Empty State
    empty: { textAlign: "center", padding: "2.5rem 1rem", color: "#555" },
    emptyIcon: { fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" },
    emptyText: { fontSize: "0.85rem", color: "#777" },

    // Request Card
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", marginBottom: "12px", overflow: "hidden", transition: "border-color 0.2s" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", cursor: "pointer", transition: "background 0.15s" },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 },
    avatar: (letter) => ({ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }),
    cardMeta: { minWidth: 0 },
    cardUser: { margin: 0, fontSize: "0.88rem", fontWeight: 700, color: "#fff" },
    cardTime: { margin: "2px 0 0 0", fontSize: "0.72rem", color: "#666" },
    cardRight: { display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 },
    fileCount: { fontSize: "0.72rem", padding: "4px 10px", borderRadius: "6px", background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontWeight: 700 },
    expandIcon: (open) => ({ fontSize: "0.75rem", color: "#888", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }),

    // File Diff List
    diffList: { padding: "0 18px 14px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" },
    diffHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 8px 0" },
    diffTitle: { fontSize: "0.78rem", fontWeight: 700, color: "#ddd" },
    diffFile: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", marginBottom: "4px", transition: "background 0.15s" },
    diffFileName: { display: "flex", alignItems: "center", gap: "8px", minWidth: 0 },
    diffBadge: (type) => {
      const colors = { modified: { bg: "rgba(250,204,21,0.1)", color: "#fbbf24", label: "modified" }, added: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "added" }, removed: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "removed" } };
      const c = colors[type] || colors.modified;
      return { fontSize: "0.65rem", padding: "2px 7px", borderRadius: "4px", background: c.bg, color: c.color, fontWeight: 700, marginLeft: "auto", flexShrink: 0 };
    },

    // Action Buttons
    actions: { display: "flex", gap: "8px", padding: "0 18px 16px 18px" },
    approveBtn: { flex: 1, padding: "10px", border: "none", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", background: "#22c55e", color: "#fff", transition: "opacity 0.2s" },
    rejectBtn: { flex: 1, padding: "10px", border: "none", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", transition: "opacity 0.2s" },
  };

  const workflowSteps = [
    { num: 1, label: "Request Remix" },
    { num: 2, label: "Get Approved" },
    { num: 3, label: "Edit in Web IDE" },
    { num: 4, label: "Submit Changes" },
    { num: 5, label: "Admin Reviews" },
  ];

  const formatTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={s.wrapper}>
      {/* Workflow Steps */}
      <div style={s.stepsBar}>
        {workflowSteps.map((step, i) => (
          <React.Fragment key={step.num}>
            <div style={s.step(step.num === 5)}>
              <span style={s.stepNum(step.num === 5)}>{step.num}</span>
              <span style={s.stepLabel(step.num === 5)}>{step.label}</span>
            </div>
            {i < workflowSteps.length - 1 && <span style={s.stepArrow}>→</span>}
          </React.Fragment>
        ))}
      </div>

      <p style={s.desc}>
        Review contributor change requests below. Each request shows which files were modified. 
        Approve to merge changes into your project, or reject to keep your project unchanged.
      </p>

      {/* Content */}
      {syncLoading ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>⏳</span>
          <p style={s.emptyText}>Loading change requests...</p>
        </div>
      ) : syncRequests.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>📭</span>
          <p style={s.emptyText}>No pending change requests</p>
          <p style={{ ...s.emptyText, fontSize: "0.75rem", marginTop: "4px" }}>When contributors submit sync requests, they'll appear here for your review.</p>
        </div>
      ) : (
        <div>
          {syncRequests.map(req => {
            const isOpen = expandedReq === req._id;
            // Derive file changes from rem remix data
            const changedFiles = req.changedFiles || req.remixId?.files?.map(f => ({ path: f.name, type: 'modified' })) || [];
            const username = req.requestedBy?.username || 'Unknown';

            return (
              <div key={req._id} style={{ ...s.card, borderColor: isOpen ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)" }}>
                {/* Card Header */}
                <div 
                  style={s.cardHeader}
                  onClick={() => setExpandedReq(isOpen ? null : req._id)}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={s.cardLeft}>
                    <div style={s.avatar()}>
                      {username[0].toUpperCase()}
                    </div>
                    <div style={s.cardMeta}>
                      <p style={s.cardUser}>@{username}</p>
                      <p style={s.cardTime}>{formatTime(req.createdAt)} · Merge request received</p>
                    </div>
                  </div>
                  <div style={s.cardRight}>
                    {changedFiles.length > 0 && (
                      <span style={s.fileCount}>{changedFiles.length} file{changedFiles.length > 1 ? 's' : ''}</span>
                    )}
                    <span style={s.expandIcon(isOpen)}>▼</span>
                  </div>
                </div>

                {/* Expanded: File Changes */}
                {isOpen && (
                  <>
                    <div style={s.diffList}>
                      <div style={s.diffHeader}>
                        <span style={s.diffTitle}>Changed Files</span>
                      </div>
                      {changedFiles.length === 0 ? (
                        <p style={{ fontSize: "0.78rem", color: "#888", padding: "8px 0" }}>No file details available for this request.</p>
                      ) : (
                        changedFiles.map((f, i) => (
                          <div 
                            key={i} 
                            style={s.diffFile}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                          >
                            <div style={s.diffFileName}>
                              <span style={{ fontSize: "0.8rem" }}>📝</span>
                              <span style={{ fontSize: "0.8rem", color: "#ccc" }}>{f.path || f.name || f}</span>
                            </div>
                            <span style={s.diffBadge(f.type || 'modified')}>{f.type || 'modified'}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Actions */}
                    <div style={s.actions}>
                      <button 
                        style={{ ...s.approveBtn, opacity: respondingId === req._id ? 0.5 : 1 }}
                        disabled={respondingId === req._id}
                        onClick={() => onRespond(req._id, "approve")}
                      >
                        {respondingId === req._id ? "Processing..." : "Merge"}
                      </button>
                      <button 
                        style={{ ...s.rejectBtn, opacity: respondingId === req._id ? 0.5 : 1 }}
                        disabled={respondingId === req._id}
                        onClick={() => onRespond(req._id, "decline")}
                      >
                        {respondingId === req._id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContributorChanges;
