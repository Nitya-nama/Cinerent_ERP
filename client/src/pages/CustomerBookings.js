import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await api.get("/bookings"); // customer gets ONLY own bookings
        setBookings(res.data || []);
      } catch (err) {
        console.error("Failed loading customer bookings", err);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  if (loading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-4">My Bookings</h2>
        <div className="bg-white p-6 rounded-xl shadow text-gray-500">
          You don’t have any bookings yet.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">My Bookings</h2>

      <div className="grid grid-cols-2 gap-6">
        {bookings.map((b) => (
          <div
            key={b._id}
            className="bg-white p-5 rounded-xl shadow flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-semibold mb-1">
                {b.projectName || "Project"}
              </h3>

              <p className="text-sm text-gray-500 mb-2">
                {b.startDate} → {b.endDate}
              </p>

              <StatusBadge status={b.status} />

              {b.totalAmount && (
                <p className="text-green-600 font-semibold mt-2">
                  ₹ {b.totalAmount}
                </p>
              )}
            </div>

            {b.status === "CLOSED" && (
              <button
                onClick={() => navigate(`/invoice/${b._id}`)}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
              >
                View Invoice
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- STATUS BADGE ---------- */
function StatusBadge({ status }) {
  const colors = {
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PICKED_UP: "bg-orange-100 text-orange-700",
    RETURNED: "bg-purple-100 text-purple-700",
    CLOSED: "bg-green-100 text-green-700"
  };

  return (
    <span
      className={`inline-block px-3 py-1 text-sm rounded ${colors[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
