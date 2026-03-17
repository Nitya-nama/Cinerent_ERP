from flask import Blueprint, jsonify, send_file
from middleware.auth_middleware import require_auth
from config.db import mongo
from bson import ObjectId
import pandas as pd
from io import BytesIO
from datetime import datetime   # ✅ IMPORTANT FIX

analytics_bp = Blueprint("analytics", __name__)


def parse_date(date_str):
    """Safe ISO parser for Python 3.8"""
    try:
        return datetime.strptime(date_str, "%Y-%m-%d")
    except:
        try:
            return datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S")
        except:
            return datetime.now()


@analytics_bp.get("/utilization")
@require_auth("admin")
def equipment_utilization():

    equipment = list(mongo.db.equipment.find({}))
    bookings = list(mongo.db.bookings.find({"status": "CLOSED"}))

    usage_map = {}

    for eq in equipment:
        usage_map[str(eq["_id"])] = {
            "name": eq["name"],
            "days": 0
        }

    for b in bookings:
        start = parse_date(b["startDate"])
        end = parse_date(b["endDate"])
        days = (end - start).days + 1

        for eid in b["equipmentIds"]:
            if str(eid) in usage_map:
                usage_map[str(eid)]["days"] += days

    result = [
        {"equipment": data["name"], "daysUsed": data["days"]}
        for data in usage_map.values()
    ]

    return jsonify(result)


@analytics_bp.get("/dashboard")
@require_auth("admin")
def dashboard():

    bookings = list(mongo.db.bookings.find())
    equipment = list(mongo.db.equipment.find())

    total_revenue = 0
    active_rentals = 0
    pending = 0

    for b in bookings:
        if b["status"] == "PICKED_UP":
            active_rentals += 1
        if b["status"] == "PENDING_APPROVAL":
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
    })


@analytics_bp.get("/export")
@require_auth("admin")
def export_analytics():

    transactions = list(mongo.db.transactions.find({}))

    if not transactions:
        return {"error": "No data to export"}, 400

    rows = [{
        "Booking ID": t.get("bookingId"),
        "Days": t.get("days"),
        "Amount": t.get("amount")
    } for t in transactions]

    df = pd.DataFrame(rows)

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(
        output,
        download_name="cinerent_analytics.xlsx",
        as_attachment=True
    )
