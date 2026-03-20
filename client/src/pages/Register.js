import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Register() {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) { alert("All fields are required"); return; }
    try {
      setLoading(true);
      await api.post("auth/register", { name, email, password });
      alert("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f0f4f8" }}>

      {/* LEFT */}
      <div style={{
        width: "42%", background: "var(--sidebar-bg)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", width: 380, height: 380, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.05)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)"
        }} />
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
            Join thousands of filmmakers renting premium equipment.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px"
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 28, color: "var(--text)", marginBottom: 6
          }}>Create account</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 32 }}>
            Start renting professional equipment today
          </p>

          <form onSubmit={handleRegister}>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Full name</label>
              <input className="input" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Email address</label>
              <input type="email" className="input" placeholder="you@studio.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="input-group" style={{ marginBottom: 28 }}>
              <label className="input-label">Password</label>
              <input type="password" className="input" placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--muted)" }}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={{ color: "var(--teal)", cursor: "pointer", fontWeight: 500 }}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}