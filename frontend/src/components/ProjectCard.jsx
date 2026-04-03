import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";
import "./ProjectCard.css";

const STATUS_BADGE = {
  "completed":   { icon: "✅", label: "Completed",   cls: "status-completed" },
  "in-progress": { icon: "🚧", label: "In Progress", cls: "status-in-progress" },
  "idea":        { icon: "💡", label: "Idea",         cls: "status-idea" }
};

export default function ProjectCard({ project, compact = false, tile = false, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(project.likes?.length || 0);
  const [liked, setLiked] = useState(
    user ? project.likes?.map(id => id.toString()).includes(user.id) : false
  );
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(project.comments || []);
  const [newComment, setNewComment] = useState("");

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      const res = await api.post(`/projects/${project._id}/like`);
      setLikes(res.data.likes);
      setLiked(res.data.liked);
    } catch {}
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${project._id}`);
      onDelete && onDelete(project._id);
    } catch {}
  };

  const handleTagClick = (e, tag) => {
    e.stopPropagation();
    navigate(`/?tag=${encodeURIComponent(tag)}`);
  };

  const toggleComments = (e) => {
    e.stopPropagation();
    setShowComments(prev => !prev);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newComment.trim()) return;
    if (!user) return navigate("/login");
    try {
      const res = await api.post(`/projects/${project._id}/comments`, { text: newComment });
      setComments(res.data);
      setNewComment("");
    } catch {}
  };

  const handleLikeComment = async (e, commentId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login");
    try {
      const res = await api.post(`/projects/${project._id}/comments/${commentId}/like`);
      setComments(res.data);
    } catch {}
  };

  const username = project.userId?.username || "unknown";
  const userId = project.userId?._id || project.userId;
  const isOwner = user && user.id === (project.userId?._id || project.userId)?.toString();
  const isMainAdmin = user && project && user.id === (project.rootCreatorId?._id || project.rootCreatorId || project.userId?._id || project.userId)?.toString();
  const badge = STATUS_BADGE[project.status] || STATUS_BADGE["idea"];

  return (
    <div
      className={`project-card ${tile ? "tile" : ""}`}
      onClick={() => navigate(`/projects/${project._id}`)}
    >
      {tile && (
        <div className="tile-overlay">
          <div className="tile-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{likes}</span>
          </div>
          <div className="tile-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{comments.length}</span>
          </div>
        </div>
      )}

      <div className="card-header" style={{ flexWrap: "wrap", gap: "10px", alignItems: "flex-start" }}>
        <div className="card-header-left" style={{ flex: "1 1 200px", minWidth: 0 }}>
          <Avatar user={project.userId} size={32} className="card-avatar-comp" />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <Link to={`/profile/${userId}`} className="card-username" onClick={e => e.stopPropagation()} style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                @{username}
              </Link>
              {project.rootCreatorId && (project.rootCreatorId?._id || project.rootCreatorId).toString() === (project.userId?._id || project.userId).toString() ? (
                <span style={{ fontSize: "0.55rem", padding: "1px 5px", background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: "4px", fontWeight: "bold", textTransform: "uppercase", border: "1px solid rgba(168,85,247,0.2)" }}>Admin</span>
              ) : (
                <span style={{ fontSize: "0.55rem", padding: "1px 5px", background: "rgba(59,130,246,0.15)", color: "#60a5fa", borderRadius: "4px", fontWeight: "bold", textTransform: "uppercase", border: "1px solid rgba(59,130,246,0.2)" }}>Owner</span>
              )}
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--text-faint)", opacity: 0.7 }}>
              Last active {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="card-header-right" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span className={`status-badge ${badge.cls}`} style={{ whiteSpace: "nowrap" }}>{badge.icon} {badge.label}</span>
          {isOwner && (
            <div style={{ display: "flex", gap: "4px" }}>
              <button className="edit-btn" onClick={e => { e.stopPropagation(); navigate(`/projects/${project._id}/edit`); }}>✏️</button>
              <button className="delete-btn" onClick={handleDelete}>✕</button>
            </div>
          )}
        </div>
      </div>

      <h3 className="card-title">{project.title}</h3>

      {project.remixedFrom && (
        <div className="remix-label-main">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
          <em>Remixed from {project.remixedFrom.title || "a project"}</em>
        </div>
      )}

      <p className="card-desc">{project.description}</p>

      {project.tags?.length > 0 && (
        <div className="card-tags">
          {project.tags.slice(0, 4).map(tag => (
            <span key={tag} className="tag clickable-tag" onClick={e => handleTagClick(e, tag)}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {!compact && !tile && project.codeSnippet && (
        <pre className="card-snippet">{project.codeSnippet}</pre>
      )}

      <div className="card-footer">
        <div className="card-actions">
          <button className={`like-btn-p ${liked ? "liked" : ""}`} onClick={handleLike}>
            <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{likes}</span>
          </button>
          
          <button className="card-action-btn" onClick={toggleComments} title="Comments">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{comments.length}</span>
          </button>

          {user && !isOwner && (
            <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("vibe:open-chat", { detail: { userId, user: project.userId } })); }} title="Message Owner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Message</span>
            </button>
          )}

          {project.remixCount > 0 && (
            <div className="remix-count-p">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              <span>{project.remixCount}</span>
            </div>
          )}

          {(isOwner || isMainAdmin) && (project.remixAccessRequests?.some(r => r.status === "pending") || project.syncRequests?.some(r => r.status === "pending")) && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginLeft: "12px" }}>
              {(project.syncRequests?.filter(r => r.status === "pending").length > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24", fontSize: "0.7rem", fontWeight: "bold" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                    <line x1="6" y1="3" x2="6" y2="15" />
                    <circle cx="18" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M18 9a9 9 0 0 1-9 9" />
                  </svg>
                  <span>{project.syncRequests.filter(r => r.status === "pending").length}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24", fontSize: "0.7rem", fontWeight: "bold" }} title="Pending Requests">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fbbf24" }}></span>
                Requests
              </div>
            </div>
          )}
        </div>
        <span className="card-date">{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      </div>

      {showComments && !compact && !tile && (
        <div className="card-inline-comments" onClick={e => e.stopPropagation()}>
          <div className="inline-comments-list">
            {comments.slice(-3).map(c => {
              const isLiked = user && c.likes?.map(l=>l.toString()).includes(user.id);
              return (
              <div key={c._id} className="inline-comment">
                <strong>@{c.userId?.username || "unknown"}</strong>: {c.text}
                <button 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '0.4rem', color: isLiked ? 'var(--like)' : 'var(--text-faint)' }} 
                  onClick={(e) => handleLikeComment(e, c._id)}
                >
                  {isLiked ? '❤️' : '🤍'} {c.likes?.length || 0}
                </button>
              </div>
            )})}
            {comments.length > 3 && <p className="more-comments-text">View more comments on project page...</p>}
          </div>
          {user && (
            <form onSubmit={handlePostComment} className="inline-comment-form">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button type="submit">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
