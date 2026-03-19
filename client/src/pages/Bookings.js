import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const role = localStorage.getItem("role");

  const loadData = async () => {
    try {
      setLoading(true);

      const [bookingsRes, equipmentRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/equipment"),
      ]);

      setBookings(bookingsRes.data || []);
      setEquipment(equipmentRes.data || []);

    } catch (err) {
      console.log("Load failed:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ---------- HELPERS ---------- */
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

  /* ---------- STATUS ACTIONS ---------- */
  const approveBooking = async (id) => {
    await api.post(`/bookings/${id}/approve`);
    loadData();
  };

  const rejectBooking = async (id) => {
    await api.post(`/bookings/${id}/reject`);
    loadData();
  };

  const markPickedUp = async (id) => {
    await api.post(`/bookings/${id}/pickup`);
    loadData();
  };

  const markReturned = async (id) => {
    await api.post(`/bookings/${id}/return`);
    loadData();
  };

  const closeBooking = async (id) => {
    await api.post(`/bookings/${id}/close`);
    loadData();
  };

  /* ---------- STATUS BADGE ---------- */
  const StatusBadge = ({ status }) => {
    const colors = {
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-blue-100 text-blue-700",
      PICKED_UP: "bg-orange-100 text-orange-700",
      RETURNED: "bg-purple-100 text-purple-700",
      CLOSED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
          colors[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status?.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) return <div className="p-6">Loading bookings...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">
        {role === "admin" ? "All Bookings" : "My Bookings"}
      </h2>

      {bookings.length === 0 && (
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">
          No bookings found.
        </div>
      )}

      <div className="flex flex-col gap-5">
        {bookings.map((b) => (
          <div
            key={b._id}
            className="bg-white shadow rounded-xl p-5"
          >
            {/* TOP ROW */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  Booking ID: {b._id}
                </p>
                <p className="font-semibold text-lg">
                  {b.projectId
                    ? `Project: ${b.projectId}`
                    : "No Project"}
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Rental Period</p>
                <p>{b.startDate} → {b.endDate}</p>
                <p className="text-gray-400">
                  {getDays(b.startDate, b.endDate)} day(s)
                </p>
              </div>

              <div>
                <p className="font-medium text-gray-700">Equipment</p>
                <p>{getEquipmentNames(b.equipmentIds)}</p>
              </div>

              <div>
                <p className="font-medium text-gray-700">Estimated Total</p>
                <p className="text-green-600 font-semibold text-base">
                  ₹ {getTotal(b.equipmentIds, b.startDate, b.endDate)}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-2 mt-2 border-t pt-3">

              {role === "admin" && b.status === "PENDING_APPROVAL" && (
                <>
                  <button
                    onClick={() => approveBooking(b._id)}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => rejectBooking(b._id)}
                    className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    ✗ Reject
                  </button>
                </>
              )}

              {(role === "staff" || role === "admin") &&
                b.status === "APPROVED" && (
                  <button
                    onClick={() => markPickedUp(b._id)}
                    className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    📦 Mark Picked Up
                  </button>
                )}

              {(role === "staff" || role === "admin") &&
                b.status === "PICKED_UP" && (
                  <button
                    onClick={() => markReturned(b._id)}
                    className="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    🔄 Mark Returned
                  </button>
                )}

              {role === "admin" && b.status === "RETURNED" && (
                <button
                  onClick={() => closeBooking(b._id)}
                  className="bg-black text-white px-4 py-1.5 rounded-lg text-sm"
                >
                  ✓ Close Booking
                </button>
              )}

              {b.status === "CLOSED" && (
                <span className="text-green-600 text-sm font-medium py-1.5">
                  ✓ Booking Complete
                </span>
              )}

              {b.status === "REJECTED" && (
                <span className="text-red-500 text-sm font-medium py-1.5">
                  ✗ Booking Rejected
                </span>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}