import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../lib/api";
import { formatCurrency, formatDateTime } from "../lib/ui";

const pageSize = 10;

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ date: "", paymentMethod: "", orderType: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadOrders = async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      try {
        const data = await authFetch(`/orders${params.toString() ? `?${params}` : ""}`);
        setOrders(Array.isArray(data) ? data : []);
        setPage(1);
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
      }
    };

    loadOrders();
  }, [filters, navigate]);

  const totalPages = Math.max(Math.ceil(orders.length / pageSize), 1);
  const paginatedOrders = useMemo(
    () => orders.slice((page - 1) * pageSize, page * pageSize),
    [orders, page],
  );

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Orders</span>
          <h2 className="page-title">Order History</h2>
          <p className="page-subtitle">
            Search completed orders by date, payment method, and order type.
          </p>
        </div>
      </header>

      <section className="surface-card dashboard-card">
        <div className="filter-bar">
          <label className="field">
            <span className="field__label">Date</span>
            <input className="field__control" type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Payment</span>
            <select className="field__control" value={filters.paymentMethod} onChange={(event) => updateFilter("paymentMethod", event.target.value)}>
              <option value="">All</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">Order type</span>
            <select className="field__control" value={filters.orderType} onChange={(event) => updateFilter("orderType", event.target.value)}>
              <option value="">All</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Delivery">Delivery</option>
            </select>
          </label>
          <button type="button" className="action-button action-button--ghost" onClick={() => setFilters({ date: "", paymentMethod: "", orderType: "" })}>
            Clear
          </button>
        </div>

        <div className="table-list">
          {paginatedOrders.map((order) => (
            <article key={order._id} className="order-history-card">
              <div>
                <strong>{formatCurrency(order.total)}</strong>
                <p>{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <span className="status-badge">{order.paymentMethod || "Cash"}</span>
                <span className="status-badge status-badge--soft">{order.orderType || "Dine-in"}</span>
              </div>
              <p>{order.items?.map((item) => `${item.name} x ${item.qty}`).join(", ")}</p>
            </article>
          ))}
          {!paginatedOrders.length && (
            <div className="empty-state empty-state--compact">
              <h4>No orders found</h4>
              <p>Try another date or filter combination.</p>
            </div>
          )}
        </div>

        <div className="pagination-row">
          <button type="button" className="text-button" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button type="button" className="text-button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
