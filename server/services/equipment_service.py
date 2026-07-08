"""
equipment_service.py

NEW FILE — Feature 1 (Inventory Management)

Isolated helpers for the enhanced inventory system:
  - QR code generation for equipment
  - Automatic equipment status recalculation based on active bookings

Nothing here touches the existing booking_service.py or booking_routes.py
business logic — those files continue to work exactly as before. Callers
(booking_routes.py) only ADD a call to `recompute_equipment_status(...)`
after an existing status change, they do not alter existing behavior.
"""

import io
import base64
from bson import ObjectId
from config.db import mongo

try:
    import qrcode
    QR_AVAILABLE = True
except ImportError:
    # If the qrcode package isn't installed yet, degrade gracefully instead
    # of crashing the whole app / existing features.
    QR_AVAILABLE = False

# The 6 allowed equipment statuses (Feature 1 spec)
STATUS_VALUES = [
    "Available",
    "Reserved",
    "Booked",
    "Under Maintenance",
    "Damaged",
    "Lost",
]

# Statuses that are set manually by staff and should NOT be silently
# overwritten by the automatic booking-based recalculation.
MANUAL_STATUSES = ["Under Maintenance", "Damaged", "Lost"]

# Booking statuses that count as "the equipment is currently spoken for"
ACTIVE_BOOKING_STATUSES = ["PENDING_APPROVAL", "APPROVED", "PICKED_UP"]


def generate_qr_code(payload: str):
    """
    Generate a QR code PNG for `payload` and return it as a base64 data URI
    (e.g. "data:image/png;base64,...") so the frontend can drop it straight
    into an <img src="..."> tag.

    Returns None if the qrcode package isn't installed — callers should
    handle that gracefully (equipment still saves fine, just without a QR
    image until the dependency is installed).
    """
    if not QR_AVAILABLE:
        return None
    img = qrcode.make(payload)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def recompute_equipment_status(equipment_id):
    """
    Recalculate and persist the automatic status for a single equipment item
    based on its currently active bookings, UNLESS it has a manual status
    (Under Maintenance / Damaged / Lost) set by staff — those are left alone
    until staff explicitly changes them back.

    Safe to call liberally; no-ops quietly on bad/missing ids so it can
    never break an existing route that calls it.
    """
    try:
        eq = mongo.db.equipment.find_one({"_id": ObjectId(equipment_id)})
    except Exception:
        return

    if not eq:
        return

    current_status = eq.get("status")
    if current_status in MANUAL_STATUSES:
        return  # respect manual override, don't auto-change it

    eid = str(eq["_id"])

    active_bookings = list(mongo.db.bookings.find({
        "equipmentIds": eid,
        "status": {"$in": ACTIVE_BOOKING_STATUSES}
    }))

    new_status = "Available"
    for b in active_bookings:
        if b.get("status") == "PICKED_UP":
            new_status = "Booked"
            break
        elif b.get("status") in ("PENDING_APPROVAL", "APPROVED"):
            new_status = "Reserved"

    if new_status != current_status:
        mongo.db.equipment.update_one(
            {"_id": eq["_id"]},
            {"$set": {"status": new_status}}
        )


def recompute_status_for_ids(equipment_ids):
    """Convenience helper to recompute status for a list of equipment ids."""
    for eid in equipment_ids or []:
        recompute_equipment_status(eid)
