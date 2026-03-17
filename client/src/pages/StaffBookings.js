import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function StaffBookings() {
  const [bookings, setBookings] = useState([]);

  const load = async () => {
  const res = await api.get("/bookings/staff/my");
  setBookings(res.data || []);
};


  useEffect(() => { load(); }, []);

  const pickup = async (id) => {
    await api.post(`/bookings/${id}/pickup`);
    load();
  };

  const returned = async (id) => {
    await api.post(`/bookings/${id}/return`);
    load();
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Bookings</h2>

      <div className="grid grid-cols-2 gap-5">
        {bookings.map(b => (
          <div key={b._id} className="bg-white p-4 rounded-xl shadow">
            <p className="text-sm text-gray-500">ID: {b._id}</p>
            <p>{b.startDate} → {b.endDate}</p>
            <p className="mt-1">Status: <b>{b.status}</b></p>

            <div className="flex gap-2 mt-3">
              {b.status === "APPROVED" && (
                <button
                  onClick={() => pickup(b._id)}
                  className="bg-yellow-500 px-3 py-1 rounded text-white"
                >
                  Picked Up
                </button>
              )}

              {b.status === "PICKED_UP" && (
                <button
                  onClick={() => returned(b._id)}
                  className="bg-blue-600 px-3 py-1 rounded text-white"
                >
                  Returned
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
