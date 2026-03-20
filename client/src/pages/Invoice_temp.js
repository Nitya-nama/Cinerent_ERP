import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";

export default function Invoice() {
  const { id } = useParams();
  const [booking, setBooking]   = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]   = useState(true);
  const printRef = useRef();

  useEffect(() => {
    Promise.all([api.get(`/bookings/${id}`), api.get("/equipment")])
      .then(([br, er]) => { setBooking(br.data); setEquipment(er.data || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading invoice…</div>;
  if (!booking) return <div style={{ padding: 32, color: "var(--danger)" }}>Booking not found.</div>;

  const getEq = eqId => equipment.find(e => e._id === eqId);
  const getDays = () => {
    if (!booking.startDate || !booking.endDate) return 0;
    return Math.max(0, Math.round((new Date(booking.endDate) - new Date(booking.startDate)) / 86400000) + 1);
  };
  const days = getDays();

  const lineItems = (booking.equipmentIds || []).map(eqId => {
    const eq = getEq(eqId);
    return { name: eq?.name || eqId, category: eq?.category || "", rate: eq?.dailyRate || 0, qty: days, total: (eq?.dailyRate || 0) * days };
  });

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
  const gst      = Math.round(subtotal * 0.18);
  const grand    = subtotal + gst;
  const invoiceNo = `INV-${booking._id.slice(-8).toUpperCase()}`;
  const today     = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const handlePrint = () => window.print();

  return (
    <div>
      {/* PRINT CONTROLS — hidden when printing */}
      <div className="no-print" style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ Print / Save PDF
        </button>
        <button className="btn btn-outline" onClick={() => window.history.back()}>
          ← Back to Bookings
        </button>
      </div>

      {/* INVOICE DOCUMENT */}
      <div ref={printRef} style={{
        background: "#fff", borderRadius: 16, padding: "48px 52px",
        maxWidth: 780, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        fontFamily: "'DM Sans', sans-serif",
        color: "#111827"
      }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0d1b2a", marginBottom: 4 }}>
              CineRent
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Professional Film Equipment Rentals</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-block", background: "#e6f9f5", color: "#0d9a7e",
              padding: "6px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 8
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{invoiceNo}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{today}</div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: 2, background: "#f3f4f6", marginBottom: 32 }} />

        {/* BILLING INFO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              From
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>CineRent Studio</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Film Equipment Rentals<br />
              Bengaluru, Karnataka 560001<br />
              GST: 29AABCC1234M1Z5
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Rental Details
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 2 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ color: "#9ca3af", minWidth: 80 }}>Booking</span>
                <span>#{booking._id.slice(-8).toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ color: "#9ca3af", minWidth: 80 }}>Pickup</span>
                <span>{booking.startDate}</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ color: "#9ca3af", minWidth: 80 }}>Return</span>
                <span>{booking.endDate}</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span style={{ color: "#9ca3af", minWidth: 80 }}>Duration</span>
                <span>{days} day{days !== 1 ? "s" : ""}</span>
              </div>
              {booking.projectId && (
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: "#9ca3af", minWidth: 80 }}>Project</span>
                  <span>{booking.projectId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LINE ITEMS */}
        <div style={{ marginBottom: 32 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Equipment", "Category", "Daily Rate", "Days", "Amount"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: h === "Equipment" || h === "Category" ? "left" : "right",
                    fontSize: 11, fontWeight: 600, color: "#9ca3af",
                    letterSpacing: "0.07em", textTransform: "uppercase",
                    borderBottom: "1px solid #e5e7eb"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 16px", fontWeight: 500, fontSize: 13.5 }}>{item.name}</td>
                  <td style={{ padding: "14px 16px", color: "#9ca3af", fontSize: 12.5 }}>{item.category}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 13 }}>₹{item.rate.toLocaleString("en-IN")}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 13 }}>{item.qty}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, fontSize: 13.5 }}>₹{item.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 36 }}>
          <div style={{ minWidth: 280 }}>
            {[
              { label: "Subtotal", val: subtotal },
              { label: "GST (18%)", val: gst },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13
              }}>
                <span style={{ color: "#6b7280" }}>{row.label}</span>
                <span>₹{row.val.toLocaleString("en-IN")}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 0 0",
            }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Grand Total</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: "#1EC8A0" }}>
                ₹{grand.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* STATUS BANNER */}
        <div style={{
          borderRadius: 12, padding: "14px 20px",
          background: booking.status === "CLOSED" ? "#f0fdf4" : "#fffbeb",
          border: `1.5px solid ${booking.status === "CLOSED" ? "#bbf7d0" : "#fde68a"}`,
          display: "flex", alignItems: "center", gap: 10, marginBottom: 32
        }}>
          <span style={{ fontSize: 20 }}>{booking.status === "CLOSED" ? "✅" : "⏳"}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: booking.status === "CLOSED" ? "#166534" : "#d97706" }}>
              {booking.status === "CLOSED" ? "Payment Confirmed" : "Payment Pending"}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>
              Status: {(booking.status || "").replace(/_/g, " ")}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ borderTop: "2px solid #f3f4f6", paddingTop: 24, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Thank you for choosing CineRent. For queries: rentals@cinerent.in · +91 98765 43210
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}