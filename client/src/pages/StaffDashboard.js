import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function StaffDashboard() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [activeTab, setActiveTab] = useState("pickups");

const load = async () => {
    try {
      setLoading(true);
      const [bookingsRes, equipmentRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/equipment")
      ]);

      // ✅ ADD THESE LOGS
      console.log("TOTAL BOOKINGS RECEIVED:", bookingsRes.data.length);
      console.log("BOOKINGS:", bookingsRes.data);
      
      setBookings(bookingsRes.data || []);
      setEquipment(equipmentRes.data || []);
    } catch (err) {
      console.error("Staff dashboard error:", err);
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
      alert("Marked as Picked Up!");
      load();
    } catch (err) {
      alert("Failed to mark picked up");
    }
  };

  const returned = async (id) => {
    try {
      await api.post(`/bookings/${id}/return`);
      alert("Marked as Returned!");
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

// ✅ Normalize date to YYYY-MM-DD regardless of format
  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toISOString().slice(0, 10);
    } catch {
      return String(dateStr).slice(0, 10);
    }
  };

  // ✅ Filter by selected date using normalized comparison
  const pickupsForDate = bookings.filter((b) => {
    const bookingStart = normalizeDate(b.startDate);
    return bookingStart === selectedDate && b.status === "APPROVED";
  });

  const returnsForDate = bookings.filter((b) => {
    const bookingEnd = normalizeDate(b.endDate);
    return bookingEnd === selectedDate && b.status === "PICKED_UP";
  });

  const overduePickups = bookings.filter((b) => {
    const bookingStart = normalizeDate(b.startDate);
    return b.status === "APPROVED" && bookingStart < selectedDate;
  });

  const overdueReturns = bookings.filter((b) => {
    const bookingEnd = normalizeDate(b.endDate);
    return b.status === "PICKED_UP" && bookingEnd < selectedDate;
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Staff Dashboard</h2>

      {/* DATE PICKER */}
      <div className="bg-white p-5 rounded-xl shadow mb-6 flex items-center gap-6">
        <div>
          <label className="text-sm text-gray-500 block mb-1">
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() =>
              setSelectedDate(new Date().toISOString().slice(0, 10))
            }
            className="px-4 py-2 bg-black text-white rounded-lg text-sm"
          >
            Today
          </button>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Next →
          </button>
        </div>

        {/* QUICK STATS FOR SELECTED DATE */}
        <div className="ml-auto flex gap-4">
          <div className="text-center px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-xs text-gray-500">Pickups</p>
            <p className="text-2xl font-bold text-yellow-600">
              {pickupsForDate.length}
            </p>
          </div>
          <div className="text-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-gray-500">Returns</p>
            <p className="text-2xl font-bold text-blue-600">
              {returnsForDate.length}
            </p>
          </div>
          <div className="text-center px-4 py-2 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs text-gray-500">Overdue</p>
            <p className="text-2xl font-bold text-red-600">
              {overduePickups.length + overdueReturns.length}
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "pickups", label: `Pickups (${pickupsForDate.length})` },
          { key: "returns", label: `Returns (${returnsForDate.length})` },
          {
            key: "overdue",
            label: `Overdue (${overduePickups.length + overdueReturns.length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-full text-sm font-medium border transition ${
              activeTab === tab.key
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PICKUPS TAB */}
      {activeTab === "pickups" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Pickups for {selectedDate}
          </h3>

          {pickupsForDate.length === 0 && (
            <div className="bg-white p-8 rounded-xl shadow text-center text-gray-400">
              No pickups scheduled for this date.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {pickupsForDate.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                equipment={equipment}
                getEquipmentNames={getEquipmentNames}
                getDays={getDays}
                getTotal={getTotal}
                badgeColor="bg-blue-100 text-blue-700"
                badgeLabel="APPROVED — Ready for Pickup"
                actionLabel="📦 Mark Picked Up"
                actionColor="bg-yellow-500 hover:bg-yellow-600"
                onAction={() => pickup(b._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* RETURNS TAB */}
      {activeTab === "returns" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Returns for {selectedDate}
          </h3>

          {returnsForDate.length === 0 && (
            <div className="bg-white p-8 rounded-xl shadow text-center text-gray-400">
              No returns scheduled for this date.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {returnsForDate.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                equipment={equipment}
                getEquipmentNames={getEquipmentNames}
                getDays={getDays}
                getTotal={getTotal}
                badgeColor="bg-orange-100 text-orange-700"
                badgeLabel="PICKED UP — Due for Return"
                actionLabel="🔄 Mark Returned"
                actionColor="bg-blue-600 hover:bg-blue-700"
                onAction={() => returned(b._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* OVERDUE TAB */}
      {activeTab === "overdue" && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Overdue Bookings
          </h3>

          {overduePickups.length === 0 && overdueReturns.length === 0 && (
            <div className="bg-white p-8 rounded-xl shadow text-center text-gray-400">
              No overdue bookings. 
            </div>
          )}

          {/* OVERDUE PICKUPS */}
          {overduePickups.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wide">
                ⚠️ Overdue Pickups ({overduePickups.length})
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {overduePickups.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    equipment={equipment}
                    getEquipmentNames={getEquipmentNames}
                    getDays={getDays}
                    getTotal={getTotal}
                    badgeColor="bg-red-100 text-red-700"
                    badgeLabel={`OVERDUE PICKUP — was ${b.startDate}`}
                    actionLabel="📦 Mark Picked Up"
                    actionColor="bg-yellow-500 hover:bg-yellow-600"
                    onAction={() => pickup(b._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* OVERDUE RETURNS */}
          {overdueReturns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-600 mb-3 uppercase tracking-wide">
                ⚠️ Overdue Returns ({overdueReturns.length})
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {overdueReturns.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    equipment={equipment}
                    getEquipmentNames={getEquipmentNames}
                    getDays={getDays}
                    getTotal={getTotal}
                    badgeColor="bg-red-100 text-red-700"
                    badgeLabel={`OVERDUE RETURN — was due ${b.endDate}`}
                    actionLabel="🔄 Mark Returned"
                    actionColor="bg-blue-600 hover:bg-blue-700"
                    onAction={() => returned(b._id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- BOOKING CARD ---------- */
function BookingCard({
  booking: b,
  getEquipmentNames,
  getDays,
  getTotal,
  badgeColor,
  badgeLabel,
  actionLabel,
  actionColor,
  onAction,
}) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">

      {/* BADGE */}
      <span className={`inline-block px-3 py-1 text-xs rounded-full font-medium mb-3 ${badgeColor}`}>
        {badgeLabel}
      </span>

      {/* ID */}
      <p className="text-xs text-gray-400 mb-2">
        Booking ID: {b._id}
      </p>

      {/* DATES */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <p className="font-semibold text-gray-800">
            {b.startDate} → {b.endDate}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {getDays(b.startDate, b.endDate)} days
          </p>
        </div>
        <div className="text-right">
          <p className="text-green-600 font-bold">
            ₹ {getTotal(b.equipmentIds, b.startDate, b.endDate)}
          </p>
          <p className="text-xs text-gray-400">estimated</p>
        </div>
      </div>

      {/* EQUIPMENT */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 mb-1 font-medium">Equipment</p>
        <p className="text-sm text-gray-700">
          {getEquipmentNames(b.equipmentIds)}
        </p>
      </div>

      {/* ACTION BUTTON */}
      <button
        onClick={onAction}
        className={`w-full ${actionColor} text-white py-2.5 rounded-lg text-sm font-medium transition`}
      >
        {actionLabel}
      </button>
    </div>
  );
}