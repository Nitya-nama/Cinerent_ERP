import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: "", description: "", startDate: "", endDate: "" });
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects");
      setProjects(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await api.post("/projects", form);
      setForm({ title: "", description: "", startDate: "", endDate: "" });
      setShowForm(false);
      load();
    } catch { alert("Failed to create project"); }
  };

  const remove = async id => {
    if (!window.confirm("Delete this project?")) return;
    try { await api.delete(`/projects/${id}`); load(); }
    catch { alert("Failed to delete project"); }
  };

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading projects…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">My Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Create New Project</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div className="input-group" style={{ gridColumn: "1/-1" }}>
                <label className="input-label">Project Title *</label>
                <input className="input" placeholder="e.g. Wedding Film — Kumar Family" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div className="input-group" style={{ gridColumn: "1/-1" }}>
                <label className="input-label">Description</label>
                <textarea className="input" rows={3} placeholder="Brief description of the production…"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: "vertical", minHeight: 80 }} />
              </div>
              <div className="input-group">
                <label className="input-label">Start Date</label>
                <input type="date" className="input" value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">End Date</label>
                <input type="date" className="input" value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn-primary">Create Project</button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* EMPTY */}
      {projects.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No projects yet</div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
            Create your first project to start booking equipment.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create First Project</button>
        </div>
      )}

      {/* GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {projects.map(p => {
          const id = p._id || p.id;
          const days = p.startDate && p.endDate
            ? Math.max(0, Math.round((new Date(p.endDate) - new Date(p.startDate)) / 86400000) + 1)
            : null;

          return (
            <div key={id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* COLOR STRIPE based on hash */}
              <div style={{ height: 4, background: ["var(--teal)","#3b82f6","#8b5cf6","#f59e0b"][id.charCodeAt(0) % 4] }} />

              <div style={{ padding: "20px 22px" }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{p.title}</div>

                {p.description && (
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                  }}>
                    {p.description}
                  </p>
                )}

                {(p.startDate || p.endDate) && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--bg)", borderRadius: 8, padding: "10px 12px",
                    fontSize: 12, color: "var(--muted)", marginBottom: 16
                  }}>
                    📅
                    <span>{p.startDate || "—"}</span>
                    <span>→</span>
                    <span>{p.endDate || "—"}</span>
                    {days && <span style={{ marginLeft: "auto" }}>({days}d)</span>}
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={() => navigate(`/bookings/new?projectId=${id}`)}
                  >
                    📋 Book Equipment
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => remove(id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}