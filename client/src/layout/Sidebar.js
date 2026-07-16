import { NavLink } from "react-router-dom";

const icons = {
  dashboard:    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  equipment:    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  bookings:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  analytics:    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  users:        "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  createUser:   "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  projects:     "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  calendar:     "M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
  logout:       "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
};

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
    >
      <Icon path={icons[icon]} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.name || "U").slice(0, 1).toUpperCase();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        Cine<span>Rent</span>
      </div>

      {/* NAV */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>

        {/* ADMIN */}
        {role === "admin" && (
          <>
            <div className="sidebar-section-label" style={{ padding: "12px 12px 6px", fontSize: 10 }}>Main</div>
            <NavItem to="/dashboard"         icon="dashboard"   label="Dashboard" />
            <NavItem to="/equipment"          icon="equipment"   label="Equipment" />
            <NavItem to="/equipment-calendar" icon="calendar"    label="Calendar" />
            <NavItem to="/manage-bookings"    icon="bookings"    label="Bookings" />
            <NavItem to="/analytics"          icon="analytics"   label="Analytics" />

            <div className="sidebar-section-label" style={{ padding: "16px 12px 6px", fontSize: 10 }}>Team</div>
            <NavItem to="/admin/users"        icon="users"       label="Users" />
            <NavItem to="/admin/create-user"  icon="createUser"  label="Create User" />
          </>
        )}

        {/* STAFF */}
        {role === "staff" && (
          <>
            <div className="sidebar-section-label" style={{ padding: "12px 12px 6px", fontSize: 10 }}>Main</div>
            <NavItem to="/staff/dashboard"  icon="dashboard"  label="Dashboard" />
            <NavItem to="/staff/bookings"   icon="bookings"   label="Bookings" />
            {/* Calendar link removed from staff nav per request */}
          </>
        )}

        {/* CUSTOMER */}
        {role === "customer" && (
          <>
            <div className="sidebar-section-label" style={{ padding: "12px 12px 6px", fontSize: 10 }}>Main</div>
            <NavItem to="/customer-dashboard"  icon="dashboard"  label="Dashboard" />
            <NavItem to="/projects"            icon="projects"   label="My Projects" />
            <NavItem to="/bookings"            icon="bookings"   label="My Bookings" />
          </>
        )}
      </div>

      {/* BOTTOM — user info + logout */}
      <div className="sidebar-bottom">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--teal)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14, flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name || "User"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}>
              {role}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: "100%", background: "rgba(239,68,68,0.12)", color: "#f87171", border: "none" }}
        >
          <Icon path={icons.logout} />
          Logout
        </button>
      </div>
    </aside>
  );
}