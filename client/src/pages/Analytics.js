import { useEffect, useState, useCallback } from "react";
import { api } from "../api/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ---------- LOAD ANALYTICS (FIXED) ---------- */
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/dashboard", {
        params: {
          year,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed loading analytics", err);
    } finally {
      setLoading(false);
    }
  }, [year, startDate, endDate]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return <div className="p-6">Loading analytics...</div>;
  if (!data) return <div className="p-6">No analytics data</div>;

  const statusData = [
    { name: "Pending", value: data.pendingBookings },
    { name: "Approved", value: data.approvedBookings },
    { name: "Picked Up", value: data.pickedUpBookings },
    { name: "Closed", value: data.closedBookings }
  ];

  const COLORS = ["#facc15", "#60a5fa", "#fb923c", "#22c55e"];
  const exportExcel = async () => {
  try {
    const res = await api.get("/analytics/export", {
      responseType: "blob" // 👈 IMPORTANT
    });

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cinerent_analytics.xlsx";
    link.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Export failed");
    console.error(err);
  }
};


  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Analytics</h2>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard title="Total Revenue" value={`₹ ${data.totalRevenue || 0}`} />
        <StatCard title="Total Bookings" value={data.totalBookings} />
        <StatCard title="Active Rentals" value={data.activeRentals} />
        <StatCard title="Pending Approvals" value={data.pendingBookings} />
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-4 items-end">
        <div>
          <label className="text-sm text-gray-600">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border p-2 rounded w-28"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Reset
        </button>
        <button
        onClick={exportExcel}
        className="bg-black text-white px-4 py-2 rounded"
        >
        Export Excel
        </button>

      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6">
        {/* STATUS PIE */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Booking Status</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" label>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* MONTHLY REVENUE */}
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Monthly Revenue</h3>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyRevenue || []}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------- STAT CARD ---------- */
function StatCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold mt-2">{value}</h3>
    </div>
  );
}
