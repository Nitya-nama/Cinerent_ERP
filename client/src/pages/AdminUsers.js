import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await api.get("/auth/admin/users"); // ✅ FIXED
      setUsers(res.data || []);
    } catch (err) {
      alert("Failed to load users");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleUser = async (id) => {
    await api.patch(`/auth/admin/users/${id}/toggle`);
    loadUsers();
  };

  const updateRole = async (id, role) => {
    await api.patch(`/auth/admin/users/${id}/role`, { role });
    loadUsers();
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6">Users</h2>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>

                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u._id, e.target.value)}
                    className="border p-1 rounded"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="customer">Customer</option>
                  </select>
                </td>

                <td className="p-3">
                  <button
                    onClick={() => toggleUser(u._id)}
                    className={`px-3 py-1 rounded text-white ${
                      u.active === false
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {u.active === false ? "Enable" : "Disable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="p-6 text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}
