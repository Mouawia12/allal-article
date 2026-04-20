// ─── Fiscal Years ─────────────────────────────────────────────────────────────
export const mockFiscalYears = [
  { id: 2, name: "السنة المالية 2025", startDate: "2025-01-01", endDate: "2025-12-31", isClosed: false, closedAt: null, closedBy: null, reopenReason: null },
  { id: 1, name: "السنة المالية 2024", startDate: "2024-01-01", endDate: "2024-12-31", isClosed: true,  closedAt: "2025-01-10", closedBy: "أحمد محمد", reopenReason: null },
];

export let activeFiscalYearId = 2;

// ─── Chart of Accounts (flat list, built into tree by buildTree()) ────────────
// classifications: asset | liability | equity | revenue | expense
// normalBalance:   debit | credit
export const mockAccounts = [
  // ── Level 1: Root ──
  { id: 1,   code: "1",   nameAr: "الأصول",                   parentId: null, level: 1, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 2,   code: "2",   nameAr: "الخصوم",                   parentId: null, level: 1, classification: "liability",  normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 3,   code: "3",   nameAr: "حقوق الملكية",              parentId: null, level: 1, classification: "equity",    normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 4,   code: "4",   nameAr: "الإيرادات",                 parentId: null, level: 1, classification: "revenue",   normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 5,   code: "5",   nameAr: "المصروفات",                 parentId: null, level: 1, classification: "expense",   normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },

  // ── Level 2: Groups ──
  { id: 10,  code: "11",  nameAr: "الأصول الثابتة",            parentId: 1,   level: 2, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 11,  code: "12",  nameAr: "المخزونات",                 parentId: 1,   level: 2, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 12,  code: "13",  nameAr: "الذمم المدينة",              parentId: 1,   level: 2, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 13,  code: "14",  nameAr: "الأصول السائلة",            parentId: 1,   level: 2, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 20,  code: "21",  nameAr: "ديون طويلة الأجل",          parentId: 2,   level: 2, classification: "liability",  normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 21,  code: "22",  nameAr: "الذمم الدائنة",             parentId: 2,   level: 2, classification: "liability",  normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 30,  code: "31",  nameAr: "رأس المال",                 parentId: 3,   level: 2, classification: "equity",    normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 31,  code: "32",  nameAr: "الأرباح والاحتياطيات",      parentId: 3,   level: 2, classification: "equity",    normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 40,  code: "41",  nameAr: "إيرادات المبيعات",          parentId: 4,   level: 2, classification: "revenue",   normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 41,  code: "42",  nameAr: "إيرادات أخرى",              parentId: 4,   level: 2, classification: "revenue",   normalBalance: "credit", isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 50,  code: "51",  nameAr: "تكلفة المبيعات",            parentId: 5,   level: 2, classification: "expense",   normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },
  { id: 51,  code: "52",  nameAr: "مصروفات تشغيلية",          parentId: 5,   level: 2, classification: "expense",   normalBalance: "debit",  isPostable: false, isControl: false, isActive: true,  balance: 0 },

  // ── Level 3: Postable Accounts ──
  { id: 100, code: "111", nameAr: "عقارات ومباني",             parentId: 10,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 15000000 },
  { id: 101, code: "112", nameAr: "معدات وتجهيزات",            parentId: 10,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 8500000  },
  { id: 102, code: "113", nameAr: "وسائل النقل",               parentId: 10,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 6000000  },
  { id: 110, code: "121", nameAr: "بضاعة للبيع",              parentId: 11,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 12800000 },
  { id: 120, code: "131", nameAr: "ذمم العملاء",               parentId: 12,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: false, isControl: true,  isActive: true,  balance: 18450000 },
  { id: 121, code: "132", nameAr: "ذمم مدينة متنوعة",         parentId: 12,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 2100000  },
  { id: 130, code: "141", nameAr: "الصندوق",                   parentId: 13,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 4250000  },
  { id: 131, code: "142", nameAr: "الحساب البنكي",             parentId: 13,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 9800000  },
  { id: 200, code: "211", nameAr: "قروض بنكية",               parentId: 20,  level: 3, classification: "liability",  normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 5000000  },
  { id: 210, code: "221", nameAr: "ذمم الموردين",              parentId: 21,  level: 3, classification: "liability",  normalBalance: "credit", isPostable: false, isControl: true,  isActive: true,  balance: 8200000  },
  { id: 211, code: "222", nameAr: "ذمم دائنة متنوعة",        parentId: 21,  level: 3, classification: "liability",  normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 1500000  },
  { id: 212, code: "223", nameAr: "ضرائب ورسوم",              parentId: 21,  level: 3, classification: "liability",  normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 620000   },
  { id: 300, code: "311", nameAr: "رأس المال المدفوع",         parentId: 30,  level: 3, classification: "equity",    normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 30000000 },
  { id: 310, code: "321", nameAr: "أرباح السنوات السابقة",    parentId: 31,  level: 3, classification: "equity",    normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 22380000 },
  { id: 311, code: "322", nameAr: "أرباح السنة الحالية",      parentId: 31,  level: 3, classification: "equity",    normalBalance: "credit", isPostable: true,  isControl: false, isActive: false, balance: 0        },
  { id: 400, code: "411", nameAr: "مبيعات البضاعة",           parentId: 40,  level: 3, classification: "revenue",   normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 45600000 },
  { id: 401, code: "412", nameAr: "مردودات المبيعات",         parentId: 40,  level: 3, classification: "revenue",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 1200000  },
  { id: 410, code: "421", nameAr: "إيرادات متنوعة",           parentId: 41,  level: 3, classification: "revenue",   normalBalance: "credit", isPostable: true,  isControl: false, isActive: true,  balance: 850000   },
  { id: 500, code: "511", nameAr: "تكلفة البضاعة المباعة",   parentId: 50,  level: 3, classification: "expense",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 28400000 },
  { id: 510, code: "521", nameAr: "رواتب وأجور",              parentId: 51,  level: 3, classification: "expense",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 5200000  },
  { id: 511, code: "522", nameAr: "إيجارات",                  parentId: 51,  level: 3, classification: "expense",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 1440000  },
  { id: 512, code: "523", nameAr: "نقل وتوزيع",               parentId: 51,  level: 3, classification: "expense",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 980000   },
  { id: 513, code: "524", nameAr: "مصروفات إدارية",           parentId: 51,  level: 3, classification: "expense",   normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 650000   },
];

