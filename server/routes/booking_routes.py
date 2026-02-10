from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from services.booking_service import is_equipment_available
from bson import ObjectId
from datetime import datetime

booking_bp = Blueprint("booking", __name__)

# CUSTOMER — view own bookings
@booking_bp.get("")
@require_auth()
def get_bookings():

    # admin sees all bookings
    if request.user["role"] == "admin":
        bookings = list(mongo.db.bookings.find({}))
    else:
        bookings = list(mongo.db.bookings.find({"userId": request.user["id"]}))

    for b in bookings:
        b["_id"] = str(b["_id"])

    return jsonify(bookings)

# CUSTOMER — create booking request
@booking_bp.post("")
@require_auth("customer")
def create_booking():
    data = request.json

    equipment_ids = data["equipmentIds"]
    start = data["startDate"]
    end = data["endDate"]

    # check conflicts
    unavailable = []
    for eid in equipment_ids:
        if not is_equipment_available(eid, start, end):
            unavailable.append(eid)

    if unavailable:
        return jsonify({
            "error": "Equipment unavailable",
            "conflicts": unavailable
        }), 400

    booking = {
        "projectId": data["projectId"],
        "equipmentIds": equipment_ids,
        "startDate": start,
        "endDate": end,
        "status": "PENDING_APPROVAL",
        "userId": request.user["id"]
    }

    mongo.db.bookings.insert_one(booking)

    return {"msg": "Booking submitted for approval"}, 201


# ADMIN — approve booking
@booking_bp.post("/<id>/approve")
@require_auth("admin")
def approve_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "APPROVED"}}
    )
    return {"msg": "Booking approved"}

# ADMIN — reject booking
@booking_bp.post("/<id>/reject")
@require_auth("admin")
def reject_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "REJECTED"}}
    )
    return {"msg": "Booking rejected"}


# STAFF — mark picked up
@booking_bp.post("/<id>/pickup")
@require_auth("staff")
def pickup_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "PICKED_UP"}}
    )
    return {"msg": "Equipment picked up"}


# STAFF — mark returned
@booking_bp.post("/<id>/return")
@require_auth("staff")
def return_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "RETURNED"}}
    )
    return {"msg": "Equipment returned"}

# ADMIN — close booking & record revenue
@booking_bp.post("/<id>/close")
@require_auth("admin")
def close_booking(id):

    booking = mongo.db.bookings.find_one({"_id": ObjectId(id)})

    if not booking:
        return {"error": "Booking not found"}, 404

    if booking["status"] != "RETURNED":
        return {"error": "Cannot close before return"}, 400

    total_days = (
        (datetime.fromisoformat(booking["endDate"]) -
         datetime.fromisoformat(booking["startDate"])).days + 1
    )

    total_amount = 0

    for eid in booking["equipmentIds"]:
        eq = mongo.db.equipment.find_one({"_id": ObjectId(eid)})
        total_amount += eq["dailyRate"] * total_days

    # create transaction record
    mongo.db.transactions.insert_one({
        "bookingId": str(booking["_id"]),
        "amount": total_amount,
        "days": total_days
    })

    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "CLOSED"}}
    )

    return {"msg": "Booking closed", "totalAmount": total_amount}
