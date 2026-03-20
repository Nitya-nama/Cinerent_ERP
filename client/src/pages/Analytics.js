import { useEffect, useState } from "react";
import { api } from "../api/api";

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span style={{ color: "var(--muted)" }}>₹{Number(value).toLocaleString("en-IN")}</span>
      </div>
      <div style={{ height: 8, background: "var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color || "var(--teal)", borderRadius: 8,
          transition: "width 0.7s ease"
        }} />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData]         = useState(null);
  const [equip, setEquip]       = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/equipment"),
      api.get("/bookings"),
    ])
      .then(([dr, er, br]) => {
        setData(dr.data);
        setEquip(er.data || []);
        setBookings(br.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
      Loading analytics…
    </div>
  );

  // ── Booking status — uses EXACT keys from backend ──────────────────────────
  // Backend returns: pendingBookings, approvedBookings, pickedUpBookings, closedBookings
  const returned = bookings.filter(b => b.status === "RETURNED").length;
  const rejected = bookings.filter(b => b.status === "REJECTED").length;

  const statusSegments = [
    { label: "Pending",   val: data?.pendingBookings  || 0, color: "#f59e0b" },
    { label: "Approved",  val: data?.approvedBookings || 0, color: "#3b82f6" },
    { label: "Picked Up", val: data?.pickedUpBookings || 0, color: "#f97316" },
    { label: "Returned",  val: returned,                    color: "#8b5cf6" },
    { label: "Closed",    val: data?.closedBookings   || 0, color: "#10b981" },
    { label: "Rejected",  val: rejected,                    color: "#ef4444" },
  ];
  const totalBookings = statusSegments.reduce((s, x) => s + x.val, 0) || 1;

  // ── SVG donut ──────────────────────────────────────────────────────────────
  const r = 54, circ = 2 * Math.PI * r;
  let cumDash = 0;
  const donutSegments = statusSegments.map(seg => {
    const dash   = (seg.val / totalBookings) * circ;
    const offset = -cumDash;
    cumDash += dash;
    return { ...seg, dash, gap: circ - dash, offset };
  });

  // ── Top equipment by revenue (computed client-side from bookings) ──────────
  const eqRevMap = {};
  bookings
    .filter(b => ["CLOSED", "RETURNED", "PICKED_UP"].includes(b.status))
    .forEach(b => {
      const days = Math.max(1, Math.round(
        (new Date(b.endDate) - new Date(b.startDate)) / 86400000
      ) + 1);
      (b.equipmentIds || []).forEach(id => {
        const eq = equip.find(e => e._id === id);
        if (!eq) return;
        if (!eqRevMap[id]) eqRevMap[id] = { name: eq.name, revenue: 0 };
        eqRevMap[id].revenue += (eq.dailyRate || 0) * days;
      });
    });
  const topEquipment = Object.values(eqRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const maxRevenue   = Math.max(...topEquipment.map(e => e.revenue), 1);

  // ── Monthly revenue — array from backend: [{month:"Jan",revenue:0},…] ─────
  const monthlyRevenue = data?.monthlyRevenue || [];
  const maxMonthly     = Math.max(...monthlyRevenue.map(m => m.revenue || 0), 1);

  const barColors = ["var(--teal)", "#3b82f6", "#8b5cf6", "#f59e0b", "#f97316", "#10b981"];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Rental performance overview</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        {[
          { icon: "₹",  label: "TOTAL REVENUE",   val: `₹${(data?.revenue || 0).toLocaleString("en-IN")}`, bg: "#e6f9f5", color: "var(--teal)" },
          { icon: "📋", label: "TOTAL BOOKINGS",  val: data?.bookings || 0,       bg: "#eff6ff", color: "#3b82f6" },
          { icon: "📦", label: "ACTIVE RENTALS",  val: data?.activeRentals || 0,  bg: "#fffbeb", color: "#f59e0b" },
          { icon: "🎬", label: "EQUIPMENT ITEMS", val: data?.equipment || 0,      bg: "#f5f3ff", color: "#8b5cf6" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div>
              <div className="stat-card-label">{s.label}</div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.val}</div>
            </div>
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* DONUT + TOP EQUIPMENT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* DONUT */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Booking Status</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>Distribution across all bookings</p>

          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <svg width="130" height="130" viewBox="0 0 120 120" style={{ flexShrink: 0 }}>
              <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="14" />
              {donutSegments.map((seg, i) =>
                seg.val > 0 ? (
                  <circle
                    key={i} cx="60" cy="60" r={r}
                    fill="none" stroke={seg.color} strokeWidth="14"
                    strokeDasharray={`${seg.dash} ${seg.gap}`}
                    strokeDashoffset={seg.offset}
                    transform="rotate(-90 60 60)"
                  />
                ) : null
              )}
              <text x="60" y="56" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: "var(--text)" }}>
                {data?.bookings || 0}
              </text>
              <text x="60" y="71" textAnchor="middle" style={{ fontSize: 10, fill: "var(--muted)" }}>
                bookings
              </text>
            </svg>

            <div style={{ flex: 1 }}>
              {statusSegments.map(seg => (
                <div key={seg.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5 }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{seg.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TOP EQUIPMENT */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Top Equipment by Revenue</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 24 }}>Computed from closed / active bookings</p>

          {topEquipment.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>
              Revenue data will appear here once bookings are closed.
            </div>
          ) : (
            topEquipment.map((eq, i) => (
              <MiniBar key={i} label={eq.name} value={eq.revenue} max={maxRevenue} color={barColors[i % barColors.length]} />
            ))
          )}
        </div>
      </div>

      {/* MONTHLY REVENUE BAR CHART */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Monthly Revenue</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 28 }}>
          Revenue from closed, returned & active bookings per month
        </p>

        {monthlyRevenue.every(m => (m.revenue || 0) === 0) ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 13 }}>
            No revenue recorded yet. Data appears once bookings generate income.
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 160, padding: "0 4px" }}>
            {monthlyRevenue.map((m, i) => {
              const rev  = m.revenue || 0;
              const pct  = rev > 0 ? Math.max((rev / maxMonthly) * 100, 6) : 0;
              const isMax = rev === maxMonthly && rev > 0;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {rev > 0 && (
                    <div style={{ fontSize: 9, color: "var(--muted)", marginBottom: 4, whiteSpace: "nowrap" }}>
                      ₹{rev >= 1000 ? `${(rev / 1000).toFixed(1)}k` : rev}
                    </div>
                  )}
                  <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%",
                      height: rev > 0 ? `${pct}%` : "3px",
                      background: isMax ? "var(--teal)" : rev > 0 ? "#a7f0e0" : "var(--line)",
                      borderRadius: "5px 5px 0 0",
                      transition: "height 0.6s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 6, textAlign: "center" }}>
                    {m.month}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STATUS BREAKDOWN CARDS */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Booking Stage Breakdown</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {statusSegments.map(seg => (
            <div key={seg.label} style={{
              background: "var(--bg)", borderRadius: 12, padding: "16px 18px",
              borderLeft: `4px solid ${seg.color}`
            }}>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                {seg.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: seg.color }}>{seg.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}