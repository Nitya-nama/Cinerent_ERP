import { useEffect, useState } from "react";
import { api } from "../api/api";

const emptyForm = { name: "", category: "", brand: "", quantityTotal: 1, dailyRate: 0 };

const generateSerial = () => "EQ-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 9999);

function CategoryPill({ label }) {
  const colors = {
    Camera:   { bg: "#eff6ff", color: "#2563eb" },
    Lens:     { bg: "#f5f3ff", color: "#7c3aed" },
    Light:    { bg: "#fffbeb", color: "#d97706" },
    Audio:    { bg: "#f0fdf4", color: "#16a34a" },
    Drone:    { bg: "#fef2f2", color: "#dc2626" },
    Grip:     { bg: "#f8fafc", color: "#475569" },
  };
  const c = colors[label] || { bg: "#f8fafc", color: "#475569" };
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 11.5, fontWeight: 500
    }}>
      {label}
    </span>
  );
}

export default function Equipment() {
  const [items, setItems]       = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch]     = useState("");

  const load = async () => {
    try {
      const res = await api.get("/equipment");
      setItems(res.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "quantityTotal" || name === "dailyRate" ? Number(value) : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, category: form.category,
        serialNumber: form.serialNumber || generateSerial(),
        dailyRate: form.dailyRate, depositAmount: 0,
        specifications: "", imageUrl: ""
      };
      if (editingId) await api.patch(`/equipment/${editingId}`, payload);
      else            await api.post("/equipment", payload);
      setForm(emptyForm); setEditingId(null); setShowForm(false); load();
    } catch (err) { alert("Error saving equipment"); }
  };

  const startEdit = item => {
    setEditingId(item._id || item.id);
    setForm({ name: item.name || "", category: item.category || "", brand: item.brand || "", quantityTotal: item.quantityTotal || 1, dailyRate: item.dailyRate || 0, serialNumber: item.serialNumber || "" });
    setShowForm(true);
  };

  const remove = async id => {
    if (!window.confirm("Delete this equipment?")) return;
    try { await api.delete(`/equipment/${id}`); load(); }
    catch { alert("Delete failed"); }
  };

  const filtered = items.filter(i =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">{items.length} item{items.length !== 1 ? "s" : ""} in inventory</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Equipment
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: 24, maxWidth: 340 }}>
        <input
          className="input"
          placeholder="Search by name or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* INLINE FORM */}
      {showForm && (
        <div className="form-card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
            {editingId ? "Edit Equipment" : "Add New Equipment"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
              <div className="input-group">
                <label className="input-label">Equipment Name *</label>
                <input name="name" className="input" placeholder="e.g. Sony FX3" value={form.name} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Category *</label>
                <input name="category" className="input" placeholder="Camera / Lens / Light…" value={form.category} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Brand / Model</label>
                <input name="brand" className="input" placeholder="Sony / ARRI…" value={form.brand} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Units Owned</label>
                <input type="number" name="quantityTotal" min="1" className="input" value={form.quantityTotal} onChange={handleChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Daily Rate (₹) *</label>
                <input type="number" name="dailyRate" min="0" className="input" value={form.dailyRate} onChange={handleChange} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update Equipment" : "Add Equipment"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* GRID */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
          {search ? `No equipment matching "${search}"` : "No equipment yet — add your first item."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {filtered.map(item => {
          const id = item._id || item.id;
          const available = item.condition !== "rented";
          return (
            <div key={id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* COLOR STRIPE */}
              <div style={{ height: 4, background: available ? "var(--teal)" : "#f59e0b" }} />

              <div style={{ padding: "20px 22px" }}>
                {/* TOP ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{item.brand || "—"}</div>
                  </div>
                  <span style={{
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
                    background: available ? "#dcfce7" : "#fef9c3",
                    color: available ? "#166534" : "#854d0e"
                  }}>
                    {available ? "Available" : "In Use"}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <CategoryPill label={item.category || "Other"} />
                </div>

                {/* RATE */}
                <div style={{
                  background: "var(--bg)", borderRadius: 10, padding: "12px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Daily Rate</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
                    ₹{item.dailyRate?.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* ACTIONS */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => startEdit(item)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => remove(id)}
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    🗑 Delete
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