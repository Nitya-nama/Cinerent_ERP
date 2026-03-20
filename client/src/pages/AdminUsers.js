import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/admin/users");
      setUsers(res.data || []);
    } catch { alert("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleUser = async id => {
    await api.patch(`/auth/admin/users/${id}/toggle`);
    load();
  };

  const updateRole = async (id, role) => {
    await api.patch(`/auth/admin/users/${id}/role`, { role });
    load();
  };

  const roleColors = { admin: { bg: "#fef2f2", color: "#dc2626" }, staff: { bg: "#eff6ff", color: "#2563eb" }, customer: { bg: "#f0fdf4", color: "#16a34a" } };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = name => (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered user{users.length !== 1 ? "s" : ""}</p>
        </div>
        <a href="/admin/create-user" className="btn btn-primary">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </a>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: 20, maxWidth: 340 }}>
        <input
          className="input"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>No users found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const rc = roleColors[u.role] || { bg: "#f8fafc", color: "#475569" };
                const isActive = u.active !== false;
                return (
                  <tr key={u._id}>
                    {/* AVATAR + NAME */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "var(--teal)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: 12, flexShrink: 0
                        }}>
                          {initials(u.name)}
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 13.5 }}>{u.name}</span>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>

                    {/* ROLE SELECT */}
                    <td>
                      <select
                        value={u.role}
                        onChange={e => updateRole(u._id, e.target.value)}
                        style={{
                          background: rc.bg, color: rc.color,
                          border: "none", borderRadius: 20,
                          padding: "5px 10px", fontSize: 12,
                          fontWeight: 500, cursor: "pointer",
                          outline: "none", fontFamily: "inherit"
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="customer">Customer</option>
                      </select>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                        background: isActive ? "#dcfce7" : "#fee2e2",
                        color: isActive ? "#166534" : "#991b1b"
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", opacity: 0.7 }} />
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* TOGGLE */}
                    <td>
                      <button
                        onClick={() => toggleUser(u._id)}
                        className={isActive ? "btn btn-danger btn-sm" : "btn btn-sm"}
                        style={!isActive ? { background: "#dcfce7", color: "#166534", border: "1.5px solid #bbf7d0" } : {}}
                      >
                        {isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}