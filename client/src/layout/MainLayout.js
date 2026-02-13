import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import "./layout.css";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="app-container">
      <Sidebar />

      <div className="main-area">
        <Navbar />

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}