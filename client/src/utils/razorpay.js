// NEW FILE (Feature 4 — Razorpay + COD Payment)
//
// Shared helper so both the "pay at booking time" flow (CreateBooking.js)
// and the "pay later / retry" flow (Bookings.js) use identical logic.
// Assumes the Razorpay Checkout script is loaded globally via
// public/index.html (window.Razorpay).

import { api } from "../api/api";

function waitForRazorpay(timeoutMs = 5000) {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        resolve(false);
      }
    }, 150);
  });
}

export async function payWithRazorpay({ bookingId, name, email, onSuccess, onFailure, onDismiss }) {
  // FIX: previously this checked window.Razorpay once, synchronously. On a
  // slower connection (or right after login/navigation) the checkout.js
  // script can still be loading at that exact moment, which silently
  // aborted the whole payment flow with no clear next step for the user.
  // Waiting briefly for it to finish loading fixes that race.
  const ready = await waitForRazorpay();
  if (!ready) {
    onFailure?.(
      "Payment gateway script couldn't load — this can happen if an ad blocker " +
      "or browser extension is blocking checkout.razorpay.com. Please disable " +
      "it for this site, or use Cash on Delivery instead."
    );
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
