/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GroupIcon from "@mui/icons-material/Group";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LinkIcon from "@mui/icons-material/Link";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 0 }).format(n ?? 0) + " دج";

// ─── Sub-components ───────────────────────────────────────────────────────────
function BalanceCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <Card
      sx={{ cursor: onClick ? "pointer" : "default", "&:hover": onClick ? { boxShadow: 4 } : {} }}
      onClick={onClick}
    >
      <SoftBox p={2.5} display="flex" alignItems="center" gap={2}>
        <SoftBox
          sx={{
            width: 48, height: 48, borderRadius: "12px",
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Icon sx={{ color, fontSize: 24 }} />
        </SoftBox>
        <SoftBox flex={1} minWidth={0}>
          <SoftTypography variant="caption" color="secondary" display="block" noWrap>
            {label}
          </SoftTypography>
          <SoftTypography variant="h6" fontWeight="bold" noWrap>
            {fmt(value)}
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

function AlertRow({ type, msg, route, navigate }) {
  const cfg = {
    warning: { color: "#fb8c00", bg: "#fff8e1", Icon: WarningAmberIcon },
    error:   { color: "#ea0606", bg: "#ffeaea", Icon: ErrorOutlineIcon },
    info:    { color: "#17c1e8", bg: "#e3f8fd", Icon: CheckCircleOutlineIcon },
  }[type];

  return (
    <SoftBox
      display="flex" alignItems="center" justifyContent="space-between"
      px={2} py={1.2}
      sx={{ background: cfg.bg, borderRadius: "8px", mb: 1, cursor: route ? "pointer" : "default" }}
      onClick={() => route && navigate(route)}
    >
      <SoftBox display="flex" alignItems="center" gap={1.5}>
        <cfg.Icon sx={{ color: cfg.color, fontSize: 18 }} />
        <SoftTypography variant="caption" fontWeight="medium" color="text">
          {msg}
        </SoftTypography>
      </SoftBox>
      {route && <ArrowForwardIcon sx={{ color: cfg.color, fontSize: 16 }} />}
    </SoftBox>
  );
}

function ShortcutCard({ icon: Icon, label, route, navigate }) {
  return (
    <Card
      sx={{ cursor: "pointer", "&:hover": { boxShadow: 4 } }}
      onClick={() => navigate(route)}
    >
      <SoftBox p={2} display="flex" flexDirection="column" alignItems="center" gap={1}>
        <SoftBox
          sx={{
            width: 44, height: 44, borderRadius: "12px",
            background: "linear-gradient(195deg,#42424a,#191919)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 22 }} />
        </SoftBox>
        <SoftTypography variant="caption" fontWeight="medium" color="text" textAlign="center">
          {label}
        </SoftTypography>
      </SoftBox>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AccountingDashboard() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const appendError = (error, fallback) => {
      setPageError((current) => {
        const message = getApiErrorMessage(error, fallback);
        return current ? `${current}؛ ${message}` : message;
      });
    };
    setPageError("");
    accountingApi.listAccounts()
      .then((r) => setAccounts(r.data?.content ?? r.data ?? []))
      .catch((error) => {
        appendError(error, "تعذر تحميل الحسابات");
        setAccounts([]);
      });
    accountingApi.listJournals()
      .then((r) => setJournals(r.data?.content ?? r.data ?? []))
      .catch((error) => {
        appendError(error, "تعذر تحميل القيود");
        setJournals([]);
      });
    accountingApi.listFiscalYears()
      .then((r) => setFiscalYears(r.data?.content ?? r.data ?? []))
      .catch((error) => {
        appendError(error, "تعذر تحميل السنوات المالية");
        setFiscalYears([]);
      });
  }, []);

  const getBalance = (code) => Number(accounts.find((a) => a.code === code)?.balance ?? 0);

  const cashBalance    = getBalance("141");
  const bankBalance    = getBalance("142");
  const customersDebt  = getBalance("131");
  const suppliersDebt  = getBalance("221");
  const inventoryValue = getBalance("121");
  const revenueTotal   = getBalance("411");
  const cogsTotal      = getBalance("511");
  const grossProfit    = revenueTotal - cogsTotal;

  const draftJournals = journals.filter((j) => j.status === "draft");
  const activeFY      = fiscalYears.find((fy) => !fy.closed);

  const alerts = [
    ...(draftJournals.length > 0
      ? [{ type: "warning", msg: `${draftJournals.length} قيد في حالة مسودة — لم يُرحَّل بعد`, route: "/accounting/journals" }]
      : []),
    ...(activeFY
      ? [{ type: "info", msg: `السنة المالية النشطة: ${activeFY.name}`, route: "/accounting/fiscal-years" }]
      : [{ type: "error", msg: "لا توجد سنة مالية مفتوحة — تحقق من السنوات المالية", route: "/accounting/fiscal-years" }]),
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Header ── */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">لوحة المحاسبة</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              نظرة عامة على الوضع المالي — {activeFY?.name ?? "لا توجد سنة مالية مفتوحة"}
            </SoftTypography>
          </SoftBox>
          <SoftButton
            variant="gradient" color="dark" size="small"
            startIcon={<AddIcon />}
            onClick={() => navigate("/accounting/journals/new")}
          >
            قيد جديد
          </SoftButton>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <Grid container spacing={2.5}>

          {/* ── Column 1: Balance cards (left 8/12) ── */}
          <Grid item xs={12} lg={8}>

            {/* Row 1: Cash / Bank / Customers / Suppliers */}
            <Grid container spacing={2} mb={2}>
              {[
                { icon: AccountBalanceWalletIcon, label: "الصندوق",          value: cashBalance,   color: "#82d616" },
                { icon: AccountBalanceIcon,       label: "الحساب البنكي",     value: bankBalance,   color: "#17c1e8" },
                { icon: GroupIcon,                label: "ذمم العملاء",       value: customersDebt, color: "#3a416f" },
                { icon: PointOfSaleIcon,          label: "ذمم الموردين",      value: suppliersDebt, color: "#fb8c00" },
              ].map((c) => (
                <Grid item xs={12} sm={6} key={c.label}>
                  <BalanceCard {...c} onClick={() => navigate("/accounting/reports/trial-balance")} />
                </Grid>
              ))}
            </Grid>

            {/* Row 2: Inventory / Revenue / COGS / Gross Profit */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon: Inventory2Icon,   label: "قيمة المخزون",       value: inventoryValue, color: "#7928ca" },
                { icon: TrendingUpIcon,   label: "إيرادات المبيعات",   value: revenueTotal,   color: "#82d616" },
                { icon: TrendingDownIcon, label: "تكلفة البضاعة",      value: cogsTotal,      color: "#ea0606" },
                {
                  icon: TrendingUpIcon,
                  label: "إجمالي الربح",
                  value: grossProfit,
                  color: grossProfit >= 0 ? "#82d616" : "#ea0606",
                },
              ].map((c) => (
                <Grid item xs={12} sm={6} key={c.label}>
                  <BalanceCard {...c} />
                </Grid>
              ))}
            </Grid>

            {/* Recent Journals */}
            <Card>
              <SoftBox p={2.5}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <SoftTypography variant="h6" fontWeight="bold">آخر القيود</SoftTypography>
                  <SoftButton
                    variant="text" color="info" size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate("/accounting/journals")}
                  >
                    عرض الكل
                  </SoftButton>
                </SoftBox>

                {journals.slice(0, 5).map((j, idx) => {
                  const stCfg = {
                    draft:    { label: "مسودة",  bg: "#fff3e0", color: "#fb8c00" },
                    posted:   { label: "مرحّل",  bg: "#f0fde4", color: "#82d616" },
                    reversed: { label: "معكوس",  bg: "#f8f9fa", color: "#8392ab" },
                  }[j.status] ?? {};

                  return (
                    <SoftBox key={j.id}>
                      {idx > 0 && <Divider sx={{ my: 1 }} />}
                      <SoftBox display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                        <SoftBox display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
                          <SoftBox
                            sx={{
                              width: 36, height: 36, borderRadius: "10px",
                              background: "#f8f9fa",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}
                          >
                            <AssignmentIcon sx={{ color: "#8392ab", fontSize: 18 }} />
                          </SoftBox>
                          <SoftBox minWidth={0}>
                            <SoftTypography variant="button" fontWeight="medium" display="block" noWrap>
                              {j.number}
                            </SoftTypography>
                            <SoftTypography variant="caption" color="secondary" noWrap>
                              {j.description} — {j.date}
                            </SoftTypography>
                          </SoftBox>
                        </SoftBox>
                        <SoftBox display="flex" alignItems="center" gap={1.5} flexShrink={0}>
                          <SoftTypography variant="caption" fontWeight="medium" color="text">
                            {fmt(j.totalDebit)}
                          </SoftTypography>
                          <Chip
                            label={stCfg.label} size="small"
                            sx={{ background: stCfg.bg, color: stCfg.color, fontWeight: 600, fontSize: 10 }}
                          />
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>
                  );
                })}
              </SoftBox>
            </Card>
          </Grid>

          {/* ── Column 2: Alerts + Shortcuts (right 4/12) ── */}
          <Grid item xs={12} lg={4}>

            {/* Alerts */}
            <Card sx={{ mb: 2.5 }}>
              <SoftBox p={2.5}>
                <SoftTypography variant="h6" fontWeight="bold" mb={1.5}>
                  تنبيهات وإشعارات
                </SoftTypography>
                {alerts.length === 0 ? (
                  <SoftBox display="flex" alignItems="center" gap={1} p={1.5}
                    sx={{ background: "#f0fde4", borderRadius: "8px" }}>
                    <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 18 }} />
                    <SoftTypography variant="caption" fontWeight="medium">كل شيء على ما يرام</SoftTypography>
                  </SoftBox>
                ) : (
                  alerts.map((a, i) => (
                    <AlertRow key={i} {...a} navigate={navigate} />
                  ))
                )}
              </SoftBox>
            </Card>

            {/* Shortcuts */}
            <Card sx={{ mb: 2.5 }}>
              <SoftBox p={2.5}>
                <SoftTypography variant="h6" fontWeight="bold" mb={1.5}>
                  اختصارات سريعة
                </SoftTypography>
                <Grid container spacing={1.5}>
                  {[
                    { icon: AddIcon,            label: "قيد جديد",          route: "/accounting/journals/new" },
                    { icon: LinkIcon,            label: "ربط الحسابات",      route: "/accounting/account-links" },
                    { icon: AssignmentIcon,      label: "الأرصدة الافتتاحية", route: "/accounting/opening-balances" },
                    { icon: AccountBalanceIcon,  label: "شجرة الحسابات",     route: "/accounting/accounts-tree" },
                    { icon: PendingActionsIcon,  label: "السنوات المالية",   route: "/accounting/fiscal-years" },
                    { icon: TrendingUpIcon,      label: "ميزان المراجعة",    route: "/accounting/reports/trial-balance" },
                  ].map((s) => (
                    <Grid item xs={4} key={s.label}>
                      <ShortcutCard {...s} navigate={navigate} />
                    </Grid>
                  ))}
                </Grid>
              </SoftBox>
            </Card>

            {/* Account Links Summary */}
            <Card>
              <SoftBox p={2.5}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <SoftTypography variant="h6" fontWeight="bold">ربط الحسابات</SoftTypography>
                  <Tooltip title="إعدادات المحاسبة">
                    <IconButton size="small" onClick={() => navigate("/accounting/account-links")}>
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </SoftBox>

                <SoftBox py={1}>
                  <SoftTypography variant="caption" color="secondary">
                    ربط الحسابات يُدار من صفحة إعدادات ربط الحسابات
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>

          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
