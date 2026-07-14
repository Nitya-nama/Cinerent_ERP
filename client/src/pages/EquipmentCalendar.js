// NEW FILE — Feature 2 (Equipment Availability Calendar)
//
// Purely additive: new page, new route, new nav link. Does not modify
// any existing page/route/component. Reuses existing GET /equipment and
// GET /bookings endpoints only — no backend changes required.

import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

const VIEWS = ["Day", "Week", "Month"];

const STATUS_COLOR = {
  Available:          { dot: "🟢", bg: "#dcfce7", border: "#86efac" },
  Reserved:           { dot: "🟡", bg: "#fef9c3", border: "#fde047" },
  Booked:             { dot: "🔴", bg: "#fee2e2", border: "#fca5a5" },
  "Under Maintenance":{ dot: "🟠", bg: "#ffedd5", border: "#fdba74" },
  Damaged:            { dot: "⚫", bg: "#e5e7eb", border: "#9ca3af" },
  Lost:               { dot: "⚫", bg: "#e5e7eb", border: "#9ca3af" },
};

const MANUAL_STATUSES = ["Under Maintenance", "Damaged", "Lost"];

function toISODate(d) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d) {
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // week starts Monday
  const result = new Date(d);
  result.setDate(d.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDateRange(view, refDate) {
  const dates = [];
  if (view === "Day") {
    dates.push(new Date(refDate));
  } else if (view === "Week") {
    const start = startOfWeek(refDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
  } else {
    // Month
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(new Date(year, month, i));
    }
  }
  return dates;
}

export default function EquipmentCalendar() {
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [userMap, setUserMap]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("Week");
  const [refDate, setRefDate]     = useState(new Date());
  const [selectedCell, setSelectedCell] = useState(null); // { equipment, date, booking, status }
  const role = localStorage.getItem("role");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [er, br] = await Promise.all([api.get("/equipment"), api.get("/bookings")]);
        setEquipment(er.data || []);
        setBookings(br.data || []);

        // Best-effort: resolve customer names for admins only (staff/customer
        // don't have access to /auth/admin/users — 403 is caught and ignored,
        // calendar still works, just shows raw ids instead of names).
        if (role === "admin") {
          try {
            const ur = await api.get("/auth/admin/users");
            const map = {};
            (ur.data || []).forEach(u => { map[u._id] = u.name; });
            setUserMap(map);
          } catch { /* non-fatal */ }
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [role]);

  const dateRange = useMemo(() => getDateRange(view, refDate), [view, refDate]);

  // For a given equipment + date, figure out the status + any matching booking.
  // FIX: a PENDING_APPROVAL booking is just a request that hasn't been
  // approved yet — it should NOT show as "Reserved" (that would incorrectly
  // suggest the equipment is unavailable before you've even approved
  // anything). Only APPROVED bookings show as Reserved, PICKED_UP as Booked.
  // Pending requests still show up as a small marker on an otherwise
  // "Available" cell, and clicking the cell still reveals them.
  const resolveCell = (eq, date) => {
    const iso = toISODate(date);

    if (MANUAL_STATUSES.includes(eq.status)) {
      return { status: eq.status, booking: null, pending: null };
    }

    const overlapping = bookings.filter(b =>
      (b.equipmentIds || []).includes(eq._id) &&
      ["PENDING_APPROVAL", "APPROVED", "PICKED_UP"].includes(b.status) &&
      b.startDate <= iso && b.endDate >= iso
    );

    const pickedUp = overlapping.find(b => b.status === "PICKED_UP");
    if (pickedUp) return { status: "Booked", booking: pickedUp, pending: null };

    const approved = overlapping.find(b => b.status === "APPROVED");
    if (approved) return { status: "Reserved", booking: approved, pending: null };

    const pending = overlapping.find(b => b.status === "PENDING_APPROVAL");
    if (pending) return { status: "Available", booking: null, pending };

    return { status: "Available", booking: null, pending: null };
  };

  const navigate = (dir) => {
    const d = new Date(refDate);
    if (view === "Day") d.setDate(d.getDate() + dir);
    else if (view === "Week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setRefDate(d);
  };

  const headerLabel = () => {
    if (view === "Day") return refDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (view === "Week") {
      const start = dateRange[0], end = dateRange[dateRange.length - 1];
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return refDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  };

  if (loading) return <div style={{ padding: 32, color: "var(--muted)", fontSize: 14 }}>Loading calendar…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Equipment Availability Calendar</h1>
        <p className="page-subtitle">See at a glance what's free, reserved, booked, or out of service</p>
      </div>

      {/* LEGEND */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(STATUS_COLOR).filter(([k]) => k !== "Lost").map(([label, c]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
            <span>{c.dot}</span>{label}
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
          <span>🕓</span>Pending approval (not yet confirmed)
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)}>←</button>
          <div style={{ fontWeight: 600, fontSize: 15, minWidth: 200, textAlign: "center" }}>{headerLabel()}</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(1)}>→</button>
          <button className="btn btn-outline btn-sm" onClick={() => setRefDate(new Date())}>Today</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {VIEWS.map(v => (
            <button
              key={v}
              className="btn btn-sm"
              onClick={() => setView(v)}
              style={{
                background: view === v ? "var(--sidebar-bg)" : "var(--surface)",
                color: view === v ? "#fff" : "var(--muted)",
                border: `1.5px solid ${view === v ? "var(--sidebar-bg)" : "var(--line)"}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* GRID */}
      {equipment.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
          No equipment in inventory yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: dateRange.length * 90 + 180 }}>
            <thead>
              <tr>
                <th style={{
                  textAlign: "left", padding: "12px 16px", fontSize: 12, color: "var(--muted)",
                  borderBottom: "1.5px solid var(--line)", position: "sticky", left: 0, background: "var(--surface)", minWidth: 180
                }}>
                  Equipment
                </th>
                {dateRange.map(d => (
                  <th key={toISODate(d)} style={{
                    padding: "12px 8px", fontSize: 11.5, color: "var(--muted)",
                    borderBottom: "1.5px solid var(--line)", borderLeft: "1px solid var(--line)",
                    minWidth: 90, textAlign: "center"
                  }}>
                    {d.toLocaleDateString(undefined, { weekday: "short" })}
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>
                      {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => (
                <tr key={eq._id}>
                  <td style={{
                    padding: "10px 16px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--line)",
                    position: "sticky", left: 0, background: "var(--surface)"
                  }}>
                    {eq.name}
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>{eq.category || "—"}</div>
                  </td>
                  {dateRange.map(d => {
                    const { status, booking, pending } = resolveCell(eq, d);
                    const c = STATUS_COLOR[status] || STATUS_COLOR.Available;
                    return (
                      <td
                        key={toISODate(d)}
                        onClick={() => setSelectedCell({ equipment: eq, date: d, booking, pending, status })}
                        style={{
                          borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)",
                          padding: "10px 6px", textAlign: "center", cursor: "pointer",
                          background: c.bg, position: "relative"
                        }}
                        title={pending ? `${status} (pending request awaiting approval)` : status}
                      >
                        <span style={{ fontSize: 14 }}>{c.dot}</span>
                        {/* NEW — small marker for a pending (not yet approved) request */}
                        {pending && (
                          <span style={{ position: "absolute", top: 2, right: 4, fontSize: 9 }}>🕓</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL POPUP */}
      {selectedCell && (
        <div
          onClick={() => setSelectedCell(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
          }}
        >
          <div onClick={e => e.stopPropagation()} className="card" style={{ maxWidth: 420, width: "90%", padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{selectedCell.equipment.name}</h3>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  {selectedCell.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedCell(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span style={{
                padding: "5px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
                background: (STATUS_COLOR[selectedCell.status] || {}).bg
              }}>
                {(STATUS_COLOR[selectedCell.status] || {}).dot} {selectedCell.status}
              </span>
            </div>

            {selectedCell.booking ? (
              <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                <div><span style={{ color: "var(--muted)" }}>Booking ID:</span> <code>#{selectedCell.booking._id.slice(-8).toUpperCase()}</code></div>
                <div><span style={{ color: "var(--muted)" }}>Customer:</span> {userMap[selectedCell.booking.userId] || String(selectedCell.booking.userId || "—")}</div>
                <div><span style={{ color: "var(--muted)" }}>Pickup Date:</span> {selectedCell.booking.startDate}</div>
                <div><span style={{ color: "var(--muted)" }}>Return Date:</span> {selectedCell.booking.endDate}</div>
              </div>
            ) : selectedCell.pending ? (
              // NEW — a request exists for this day but hasn't been approved yet
              <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                <div className="alert alert-warn" style={{ marginBottom: 4 }}>
                  ⏳ There's a pending request for this equipment on this date — it hasn't been approved yet, so the equipment still shows as Available.
                </div>
                <div><span style={{ color: "var(--muted)" }}>Booking ID:</span> <code>#{selectedCell.pending._id.slice(-8).toUpperCase()}</code></div>
                <div><span style={{ color: "var(--muted)" }}>Customer:</span> {userMap[selectedCell.pending.userId] || String(selectedCell.pending.userId || "—")}</div>
                <div><span style={{ color: "var(--muted)" }}>Requested Pickup:</span> {selectedCell.pending.startDate}</div>
                <div><span style={{ color: "var(--muted)" }}>Requested Return:</span> {selectedCell.pending.endDate}</div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                {MANUAL_STATUSES.includes(selectedCell.status)
                  ? "This equipment is currently out of service and not available for booking."
                  : "This equipment is free on this date — no active booking."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
