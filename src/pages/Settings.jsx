import { getStoredAuth } from "../lib/auth";

export default function Settings() {
  const auth = getStoredAuth();

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Settings</span>
          <h2 className="page-title">Workspace Settings</h2>
          <p className="page-subtitle">
            Account and tenant configuration surface for the current pilot deployment.
          </p>
        </div>
      </header>

      <section className="surface-card dashboard-card">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Signed in</p>
            <h3 className="panel-title">{auth?.user?.name || "Current user"}</h3>
          </div>
          <span className="status-badge">{auth?.role}</span>
        </div>
        <p className="admin-item__meta">
          Tenant-specific operational settings can be extended here without changing billing routes.
        </p>
      </section>
    </div>
  );
}
