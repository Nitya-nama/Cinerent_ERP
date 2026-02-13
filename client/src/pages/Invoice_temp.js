import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";
import { useReactToPrint } from "react-to-print";

export default function Invoice() {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [total, setTotal] = useState(0);

  const printRef = useRef(null);

  /* ---------- LOAD INVOICE ---------- */
  const loadInvoice = useCallback(async () => {
    try {
      const res = await api.get(`/bookings/${bookingId}`);
      const bookingData = res.data;

      setBooking(bookingData);

      const eqRes = await api.get("/equipment");
      const used = eqRes.data.filter((e) =>
        bookingData.equipmentIds.includes(e._id)
      );

      setEquipment(used);

      const days =
        (new Date(bookingData.endDate) -
          new Date(bookingData.startDate)) /
          (1000 * 60 * 60 * 24) +
        1;

      let amount = 0;
      used.forEach((e) => {
        amount += e.dailyRate * days;
      });

      setTotal(amount);
    } catch (err) {
      console.error("Invoice load failed", err);
    }
  }, [bookingId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);


  /* ---------- DOWNLOAD PDF ---------- */
  const handleDownloadPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: booking ? `Invoice-${booking._id}` : "Invoice",
    removeAfterPrint: true
  });

  if (!booking) {
    return <div className="p-6">Loading invoice...</div>;
  }

  return (
    <div className="p-6">
      {/* ACTION BUTTONS */}
      <div className="flex gap-3 mb-4">
        
        <button
          onClick={handleDownloadPDF}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Download PDF/PRINT
        </button>
      </div>

      {/* INVOICE CONTENT */}
      <div
        ref={printRef}
        className="bg-white p-8 rounded-xl shadow max-w-3xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-2">CineRent Invoice</h1>

        <p className="text-gray-600 mb-6">
          Booking ID: {booking._id}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold">Rental Period</h3>
            <p>
              {booking.startDate} → {booking.endDate}
            </p>
          </div>

          <div>
            <h3 className="font-semibold">Status</h3>
            <p>{booking.status}</p>
          </div>
        </div>

        <table className="w-full border mb-6">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Equipment</th>
              <th className="border p-2 text-center">Rate / Day</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((eq) => (
              <tr key={eq._id}>
                <td className="border p-2">{eq.name}</td>
                <td className="border p-2 text-center">
                  ₹ {eq.dailyRate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right">
          <h2 className="text-2xl font-bold">
            Total Amount: ₹ {total}
          </h2>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Thank you for choosing CineRent.
        </p>
      </div>
    </div>
  );
}
