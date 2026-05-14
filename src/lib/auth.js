const AUTH_KEY = "auth";
const LEGACY_TOKEN_KEY = "token";
const AUTH_CHANGE_EVENT = "auth:changed";

const notifyAuthChange = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

const parseStoredAuth = (value) => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.token !== "string" ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }

    return {
      token: parsed.token,
      role: parsed.role,
      user: parsed.user || null,
    };
  } catch {
    return null;
  }
};

export const getStoredAuth = () =>
  parseStoredAuth(sessionStorage.getItem(AUTH_KEY));

export const getStoredToken = () => getStoredAuth()?.token || null;

export const getStoredRole = () => getStoredAuth()?.role || null;

export const storeAuth = ({ token, role, user }) => {
  if (!token || !role) {
    return;
  }

  sessionStorage.setItem(AUTH_KEY, JSON.stringify({ token, role, user: user || null }));
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  notifyAuthChange();
};

export const normalizeRole = (role) => (role === "staff" ? "cashier" : role);

export const getHomeForRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "super_admin") {
    return "/platform";
  }

  if (normalizedRole === "admin") {
    return "/dashboard";
  }

  return "/";
};

export const clearStoredToken = () => {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem("user");
  notifyAuthChange();
};

export const clearLegacyToken = () => {
  let didClearLegacyToken = false;

  if (sessionStorage.getItem(LEGACY_TOKEN_KEY)) {
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    didClearLegacyToken = true;
  }

  if (localStorage.getItem(LEGACY_TOKEN_KEY)) {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    didClearLegacyToken = true;
  }

  if (didClearLegacyToken) {
    notifyAuthChange();
  }
};

export const AUTH_STORAGE_EVENT = AUTH_CHANGE_EVENT;
