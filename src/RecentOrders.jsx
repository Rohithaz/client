import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "./lib/api";
import { formatCurrency } from "./lib/ui";

export default function RecentOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const data = await authFetch("/orders");
      setOrders(
        Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [],
      );
    } catch (err) {
      if (err.status === 401) navigate("/login", { replace: true });
      else console.error("Error fetching orders:", err);
    }
  }, [navigate]);

  useEffect(() => {
    const timeout = setTimeout(fetchOrders, 0);
    const interval = setInterval(fetchOrders, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page-shell">
      <aside className="surface-card billing-panel billing-panel--orders">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Floor activity</p>
            <h3 className="panel-title">Recent Orders</h3>
          </div>

          <button type="button" onClick={fetchOrders} className="text-button">
            Refresh
          </button>
        </div>

        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <h4>No orders yet</h4>
              <p>Completed tickets will appear here.</p>
            </div>
          ) : (
            orders.map((order) => (
              <article key={order._id} className="order-card">
                <div className="order-card__top">
                  <strong>{formatCurrency(order.total)}</strong>
                  <span>{formatTime(order.createdAt)}</span>
                </div>

                <div className="order-card__meta">
                  <span className="status-badge">{order.paymentMethod || "Cash"}</span>
                  <span className="status-badge status-badge--soft">
                    {order.orderType || "Dine-in"}
                  </span>
                </div>

                <div className="order-card__items">
                  {order.items?.map((item, index) => (
                    <p key={`${order._id}-${index}`}>
                      {item.name} x {item.qty}
                    </p>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
