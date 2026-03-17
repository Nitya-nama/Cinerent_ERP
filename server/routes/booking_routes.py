from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from services.booking_service import is_equipment_available
from bson import ObjectId
from datetime import datetime

booking_bp = Blueprint("booking", __name__)

def serialize_booking(b):
    b["_id"] = str(b["_id"])
    if b.get("assignedStaff"):
        b["assignedStaff"] = str(b["assignedStaff"])
    if isinstance(b.get("userId"), ObjectId):
        b["userId"] = str(b["userId"])
    return b


# ================= GET BOOKINGS =================
@booking_bp.get("")
@require_auth()
def get_bookings():
    role = request.user["role"]
    user_id = request.user["id"]

    if role == "admin":
        cursor = mongo.db.bookings.find({})

    elif role == "staff":
        cursor = mongo.db.bookings.find({
            "assignedStaff": ObjectId(user_id)
        })

    else:  # customer
        cursor = mongo.db.bookings.find({
            "userId": user_id   # KEEP STRING
        })

    bookings = []
    for b in cursor:
        b["_id"] = str(b["_id"])
        if b.get("assignedStaff"):
            b["assignedStaff"] = str(b["assignedStaff"])
        bookings.append(b)

    return jsonify(bookings), 200


# ================= CREATE =================
@booking_bp.post("")
@require_auth("customer")
def create_booking():
    data = request.json

    booking = {
        "projectId": data["projectId"],
        "equipmentIds": data["equipmentIds"],
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "status": "PENDING_APPROVAL",
        "userId": ObjectId(request.user["id"])
    }

    mongo.db.bookings.insert_one(booking)
    return {"msg": "Booking submitted"}, 201


# ================= STATUS ACTIONS =================
@booking_bp.post("/<id>/approve")
@require_auth("admin")
def approve_booking(id):
    mongo.db.bookings.update_one({"_id": ObjectId(id)}, {"$set": {"status": "APPROVED"}})
    return {"msg": "approved"}


@booking_bp.post("/<id>/reject")
@require_auth("admin")
def reject_booking(id):
    mongo.db.bookings.update_one({"_id": ObjectId(id)}, {"$set": {"status": "REJECTED"}})
    return {"msg": "rejected"}


@booking_bp.post("/<id>/pickup")
@require_auth()
def pickup_booking(id):
    mongo.db.bookings.update_one({"_id": ObjectId(id)}, {"$set": {"status": "PICKED_UP"}})
    return {"msg": "picked"}


@booking_bp.post("/<id>/return")
@require_auth()
def return_booking(id):
    mongo.db.bookings.update_one({"_id": ObjectId(id)}, {"$set": {"status": "RETURNED"}})
    return {"msg": "returned"}


@booking_bp.post("/<id>/close")
@require_auth("admin")
def close_booking(id):
    mongo.db.bookings.update_one({"_id": ObjectId(id)}, {"$set": {"status": "CLOSED"}})
    return {"msg": "closed"}
