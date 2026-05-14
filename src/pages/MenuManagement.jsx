import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../lib/api";
import { formatCurrency } from "../lib/ui";

const emptyForm = {
  name: "",
  price: "",
  category: "General",
  available: true,
};

export default function MenuManagement() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [error, setError] = useState("");

  const loadMenu = async () => {
    try {
      const data = await authFetch("/menu/all");
      setMenu(Array.isArray(data) ? data : []);
      setError("");
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialMenu = async () => {
      try {
        const data = await authFetch("/menu/all");

        if (isMounted) {
          setMenu(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
        else if (isMounted) setError(apiError.message);
      }
    };

    loadInitialMenu();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const categories = useMemo(
    () => ["All", ...new Set(menu.map((item) => item.category || "General"))],
    [menu],
  );

  const filteredMenu =
    categoryFilter === "All"
      ? menu
      : menu.filter((item) => (item.category || "General") === categoryFilter);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      category: form.category.trim() || "General",
      available: form.available,
    };

    if (!payload.name || Number.isNaN(payload.price) || payload.price < 0) {
      setError("Enter a valid menu item and price.");
      return;
    }

    try {
      if (editingId) {
        await authFetch(`/menu/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch("/menu", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      await loadMenu();
    } catch (apiError) {
      if (apiError.status === 401) navigate("/login", { replace: true });
      else setError(apiError.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      price: item.price ?? "",
      category: item.category || "General",
      available: item.available !== false,
    });
  };

  const toggleAvailability = async (item) => {
    await authFetch(`/menu/${item._id}`, {
      method: "PUT",
      body: JSON.stringify({ available: item.available === false }),
    });
    await loadMenu();
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;
    await authFetch(`/menu/${id}`, { method: "DELETE" });
    await loadMenu();
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Menu control</span>
          <h2 className="page-title">Menu Management</h2>
          <p className="page-subtitle">
            Manage restaurant-specific dishes, pricing, categories, and billing availability.
          </p>
        </div>
      </header>

      <div className="stats-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Items</span>
          <strong className="kpi-card__value">{menu.length}</strong>
          <p className="kpi-card__meta">Total catalog entries</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Available</span>
          <strong className="kpi-card__value">
            {menu.filter((item) => item.available !== false).length}
          </strong>
          <p className="kpi-card__meta">Visible at billing</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Categories</span>
          <strong className="kpi-card__value">{Math.max(categories.length - 1, 0)}</strong>
          <p className="kpi-card__meta">Active grouping labels</p>
        </article>
      </div>

      <div className="management-grid">
        <form className="surface-card admin-form-card" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">{editingId ? "Edit item" : "New item"}</p>
              <h3 className="panel-title">{editingId ? "Update Dish" : "Add Dish"}</h3>
            </div>
          </div>

          <div className="admin-form-grid">
            <label className="field">
              <span className="field__label">Name</span>
              <input
                className="field__control"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Paneer tikka"
              />
            </label>
            <label className="field">
              <span className="field__label">Price</span>
              <input
                className="field__control"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                placeholder="0.00"
              />
            </label>
            <label className="field">
              <span className="field__label">Category</span>
              <input
                className="field__control"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                placeholder="Starters"
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(event) => setForm({ ...form, available: event.target.checked })}
              />
              <span>Available for billing</span>
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="action-button">
            {editingId ? "Save Changes" : "Add Menu Item"}
          </button>
          {editingId && (
            <button type="button" className="text-button form-secondary-action" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </form>

        <section className="surface-card admin-list-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Catalog</p>
              <h3 className="panel-title">Restaurant Menu</h3>
            </div>
            <select
              className="field__control compact-select"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-list">
            {filteredMenu.map((item) => (
              <article key={item._id} className="admin-item">
                <div className="admin-item__summary">
                  <div className="admin-item__top">
                    <h4>{item.name}</h4>
                    <span className={`status-badge${item.available === false ? " status-badge--soft" : ""}`}>
                      {item.available === false ? "Hidden" : "Available"}
                    </span>
                  </div>
                  <p className="admin-item__meta">
                    {formatCurrency(item.price)} - {item.category || "General"}
                  </p>
                </div>
                <div className="admin-item__actions">
                  <button type="button" className="text-button" onClick={() => startEdit(item)}>
                    Edit
                  </button>
                  <button type="button" className="text-button" onClick={() => toggleAvailability(item)}>
                    {item.available === false ? "Enable" : "Disable"}
                  </button>
                  <button type="button" className="text-button text-button--danger" onClick={() => deleteItem(item._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
            {!filteredMenu.length && (
              <div className="empty-state empty-state--compact">
                <h4>No menu items</h4>
                <p>Add an item or change the category filter.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
