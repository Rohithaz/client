import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/api";
import { formatDate } from "../../lib/ui";

const emptyForm = {
  restaurantName: "",
  branchName: "",
  adminName: "",
  adminEmail: "",
  adminUsername: "",
  password: "",
};

export default function Restaurants() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pendingRestaurant, setPendingRestaurant] = useState(null);

  const loadRestaurants = async () => {
    try {
      const data = await authFetch("/super-admin/restaurants");
      setRestaurants(Array.isArray(data) ? data : []);
      setError("");
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialRestaurants = async () => {
      try {
        const data = await authFetch("/super-admin/restaurants");

        if (isMounted) {
          setRestaurants(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
        else if (isMounted) setError(apiError.message);
      }
    };

    loadInitialRestaurants();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const createRestaurant = async (event) => {
    event.preventDefault();
    try {
      await authFetch("/super-admin/create-restaurant-admin", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      await loadRestaurants();
    } catch (apiError) {
      setError(apiError.message);
    }
  };

  const toggleRestaurantStatus = async (restaurant) => {
    try {
      await authFetch(`/super-admin/restaurants/${restaurant._id}/status`, {
        method: "PATCH",
      });
      setPendingRestaurant(null);
      await loadRestaurants();
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Tenants</span>
          <h2 className="page-title">Restaurants</h2>
          <p className="page-subtitle">Create restaurant tenants with their first admin account.</p>
        </div>
      </header>

      <div className="management-grid">
        <form className="surface-card admin-form-card" onSubmit={createRestaurant}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">New tenant</p>
              <h3 className="panel-title">Restaurant Admin</h3>
            </div>
          </div>
          <div className="admin-form-grid">
            {Object.keys(emptyForm).map((field) => (
              <label className="field" key={field}>
                <span className="field__label">{field.replace(/([A-Z])/g, " $1")}</span>
                <input
                  className="field__control"
                  type={field === "password" ? "password" : "text"}
                  value={form[field]}
                  onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                  required={!["branchName"].includes(field)}
                />
              </label>
            ))}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="action-button">Create Restaurant</button>
        </form>

        <section className="surface-card admin-list-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">All restaurants</p>
              <h3 className="panel-title">Tenant List</h3>
            </div>
          </div>
          <div className="admin-list">
            {restaurants.map((restaurant) => (
              <article className="admin-item" key={restaurant._id}>
                <div className="admin-item__summary">
                  <div className="admin-item__top">
                    <h4>{restaurant.name}</h4>
                    <span className={`status-badge${restaurant.isActive ? "" : " status-badge--soft"}`}>
                      {restaurant.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <p className="admin-item__meta">
                    {restaurant.branchName || "Main Branch"} - {restaurant.subscriptionPlan} - Created {formatDate(restaurant.createdAt)}
                  </p>
                </div>
                <div className="admin-item__actions">
                  <button
                    type="button"
                    className={`text-button${restaurant.isActive ? " text-button--danger" : ""}`}
                    onClick={() =>
                      restaurant.isActive
                        ? setPendingRestaurant(restaurant)
                        : toggleRestaurantStatus(restaurant)
                    }
                  >
                    {restaurant.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {pendingRestaurant && (
        <div className="confirm-overlay">
          <div className="surface-card confirm-dialog">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Confirm disable</p>
                <h3 className="panel-title">Disable {pendingRestaurant.name}?</h3>
              </div>
            </div>
            <p className="confirm-copy">
              This will immediately block all admins and cashiers under this restaurant from logging in or using protected APIs. Existing restaurant data will not be deleted.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="action-button action-button--ghost"
                onClick={() => setPendingRestaurant(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="action-button action-button--danger"
                onClick={() => toggleRestaurantStatus(pendingRestaurant)}
              >
                Disable Restaurant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
