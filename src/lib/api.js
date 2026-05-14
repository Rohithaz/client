import { clearStoredToken, getStoredToken } from "./auth";
import { API_BASE } from "./ui";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const authFetch = async (path, options = {}) => {
  const token = getStoredToken();

  if (!token) {
    clearStoredToken();
    throw new ApiError("Session expired", 401);
  }

  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (response.status === 401) {
    clearStoredToken();
    throw new ApiError(data?.message || "Session expired", 401, data);
  }

  if (
    response.status === 403 &&
    typeof data?.message === "string" &&
    data.message.toLowerCase().includes("disabled")
  ) {
    clearStoredToken();
    throw new ApiError(data.message, 401, data);
  }

  if (!response.ok) {
    throw new ApiError(data?.message || "Request failed", response.status, data);
  }

  return data;
};
