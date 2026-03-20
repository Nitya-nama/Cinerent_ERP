import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/api";

const STEPS = ["Select Equipment", "Choose Dates", "Review & Book"];

export default function CreateBooking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects]   = useState([]);
  const [step, setStep]           = useState(0);
  const [selected, setSelected]   = useState([]);
  const [dates, setDates]         = useState({ startDate: "", endDate: "" });
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");

  useEffect(() => {
    Promise.all([api.get("/equipment"), api.get("/projects")])
      .then(([er, pr]) => {
        setEquipment(er.data || []);
        setProjects(pr.data || []);
      });
  }, []);

  const toggle = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getDays = () => {
    if (!dates.startDate || !dates.endDate) return 0;
    return Math.max(0, Math.round((new Date(dates.endDate) - new Date(dates.startDate)) / 86400000) + 1);
  };

  const getTotal = () => {
    const days = getDays();
    return selected.reduce((sum, id) => {
      const eq = equipment.find(e => e._id === id);
      return sum + (eq ? eq.dailyRate * days : 0);
    }, 0);
  };

  const submit = async () => {
    try {
      setLoading(true);
      await api.post("/bookings", {
        equipmentIds: selected,
        startDate: dates.startDate,
        endDate: dates.endDate,
        projectId: projectId || undefined,
      });
      navigate("/bookings");
    } catch { alert("Failed to create booking"); }
    finally { setLoading(false); }
  };

  const filteredEquipment = equipment.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  const canNext = [
    selected.length > 0,
    dates.startDate && dates.endDate && dates.endDate >= dates.startDate,
    true
  ][step];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">New Booking</h1>
        <p className="page-subtitle">Reserve equipment for your production</p>
      </div>

      {/* STEPPER */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: i < step ? "var(--teal)" : i === step ? "var(--sidebar-bg)" : "var(--line)",
                color: i <= step ? "#fff" : "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 13, flexShrink: 0, transition: "all 0.2s"
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 13, fontWeight: i === step ? 600 : 400,
                color: i === step ? "var(--text)" : "var(--muted)"
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? "var(--teal)" : "var(--line)", margin: "0 16px", transition: "all 0.3s" }} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 0 — EQUIPMENT SELECTOR */}
      {step === 0 && (
        <div>
          <div style={{ marginBottom: 20, maxWidth: 360 }}>
            <input className="input" placeholder="Search equipment…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {selected.length > 0 && (
            <div style={{
              background: "var(--teal-dim)", border: "1.5px solid var(--teal)",
              borderRadius: 12, padding: "12px 16px", marginBottom: 20,
              fontSize: 13, color: "var(--teal)", fontWeight: 500
            }}>
              ✓ {selected.length} item{selected.length !== 1 ? "s" : ""} selected
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {filteredEquipment.map(eq => {
              const isSelected = selected.includes(eq._id);
              return (
                <div
                  key={eq._id}
                  onClick={() => toggle(eq._id)}
                  style={{
                    border: `2px solid ${isSelected ? "var(--teal)" : "var(--line)"}`,
                    borderRadius: 14, padding: "18px 20px",
                    background: isSelected ? "var(--teal-dim)" : "var(--surface)",
                    cursor: "pointer", transition: "all 0.15s",
                    position: "relative"
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: 12, right: 12,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "var(--teal)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700
                    }}>✓</div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{eq.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 12 }}>{eq.category}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isSelected ? "var(--teal)" : "var(--text)" }}>
                    ₹{eq.dailyRate?.toLocaleString("en-IN")}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>/day</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 1 — DATES */}
      {step === 1 && (
        <div style={{ maxWidth: 560 }}>
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>
              Rental Period
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div className="input-group">
                <label className="input-label">Pickup Date</label>
                <input type="date" className="input" value={dates.startDate}
                  onChange={e => setDates(p => ({ ...p, startDate: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Return Date</label>
                <input type="date" className="input" value={dates.endDate} min={dates.startDate}
                  onChange={e => setDates(p => ({ ...p, endDate: e.target.value }))} />
              </div>
            </div>

            {getDays() > 0 && (
              <div style={{
                background: "var(--bg)", borderRadius: 10, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Duration</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{getDays()} day{getDays() !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          <div className="form-card">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
              Link to Project (optional)
            </h3>
            <div className="input-group">
              <label className="input-label">Project</label>
              <select className="input" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">— No project —</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — REVIEW */}
      {step === 2 && (
        <div style={{ maxWidth: 560 }}>
          <div className="form-card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 20 }}>
              Equipment ({selected.length} items)
            </h3>
            {selected.map(id => {
              const eq = equipment.find(e => e._id === id);
              if (!eq) return null;
              return (
                <div key={id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: "1px solid var(--line)"
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{eq.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{eq.category}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>₹{eq.dailyRate}/day × {getDays()}d</div>
                    <div style={{ fontWeight: 600 }}>₹{(eq.dailyRate * getDays()).toLocaleString("en-IN")}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Period</span>
              <span style={{ fontWeight: 500 }}>{dates.startDate} → {dates.endDate} ({getDays()}d)</span>
            </div>
            {projectId && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Project</span>
                <span style={{ fontWeight: 500 }}>{projects.find(p => p._id === projectId)?.title || projectId}</span>
              </div>
            )}
            <div style={{ height: 1, background: "var(--line)", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Estimated Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--teal)" }}>₹{getTotal().toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="alert alert-warn" style={{ marginBottom: 20 }}>
            Your booking will be submitted for admin approval. You'll be notified once approved.
          </div>
        </div>
      )}

      {/* NAV BUTTONS */}
      <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
        {step > 0 && (
          <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>
            ← Back
          </button>
        )}
        {step < 2 ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
            Continue →
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={submit} disabled={loading}>
            {loading ? "Submitting…" : "Submit Booking Request"}
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  );
}