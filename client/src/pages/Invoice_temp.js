import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import { useReactToPrint } from "react-to-print";

export default function Invoice() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [total, setTotal] = useState(0);
  const [days, setDays] = useState(0);

  const printRef = useRef(null);

  /* ---------- LOAD INVOICE ---------- */
  const loadInvoice = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const bookingData = res.data;
      setBooking(bookingData);

      const eqRes = await api.get("/equipment");
      const used = eqRes.data.filter((e) =>
        bookingData.equipmentIds?.includes(e._id)
      );
      setEquipment(used);

      const d =
        (new Date(bookingData.endDate) - new Date(bookingData.startDate)) /
          (1000 * 60 * 60 * 24) + 1;
      setDays(d);

      let amount = 0;
      used.forEach((e) => {
        amount += e.dailyRate * d;
      });
      setTotal(amount);

    } catch (err) {
      console.error("Invoice load failed", err);
    }
  }, [bookingId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  /* ---------- PRINT / PDF ---------- */
  const handlePrint = useReactToPrint({
    content: () => printRef.current,  // ✅ v2 API - works with react-to-print@3
    documentTitle: booking ? `Invoice-${booking._id}` : "Invoice",
  });

  if (!booking) {
    return <div className="p-6">Loading invoice...</div>;
  }

  return (
    <div className="p-6">

      {/* ACTION BUTTON */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Download / Print PDF
        </button>
      </div>

      {/* INVOICE CONTENT */}
      <div
        ref={printRef}
        className="bg-white p-8 rounded-xl shadow max-w-3xl mx-auto"
      >
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">CineRent</h1>
            <p className="text-gray-500 text-sm mt-1">Professional Film Equipment Rental</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">INVOICE</h2>
            <p className="text-gray-500 text-sm mt-1">#{booking._id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* BOOKING DETAILS */}
        <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg">
          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Rental Period</h3>
            <p className="text-gray-600">{booking.startDate} → {booking.endDate}</p>
            <p className="text-gray-500 text-sm mt-1">{days} day(s)</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-1">Status</h3>
            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
              {booking.status}
            </span>
          </div>
        </div>

        {/* EQUIPMENT TABLE */}
        <table className="w-full border mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Equipment</th>
              <th className="border p-3 text-center">Rate / Day</th>
              <th className="border p-3 text-center">Days</th>
              <th className="border p-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq._id}>
                <td className="border p-3">{eq.name}</td>
                <td className="border p-3 text-center">₹ {eq.dailyRate}</td>
                <td className="border p-3 text-center">{days}</td>
                <td className="border p-3 text-right">₹ {eq.dailyRate * days}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="text-right border-t pt-4">
          <p className="text-gray-500 text-sm">Subtotal: ₹ {total}</p>
          <p className="text-gray-500 text-sm">Tax (0%): ₹ 0</p>
          <h2 className="text-2xl font-bold mt-2">Total: ₹ {total}</h2>
        </div>

        {/* FOOTER */}
        <p className="text-sm text-gray-400 mt-8 text-center border-t pt-4">
          Thank you for choosing CineRent. For support contact: support@cinerent.com
        </p>
      </div>
    </div>
  );
}