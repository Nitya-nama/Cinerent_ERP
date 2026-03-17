from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId

booking_bp = Blueprint("booking", __name__)

# ================= ASSIGN STAFF =================
@booking_bp.post("/<id>/assign-staff")
@require_auth("admin")
def assign_staff(id):
    data = request.json
    staff_id = data.get("staffId")

    if not staff_id:
        return jsonify({"error": "staffId required"}), 400

    try:
        mongo.db.bookings.update_one(
            {"_id": ObjectId(id)},
            {"$set": {"assignedStaff": staff_id}}
        )
        return jsonify({"msg": "Staff assigned"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= CHECK CONFLICT (must be before /<id>) =================
@booking_bp.post("/check-conflict")
@require_auth()
def check_conflict():
    data = request.json
    equipment_ids = data.get("equipmentIds", [])
    start = data.get("startDate")
    end = data.get("endDate")

    conflict = False

    for eid in equipment_ids:
        existing = mongo.db.bookings.find({
            "equipmentIds": eid,
            "status": {"$in": ["PENDING_APPROVAL", "APPROVED", "PICKED_UP"]}
        })

        for b in existing:
            b_start = b["startDate"]
            b_end = b["endDate"]
            if start <= b_end and end >= b_start:
                conflict = True
                break

        if conflict:
            break

    return jsonify({"conflict": conflict}), 200


# ================= STAFF BOOKINGS (must be before /<id>) =================
@booking_bp.get("/staff/my")
@require_auth("staff")
def staff_my_bookings():
    user_id = request.user["id"]

    try:
        cursor = mongo.db.bookings.find({
            "assignedStaff": ObjectId(user_id)
        })
    except Exception:
        cursor = mongo.db.bookings.find({
            "assignedStaff": user_id
        })

    bookings = []
    for b in cursor:
        b["_id"] = str(b["_id"])
        if b.get("assignedStaff"):
            b["assignedStaff"] = str(b["assignedStaff"])
        bookings.append(b)

    return jsonify(bookings), 200


# ================= GET ALL BOOKINGS =================
@booking_bp.get("")
@require_auth()
def get_bookings():
    role = request.user["role"]
    user_id = request.user["id"]

    try:
        if role == "admin":
            cursor = mongo.db.bookings.find({})

        elif role == "staff":
            # ✅ Staff sees ALL bookings — not just assigned ones
            # since assignedStaff is never set during booking creation
            cursor = mongo.db.bookings.find({})

        else:  # customer
            cursor = mongo.db.bookings.find({
                "$or": [
                    {"userId": user_id},
                    {"userId": ObjectId(user_id)}
                ]
            })

        bookings = []
        for b in cursor:
            b["_id"] = str(b["_id"])
            if b.get("assignedStaff"):
                b["assignedStaff"] = str(b["assignedStaff"])
            if isinstance(b.get("userId"), ObjectId):
                b["userId"] = str(b["userId"])
            bookings.append(b)

        return jsonify(bookings), 200

    except Exception as e:
        print("GET BOOKINGS ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ================= GET SINGLE BOOKING =================
@booking_bp.get("/<id>")
@require_auth()
def get_booking(id):
    try:
        b = mongo.db.bookings.find_one({"_id": ObjectId(id)})
        if not b:
            return jsonify({"error": "Booking not found"}), 404

        b["_id"] = str(b["_id"])
        if isinstance(b.get("userId"), ObjectId):
            b["userId"] = str(b["userId"])
        if b.get("assignedStaff"):
            b["assignedStaff"] = str(b["assignedStaff"])

        return jsonify(b), 200

    except Exception as e:
        print("GET BOOKING ERROR:", e)
        return jsonify({"error": str(e)}), 500


# ================= CREATE BOOKING =================
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
        "userId": request.user["id"]
    }

    mongo.db.bookings.insert_one(booking)
    return jsonify({"msg": "Booking submitted"}), 201


# ================= STATUS ACTIONS =================
@booking_bp.post("/<id>/approve")
@require_auth("admin")
def approve_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "APPROVED"}}
    )
    return jsonify({"msg": "approved"}), 200


@booking_bp.post("/<id>/reject")
@require_auth("admin")
def reject_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "REJECTED"}}
    )
    return jsonify({"msg": "rejected"}), 200


@booking_bp.post("/<id>/pickup")
@require_auth()
def pickup_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "PICKED_UP"}}
    )
    return jsonify({"msg": "picked"}), 200


@booking_bp.post("/<id>/return")
@require_auth()
def return_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "RETURNED"}}
    )
    return jsonify({"msg": "returned"}), 200


@booking_bp.post("/<id>/close")
@require_auth("admin")
def close_booking(id):
    mongo.db.bookings.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "CLOSED"}}
    )
    return jsonify({"msg": "closed"}), 200