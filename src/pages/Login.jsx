import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../lib/ui";
import { getHomeForRole, normalizeRole, storeAuth } from "../lib/auth";

export default function Login({ setAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
 
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      const role = normalizeRole(data.role || data.user?.role);

      if (!data.token || !role) {
        alert("Login response is missing role information");
        return;
      }

      localStorage.setItem("user", JSON.stringify({ ...data.user, role }));

      const authSession = {
        token: data.token,
        role,
        user: data.user || null,
      };

      storeAuth(authSession);
      setAuth(authSession);
      navigate(getHomeForRole(role), { replace: true });
    } catch (error) {
      console.error(error);
      alert("Unable to sign in right now");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-layout">
        <section className="login-hero">
          <span className="page-eyebrow">Restaurant operations</span>
          <h1 className="login-hero__title">Keep billing fast, calm, and ready for rush hour.</h1>
          <p className="login-hero__copy">
            A focused POS for live orders, menu control, and service dashboards.
            Built for the front desk and designed to stay clear on every screen.
          </p>

          <div className="login-hero__highlights">
            <article className="login-highlight">
              <strong>Live billing</strong>
              <p>Build tickets quickly with a kitchen-friendly receipt flow.</p>
            </article>

            <article className="login-highlight">
              <strong>Smart admin</strong>
              <p>Update menu items, pricing, and availability in one place.</p>
            </article>

            <article className="login-highlight">
              <strong>Instant visibility</strong>
              <p>Track payment mix and sales performance throughout the day.</p>
            </article>
          </div>
        </section>

        <form className="surface-card login-form-card" onSubmit={handleLogin}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Secure access</p>
              <h2 className="panel-title">Sign in to the POS</h2>
            </div>
          </div>

          <label className="field">
            <span className="field__label">Email</span>
            <input
              type="text"
              placeholder="Enter email or username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field__control"
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field__control"
              required
            />
          </label>

          <button type="submit" className="action-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
