import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

function StatCard({ icon, label, value, bg, color }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value" style={color ? { color } : {}}>{value}</div>
      </div>
      <div className="stat-card-icon" style={{ background: bg }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const [stats, setStats]       = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    // Fetch dashboard stats AND bookings+equipment in parallel
    // totalSpent is computed client-side because the /dashboard/customer endpoint
    // only counts from the `transactions` collection which may be empty.
    // We compute it directly: sum of dailyRate × days for CLOSED bookings.
    Promise.all([
      api.get("/dashboard/customer"),
      api.get("/bookings"),
      api.get("/equipment"),
    ])
      .then(([dr, br, er]) => {
        setStats(dr.data);

        const bookings  = br.data || [];
        const equipment = er.data || [];

        // Build equipment rate lookup
        const rateMap = {};
        equipment.forEach(eq => { rateMap[eq._id] = eq.dailyRate || 0; });

        // Sum over CLOSED bookings
        let spent = 0;
        bookings
          .filter(b => b.status === "CLOSED")
          .forEach(b => {
            const days = Math.max(1, Math.round(
              (new Date(b.endDate) - new Date(b.startDate)) / 86400000
            ) + 1);
            (b.equipmentIds || []).forEach(id => {
              spent += (rateMap[id] || 0) * days;
            });
          });

        setTotalSpent(spent);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: "var(--muted)", fontSize: 14 }}>
      Loading…
    </div>
  );

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user.name || "there"} 👋</h1>
        <p className="page-subtitle">Manage your projects and equipment rentals from here.</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20, marginBottom: 32 }}>
        <StatCard icon="📁" label="MY PROJECTS"    value={stats?.projects || 0}                         bg="#eff6ff" color="#3b82f6" />
        <StatCard icon="📋" label="MY BOOKINGS"    value={stats?.bookings || 0}                         bg="#f0fdf4" color="#16a34a" />
        <StatCard icon="📦" label="ACTIVE RENTALS" value={stats?.activeRentals || 0}                    bg="#fffbeb" color="#d97706" />
        <StatCard icon="₹"  label="TOTAL SPENT"
          value={totalSpent > 0
            ? `₹${totalSpent.toLocaleString("en-IN")}`
            : stats?.totalSpent > 0
              ? `₹${stats.totalSpent.toLocaleString("en-IN")}`
              : "₹0"
          }
          bg="#e6f9f5" color="var(--teal)"
        />
      </div>

      {/* QUICK ACTION CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              📁
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>My Projects</div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                {stats?.projects || 0} project{(stats?.projects || 0) !== 1 ? "s" : ""} created
              </div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/projects")}>
            View Projects →
          </button>
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              📋
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>My Bookings</div>
              <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2 }}>
                {stats?.activeRentals || 0} active rental{(stats?.activeRentals || 0) !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/bookings")}>
            View Bookings →
          </button>
        </div>

      </div>
    </div>
  );
}