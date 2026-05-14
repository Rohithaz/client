import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  formatTime,
} from "../lib/ui";
import { authFetch } from "../lib/api";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const data = await authFetch("/orders");

        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (error.status === 401) navigate("/login", { replace: true });
        else console.error(error);

        if (isMounted) {
          setOrders([]);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const paymentStats = orders.reduce((acc, order) => {
    const key = order.paymentMethod || "Cash";
    acc[key] = (acc[key] || 0) + order.total;
    return acc;
  }, {});

  const itemStats = {};

  orders.forEach((order) => {
    order.items?.forEach((item) => {
      itemStats[item.name] = (itemStats[item.name] || 0) + item.qty;
    });
  });

  const topItems = Object.entries(itemStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const highestPaymentValue = Math.max(...Object.values(paymentStats), 0);
  const highestItemCount = Math.max(...topItems.map(([, qty]) => qty), 0);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Performance</span>
          <h2 className="page-title">Service Dashboard</h2>
          <p className="page-subtitle">
            Monitor sales, payment mix, and what is moving fastest across the
            counter.
          </p>
        </div>

        <div className="page-date-pill">{formatDate(new Date())}</div>
      </header>

      <div className="stats-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Total sales</span>
          <strong className="kpi-card__value">{formatCurrency(totalSales)}</strong>
          <p className="kpi-card__meta">Revenue captured from completed orders</p>
        </article>

        <article className="kpi-card">
          <span className="kpi-card__label">Total orders</span>
          <strong className="kpi-card__value">{totalOrders}</strong>
          <p className="kpi-card__meta">Tickets closed so far</p>
        </article>

        <article className="kpi-card">
          <span className="kpi-card__label">Average order value</span>
          <strong className="kpi-card__value">
            {formatCurrency(avgOrderValue)}
          </strong>
          <p className="kpi-card__meta">A quick sense of ticket strength</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="surface-card dashboard-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Payment mix</p>
              <h3 className="panel-title">Payment Breakdown</h3>
            </div>
          </div>

          {Object.keys(paymentStats).length === 0 ? (
            <div className="empty-state empty-state--compact">
              <h4>No payment data yet</h4>
              <p>Complete a few orders and the split will appear here.</p>
            </div>
          ) : (
            <div className="metric-list">
              {Object.entries(paymentStats).map(([method, amount]) => (
                <div key={method} className="metric-list__item">
                  <div className="metric-list__row">
                    <span>{method}</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>

                  <div className="progress-track">
                    <span
                      className="progress-track__fill"
                      style={{
                        width: `${
                          highestPaymentValue
                            ? (amount / highestPaymentValue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card dashboard-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Best sellers</p>
              <h3 className="panel-title">Top Selling Items</h3>
            </div>
          </div>

          {topItems.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <h4>No item trends yet</h4>
              <p>Top dishes will show up here after live billing starts.</p>
            </div>
          ) : (
            <div className="metric-list">
              {topItems.map(([name, qty]) => (
                <div key={name} className="metric-list__item">
                  <div className="metric-list__row">
                    <span>{name}</span>
                    <strong>{qty} sold</strong>
                  </div>

                  <div className="progress-track progress-track--warm">
                    <span
                      className="progress-track__fill"
                      style={{
                        width: `${
                          highestItemCount ? (qty / highestItemCount) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="surface-card dashboard-card dashboard-card--full">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Order feed</p>
            <h3 className="panel-title">Recent Orders</h3>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state empty-state--compact">
            <h4>No recent orders</h4>
            <p>Your completed tickets will appear here in real time.</p>
          </div>
        ) : (
          <div className="recent-orders-list">
            {orders.slice(0, 6).map((order) => (
              <article key={order._id} className="recent-order">
                <div>
                  <strong>{formatCurrency(order.total)}</strong>
                  <p>
                    {order.paymentMethod || "Cash"} •{" "}
                    {order.orderType || "Dine-in"}
                  </p>
                </div>

                <div className="recent-order__meta">
                  <span>{formatTime(order.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
