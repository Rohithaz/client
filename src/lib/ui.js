export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatCurrency = (value) =>
  currencyFormatter.format(Number(value || 0));

export const formatDate = (value) => shortDateFormatter.format(new Date(value));

export const formatDateTime = (value) =>
  dateTimeFormatter.format(new Date(value));

export const formatTime = (value) => timeFormatter.format(new Date(value));
