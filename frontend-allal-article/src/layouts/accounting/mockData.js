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
// list:       1=Assets  2=Liabilities  3=Equity  4=Revenue  5=Expenses
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
  1: { label: "أصول",       color: "#17c1e8", bg: "#e3f8fd" },
  2: { label: "خصوم",       color: "#fb8c00", bg: "#fff3e0" },
  3: { label: "حقوق ملكية", color: "#7928ca", bg: "#f3e8ff" },
  4: { label: "إيرادات",    color: "#82d616", bg: "#f0fde4" },
  5: { label: "مصروفات",    color: "#ea0606", bg: "#ffeaea" },
};

export const ACCOUNT_DEPARTMENTS = {
  1: { label: "الميزانية العمومية" },
  2: { label: "قائمة الدخل" },
};

export const ACCOUNT_SIDES = {
  1: { label: "مدين" },
  2: { label: "دائن" },
};

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
