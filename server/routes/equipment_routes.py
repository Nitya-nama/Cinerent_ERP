from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId
from flask_cors import cross_origin

# NEW (Feature 1) - QR + auto status helpers. Isolated service file,
# does not touch existing booking logic.
from services.equipment_service import (
    generate_qr_code,
    recompute_equipment_status,
    STATUS_VALUES,
)

equipment_bp = Blueprint("equipment", __name__)

# PUBLIC — catalog
@equipment_bp.get("")
def get_equipment():
    # NEW (Feature 1) - optional search/filter query params.
    # Existing callers that pass no query params get EXACTLY the same
    # response as before (all equipment, same fields).
    query = {}
    search = request.args.get("search")
    category = request.args.get("category")
    status = request.args.get("status")

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"model": {"$regex": search, "$options": "i"}},
            {"serialNumber": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    if status:
        query["status"] = status

    items = list(mongo.db.equipment.find(query))
    for i in items:
        i["_id"] = str(i["_id"])
    return jsonify(items)


# NEW (Feature 1) — GET single equipment details (view equipment details).
# This is a brand new route (GET "/<id>" did not exist before), so it
# cannot collide with or change any existing endpoint.
@equipment_bp.get("/<id>")
def get_equipment_detail(id):
    try:
        item = mongo.db.equipment.find_one({"_id": ObjectId(id)})
    except Exception:
        return {"error": "Invalid equipment id"}, 400

    if not item:
        return {"error": "Equipment not found"}, 404

    item["_id"] = str(item["_id"])
    return jsonify(item)


# ADMIN — add equipment
@equipment_bp.post("")
@require_auth("admin")
def add_equipment():
    data = request.json
    equipment = {
        # --- existing fields, unchanged ---
        "name": data["name"],
        "category": data["category"],
        "serialNumber": data["serialNumber"],
        "condition": "available",
        "dailyRate": data["dailyRate"],
        "depositAmount": data["depositAmount"],
        "specifications": data.get("specifications", ""),
        "imageUrl": data.get("imageUrl", ""),

        # --- NEW fields (Feature 1), all optional / backward compatible ---
        "brand": data.get("brand", ""),
        "model": data.get("model", ""),
        "purchaseDate": data.get("purchaseDate", ""),
        "purchasePrice": data.get("purchasePrice", 0),
        "vendor": data.get("vendor", ""),
        "warrantyExpiry": data.get("warrantyExpiry", ""),
        "currentLocation": data.get("currentLocation", ""),
        "equipmentCondition": data.get("equipmentCondition", "New"),
        # New 6-value lifecycle status (separate from the existing
        # "condition" field above, which the current UI already relies on
        # for its Available/In-Use badge — left untouched to avoid breaking it).
        "status": data.get("status", "Available"),
    }
    result = mongo.db.equipment.insert_one(equipment)

    # NEW — generate a QR code for this equipment and store it.
    # Degrades gracefully (qrCode stays empty) if the qrcode package
    # isn't installed yet, so this can never break equipment creation.
    qr_code = generate_qr_code(f"EQUIPMENT:{str(result.inserted_id)}")
    if qr_code:
        mongo.db.equipment.update_one(
            {"_id": result.inserted_id},
            {"$set": {"qrCode": qr_code}}
        )

    return {"msg": "Equipment added", "id": str(result.inserted_id)}, 201


# ADMIN — update equipment
@equipment_bp.patch("/<id>")
@require_auth("admin")
def update_equipment(id):
    mongo.db.equipment.update_one(
        {"_id": ObjectId(id)},
        {"$set": request.json}
    )
    return {"msg": "Equipment updated"}


# NEW (Feature 1) — ADMIN: explicitly set the lifecycle status
# (e.g. mark equipment "Under Maintenance", "Damaged", or "Lost").
# New endpoint — does not replace the generic PATCH above.
@equipment_bp.post("/<id>/status")
@require_auth("admin")
def set_equipment_status(id):
    data = request.json or {}
    status = data.get("status")

    if status not in STATUS_VALUES:
        return {"error": f"status must be one of {STATUS_VALUES}"}, 400

    mongo.db.equipment.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status}}
    )
    return {"msg": "Equipment status updated", "status": status}, 200


# ✅ ADMIN — delete equipment
@equipment_bp.delete("/<id>")
@require_auth("admin")
def delete_equipment(id):
    result = mongo.db.equipment.delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        return {"error": "Equipment not found"}, 404

    return {"msg": "Equipment deleted"}, 200
