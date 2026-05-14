import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../lib/api";
import { formatDate } from "../lib/ui";

const emptyStaff = {
  name: "",
  email: "",
  username: "",
  password: "",
};

export default function StaffManagement() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyStaff);
  const [error, setError] = useState("");

  const loadStaff = async () => {
    try {
      const data = await authFetch("/admin/staff");
      setStaff(Array.isArray(data) ? data : []);
      setError("");
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialStaff = async () => {
      try {
        const data = await authFetch("/admin/staff");

        if (isMounted) {
          setStaff(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
        else if (isMounted) setError(apiError.message);
      }
    };

    loadInitialStaff();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const createStaff = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await authFetch("/admin/create-staff", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyStaff);
      await loadStaff();
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const toggleStaff = async (id) => {
    await authFetch(`/admin/staff/${id}/status`, { method: "PATCH" });
    await loadStaff();
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Team access</span>
          <h2 className="page-title">Staff Management</h2>
          <p className="page-subtitle">
            Create cashier accounts and control whether they can access billing.
          </p>
        </div>
      </header>

      <div className="management-grid">
        <form className="surface-card admin-form-card" onSubmit={createStaff}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Cashier account</p>
              <h3 className="panel-title">Create Staff</h3>
            </div>
          </div>

          <div className="admin-form-grid">
            {["name", "email", "username", "password"].map((field) => (
              <label className="field" key={field}>
                <span className="field__label">{field}</span>
                <input
                  className="field__control"
                  type={field === "password" ? "password" : "text"}
                  value={form[field]}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                  required
                />
              </label>
            ))}
          </div>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="action-button">Create Cashier</button>
        </form>

        <section className="surface-card admin-list-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Cashiers</p>
              <h3 className="panel-title">Staff List</h3>
            </div>
          </div>

          <div className="admin-list">
            {staff.map((member) => (
              <article key={member._id} className="admin-item">
                <div className="admin-item__summary">
                  <div className="admin-item__top">
                    <h4>{member.name}</h4>
                    <span className={`status-badge${member.isActive ? "" : " status-badge--soft"}`}>
                      {member.isActive ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="admin-item__meta">
                    {member.email} - {member.username || "no username"} - Added {formatDate(member.createdAt)}
                  </p>
                </div>
                <button type="button" className="text-button" onClick={() => toggleStaff(member._id)}>
                  {member.isActive ? "Disable" : "Enable"}
                </button>
              </article>
            ))}
            {!staff.length && (
              <div className="empty-state empty-state--compact">
                <h4>No staff yet</h4>
                <p>Create the first cashier account for this restaurant.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
