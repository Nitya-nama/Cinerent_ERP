import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role",  res.data.role);
      localStorage.setItem("user",  JSON.stringify({ name: res.data.name, role: res.data.role }));
      if (res.data.role === "admin")    navigate("/dashboard",          { replace: true });
      else if (res.data.role === "staff") navigate("/staff/dashboard",   { replace: true });
      else                                navigate("/customer-dashboard",{ replace: true });
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f0f4f8" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "42%", background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative", overflow: "hidden"
      }}>
        {/* decorative circles */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.05)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)"
        }} />
        <div style={{
          position: "absolute", width: 260, height: 260, borderRadius: "50%",
          border: "1px solid rgba(30,200,160,0.12)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)"
        }} />

        {/* content */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "var(--teal)", display: "flex",
            alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 0 40px rgba(30,200,160,0.35)"
          }}>
            <svg width="34" height="34" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.854V15.146a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 38, color: "#fff", letterSpacing: "-0.02em", marginBottom: 12
          }}>CineRent</h1>

          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.6, maxWidth: 260 }}>
            Professional film equipment rental — managed with precision.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 36 }}>
            {["📷 Cameras", "💡 Lighting", "🎙 Audio"].map(t => (
              <span key={t} style={{
                background: "rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.6)",
                padding: "6px 14px", borderRadius: 20, fontSize: 12,
                border: "1px solid rgba(255,255,255,0.08)"
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px"
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28, color: "var(--text)", marginBottom: 6
          }}>Welcome back</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 32 }}>
            Sign in to your CineRent account
          </p>

          <form onSubmit={handleLogin}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@studio.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ marginBottom: 28 }}>
              <label className="input-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ color: "var(--teal)", cursor: "pointer", fontWeight: 500 }}
            >
              Create account
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}