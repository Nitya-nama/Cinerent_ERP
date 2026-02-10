from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from flask import Flask, request
from routes.equipment_routes import equipment_bp
from routes.project_routes import project_bp
from routes.booking_routes import booking_bp
from middleware.auth_middleware import require_auth
import os

# load env from server folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from config.db import mongo
from routes.auth_routes import auth_bp

app = Flask(__name__)
CORS(app)

# MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
print("MONGO URI =", os.getenv("MONGO_URI"))
mongo.init_app(app)

# register auth routes
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(equipment_bp, url_prefix="/api/equipment")
app.register_blueprint(project_bp, url_prefix="/api/projects")
app.register_blueprint(booking_bp, url_prefix="/api/bookings")

@app.route("/")
def home():
    return {"status": "backend connected to mongodb"}


@app.route("/test-db")
def test_db():
    mongo.db.test.insert_one({"msg": "mongodb working"})
    return {"db": "inserted"}


@app.route("/secure")
@require_auth()
def secure():
    return {"msg": "You are authenticated", "user": request.user}


if __name__ == "__main__":
    app.run(debug=True)