// ─── Build tree structure from flat list ─────────────────────────────────────
export function buildTree(accounts, parentId = null) {
  return accounts
    .filter((a) => a.parentId === parentId)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((a) => {
      const children = buildTree(accounts, a.id);
      const childBalance = children.reduce((s, c) => s + (c.totalBalance ?? c.balance), 0);
      return { ...a, children, totalBalance: children.length > 0 ? childBalance : a.balance };
    });
}

// ─── Journals ────────────────────────────────────────────────────────────────
export const mockJournals = [
  {
    id: 1, number: "JRN-2025-001", date: "2025-01-05", type: "opening", status: "posted",
    source: "opening", description: "قيد الأرصدة الافتتاحية",
    totalDebit: 76900000, totalCredit: 76900000, fiscalYearId: 2,
    lines: [
      { id: 1, accountId: 100, accountCode: "111", accountName: "عقارات ومباني",   debit: 15000000, credit: 0,        description: "رصيد افتتاحي" },
      { id: 2, accountId: 101, accountCode: "112", accountName: "معدات وتجهيزات",  debit: 8500000,  credit: 0,        description: "رصيد افتتاحي" },
      { id: 3, accountId: 130, accountCode: "141", accountName: "الصندوق",         debit: 4250000,  credit: 0,        description: "رصيد افتتاحي" },
      { id: 4, accountId: 300, accountCode: "311", accountName: "رأس المال",       debit: 0,        credit: 27750000, description: "رصيد افتتاحي" },
    ],
  },
  {
    id: 2, number: "JRN-2025-002", date: "2025-01-10", type: "auto", status: "posted",
    source: "sale", description: "مبيعات — طلبية ORD-001",
    totalDebit: 2500000, totalCredit: 2500000, fiscalYearId: 2,
    lines: [
      { id: 1, accountId: 120, accountCode: "131", accountName: "ذمم العملاء",      debit: 2500000, credit: 0,       description: "شركة الرياض" },
      { id: 2, accountId: 400, accountCode: "411", accountName: "مبيعات البضاعة",  debit: 0,       credit: 2500000, description: "" },
    ],
  },
  {
    id: 3, number: "JRN-2025-003", date: "2025-01-15", type: "auto", status: "posted",
    source: "payment", description: "دفعة زبون — PMT-001",
    totalDebit: 2500000, totalCredit: 2500000, fiscalYearId: 2,
    lines: [
      { id: 1, accountId: 130, accountCode: "141", accountName: "الصندوق",         debit: 2500000, credit: 0,       description: "" },
      { id: 2, accountId: 120, accountCode: "131", accountName: "ذمم العملاء",     debit: 0,       credit: 2500000, description: "شركة الرياض" },
    ],
  },
  {
    id: 4, number: "JRN-2025-004", date: "2025-01-18", type: "manual", status: "draft",
    source: "manual", description: "مصروفات إدارية — جانفي",
    totalDebit: 120000, totalCredit: 120000, fiscalYearId: 2,
    lines: [
      { id: 1, accountId: 513, accountCode: "524", accountName: "مصروفات إدارية", debit: 120000, credit: 0,      description: "" },
      { id: 2, accountId: 130, accountCode: "141", accountName: "الصندوق",         debit: 0,      credit: 120000, description: "" },
    ],
  },
  {
    id: 5, number: "JRN-2025-005", date: "2025-01-20", type: "auto", status: "posted",
    source: "purchase", description: "فاتورة شراء — PUR-001",
    totalDebit: 4800000, totalCredit: 4800000, fiscalYearId: 2,
    lines: [
      { id: 1, accountId: 110, accountCode: "121", accountName: "بضاعة للبيع",    debit: 4800000, credit: 0,       description: "" },
      { id: 2, accountId: 210, accountCode: "221", accountName: "ذمم الموردين",    debit: 0,       credit: 4800000, description: "" },
    ],
  },
  {
    id: 6, number: "JRN-2025-006", date: "2025-02-03", type: "manual", status: "reversed",
    source: "manual", description: "قيد تصحيح — ملغى",
    totalDebit: 50000, totalCredit: 50000, fiscalYearId: 2,
    reversedById: 7,
    lines: [
      { id: 1, accountId: 513, accountCode: "524", accountName: "مصروفات إدارية", debit: 50000, credit: 0,     description: "" },
      { id: 2, accountId: 130, accountCode: "141", accountName: "الصندوق",         debit: 0,     credit: 50000, description: "" },
    ],
  },
];

