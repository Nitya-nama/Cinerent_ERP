from flask import Blueprint, request, jsonify
from config.db import mongo
from config.jwt_handler import create_token
from middleware.auth_middleware import require_auth
from bson import ObjectId   # ✅ REQUIRED
import bcrypt

auth_bp = Blueprint("auth", __name__)

@auth_bp.get("/admin/users")
@require_auth("admin")
def list_users():
    users = mongo.db.users.find({}, {"password": 0})
    return jsonify(list(users)), 200

# REGISTER (PUBLIC)
@auth_bp.post("/register")
def register():
    data = request.json

    if mongo.db.users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    user = {
        "name": data["name"],
        "email": data["email"],
        "password": hashed,
        "role": "customer"   # 🔒 FORCE CUSTOMER
    }

    mongo.db.users.insert_one(user)
    return jsonify({"msg": "User created"}), 201

@auth_bp.post("/admin/create-user")
@require_auth("admin")
def admin_create_user():
    data = request.json

    if mongo.db.users.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt())

    mongo.db.users.insert_one({
        "name": data["name"],
        "email": data["email"],
        "password": hashed,
        "role": data["role"],   # ✅ comma fixed
        "active": True
    })

    return jsonify({"msg": "User created by admin"}), 201

@auth_bp.patch("/admin/users/<user_id>/toggle")
@require_auth("admin")
def toggle_user(user_id):
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}, 404

    new_state = not user.get("active", True)

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"active": new_state}}
    )

    return {"msg": "User updated", "active": new_state}, 200

@auth_bp.patch("/admin/users/<user_id>/role")
@require_auth("admin")
def update_role(user_id):
    data = request.json
    role = data.get("role")

    if role not in ["admin", "staff", "customer"]:
        return {"error": "Invalid role"}, 400

    mongo.db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role}}
    )

    return {"msg": "Role updated"}, 200


# LOGIN
@auth_bp.post("/login")
def login():
    data = request.json
    user = mongo.db.users.find_one({"email": data["email"]})

    if not user or not bcrypt.checkpw(data["password"].encode(), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(user)

    return jsonify({
        "token": token,
        "role": user["role"],
        "name": user["name"]
    })
