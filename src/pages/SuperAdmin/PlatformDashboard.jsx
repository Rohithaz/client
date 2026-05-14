import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../lib/api";

export default function PlatformDashboard() {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadPlatform = async () => {
      try {
        const [restaurantData, userData] = await Promise.all([
          authFetch("/super-admin/restaurants"),
          authFetch("/super-admin/users"),
        ]);
        setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
      }
    };

    loadPlatform();
  }, [navigate]);

  const stats = useMemo(
    () => ({
      activeRestaurants: restaurants.filter((restaurant) => restaurant.isActive !== false).length,
      admins: users.filter((user) => user.role === "admin").length,
      cashiers: users.filter((user) => user.role === "cashier").length,
    }),
    [restaurants, users],
  );

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Platform</span>
          <h2 className="page-title">Platform Dashboard</h2>
          <p className="page-subtitle">Monitor tenant and user footprint across the SaaS platform.</p>
        </div>
      </header>

      <div className="stats-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Restaurants</span>
          <strong className="kpi-card__value">{restaurants.length}</strong>
          <p className="kpi-card__meta">{stats.activeRestaurants} active tenants</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Admins</span>
          <strong className="kpi-card__value">{stats.admins}</strong>
          <p className="kpi-card__meta">Restaurant admin accounts</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Cashiers</span>
          <strong className="kpi-card__value">{stats.cashiers}</strong>
          <p className="kpi-card__meta">Billing users provisioned</p>
        </article>
      </div>
    </div>
  );
}
