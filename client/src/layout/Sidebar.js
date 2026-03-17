import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded ${
      isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700"
    }`;

  return (
    <aside className="w-64 bg-black text-white p-4 min-h-screen">
      <h2 className="text-xl font-bold mb-8">CineRent</h2>

      {/* ---------- ADMIN ---------- */}
      {role === "admin" && (
        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/equipment" className={linkClass}>
            Equipment
          </NavLink>
          <NavLink to="/manage-bookings" className={linkClass}>
            Bookings
          </NavLink>
          <NavLink to="/analytics" className={linkClass}>
            Analytics
          </NavLink>
          <NavLink to="/admin/users" className={linkClass}>
            Users
          </NavLink>
          <NavLink to="/admin/create-user" className={linkClass}>
            Create User
          </NavLink>
        </nav>
      )}

      {/* ---------- STAFF ---------- */}
      {role === "staff" && (
        <nav className="space-y-2">
          <NavLink to="/staff/dashboard" className={linkClass}>
            Staff Dashboard
          </NavLink>
          <NavLink to="/staff/bookings" className={linkClass}>
            Bookings
          </NavLink>
        </nav>
      )}

      {/* ---------- CUSTOMER ---------- */}
      {role === "customer" && (
        <nav className="space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={linkClass}>
            My Projects
          </NavLink>
          <NavLink to="/bookings" className={linkClass}>
            My Bookings
          </NavLink>
        </nav>
      )}
    </aside>
  );
}
