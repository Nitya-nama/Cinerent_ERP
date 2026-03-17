import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function StaffBookings() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = async () => {
    try {
      setLoading(true);

      const [bookingsRes, equipmentRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/equipment")
      ]);

      setBookings(bookingsRes.data || []);
      setEquipment(equipmentRes.data || []);

    } catch (err) {
      console.error("Staff bookings error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pickup = async (id) => {
    try {
      await api.post(`/bookings/${id}/pickup`);
      load();
    } catch (err) {
      alert("Failed to mark picked up");
    }
  };

  const returned = async (id) => {
    try {
      await api.post(`/bookings/${id}/return`);
      load();
    } catch (err) {
      alert("Failed to mark returned");
    }
  };

  const getEquipmentNames = (ids) => {
    if (!ids || ids.length === 0) return "No equipment";
    return ids
      .map((id) => {
        const eq = equipment.find((e) => e._id === id);
        return eq ? eq.name : id;
      })
      .join(", ");
  };

  const getDays = (start, end) => {
    if (!start || !end) return 0;
    const diff =
      (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? diff : 0;
  };

  const getTotal = (ids, start, end) => {
    if (!ids || ids.length === 0) return 0;
    const days = getDays(start, end);
    return ids.reduce((sum, id) => {
      const eq = equipment.find((e) => e._id === id);
      return sum + (eq ? eq.dailyRate * days : 0);
    }, 0);
  };

  const filtered =
    filter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const statusColors = {
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PICKED_UP: "bg-orange-100 text-orange-700",
    RETURNED: "bg-purple-100 text-purple-700",
    CLOSED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const filterOptions = [
    "ALL",
    "PENDING_APPROVAL",
    "APPROVED",
    "PICKED_UP",
    "RETURNED",
    "CLOSED",
    "REJECTED"
  ];

  if (loading) return <div className="p-6">Loading bookings...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">All Bookings</h2>

      {/* STATS ROW */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MiniStat
          label="Total"
          value={bookings.length}
          color="bg-gray-50"
        />
        <MiniStat
          label="Approved"
          value={bookings.filter((b) => b.status === "APPROVED").length}
          color="bg-blue-50"
        />
        <MiniStat
          label="Picked Up"
          value={bookings.filter((b) => b.status === "PICKED_UP").length}
          color="bg-orange-50"
        />
        <MiniStat
          label="Returned"
          value={bookings.filter((b) => b.status === "RETURNED").length}
          color="bg-purple-50"
        />
      </div>

      {/* FILTER TABS */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === s
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-black"
            }`}
          >
            {s.replace(/_/g, " ")}
            <span className="ml-1 text-xs opacity-70">
              ({s === "ALL"
                ? bookings.length
                : bookings.filter((b) => b.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow text-center text-gray-400">
          No bookings found for this filter.
        </div>
      )}

      {/* BOOKINGS LIST */}
      <div className="flex flex-col gap-4">
        {filtered.map((b) => (
          <div key={b._id} className="bg-white p-5 rounded-xl shadow">

            {/* TOP ROW */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Booking ID: {b._id}
                </p>
                <p className="font-semibold text-gray-800">
                  {b.startDate} → {b.endDate}
                  <span className="text-gray-400 font-normal text-sm ml-2">
                    ({getDays(b.startDate, b.endDate)} days)
                  </span>
                </p>
              </div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${
                  statusColors[b.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {b.status?.replace(/_/g, " ")}
              </span>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-medium text-gray-700 mb-1">Equipment</p>
                <p>{getEquipmentNames(b.equipmentIds)}</p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Estimated Total</p>
                <p className="text-green-600 font-semibold">
                  ₹ {getTotal(b.equipmentIds, b.startDate, b.endDate)}
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700 mb-1">Customer</p>
                <p className="text-xs text-gray-400 break-all">
                  {b.userId || "N/A"}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-2 border-t pt-3">
              {b.status === "APPROVED" && (
                <button
                  onClick={() => pickup(b._id)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  📦 Mark Picked Up
                </button>
              )}

              {b.status === "PICKED_UP" && (
                <button
                  onClick={() => returned(b._id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  🔄 Mark Returned
                </button>
              )}

              {b.status === "CLOSED" && (
                <span className="text-green-600 text-sm font-medium py-2">
                  ✓ Booking Complete
                </span>
              )}

              {b.status === "REJECTED" && (
                <span className="text-red-500 text-sm font-medium py-2">
                  ✗ Booking Rejected
                </span>
              )}

              {b.status === "PENDING_APPROVAL" && (
                <span className="text-yellow-600 text-sm font-medium py-2">
                  ⏳ Waiting for Admin Approval
                </span>
              )}

              {b.status === "RETURNED" && (
                <span className="text-purple-600 text-sm font-medium py-2">
                  ✓ Returned — Waiting for Admin to Close
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- MINI STAT CARD ---------- */
function MiniStat({ label, value, color }) {
  return (
    <div className={`${color} p-4 rounded-xl border`}>
      <p className="text-gray-500 text-xs">{label}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  );
}