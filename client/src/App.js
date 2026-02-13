import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Projects from "./pages/Projects";
import Bookings from "./pages/Bookings";
import Analytics from "./pages/Analytics";
import Invoice from "./pages/Invoice_temp";
import CreateBooking from "./pages/CreateBooking";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/projects/:projectId/book" element={<CreateBooking />} />

        {/* ADMIN */}
        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/invoice/:bookingId" element={<Invoice />} />
          </Route>
        </Route>

        {/* STAFF */}
        <Route element={<ProtectedRoute allow={["staff", "admin"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/bookings" element={<Bookings />} />
          </Route>
        </Route>

        {/* CUSTOMER */}
        <Route element={<ProtectedRoute allow={["customer"]} />}>
          <Route element={<MainLayout />}>
            <Route path="/projects" element={<Projects />} />
          </Route>
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}
