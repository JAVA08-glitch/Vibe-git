import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const AdminSyncRequests = ({ projectId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  const loadRequests = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/sync-requests`);
      setRequests(res.data);
    } catch (err) {
      setError("Failed to fetch merge requests: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleRespond = async (reqId, action) => {
    setRespondingId(reqId);
    try {
      await api.post(`/projects/${projectId}/sync-request/${reqId}/respond`, { action });
      setRequests(prev => prev.filter(r => r._id !== reqId));
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setRespondingId(null);
    }
  };

  const styles = {
    desc: { margin: "0 0 1.25rem 0", fontSize: "0.82rem", color: "#a0a0a0", lineHeight: 1.6 },
    badge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(34,197,94,0.15)", color: "#4ade80", fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", marginBottom: "1rem" },
    badgeDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" },
    card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    userInfo: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 },
    avatar: { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #10b981, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 },
    userMeta: { minWidth: 0 },
    username: { margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#fff" },
    summary: { margin: "3px 0 0 0", fontSize: "0.78rem", color: "#888", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" },
    actions: { display: "flex", gap: "8px", flexShrink: 0, marginLeft: "12px" },
    approveBtn: { padding: "7px 16px", border: "none", borderRadius: "7px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "#22c55e", color: "#fff" },
    rejectBtn: { padding: "7px 16px", border: "none", borderRadius: "7px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.05)", color: "#a0a0a0", border: "1px solid rgba(255,255,255,0.1)" },
    empty: { textAlign: "center", padding: "2rem", color: "#666", fontSize: "0.85rem" },
    remixLink: { fontSize: "0.7rem", color: "#3b82f6", textDecoration: "none", display: "inline-block", marginTop: "4px" }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading merge requests...</div>;
  if (error) return <div style={{ color: "#f87171", padding: "1rem" }}>{error}</div>;

  return (
    <div>
      <p style={styles.desc}>
        Contributors who have remixed your project can request to merge their changes back. 
        Review the remix code and approve to sync their modifications into your main project.
      </p>

      {requests.length > 0 && (
        <div style={styles.badge}>
          <span style={styles.badgeDot}></span>
          {requests.length} pending merge request{requests.length > 1 ? 's' : ''}
        </div>
      )}

      {requests.length === 0 ? (
        <div style={styles.empty}>🎉 No pending merge requests</div>
      ) : (
        <div>
          {requests.map(req => (
            <div key={req._id} style={styles.card}>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {(req.requestedBy?.username || '?')[0].toUpperCase()}
                </div>
                <div style={styles.userMeta}>
                  <p style={styles.username}>@{req.requestedBy?.username || 'unknown'}</p>
                  {req.summary && <p style={styles.summary}>"{req.summary}"</p>}
                  <Link to={`/projects/${req.remixId?._id || req.remixId}/ide`} style={styles.remixLink}>
                    🔍 Review Remix Code 
                  </Link>
                </div>
              </div>
              <div style={styles.actions}>
                <button 
                  style={{ ...styles.approveBtn, opacity: respondingId === req._id ? 0.5 : 1 }}
                  onClick={() => handleRespond(req._id, 'approve')}
                  disabled={respondingId === req._id}
                >
                  {respondingId === req._id ? "..." : "Approve"}
                </button>
                <button 
                  style={{ ...styles.rejectBtn, opacity: respondingId === req._id ? 0.5 : 1 }}
                  onClick={() => handleRespond(req._id, 'decline')}
                  disabled={respondingId === req._id}
                >
                  {respondingId === req._id ? "..." : "Skip"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSyncRequests;
