import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

// ─── Role-specific notification fetchers ──────────────────────────────────────
// Admin:    pending approvals + overdue returns
// Staff:    today's pickups + overdue returns
// Customer: approved bookings (ready to pick up) + upcoming returns

function useNotifications(role) {
  const [notifications, setNotifications] = useState([]);

  const load = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);

      if (role === "admin") {
        const [br] = await Promise.all([api.get("/bookings")]);
        const bookings = br.data || [];

        const notifs = [];

        const pending = bookings.filter(b => b.status === "PENDING_APPROVAL");
        if (pending.length > 0) {
          notifs.push({
            id: "pending",
            icon: "⏳",
            title: `${pending.length} booking${pending.length !== 1 ? "s" : ""} awaiting approval`,
            subtitle: "Tap to review",
            route: "/manage-bookings",
            color: "#f59e0b",
            bg: "#fffbeb",
          });
        }

        const overdueReturns = bookings.filter(
          b => b.status === "PICKED_UP" && String(b.endDate).slice(0, 10) < today
        );
        if (overdueReturns.length > 0) {
          notifs.push({
            id: "overdue",
            icon: "⚠️",
            title: `${overdueReturns.length} overdue return${overdueReturns.length !== 1 ? "s" : ""}`,
            subtitle: "Equipment past due date",
            route: "/manage-bookings",
            color: "#ef4444",
            bg: "#fef2f2",
          });
        }

        const returnsToClose = bookings.filter(b => b.status === "RETURNED");
        if (returnsToClose.length > 0) {
          notifs.push({
            id: "returned",
            icon: "🔄",
            title: `${returnsToClose.length} booking${returnsToClose.length !== 1 ? "s" : ""} ready to close`,
            subtitle: "Equipment returned, needs closure",
            route: "/manage-bookings",
            color: "#8b5cf6",
            bg: "#f5f3ff",
          });
        }

        setNotifications(notifs);

      } else if (role === "staff") {
        const [br, er] = await Promise.all([api.get("/bookings"), api.get("/equipment")]);
        const bookings  = br.data || [];
        const notifs    = [];

        const todayPickups = bookings.filter(
          b => b.status === "APPROVED" && String(b.startDate).slice(0, 10) === today
        );
        if (todayPickups.length > 0) {
          notifs.push({
            id: "pickups_today",
            icon: "📦",
            title: `${todayPickups.length} pickup${todayPickups.length !== 1 ? "s" : ""} scheduled today`,
            subtitle: "Equipment ready to hand out",
            route: "/staff/bookings",
            color: "#3b82f6",
            bg: "#eff6ff",
          });
        }

        const overdueReturns = bookings.filter(
          b => b.status === "PICKED_UP" && String(b.endDate).slice(0, 10) < today
        );
        if (overdueReturns.length > 0) {
          notifs.push({
            id: "overdue_staff",
            icon: "⚠️",
            title: `${overdueReturns.length} overdue return${overdueReturns.length !== 1 ? "s" : ""}`,
            subtitle: "Follow up with customers",
            route: "/staff/bookings",
            color: "#ef4444",
            bg: "#fef2f2",
          });
        }

        setNotifications(notifs);

      } else if (role === "customer") {
        const br       = await api.get("/bookings");
        const bookings = br.data || [];
        const notifs   = [];

        const readyToPickup = bookings.filter(b => b.status === "APPROVED");
        if (readyToPickup.length > 0) {
          notifs.push({
            id: "approved",
            icon: "✅",
            title: `${readyToPickup.length} booking${readyToPickup.length !== 1 ? "s" : ""} approved`,
            subtitle: "Ready for pickup at the studio",
            route: "/bookings",
            color: "#10b981",
            bg: "#f0fdf4",
          });
        }

        const dueSoon = bookings.filter(b => {
          if (b.status !== "PICKED_UP") return false;
          const diff = (new Date(b.endDate) - new Date()) / 86400000;
          return diff >= 0 && diff <= 2; // due within 2 days
        });
        if (dueSoon.length > 0) {
          notifs.push({
            id: "due_soon",
            icon: "🕐",
            title: `${dueSoon.length} rental${dueSoon.length !== 1 ? "s" : ""} due soon`,
            subtitle: "Return within 2 days",
            route: "/bookings",
            color: "#f97316",
            bg: "#fff7ed",
          });
        }

        const overdue = bookings.filter(
          b => b.status === "PICKED_UP" && String(b.endDate).slice(0, 10) < today
        );
        if (overdue.length > 0) {
          notifs.push({
            id: "overdue_customer",
            icon: "❌",
            title: `${overdue.length} rental${overdue.length !== 1 ? "s" : ""} overdue`,
            subtitle: "Please return immediately",
            route: "/bookings",
            color: "#ef4444",
            bg: "#fef2f2",
          });
        }

        setNotifications(notifs);
      }
    } catch (err) {
      // Fail silently — notifications are non-critical
    }
  };

  useEffect(() => {
    if (role) {
      load();
      // Refresh every 2 minutes
      const interval = setInterval(load, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [role]);

  return notifications;
}

// ─── Notification Dropdown Panel ──────────────────────────────────────────────
function NotificationPanel({ notifications, onClose }) {
  const navigate = useNavigate();

  const handleClick = route => {
    navigate(route);
    onClose();
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 10px)", right: 0,
      width: 320, background: "var(--surface)",
      border: "1.5px solid var(--line)", borderRadius: 16,
      boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      zIndex: 1000, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
        {notifications.length > 0 && (
          <span style={{
            background: "var(--teal)", color: "#fff",
            padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600
          }}>
            {notifications.length}
          </span>
        )}
      </div>

      {/* Items */}
      {notifications.length === 0 ? (
        <div style={{ padding: "32px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>All caught up!</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>No pending actions right now.</div>
        </div>
      ) : (
        <div>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleClick(n.route)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px",
                borderBottom: "1px solid var(--line)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: n.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>
                {n.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {n.subtitle}
                </div>
              </div>
              <svg width="14" height="14" fill="none" stroke="var(--muted)" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: "10px 18px", borderTop: "1px solid var(--line)" }}>
        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
          Auto-refreshes every 2 minutes
        </div>
      </div>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export function Navbar() {
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const role     = localStorage.getItem("role");
  const initials = (user.name || "U").slice(0, 2).toUpperCase();

  const [open, setOpen]         = useState(false);
  const notifications            = useNotifications(role);
  const count                    = notifications.length;
  const panelRef                 = useRef(null);
  const bellRef                  = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = e => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="topbar">
      <div className="topbar-welcome">
        {greeting}, <strong>{user?.name || "User"}</strong> 👋
      </div>

      <div className="topbar-right">
        {/* ── NOTIFICATION BELL ── */}
        <div style={{ position: "relative" }}>
          <button
            ref={bellRef}
            onClick={() => setOpen(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: open ? "var(--teal-dim)" : "var(--bg)",
              border: `1.5px solid ${open ? "var(--teal)" : "var(--line)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: open ? "var(--teal)" : "var(--muted)",
              position: "relative",
              transition: "all 0.15s",
            }}
            title="Notifications"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            {/* RED DOT BADGE */}
            {count > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -5,
                minWidth: 18, height: 18,
                background: "#ef4444", color: "#fff",
                borderRadius: 10, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 4px",
                border: "2px solid var(--surface)",
                lineHeight: 1,
              }}>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {/* DROPDOWN PANEL */}
          {open && (
            <div ref={panelRef}>
              <NotificationPanel
                notifications={notifications}
                onClose={() => setOpen(false)}
              />
            </div>
          )}
        </div>

        {/* AVATAR */}
        <div className="topbar-avatar" title={user.name}>
          {initials}
        </div>
      </div>
    </header>
  );
}