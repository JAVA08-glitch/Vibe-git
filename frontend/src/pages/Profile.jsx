import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ProjectCard from "../components/ProjectCard";
import Avatar from "../components/Avatar";
import "./Profile.css";

const AVATAR_BASE = "http://localhost:5000/uploads/";
const ACCENTS = ["#a78bfa", "#f472b6", "#34d399", "#60a5fa", "#fb923c", "#facc15"];
const FONT_SIZES = [{ label: "S", value: "13px" }, { label: "M", value: "15px" }, { label: "L", value: "17px" }];

function vibeScore(originalCount, remixSyncCount) {
  return Math.min(100, originalCount * 10 + remixSyncCount * 5);
}

export default function Profile({ openChat }) {
  const { id } = useParams();
  const { user } = useAuth();
  const { layout, accent, setAccent } = useTheme();
  const [showCustomize, setShowCustomize] = useState(false);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("fontSize") || "15px");
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [localLayout, setLocalLayout] = useState(layout);
  const [activeTab, setActiveTab] = useState("projects");
  const [draft, setDraft] = useState(null);
  const [showFollowModal, setShowFollowModal] = useState(null); // "followers" | "following" | null
  const [followList, setFollowList] = useState([]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    // Check for draft if it's own profile
    if (user && user.id === id) {
      const saved = localStorage.getItem("vibe:project_draft");
      if (saved) setDraft(JSON.parse(saved));
    }
    
    Promise.all([
      api.get(`/users/${id}`),
      api.get(`/users/${id}/projects`)
    ]).then(([userRes, projRes]) => {
      setProfile(userRes.data);
      setProjects(projRes.data);
      setFollowerCount(userRes.data.followers?.length || 0);
      setFollowing(user ? userRes.data.followers?.map(f => f.toString()).includes(user.id) : false);
    }).finally(() => setLoading(false));
  }, [id, user]);

  const handleFollow = async () => {
    if (!user) return;
    const res = await api.post(`/users/${id}/follow`);
    setFollowing(res.data.following);
    setFollowerCount(res.data.followerCount);
  };

  const handleDelete = (deletedId) => setProjects(prev => prev.filter(p => p._id !== deletedId));

  const openFollowModal = async (type) => {
    setShowFollowModal(type);
    setFollowList([]);
    try {
      const res = await api.get(`/users/${id}`);
      const ids = type === "followers" ? res.data.followers : res.data.following;
      if (!ids?.length) return;
      const users = await Promise.all(ids.map(uid => api.get(`/users/${uid}`).then(r => r.data).catch(() => null)));
      setFollowList(users.filter(Boolean));
    } catch {}
  };

  if (loading) return <p className="loading">Loading profile...</p>;
  if (!profile) return <p className="loading">User not found.</p>;

  const isOwnProfile = user && user.id === id;
  const originalProjects = projects.filter(p => !p.remixedFrom).length;
  const remixSyncProjects = projects.filter(p => p.remixedFrom || p.remixCount > 0).length;
  const score = vibeScore(originalProjects, remixSyncProjects);

  return (
    <div className="profile-page">
      {/* Instagram-style header */}
      <div className="profile-header">
        <div className="profile-left">
          <Avatar user={profile} size={140} />
        </div>

        <div className="profile-right">
          <div className="profile-top-row">
            <h2 className="profile-username">@{profile.username}</h2>
            {isOwnProfile ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>
                <Link to={`/profile/${id}/edit`} className="edit-profile-btn">Edit Profile</Link>
                <button
                  className="edit-profile-btn"
                  onClick={() => setShowCustomize(s => !s)}
                  title="Customize"
                  style={{ fontSize: "1rem", padding: "0.38rem 0.7rem" }}
                >
                  🎨
                </button>
                {showCustomize && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 10px)", left: 0,
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "14px", padding: "1.2rem 1.2rem 1rem", zIndex: 100,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: "260px",
                    display: "flex", flexDirection: "column", gap: "1.2rem"
                  }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text)" }}>Customize</span>
                      <button onClick={() => setShowCustomize(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "1rem", lineHeight: 1 }}>✕</button>
                    </div>

                    {/* Accent Color */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Accent Color</span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        {ACCENTS.map(c => (
                          <button key={c} onClick={() => setAccent(c)} style={{
                            width: 26, height: 26, borderRadius: "50%", background: c,
                            border: accent === c ? "3px solid var(--text)" : "2px solid transparent",
                            cursor: "pointer", padding: 0, flexShrink: 0,
                            transform: accent === c ? "scale(1.2)" : "scale(1)",
                            transition: "transform 0.15s, border 0.15s",
                            boxShadow: accent === c ? `0 0 8px ${c}88` : "none"
                          }} />
                        ))}
                        <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                          title="Custom color"
                          style={{ width: 26, height: 26, border: "2px solid var(--border)", borderRadius: "50%", cursor: "pointer", padding: 0, background: "none" }} />
                      </div>
                    </div>

                    {/* Font Size */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Font Size</span>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {FONT_SIZES.map(f => (
                          <button key={f.value} onClick={() => setFontSize(f.value)} style={{
                            flex: 1, padding: "0.4rem 0", borderRadius: "8px",
                            border: `1px solid ${fontSize === f.value ? "var(--accent)" : "var(--border)"}`,
                            background: fontSize === f.value ? "var(--accent)" : "var(--bg-elevated)",
                            color: fontSize === f.value ? "#fff" : "var(--text-muted)",
                            cursor: "pointer", fontSize: "0.82rem", fontWeight: 700,
                            transition: "all 0.15s"
                          }}>{f.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : user && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className={`follow-btn ${following ? "following" : ""}`} onClick={handleFollow}>
                  {following ? "Following" : "Follow"}
                </button>
                <button 
                  className="msg-profile-btn"
                  onClick={() => window.dispatchEvent(new CustomEvent("vibe:open-chat", { detail: { userId: id, user: profile } }))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "16px", height: "16px" }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Message
                </button>
              </div>
            )}
          </div>

          <div className="profile-stats">
            <div className="stat"><strong>{profile.projectCount}</strong><span>projects</span></div>
            <div className="stat" style={{ cursor: "pointer" }} onClick={() => openFollowModal("followers")}>
              <strong>{followerCount}</strong><span style={{ textDecoration: "underline dotted" }}>followers</span>
            </div>
            <div className="stat" style={{ cursor: "pointer" }} onClick={() => openFollowModal("following")}>
              <strong>{profile.following?.length || 0}</strong><span style={{ textDecoration: "underline dotted" }}>following</span>
            </div>
          </div>

          {profile.bio && <p className="profile-bio">{profile.bio}</p>}

          {profile.skills?.length > 0 && (
            <div className="profile-skills">
              {profile.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
            </div>
          )}

          <div className="vibe-score">
            <span className="vibe-label">Vibe Score</span>
            <div className="vibe-bar-track">
              <div className="vibe-bar-fill" style={{ width: `${score}%` }} />
            </div>
            <span className="vibe-number">{score}</span>
          </div>
        </div>
      </div>

      {/* Layout toggle + grid */}
      <div className="profile-projects-header">
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === "projects" ? "active" : ""}`} 
            onClick={() => setActiveTab("projects")}
          >
            Projects
          </button>
          {isOwnProfile && (
            <button 
              className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`} 
              onClick={() => setActiveTab("drafts")}
            >
              Drafts {draft && <span className="draft-dot" />}
            </button>
          )}
        </div>
        <div className="layout-toggle">
          <button className={localLayout === "grid" ? "active" : ""} onClick={() => setLocalLayout("grid")} title="Grid View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button className={localLayout === "list" ? "active" : ""} onClick={() => setLocalLayout("list")} title="List View">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {activeTab === "projects" ? (
        projects.length === 0 ? (
          <p className="empty">No projects yet.</p>
        ) : (
          <div className={localLayout === "grid" ? "profile-grid" : "profile-list"}>
            {projects.map(p => (
              <ProjectCard key={p._id} project={p} tile={localLayout === "grid"} onDelete={handleDelete} />
            ))}
          </div>
        )
      ) : (
        /* Drafts View */
        <div className="drafts-view">
          {!draft ? (
            <p className="empty">No saved drafts.</p>
          ) : (
            <div className="draft-card">
              <div className="draft-info">
                <h3>{draft.form?.title || "Untitled Project"}</h3>
                <p>{draft.form?.description || "No description provided."}</p>
                <div className="draft-meta">
                  {draft.domain && <span className="tag">#{draft.domain}</span>}
                  <span className="draft-date">Last edited locally</span>
                </div>
              </div>
              <Link to="/create" className="edit-draft-btn">Continue Editing</Link>
            </div>
          )}
        </div>
      )}

      {/* Followers / Following Modal */}
      {showFollowModal && (
        <div
          onClick={() => setShowFollowModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "16px", width: "min(400px, 92vw)",
              maxHeight: "70vh", display: "flex", flexDirection: "column",
              overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.4)"
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.2rem", borderBottom: "1px solid var(--border-soft)" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text)", textTransform: "capitalize" }}>
                {showFollowModal}
              </span>
              <button onClick={() => setShowFollowModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-faint)", fontSize: "1.1rem" }}>✕</button>
            </div>
            {/* List */}
            <div style={{ overflowY: "auto", padding: "0.5rem 0" }}>
              {followList.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-faint)", padding: "2rem", fontSize: "0.88rem" }}>
                  No {showFollowModal} yet.
                </p>
              ) : (
                followList.map(u => (
                  <Link
                    key={u._id}
                    to={`/profile/${u._id}`}
                    onClick={() => setShowFollowModal(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.85rem",
                      padding: "0.7rem 1.2rem", textDecoration: "none",
                      transition: "background 0.15s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar user={u} size={38} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text)" }}>@{u.username}</div>
                      {u.bio && <div style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 2 }}>{u.bio.slice(0, 50)}{u.bio.length > 50 ? "…" : ""}</div>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
