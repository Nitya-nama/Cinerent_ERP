import jwt, datetime, os
from dotenv import load_dotenv

load_dotenv()
SECRET = os.getenv("JWT_SECRET")

def create_token(user):
    payload = {
        "id": str(user["_id"]),
        "role": user["role"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def decode_token(token):
    return jwt.decode(token, SECRET, algorithms=["HS256"])
