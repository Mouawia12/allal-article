import apiClient from "./apiClient";

export const reportsApi = {
  salesByCustomer: (from, to) =>
    apiClient.get("/api/reports/sales/by-customer", { params: { from, to } }),
  salesBySalesperson: (from, to) =>
    apiClient.get("/api/reports/sales/by-salesperson", { params: { from, to } }),
  salesByWilaya: (from, to) =>
    apiClient.get("/api/reports/sales/by-wilaya", { params: { from, to } }),
  salesByProduct: (from, to) =>
    apiClient.get("/api/reports/sales/by-product", { params: { from, to } }),
};
