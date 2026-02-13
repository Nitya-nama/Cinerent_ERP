app.register_blueprint(equipment_bp, url_prefix="/api/equipment")
app.register_blueprint(project_bp, url_prefix="/api/projects")
app.register_blueprint(booking_bp, url_prefix="/api/bookings")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")