from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId

project_bp = Blueprint("projects", __name__)

# CUSTOMER — create project
@project_bp.post("")
@require_auth("customer")
def create_project():
    data = request.json

    if not data.get("projectName") or not data.get("startDate") or not data.get("endDate"):
        return jsonify({"error": "Missing required fields"}), 400

    project = {
        "projectName": data["projectName"],
        "shootType": data.get("shootType", ""),
        "location": data.get("location", ""),
        "clientName": data.get("clientName", ""),
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "userId": request.user["id"]  # ✅ always store as string
    }

    mongo.db.projects.insert_one(project)
    return jsonify({"msg": "Project created"}), 201


# CUSTOMER — view own projects
@project_bp.get("")
@require_auth("customer")
def get_projects():
    user_id = request.user["id"]

    # ✅ match both string and ObjectId
    projects = list(mongo.db.projects.find({
        "$or": [
            {"userId": user_id},
            {"userId": ObjectId(user_id)}
        ]
    }))

    for p in projects:
        p["_id"] = str(p["_id"])
        if isinstance(p.get("userId"), ObjectId):
            p["userId"] = str(p["userId"])

    return jsonify(projects), 200