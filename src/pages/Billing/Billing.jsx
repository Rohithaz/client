import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../lib/ui";
import { authFetch } from "../../lib/api";

const orderTypeOptions = ["Dine-in", "Takeaway", "Delivery"];
const paymentOptions = ["Cash", "Card", "UPI"];

const getOrdersData = async (navigate) => {
  try {
    const data = await authFetch("/orders");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error.status === 401) {
      navigate("/login", { replace: true });
    }
    return [];
  }
};

export default function Billing() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showInvoice, setShowInvoice] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orders, setOrders] = useState([]);
  const [orderType, setOrderType] = useState("Dine-in");
  const [menu, setMenu] = useState([]);



const handlePrint = () => {
  const printWindow = window.open("", "", "width=400,height=700");

  if (!printWindow) return;

  const itemsHTML = cart
    .map(
      (item) => `
        <div class="row">
          <span>${item.name} x ${item.qty}</span>
          <span>₹${item.price * item.qty}</span>
        </div>
      `
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body {
            font-family: monospace;
            width: 280px;
            margin: auto;
            padding: 10px;
          }

          .center {
            text-align: center;
          }

          h2 {
            margin: 5px 0;
          }

          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            margin: 4px 0;
          }

          .total {
            font-weight: bold;
            font-size: 16px;
          }

          .small {
            font-size: 12px;
            color: #555;
          }
        </style>
      </head>

      <body>

        <div class="center">
          <h2>TableTurn POS</h2>
          <div class="small">${new Date().toLocaleString()}</div>
        </div>

        <div class="divider"></div>

        <div class="row">
          <span>Type:</span>
          <span>${orderType}</span>
        </div>

        <div class="row">
          <span>Payment:</span>
          <span>${paymentMethod}</span>
        </div>

        <div class="divider"></div>

        ${itemsHTML}

        <div class="divider"></div>

        <div class="row">
          <span>Subtotal</span>
          <span>₹${subtotal}</span>
        </div>

        <div class="row">
          <span>GST (5%)</span>
          <span>₹${gst}</span>
        </div>

        <div class="row total">
          <span>Total</span>
          <span>₹${total}</span>
        </div>

        <div class="divider"></div>

        <div class="center small">
          Thank you for dining with us 🙏
        </div>

      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 300);
};




  const fetchOrders = async () => {
    try {
      const data = await getOrdersData(navigate);
      setOrders(data);
    } catch (error) {
      console.error(error);
      setOrders([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

   const loadInitialData = async () => {
  try {

    const [orderData, menuResponse] = await Promise.all([
      getOrdersData(navigate),
      authFetch("/menu"),
    ]);

    if (isMounted) {
      setOrders(orderData);
      setMenu(Array.isArray(menuResponse) ? menuResponse : []);
    }

  } catch (error) {
    console.error(error);

    if (isMounted) {
      setMenu([]);
    }
  }
};

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (cartItem) => cartItem._id === item._id,
      );

      if (existingItem) {
        return currentCart.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem,
        );
      }

      return [...currentCart, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, change) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item._id === id ? { ...item, qty: item.qty + change } : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const availableMenu = menu.filter((item) => item.available !== false);

  const categories = [
    "All",
    ...new Set(availableMenu.map((item) => item.category).filter(Boolean)),
  ];

  const filteredMenu = availableMenu.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const cartCount = cart.reduce((count, item) => count + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  const completeOrder = async () => {
    if (!cart.length) {
      return;
    }

    try {
      const newOrder = {
        items: cart.map(({ name, price, qty }) => ({ name, price, qty })),
        subtotal,
        gst,
        total,
        paymentMethod,
        orderType,
      };

      await authFetch("/orders", {
        method: "POST",
        body: JSON.stringify(newOrder),
      });

      await fetchOrders();
      setShowInvoice(false);
      setCart([]);
    } catch (error) {
      if (error.status === 401) navigate("/login", { replace: true });
      else console.error(error);
    }
  };

  return (
    <>
      <div className="page-shell billing-page">
      

        <div className="billing-layout">
          <aside className="surface-card billing-panel billing-panel--categories">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Menu flow</p>
                <h3 className="panel-title">Categories</h3>
              </div>
              <span className="panel-badge">
                {Math.max(categories.length - 1, 0)} groups
              </span>
            </div>

            <div className="category-list">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`chip-button${
                    selectedCategory === category ? " is-active" : ""
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <p className="panel-note">
              Only available dishes are shown here, so the billing counter stays
              focused on items the kitchen can serve right now.
            </p>
          </aside>

          <section className="surface-card billing-panel billing-panel--menu">
            <div className="panel-header panel-header--stack">
              <div>
                <p className="panel-eyebrow">Order builder</p>
                <h3 className="panel-title">Menu</h3>
              </div>

              <div className="panel-toolbar">
                <label className="field field--grow">
                  <span className="field__label">Search dishes</span>
                  <input
                    type="text"
                    placeholder="Search by dish name"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="field__control"
                  />
                </label>

                <label className="field">
                  <span className="field__label">Payment</span>
                  <select
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    className="field__control"
                  >
                    {paymentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="segmented-control" aria-label="Order type">
                {orderTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setOrderType(type)}
                    className={`segment-button${
                      orderType === type ? " is-active" : ""
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {filteredMenu.length > 0 ? (
              <div className="menu-grid">
                {filteredMenu.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="menu-card"
                  >
                    <div className="menu-card__top">
                      <span className="menu-card__category">
                        {item.category || "Chef special"}
                      </span>
                      <span className="menu-card__price">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <h4 className="menu-card__title">{item.name}</h4>
                    <p className="menu-card__copy">
                      Tap once to add this item to the live ticket.
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h4>No matching items</h4>
                <p>
                  Try a different category or search term to continue building
                  the order.
                </p>
              </div>
            )}
          </section>

          <aside className="surface-card billing-panel billing-panel--cart">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Current ticket</p>
                <h3 className="panel-title">Cart</h3>
              </div>
              <span className="panel-badge">{cartCount} items</span>
            </div>

            <div className="cart-list">
              {cart.length === 0 ? (
                <div className="empty-state empty-state--compact">
                  <h4>No items yet</h4>
                  <p>Add dishes from the menu to start a ticket.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <article key={item._id} className="ticket-item">
                    <div>
                      <h4 className="ticket-item__title">{item.name}</h4>
                      <p className="ticket-item__meta">
                        {formatCurrency(item.price)} each
                      </p>
                    </div>

                    <div className="ticket-item__actions">
                      <div className="qty-stepper">
                        <button
                          type="button"
                          onClick={() => updateQty(item._id, -1)}
                          aria-label={`Reduce quantity for ${item.name}`}
                        >
                          -
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item._id, 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <strong className="ticket-item__amount">
                        {formatCurrency(item.price * item.qty)}
                      </strong>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="totals-card">
              <div className="summary-line">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>

              <div className="summary-line">
                <span>GST (5%)</span>
                <strong>{formatCurrency(gst)}</strong>
              </div>

              <div className="summary-line summary-line--total">
                <span>Total</span>
                <strong>{formatCurrency(total)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInvoice(true)}
              className="action-button"
              disabled={!cart.length}
            >
              Review and Checkout
            </button>
          </aside>

          {/* <aside className="surface-card billing-panel billing-panel--orders">
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
                  <p>Completed tickets will appear here for quick reference.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <article key={order._id} className="order-card">
                    <div className="order-card__top">
                      <strong>{formatCurrency(order.total)}</strong>
                      <span>{formatTime(order.createdAt)}</span>
                    </div>

                    <div className="order-card__meta">
                      <span className="status-badge">
                        {order.paymentMethod || "Cash"}
                      </span>
                      <span className="status-badge status-badge--soft">
                        {order.orderType || "Dine-in"}
                      </span>
                    </div>

                    <div className="order-card__items">
                      {order.items?.map((item, index) => (
                        <p key={`${order._id}-${index}`} className="order-card__item">
                          {item.name} x {item.qty}
                        </p>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside> */}



        </div>


  <header className="page-header">
          <div className="page-title-group">
            <span className="page-eyebrow">Service floor</span>
            <h2 className="page-title">Live Billing Counter</h2>
            <p className="page-subtitle">
              Build tickets quickly, send cleaner orders to service, and keep
              checkout ready for peak hours.
            </p>
          </div>

          <div className="page-kpis">
            <article className="kpi-card">
              <span className="kpi-card__label">Open orders</span>
              <strong className="kpi-card__value">{orders.length}</strong>
              <p className="kpi-card__meta">Updated for {formatDate(new Date())}</p>
            </article>

            <article className="kpi-card">
              <span className="kpi-card__label">Items on ticket</span>
              <strong className="kpi-card__value">{cartCount}</strong>
              <p className="kpi-card__meta">Ready to bill and print</p>
            </article>

            <article className="kpi-card">
              <span className="kpi-card__label">Running total</span>
              <strong className="kpi-card__value">{formatCurrency(total)}</strong>
              <p className="kpi-card__meta">Inclusive of 5% GST</p>
            </article>
          </div>
        </header>


      </div>

      {showInvoice && (
        <div className="invoice-overlay">
          <div className="invoice-dialog">
            <div id="print-area" className="invoice-sheet print-area">
              <div className="invoice-sheet__header">
                <span className="page-eyebrow">Receipt preview</span>
                <h3>TableTurn POS</h3>
                <p>{formatDateTime(new Date())}</p>
              </div>

              <div className="invoice-tags">
                <span className="status-badge">{orderType}</span>
                <span className="status-badge status-badge--soft">
                  {paymentMethod}
                </span>
              </div>

              <div className="invoice-lines">
                {cart.map((item) => (
                  <div key={item._id} className="invoice-line">
                    <span>
                      {item.name} x {item.qty}
                    </span>
                    <strong>{formatCurrency(item.price * item.qty)}</strong>
                  </div>
                ))}
              </div>

              <div className="totals-card totals-card--invoice">
                <div className="summary-line">
                  <span>Subtotal</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>

                <div className="summary-line">
                  <span>GST (5%)</span>
                  <strong>{formatCurrency(gst)}</strong>
                </div>

                <div className="summary-line summary-line--total">
                  <span>Total</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>

              <p className="invoice-note">
                Thank you for dining with us. Please visit again.
              </p>
            </div>

            <div className="invoice-actions">
              <button
                type="button"
                onClick={() => setShowInvoice(false)}
                className="action-button action-button--ghost"
              >
                Close
              </button>

            <button
  type="button"
  onClick={handlePrint}
  className="action-button action-button--secondary"
>
  Print Receipt
</button>

              <button
                type="button"
                onClick={completeOrder}
                className="action-button"
              >
                Complete Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
