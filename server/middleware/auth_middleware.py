from functools import wraps
from flask import request, jsonify
import jwt
import os

SECRET = os.getenv("JWT_SECRET", "devsecret")

def require_auth(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):

            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return jsonify({"error": "Missing token"}), 401

            try:
                token = auth_header.split(" ")[1]
                decoded = jwt.decode(token, SECRET, algorithms=["HS256"])

                request.user = {
                    "id": decoded["id"],
                    "role": decoded["role"]
                }

                # ✅ role can be a list or single string
                if role:
                    allowed = role if isinstance(role, list) else [role]
                    if decoded["role"] not in allowed:
                        return jsonify({"error": "Forbidden"}), 403

            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception as e:
                print("JWT ERROR:", e)
                return jsonify({"error": "Invalid token"}), 401

            return fn(*args, **kwargs)

        return wrapper
    return decorator