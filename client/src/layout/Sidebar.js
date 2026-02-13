import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const role = localStorage.getItem("role");

  const linkClass =
    "block px-3 py-2 rounded hover:bg-gray-800";

  return (
    <aside className="w-64 bg-black text-white p-6 min-h-screen">
      <h2 className="text-xl font-bold mb-8">CineRent</h2>

      <nav className="flex flex-col space-y-3">
        {role === "admin" && (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/equipment" className={linkClass}>
              Equipment
            </NavLink>
            <NavLink to="/analytics" className={linkClass}>
              Analytics
            </NavLink>
          </>
        )}

        {(role === "staff" || role === "admin") && (
          <NavLink to="/bookings" className={linkClass}>
            Bookings
          </NavLink>
        )}

        {role === "customer" && (
          <NavLink to="/projects" className={linkClass}>
            My Projects
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
