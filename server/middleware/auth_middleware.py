from functools import wraps
from flask import request, jsonify
from config.jwt_handler import decode_token

def require_auth(role=None):
    def wrapper(fn):
        @wraps(fn)
        def decorated(*args, **kwargs):
            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return jsonify({"error": "Missing token"}), 401

            try:
                token = auth_header.split()[1]
                user = decode_token(token)
            except:
                return jsonify({"error": "Invalid or expired token"}), 401

            # role check
            if role and user["role"] != role:
                return jsonify({"error": "Forbidden"}), 403

            request.user = user
            return fn(*args, **kwargs)
        return decorated
    return wrapper
