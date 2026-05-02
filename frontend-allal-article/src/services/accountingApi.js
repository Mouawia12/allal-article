import apiClient from "./apiClient";

const mapPayload = (payload, mapper) => {
  if (Array.isArray(payload)) return payload.map(mapper);
  if (payload?.content && Array.isArray(payload.content)) {
    return { ...payload, content: payload.content.map(mapper) };
  }
  return payload ? mapper(payload) : payload;
};

const normalizeResponse = (mapper) => (response) => {
  response.data = mapPayload(response.data, mapper);
  return response;
};

const mapFiscalYear = (fy) => {
  const closed = fy.closed ?? fy.status === "closed";
  return { ...fy, closed, isClosed: fy.isClosed ?? closed };
};

const mapAccount = (account) => {
  const isPostable = account.isPostable ?? account.postable;
  const isControl = account.isControl ?? account.control;
  const isActive = account.isActive ?? account.status === "active";
  return {
    ...account,
    name: account.name ?? account.nameAr,
    isPostable,
    postable: account.postable ?? isPostable,
    isControl,
    control: account.control ?? isControl,
    isActive,
  };
};

const mapJournal = (journal) => {
  const lines = journal.lines ?? journal.items ?? [];
  return {
    ...journal,
    number: journal.number ?? journal.journalNumber,
    date: journal.date ?? journal.journalDate,
    type: journal.type ?? journal.journalBookCode,
    source: journal.source ?? journal.referenceType ?? journal.journalBookCode,
    lines,
  };
};

const mapJournalBook = (book) => ({
  ...book,
  code: book.code ?? book.type,
  label: book.label ?? book.name,
  nextSeq: book.nextSeq ?? 1,
});

export const accountingApi = {
  // Fiscal years
  listFiscalYears: () => apiClient.get("/api/accounting/fiscal-years").then(normalizeResponse(mapFiscalYear)),
  getFiscalYear: (id) => apiClient.get(`/api/accounting/fiscal-years/${id}`).then(normalizeResponse(mapFiscalYear)),
  createFiscalYear: (data) => apiClient.post("/api/accounting/fiscal-years", data).then(normalizeResponse(mapFiscalYear)),
  closeFiscalYear: (id) => apiClient.post(`/api/accounting/fiscal-years/${id}/close`).then(normalizeResponse(mapFiscalYear)),

  // Accounts (chart of accounts)
  listAccounts: () => apiClient.get("/api/accounting/accounts").then(normalizeResponse(mapAccount)),
  getAccount: (id) => apiClient.get(`/api/accounting/accounts/${id}`).then(normalizeResponse(mapAccount)),
  createAccount: (data) => apiClient.post("/api/accounting/accounts", data).then(normalizeResponse(mapAccount)),
  updateAccount: (id, data) => apiClient.put(`/api/accounting/accounts/${id}`, data).then(normalizeResponse(mapAccount)),
  deleteAccount: (id) => apiClient.delete(`/api/accounting/accounts/${id}`),

  // Journals
  listJournals: (params) => apiClient.get("/api/accounting/journals", { params }).then(normalizeResponse(mapJournal)),
  getJournal: (id) => apiClient.get(`/api/accounting/journals/${id}`).then(normalizeResponse(mapJournal)),
  createJournal: (data) => apiClient.post("/api/accounting/journals", data).then(normalizeResponse(mapJournal)),
  postJournal: (id) => apiClient.post(`/api/accounting/journals/${id}/post`).then(normalizeResponse(mapJournal)),
  deleteJournal: (id) => apiClient.delete(`/api/accounting/journals/${id}`),

  // Dimensions
  listDimensions: () => apiClient.get("/api/accounting/dimensions"),
  addDimensionItem: (typeCode, data) => apiClient.post(`/api/accounting/dimensions/types/${typeCode}/items`, data),
  updateDimensionItem: (id, data) => apiClient.put(`/api/accounting/dimensions/items/${id}`, data),

  // Subledgers
  listSubledgers: () => apiClient.get("/api/accounting/subledgers"),
  reconciliation: (type) => apiClient.get("/api/accounting/subledgers/reconciliation", { params: { type } }),

  // Journal books
  listJournalBooks: () => apiClient.get("/api/accounting/journal-books").then(normalizeResponse(mapJournalBook)),
  updateJournalBook: (id, data) => apiClient.put(`/api/accounting/journal-books/${id}`, data),

  // Accounting settings
  listAccountingSettings: () => apiClient.get("/api/accounting/settings"),
  updateAccountingSettings: (settings) => apiClient.put("/api/accounting/settings", { settings }),

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
