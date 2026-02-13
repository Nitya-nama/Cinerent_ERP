import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { useCallback, useEffect, useState } from "react";

export default function CreateBooking() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState([]);
  const [selected, setSelected] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [conflict, setConflict] = useState(false);
  const [checking, setChecking] = useState(false);

  /* LOAD EQUIPMENT */
  useEffect(() => {
    api.get("/equipment").then(res => setEquipment(res.data || []));
  }, []);

  /* CHECK CONFLICT */
  const checkConflict = useCallback(async () => {
  if (!startDate || !endDate || selected.length === 0) return;

  try {
    setChecking(true);
    const res = await api.post("/bookings/check-conflict", {
      equipmentIds: selected,
      startDate,
      endDate
    });
    setConflict(res.data.conflict);
  } catch {
    setConflict(false);
  } finally {
    setChecking(false);
  }
}, [startDate, endDate, selected]);

    useEffect(() => {
    checkConflict();
    }, [checkConflict]);


  /* CREATE BOOKING */
  const submitBooking = async () => {
    if (conflict) return;

    try {
      await api.post("/bookings", {
        projectId,
        equipmentIds: selected,
        startDate,
        endDate
      });

      navigate("/projects");
    } catch (err) {
      alert(err.response?.data?.error || "Booking failed");
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Create Booking</h2>

      {/* DATES */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border p-2 rounded"/>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border p-2 rounded"/>
      </div>

      {/* EQUIPMENT */}
      <div className="grid grid-cols-3 gap-3">
        {equipment.map(e => (
          <label key={e._id} className="border p-2 rounded cursor-pointer">
            <input
              type="checkbox"
              value={e._id}
              onChange={ev => {
                const id = ev.target.value;
                setSelected(prev =>
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                );
              }}
            />{" "}
            {e.name}
          </label>
        ))}
      </div>

      {/* CONFLICT WARNING */}
      {checking && (
        <p className="mt-4 text-yellow-600">Checking availability...</p>
      )}

      {conflict && (
        <div className="mt-4 bg-red-100 text-red-700 p-3 rounded">
          ⚠️ One or more selected items are already booked for these dates.
        </div>
      )}

      {/* SUBMIT */}
      <button
        disabled={conflict || checking}
        onClick={submitBooking}
        className={`mt-6 px-4 py-2 rounded text-white ${
          conflict ? "bg-gray-400" : "bg-black"
        }`}
      >
        Request Booking
      </button>
    </div>
  );
}
