from config.db import mongo
from datetime import datetime

def is_equipment_available(equipment_id, start, end):

    start = datetime.fromisoformat(start)
    end = datetime.fromisoformat(end)

    bookings = mongo.db.bookings.find({
        "equipmentIds": equipment_id,
        "status": {"$in": ["PENDING_APPROVAL", "APPROVED", "PICKED_UP"] }
    })

    for b in bookings:
        b_start = datetime.fromisoformat(b["startDate"])
        b_end = datetime.fromisoformat(b["endDate"])

        # OVERLAP CONDITION
        if start <= b_end and end >= b_start:
            return False

    return True
