from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId

equipment_bp = Blueprint("equipment", __name__)

# PUBLIC — catalog
@equipment_bp.get("")
def get_equipment():
    items = list(mongo.db.equipment.find())

    for i in items:
        i["_id"] = str(i["_id"])

    return jsonify(items)


# ADMIN — add equipment
@equipment_bp.post("")
@require_auth("admin")
def add_equipment():
    data = request.json

    equipment = {
        "name": data["name"],
        "category": data["category"],
        "serialNumber": data["serialNumber"],
        "condition": "available",
        "dailyRate": data["dailyRate"],
        "depositAmount": data["depositAmount"],
        "specifications": data.get("specifications", ""),
        "imageUrl": data.get("imageUrl", "")
    }

    mongo.db.equipment.insert_one(equipment)

    return {"msg": "Equipment added"}, 201


# ADMIN — update equipment
@equipment_bp.patch("/<id>")
@require_auth("admin")
def update_equipment(id):
    mongo.db.equipment.update_one(
        {"_id": ObjectId(id)},
        {"$set": request.json}
    )

    return {"msg": "Equipment updated"}
