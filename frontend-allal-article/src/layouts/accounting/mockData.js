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
  { id: 121, code: "132", nameAr: "ذمم مدينة متنوعة",         parentId: 12,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 2300000  },
  { id: 130, code: "141", nameAr: "الصندوق الرئيسي",            parentId: 13,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 4250000  },
  { id: 131, code: "142", nameAr: "الحساب البنكي",             parentId: 13,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 9800000  },
  { id: 132, code: "143", nameAr: "صندوق المبيعات",            parentId: 13,  level: 3, classification: "asset",     normalBalance: "debit",  isPostable: true,  isControl: false, isActive: true,  balance: 850000   },
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

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA V2 — شجرة الحسابات المحاسبية
// ═══════════════════════════════════════════════════════════════════════════════
// type:       0=Root(دليل)  1=General(رئيسي)  2=Branch(فرعي)  3=BranchLedger(أستاذ فرعي)
// list:       1=Assets(أصول)  2=Discounts(خصومات)  3=Income(إيرادات)  4=Expenses(مصروفات)
// department: 1=BalanceSheet(الميزانية)  2=IncomeStatement(قائمة الدخل)
// side:       1=Debit(مدين)  2=Credit(دائن)
// ═══════════════════════════════════════════════════════════════════════════════

export const ACCOUNT_TYPES = {
  0: { label: "دليل",        color: "#344767", bg: "#e9ecef" },
  1: { label: "رئيسي",      color: "#7928ca", bg: "#f3e8ff" },
  2: { label: "فرعي",       color: "#17c1e8", bg: "#e3f8fd" },
  3: { label: "أستاذ فرعي", color: "#82d616", bg: "#f0fde4" },
};

export const ACCOUNT_LISTS = {
  1: { label: "أصول",    color: "#17c1e8", bg: "#e3f8fd" },
  2: { label: "خصومات",  color: "#fb8c00", bg: "#fff3e0" },
  3: { label: "إيرادات", color: "#82d616", bg: "#f0fde4" },
  4: { label: "مصروفات", color: "#ea0606", bg: "#ffeaea" },
};

export const ACCOUNT_DEPARTMENTS = {
  1: { label: "الميزانية العمومية" },
  2: { label: "قائمة الدخل" },
};

export const ACCOUNT_SIDES = {
  1: { label: "مدين" },
  2: { label: "دائن" },
};

