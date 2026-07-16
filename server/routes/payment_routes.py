"""
payment_routes.py — NEW FILE (Feature 4: Razorpay + COD Payment)

Purely additive: brand-new blueprint, new URL prefix (/api/payments).
Does not touch bookings/equipment/invoice routes or their responses.
Reuses the existing invoice total calculation (_build_invoice) so the
amount charged always matches what the invoice shows.

Endpoints:
  POST /api/payments/razorpay/order            — create a Razorpay order for a booking
  POST /api/payments/razorpay/verify           — verify signature, mark booking Paid
  POST /api/payments/cod/select                — customer selects Cash on Delivery
  POST /api/payments/<booking_id>/mark-collected — admin/staff: COD collected at pickup

Booking fields this introduces (all new, all optional, default-free for
any booking created before this feature — those simply have no
paymentMethod/paymentStatus set until touched by one of these endpoints,
and invoice_routes.py already defaults paymentStatus sensibly in that case):
  paymentMethod   — "Razorpay" | "COD"
  paymentStatus   — "Pending" | "Paid" | "Failed" | "Refunded" | "COD"

Payment attempts/collections are also recorded in a new `payments`
collection for an audit trail — nothing existing reads or writes it.
"""

import os
import hmac
import hashlib

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config.db import mongo
from middleware.auth_middleware import require_auth
from routes.invoice_routes import _build_invoice

payment_bp = Blueprint("payment", __name__)


def _razorpay_client():
    """Best-effort Razorpay client. Returns None if not configured."""
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        return None, None, None
    import razorpay  # imported lazily so the app still boots if the package/env isn't set up yet
    client = razorpay.Client(auth=(key_id, key_secret))
    return client, key_id, key_secret


@payment_bp.post("/razorpay/order")
@require_auth()
def create_razorpay_order():
    data = request.json or {}
    booking_id = data.get("bookingId")
    if not booking_id:
        return jsonify({"error": "bookingId is required"}), 400

    invoice = _build_invoice(booking_id)
    if not invoice:
        return jsonify({"error": "Booking not found"}), 404

    client, key_id, _ = _razorpay_client()
    if not client:
        return jsonify({
            "error": "Payment gateway isn't configured yet. Set RAZORPAY_KEY_ID and "
                     "RAZORPAY_KEY_SECRET as environment variables on the server."
        }), 503

    amount_paise = int(round(invoice["grandTotal"] * 100))
    if amount_paise <= 0:
        return jsonify({"error": "Nothing to charge for this booking."}), 400

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": invoice["invoiceNumber"],
            "notes": {"bookingId": booking_id},
        })
    except Exception as e:
        return jsonify({"error": f"Could not create payment order: {str(e)}"}), 502

    # FIX: previously paymentMethod/paymentStatus were only ever written on
    # verify() success/failure. If the customer just closed the Razorpay
    # popup without finishing checkout, the booking kept NO payment fields
    # at all — which meant the "Pay Now" retry button (and payment badge)
    # never appeared anywhere, making it look like payment had vanished.
    # Setting it to Pending here, as soon as an order exists, means the
    # booking always reflects "a payment is outstanding" until it's Paid.
    try:
        mongo.db.bookings.update_one(
            {"_id": ObjectId(booking_id), "paymentStatus": {"$ne": "Paid"}},
            {"$set": {"paymentMethod": "Razorpay", "paymentStatus": "Pending"}}
        )
    except Exception:
        pass

    # Record the attempt (additive, new collection — nothing existing reads this)
    mongo.db.payments.insert_one({
        "bookingId": booking_id,
        "method": "Razorpay",
        "status": "created",
        "razorpayOrderId": order["id"],
        "amount": invoice["grandTotal"],
    })

    return jsonify({
        "orderId": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "keyId": key_id,
        "bookingId": booking_id,
        "invoiceNumber": invoice["invoiceNumber"],
    }), 200


@payment_bp.post("/razorpay/verify")
@require_auth()
def verify_razorpay_payment():
    data = request.json or {}
    booking_id = data.get("bookingId")
    order_id = data.get("razorpay_order_id")
    payment_id = data.get("razorpay_payment_id")
    signature = data.get("razorpay_signature")

    if not all([booking_id, order_id, payment_id, signature]):
        return jsonify({"error": "Missing payment verification fields"}), 400

    _, _, key_secret = _razorpay_client()
    if not key_secret:
        return jsonify({"error": "Payment gateway isn't configured yet."}), 503

    # Verify the signature ourselves (HMAC-SHA256) — this is exactly what the
    # official SDK's utility.verify_payment_signature does, done directly so
    # this endpoint has no other dependency beyond the stdlib for the check.
    payload = f"{order_id}|{payment_id}"
    expected_signature = hmac.new(
        key_secret.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        mongo.db.payments.update_one(
            {"razorpayOrderId": order_id},
            {"$set": {"status": "failed", "razorpayPaymentId": payment_id}}
        )
        try:
            mongo.db.bookings.update_one(
                {"_id": ObjectId(booking_id)},
                {"$set": {"paymentStatus": "Failed", "paymentMethod": "Razorpay"}}
            )
        except Exception:
            pass
        return jsonify({"error": "Payment verification failed. Signature mismatch."}), 400

    try:
        mongo.db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"paymentStatus": "Paid", "paymentMethod": "Razorpay"}}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    mongo.db.payments.update_one(
        {"razorpayOrderId": order_id},
        {"$set": {"status": "paid", "razorpayPaymentId": payment_id}}
    )

    return jsonify({"msg": "Payment verified and booking marked Paid"}), 200


@payment_bp.post("/cod/select")
@require_auth()
def select_cod():
    data = request.json or {}
    booking_id = data.get("bookingId")
    if not booking_id:
        return jsonify({"error": "bookingId is required"}), 400

    try:
        result = mongo.db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"paymentMethod": "COD", "paymentStatus": "COD"}}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Booking not found"}), 404

    mongo.db.payments.insert_one({
        "bookingId": booking_id,
        "method": "COD",
        "status": "pending_collection",
    })

    return jsonify({"msg": "Cash on Delivery selected"}), 200


@payment_bp.post("/<booking_id>/mark-collected")
@require_auth(["admin", "staff"])
def mark_cod_collected(booking_id):
    try:
        booking = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return jsonify({"error": "Invalid booking id"}), 400

    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    mongo.db.bookings.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"paymentStatus": "Paid"}}
    )
    mongo.db.payments.update_one(
        {"bookingId": booking_id, "method": "COD"},
        {"$set": {"status": "collected", "collectedBy": request.user["id"]}}
    )

    return jsonify({"msg": "Payment marked as collected"}), 200
