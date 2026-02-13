import Dashboard from "./Dashboard";
import ClientDashboard from "./ClientDashboard";

export default function DashboardRouter() {
  const role = localStorage.getItem("role");

  if (role === "admin") {
    return <Dashboard />;
  }

  if (role === "customer") {
    return <ClientDashboard />;
  }

  return <div className="p-6">Unauthorized</div>;
}
