from flask import Blueprint, request, jsonify
from config.db import mongo
from middleware.auth_middleware import require_auth

project_bp = Blueprint("projects", __name__)

# CUSTOMER — create project
@project_bp.post("")
@require_auth("customer")
def create_project():
    data = request.json

    project = {
        "projectName": data["projectName"],
        "shootType": data.get("shootType", ""),
        "location": data.get("location", ""),
        "clientName": data.get("clientName", ""),
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "userId": request.user["id"]
    }

    mongo.db.projects.insert_one(project)

    return {"msg": "Project created"}, 201


# CUSTOMER — view own projects
@project_bp.get("")
@require_auth("customer")
def get_projects():
    projects = list(mongo.db.projects.find({"userId": request.user["id"]}))

    for p in projects:
        p["_id"] = str(p["_id"])

    return jsonify(projects)
