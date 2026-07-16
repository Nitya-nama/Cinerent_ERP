import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

import DashboardRouter from "./pages/DashboardRouter";
import Equipment from "./pages/Equipment";
import Analytics from "./pages/Analytics";
import EquipmentCalendar from "./pages/EquipmentCalendar"; // NEW (Feature 2)

import Bookings from "./pages/Bookings";
import Invoice from "./pages/Invoice_temp";
import CreateBooking from "./pages/CreateBooking";

import AdminCreateUser from "./pages/AdminCreateUser";
import AdminUsers from "./pages/AdminUsers";

import StaffDashboard from "./pages/StaffDashboard";
import StaffBookings from "./pages/StaffBookings";

import Projects from "./pages/Projects";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ADMIN ONLY */}
        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/equipment-calendar" element={<EquipmentCalendar />} /> {/* NEW (Feature 2) */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/create-user" element={<AdminCreateUser />} />
            <Route path="/manage-bookings" element={<Bookings />} />
          </Route>
        </Route>

        {/* STAFF ONLY */}
        <Route element={<ProtectedRoute allow={["staff"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/bookings" element={<StaffBookings />} />
            {/* Calendar removed from staff per request — admin-only now */}
          </Route>
        </Route>

        {/* CUSTOMER ONLY */}
        <Route element={<ProtectedRoute allow={["customer"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/customer-dashboard" element={<DashboardRouter />} />
            <Route path="/projects" element={<Projects />} />
            {/* ✅ matches the URL Projects.js actually navigates to
                (/bookings/new?projectId=...) and CreateBooking's use of
                useSearchParams. The old "/projects/:projectId/book" path
                never matched, so clicking "Book Equipment" fell through to
                the "*" fallback route and rendered the Login page — which
                looked like an unexpected logout even though the user's
                token/session was still valid. */}
            <Route path="/bookings/new" element={<CreateBooking />} />
            <Route path="/bookings" element={<Bookings />} />
          </Route>
        </Route>

        {/* SHARED — ADMIN + STAFF + CUSTOMER
            FIX: /invoice/:bookingId used to be declared separately inside
            both the ADMIN block and the CUSTOMER block above. React Router
            only ever renders ONE matching branch for a given URL, and with
            two equally-specific matches it resolves to whichever is
            declared first in the tree — the admin-only one. That silently
            sent every customer (and any staff member, who never had the
            route at all) straight into that branch's admin-only guard,
            which correctly denied them — hence "Access Denied" for
            customer/staff even though a customer-side route definition
            existed. A single shared route with all three roles allowed
            fixes this for good. */}
        <Route element={<ProtectedRoute allow={["admin", "staff", "customer"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/invoice/:bookingId" element={<Invoice />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}