import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function Equipment() {

  const emptyForm = {
    name: "",
    category: "",
    brand: "",
    quantityTotal: 1,
    dailyRate: 0
  };

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const generateSerial = () => {
  return "EQ-" + Date.now().toString(36) + "-" + Math.floor(Math.random()*9999);
  };

  /* ---------------- LOAD EQUIPMENT ---------------- */
  const loadEquipment = async () => {
    try {
      const res = await api.get("/equipment");
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load equipment", err);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name.includes("quantity") || name === "dailyRate"
        ? Number(value)
        : value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (editingId) {

      // backend uses PATCH
      await api.patch(`/equipment/${editingId}`, {
        name: form.name,
        category: form.category,
        serialNumber: form.serialNumber || generateSerial(),
        dailyRate: form.dailyRate,
        depositAmount: 0,
        specifications: "",
        imageUrl: ""
      });

    } else {

      // match backend schema exactly
      await api.post("/equipment", {
        name: form.name,
        category: form.category,
        serialNumber: generateSerial(),
        dailyRate: form.dailyRate,
        depositAmount: 0,
        specifications: "",
        imageUrl: ""
      });

    }

    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    loadEquipment();

  } catch (err) {
    console.error("Save failed", err.response?.data || err.message);
    alert("Error saving equipment");
  }
};


  /* ---------------- EDIT ---------------- */
const startEdit = (item) => {
  setEditingId(item._id || item.id);
  setShowForm(true);
  setForm({
    name: item.name || "",
    category: item.category || "",
    brand: item.brand || "",
    quantityTotal: item.quantityTotal || 1,
    dailyRate: item.dailyRate || 0,
    serialNumber: item.serialNumber || ""
  });
};

  /* ---------------- DELETE ---------------- */
  const removeItem = async (id) => {
    if (!window.confirm("Delete this equipment?")) return;

    try {
      await api.delete(`/equipment/${id}`);
      loadEquipment();
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Equipment Inventory</h2>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Equipment
        </button>
      </div>

      {/* FORM */}
      {showForm && (
      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingId ? "Edit Equipment" : "Add New Equipment"}
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-5 gap-4">

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Equipment Name</label>
            <input name="name" placeholder="Sony FX3 Camera" value={form.name} onChange={handleChange} className="border p-2 rounded" required/>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Category</label>
            <input name="category" placeholder="Camera / Lens / Light" value={form.category} onChange={handleChange} className="border p-2 rounded" required/>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Brand / Model</label>
            <input name="brand" placeholder="Sony / Canon / ARRI" value={form.brand} onChange={handleChange} className="border p-2 rounded"/>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Units Owned</label>
            <input type="number" name="quantityTotal" min="1" value={form.quantityTotal} onChange={handleChange} className="border p-2 rounded"/>
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Rent per Day (₹)</label>
            <input type="number" name="dailyRate" min="0" value={form.dailyRate} onChange={handleChange} className="border p-2 rounded"/>
          </div>

          <div className="col-span-5 flex gap-3 mt-2">
            <button className="flex-1 bg-green-600 text-white py-2 rounded-lg">
              {editingId ? "Update Equipment" : "Create Equipment"}
            </button>

            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-300 py-2 rounded-lg">
              Cancel
            </button>
          </div>

        </form>
      </div>
      )}

      {/* EQUIPMENT CARDS */}
      <div className="grid grid-cols-3 gap-5">
        {items.map(item => {
          const id = item._id || item.id;

          return (
            <div key={id} className="bg-white shadow rounded-xl p-4">
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <p className="text-gray-500">{item.brand}</p>

              <div className="mt-3 flex justify-between text-sm">
                <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                <span className={`px-2 py-1 rounded text-sm font-medium
                ${item.condition === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"}
                `}>
                {item.condition === "available" ? "Available" : "In Use"}
                </span>
              </div>

              <div className="mt-4 font-bold text-lg">
                ₹{item.dailyRate} / day
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => startEdit(item)} className="flex-1 bg-yellow-400 py-1 rounded">
                  Edit
                </button>

                <button onClick={() => removeItem(id)} className="flex-1 bg-red-500 text-white py-1 rounded">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}