// ─── Accounting Settings ─────────────────────────────────────────────────────
export const mockAccountSettings = [
  { key: "sales_revenue",      label: "إيرادات المبيعات",        group: "مبيعات",   accountId: 400 },
  { key: "sales_returns",      label: "مردودات المبيعات",        group: "مبيعات",   accountId: 401 },
  { key: "discount_given",     label: "خصم ممنوح للزبائن",       group: "مبيعات",   accountId: null },
  { key: "cogs",               label: "تكلفة البضاعة المباعة",   group: "مخزون",    accountId: 500 },
  { key: "inventory",          label: "حساب المخزون",            group: "مخزون",    accountId: 110 },
  { key: "customers_control",  label: "حساب العملاء (رقابي)",    group: "ذمم",      accountId: 120 },
  { key: "suppliers_control",  label: "حساب الموردين (رقابي)",   group: "ذمم",      accountId: 210 },
  { key: "cash",               label: "الصندوق",                  group: "سيولة",    accountId: 130 },
  { key: "bank",               label: "الحساب البنكي",            group: "سيولة",    accountId: 131 },
  { key: "tax_payable",        label: "ضرائب ورسوم",              group: "ضرائب",    accountId: 212 },
  { key: "retained_earnings",  label: "الأرباح المرحلة",         group: "حقوق ملكية", accountId: 310 },
  { key: "current_year_profit",label: "أرباح السنة الحالية",     group: "حقوق ملكية", accountId: 311 },
];

// ─── Labels ───────────────────────────────────────────────────────────────────
export const classificationLabels = {
  asset:     { label: "أصول",       color: "#17c1e8", bg: "#e3f8fd" },
  liability: { label: "خصوم",       color: "#fb8c00", bg: "#fff3e0" },
  equity:    { label: "حقوق ملكية", color: "#7928ca", bg: "#f3e8ff" },
  revenue:   { label: "إيرادات",    color: "#82d616", bg: "#f0fde4" },
  expense:   { label: "مصروفات",    color: "#ea0606", bg: "#ffeaea" },
};

export const journalTypeLabels = {
  manual:  { label: "يدوي",    color: "default" },
  auto:    { label: "تلقائي",  color: "info"    },
  opening: { label: "افتتاحي", color: "warning" },
};

export const journalStatusLabels = {
  draft:    { label: "مسودة",  color: "#fb8c00", bg: "#fff3e0" },
  posted:   { label: "مرحّل",  color: "#82d616", bg: "#f0fde4" },
  reversed: { label: "معكوس",  color: "#8392ab", bg: "#f8f9fa" },
  void:     { label: "ملغى",   color: "#ea0606", bg: "#ffeaea" },
};

export const journalSourceLabels = {
  manual:   "يدوي",
  sale:     "فاتورة بيع",
  purchase: "فاتورة شراء",
  payment:  "دفعة",
  return:   "مرتجع",
  opening:  "افتتاحي",
};

export function fmt(n) {
  if (!n && n !== 0) return "—";
  return Number(n).toLocaleString("ar-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
