import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

import DashboardRouter from "./pages/DashboardRouter"; // admin + customer
import Equipment from "./pages/Equipment";
import Analytics from "./pages/Analytics";

import Bookings from "./pages/Bookings";
import Invoice from "./pages/Invoice_temp";
import CreateBooking from "./pages/CreateBooking";

import AdminCreateUser from "./pages/AdminCreateUser";
import AdminUsers from "./pages/AdminUsers";

import StaffDashboard from "./pages/StaffDashboard";
import StaffBookings from "./pages/StaffBookings";

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
        <Route path="/projects/:projectId/book" element={<CreateBooking />} />

        {/* ADMIN */}
        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/create-user" element={<AdminCreateUser />} />
          </Route>
        </Route>

        {/* STAFF */}
        <Route element={<ProtectedRoute allow={["staff"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/bookings" element={<StaffBookings />} />
          </Route>
        </Route>

        {/* CUSTOMER */}
        <Route element={<ProtectedRoute allow={["customer"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/bookings" element={<Bookings />} />
          </Route>
        </Route>

        {/* INVOICE (ADMIN + CUSTOMER) */}
        <Route element={<ProtectedRoute allow={["admin", "customer"]} />}>
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
