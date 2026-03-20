import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate  = useNavigate();
  const role      = localStorage.getItem("role");

  const home = role === "admin"    ? "/dashboard"
             : role === "staff"    ? "/staff/dashboard"
             : role === "customer" ? "/customer-dashboard"
             : "/login";

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)", padding: 24
    }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>

        {/* ICON */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "#fef2f2", margin: "0 auto 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36
        }}>
          🔒
        </div>

        {/* HEADING */}
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 32, color: "var(--text)",
          letterSpacing: "-0.02em", marginBottom: 10
        }}>
          Access Denied
        </h1>

        {/* MESSAGE */}
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          You don't have permission to view this page.
          {role ? ` Your current role is "${role}" which doesn't have access here.` : " Please log in to continue."}
        </p>

        {/* DIVIDER */}
        <div style={{ height: 1, background: "var(--line)", marginBottom: 28 }} />

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate(home)}
          >
            ← Go to my Dashboard
          </button>
          <button
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

        {/* ROLE BADGE */}
        {role && (
          <div style={{ marginTop: 28 }}>
            <span style={{
              background: "var(--surface)", border: "1.5px solid var(--line)",
              borderRadius: 20, padding: "6px 16px",
              fontSize: 12, color: "var(--muted)"
            }}>
              Logged in as: <strong style={{ color: "var(--text)", textTransform: "capitalize" }}>{role}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}