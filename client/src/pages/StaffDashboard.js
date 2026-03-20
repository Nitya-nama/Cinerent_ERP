import { useEffect, useState } from "react";
import { api } from "../api/api";

const normalizeDate = d => { try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d).slice(0, 10); } };

function BookingCard({ booking: b, getEquipmentNames, getDays, getTotal, badge, badgeStyle, actionLabel, actionStyle, onAction }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ height: 3, background: actionStyle?.background || "var(--teal)" }} />
      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ ...badgeStyle, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{badge}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--teal)" }}>
            ₹{getTotal(b.equipmentIds, b.startDate, b.endDate).toLocaleString("en-IN")}
          </span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
          {b.startDate} <span style={{ color: "var(--muted)" }}>→</span> {b.endDate}
          <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>({getDays(b.startDate, b.endDate)}d)</span>
        </div>

        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14, background: "var(--bg)", padding: "8px 12px", borderRadius: 8 }}>
          {getEquipmentNames(b.equipmentIds)}
        </div>

        <button
          onClick={onAction}
          style={{ width: "100%", ...actionStyle, border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const [bookings, setBookings]   = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState("pickups");

  const load = async () => {
    try {
      setLoading(true);
      const [br, er] = await Promise.all([api.get("/bookings"), api.get("/equipment")]);
      setBookings(br.data || []); setEquipment(er.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getEquipmentNames = ids => {
    if (!ids?.length) return "No equipment";
    return ids.map(id => { const eq = equipment.find(e => e._id === id); return eq ? eq.name : id; }).join(", ");
  };
  const getDays  = (s, e) => { if (!s || !e) return 0; const d = (new Date(e) - new Date(s)) / 86400000 + 1; return d > 0 ? d : 0; };
  const getTotal = (ids, s, e) => { if (!ids?.length) return 0; const d = getDays(s, e); return ids.reduce((sum, id) => { const eq = equipment.find(q => q._id === id); return sum + (eq ? eq.dailyRate * d : 0); }, 0); };

  const pickupsForDate  = bookings.filter(b => normalizeDate(b.startDate) === selectedDate && b.status === "APPROVED");
  const returnsForDate  = bookings.filter(b => normalizeDate(b.endDate)   === selectedDate && b.status === "PICKED_UP");
  const overduePickups  = bookings.filter(b => b.status === "APPROVED"   && normalizeDate(b.startDate) < selectedDate);
  const overdueReturns  = bookings.filter(b => b.status === "PICKED_UP"  && normalizeDate(b.endDate)   < selectedDate);

  const pickup   = async id => { try { await api.post(`/bookings/${id}/pickup`);  load(); } catch { alert("Failed"); } };
  const returned = async id => { try { await api.post(`/bookings/${id}/return`);  load(); } catch { alert("Failed"); } };

  const tabs = [
    { key: "pickups",  label: "Pickups",  count: pickupsForDate.length },
    { key: "returns",  label: "Returns",  count: returnsForDate.length },
    { key: "overdue",  label: "Overdue",  count: overduePickups.length + overdueReturns.length },
  ];

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Staff Dashboard</h1>
        <p className="page-subtitle">Daily pickup & return tracker</p>
      </div>

      {/* DATE BAR */}
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label">Selected Date</label>
          <input type="date" className="input" style={{ width: 180 }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button className="btn btn-primary btn-sm" onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}>Today</button>
          <button className="btn btn-outline btn-sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)); }}>← Prev</button>
          <button className="btn btn-outline btn-sm" onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().slice(0, 10)); }}>Next →</button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          {[
            { label: "Pickups",  val: pickupsForDate.length,  bg: "#fffbeb", color: "#d97706" },
            { label: "Returns",  val: returnsForDate.length,  bg: "#eff6ff", color: "#2563eb" },
            { label: "Overdue",  val: overduePickups.length + overdueReturns.length, bg: "#fef2f2", color: "#dc2626" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: "10px 20px", background: s.bg, borderRadius: 12, minWidth: 80 }}>
              <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1.2, marginTop: 2 }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="btn"
            style={{
              background: activeTab === t.key ? "var(--teal)" : "var(--surface)",
              color: activeTab === t.key ? "#fff" : "var(--muted)",
              border: `1.5px solid ${activeTab === t.key ? "var(--teal)" : "var(--line)"}`,
              padding: "9px 18px"
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 6, background: activeTab === t.key ? "rgba(255,255,255,0.25)" : "var(--bg)",
              padding: "2px 7px", borderRadius: 10, fontSize: 11
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {activeTab === "pickups" && (
        <>
          {pickupsForDate.length === 0
            ? <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>No pickups scheduled for {selectedDate}.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                {pickupsForDate.map(b => (
                  <BookingCard key={b._id} booking={b} getEquipmentNames={getEquipmentNames} getDays={getDays} getTotal={getTotal}
                    badge="Ready for Pickup" badgeStyle={{ background: "#dbeafe", color: "#1e40af" }}
                    actionLabel="📦 Mark Picked Up" actionStyle={{ background: "#f59e0b", color: "#fff" }}
                    onAction={() => pickup(b._id)} />
                ))}
              </div>
          }
        </>
      )}

      {activeTab === "returns" && (
        <>
          {returnsForDate.length === 0
            ? <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>No returns scheduled for {selectedDate}.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                {returnsForDate.map(b => (
                  <BookingCard key={b._id} booking={b} getEquipmentNames={getEquipmentNames} getDays={getDays} getTotal={getTotal}
                    badge="Due for Return" badgeStyle={{ background: "#ffedd5", color: "#9a3412" }}
                    actionLabel="🔄 Mark Returned" actionStyle={{ background: "#3b82f6", color: "#fff" }}
                    onAction={() => returned(b._id)} />
                ))}
              </div>
          }
        </>
      )}

      {activeTab === "overdue" && (
        <>
          {overduePickups.length === 0 && overdueReturns.length === 0
            ? <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>No overdue bookings 🎉</div>
            : <>
                {overduePickups.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                      ⚠️ Overdue Pickups ({overduePickups.length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                      {overduePickups.map(b => (
                        <BookingCard key={b._id} booking={b} getEquipmentNames={getEquipmentNames} getDays={getDays} getTotal={getTotal}
                          badge={`Was due ${b.startDate}`} badgeStyle={{ background: "#fef2f2", color: "#dc2626" }}
                          actionLabel="📦 Mark Picked Up" actionStyle={{ background: "#f59e0b", color: "#fff" }}
                          onAction={() => pickup(b._id)} />
                      ))}
                    </div>
                  </div>
                )}
                {overdueReturns.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                      ⚠️ Overdue Returns ({overdueReturns.length})
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                      {overdueReturns.map(b => (
                        <BookingCard key={b._id} booking={b} getEquipmentNames={getEquipmentNames} getDays={getDays} getTotal={getTotal}
                          badge={`Was due ${b.endDate}`} badgeStyle={{ background: "#fef2f2", color: "#dc2626" }}
                          actionLabel="🔄 Mark Returned" actionStyle={{ background: "#3b82f6", color: "#fff" }}
                          onAction={() => returned(b._id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
          }
        </>
      )}
    </div>
  );
}