import apiClient from "./apiClient";

export const accountingApi = {
  // Fiscal years
  listFiscalYears: () => apiClient.get("/api/accounting/fiscal-years"),
  getFiscalYear: (id) => apiClient.get(`/api/accounting/fiscal-years/${id}`),
  createFiscalYear: (data) => apiClient.post("/api/accounting/fiscal-years", data),
  closeFiscalYear: (id) => apiClient.post(`/api/accounting/fiscal-years/${id}/close`),

  // Accounts (chart of accounts)
  listAccounts: () => apiClient.get("/api/accounting/accounts"),
  getAccount: (id) => apiClient.get(`/api/accounting/accounts/${id}`),
  createAccount: (data) => apiClient.post("/api/accounting/accounts", data),
  updateAccount: (id, data) => apiClient.put(`/api/accounting/accounts/${id}`, data),
  deleteAccount: (id) => apiClient.delete(`/api/accounting/accounts/${id}`),

  // Journals
  listJournals: (params) => apiClient.get("/api/accounting/journals", { params }),
  getJournal: (id) => apiClient.get(`/api/accounting/journals/${id}`),
  createJournal: (data) => apiClient.post("/api/accounting/journals", data),
  postJournal: (id) => apiClient.post(`/api/accounting/journals/${id}/post`),
  deleteJournal: (id) => apiClient.delete(`/api/accounting/journals/${id}`),

  // Reports
  trialBalance: (fiscalYearId, periodId) =>
    apiClient.get("/api/accounting/reports/trial-balance", { params: { fiscalYearId, periodId } }),
  balanceSheet: (fiscalYearId, periodId) =>
    apiClient.get("/api/accounting/reports/balance-sheet", { params: { fiscalYearId, periodId } }),
  incomeStatement: (fiscalYearId, periodId) =>
    apiClient.get("/api/accounting/reports/income-statement", { params: { fiscalYearId, periodId } }),
  generalLedger: (accountId, fiscalYearId) =>
    apiClient.get("/api/accounting/reports/general-ledger", { params: { accountId, fiscalYearId } }),
  saveOpeningBalances: (data) => apiClient.post("/api/accounting/reports/opening-balances", data),
};
