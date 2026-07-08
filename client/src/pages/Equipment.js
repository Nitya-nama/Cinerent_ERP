import { useEffect, useState } from "react";
import { api } from "../api/api";

const emptyForm = {
  name: "", category: "", brand: "", quantityTotal: 1, dailyRate: 0,
  // NEW (Feature 1) — additional inventory fields, all optional
  model: "", purchaseDate: "", purchasePrice: 0, vendor: "",
  warrantyExpiry: "", currentLocation: "", equipmentCondition: "New",
};

const generateSerial = () => "EQ-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 9999);

// NEW (Feature 1) — the 6 lifecycle statuses from the spec
const STATUS_OPTIONS = ["Available", "Reserved", "Booked", "Under Maintenance", "Damaged", "Lost"];

const STATUS_STYLE = {
  "Available":         { bg: "#dcfce7", color: "#166534" },
  "Reserved":           { bg: "#fef9c3", color: "#854d0e" },
  "Booked":             { bg: "#fee2e2", color: "#b91c1c" },
  "Under Maintenance":  { bg: "#ffedd5", color: "#c2410c" },
  "Damaged":            { bg: "#f3f4f6", color: "#374151" },
  "Lost":               { bg: "#111827", color: "#f9fafb" },
};

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

// NEW (Feature 1) — status badge. Falls back to the ORIGINAL
// available/"In Use" logic when an item has no `status` field yet
// (e.g. equipment created before this feature existed), so nothing
// that already worked changes appearance unexpectedly.
function StatusBadge({ item }) {
  const status = item.status || (item.condition !== "rented" ? "Available" : "Booked");
  const style = STATUS_STYLE[status] || STATUS_STYLE["Available"];
  return (
    <span style={{
      padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: style.bg, color: style.color
    }}>
      {status}
    </span>
  );
}

