import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Avatar from "../components/Avatar";
import NightSky from "../components/NightSky";
import { useTheme } from "../context/ThemeContext";
import "./Explore.css";

const TAGS = ["AI", "Web", "Mobile", "Fun", "Design", "Game", "Tool", "Other"];

export default function Explore() {
  const [activeTab, setActiveTab] = useState("projects"); // 'projects' or 'profiles'
  const [projects, setProjects] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState("latest");
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const search = params.get("search") || "";
  const tag = params.get("tag") || "";

  useEffect(() => {
    setPage(1);
    setProjects([]);
  }, [search, tag, sort, activeTab]);

  useEffect(() => {
    fetchData(page === 1);
  }, [search, tag, sort, activeTab, page]);

  const fetchData = async (reset = false) => {
    if (reset) setLoading(true);
    try {
      if (activeTab === "projects") {
        const query = new URLSearchParams();
        if (search) query.set("search", search);
        if (tag) query.set("tag", tag);
        query.set("sort", sort);
        query.set("page", page);
        query.set("limit", 20);
        query.set("explore", "true"); // Filter for admin-owned projects
        const res = await api.get(`/projects?${query.toString()}`);
        if (reset) {
          setProjects(res.data);
        } else {
          setProjects(prev => {
            const newProjects = res.data.filter(p => !prev.some(existing => existing._id === p._id));
            return [...prev, ...newProjects];
          });
        }
        setHasMore(res.data.length === 20);
      } else {
        const res = await api.get("/users");
        setProfiles(res.data);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch explore data:", err);
    } finally {
      if (reset) setLoading(false);
    }
  };

  const setTag = (t) => {
    const q = new URLSearchParams(location.search);
    if (q.get("tag") === t) q.delete("tag");
    else q.set("tag", t);
    navigate(`?${q.toString()}`);
  };

  const handleLike = async (e, projectId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      setProjects(prev => prev.map(p => 
        p._id === projectId ? { ...p, likes: new Array(res.data.likes).fill(0), liked: res.data.liked } : p
      ));
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  };

  return (
    <div className="explore-page">
      <NightSky />
      {/* Hero Section */}
      <div className="ex-hero">
        <div className="ex-hero-content">
          <h1 className="ex-hero-title">
            {search ? <>Results for <em>"{search}"</em></> : <>Explore the <em>Future</em></>}
          </h1>
          <p className="ex-hero-sub">
            Discover premium projects and top creators in the VibeGit ecosystem.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="ex-tab-switcher"
          style={{
            background: isDark ? "#27272a" : undefined,
            border: isDark ? "1px solid #52525b" : undefined,
            boxShadow: isDark ? "0 2px 16px rgba(0,0,0,0.8)" : undefined,
          }}
        >
          <button
            className={`ex-tab ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
            style={activeTab !== "projects" && isDark ? { color: "#e4e4e7", background: "transparent" } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Projects
            {projects.length > 0 && activeTab === "projects" && <span className="ex-tab-pill">{projects.length}</span>}
          </button>
          <button
            className={`ex-tab ${activeTab === "profiles" ? "active" : ""}`}
            onClick={() => setActiveTab("profiles")}
            style={activeTab !== "profiles" && isDark ? { color: "#e4e4e7", background: "transparent" } : {}}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Top Vibes
            {profiles.length > 0 && activeTab === "profiles" && <span className="ex-tab-pill">{profiles.length}</span>}
          </button>
        </div>
      </div>

      {/* Tag Bar and Sort options */}
      <div className="ex-filters-row">
        <div className="ex-tag-bar">
          {TAGS.map(t => (
            <button
              key={t}
              className={`ex-tag-btn ${tag === t ? "active" : ""}`}
              onClick={() => setTag(t)}
            >
              #{t}
            </button>
          ))}
        </div>
        
        {activeTab === "projects" && (
          <div className="ex-sort-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M3 6h18M6 12h12m-9 6h6"/></svg>
            <select className="ex-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="latest">Latest</option>
              <option value="trending">Trending</option>
              <option value="mostLiked">Most Liked</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className={activeTab === "projects" ? "ex-proj-grid" : "ex-prof-grid"}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`ex-skeleton ${activeTab === "profiles" ? "ex-skeleton-prof" : ""}`}>
              <div className="skel-line skel-avatar" />
              <div className="skel-line skel-title" />
              <div className="skel-line skel-body" />
              <div className="skel-line skel-body short" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {activeTab === "projects" ? (
            projects.length === 0 ? (
              <div className="ex-empty">
                <span className="ex-empty-icon">📂</span>
                <p>No projects found matching your criteria.</p>
                <button className="ex-empty-cta" onClick={() => navigate("/create")}>Create Project</button>
              </div>
            ) : (
              <>
                <div className="ex-proj-grid masonry-grid">
                  {projects.map(p => (
                    <ProjectCard key={p._id} project={p} onLike={(e) => handleLike(e, p._id)} />
                  ))}
                </div>
                {hasMore && projects.length > 0 && (
                  <div className="ex-load-more">
                    <button className="ex-load-more-btn glass-btn" onClick={() => setPage(p => p + 1)}>
                      Load More Projects
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            profiles.length === 0 ? (
              <div className="ex-empty">
                <span className="ex-empty-icon">👥</span>
                <p>No creators found yet. Be the first!</p>
              </div>
            ) : (
              <div className="ex-prof-grid">
                {profiles.map(u => (
                  <ProfileCard key={u._id} user={u} />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

const getGradient = (id) => {
  const hash = (id || "fallback").split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 80%, 15%), hsl(${hue2}, 80%, 25%))`;
};

function ProjectCard({ project, onLike }) {
  const navigate = useNavigate();
  const liked = project.liked;

  return (
    <div className="ex-proj-card glass-card" onClick={() => navigate(`/projects/${project._id}`)}>
      <div className="ex-proj-preview" style={{ background: getGradient(project._id) }}>
        <img 
          src={`https://picsum.photos/seed/${project._id}/400/200`} 
          alt="Preview" 
          loading="lazy"
          className="ex-proj-preview-img"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="ex-proj-preview-overlay">
          <button className="ex-proj-hover-btn" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }}>
            View Details
          </button>
        </div>
      </div>
      
      <div className="ex-proj-content">
        <div className="ex-proj-header">
          <h3 className="ex-proj-title">{project.title}</h3>
          <span className={`ex-proj-status-badge status-${project.status}`}>
            {project.status === "completed" ? "✅" : project.status === "in-progress" ? "🚧" : "💡"}
          </span>
        </div>
        
        <p className="ex-proj-desc">{project.description}</p>
        
        <div className="ex-proj-tags">
          {project.tags?.slice(0, 3).map(t => (
            <span key={t} className="ex-proj-tag-chip">#{t}</span>
          ))}
        </div>
      </div>
      
      <div className="ex-proj-footer-custom">
        <Link to={`/profile/${project.userId?._id}`} className="ex-proj-author" onClick={e => e.stopPropagation()}>
          <Avatar user={project.userId} size={24} />
          <span className="ex-proj-username">@{project.userId?.username}</span>
        </Link>
        
        <div className="ex-proj-actions">
          <button className={`ex-like-btn ${liked ? "liked" : ""}`} onClick={onLike}>
            <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {project.likes?.length || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ user }) {
  const navigate = useNavigate();
  // Rank logic based on follower count for demo purposes
  const rank = user.followers?.length > 10 ? "gold" : user.followers?.length > 5 ? "silver" : "bronze";
  
  return (
    <div className="ex-prof-card" onClick={() => navigate(`/profile/${user._id}`)}>
      <div className={`ex-prof-avatar-wrap rank-${rank}`}>
        <Avatar user={user} size={64} />
        <div className="ex-prof-vibe-badge">{rank.toUpperCase()} VIBE</div>
      </div>

      <div className="ex-prof-body">
        <span className="ex-prof-username">@{user.username}</span>
        <p className="ex-prof-bio">{user.bio || "No bio yet. Vibing in the shadows."}</p>
      </div>

      <div className="ex-prof-skills">
        {user.skills?.slice(0, 3).map(s => (
          <span key={s} className="ex-skill-chip">{s}</span>
        ))}
      </div>

      <div className="ex-prof-stats">
        <div className="ex-pstat">
          <span className="ex-pstat-val">{user.projectCount || 0}</span>
          <span className="ex-pstat-lbl">Projects</span>
        </div>
        <div className="ex-pstat-divider" />
        <div className="ex-pstat">
          <span className="ex-pstat-val">{user.followers?.length || 0}</span>
          <span className="ex-pstat-lbl">Vibes</span>
        </div>
      </div>

      <div className="ex-vibe-row">
        <div className="ex-vibe-label">Vibe Level</div>
        <div className="ex-vibe-track">
          <div 
            className="ex-vibe-fill" 
            style={{ 
              width: `${Math.min(100, (user.followers?.length || 0) * 10 + (user.projectCount || 0) * 5)}%`, 
              background: `linear-gradient(90deg, var(--accent), var(--like))` 
            }} 
          />
        </div>
        <div className="ex-vibe-num">{Math.min(100, (user.followers?.length || 0) * 10 + (user.projectCount || 0) * 5)}</div>
      </div>

      <div className="ex-prof-view-btn">View Profile →</div>
    </div>
  );
}
