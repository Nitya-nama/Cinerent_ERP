from flask import Blueprint, jsonify
from middleware.auth_middleware import require_auth
from config.db import mongo
from bson import ObjectId
from flask import Blueprint, send_file
from config.db import mongo
from middleware.auth_middleware import require_auth
import pandas as pd
from io import BytesIO
import datetime
    
analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.get("/utilization")
@require_auth("admin")
def equipment_utilization():
    equipment = list(mongo.db.equipment.find({}))
    bookings = list(mongo.db.bookings.find({"status": "CLOSED"}))
    usage_map = {}
    # initialize
    for eq in equipment:
        usage_map[str(eq["_id"])] = {
            "name": eq["name"],
            "days": 0
        }
    # accumulate booking days
    for b in bookings:
        days = (
            datetime.fromisoformat(b["endDate"]) -
            datetime.fromisoformat(b["startDate"])
        ).days + 1
        for eid in b["equipmentIds"]:
            if eid in usage_map:
                usage_map[eid]["days"] += days
    result = []
    for eid, data in usage_map.items():
        result.append({
            "equipment": data["name"],
            "daysUsed": data["days"]
        })
    return jsonify(result)

@analytics_bp.route("/dashboard", methods=["GET"])
@require_auth(role="admin")
def dashboard():
    bookings = list(mongo.db.bookings.find())
    equipment = list(mongo.db.equipment.find())
    total_revenue = 0
    active_rentals = 0
    pending = 0
    for b in bookings:
        if b["status"] == "CLOSED":
            total_revenue += b.get("totalAmount", 0)
        if b["status"] == "PICKED_UP":
            active_rentals += 1
        if b["status"] == "PENDING_APPROVAL":
            pending += 1
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

    rows = []
    for t in transactions:
        rows.append({
            "Booking ID": t.get("bookingId"),
            "Days": t.get("days"),
            "Amount": t.get("amount"),
            "Created At": t.get("createdAt")
        })

    df = pd.DataFrame(rows)

    output = BytesIO()
    df.to_excel(output, index=False, sheet_name="Revenue")
    output.seek(0)

    return send_file(
        output,
        download_name="cinerent_analytics.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )    
    