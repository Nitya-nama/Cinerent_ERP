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
from routes.invoice_routes import invoice_bp  # NEW (Feature 3)
from routes.payment_routes import payment_bp  # NEW (Feature 4)

import os

# load env from server folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

app = Flask(__name__)
CORS(app, origins="*" , supports_credentials=True)


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
app.register_blueprint(invoice_bp, url_prefix="/api/invoices")  # NEW (Feature 3)
app.register_blueprint(payment_bp, url_prefix="/api/payments")  # NEW (Feature 4)

@app.route("/")
def home():
    return {"status": "backend connected to mongodb"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)