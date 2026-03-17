from flask import Blueprint, jsonify, send_file
from middleware.auth_middleware import require_auth
from config.db import mongo
from bson import ObjectId
import pandas as pd
from io import BytesIO
from datetime import datetime

analytics_bp = Blueprint("analytics", __name__)


def parse_date(date_str):
    """Safe ISO parser"""
    try:
        return datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
    except:
        return datetime.now()


@analytics_bp.get("/utilization")
@require_auth("admin")
def equipment_utilization():

    equipment = list(mongo.db.equipment.find({}))
    bookings = list(mongo.db.bookings.find({
        "status": {"$in": ["CLOSED", "PICKED_UP", "RETURNED"]}
    }))

    usage_map = {}

    for eq in equipment:
        usage_map[str(eq["_id"])] = {
            "name": eq["name"],
            "days": 0
        }

    for b in bookings:
        start = parse_date(b.get("startDate", ""))
        end = parse_date(b.get("endDate", ""))
        days = (end - start).days + 1
        if days < 0:
            days = 0

        for eid in b.get("equipmentIds", []):
            key = str(eid)
            if key in usage_map:
                usage_map[key]["days"] += days

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
    approved = 0
    picked_up = 0
    closed = 0

    # ✅ Monthly revenue map — all 12 months initialized to 0
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    monthly_map = {m: 0 for m in month_names}

    # ✅ Load equipment rates for revenue calculation
    eq_rates = {}
    for eq in equipment:
        eq_rates[str(eq["_id"])] = eq.get("dailyRate", 0)

    for b in bookings:
        status = b.get("status", "")

        if status == "PICKED_UP":
            active_rentals += 1
        if status == "PENDING_APPROVAL":
            pending += 1
        if status == "APPROVED":
            approved += 1
        if status == "PICKED_UP":
            picked_up += 1
        if status == "CLOSED":
            closed += 1

        # ✅ Calculate revenue from closed bookings using equipment rates
        if status in ["CLOSED", "RETURNED", "PICKED_UP"]:
            try:
                start = parse_date(b.get("startDate", ""))
                end = parse_date(b.get("endDate", ""))
                days = (end - start).days + 1
                if days < 1:
                    days = 1

                booking_amount = 0
                for eid in b.get("equipmentIds", []):
                    rate = eq_rates.get(str(eid), 0)
                    booking_amount += rate * days

                total_revenue += booking_amount

                # ✅ Add to monthly revenue using startDate month
                month_key = month_names[start.month - 1]
                monthly_map[month_key] += booking_amount

            except Exception as e:
                print("Revenue calc error:", e)
                continue

    # ✅ Also add from transactions collection if exists
    try:
        transactions = list(mongo.db.transactions.find({}))
        for t in transactions:
            total_revenue += t.get("amount", 0)
            raw = t.get("createdAt") or t.get("date") or ""
            try:
                dt = datetime.strptime(str(raw)[:10], "%Y-%m-%d")
                month_key = month_names[dt.month - 1]
                monthly_map[month_key] += t.get("amount", 0)
            except:
                pass
    except:
        pass

    # ✅ Convert to list for recharts
    monthly_revenue = [
        {"month": m, "revenue": monthly_map[m]}
        for m in month_names
    ]

    return jsonify({
        # Keys for Dashboard.js
        "revenue": total_revenue,
        "bookings": len(bookings),
        "equipment": len(equipment),
        "activeRentals": active_rentals,

        # Keys for Analytics.js
        "totalRevenue": total_revenue,
        "totalBookings": len(bookings),
        "pendingBookings": pending,
        "approvedBookings": approved,
        "pickedUpBookings": picked_up,
        "closedBookings": closed,
        "monthlyRevenue": monthly_revenue
    })


@analytics_bp.get("/export")
@require_auth("admin")
def export_analytics():

    bookings = list(mongo.db.bookings.find({}))
    equipment = list(mongo.db.equipment.find({}))

    eq_rates = {}
    for eq in equipment:
        eq_rates[str(eq["_id"])] = {
            "name": eq.get("name", ""),
            "rate": eq.get("dailyRate", 0)
        }

    if not bookings:
        return jsonify({"error": "No data to export"}), 400

    rows = []
    for b in bookings:
        try:
            start = parse_date(b.get("startDate", ""))
            end = parse_date(b.get("endDate", ""))
            days = (end - start).days + 1
            if days < 1:
                days = 1

            amount = 0
            eq_names = []
            for eid in b.get("equipmentIds", []):
                eq_info = eq_rates.get(str(eid), {})
                amount += eq_info.get("rate", 0) * days
                eq_names.append(eq_info.get("name", str(eid)))

            rows.append({
                "Booking ID": str(b["_id"]),
                "Status": b.get("status", ""),
                "Start Date": b.get("startDate", ""),
                "End Date": b.get("endDate", ""),
                "Days": days,
                "Equipment": ", ".join(eq_names),
                "Amount (₹)": amount
            })
        except Exception as e:
            print("Export row error:", e)
            continue

    df = pd.DataFrame(rows)

    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)

    return send_file(
        output,
        download_name="cinerent_analytics.xlsx",
        as_attachment=True,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )