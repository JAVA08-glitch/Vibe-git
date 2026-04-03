import React, { useState, useEffect } from 'react';
import { fetchRemixRequests, respondToRemixRequest } from '../api/remixApi';

const AdminRemixRequests = ({ projectId }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await fetchRemixRequests(projectId);
      setPendingRequests(res.data);
    } catch (err) {
      console.error(err);
      setError("No pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleRespond = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      await respondToRemixRequest(projectId, requestId, action);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert("Error responding to request: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Styles ── */
  const styles = {
    container: { margin: 0 },
    desc: { margin: "0 0 1.25rem 0", fontSize: "0.82rem", color: "#a0a0a0", lineHeight: 1.6 },
    badge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", marginBottom: "1rem" },
    badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" },
    empty: { textAlign: "center", padding: "2rem 1rem", color: "#666", fontSize: "0.85rem" },
    emptyIcon: { fontSize: "2rem", marginBottom: "0.5rem", display: "block" },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s, background 0.2s" },
    cardHover: { borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" },
    userInfo: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 },
    avatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 },
    userMeta: { minWidth: 0 },
    username: { margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#fff" },
    message: { margin: "3px 0 0 0", fontSize: "0.78rem", color: "#888", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "280px" },
    statusBadge: { margin: "5px 0 0 0", display: "inline-block", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "rgba(250,204,21,0.12)", color: "#fbbf24" },
    actions: { display: "flex", gap: "8px", flexShrink: 0, marginLeft: "12px" },
    approveBtn: { padding: "7px 16px", border: "none", borderRadius: "7px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "#22c55e", color: "#fff", transition: "opacity 0.2s, transform 0.1s" },
    rejectBtn: { padding: "7px 16px", border: "none", borderRadius: "7px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "#ef4444", color: "#fff", transition: "opacity 0.2s, transform 0.1s" },
    loader: { textAlign: "center", padding: "2rem", color: "#888", fontSize: "0.85rem" },
    error: { textAlign: "center", padding: "1rem", color: "#f87171", fontSize: "0.85rem", background: "rgba(239,68,68,0.08)", borderRadius: "8px" },
  };

  if (loading) return <div style={styles.loader}>Loading remix requests...</div>;
  if (error) return <div style={styles.empty}><span style={styles.emptyIcon}>📭</span>{error}</div>;

  return (
    <div style={styles.container}>
      <p style={styles.desc}>
        <strong>Note: A Remix Request is only asking for permission to clone this project. No code has been changes yet.</strong><br/>
        Approve to grant them a private working branch. Any actual code changes they make will appear later in your <strong>Admin Dashboard</strong> as a "Sync Request", where you can inspect their code before merging.
      </p>

      {pendingRequests.length > 0 && (
        <div style={styles.badge}>
          <span style={styles.badgeDot}></span>
          {pendingRequests.length} request{pendingRequests.length > 1 ? 's' : ''} total
        </div>
      )}

      {pendingRequests.length === 0 ? (
        <div style={styles.empty}>
          <span style={styles.emptyIcon}>📭</span>
          No remix requests
        </div>
      ) : (
        <div>
          {pendingRequests.map(req => (
            <div 
              key={req._id} 
              style={styles.card}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            >
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {(req.userId?.username || '?')[0].toUpperCase()}
                </div>
                <div style={styles.userMeta}>
                  <p style={styles.username}>@{req.userId?.username || req.userId || 'Unknown'}</p>
                  {req.message && <p style={styles.message}>"{req.message}"</p>}
                  <span style={{ 
                    ...styles.statusBadge, 
                    background: req.status === "pending" ? "rgba(250,204,21,0.15)" : req.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                    color: req.status === "pending" ? "#fbbf24" : req.status === "approved" ? "#4ade80" : "#f87171"
                  }}>
                    {req.status === "pending" ? "⏳ Pending" : req.status === "approved" ? "✅ Approved" : "❌ Rejected"}
                  </span>
                </div>
              </div>
              
              {req.status === "pending" && (
                <div style={styles.actions}>
                  <button 
                    style={{ ...styles.approveBtn, opacity: actionLoading === req._id ? 0.5 : 1 }}
                    onClick={() => handleRespond(req._id, 'approve')}
                    disabled={actionLoading === req._id}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {actionLoading === req._id ? "..." : "Approve"}
                  </button>
                  <button 
                    style={{ ...styles.rejectBtn, opacity: actionLoading === req._id ? 0.5 : 1 }}
                    onClick={() => handleRespond(req._id, 'reject')}
                    disabled={actionLoading === req._id}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.95)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {actionLoading === req._id ? "..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRemixRequests;