export default function Equipment() {
  const [items, setItems]       = useState([]);
  const [form, setForm]         = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showMore, setShowMore] = useState(false); // NEW — toggles extra-details section in the form
  const [search, setSearch]     = useState("");

  // NEW (Feature 1) — filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter]     = useState("");

  // NEW (Feature 1) — details modal
  const [detailsItem, setDetailsItem] = useState(null);

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
      [name]: name === "quantityTotal" || name === "dailyRate" || name === "purchasePrice" ? Number(value) : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, category: form.category,
        serialNumber: form.serialNumber || generateSerial(),
        dailyRate: form.dailyRate, depositAmount: 0,
        specifications: "", imageUrl: "",
        brand: form.brand,
        // NEW (Feature 1) fields — sent along, ignored gracefully by
        // any backend that doesn't yet support them
        model: form.model,
        purchaseDate: form.purchaseDate,
        purchasePrice: form.purchasePrice,
        vendor: form.vendor,
        warrantyExpiry: form.warrantyExpiry,
        currentLocation: form.currentLocation,
        equipmentCondition: form.equipmentCondition,
      };
      if (editingId) await api.patch(`/equipment/${editingId}`, payload);
      else            await api.post("/equipment", payload);
      setForm(emptyForm); setEditingId(null); setShowForm(false); setShowMore(false); load();
    } catch (err) { alert("Error saving equipment"); }
  };

  const startEdit = item => {
    setEditingId(item._id || item.id);
    setForm({
      name: item.name || "", category: item.category || "", brand: item.brand || "",
      quantityTotal: item.quantityTotal || 1, dailyRate: item.dailyRate || 0,
      serialNumber: item.serialNumber || "",
      model: item.model || "", purchaseDate: item.purchaseDate || "",
      purchasePrice: item.purchasePrice || 0, vendor: item.vendor || "",
      warrantyExpiry: item.warrantyExpiry || "", currentLocation: item.currentLocation || "",
      equipmentCondition: item.equipmentCondition || "New",
    });
    setShowForm(true);
  };

  const remove = async id => {
    if (!window.confirm("Delete this equipment?")) return;
    try { await api.delete(`/equipment/${id}`); load(); }
    catch { alert("Delete failed"); }
  };

  // NEW (Feature 1) — set lifecycle status (Under Maintenance / Damaged / Lost / Available)
  const changeStatus = async (id, status) => {
    try {
      await api.post(`/equipment/${id}/status`, { status });
      load();
    } catch (err) { alert("Could not update status"); }
  };

  // NEW (Feature 1) — categories for the filter dropdown, derived from current data
  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean)));

  const filtered = items.filter(i => {
    const matchesSearch =
      i.name?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase()) ||
      i.brand?.toLowerCase().includes(search.toLowerCase()) ||
      i.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    const itemStatus = i.status || (i.condition !== "rented" ? "Available" : "Booked");
    const matchesStatus = !statusFilter || itemStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

      {/* SEARCH + NEW FILTERS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ maxWidth: 340 }}
          placeholder="Search by name, category, brand, serial…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {/* NEW (Feature 1) — category filter */}
        <select className="input" style={{ maxWidth: 200 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* NEW (Feature 1) — status filter */}
        <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
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

            {/* NEW (Feature 1) — optional "More details" section, collapsed by
                default so the existing quick-add flow is unchanged unless
                someone opts in. */}
            <button
              type="button"
              onClick={() => setShowMore(s => !s)}
              className="btn btn-outline btn-sm"
              style={{ marginBottom: showMore ? 16 : 0 }}
            >
              {showMore ? "− Hide additional details" : "+ Add additional details (model, vendor, warranty…)"}
            </button>

            {showMore && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 16 }}>
                <div className="input-group">
                  <label className="input-label">Model</label>
                  <input name="model" className="input" placeholder="FX3 / Alexa Mini…" value={form.model} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Vendor</label>
                  <input name="vendor" className="input" placeholder="Supplier name" value={form.vendor} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Current Location</label>
                  <input name="currentLocation" className="input" placeholder="Warehouse A / Studio 2…" value={form.currentLocation} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Purchase Date</label>
                  <input type="date" name="purchaseDate" className="input" value={form.purchaseDate} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Purchase Price (₹)</label>
                  <input type="number" name="purchasePrice" min="0" className="input" value={form.purchasePrice} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Warranty Expiry</label>
                  <input type="date" name="warrantyExpiry" className="input" value={form.warrantyExpiry} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Equipment Condition</label>
                  <select name="equipmentCondition" className="input" value={form.equipmentCondition} onChange={handleChange}>
                    <option>New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Poor</option>
                  </select>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update Equipment" : "Add Equipment"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setShowMore(false); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* GRID */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
          {search || categoryFilter || statusFilter ? "No equipment matches your search/filters." : "No equipment yet — add your first item."}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {filtered.map(item => {
          const id = item._id || item.id;
          const currentStatus = item.status || (item.condition !== "rented" ? "Available" : "Booked");
          return (
            <div key={id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* COLOR STRIPE */}
              <div style={{ height: 4, background: (STATUS_STYLE[currentStatus] || {}).color || "var(--teal)" }} />

              <div style={{ padding: "20px 22px" }}>
                {/* TOP ROW */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{item.brand || "—"}</div>
                  </div>
                  <StatusBadge item={item} />
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
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
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

                {/* NEW (Feature 1) — View Details + Status change, on their own row
                    so the original two buttons/layout above are untouched. */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setDetailsItem(item)}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    🔍 View Details
                  </button>
                  <select
                    className="input"
                    style={{ flex: 1, fontSize: 12 }}
                    value={currentStatus}
                    onChange={e => changeStatus(id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NEW (Feature 1) — Equipment details modal */}
      {detailsItem && (
        <div
          onClick={() => setDetailsItem(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ maxWidth: 480, width: "90%", padding: 28, maxHeight: "85vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{detailsItem.name}</h3>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{detailsItem.brand} {detailsItem.model}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setDetailsItem(null)}>✕ Close</button>
            </div>

            {detailsItem.qrCode && (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <img src={detailsItem.qrCode} alt="Equipment QR Code" style={{ width: 140, height: 140 }} />
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              <div><span style={{ color: "var(--muted)" }}>Category:</span> {detailsItem.category || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Serial No:</span> {detailsItem.serialNumber || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Status:</span> {detailsItem.status || "Available"}</div>
              <div><span style={{ color: "var(--muted)" }}>Condition:</span> {detailsItem.equipmentCondition || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Vendor:</span> {detailsItem.vendor || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Location:</span> {detailsItem.currentLocation || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Purchase Date:</span> {detailsItem.purchaseDate || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Purchase Price:</span> {detailsItem.purchasePrice ? `₹${Number(detailsItem.purchasePrice).toLocaleString("en-IN")}` : "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Warranty Expiry:</span> {detailsItem.warrantyExpiry || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Daily Rate:</span> ₹{detailsItem.dailyRate?.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}