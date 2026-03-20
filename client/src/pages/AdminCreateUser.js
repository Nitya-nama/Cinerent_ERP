import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function AdminCreateUser() {
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "staff" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { alert("All fields are required"); return; }
    try {
      setLoading(true);
      await api.post("/auth/admin/create-user", form);
      alert("User created successfully");
      navigate("/admin/users");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create user");
    } finally { setLoading(false); }
  };

  const roleOptions = [
    { value: "staff",    label: "Staff",    icon: "👷", desc: "Can manage pickups and returns" },
    { value: "admin",    label: "Admin",    icon: "🛡️", desc: "Full system access" },
    { value: "customer", label: "Customer", icon: "🎬", desc: "Can create projects and book equipment" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Create User</h1>
        <p className="page-subtitle">Add a new team member or customer account</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
              Account Details
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input name="name" className="input" placeholder="Alex Johnson" value={form.name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" name="email" className="input" placeholder="alex@studio.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input type="password" name="password" className="input" placeholder="Create a strong password" value={form.password} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* ROLE SELECTOR */}
          <div className="form-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
              Role
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {roleOptions.map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${form.role === opt.value ? "var(--teal)" : "var(--line)"}`,
                    background: form.role === opt.value ? "var(--teal-dim)" : "var(--bg)",
                    transition: "all 0.15s"
                  }}
                >
                  <input
                    type="radio" name="role" value={opt.value}
                    checked={form.role === opt.value}
                    onChange={handleChange}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: 20 }}>{opt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {form.role === opt.value && (
                    <svg width="18" height="18" fill="none" stroke="var(--teal)" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: "center" }} disabled={loading}>
              {loading ? "Creating…" : "Create User"}
            </button>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate("/admin/users")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}