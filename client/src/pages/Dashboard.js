import { useEffect, useState } from "react";
import { api } from "../api/api";

function StatCard({ icon, label, value, delta, color, bg }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {delta && <div className="stat-card-delta">↑ {delta}</div>}
      </div>
      <div className="stat-card-icon" style={{ background: bg }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/dashboard"),
      api.get("/bookings"),
    ])
      .then(([statsRes, bookingsRes]) => {
        setStats(statsRes.data);
        setBookings((bookingsRes.data || []).slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
      Loading dashboard…
    </div>
  );

  const statusBadge = (status) => {
    const map = {
      PENDING_APPROVAL: "badge badge-pending",
      APPROVED:         "badge badge-approved",
      PICKED_UP:        "badge badge-pickup",
      RETURNED:         "badge badge-returned",
      CLOSED:           "badge badge-closed",
      REJECTED:         "badge badge-rejected",
    };
    return map[status] || "badge";
  };

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Here's what's happening with CineRent today.</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard icon="₹"  label="TOTAL REVENUE"   value={`₹${(stats?.revenue || 0).toLocaleString("en-IN")}`} delta="this month" color="#1EC8A0" bg="#e6f9f5" />
        <StatCard icon="📋" label="TOTAL BOOKINGS"  value={stats?.bookings || 0}       color="#3b82f6" bg="#eff6ff" />
        <StatCard icon="📦" label="ACTIVE RENTALS"  value={stats?.activeRentals || 0}  delta="out now"  color="#f59e0b" bg="#fffbeb" />
        <StatCard icon="🎬" label="EQUIPMENT ITEMS" value={stats?.equipment || 0}       color="#8b5cf6" bg="#f5f3ff" />
      </div>

      {/* RECENT BOOKINGS */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent Bookings</h2>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Latest rental requests</p>
          </div>
        </div>

        <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "var(--muted)", padding: "32px 16px" }}>
                    No bookings yet
                  </td>
                </tr>
              )}
              {bookings.map(b => (
                <tr key={b._id}>
                  <td>
                    <code style={{ fontSize: 11, background: "var(--bg)", padding: "3px 8px", borderRadius: 6, color: "var(--muted)" }}>
                      #{b._id.slice(-8).toUpperCase()}
                    </code>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {b.userId ? String(b.userId).slice(-6) : "—"}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    {b.startDate} <span style={{ color: "var(--muted)" }}>→</span> {b.endDate}
                  </td>
                  <td>
                    <span className={statusBadge(b.status)}>
                      {(b.status || "").replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}