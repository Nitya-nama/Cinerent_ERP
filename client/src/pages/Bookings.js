import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // NEW (Feature 3)
import { api } from "../api/api";

const STATUS_BADGE = {
  PENDING_APPROVAL: "badge badge-pending",
  APPROVED:         "badge badge-approved",
  PICKED_UP:        "badge badge-pickup",
  RETURNED:         "badge badge-returned",
  CLOSED:           "badge badge-closed",
  REJECTED:         "badge badge-rejected",
};

const STATUS_STRIPE = {
  PENDING_APPROVAL: "#f59e0b",
  APPROVED:         "#3b82f6",
  PICKED_UP:        "#f97316",
  RETURNED:         "#8b5cf6",
  CLOSED:           "#10b981",
  REJECTED:         "#ef4444",
};

export default function Bookings() {
  const [bookings, setBookings]   = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("ALL");
  const role = localStorage.getItem("role");

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

  const getEquipmentNames = ids => {
    if (!ids?.length) return "No equipment";
    return ids.map(id => { const eq = equipment.find(e => e._id === id); return eq ? eq.name : id; }).join(", ");
  };

  const getDays = (s, e) => {
    if (!s || !e) return 0;
    const d = (new Date(e) - new Date(s)) / 86400000 + 1;
    return d > 0 ? d : 0;
  };

  const getTotal = (ids, s, e) => {
    if (!ids?.length) return 0;
    const d = getDays(s, e);
    return ids.reduce((sum, id) => { const eq = equipment.find(q => q._id === id); return sum + (eq ? eq.dailyRate * d : 0); }, 0);
  };

  const approve   = async id => { await api.post(`/bookings/${id}/approve`);  load(); };
  const reject    = async id => { await api.post(`/bookings/${id}/reject`);   load(); };
  const pickup    = async id => { await api.post(`/bookings/${id}/pickup`);   load(); };
  const returned  = async id => { await api.post(`/bookings/${id}/return`);   load(); };
  const close     = async id => { await api.post(`/bookings/${id}/close`);    load(); };

  const filterOptions = ["ALL", "PENDING_APPROVAL", "APPROVED", "PICKED_UP", "RETURNED", "CLOSED", "REJECTED"];

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  const countOf = s => s === "ALL" ? bookings.length : bookings.filter(b => b.status === s).length;

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading bookings…</div>;

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">{role === "admin" ? "All Bookings" : "My Bookings"}</h1>
        <p className="page-subtitle">{bookings.length} booking{bookings.length !== 1 ? "s" : ""} total</p>
      </div>

      {/* SUMMARY CHIPS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Total",    val: bookings.length,                                           color: "#475569", bg: "#f8fafc" },
          { label: "Pending",  val: bookings.filter(b => b.status === "PENDING_APPROVAL").length, color: "#d97706", bg: "#fffbeb" },
          { label: "Active",   val: bookings.filter(b => ["APPROVED","PICKED_UP"].includes(b.status)).length, color: "#2563eb", bg: "#eff6ff" },
          { label: "Closed",   val: bookings.filter(b => b.status === "CLOSED").length,        color: "#16a34a", bg: "#f0fdf4" },
        ].map(c => (
          <div key={c.label} style={{ padding: "10px 18px", background: c.bg, borderRadius: 12, minWidth: 80 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2, marginTop: 2 }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* FILTER TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {filterOptions.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="btn"
            style={{
              padding: "8px 14px",
              background: filter === s ? "var(--sidebar-bg)" : "var(--surface)",
              color: filter === s ? "#fff" : "var(--muted)",
              border: `1.5px solid ${filter === s ? "var(--sidebar-bg)" : "var(--line)"}`,
              fontSize: 12.5
            }}
          >
            {s.replace(/_/g, " ")}
            <span style={{
              marginLeft: 5,
              background: filter === s ? "rgba(255,255,255,0.15)" : "var(--bg)",
              padding: "1px 6px", borderRadius: 8, fontSize: 11
            }}>
              {countOf(s)}
            </span>
          </button>
        ))}
      </div>

      {/* EMPTY */}
      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No bookings found</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            {filter !== "ALL" ? `No bookings with status "${filter.replace(/_/g, " ")}"` : "No bookings yet."}
          </div>
        </div>
      )}

      {/* BOOKING CARDS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(b => {
          const days  = getDays(b.startDate, b.endDate);
          const total = getTotal(b.equipmentIds, b.startDate, b.endDate);
          const stripe = STATUS_STRIPE[b.status] || "#cbd5e1";

          return (
            <div key={b._id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* LEFT STRIPE */}
              <div style={{ display: "flex" }}>
                <div style={{ width: 4, background: stripe, flexShrink: 0 }} />

                <div style={{ flex: 1, padding: "20px 24px" }}>
                  {/* TOP ROW */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <code style={{
                        fontSize: 11, background: "var(--bg)", padding: "3px 8px",
                        borderRadius: 6, color: "var(--muted)", display: "block", marginBottom: 6
                      }}>
                        #{b._id.slice(-8).toUpperCase()}
                      </code>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {b.startDate}
                        <span style={{ color: "var(--muted)", margin: "0 8px" }}>→</span>
                        {b.endDate}
                        <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13, marginLeft: 8 }}>
                          {days} day{days !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: "var(--teal)" }}>
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                      <span className={STATUS_BADGE[b.status] || "badge"}>
                        {(b.status || "").replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  {/* DETAIL GRID */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    gap: 12, background: "var(--bg)",
                    borderRadius: 10, padding: "14px 16px", marginBottom: 16
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Equipment</div>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>{getEquipmentNames(b.equipmentIds)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                        {role === "admin" ? "Customer ID" : "Project"}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>
                        {role === "admin"
                          ? <code style={{ fontSize: 11 }}>{String(b.userId || "—").slice(-10)}</code>
                          : b.projectId || "—"
                        }
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {/* NEW (Feature 3) — view/download invoice, always available */}
                    <Link to={`/invoice/${b._id}`} className="btn btn-outline btn-sm">
                      🧾 Invoice
                    </Link>
                    {role === "admin" && b.status === "PENDING_APPROVAL" && (
                      <>
                        <button className="btn btn-sm" onClick={() => approve(b._id)}
                          style={{ background: "#dcfce7", color: "#166534", border: "1.5px solid #bbf7d0" }}>
                          ✓ Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(b._id)}>
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {(role === "staff" || role === "admin") && b.status === "APPROVED" && (
                      <button className="btn btn-sm" onClick={() => pickup(b._id)}
                        style={{ background: "#fffbeb", color: "#d97706", border: "1.5px solid #fde68a" }}>
                        📦 Mark Picked Up
                      </button>
                    )}
                    {(role === "staff" || role === "admin") && b.status === "PICKED_UP" && (
                      <button className="btn btn-sm" onClick={() => returned(b._id)}
                        style={{ background: "#eff6ff", color: "#2563eb", border: "1.5px solid #bfdbfe" }}>
                        🔄 Mark Returned
                      </button>
                    )}
                    {role === "admin" && b.status === "RETURNED" && (
                      <button className="btn btn-primary btn-sm" onClick={() => close(b._id)}>
                        ✓ Close Booking
                      </button>
                    )}
                    {b.status === "CLOSED" && (
                      <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 500, padding: "6px 0" }}>
                        ✓ Booking Complete
                      </span>
                    )}
                    {b.status === "REJECTED" && (
                      <span style={{ fontSize: 13, color: "var(--danger)", fontWeight: 500, padding: "6px 0" }}>
                        ✗ Booking Rejected
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