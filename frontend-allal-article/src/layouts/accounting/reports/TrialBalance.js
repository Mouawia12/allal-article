/* eslint-disable react/prop-types */
/**
 * TrialBalance.js — ميزان المراجعة الاحترافي
 *
 * المعادلات:
 *   opening_debit/credit  = مجموع الحركات قبل date_from  (مرحّلة فقط)
 *   period_debit/credit   = مجموع الحركات [date_from .. date_to]
 *   current_debit/credit  = opening + period
 *   net_balance           = current_debit - current_credit
 *   balance_debit         = max(0, net_balance)
 *   balance_credit        = max(0, -net_balance)
 *
 * الـ Rollup: DFS من الجذر ← كل أب يجمع كل أبنائه بشكل memoized.
 */

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { classificationLabels } from "../mockData";
import { accountingApi } from "services";

// ─── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_COLORS = ["#17c1e8", "#82d616", "#fb8c00", "#7928ca", "#ea0606", "#344767"];
const LEVEL_BG     = ["rgba(23,193,232,.10)", "rgba(130,214,22,.07)", "rgba(251,140,0,.06)", "rgba(121,40,202,.05)", "rgba(234,6,6,.04)", "rgba(52,71,103,.04)"];
const ACCOUNT_TYPES = [
  { value: "all",       label: "كل التصنيفات" },
  { value: "asset",     label: "أصول" },
  { value: "liability", label: "خصوم" },
  { value: "equity",    label: "حقوق ملكية" },
  { value: "revenue",   label: "إيرادات" },
  { value: "expense",   label: "مصروفات" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!isFinite(v)) return "—";
  return v.toLocaleString("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function isZero(row) {
  return (
    Math.abs(row.before_debit)  < 0.0001 &&
    Math.abs(row.before_credit) < 0.0001 &&
    Math.abs(row.debit)         < 0.0001 &&
    Math.abs(row.credit)        < 0.0001
  );
}

function compareCodes(a, b) {
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

// ─── Engine: compute raw per-account metrics from mock journals ───────────────
function computeDirectMetrics(journals, dateFrom, dateTo) {
  // returns Map<accountId, {before_debit, before_credit, debit, credit}>
  const map = new Map();

  const ensure = (id) => {
    if (!map.has(id)) map.set(id, { before_debit: 0, before_credit: 0, debit: 0, credit: 0 });
    return map.get(id);
  };

  journals
    .filter((j) => j.status === "posted")
    .forEach((j) => {
      (j.lines || []).forEach((line) => {
        const m   = ensure(line.accountId);
        const d   = Number(line.debit  || 0);
        const c   = Number(line.credit || 0);

        const beforePeriod = dateFrom && j.date < dateFrom;
        const inPeriod     = (!dateFrom || j.date >= dateFrom) && (!dateTo || j.date <= dateTo);

        if (beforePeriod) {
          m.before_debit  += d;
          m.before_credit += c;
        } else if (inPeriod) {
          m.debit  += d;
          m.credit += c;
        }
        // dates after dateTo are ignored
      });
    });

  return map;
}

function deriveRow(direct) {
  const before_debit  = direct?.before_debit  || 0;
  const before_credit = direct?.before_credit || 0;
  const debit         = direct?.debit         || 0;
  const credit        = direct?.credit        || 0;
  const after_debit   = before_debit  + debit;
  const after_credit  = before_credit + credit;
  const net           = after_debit - after_credit;
  return {
    before_debit, before_credit,
    debit, credit,
    after_debit, after_credit,
    net_balance:    net,
    balance_debit:  net > 0 ? net : 0,
    balance_credit: net < 0 ? -net : 0,
  };
}

function sumRows(a, b) {
  return {
    before_debit:   a.before_debit  + b.before_debit,
    before_credit:  a.before_credit + b.before_credit,
    debit:          a.debit         + b.debit,
    credit:         a.credit        + b.credit,
    after_debit:    a.after_debit   + b.after_debit,
    after_credit:   a.after_credit  + b.after_credit,
    net_balance:    a.net_balance   + b.net_balance,
    balance_debit:  0, // recalculated after
    balance_credit: 0,
  };
}

// ─── Build flat tree with rollup ─────────────────────────────────────────────
function buildDisplayTree(accounts, directMap) {
  // Sort flat list
  const sorted = [...accounts].sort((a, b) => compareCodes(a.code, b.code));

  // children map
  const childrenOf = new Map();
  sorted.forEach((a) => {
    const pid = a.parentId ?? null;
    if (!childrenOf.has(pid)) childrenOf.set(pid, []);
    childrenOf.get(pid).push(a.id);
  });
  const byId = new Map(sorted.map((a) => [a.id, a]));

  // memoized DFS rollup
  const rollupCache = new Map();
  function rollup(id) {
    if (rollupCache.has(id)) return rollupCache.get(id);
    const direct = deriveRow(directMap.get(id));
    const children = childrenOf.get(id) || [];
    let total = { ...direct };
    children.forEach((cid) => {
      const c = rollup(cid);
      total = sumRows(total, c);
    });
    // recalc net from totals
    const net = total.after_debit - total.after_credit;
    total.net_balance    = net;
    total.balance_debit  = net > 0 ? net : 0;
    total.balance_credit = net < 0 ? -net : 0;

    // has_direct_posting
    const directData = deriveRow(directMap.get(id));
    total._hasDirectPosting = !isZero(directData);
    total._hasChildren = children.length > 0;
    rollupCache.set(id, total);
    return total;
  }

  const roots = childrenOf.get(null) || [];
  roots.forEach((id) => rollup(id));

  // walk DFS to produce flat display list with level info
  const result = [];
  function walk(id, depth) {
    const acc = byId.get(id);
    if (!acc) return;
    const metrics = rollupCache.get(id) || deriveRow(directMap.get(id));
    result.push({
      id,
      code: acc.code,
      nameAr: acc.nameAr,
      level: acc.level,
      depth,
      classification: acc.classification,
      normalBalance: acc.normalBalance,
      isPostable: acc.isPostable,
      isControl: acc.isControl,
      isActive: acc.isActive,
      hasChildren: metrics._hasChildren,
      hasDirectPosting: metrics._hasDirectPosting,
      isParent: metrics._hasChildren,
      ...metrics,
    });
    (childrenOf.get(id) || []).forEach((cid) => walk(cid, depth + 1));
  }
  roots.forEach((id) => walk(id, 0));

  return result;
}

// ─── CSV export (no external dep) ────────────────────────────────────────────
function downloadCSV(rows, cols) {
  const header = cols.map((c) => `"${c.label}"`).join(",");
  const lines = rows.map((r) =>
    cols.map((c) => {
      const v = r[c.key];
      return typeof v === "number" ? v.toFixed(4) : `"${String(v ?? "").replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel Arabic
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "trial-balance.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── AmountCell ──────────────────────────────────────────────────────────────
// Use HTML `style` for textAlign so it bypasses the stylis RTL plugin (which would flip
// sx textAlign:right → left). Numbers in Arabic accounting hug the physical right edge.
function AmountCell({ value, highlight }) {
  const numColor = highlight === "debit" ? "#17c1e8" : highlight === "credit" ? "#82d616" : "#344767";
  if (!value || Math.abs(value) < 0.0001) {
    return (
      <TableCell style={{ textAlign: "right" }} sx={{ color: "#c8d0d8", fontSize: 11, py: 0.7 }}>
        —
      </TableCell>
    );
  }
  return (
    <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 11, fontWeight: 600, py: 0.7, color: numColor }}>
      {fmt(value)}
    </TableCell>
  );
}

// ─── SummaryChip ─────────────────────────────────────────────────────────────
function SummaryChip({ label, value, color }) {
  return (
    <SoftBox sx={{ background: "#fff", border: `1.5px solid ${color || "#eee"}`, borderRadius: 2, px: 1.5, py: 0.8, minWidth: 130, textAlign: "center" }}>
      <SoftTypography variant="caption" color="secondary" display="block" sx={{ fontSize: 10, mb: 0.2 }}>{label}</SoftTypography>
      <SoftTypography variant="button" fontWeight="bold" sx={{ color: color || "#344767", fontSize: 12 }}>{value}</SoftTypography>
    </SoftBox>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TrialBalance() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter State (synced with URL) ──
  const [fyId,          setFyId]          = useState(() => Number(searchParams.get("fy")) || null);
  const [dateFrom,      setDateFrom]      = useState(() => searchParams.get("from") || "");
  const [dateTo,        setDateTo]        = useState(() => searchParams.get("to")   || "");
  const [accountType,   setAccountType]   = useState(() => searchParams.get("type") || "all");
  const [searchText,    setSearchText]    = useState("");
  const [selectedLevel, setSelectedLevel] = useState(3);
  const [showFilters,   setShowFilters]   = useState(true);
  const [fiscalYears,   setFiscalYears]   = useState([]);
  const [apiRows,       setApiRows]       = useState([]);

  // Column visibility
  const [colOpening,  setColOpening]  = useState(true);
  const [colPeriod,   setColPeriod]   = useState(true);
  const [colCurrent,  setColCurrent]  = useState(true);
  const [colNet,      setColNet]      = useState(true);

  // Row visibility
  const [showZero,    setShowZero]    = useState(false);
  const [showInactive,setShowInactive]= useState(false);

  const activeFY = fiscalYears.find((y) => y.id === fyId) ?? null;

  // Sync FY → dates
  const handleFyChange = (id) => {
    const fy = fiscalYears.find((y) => y.id === id);
    setFyId(id);
    if (fy) { setDateFrom(fy.startDate); setDateTo(fy.endDate); }
  };

  const handleReset = () => {
    const first = fiscalYears[0];
    if (first) handleFyChange(first.id);
    setAccountType("all");
    setSearchText("");
    setSelectedLevel(3);
    setShowZero(false);
    setShowInactive(false);
    setColOpening(true); setColPeriod(true); setColCurrent(true); setColNet(true);
  };

  // Load fiscal years once
  useEffect(() => {
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active && !fyId) {
          setFyId(active.id);
          setDateFrom(active.startDate ?? "");
          setDateTo(active.endDate ?? "");
        }
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load trial balance when fyId changes
  useEffect(() => {
    if (!fyId) return;
    accountingApi.trialBalance(fyId)
      .then((r) => {
        const rows = (r.data?.rows ?? r.data ?? []).map((row, idx) => ({
          id: row.accountCode ?? String(idx),
          code: row.accountCode,
          nameAr: row.accountName,
          classification: row.classification,
          level: Number(row.level ?? 1),
          isActive: true,
          hasChildren: false,
          before_debit:  Number(row.openingDebit  ?? 0),
          before_credit: Number(row.openingCredit ?? 0),
          debit:         Number(row.periodDebit   ?? 0),
          credit:        Number(row.periodCredit  ?? 0),
          after_debit:   Number(row.closingDebit  ?? 0),
          after_credit:  Number(row.closingCredit ?? 0),
          net_balance:   Number(row.closingDebit ?? 0) - Number(row.closingCredit ?? 0),
        }));
        setApiRows(rows);
      })
      .catch(console.error);
  }, [fyId]);

  const allRows = apiRows;

  // ── Filter rows ──
  const filteredIds = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const matched = new Set();

    const addParents = (row) => {
      if (matched.has(row.id)) return;
      matched.add(row.id);
      const parent = allRows.find((r) => r.level === row.level - 1 && row.code.startsWith(r.code));
      if (parent) addParents(parent);
    };

    allRows.forEach((row) => {
      const passType   = accountType === "all" || row.classification === accountType;
      const passActive = showInactive || row.isActive;
      const passSearch = !q || row.code.toLowerCase().includes(q) || row.nameAr.toLowerCase().includes(q);
      const passZero   = showZero || !isZero(row);
      const passLevel  = row.level <= selectedLevel;

      if (passType && passActive && passSearch && passZero && passLevel) addParents(row);
    });
    return matched;
  }, [allRows, accountType, searchText, showZero, showInactive, selectedLevel]);

  const displayRows = useMemo(
    () => allRows.filter((r) => filteredIds.has(r.id) && r.level <= selectedLevel),
    [allRows, filteredIds, selectedLevel]
  );

  // ── Totals (leaf/terminal rows only) ──
  const totals = useMemo(() => {
    const leaf = displayRows.filter((r) => !r.hasChildren || r.level === selectedLevel);
    return leaf.reduce((acc, r) => ({
      before_debit:  acc.before_debit  + r.before_debit,
      before_credit: acc.before_credit + r.before_credit,
      debit:         acc.debit         + r.debit,
      credit:        acc.credit        + r.credit,
      after_debit:   acc.after_debit   + r.after_debit,
      after_credit:  acc.after_credit  + r.after_credit,
    }), { before_debit: 0, before_credit: 0, debit: 0, credit: 0, after_debit: 0, after_credit: 0 });
  }, [displayRows, selectedLevel]);

  const periodImbalance = Math.abs(totals.debit - totals.credit);
  const currentImbalance = Math.abs(totals.after_debit - totals.after_credit);
  const hasImbalance = periodImbalance > 0.01;

  // ── CSV export ──
  const handleExportCSV = useCallback(() => {
    const cols = [
      { label: "الكود", key: "code" },
      { label: "اسم الحساب", key: "nameAr" },
      { label: "التصنيف", key: "classification" },
      ...(colOpening ? [{ label: "رصيد سابق م", key: "before_debit" }, { label: "رصيد سابق د", key: "before_credit" }] : []),
      ...(colPeriod  ? [{ label: "حركة الفترة م", key: "debit" }, { label: "حركة الفترة د", key: "credit" }] : []),
      ...(colCurrent ? [{ label: "الرصيد الحالي م", key: "after_debit" }, { label: "الرصيد الحالي د", key: "after_credit" }] : []),
      ...(colNet     ? [{ label: "الرصيد الصافي", key: "net_balance" }] : []),
    ];
    downloadCSV(displayRows, cols);
  }, [displayRows, colOpening, colPeriod, colCurrent, colNet]);

  // ── Print ──
  const handlePrint = () => window.print();

  // ── Row click → Account Movement ──
  const handleRowClick = (row) => {
    navigate(`/accounting/reports/account-movement?account=${row.id}&from=${dateFrom}&to=${dateTo}`);
  };

  // ── Column count for colSpan ──
  const colCount = 2 + (colOpening ? 2 : 0) + (colPeriod ? 2 : 0) + (colCurrent ? 2 : 0) + (colNet ? 1 : 0);

  // ── Common cell styles ──
  const headCell = { py: 1, fontSize: 10, fontWeight: 800, color: "#8392ab", letterSpacing: 0.3, whiteSpace: "nowrap", overflow: "hidden" };
  const bodyCell = { py: 0.7, fontSize: 11, overflow: "hidden" };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-header { display: block !important; }
          * { font-size: 10px !important; }
          .MuiTableCell-root { padding: 3px 6px !important; }
        }
        @media screen {
          .print-header { display: none; }
        }
      `}</style>

      <SoftBox py={3}>

        {/* ── Print Header (hidden on screen) ── */}
        <SoftBox className="print-header" mb={2} p={2} sx={{ border: "1px solid #ccc", borderRadius: 1 }}>
          <SoftTypography variant="h5" fontWeight="bold" textAlign="center">ميزان المراجعة</SoftTypography>
          <SoftTypography variant="caption" display="block" textAlign="center">
            {activeFY.name} · من {dateFrom} إلى {dateTo}
          </SoftTypography>
          <SoftTypography variant="caption" display="block" textAlign="center" color="secondary">
            تاريخ الطباعة: {new Date().toLocaleDateString("ar-DZ")}
          </SoftTypography>
        </SoftBox>

        {/* ── Page header ── */}
        <SoftBox className="no-print" display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1}>
              <AccountTreeIcon sx={{ color: "#17c1e8", fontSize: 22 }} />
              <SoftTypography variant="h5" fontWeight="bold">ميزان المراجعة</SoftTypography>
            </SoftBox>
            <SoftTypography variant="caption" color="secondary">
              {activeFY.name} · {dateFrom} → {dateTo}
              {activeFY.isClosed && " 🔒"}
            </SoftTypography>
          </SoftBox>

          {/* Actions */}
          <SoftBox display="flex" gap={1} flexWrap="wrap" alignItems="center">
            <Tooltip title="تصدير CSV (Excel)">
              <SoftButton size="small" variant="outlined" color="secondary" onClick={handleExportCSV}>
                <DownloadIcon sx={{ fontSize: 16, mr: 0.5 }} /> CSV
              </SoftButton>
            </Tooltip>
            <Tooltip title="طباعة">
              <SoftButton size="small" variant="outlined" color="secondary" onClick={handlePrint}>
                <PrintIcon sx={{ fontSize: 16, mr: 0.5 }} /> طباعة
              </SoftButton>
            </Tooltip>
            <Tooltip title={showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر"}>
              <IconButton size="small" onClick={() => setShowFilters((p) => !p)} sx={{ border: "1px solid #eee" }}>
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </SoftBox>
        </SoftBox>

        {/* ── Imbalance Alert ── */}
        {hasImbalance && (
          <Alert
            severity="warning"
            className="no-print"
            icon={<WarningAmberIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            <strong>تحذير محاسبي:</strong> حركة الفترة غير متوازنة —
            مجموع المدين <strong>{fmt(totals.debit)}</strong> ≠ مجموع الدائن <strong>{fmt(totals.credit)}</strong>.
            الفرق: <strong>{fmt(periodImbalance)}</strong> دج.
            راجع القيود المرحّلة.
          </Alert>
        )}

        {/* ── Filters Panel ── */}
        <Collapse in={showFilters} className="no-print">
          <Card sx={{ mb: 2, p: 2.5 }}>
            {/* Row 1: FY + dates + type */}
            <SoftBox display="flex" gap={2} flexWrap="wrap" mb={2}>
              <FormControl size="small" sx={{ minWidth: 175 }}>
                <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">السنة المالية</SoftTypography>
                <Select value={fyId} onChange={(e) => handleFyChange(e.target.value)}>
                  {fiscalYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>{y.name} {y.isClosed ? "🔒" : ""}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <SoftBox>
                <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">من تاريخ</SoftTypography>
                <TextField size="small" type="date" value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
              </SoftBox>

              <SoftBox>
                <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">إلى تاريخ</SoftTypography>
                <TextField size="small" type="date" value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
              </SoftBox>

              <FormControl size="small" sx={{ minWidth: 155 }}>
                <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">نوع الحسابات</SoftTypography>
                <Select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                  {ACCOUNT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>

              <SoftBox flex={1} minWidth={200}>
                <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">بحث</SoftTypography>
                <TextField
                  fullWidth size="small" placeholder="كود الحساب أو الاسم..."
                  value={searchText} onChange={(e) => setSearchText(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: "#8392ab" }} /></InputAdornment>,
                  }}
                />
              </SoftBox>

              <SoftBox display="flex" alignItems="flex-end">
                <Tooltip title="إعادة تعيين الفلاتر">
                  <IconButton onClick={handleReset} sx={{ border: "1px solid #eee", borderRadius: 1.5 }}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SoftBox>
            </SoftBox>

            {/* Row 2: Checkboxes */}
            <Divider sx={{ mb: 1.5 }} />
            <SoftBox display="flex" gap={0} flexWrap="wrap" rowGap={0}>
              <SoftBox sx={{ minWidth: 200 }}>
                <SoftTypography variant="caption" color="secondary" mb={0.5} display="block" fontWeight="bold">عرض الأعمدة</SoftTypography>
                {[
                  [colOpening,  setColOpening,  "الرصيد السابق (م/د)"],
                  [colPeriod,   setColPeriod,   "حركة الفترة (م/د)"],
                  [colCurrent,  setColCurrent,  "الرصيد الحالي (م/د)"],
                  [colNet,      setColNet,      "الرصيد الصافي"],
                ].map(([val, set, label]) => (
                  <FormControlLabel key={label} control={<Checkbox size="small" checked={val} onChange={(e) => set(e.target.checked)} />}
                    label={<SoftTypography variant="caption">{label}</SoftTypography>} sx={{ m: 0, mr: 2 }} />
                ))}
              </SoftBox>

              <SoftBox sx={{ minWidth: 180 }}>
                <SoftTypography variant="caption" color="secondary" mb={0.5} display="block" fontWeight="bold">عرض الصفوف</SoftTypography>
                <FormControlLabel control={<Checkbox size="small" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} />}
                  label={<SoftTypography variant="caption">الحسابات الصفرية</SoftTypography>} sx={{ m: 0, mr: 2 }} />
                <FormControlLabel control={<Checkbox size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
                  label={<SoftTypography variant="caption">الحسابات غير النشطة</SoftTypography>} sx={{ m: 0 }} />
              </SoftBox>

              {/* Level selector */}
              <SoftBox>
                <SoftTypography variant="caption" color="secondary" mb={0.5} display="block" fontWeight="bold">مستوى العرض</SoftTypography>
                <ToggleButtonGroup size="small" exclusive value={selectedLevel} onChange={(_, v) => v && setSelectedLevel(v)}>
                  {[1, 2, 3, 4, 5, 6].map((l) => (
                    <ToggleButton key={l} value={l} sx={{ minWidth: 34, fontWeight: 700, fontSize: 12 }}>م{l}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <SoftTypography variant="caption" color="secondary" display="block" mt={0.5} sx={{ fontSize: 10 }}>
                  عرض هرمي حتى المستوى {selectedLevel}
                </SoftTypography>
              </SoftBox>
            </SoftBox>
          </Card>
        </Collapse>

        {/* ── Summary Chips ── */}
        <SoftBox className="no-print" display="flex" gap={1.5} mb={2} flexWrap="wrap" alignItems="stretch">
          <SummaryChip label="الصفوف المعروضة" value={displayRows.length} color="#344767" />
          <SummaryChip label="حركة الفترة م" value={fmt(totals.debit)}  color="#17c1e8" />
          <SummaryChip label="حركة الفترة د" value={fmt(totals.credit)} color="#82d616" />
          <SummaryChip label="الرصيد الحالي م" value={fmt(totals.after_debit)}  color="#17c1e8" />
          <SummaryChip label="الرصيد الحالي د" value={fmt(totals.after_credit)} color="#82d616" />
          <SummaryChip
            label="التوازن المحاسبي"
            value={hasImbalance ? `⚠ فرق ${fmt(periodImbalance)}` : "✅ متوازن"}
            color={hasImbalance ? "#ea0606" : "#82d616"}
          />
        </SoftBox>

        {/* ── Legend ── */}
        <SoftBox className="no-print" display="flex" gap={1} mb={1.5} flexWrap="wrap" alignItems="center">
          <SoftTypography variant="caption" color="secondary">الرموز:</SoftTypography>
          <Chip size="small" label="مجمع" variant="outlined" sx={{ height: 20, fontSize: 10, borderColor: "#17c1e8", color: "#17c1e8" }} />
          <Chip size="small" label="ترحيل" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          <Chip size="small" label="رقابي" variant="outlined" sx={{ height: 20, fontSize: 10, borderColor: "#fb8c00", color: "#fb8c00" }} />
          <SoftTypography variant="caption" color="secondary" sx={{ mx: 1 }}>|</SoftTypography>
          <SoftTypography variant="caption" color="secondary">النقطة الملونة = مستوى الحساب</SoftTypography>
          <SoftTypography variant="caption" color="secondary" sx={{ mx: 1 }}>|</SoftTypography>
          <SoftTypography variant="caption" color="secondary">اضغط على صف لعرض حركة الحساب</SoftTypography>
        </SoftBox>

        {/* ── Table ── */}
        <Card>
          {/*
            stickyHeader is intentionally NOT used here.
            MUI stickyHeader sets top:0 on every <th> regardless of row,
            which breaks multi-row headers. We use a single header row instead
            and make the TableHead sticky via sx so header+body columns always align.
          */}
          <TableContainer sx={{ maxHeight: 580, overflow: "auto" }}>
            <Table size="small" sx={{ tableLayout: "fixed", minWidth: colCount * 110 + 290 }}>
              {/* ── Header — single row, group label shown as sub-text ── */}
              <TableHead sx={{ "& th": { position: "sticky", top: 0, zIndex: 2 } }}>
                <TableRow>
                  <TableCell sx={{ ...headCell, background: "#f8f9fa", width: 70 }}>كود</TableCell>
                  <TableCell sx={{ ...headCell, background: "#f8f9fa", width: 240 }}>اسم الحساب</TableCell>
                  {colOpening && <>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#e3f8fd", width: 110, borderTop: "3px solid #b2ebf9" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>الرصيد السابق</Box>
                      <Box sx={{ color: "#17c1e8" }}>مدين</Box>
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#e3f8fd", width: 110, borderTop: "3px solid #b2ebf9" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>الرصيد السابق</Box>
                      <Box sx={{ color: "#82d616" }}>دائن</Box>
                    </TableCell>
                  </>}
                  {colPeriod && <>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#f0fde4", width: 110, borderTop: "3px solid #c5f5a0" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>حركة الفترة</Box>
                      <Box sx={{ color: "#17c1e8" }}>مدين</Box>
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#f0fde4", width: 110, borderTop: "3px solid #c5f5a0" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>حركة الفترة</Box>
                      <Box sx={{ color: "#82d616" }}>دائن</Box>
                    </TableCell>
                  </>}
                  {colCurrent && <>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#f0f4ff", width: 110, borderTop: "3px solid #c5d0ff" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>الرصيد الحالي</Box>
                      <Box sx={{ color: "#17c1e8" }}>مدين</Box>
                    </TableCell>
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#f0f4ff", width: 110, borderTop: "3px solid #c5d0ff" }}>
                      <Box sx={{ color: "#8392ab", fontSize: 9, fontWeight: 400, lineHeight: 1 }}>الرصيد الحالي</Box>
                      <Box sx={{ color: "#82d616" }}>دائن</Box>
                    </TableCell>
                  </>}
                  {colNet && (
                    <TableCell style={{ textAlign: "right" }} sx={{ ...headCell, background: "#fff3e0", width: 120, borderTop: "3px solid #ffe0b2" }}>
                      الرصيد الصافي
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              {/* ── Body ── */}
              <TableBody>
                {displayRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colCount} sx={{ textAlign: "center", py: 5, color: "#8392ab" }}>
                      <AccountTreeIcon sx={{ fontSize: 36, opacity: 0.2, display: "block", mx: "auto", mb: 1 }} />
                      لا توجد بيانات تطابق الفلاتر المختارة
                    </TableCell>
                  </TableRow>
                ) : displayRows.map((row) => {
                  const levelIdx = Math.max(0, (row.level - 1) % 6);
                  const dotColor = LEVEL_COLORS[levelIdx];
                  const rowBg    = row.level === 1 ? LEVEL_BG[0] : row.isParent ? LEVEL_BG[levelIdx] : "transparent";
                  const indent   = Math.max(0, row.depth) * 18;
                  const cls      = classificationLabels[row.classification];
                  const netPositive = row.net_balance >= 0;

                  return (
                    <TableRow
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      sx={{
                        background: rowBg,
                        cursor: "pointer",
                        transition: "background .1s",
                        "&:hover": { background: `${LEVEL_COLORS[levelIdx]}18` },
                        borderRight: row.level === 1 ? `3px solid ${dotColor}` : "3px solid transparent",
                        opacity: row.isActive ? 1 : 0.55,
                      }}
                    >
                      {/* Code */}
                      <TableCell sx={{ ...bodyCell, fontWeight: row.isParent ? 800 : 500, fontFamily: "monospace", color: dotColor }}>
                        {row.code}
                      </TableCell>

                      {/* Name */}
                      <TableCell sx={{ ...bodyCell, maxWidth: 280 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, paddingInlineStart: `${indent}px` }}>
                          {/* hierarchy connector */}
                          {row.depth > 0 && (
                            <Box sx={{ width: 10, borderTop: "1.5px dashed #ccc", flexShrink: 0, opacity: .6 }} />
                          )}
                          {/* level dot */}
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                          {/* name — flex:1 + minWidth:0 ensures it gets space and truncates before badges */}
                          <SoftTypography
                            variant="caption"
                            fontWeight={row.isParent ? "bold" : "regular"}
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: row.isActive ? "#344767" : "#adb5bd",
                              textDecoration: row.isActive ? "none" : "line-through",
                            }}
                          >
                            {row.nameAr}
                          </SoftTypography>
                          {/* Badges — only most relevant, flexShrink:0 so they never disappear */}
                          <Chip label={`م${row.level}`} size="small" variant="outlined"
                            sx={{ height: 15, fontSize: 9, px: 0.2, flexShrink: 0, borderColor: dotColor, color: dotColor }} />
                          {row.isParent && (
                            <Chip label="مجمع" size="small" variant="outlined"
                              sx={{ height: 15, fontSize: 9, flexShrink: 0, borderColor: "#17c1e8", color: "#17c1e8" }} />
                          )}
                          {row.isControl && (
                            <Chip label="رقابي" size="small" variant="outlined"
                              sx={{ height: 15, fontSize: 9, flexShrink: 0, borderColor: "#fb8c00", color: "#fb8c00" }} />
                          )}
                        </Box>
                      </TableCell>

                      {/* Opening */}
                      {colOpening && <>
                        <AmountCell value={row.before_debit}  highlight="debit" />
                        <AmountCell value={row.before_credit} highlight="credit" />
                      </>}

                      {/* Period */}
                      {colPeriod && <>
                        <AmountCell value={row.debit}  highlight="debit" />
                        <AmountCell value={row.credit} highlight="credit" />
                      </>}

                      {/* Current */}
                      {colCurrent && <>
                        <AmountCell value={row.after_debit}  highlight="debit" />
                        <AmountCell value={row.after_credit} highlight="credit" />
                      </>}

                      {/* Net */}
                      {colNet && (
                        <TableCell style={{ textAlign: "right" }} sx={{
                          ...bodyCell, fontWeight: 800,
                          color: isZero(row) ? "#c8d0d8" : netPositive ? "#82d616" : "#fb8c00"
                        }}>
                          {isZero(row) ? "—" : (
                            <>
                              {fmt(Math.abs(row.net_balance))}
                              <Box component="span" sx={{ display: "inline-block", ml: 0.5, fontSize: 9, fontWeight: 600, px: 0.5, py: 0.1, borderRadius: 0.5,
                                background: netPositive ? "#f0fde4" : "#fff3e0", color: netPositive ? "#82d616" : "#fb8c00" }}>
                                {netPositive ? "م" : "د"}
                              </Box>
                            </>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {/* ── Totals Row ── */}
                {displayRows.length > 0 && (
                  <TableRow sx={{ background: "#e8f4fd", borderTop: "2px solid #17c1e8", position: "sticky", bottom: 0, zIndex: 1 }}>
                    <TableCell colSpan={2} sx={{ ...bodyCell, fontWeight: 800 }}>
                      <SoftTypography variant="button" fontWeight="bold">الإجماليات</SoftTypography>
                    </TableCell>
                    {colOpening && <>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#17c1e8" }}>{fmt(totals.before_debit)}</TableCell>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#82d616" }}>{fmt(totals.before_credit)}</TableCell>
                    </>}
                    {colPeriod && <>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#17c1e8" }}>{fmt(totals.debit)}</TableCell>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#82d616" }}>{fmt(totals.credit)}</TableCell>
                    </>}
                    {colCurrent && <>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#17c1e8" }}>{fmt(totals.after_debit)}</TableCell>
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: "#82d616" }}>{fmt(totals.after_credit)}</TableCell>
                    </>}
                    {colNet && (
                      <TableCell style={{ textAlign: "right" }} sx={{ ...bodyCell, fontWeight: 800, color: hasImbalance ? "#ea0606" : "#344767" }}>
                        {hasImbalance ? `⚠ ${fmt(currentImbalance)}` : "✅ متوازن"}
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Footer info ── */}
          <SoftBox className="no-print" px={2} py={1} borderTop="1px solid #eee" display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <SoftTypography variant="caption" color="secondary">
              {displayRows.length} صف · القيود المرحّلة فقط · لا تشمل المسودات
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              اضغط على أي صف لعرض حركة الحساب بنفس الفترة
            </SoftTypography>
          </SoftBox>
        </Card>

      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
