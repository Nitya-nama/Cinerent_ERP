// NEW FILE (Feature 4 — Razorpay + COD Payment)
//
// Shared helper so both the "pay at booking time" flow (CreateBooking.js)
// and the "pay later / retry" flow (Bookings.js) use identical logic.
// Assumes the Razorpay Checkout script is loaded globally via
// public/index.html (window.Razorpay).

import { api } from "../api/api";

export async function payWithRazorpay({ bookingId, name, email, onSuccess, onFailure, onDismiss }) {
  if (!window.Razorpay) {
    onFailure?.("Payment gateway script hasn't loaded yet. Please refresh and try again.");
    return;
  }

  let order;
  try {
    const res = await api.post("/payments/razorpay/order", { bookingId });
    order = res.data;
  } catch (err) {
    onFailure?.(err.response?.data?.error || "Could not start payment.");
    return;
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    name: "CineRent",
    description: `Invoice ${order.invoiceNumber}`,
    order_id: order.orderId,
    prefill: { name: name || "", email: email || "" },
    theme: { color: "#1EC8A0" },
    handler: async (response) => {
      try {
        await api.post("/payments/razorpay/verify", {
          bookingId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        onSuccess?.();
      } catch (err) {
        onFailure?.(err.response?.data?.error || "Payment could not be verified.");
      }
    },
    modal: {
      ondismiss: () => onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (resp) => {
    onFailure?.(resp?.error?.description || "Payment failed.");
  });

  rzp.open();
}
