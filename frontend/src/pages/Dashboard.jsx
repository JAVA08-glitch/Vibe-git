import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ProjectCard from "../components/ProjectCard";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("user");
  const [projects, setProjects] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adminProjects, setAdminProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch user's projects
    api.get(`/users/${user.id}/projects`)
      .then(res => {
        const all = res.data || [];
        // User tab: Original projects
        setProjects(all.filter(p => !p.remixedFrom));
        // Contributor tab: Remix branches
        setBranches(all.filter(p => p.remixedFrom));
        
        // Admin tab: Projects they own that may have incoming requests (just original projects usually, 
        // but let's say they want to see all projects they manage to approve requests)
        setAdminProjects(all.filter(p => p.rootCreatorId?.toString() === user.id || p.ownerRole === 'admin' || !p.remixedFrom));
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div className="dash-container"><p>Please log in.</p></div>;

  return (
    <div className="dash-container">
      <div className="dash-header">
        <h1>Welcome back, @{user.username}</h1>
        <p className="dash-subtitle">Manage your creative workflow across different roles</p>
      </div>

      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>
          👤 User Dashboard
        </button>
        <button className={`dash-tab ${activeTab === 'contributor' ? 'active' : ''}`} onClick={() => setActiveTab('contributor')}>
          🛠️ Contributor Dashboard
        </button>
        <button className={`dash-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
          👑 Admin Dashboard
        </button>
      </div>

      <div className="dash-content">
        {loading ? (
          <p className="loading">Loading dashboard data...</p>
        ) : (
          <>
            {activeTab === 'user' && (
              <div className="dash-section">
                <h2>Your Original Projects</h2>
                <p>Projects you have created from scratch.</p>
                {projects.length === 0 ? <p className="empty">No original projects found.</p> : (
                  <div className="dash-grid">
                    {projects.map(p => <ProjectCard key={p._id} project={p} tile={true} />)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contributor' && (
              <div className="dash-section">
                <h2>Your Active Contributions & Branches</h2>
                <p>Projects you remixed or are currently working on syncing.</p>
                {branches.length === 0 ? <p className="empty">You have no active branches. Request a remix to start contributing!</p> : (
                  <div className="dash-grid">
                    {branches.map(p => <ProjectCard key={p._id} project={p} tile={true} />)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'admin' && (
              <div className="dash-section">
                <h2>Project Administration</h2>
                <p>Manage incoming Remix requests and Sync (Merge) requests for your projects.</p>
                {adminProjects.length === 0 ? <p className="empty">You are not administering any projects yet.</p> : (
                  <div className="admin-list">
                    {adminProjects.map(p => {
                      const incomingRemixes = p.remixRequests?.filter(r => r.status === 'pending').length || 0;
                      const incomingSyncs = p.syncRequests?.filter(r => r.status === 'pending').length || 0;
                      
                      return (
                        <div key={p._id} className="admin-project-item">
                          <h3>{p.title}</h3>
                          <div className="admin-metrics">
                            <span className="metric-badge">
                              {incomingRemixes} Pending Remixes
                            </span>
                            <span className="metric-badge sync-metric">
                              {incomingSyncs} Pending Syncs
                            </span>
                          </div>
                          <div className="admin-actions">
                            <Link to={`/projects/${p._id}/sync-requests`} className="admin-btn">Manage Requests</Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
