import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Billing from "./pages/Billing/Billing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import MenuManagement from "./pages/MenuManagement";
import StaffManagement from "./pages/StaffManagement";
import Reports from "./pages/Reports";
import OrderHistory from "./pages/OrderHistory";
import Settings from "./pages/Settings";
import Restaurants from "./pages/SuperAdmin/Restaurants";
import PlatformDashboard from "./pages/SuperAdmin/PlatformDashboard";
import UserManagement from "./pages/SuperAdmin/UserManagement";
import {
  AUTH_STORAGE_EVENT,
  clearLegacyToken,
  clearStoredToken,
  getHomeForRole,
  getStoredAuth,
  normalizeRole,
} from "./lib/auth";
import "./App.css";

const hasAllowedRole = (role, allowedRoles) =>
  allowedRoles.includes(normalizeRole(role));

const ProtectedRoute = ({ auth, allowedRoles, children }) => {
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasAllowedRole(auth.role, allowedRoles)) {
    return <Navigate to={getHomeForRole(auth.role)} replace />;
  }

  return children;
};

function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const role = normalizeRole(auth?.role);

  useEffect(() => {
    const syncAuth = () => {
      setAuth(getStoredAuth());
    };

    clearLegacyToken();
    syncAuth();

    window.addEventListener(AUTH_STORAGE_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener(AUTH_STORAGE_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleLogout = () => {
    clearStoredToken();
    setAuth(null);
  };

  return (
    <BrowserRouter>
      <div className={`app-shell${auth?.token ? "" : " app-shell--auth"}`}>
        <main className={auth?.token ? "app-content" : "app-content app-content--auth"}>
          <Routes>
            <Route
              path="/login"
              element={
                !auth?.token ? (
                  <Login setAuth={setAuth} />
                ) : (
                  <Navigate to={getHomeForRole(role)} replace />
                )
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute auth={auth} allowedRoles={["cashier"]}>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute auth={auth} allowedRoles={["admin", "super_admin"]}>
                  <AdminLayout auth={auth} onLogout={handleLogout} />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              <Route path="/billing-admin" element={<Navigate to="/billing" replace />} />
              <Route
                path="/menu"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <MenuManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin" element={<Navigate to="/menu" replace />} />
              <Route path="/admin-functions/menu" element={<Navigate to="/menu" replace />} />
              <Route path="/admin-functions/catalog" element={<Navigate to="/menu" replace />} />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["admin"]}>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/restaurants"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["super_admin"]}>
                    <Restaurants />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/platform"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["super_admin"]}>
                    <PlatformDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute auth={auth} allowedRoles={["super_admin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route
              path="*"
              element={<Navigate to={auth?.token ? getHomeForRole(role) : "/login"} replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
