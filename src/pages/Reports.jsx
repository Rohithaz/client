import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../lib/api";
import { formatCurrency, formatDate, formatTime } from "../lib/ui";

const todayInputValue = () => new Date().toISOString().slice(0, 10);

export default function Reports() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayInputValue());
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReport = async () => {
      try {
        const data = await authFetch(`/orders/reports?date=${date}`);
        setReport(data);
        setError("");
      } catch (apiError) {
        if (apiError.status === 401) navigate("/login", { replace: true });
        else setError(apiError.message);
      }
    };

    loadReport();
  }, [date, navigate]);

  const paymentBreakdown = report?.paymentBreakdown || {};
  const maxPayment = Math.max(...Object.values(paymentBreakdown), 0);
  const maxQty = Math.max(...(report?.topSellingItems || []).map((item) => item.qty), 0);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="page-title-group">
          <span className="page-eyebrow">Reports</span>
          <h2 className="page-title">Sales Dashboard</h2>
          <p className="page-subtitle">
            Review daily sales, order volume, payment mix, and top-selling items.
          </p>
        </div>
        <label className="field date-filter">
          <span className="field__label">Report date</span>
          <input
            className="field__control"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="stats-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Daily sales</span>
          <strong className="kpi-card__value">{formatCurrency(report?.dailySales)}</strong>
          <p className="kpi-card__meta">{formatDate(date)}</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Orders</span>
          <strong className="kpi-card__value">{report?.ordersCount || 0}</strong>
          <p className="kpi-card__meta">Completed tickets</p>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">Average order</span>
          <strong className="kpi-card__value">{formatCurrency(report?.averageOrderValue)}</strong>
          <p className="kpi-card__meta">Revenue per ticket</p>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="surface-card dashboard-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Tender mix</p>
              <h3 className="panel-title">Payment Breakdown</h3>
            </div>
          </div>
          <div className="metric-list">
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <div className="metric-list__item" key={method}>
                <div className="metric-list__row">
                  <span>{method}</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
                <div className="progress-track">
                  <span className="progress-track__fill" style={{ width: `${maxPayment ? (amount / maxPayment) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {!Object.keys(paymentBreakdown).length && (
              <div className="empty-state empty-state--compact">
                <h4>No payments</h4>
                <p>No completed orders for this date.</p>
              </div>
            )}
          </div>
        </section>

        <section className="surface-card dashboard-card">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Demand</p>
              <h3 className="panel-title">Top-Selling Items</h3>
            </div>
          </div>
          <div className="metric-list">
            {(report?.topSellingItems || []).map((item) => (
              <div className="metric-list__item" key={item.name}>
                <div className="metric-list__row">
                  <span>{item.name}</span>
                  <strong>{item.qty} sold</strong>
                </div>
                <div className="progress-track progress-track--warm">
                  <span className="progress-track__fill" style={{ width: `${maxQty ? (item.qty / maxQty) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
            {!(report?.topSellingItems || []).length && (
              <div className="empty-state empty-state--compact">
                <h4>No item sales</h4>
                <p>Items appear after orders are completed.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="surface-card dashboard-card dashboard-card--full">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Latest tickets</p>
            <h3 className="panel-title">Recent Orders</h3>
          </div>
        </div>
        <div className="recent-orders-list">
          {(report?.recentOrders || []).map((order) => (
            <article key={order._id} className="recent-order">
              <div>
                <strong>{formatCurrency(order.total)}</strong>
                <p>{order.paymentMethod || "Cash"} - {order.orderType || "Dine-in"}</p>
              </div>
              <div className="recent-order__meta">{formatTime(order.createdAt)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
