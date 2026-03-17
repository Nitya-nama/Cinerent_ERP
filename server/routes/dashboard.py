from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/customer")
@require_auth("customer")
def customer_dashboard():

    user_id = request.user["id"]

    # ✅ Try both string and ObjectId to match whatever is stored
    projects = mongo.db.projects.count_documents({
        "$or": [
            {"userId": user_id},
            {"userId": ObjectId(user_id)}
        ]
    })

    bookings = list(mongo.db.bookings.find({
        "$or": [
            {"userId": user_id},
            {"userId": ObjectId(user_id)}
        ]
    }))

    active_rentals = len([
        b for b in bookings
        if b.get("status") in ["APPROVED", "PICKED_UP"]
    ])

    # ✅ Get closed booking IDs for transaction lookup
    closed_ids = [
        str(b["_id"]) for b in bookings
        if b.get("status") == "CLOSED"
    ]

    total_spent = 0
    if closed_ids:
        transactions = mongo.db.transactions.find({
            "bookingId": {"$in": closed_ids}
        })
        for t in transactions:
            total_spent += t.get("amount", 0)

    return jsonify({
        "projects": projects,
        "bookings": len(bookings),
        "activeRentals": active_rentals,
        "totalSpent": total_spent
    }), 200


@dashboard_bp.get("/admin")
@require_auth("admin")
def admin_dashboard():

    bookings = list(mongo.db.bookings.find())
    equipment = list(mongo.db.equipment.find())

    total_revenue = 0
    active_rentals = 0
    pending = 0

    for b in bookings:
        status = b.get("status", "")
        if status == "PICKED_UP":
            active_rentals += 1
        if status == "PENDING_APPROVAL":
            pending += 1

    transactions = list(mongo.db.transactions.find({}))
    for t in transactions:
        total_revenue += t.get("amount", 0)

    return jsonify({
        "revenue": total_revenue,
        "bookings": len(bookings),
        "equipment": len(equipment),
        "activeRentals": active_rentals,
        "pendingApprovals": pending
    }), 200