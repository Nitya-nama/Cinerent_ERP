import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function StaffDashboard() {
  const [pickups, setPickups] = useState([]);
  const [returns, setReturns] = useState([]);

  const load = async () => {
    const res = await api.get("/bookings");
    const today = new Date().toISOString().slice(0, 10);

    setPickups(res.data.filter(b =>
      b.startDate === today && b.status === "APPROVED"
    ));
    setReturns(res.data.filter(b =>
      b.endDate === today && b.status === "PICKED_UP"
    ));
  };

  useEffect(() => { load(); }, []);

  const pickup = async (id) => {
    await api.post(`/bookings/${id}/pickup`);
    load();
  };

  const returned = async (id) => {
    await api.post(`/bookings/${id}/return`);
    load();
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Staff Dashboard</h2>

      <Section title={`Today's Pickups (${pickups.length})`}>
        {pickups.map(b => (
          <Card key={b._id}>
            <p>Booking: {b._id}</p>
            <button
              onClick={() => pickup(b._id)}
              className="bg-yellow-500 text-white px-3 py-1 rounded mt-2"
            >
              Mark Picked Up
            </button>
          </Card>
        ))}
      </Section>

      <Section title={`Today's Returns (${returns.length})`}>
        {returns.map(b => (
          <Card key={b._id}>
            <p>Booking: {b._id}</p>
            <button
              onClick={() => returned(b._id)}
              className="bg-blue-600 text-white px-3 py-1 rounded mt-2"
            >
              Mark Returned
            </button>
          </Card>
        ))}
      </Section>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xl font-semibold mb-3">{title}</h3>
    <div className="grid grid-cols-2 gap-4">{children}</div>
  </div>
);

const Card = ({ children }) => (
  <div className="bg-white p-4 rounded-xl shadow">{children}</div>
);
