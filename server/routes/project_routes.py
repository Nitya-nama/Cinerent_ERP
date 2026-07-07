from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth
from bson import ObjectId

project_bp = Blueprint("projects", __name__)

# CUSTOMER — create project
@project_bp.post("")
@require_auth("customer")
def create_project():
    data = request.json or {}

    # ✅ accept "title" (what the client form actually sends) and fall back
    # to "projectName" for backwards compatibility with older clients
    title = data.get("title") or data.get("projectName")

    if not title:
        return jsonify({"error": "Project title is required"}), 400

    project = {
        "title": title,
        "description": data.get("description", ""),
        "shootType": data.get("shootType", ""),
        "location": data.get("location", ""),
        "clientName": data.get("clientName", ""),
        "startDate": data.get("startDate", ""),
        "endDate": data.get("endDate", ""),
        "userId": request.user["id"]  # ✅ always store as string
    }

    result = mongo.db.projects.insert_one(project)
    project["_id"] = str(result.inserted_id)
    return jsonify({"msg": "Project created", "project": project}), 201


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


# CUSTOMER — delete own project
@project_bp.delete("/<project_id>")
@require_auth("customer")
def delete_project(project_id):
    try:
        oid = ObjectId(project_id)
    except Exception:
        return jsonify({"error": "Invalid project id"}), 400

    project = mongo.db.projects.find_one({"_id": oid})
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # only the owner can delete their own project
    if str(project.get("userId")) != str(request.user["id"]):
        return jsonify({"error": "Forbidden"}), 403

    mongo.db.projects.delete_one({"_id": oid})
    return jsonify({"msg": "Project deleted"}), 200