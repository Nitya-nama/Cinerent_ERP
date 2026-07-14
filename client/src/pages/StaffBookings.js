import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // NEW (Feature 3)
import { api } from "../api/api";

const STATUS_STRIPE = {
  PENDING_APPROVAL: "#f59e0b",
  APPROVED:         "#3b82f6",
  PICKED_UP:        "#f97316",
  RETURNED:         "#8b5cf6",
  CLOSED:           "#10b981",
  REJECTED:         "#ef4444",
};

const STATUS_BADGE = {
  PENDING_APPROVAL: "badge badge-pending",
  APPROVED:         "badge badge-approved",
  PICKED_UP:        "badge badge-pickup",
  RETURNED:         "badge badge-returned",
  CLOSED:           "badge badge-closed",
  REJECTED:         "badge badge-rejected",
};

export default function StaffBookings() {
  const [bookings, setBookings]   = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ACTIVE");
  const [search, setSearch]       = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [br, er] = await Promise.all([api.get("/bookings"), api.get("/equipment")]);
      setBookings(br.data || []);
      setEquipment(er.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getEquipmentNames = ids =>
    (ids || []).map(id => equipment.find(e => e._id === id)?.name || id).join(", ") || "—";

  const getDays = (s, e) => {
    if (!s || !e) return 0;
    return Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000) + 1);
  };

  const getTotal = (ids, s, e) => {
    const d = getDays(s, e);
    return (ids || []).reduce((sum, id) => {
      const eq = equipment.find(q => q._id === id);
      return sum + (eq ? (eq.dailyRate || 0) * d : 0);
    }, 0);
  };

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = b =>
    (b.status === "APPROVED"  && String(b.startDate).slice(0, 10) < today) ||
    (b.status === "PICKED_UP" && String(b.endDate).slice(0, 10)   < today);

  const filterMap = {
    ACTIVE:   bookings.filter(b => ["APPROVED", "PICKED_UP"].includes(b.status)),
    OVERDUE:  bookings.filter(b => isOverdue(b)),
    ALL:      bookings,
  };

  const filtered = (filterMap[filter] || bookings).filter(b =>
    getEquipmentNames(b.equipmentIds).toLowerCase().includes(search.toLowerCase()) ||
    b._id.toLowerCase().includes(search.toLowerCase())
  );

  const pickup    = async id => { try { await api.post(`/bookings/${id}/pickup`); load(); } catch { alert("Action failed"); } };
  const doReturn  = async id => { try { await api.post(`/bookings/${id}/return`); load(); } catch { alert("Action failed"); } };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
      Loading bookings…
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Manage Bookings</h1>
        <p className="page-subtitle">Handle pickups and returns for all rental orders</p>
      </div>

      {/* SUMMARY CHIPS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Ready for Pickup", val: bookings.filter(b => b.status === "APPROVED").length,  bg: "#eff6ff", color: "#2563eb" },
          { label: "Out on Rental",    val: bookings.filter(b => b.status === "PICKED_UP").length, bg: "#fff7ed", color: "#ea580c" },
          { label: "Overdue",          val: filterMap.OVERDUE.length,                              bg: "#fef2f2", color: "#dc2626" },
          { label: "Returned Today",   val: bookings.filter(b => b.status === "RETURNED" && String(b.endDate).slice(0, 10) === today).length,
            bg: "#f0fdf4", color: "#16a34a" },
        ].map(c => (
          <div key={c.label} style={{ padding: "10px 18px", background: c.bg, borderRadius: 12 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2, marginTop: 2 }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* TABS + SEARCH */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "ACTIVE",  label: "Active"  },
            { key: "OVERDUE", label: "Overdue" },
            { key: "ALL",     label: "All"     },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="btn"
              style={{
                padding: "8px 16px",
                background: filter === t.key ? "var(--sidebar-bg)" : "var(--surface)",
                color:      filter === t.key ? "#fff" : "var(--muted)",
                border:     `1.5px solid ${filter === t.key ? "var(--sidebar-bg)" : "var(--line)"}`,
              }}
            >
              {t.label}
              <span style={{
                marginLeft: 6,
                background: filter === t.key ? "rgba(255,255,255,0.15)" : "var(--bg)",
                padding: "1px 7px", borderRadius: 10, fontSize: 11
              }}>
                {filterMap[t.key].length}
              </span>
            </button>
          ))}
        </div>

        <div style={{ maxWidth: 280 }}>
          <input
            className="input"
            placeholder="Search by ID or equipment…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No bookings to display</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {filter === "ACTIVE"  ? "No active rentals right now." :
             filter === "OVERDUE" ? "No overdue bookings — great work! 🎉" :
             "No bookings found."}
          </div>
        </div>
      )}

      {/* BOOKING CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(b => {
          const days    = getDays(b.startDate, b.endDate);
          const total   = getTotal(b.equipmentIds, b.startDate, b.endDate);
          const overdue = isOverdue(b);
          const stripe  = overdue ? "#ef4444" : (STATUS_STRIPE[b.status] || "#cbd5e1");

          return (
            <div key={b._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex" }}>
                {/* COLOR STRIPE */}
                <div style={{ width: 4, background: stripe, flexShrink: 0 }} />

                <div style={{ flex: 1, padding: "18px 22px" }}>
                  {/* TOP ROW */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <code style={{ fontSize: 11, background: "var(--bg)", padding: "3px 8px", borderRadius: 6, color: "var(--muted)" }}>
                          #{b._id.slice(-8).toUpperCase()}
                        </code>
                        {overdue && (
                          <span style={{ background: "#fef2f2", color: "#dc2626", padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                            ⚠️ OVERDUE
                          </span>
                        )}
                        <span className={STATUS_BADGE[b.status] || "badge"}>
                          {(b.status || "").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {b.startDate}
                        <span style={{ color: "var(--muted)", margin: "0 8px" }}>→</span>
                        {b.endDate}
                        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                          ({days}d)
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--teal)", flexShrink: 0 }}>
                      ₹{total.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* EQUIPMENT */}
                  <div style={{
                    background: "var(--bg)", borderRadius: 8,
                    padding: "10px 14px", fontSize: 12.5,
                    color: "var(--muted)", marginBottom: 14
                  }}>
                    🎬 {getEquipmentNames(b.equipmentIds)}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* NEW (Feature 3) — view/download invoice, always available */}
                    <Link to={`/invoice/${b._id}`} className="btn btn-outline btn-sm">
                      🧾 Invoice
                    </Link>
                    {b.status === "APPROVED" && (
                      <button
                        className="btn btn-sm"
                        onClick={() => pickup(b._id)}
                        style={{ background: "#fffbeb", color: "#d97706", border: "1.5px solid #fde68a" }}
                      >
                        📦 Mark Picked Up
                      </button>
                    )}
                    {b.status === "PICKED_UP" && (
                      <button
                        className="btn btn-sm"
                        onClick={() => doReturn(b._id)}
                        style={{ background: "#eff6ff", color: "#2563eb", border: "1.5px solid #bfdbfe" }}
                      >
                        🔄 Mark Returned
                      </button>
                    )}
                    {b.status === "PENDING_APPROVAL" && (
                      <span style={{ fontSize: 13, color: "var(--muted)", padding: "6px 0" }}>
                        ⏳ Awaiting admin approval
                      </span>
                    )}
                    {b.status === "RETURNED" && (
                      <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500, padding: "6px 0" }}>
                        ✓ Returned — awaiting admin close
                      </span>
                    )}
                    {b.status === "CLOSED" && (
                      <span style={{ fontSize: 13, color: "var(--muted)", padding: "6px 0" }}>
                        ✓ Booking closed
                      </span>
                    )}
                    {b.status === "REJECTED" && (
                      <span style={{ fontSize: 13, color: "var(--danger)", padding: "6px 0" }}>
                        ✗ Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}