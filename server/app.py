from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv

from config.db import mongo
from routes.auth_routes import auth_bp
from routes.equipment_routes import equipment_bp
from routes.project_routes import project_bp
from routes.booking_routes import booking_bp
from routes.analytics_routes import analytics_bp
from routes.dashboard import dashboard_bp  # ✅ was never imported

import os

# load env from server folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True
)

# MongoDB
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
print("MONGO URI =", os.getenv("MONGO_URI"))
mongo.init_app(app)

# ✅ Register all blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(equipment_bp, url_prefix="/api/equipment")
app.register_blueprint(project_bp, url_prefix="/api/projects")
app.register_blueprint(booking_bp, url_prefix="/api/bookings")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")  # ✅ now registered

@app.route("/")
def home():
    return {"status": "backend connected to mongodb"}

if __name__ == "__main__":
    app.run(debug=True)