// ─── Flat data (schema V2) ────────────────────────────────────────────────────
export const mockAccountsV2 = [
  // Level 1 — Root
  { id: 1,   code: "1000", nameAr: "الأصول",               parent_id: null, parent_code: null,   level: 1, type: 0, list: 1, department: 1, side: 1, is_active: true,  balance: 0        },
  { id: 2,   code: "2000", nameAr: "الخصوم",               parent_id: null, parent_code: null,   level: 1, type: 0, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 3,   code: "3000", nameAr: "حقوق الملكية",          parent_id: null, parent_code: null,   level: 1, type: 0, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 4,   code: "4000", nameAr: "الإيرادات",             parent_id: null, parent_code: null,   level: 1, type: 0, list: 3, department: 2, side: 2, is_active: true,  balance: 0        },
  { id: 5,   code: "5000", nameAr: "المصروفات",             parent_id: null, parent_code: null,   level: 1, type: 0, list: 4, department: 2, side: 1, is_active: true,  balance: 0        },

  // Level 2 — General
  { id: 10,  code: "1100", nameAr: "الأصول الثابتة",        parent_id: 1,  parent_code: "1000", level: 2, type: 1, list: 1, department: 1, side: 1, is_active: true,  balance: 0        },
  { id: 11,  code: "1200", nameAr: "المخزونات",             parent_id: 1,  parent_code: "1000", level: 2, type: 1, list: 1, department: 1, side: 1, is_active: true,  balance: 0        },
  { id: 12,  code: "1300", nameAr: "الذمم المدينة",          parent_id: 1,  parent_code: "1000", level: 2, type: 1, list: 1, department: 1, side: 1, is_active: true,  balance: 0        },
  { id: 13,  code: "1400", nameAr: "الأصول السائلة",        parent_id: 1,  parent_code: "1000", level: 2, type: 1, list: 1, department: 1, side: 1, is_active: true,  balance: 0        },
  { id: 20,  code: "2100", nameAr: "ديون طويلة الأجل",      parent_id: 2,  parent_code: "2000", level: 2, type: 1, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 21,  code: "2200", nameAr: "الذمم الدائنة",         parent_id: 2,  parent_code: "2000", level: 2, type: 1, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 30,  code: "3100", nameAr: "رأس المال",             parent_id: 3,  parent_code: "3000", level: 2, type: 1, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 31,  code: "3200", nameAr: "الأرباح والاحتياطيات",  parent_id: 3,  parent_code: "3000", level: 2, type: 1, list: 2, department: 1, side: 2, is_active: true,  balance: 0        },
  { id: 40,  code: "4100", nameAr: "إيرادات المبيعات",      parent_id: 4,  parent_code: "4000", level: 2, type: 1, list: 3, department: 2, side: 2, is_active: true,  balance: 0        },
  { id: 41,  code: "4200", nameAr: "إيرادات أخرى",          parent_id: 4,  parent_code: "4000", level: 2, type: 1, list: 3, department: 2, side: 2, is_active: true,  balance: 0        },
  { id: 50,  code: "5100", nameAr: "تكلفة المبيعات",        parent_id: 5,  parent_code: "5000", level: 2, type: 1, list: 4, department: 2, side: 1, is_active: true,  balance: 0        },
  { id: 51,  code: "5200", nameAr: "مصروفات تشغيلية",      parent_id: 5,  parent_code: "5000", level: 2, type: 1, list: 4, department: 2, side: 1, is_active: true,  balance: 0        },

  // Level 3 — BranchLedger (postable, type=3) & Branch control (type=2)
  { id: 100, code: "1101", nameAr: "عقارات ومباني",          parent_id: 10, parent_code: "1100", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 15000000 },
  { id: 101, code: "1102", nameAr: "معدات وتجهيزات",         parent_id: 10, parent_code: "1100", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 8500000  },
  { id: 102, code: "1103", nameAr: "وسائل النقل",             parent_id: 10, parent_code: "1100", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 6000000  },
  { id: 110, code: "1201", nameAr: "بضاعة للبيع",            parent_id: 11, parent_code: "1200", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 12800000 },
  { id: 120, code: "1301", nameAr: "ذمم العملاء",             parent_id: 12, parent_code: "1300", level: 3, type: 2, list: 1, department: 1, side: 1, is_active: true,  balance: 18450000 },
  { id: 121, code: "1302", nameAr: "ذمم مدينة متنوعة",       parent_id: 12, parent_code: "1300", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 2300000  },
  { id: 130, code: "1401", nameAr: "الصندوق الرئيسي",         parent_id: 13, parent_code: "1400", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 4250000  },
  { id: 131, code: "1402", nameAr: "الحساب البنكي",           parent_id: 13, parent_code: "1400", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 9800000  },
  { id: 132, code: "1403", nameAr: "صندوق المبيعات",          parent_id: 13, parent_code: "1400", level: 3, type: 3, list: 1, department: 1, side: 1, is_active: true,  balance: 850000   },
  { id: 200, code: "2101", nameAr: "قروض بنكية",              parent_id: 20, parent_code: "2100", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: true,  balance: 5000000  },
  { id: 210, code: "2201", nameAr: "ذمم الموردين",            parent_id: 21, parent_code: "2200", level: 3, type: 2, list: 2, department: 1, side: 2, is_active: true,  balance: 8200000  },
  { id: 211, code: "2202", nameAr: "ذمم دائنة متنوعة",       parent_id: 21, parent_code: "2200", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: true,  balance: 1500000  },
  { id: 212, code: "2203", nameAr: "ضرائب ورسوم",             parent_id: 21, parent_code: "2200", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: true,  balance: 620000   },
  { id: 300, code: "3101", nameAr: "رأس المال المدفوع",       parent_id: 30, parent_code: "3100", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: true,  balance: 30000000 },
  { id: 310, code: "3201", nameAr: "أرباح السنوات السابقة",  parent_id: 31, parent_code: "3200", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: true,  balance: 22380000 },
  { id: 311, code: "3202", nameAr: "أرباح السنة الحالية",    parent_id: 31, parent_code: "3200", level: 3, type: 3, list: 2, department: 1, side: 2, is_active: false, balance: 0        },
  { id: 400, code: "4101", nameAr: "مبيعات البضاعة",         parent_id: 40, parent_code: "4100", level: 3, type: 3, list: 3, department: 2, side: 2, is_active: true,  balance: 45600000 },
  { id: 401, code: "4102", nameAr: "مردودات المبيعات",        parent_id: 40, parent_code: "4100", level: 3, type: 3, list: 3, department: 2, side: 1, is_active: true,  balance: 1200000  },
  { id: 410, code: "4201", nameAr: "إيرادات متنوعة",         parent_id: 41, parent_code: "4200", level: 3, type: 3, list: 3, department: 2, side: 2, is_active: true,  balance: 850000   },
  { id: 500, code: "5101", nameAr: "تكلفة البضاعة المباعة",  parent_id: 50, parent_code: "5100", level: 3, type: 3, list: 4, department: 2, side: 1, is_active: true,  balance: 28400000 },
  { id: 510, code: "5201", nameAr: "رواتب وأجور",            parent_id: 51, parent_code: "5200", level: 3, type: 3, list: 4, department: 2, side: 1, is_active: true,  balance: 5200000  },
  { id: 511, code: "5202", nameAr: "إيجارات",                parent_id: 51, parent_code: "5200", level: 3, type: 3, list: 4, department: 2, side: 1, is_active: true,  balance: 1440000  },
  { id: 512, code: "5203", nameAr: "نقل وتوزيع",             parent_id: 51, parent_code: "5200", level: 3, type: 3, list: 4, department: 2, side: 1, is_active: true,  balance: 980000   },
  { id: 513, code: "5204", nameAr: "مصروفات إدارية",         parent_id: 51, parent_code: "5200", level: 3, type: 3, list: 4, department: 2, side: 1, is_active: true,  balance: 650000   },
];

