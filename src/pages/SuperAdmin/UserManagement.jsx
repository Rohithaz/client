import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/api";
import { formatDate } from "../../lib/ui";
import { getStoredAuth } from "../../lib/auth";

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("admin");
  const [error, setError] = useState("");
  const auth = getStoredAuth();

  const loadUsers = async () => {
    try {
      const data = await authFetch("/super-admin/users");
      setUsers(Array.isArray(data) ? data : []);
      setError("");
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialUsers = async () => {
      try {
        const data = await authFetch("/super-admin/users");

        if (isMounted) {
          setUsers(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
        else if (isMounted) setError(apiError.message);
      }
    };

    loadInitialUsers();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const visibleUsers = roleFilter === "all" ? users : users.filter((user) => user.role === roleFilter);

  const toggleUserStatus = async (user) => {
    if (user.isActive && !window.confirm(`Disable ${user.name}? They will lose access immediately.`)) {
      return;
    }

    try {
      await authFetch(`/super-admin/users/${user._id}/status`, {
        method: "PATCH",
      });
      await loadUsers();
    } catch (apiError) {
      setError(apiError.message);
      if (apiError.status === 401) navigate("/login", { replace: true });
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Access</span>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">View all restaurant admins and platform users.</p>
        </div>
        <select className="field__control compact-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="admin">Admins</option>
          <option value="cashier">Cashiers</option>
          <option value="super_admin">Super admins</option>
          <option value="all">All users</option>
        </select>
      </header>

      <section className="surface-card admin-list-card">
        {error && <p className="form-error">{error}</p>}
        <div className="admin-list">
          {visibleUsers.map((user) => (
            <article key={user._id} className="admin-item">
              <div className="admin-item__summary">
                <div className="admin-item__top">
                  <h4>{user.name}</h4>
                  <span className={`status-badge${user.isActive ? "" : " status-badge--soft"}`}>
                    {user.isActive ? "Enabled" : "Disabled"} - {user.role}
                  </span>
                </div>
                <p className="admin-item__meta">
                  {user.email} - {user.restaurantId?.name || "Platform"} - Joined {formatDate(user.createdAt)}
                  {user.restaurantId?.isActive === false ? " - Restaurant disabled" : ""}
                </p>
              </div>
              <div className="admin-item__actions">
                <button
                  type="button"
                  className={`text-button${user.isActive ? " text-button--danger" : ""}`}
                  disabled={auth?.user?.id === user._id}
                  title={auth?.user?.id === user._id ? "You cannot disable yourself" : undefined}
                  onClick={() => toggleUserStatus(user)}
                >
                  {user.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
