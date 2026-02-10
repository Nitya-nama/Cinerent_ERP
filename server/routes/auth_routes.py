from flask import Blueprint, request, jsonify
from config.db import mongo
from config.jwt_handler import create_token
import bcrypt

auth_bp = Blueprint("auth", __name__)

# REGISTER
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
        "role": data.get("role", "customer")
    }

    mongo.db.users.insert_one(user)
    return jsonify({"msg": "User created"}), 201


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
