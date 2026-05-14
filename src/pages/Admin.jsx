import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, formatCurrency } from "../lib/ui";
import { clearStoredToken, getStoredToken } from "../lib/auth";

import { useLocation } from "react-router-dom";




const runAdminRequest = async (navigate, path, options = {}) => {
  const token = getStoredToken();

  if (!token) {
    clearStoredToken();
    navigate("/login");
    return null;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token,
    },
  });

  if (response.status === 401) {
    clearStoredToken();
    navigate("/login");
    return null;
  }

  if (response.status === 403) {
    navigate("/");
    return null;
  }

  if (!response.ok) {
    throw new Error("Admin request failed");
  }

  return response;
};

export default function Admin() {
  const location = useLocation();
  const isMainAdmin = location.pathname === "/admin";
const isMenu = location.pathname === "/admin-functions/menu";
const isCatalog = location.pathname === "/admin-functions/catalog";
  const [categories, setCategories] = useState([]); 
  const [menu, setMenu] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const fetchMenu = async () => {
    try {
      const response = await runAdminRequest(navigate, "/menu/all");

      if (!response) {
        return;
      }

      const data = await response.json();
      setMenu(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setMenu([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      try {
        const response = await runAdminRequest(navigate, "/menu/all");

        if (!response) {
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setMenu(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setMenu([]);
        }
      }
    };

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // 🔥 ADD THIS BLOCK HERE
useEffect(() => {
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);

      const data = await response.json();

      console.log("Categories:", data); // debug

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Category fetch error:", error);
      setCategories([]);
    }
  };

  loadCategories();
}, []);

  const addItem = async () => {
    if (!name.trim() || !price || !category.trim()) {
      return;
    }

    try {
      const response = await runAdminRequest(navigate, "/menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name: name.trim(),
  price: Number(price),
  category: category,   
})
      });

      if (!response) {
        return;
      }

      setName("");
      setPrice("");
      setCategory("");
      fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteItem = async (id) => {
    try {
      const response = await runAdminRequest(navigate, `/menu/${id}`, {
        method: "DELETE",
      });

      if (!response) {
        return;
      }

      fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      const response = await runAdminRequest(navigate, `/menu/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available: !item.available,
        }),
      });

      if (!response) {
        return;
      }

      fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const updatePrice = async (id, newPrice) => {
    try {
      const response = await runAdminRequest(navigate, `/menu/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ price: Number(newPrice) }),
      });

      if (!response) {
        return;
      }

      fetchMenu();
    } catch (error) {
      console.error(error);
    }
  };

  const activeItems = menu.filter((item) => item.available).length;
  const categoryCount = new Set(menu.map((item) => item.category).filter(Boolean))
    .size;

  return (
    <div className="page-shell">
      {isMainAdmin && (
  <>
  <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Control room</span>
          <h2 className="page-title">Menu Administration</h2>
          <p className="page-subtitle">
            Manage dishes, pricing, and item availability from one clean view.
          </p>
        </div>
      </header>
  </>
      )}



      <div className="stats-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Menu items</span>
          <strong className="kpi-card__value">{menu.length}</strong>
          <p className="kpi-card__meta">Total dishes in the catalog</p>
        </article>

        <article className="kpi-card">
          <span className="kpi-card__label">Available now</span>
          <strong className="kpi-card__value">{activeItems}</strong>
          <p className="kpi-card__meta">Visible to the billing counter</p>
        </article>

        <article className="kpi-card">
          <span className="kpi-card__label">Categories</span>
          <strong className="kpi-card__value">{categoryCount}</strong>
          <p className="kpi-card__meta">Groups used to organize the menu</p>
        </article>
      </div>

<div className="admin-layout admin-layout--centered">

  {/* ✅ MENU SETUP ONLY */}
  {isMenu && (
    <section className="surface-card admin-form-card">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Menu setup</p>
          <h3 className="panel-title">Add New Item</h3>
        </div>
      </div>

      <div className="admin-form-grid">
        <label className="field">
          <span className="field__label">Dish name</span>
          <input
            placeholder="Butter Paneer, Masala Cola..."
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field__control"
          />
        </label>

        <label className="field">
          <span className="field__label">Price</span>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="field__control"
          />
        </label>

        <label className="field">
          <span className="field__label">Category</span>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="field__control"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="button" onClick={addItem} className="action-button">
        Add Menu Item
      </button>
    </section>
  )}

  {/* ✅ CATALOG ONLY */}
  {isCatalog && (
    <section className="surface-card admin-list-card">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Catalog</p>
          <h3 className="panel-title">Existing Menu</h3>
        </div>
      </div>

      {menu.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <h4>No menu items yet</h4>
          <p>Add your first dish to start building the POS catalog.</p>
        </div>
      ) : (
        <div className="admin-list">
          {menu.map((item) => (
            <article key={item._id} className="admin-item">
              <div className="admin-item__summary">
                <div className="admin-item__top">
                  <h4>{item.name}</h4>
                  <span
                    className={`status-badge${
                      item.available ? "" : " status-badge--soft"
                    }`}
                  >
                    {item.available ? "Available" : "Hidden"}
                  </span>
                </div>

                <p className="admin-item__meta">
                  {formatCurrency(item.price)} -{" "}
                  {item.category?.name || item.category}
                </p>
              </div>

              <div className="admin-item__actions">
                <button
                  type="button"
                  onClick={() => {
                    const newPrice = prompt("Enter the updated price:");
                    if (newPrice) {
                      updatePrice(item._id, newPrice);
                    }
                  }}
                  className="text-button"
                >
                  Edit price
                </button>

                <button
                  type="button"
                  onClick={() => toggleAvailability(item)}
                  className="text-button"
                >
                  {item.available ? "Disable" : "Enable"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteItem(item._id)}
                  className="text-button text-button--danger"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )}

</div>
   
    </div>
  );
}
