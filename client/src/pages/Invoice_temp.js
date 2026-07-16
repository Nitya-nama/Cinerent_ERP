import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/api";

// NEW (Feature 3) — client-side "true" PDF download, separate from browser Print.
// Draws the PDF directly with jsPDF's own API rather than snapshotting the
// DOM (html2canvas), which is fragile in real deployments — it commonly
// throws a "tainted canvas" error when the page has Google Fonts loaded
// (exactly the case here), silently breaking the download for every user.
// This approach has no such dependency and works identically everywhere.
import jsPDF from "jspdf";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

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
  const role = localStorage.getItem("role");

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

  // NEW (Feature 3) — Download PDF: builds the document with jsPDF's own
  // text/shape drawing calls (no DOM snapshot involved), so it can't be
  // broken by web fonts, ad blockers, or browser rendering differences.
  const buildPdfDoc = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 50;
    let y = 55;

    // Header — logo mark + brand
    doc.setFillColor(30, 200, 160);
    doc.circle(marginX + 8, y - 4, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(13, 27, 42);
    doc.text("CineRent", marginX + 24, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text("Professional Film Equipment Rentals", marginX + 24, y + 14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(13, 154, 126);
    doc.text("INVOICE", pageWidth - marginX, y - 6, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(invoiceNumber, pageWidth - marginX, y + 8, { align: "right" });
    doc.text(today, pageWidth - marginX, y + 20, { align: "right" });

    y += 40;
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(1.5);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 30;

    // Three-column billing info
    const colW = (pageWidth - marginX * 2) / 3;
    const cols = [marginX, marginX + colW, marginX + colW * 2];
    const label = (text, x) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(text.toUpperCase(), x, y);
    };

    label("From", cols[0]);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(17, 24, 39);
    doc.text("CineRent Studio", cols[0], y + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text(["Film Equipment Rentals", "Bengaluru, Karnataka 560001", "GST: 29AABCC1234M1Z5"], cols[0], y + 30, { lineHeightFactor: 1.5 });

    label("Bill To", cols[1]);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(17, 24, 39);
    doc.text(customer?.name || "Customer", cols[1], y + 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(107, 114, 128);
    doc.text(customer?.email || "—", cols[1], y + 30);

    label("Rental Details", cols[2]);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(55, 65, 81);
    doc.text([
      `Booking: #${booking._id.slice(-8).toUpperCase()}`,
      `Pickup: ${booking.startDate}`,
      `Return: ${booking.endDate}`,
      `Duration: ${rentalDurationDays} day(s)`,
    ], cols[2], y + 16, { lineHeightFactor: 1.6 });

    y += 95;

    // Line items table
    doc.setFillColor(249, 250, 251);
    doc.rect(marginX, y, pageWidth - marginX * 2, 22, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(156, 163, 175);
    doc.text("EQUIPMENT", marginX + 8, y + 14);
    doc.text("CATEGORY", marginX + 210, y + 14);
    doc.text("RATE", pageWidth - marginX - 130, y + 14, { align: "right" });
    doc.text("DAYS", pageWidth - marginX - 70, y + 14, { align: "right" });
    doc.text("AMOUNT", pageWidth - marginX - 6, y + 14, { align: "right" });
    y += 22;

    lineItems.forEach(item => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(17, 24, 39);
      doc.text(item.name, marginX + 8, y + 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(156, 163, 175);
      doc.text(item.category || "", marginX + 210, y + 16);
      doc.setFontSize(9); doc.setTextColor(55, 65, 81);
      doc.text(`Rs.${item.rate.toLocaleString("en-IN")}`, pageWidth - marginX - 130, y + 16, { align: "right" });
      doc.text(String(item.days), pageWidth - marginX - 70, y + 16, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(`Rs.${item.total.toLocaleString("en-IN")}`, pageWidth - marginX - 6, y + 16, { align: "right" });
      doc.setDrawColor(243, 244, 246);
      doc.line(marginX, y + 26, pageWidth - marginX, y + 26);
      y += 26;
    });

    y += 24;

    // QR code (left) — our qrCode is already a base64 PNG data URI generated
    // server-side, so there's no network fetch / CORS involved here at all.
    if (qrCode) {
      try {
        doc.addImage(qrCode, "PNG", marginX, y, 70, 70);
        doc.setFontSize(7); doc.setTextColor(156, 163, 175);
        doc.text("Scan to verify", marginX + 35, y + 82, { align: "center" });
      } catch { /* non-fatal — PDF still generates without the QR image */ }
    }

    // Totals (right-aligned)
    const totalsX = pageWidth - marginX - 200;
    let ty = y;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(107, 114, 128);
    doc.text("Subtotal", totalsX, ty + 10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Rs.${subtotal.toLocaleString("en-IN")}`, pageWidth - marginX, ty + 10, { align: "right" });
    ty += 20;

    if (discount > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text(`Discount${existingDiscountReason ? ` (${existingDiscountReason})` : ""}`, totalsX, ty + 10);
      doc.text(`- Rs.${discount.toLocaleString("en-IN")}`, pageWidth - marginX, ty + 10, { align: "right" });
      ty += 20;
    }

    doc.setTextColor(107, 114, 128);
    doc.text("GST (18%)", totalsX, ty + 10);
    doc.setTextColor(17, 24, 39);
    doc.text(`Rs.${gst.toLocaleString("en-IN")}`, pageWidth - marginX, ty + 10, { align: "right" });
    ty += 26;

    doc.setDrawColor(229, 231, 235);
    doc.line(totalsX, ty, pageWidth - marginX, ty);
    ty += 20;

    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(17, 24, 39);
    doc.text("Grand Total", totalsX, ty);
    doc.setFontSize(16); doc.setTextColor(30, 200, 160);
    doc.text(`Rs.${grandTotal.toLocaleString("en-IN")}`, pageWidth - marginX, ty, { align: "right" });

    y = Math.max(y + 100, ty + 30);

    // Payment status band
    const [bgR, bgG, bgB] = hexToRgb(payStyle.bg);
    const [cR, cG, cB] = hexToRgb(payStyle.color);
    doc.setFillColor(bgR, bgG, bgB);
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 40, 6, 6, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(cR, cG, cB);
    doc.text(`Payment ${paymentStatus}`, marginX + 14, y + 18);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(156, 163, 175);
    doc.text(`Booking Status: ${(booking.status || "").replace(/_/g, " ")}`, marginX + 14, y + 30);
    doc.setFontSize(9); doc.setTextColor(55, 65, 81);
    doc.text(`Method: ${paymentMethod}`, pageWidth - marginX - 14, y + 24, { align: "right" });

    y += 70;
    doc.setDrawColor(243, 244, 246);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(156, 163, 175);
    doc.text("Thank you for choosing CineRent. For queries: rentals@cinerent.in . +91 98765 43210", pageWidth / 2, y, { align: "center" });

    return doc;
  };

  const handleDownloadPdf = () => {
    setDownloading(true);
    try {
      const doc = buildPdfDoc();
      doc.save(`${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate the PDF. You can still use Print → Save as PDF as a fallback.");
    } finally {
      setDownloading(false);
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
        <button className="btn btn-outline" onClick={() => window.history.back()}>
          ← Back
        </button>
      </div>

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
      <div style={{
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
