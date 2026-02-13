import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });
      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data.token || res.data.access_token;
      if (!token) throw new Error("Token missing");

      localStorage.setItem("token", token);

      // decode role from JWT
      const payload = JSON.parse(atob(token.split(".")[1]));
      localStorage.setItem("role", payload.role);

      // role-based redirect
      if (payload.role === "admin") navigate("/dashboard", { replace: true });
      else if (payload.role === "staff") navigate("/bookings", { replace: true });
      else navigate("/projects", { replace: true });

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f3ee]">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl w-[360px] shadow-xl"
      >
        <h1 className="text-2xl font-semibold mb-6 text-zinc-900">
          CineRent
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-3 border rounded-lg"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-3 border rounded-lg"
          required
        />

        <button
          type="submit"
          className="w-full py-3 bg-black text-white rounded-lg hover:opacity-90"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-indigo-600 cursor-pointer"
>
            Create account
          </span>
        </p>

      </form>
    </div>
  );
}
