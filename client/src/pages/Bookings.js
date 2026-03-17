import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const role = localStorage.getItem("role");

  const loadBookings = async () => {
    try {
      const res = await api.get("/bookings");
      setBookings(res.data || []);
    } catch (err) {
      console.log("Booking load failed:", err.response?.data);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const approveBooking = async (id) => {
    await api.post(`/bookings/${id}/approve`);
    loadBookings();
  };

  const rejectBooking = async (id) => {
    await api.post(`/bookings/${id}/reject`);
    loadBookings();
  };

  const markPickedUp = async (id) => {
    await api.post(`/bookings/${id}/pickup`);
    loadBookings();
  };

  const markReturned = async (id) => {
    await api.post(`/bookings/${id}/return`);
    loadBookings();
  };

  const closeBooking = async (id) => {
    await api.post(`/bookings/${id}/close`);
    loadBookings();
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Bookings</h2>

      <div className="grid grid-cols-2 gap-5">
        {bookings.map((b) => (
          <div key={b._id} className="bg-white shadow rounded-xl p-4">

            <p className="text-sm text-gray-500 mb-1">Booking ID: {b._id}</p>
            <p className="text-sm mb-2">{b.startDate} → {b.endDate}</p>
            <p className="mb-2">Status: <b>{b.status}</b></p>

            <div className="flex flex-wrap gap-2 mt-3">

              {role === "admin" && b.status === "PENDING_APPROVAL" && (
                <>
                  <button onClick={() => approveBooking(b._id)} className="bg-green-600 text-white px-3 py-1 rounded">
                    Approve
                  </button>
                  <button onClick={() => rejectBooking(b._id)} className="bg-red-600 text-white px-3 py-1 rounded">
                    Reject
                  </button>
                </>
              )}

              {(role === "staff" || role === "admin") && b.status === "APPROVED" && (
                <button onClick={() => markPickedUp(b._id)} className="bg-yellow-400 px-3 py-1 rounded">
                  Picked Up
                </button>
              )}

              {(role === "staff" || role === "admin") && b.status === "PICKED_UP" && (
                <button onClick={() => markReturned(b._id)} className="bg-blue-500 text-white px-3 py-1 rounded">
                  Returned
                </button>
              )}

              {role === "admin" && b.status === "RETURNED" && (
                <button onClick={() => closeBooking(b._id)} className="bg-black text-white px-3 py-1 rounded">
                  Close
                </button>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
