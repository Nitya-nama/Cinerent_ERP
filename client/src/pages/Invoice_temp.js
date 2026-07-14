import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";

// NEW (Feature 3) — client-side "true" PDF download, separate from browser Print.
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAYMENT_STATUS_STYLE = {
  Paid:     { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534", icon: "✅" },
  Pending:  { bg: "#fffbeb", border: "#fde68a", color: "#d97706", icon: "⏳" },
  Failed:   { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c", icon: "⚠️" },
  Refunded: { bg: "#eff6ff", border: "#bfdbfe", color: "#2563eb", icon: "↩️" },
  COD:      { bg: "#fef9c3", border: "#fde047", color: "#854d0e", icon: "💵" },
};

export default function Invoice() {
  // FIX: the route is declared as "/invoice/:bookingId" in App.js, but this
  // component was reading `id` (which useParams() never provides), so the
  // page silently failed to load any data. Reading `bookingId` (aliased to
  // `id` so nothing below has to change) is the minimal fix.
  const { bookingId: id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const printRef = useRef();
  const role = localStorage.getItem("role");

  // NEW — Email Invoice state
  const [emailing, setEmailing] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  // NEW — Download PDF state
  const [downloading, setDownloading] = useState(false);

  // NEW — admin discount control
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/invoices/${id}`)
      .then(res => setInvoice(res.data))
      .catch(err => setError(err.response?.data?.error || "Could not load invoice"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading invoice…</div>;
  if (error || !invoice) return <div style={{ padding: 32, color: "var(--danger)" }}>{error || "Invoice not found."}</div>;

  const { booking, lineItems, rentalDurationDays, subtotal, discountAmount: discount,
          discountReason: existingDiscountReason, gst, grandTotal, customer,
          paymentMethod, paymentStatus, qrCode, invoiceNumber } = invoice;

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const payStyle = PAYMENT_STATUS_STYLE[paymentStatus] || PAYMENT_STATUS_STYLE.Pending;

  const handlePrint = () => window.print();

  // NEW (Feature 3) — Download PDF: renders the invoice DOM node to a canvas
  // and saves an actual .pdf file (distinct from the browser's Print dialog).
  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      pdf.save(`${invoiceNumber}.pdf`);
    } catch (err) {
      alert("Could not generate PDF — you can still use Print → Save as PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // NEW (Feature 3) — Email Invoice
  const handleEmail = async () => {
    setEmailing(true);
    setEmailMsg("");
    try {
      const res = await api.post(`/invoices/${id}/email`);
      setEmailMsg(res.data?.msg || "Invoice emailed.");
    } catch (err) {
      setEmailMsg(err.response?.data?.error || "Could not send email.");
    } finally {
      setEmailing(false);
    }
  };

  // NEW (Feature 3) — admin discount control
  const applyDiscount = async () => {
    setApplyingDiscount(true);
    try {
      await api.post(`/invoices/${id}/discount`, {
        amount: Number(discountAmount) || 0,
        reason: discountReason,
      });
      setDiscountAmount("");
      setDiscountReason("");
      load();
    } catch {
      alert("Could not apply discount");
    } finally {
      setApplyingDiscount(false);
    }
  };

  return (
    <div>
      {/* PRINT/ACTION CONTROLS — hidden when printing */}
      <div className="no-print" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? "Generating…" : "⬇️ Download PDF"}
        </button>
        <button className="btn btn-outline" onClick={handlePrint}>
          🖨️ Print
        </button>
        <button className="btn btn-outline" onClick={handleEmail} disabled={emailing}>
          {emailing ? "Sending…" : "✉️ Email Invoice"}
        </button>
        <button className="btn btn-outline" onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

      {emailMsg && (
        <div className="no-print alert alert-warn" style={{ marginBottom: 20, maxWidth: 780 }}>
          {emailMsg}
        </div>
      )}

      {/* NEW — admin-only discount control, sits above the printable document */}
      {role === "admin" && (
        <div className="no-print card" style={{ maxWidth: 780, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Apply Discount
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="number" min="0" className="input" style={{ maxWidth: 140 }}
              placeholder="Amount (₹)" value={discountAmount}
              onChange={e => setDiscountAmount(e.target.value)}
            />
            <input
              className="input" style={{ maxWidth: 260 }}
              placeholder="Reason (optional)" value={discountReason}
              onChange={e => setDiscountReason(e.target.value)}
            />
            <button className="btn btn-outline btn-sm" onClick={applyDiscount} disabled={applyingDiscount}>
              {applyingDiscount ? "Applying…" : "Apply"}
            </button>
            {discount > 0 && (
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                Current discount: ₹{discount.toLocaleString("en-IN")} {existingDiscountReason ? `(${existingDiscountReason})` : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* INVOICE DOCUMENT */}
      <div ref={printRef} style={{
        background: "#fff", borderRadius: 16, padding: "48px 52px",
        maxWidth: 780, boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        fontFamily: "'DM Sans', sans-serif",
        color: "#111827"
      }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* NEW — simple decorative logo mark */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="19" stroke="#1EC8A0" strokeWidth="2" />
              <circle cx="20" cy="20" r="7" fill="#1EC8A0" />
              <circle cx="12" cy="12" r="2.4" fill="#1EC8A0" />
              <circle cx="28" cy="12" r="2.4" fill="#1EC8A0" />
              <circle cx="12" cy="28" r="2.4" fill="#1EC8A0" />
              <circle cx="28" cy="28" r="2.4" fill="#1EC8A0" />
            </svg>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#0d1b2a", marginBottom: 4 }}>
                CineRent
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Professional Film Equipment Rentals</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-block", background: "#e6f9f5", color: "#0d9a7e",
              padding: "6px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 8
            }}>
              INVOICE
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{invoiceNumber}</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{today}</div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ height: 2, background: "#f3f4f6", marginBottom: 32 }} />

        {/* BILLING INFO */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, marginBottom: 36 }}>
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

          {/* NEW — Customer Details */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Bill To
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              {customer?.name || "Customer"}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              {customer?.email || "—"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Rental Details
            </div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 2 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#9ca3af", minWidth: 70 }}>Booking</span>
                <span>#{booking._id.slice(-8).toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#9ca3af", minWidth: 70 }}>Pickup</span>
                <span>{booking.startDate}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#9ca3af", minWidth: 70 }}>Return</span>
                <span>{booking.endDate}</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#9ca3af", minWidth: 70 }}>Duration</span>
                <span>{rentalDurationDays} day{rentalDurationDays !== 1 ? "s" : ""}</span>
              </div>
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
                  <td style={{ padding: "14px 16px", textAlign: "right", fontSize: 13 }}>{item.days}</td>
                  <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, fontSize: 13.5 }}>₹{item.total.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS + QR CODE */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36, gap: 24 }}>
          {/* NEW — QR code for quick verification */}
          {qrCode && (
            <div style={{ textAlign: "center" }}>
              <img src={qrCode} alt="Invoice QR Code" style={{ width: 90, height: 90 }} />
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Scan to verify</div>
            </div>
          )}

          <div style={{ minWidth: 280, marginLeft: "auto" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13
            }}>
              <span style={{ color: "#6b7280" }}>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>

            {/* NEW — Discount row, only shown when applied */}
            {discount > 0 && (
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#16a34a"
              }}>
                <span>Discount {existingDiscountReason ? `(${existingDiscountReason})` : ""}</span>
                <span>− ₹{discount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13
            }}>
              <span style={{ color: "#6b7280" }}>GST (18%)</span>
              <span>₹{gst.toLocaleString("en-IN")}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 0" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Grand Total</span>
              <span style={{ fontWeight: 800, fontSize: 24, color: "#1EC8A0" }}>
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* NEW — Payment Method + Payment Status */}
        <div style={{
          borderRadius: 12, padding: "14px 20px",
          background: payStyle.bg, border: `1.5px solid ${payStyle.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 32, flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>{payStyle.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: payStyle.color }}>
                Payment {paymentStatus}
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>
                Booking Status: {(booking.status || "").replace(/_/g, " ")}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "#6b7280" }}>
            Method: <strong style={{ color: "#374151" }}>{paymentMethod}</strong>
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
