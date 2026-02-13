import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Projects() {
  const navigate = useNavigate();

  const emptyForm = {
    projectName: "",
    shootType: "",
    location: "",
    clientName: "",
    startDate: "",
    endDate: ""
  };

  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  /* ---------- LOAD PROJECTS ---------- */
  const loadProjects = async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data || []);
    } catch (err) {
      console.log("Failed loading projects", err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  /* ---------- INPUT ---------- */
  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ---------- CREATE PROJECT ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/projects", form);
      setForm(emptyForm);
      setShowForm(false);
      loadProjects();
    } catch (err) {
      console.log("Create project error", err.response?.data || err.message);
      alert("Could not create project");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Projects</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + New Project
        </button>
      </div>

      {/* CREATE FORM */}
      {showForm && (
        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Create Project</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
            <input
              name="projectName"
              placeholder="Project Name"
              value={form.projectName}
              onChange={handleChange}
              className="border p-2 rounded"
              required
            />

            <input
              name="clientName"
              placeholder="Client Name"
              value={form.clientName}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <input
              name="shootType"
              placeholder="Shoot Type (Wedding, Ad, Film)"
              value={form.shootType}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="border p-2 rounded"
            />

            <div className="flex flex-col">
              <label className="text-sm text-gray-600">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-600">End Date</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              />
            </div>

            <div className="col-span-3 flex gap-3 mt-2">
              <button className="flex-1 bg-green-600 text-white py-2 rounded-lg">
                Create Project
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PROJECT CARDS */}
      <div className="grid grid-cols-3 gap-5">
        {projects.map(p => (
          <div key={p._id} className="bg-white shadow rounded-xl p-4">
            <h3 className="text-xl font-semibold">{p.projectName}</h3>
            <p className="text-gray-500">{p.clientName}</p>

            <div className="mt-2 text-sm text-gray-600">{p.location}</div>

            <div className="mt-3 font-medium">
              {p.startDate} → {p.endDate}
            </div>

            <div className="mt-3 text-blue-600 text-sm">{p.shootType}</div>

            {/* ✅ Correct place for booking */}
            <button
              onClick={() => navigate(`/projects/${p._id}/book`)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Book Equipment
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
