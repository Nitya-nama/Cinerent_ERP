"""
invoice_routes.py — NEW FILE (Feature 3: Invoice PDF Generator)

Purely additive: a brand-new blueprint, new endpoints, new URL prefix
(/api/invoices). Does not touch bookings/equipment/auth routes or their
responses. Reuses the existing `generate_qr_code` helper from Feature 1.

Endpoints:
  GET  /api/invoices/<booking_id>            — full invoice data (line items,
                                                totals, customer, QR code)
  POST /api/invoices/<booking_id>/discount   — admin: apply a discount
  POST /api/invoices/<booking_id>/email      — best-effort email send
                                                (requires SMTP env vars)
"""

import os
import smtplib
from datetime import date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import Blueprint, request, jsonify
from bson import ObjectId

from config.db import mongo
from middleware.auth_middleware import require_auth
from services.equipment_service import generate_qr_code

invoice_bp = Blueprint("invoice", __name__)


def _build_invoice(booking_id):
    try:
        b = mongo.db.bookings.find_one({"_id": ObjectId(booking_id)})
    except Exception:
        return None
    if not b:
        return None

    b["_id"] = str(b["_id"])
    if isinstance(b.get("userId"), ObjectId):
        b["userId"] = str(b["userId"])

    equipment_ids = b.get("equipmentIds", [])
    valid_oids = [ObjectId(e) for e in equipment_ids if ObjectId.is_valid(e)]
    equipment_docs = list(mongo.db.equipment.find({"_id": {"$in": valid_oids}}))
    eq_map = {str(e["_id"]): e for e in equipment_docs}

    # Rental duration
    days = 0
    start, end = b.get("startDate"), b.get("endDate")
    if start and end:
        try:
            days = max(0, (date.fromisoformat(end) - date.fromisoformat(start)).days + 1)
        except Exception:
            days = 0

    # Line items + rental charges
    line_items = []
    subtotal = 0
    for eid in equipment_ids:
        eq = eq_map.get(eid)
        rate = eq.get("dailyRate", 0) if eq else 0
        total = rate * days
        subtotal += total
        line_items.append({
            "equipmentId": eid,
            "name": eq.get("name") if eq else eid,
            "category": eq.get("category", "") if eq else "",
            "rate": rate,
            "days": days,
            "total": total,
        })

    discount = b.get("discountAmount", 0) or 0
    taxable = max(0, subtotal - discount)
    gst = round(taxable * 0.18)
    grand_total = taxable + gst

    # Customer details (best-effort — booking.userId may be a legacy string id)
    customer = {"name": None, "email": None}
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(b.get("userId"))}, {"password": 0})
        if user:
            customer["name"] = user.get("name")
            customer["email"] = user.get("email")
    except Exception:
        pass

    invoice_number = f"INV-{b['_id'][-8:].upper()}"
    qr_payload = f"INVOICE:{invoice_number}|BOOKING:{b['_id']}|TOTAL:{grand_total}"

    return {
        "booking": b,
        "invoiceNumber": invoice_number,
        "lineItems": line_items,
        "rentalDurationDays": days,
        "subtotal": subtotal,
        "discountAmount": discount,
        "discountReason": b.get("discountReason", ""),
        "gst": gst,
        "grandTotal": grand_total,
        "customer": customer,
        "paymentMethod": b.get("paymentMethod", "Not Selected"),
        "paymentStatus": b.get("paymentStatus") or ("Paid" if b.get("status") == "CLOSED" else "Pending"),
        "qrCode": generate_qr_code(qr_payload),
    }


@invoice_bp.get("/<booking_id>")
@require_auth()
def get_invoice(booking_id):
    data = _build_invoice(booking_id)
    if not data:
        return jsonify({"error": "Booking not found"}), 404
    return jsonify(data), 200


@invoice_bp.post("/<booking_id>/discount")
@require_auth("admin")
def set_discount(booking_id):
    data = request.json or {}
    try:
        amount = float(data.get("amount", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 400
    if amount < 0:
        return jsonify({"error": "amount cannot be negative"}), 400

    try:
        mongo.db.bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"discountAmount": amount, "discountReason": data.get("reason", "")}}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    return jsonify({"msg": "Discount applied"}), 200


@invoice_bp.post("/<booking_id>/email")
@require_auth()
def email_invoice(booking_id):
    data = _build_invoice(booking_id)
    if not data:
        return jsonify({"error": "Booking not found"}), 404

    to_email = data["customer"].get("email") or (request.json or {}).get("email")
    if not to_email:
        return jsonify({"error": "No customer email on file. Provide one in the request body."}), 400

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    mail_from = os.getenv("MAIL_FROM", smtp_user)

    if not all([smtp_host, smtp_port, smtp_user, smtp_pass]):
        return jsonify({
            "error": "Email service isn't configured yet. Set SMTP_HOST, SMTP_PORT, "
                     "SMTP_USERNAME, SMTP_PASSWORD (and optionally MAIL_FROM) as "
                     "environment variables on the server to enable this."
        }), 503

    try:
        msg = MIMEMultipart()
        msg["From"] = mail_from
        msg["To"] = to_email
        msg["Subject"] = f"Your CineRent Invoice {data['invoiceNumber']}"
        body = (
            f"Hi {data['customer'].get('name') or ''},\n\n"
            f"Please find your invoice {data['invoiceNumber']} for booking "
            f"#{data['booking']['_id'][-8:].upper()}.\n\n"
            f"Grand Total: Rs. {data['grandTotal']}\n"
            f"Payment Status: {data['paymentStatus']}\n\n"
            f"View/download the full invoice here:\n"
            f"{os.getenv('FRONTEND_URL', '')}/invoice/{data['booking']['_id']}\n\n"
            f"Thank you for choosing CineRent."
        )
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(mail_from, to_email, msg.as_string())

        return jsonify({"msg": f"Invoice emailed to {to_email}"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500
