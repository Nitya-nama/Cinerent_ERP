import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function ClientDashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    bookings: 0,
    activeRentals: 0,
    totalSpent: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/dashboard/customer");
        setStats(res.data);
      } catch (err) {
        console.error("Failed loading client dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">My Dashboard</h2>

      <div className="grid grid-cols-4 gap-5">
        <StatCard title="My Projects" value={stats.projects} />
        <StatCard title="My Bookings" value={stats.bookings} />
        <StatCard title="Active Rentals" value={stats.activeRentals} />
        <StatCard title="Total Spent" value={`₹ ${stats.totalSpent}`} />
      </div>
    </div>
  );
}

/* ---------- CARD ---------- */
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold mt-2">{value}</h3>
    </div>
  );
}
