import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Store,
  Users,
  Utensils,
} from "lucide-react";
import { getHomeForRole, normalizeRole } from "../lib/auth";
import "./admin.css";

const roleNav = {
  super_admin: [
    { to: "/restaurants", label: "Restaurants", icon: Store },
    { to: "/platform", label: "Platform Dashboard", icon: LayoutDashboard },
    { to: "/users", label: "User Management", icon: Users },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/billing", label: "Billing", icon: Receipt },
    { to: "/menu", label: "Menu Management", icon: Utensils },
    { to: "/staff", label: "Staff Management", icon: Users },
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/orders", label: "Order History", icon: ClipboardList },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
};

export default function AdminLayout({ auth, onLogout }) {
  const navigate = useNavigate();
  const role = normalizeRole(auth?.role);
  const navItems = roleNav[role] || [];

  const handleLogout = () => {
    onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <button
            type="button"
            className="logo-button"
            onClick={() => navigate(getHomeForRole(role))}
          >
            <Shield size={22} />
            <span>TableTurn</span>
          </button>
          <p className="sidebar-role">{role === "super_admin" ? "Super Admin" : "Restaurant Admin"}</p>
        </div>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          {navItems.map(({ to, label, icon }) => {
            const IconComponent = icon;

            return (
              <NavLink key={to} to={to}>
                <IconComponent size={18} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <button type="button" onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
