import { useEffect, useState } from "react";
import { api } from "../api/api";
import StatCard from "../components/StatCard";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/analytics/dashboard")
      .then(res => setStats(res.data))
      .catch(err => console.log("Dashboard error:", err));
  }, []);

  if (!stats) return <div className="text-zinc-400 p-10">Loading dashboard...</div>;

  return (
    <div className="grid grid-cols-4 gap-6 mt-10">
      {/* ✅ Keys now match backend response */}
      <StatCard title="Revenue" value={`₹ ${stats.revenue || 0}`} />
      <StatCard title="Bookings" value={stats.bookings || 0} />
      <StatCard title="Equipment" value={stats.equipment || 0} />
      <StatCard title="Active Rentals" value={stats.activeRentals || 0} />
    </div>
  );
}