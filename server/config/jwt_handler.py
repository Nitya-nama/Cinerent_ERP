import jwt
import os
from datetime import datetime, timedelta

SECRET = os.getenv("JWT_SECRET", "devsecret")

def create_token(user):
    payload = {
        "id": str(user["_id"]),
        "role": user["role"],
        "exp": datetime.utcnow() + timedelta(hours=10)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")