// ─── Numeric-aware code comparison ───────────────────────────────────────────
export function codeCompare(a, b) {
  const numA = /^\d+$/.test(a.code) ? parseInt(a.code, 10) : null;
  const numB = /^\d+$/.test(b.code) ? parseInt(b.code, 10) : null;
  if (numA !== null && numB !== null) return numA - numB;
  return a.code.localeCompare(b.code);
}

// ─── Build tree from flat V2 list ────────────────────────────────────────────
export function buildAccountTreeV2(accounts) {
  const map = {};
  accounts.forEach((a) => { map[a.id] = { ...a, children: [] }; });

  const roots = [];
  accounts.forEach((a) => {
    if (a.parent_id !== null && map[a.parent_id]) {
      map[a.parent_id].children.push(map[a.id]);
    } else {
      roots.push(map[a.id]);
    }
  });

  function sortChildren(node) {
    node.children.sort(codeCompare);
    node.children.forEach(sortChildren);
  }
  roots.sort(codeCompare);
  roots.forEach(sortChildren);

  function computeTotals(node) {
    if (!node.children.length) { node.totalBalance = node.balance || 0; return node.totalBalance; }
    node.totalBalance = node.children.reduce((s, c) => s + computeTotals(c), 0);
    return node.totalBalance;
  }
  roots.forEach(computeTotals);

  return roots;
}

// ─── Flatten tree into ordered list ──────────────────────────────────────────
export function flattenV2(nodes, result = []) {
  nodes.forEach((n) => { result.push(n); if (n.children?.length) flattenV2(n.children, result); });
  return result;
}

// ─── Suggest next child code ──────────────────────────────────────────────────
// Splits code into alpha-prefix + numeric-body + alpha-suffix.
// If siblings exist: takes max numeric body among siblings + 1, same width.
// If no siblings: uses parent code + 1 (first child).
export function suggestChildCode(parentAccount, siblingAccounts) {
  if (!parentAccount) return "";

  const refs = siblingAccounts.length > 0
    ? siblingAccounts.map((s) => s.code)
    : [parentAccount.code];

  const parsed = refs.map((c) => {
    const m = c.match(/^([A-Za-z]*)(\d+)([A-Za-z]*)$/);
    if (!m) return null;
    return { prefix: m[1], num: parseInt(m[2], 10), width: m[2].length, suffix: m[3] };
  }).filter(Boolean);

  if (!parsed.length) return parentAccount.code + "1";

  const maxEntry = parsed.reduce((a, b) => (a.num > b.num ? a : b));
  const next     = maxEntry.num + 1;
  const padded   = String(next).padStart(maxEntry.width, "0");
  return maxEntry.prefix + padded + maxEntry.suffix;
}

// ─── Validate no duplicate code within tenant ─────────────────────────────────
export function isDuplicateCode(code, allAccounts, excludeId = null) {
  return allAccounts.some((a) => a.code === code && a.id !== excludeId);
}
