import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

import DashboardRouter from "./pages/DashboardRouter";
import Equipment from "./pages/Equipment";
import Analytics from "./pages/Analytics";

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
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/create-user" element={<AdminCreateUser />} />
            <Route path="/manage-bookings" element={<Bookings />} />
            <Route path="/invoice/:bookingId" element={<Invoice />} />
          </Route>
        </Route>

        {/* STAFF ONLY */}
        <Route element={<ProtectedRoute allow={["staff"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/bookings" element={<StaffBookings />} />
          </Route>
        </Route>

        {/* CUSTOMER ONLY */}
        <Route element={<ProtectedRoute allow={["customer"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/customer-dashboard" element={<DashboardRouter />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId/book" element={<CreateBooking />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/invoice/:bookingId" element={<Invoice />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}