from flask import Blueprint, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId
from flask import Blueprint, request   
dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.get("/customer")
@require_auth("customer")
def customer_dashboard():

    user_id = request.user["id"]

    projects = mongo.db.projects.count_documents({"userId": user_id})
    bookings = list(mongo.db.bookings.find({"userId": user_id}))

    active_rentals = len([
        b for b in bookings
        if b["status"] in ["APPROVED", "PICKED_UP"]
    ])

    closed_ids = [
        str(b["_id"]) for b in bookings if b["status"] == "CLOSED"
    ]

    total_spent = 0
    if closed_ids:
        transactions = mongo.db.transactions.find({
            "bookingId": {"$in": closed_ids}
        })
        for t in transactions:
            total_spent += t["amount"]

    return jsonify({
        "projects": projects,
        "bookings": len(bookings),
        "activeRentals": active_rentals,
        "totalSpent": total_spent
    })
