import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const STATUS_INFO = {
  PENDING_APPROVAL: { icon: "⏳", msg: "Your request is under review. We'll notify you once approved." },
  APPROVED:         { icon: "✅", msg: "Approved! Visit the studio to pick up your equipment on the start date." },
  PICKED_UP:        { icon: "📦", msg: "Equipment is with you. Please return by the due date." },
  RETURNED:         { icon: "🔄", msg: "Equipment returned. Awaiting final closure by admin." },
  CLOSED:           { icon: "🎉", msg: "Booking complete. Thank you for choosing CineRent!" },
  REJECTED:         { icon: "❌", msg: "Booking was not approved. You can submit a new request." },
};

export default function CustomerBookings() {
  const [bookings, setBookings]   = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.get("/bookings"), api.get("/equipment"), api.get("/projects")])
      .then(([br, er, pr]) => {
        setBookings(br.data || []);
        setEquipment(er.data || []);
        setProjects(pr.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getEquipmentNames = ids =>
    (ids || []).map(id => equipment.find(e => e._id === id)?.name || id).join(", ") || "No equipment";

  const getProjectName = id => projects.find(p => p._id === id)?.title || null;

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

  const filterOptions = [
    { key: "ALL",              label: "All"      },
    { key: "PENDING_APPROVAL", label: "Pending"  },
    { key: "APPROVED",         label: "Approved" },
    { key: "PICKED_UP",        label: "Active"   },
    { key: "CLOSED",           label: "Closed"   },
    { key: "REJECTED",         label: "Rejected" },
  ];

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
      Loading your bookings…
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/bookings/new")}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          New Booking
        </button>
      </div>

      {/* SUMMARY CHIPS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Pending",   val: bookings.filter(b => b.status === "PENDING_APPROVAL").length,                          bg: "#fffbeb", color: "#d97706" },
          { label: "Active",    val: bookings.filter(b => ["APPROVED","PICKED_UP"].includes(b.status)).length,              bg: "#eff6ff", color: "#2563eb" },
          { label: "Completed", val: bookings.filter(b => b.status === "CLOSED").length,                                    bg: "#f0fdf4", color: "#16a34a" },
          { label: "Rejected",  val: bookings.filter(b => b.status === "REJECTED").length,                                  bg: "#fef2f2", color: "#dc2626" },
        ].map(c => (
          <div key={c.label} style={{ padding: "10px 18px", background: c.bg, borderRadius: 12, minWidth: 90 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2, marginTop: 2 }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {filterOptions.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className="btn"
            style={{
              padding: "8px 14px", fontSize: 12.5,
              background: filter === f.key ? "var(--sidebar-bg)" : "var(--surface)",
              color:      filter === f.key ? "#fff" : "var(--muted)",
              border:     `1.5px solid ${filter === f.key ? "var(--sidebar-bg)" : "var(--line)"}`,
            }}
          >
            {f.label}
            <span style={{
              marginLeft: 5,
              background: filter === f.key ? "rgba(255,255,255,0.15)" : "var(--bg)",
              padding: "1px 6px", borderRadius: 8, fontSize: 11
            }}>
              {f.key === "ALL" ? bookings.length : bookings.filter(b => b.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            {filter === "ALL" ? "No bookings yet" : `No ${filter.replace(/_/g, " ").toLowerCase()} bookings`}
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
            {filter === "ALL"
              ? "Book equipment for your next production."
              : "Nothing here yet in this status."}
          </p>
          {filter === "ALL" && (
            <button className="btn btn-primary" onClick={() => navigate("/bookings/new")}>
              Book Equipment
            </button>
          )}
        </div>
      )}

      {/* BOOKING CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(b => {
          const days   = getDays(b.startDate, b.endDate);
          const total  = getTotal(b.equipmentIds, b.startDate, b.endDate);
          const stripe = STATUS_STRIPE[b.status] || "#cbd5e1";
          const info   = STATUS_INFO[b.status];
          const proj   = b.projectId ? getProjectName(b.projectId) : null;

          return (
            <div key={b._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex" }}>
                {/* LEFT STRIPE */}
                <div style={{ width: 4, background: stripe, flexShrink: 0 }} />

                <div style={{ flex: 1, padding: "20px 24px" }}>
                  {/* TOP ROW */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div>
                      <code style={{ fontSize: 11, background: "var(--bg)", padding: "3px 8px", borderRadius: 6, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                        #{b._id.slice(-8).toUpperCase()}
                      </code>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {b.startDate}
                        <span style={{ color: "var(--muted)", margin: "0 8px" }}>→</span>
                        {b.endDate}
                        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                          ({days} day{days !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: "var(--teal)" }}>
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                      <span className={STATUS_BADGE[b.status] || "badge"}>
                        {(b.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* DETAIL GRID */}
                  <div style={{
                    display: "grid", gridTemplateColumns: proj ? "1fr 1fr" : "1fr",
                    gap: 12, background: "var(--bg)", borderRadius: 10,
                    padding: "12px 16px", marginBottom: 14
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Equipment</div>
                      <div style={{ fontSize: 13 }}>{getEquipmentNames(b.equipmentIds)}</div>
                    </div>
                    {proj && (
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Project</div>
                        <div style={{ fontSize: 13 }}>📁 {proj}</div>
                      </div>
                    )}
                  </div>

                  {/* STATUS INFO BANNER */}
                  {info && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "var(--bg)", borderRadius: 8,
                      padding: "10px 14px", fontSize: 13, color: "var(--muted)"
                    }}>
                      <span style={{ fontSize: 16 }}>{info.icon}</span>
                      <span>{info.msg}</span>
                    </div>
                  )}

                  {/* INVOICE BUTTON for closed bookings */}
                  {b.status === "CLOSED" && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/bookings/${b._id}/invoice`)}
                      >
                        🧾 View Invoice
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}