/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import SearchIcon from "@mui/icons-material/Search";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import InventoryIcon from "@mui/icons-material/Inventory";
import LoginIcon from "@mui/icons-material/Login";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FilterListIcon from "@mui/icons-material/FilterList";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReplyIcon from "@mui/icons-material/Reply";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { auditLogsApi } from "services";

const actionConfig = {
  create_order:   { label: "إنشاء طلبية",     color: "#17c1e8", Icon: AddShoppingCartIcon },
  submit_order:   { label: "إرسال طلبية",     color: "#17c1e8", Icon: AddShoppingCartIcon },
  confirm_order:  { label: "تأكيد طلبية",     color: "#66BB6A", Icon: CheckCircleIcon },
  complete_order: { label: "إنجاز طلبية",     color: "#344767", Icon: AssignmentTurnedInIcon },
  reject_order:   { label: "رفض طلبية",       color: "#ea0606", Icon: CancelIcon },
  cancel_order:   { label: "إلغاء طلبية",     color: "#ea0606", Icon: CancelIcon },
  modify_qty:     { label: "تعديل كمية",      color: "#fb8c00", Icon: EditIcon },
  cancel_line:    { label: "إلغاء سطر",       color: "#ea0606", Icon: CancelIcon },
  delete_line:    { label: "حذف سطر",         color: "#ea0606", Icon: DeleteIcon },
  add_customer:   { label: "إضافة زبون",      color: "#82d616", Icon: PersonAddIcon },
  update_product: { label: "تعديل صنف",       color: "#fb8c00", Icon: InventoryIcon },
  product_price_changed: { label: "تغيير سعر", color: "#fb8c00", Icon: PriceChangeIcon },
  ship_order:     { label: "شحن طلبية",       color: "#17c1e8", Icon: LocalShippingIcon },
  create_return:  { label: "إنشاء مرتجع",     color: "#ea0606", Icon: AssignmentReturnIcon },
  inventory_adjustment: { label: "تسوية مخزون", color: "#fb8c00", Icon: InventoryIcon },
  stock_transfer: { label: "تحويل مخزون",     color: "#17c1e8", Icon: SwapHorizIcon },
  customer_payment_received: { label: "استلام دفعة", color: "#66BB6A", Icon: PaymentsIcon },
  customer_payment_refund:   { label: "دفعة عكسية",  color: "#ea0606", Icon: ReplyIcon },
  supplier_payment_paid:     { label: "دفع لمورد",   color: "#344767", Icon: PaymentsIcon },
  user_permission_changed: { label: "تعديل صلاحيات", color: "#7928ca", Icon: ManageAccountsIcon },
  settings_changed: { label: "تعديل إعدادات", color: "#344767", Icon: SettingsApplicationsIcon },
  failed_login:   { label: "فشل دخول",        color: "#ea0606", Icon: WarningAmberIcon },
  data_exported:  { label: "تصدير بيانات",    color: "#8392ab", Icon: FileDownloadIcon },
  ai_process:     { label: "معالجة AI",       color: "#7928ca", Icon: AutoAwesomeIcon },
  login:          { label: "تسجيل دخول",      color: "#8392ab", Icon: LoginIcon },
};

const roleColors = {
  "بائع":   "#17c1e8",
  "إدارة":  "#82d616",
  "مالك":   "#7928ca",
  "نظام":   "#8392ab",
};

// ─── Log Entry ────────────────────────────────────────────────────────────────
function LogEntry({ log, isLast }) {
  const cfg = actionConfig[log.action] || { label: log.action, color: "#8392ab", Icon: EditIcon };
  const { Icon } = cfg;
  const [expanded, setExpanded] = useState(false);

  let details = {};
  try { details = log.details_json ? JSON.parse(log.details_json) : {}; } catch (_) {}

  return (
    <SoftBox display="flex" gap={2} mb={isLast ? 0 : 3}>
      {/* Timeline dot */}
      <SoftBox display="flex" flexDirection="column" alignItems="center" flexShrink={0}>
        <SoftBox
          sx={{
            width: 40, height: 40, borderRadius: "50%", background: cfg.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 10px ${cfg.color}55`,
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 18 }} />
        </SoftBox>
        {!isLast && (
          <SoftBox sx={{ width: 2, flex: 1, background: "#e9ecef", mt: 0.5, minHeight: 30 }} />
        )}
      </SoftBox>

      {/* Content */}
      <SoftBox flex={1} pb={isLast ? 0 : 2}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
          <SoftBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <SoftTypography variant="button" fontWeight="bold" color="text">
              {log.description}
            </SoftTypography>
            <Chip
              label={cfg.label}
              size="small"
              sx={{ height: 20, fontSize: 10, background: `${cfg.color}22`, color: cfg.color, fontWeight: "bold" }}
            />
          </SoftBox>
          <SoftTypography variant="caption" color="secondary" whiteSpace="nowrap" ml={1}>
            {log.time}
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" gap={1} mb={0.5} flexWrap="wrap">
          <Chip
            label={log.user}
            size="small"
            sx={{ height: 20, fontSize: 10, background: `${roleColors[log.role] || "#8392ab"}22`, color: roleColors[log.role] || "#8392ab" }}
          />
          <Chip label={log.role} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          {log.entity && log.entity !== "—" && (
            <SoftTypography variant="caption" color="info">{log.entity}</SoftTypography>
          )}
        </SoftBox>

        {Object.keys(details).length > 0 && (
          <>
            <SoftBox onClick={() => setExpanded(!expanded)} sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5 }}>
              <SoftTypography variant="caption" color="info">
                {expanded ? "إخفاء التفاصيل ▲" : "عرض التفاصيل ▼"}
              </SoftTypography>
            </SoftBox>
            {expanded && (
              <SoftBox mt={1} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                {Object.entries(details).map(([key, value]) => (
                  <SoftBox key={key} display="flex" gap={1} mb={0.3}>
                    <SoftTypography variant="caption" color="secondary" minWidth={100}>{key}:</SoftTypography>
                    <SoftTypography variant="caption" color="text" fontWeight="bold">
                      {typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            )}
          </>
        )}
      </SoftBox>
    </SoftBox>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AuditLogs() {
  const [logs, setLogs]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]           = useState(0);

  const [search, setSearch]       = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [draftSearch, setDraftSearch]   = useState("");

  const PAGE_SIZE = 50;

  const fetchLogs = useCallback((newPage, reset) => {
    const setter = newPage === 0 ? setLoading : setLoadingMore;
    setter(true);
    const params = { page: newPage, size: PAGE_SIZE };
    if (search)       params.search = search;
    if (actionFilter) params.action = actionFilter;
    auditLogsApi.list(params)
      .then((r) => {
        const data = r.data;
        const content = Array.isArray(data?.content) ? data.content : [];
        setTotal(data?.totalElements ?? 0);
        setLogs((prev) => reset ? content : [...prev, ...content]);
        setPage(newPage);
      })
      .catch(console.error)
      .finally(() => setter(false));
  }, [search, actionFilter]);

  useEffect(() => {
    fetchLogs(0, true);
  }, [fetchLogs]);

  // Compute summary counts from loaded data
  const summary = logs.reduce((acc, l) => {
    acc[l.action] = (acc[l.action] || 0) + 1;
    return acc;
  }, {});

  const orderCount   = logs.filter((l) => l.action?.includes("order")).length;
  const paymentCount = logs.filter((l) => l.action?.includes("payment")).length;
  const stockCount   = logs.filter((l) => ["inventory_adjustment", "stock_transfer"].includes(l.action)).length;
  const secCount     = logs.filter((l) => ["user_permission_changed", "failed_login"].includes(l.action)).length;

  const handleSearch = () => {
    setSearch(draftSearch);
  };

  const clearFilters = () => {
    setDraftSearch("");
    setSearch("");
    setActionFilter("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">سجل العمليات</SoftTypography>
            <SoftTypography variant="body2" color="text">
              تتبع كامل لجميع العمليات والتغييرات في النظام
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي المُحمَّل",   value: logs.length,    color: "info" },
            { label: "عمليات الطلبيات",    value: orderCount,     color: "success" },
            { label: "عمليات الدفعات",     value: paymentCount,   color: "success" },
            { label: "حركات المخزون",      value: stockCount,     color: "warning" },
            { label: "أمن وصلاحيات",       value: secCount,       color: "dark" },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={s.color}>{s.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{s.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Timeline */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={3}>
                سجل العمليات ({total.toLocaleString("fr-DZ")} إجمالاً)
              </SoftTypography>

              {loading ? (
                <SoftBox display="flex" justifyContent="center" py={6}><CircularProgress /></SoftBox>
              ) : logs.length === 0 ? (
                <SoftBox textAlign="center" py={6}>
                  <SoftTypography variant="body2" color="text">لا توجد عمليات مسجلة بعد</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
                    ستظهر العمليات هنا تلقائياً عند تنفيذها في النظام
                  </SoftTypography>
                </SoftBox>
              ) : (
                <>
                  {logs.map((log, i) => (
                    <LogEntry key={`${log.id}-${i}`} log={log} isLast={i === logs.length - 1} />
                  ))}
                  {logs.length < total && (
                    <SoftBox textAlign="center" mt={3}>
                      <SoftButton
                        variant="outlined"
                        color="info"
                        size="small"
                        onClick={() => fetchLogs(page + 1, false)}
                        disabled={loadingMore}
                      >
                        {loadingMore ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                        تحميل المزيد ({total - logs.length} متبقية)
                      </SoftButton>
                    </SoftBox>
                  )}
                </>
              )}
            </Card>
          </Grid>

          {/* Filters Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, mb: 3 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <FilterListIcon sx={{ color: "#8392ab" }} />
                <SoftTypography variant="h6" fontWeight="bold">الفلاتر</SoftTypography>
              </SoftBox>

              <SoftTypography variant="caption" color="secondary" fontWeight="bold" mb={0.5} display="block">
                بحث
              </SoftTypography>
              <TextField
                fullWidth
                size="small"
                placeholder="ابحث في السجل..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <SoftTypography variant="caption" color="secondary" fontWeight="bold" mb={0.5} display="block">
                نوع العملية
              </SoftTypography>
              <TextField
                fullWidth
                select
                size="small"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">الكل</MenuItem>
                {Object.entries(actionConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </TextField>

              <SoftBox display="flex" gap={1}>
                <SoftButton variant="gradient" color="info" size="small" onClick={handleSearch} sx={{ flex: 1 }}>
                  بحث
                </SoftButton>
                <SoftButton variant="outlined" color="secondary" size="small" onClick={clearFilters} sx={{ flex: 1 }}>
                  مسح
                </SoftButton>
              </SoftBox>
            </Card>

            {/* Action Summary */}
            {Object.keys(summary).length > 0 && (
              <Card sx={{ p: 3 }}>
                <SoftTypography variant="h6" fontWeight="bold" mb={2}>ملخص العمليات</SoftTypography>
                {Object.entries(summary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, count]) => {
                    const cfg = actionConfig[key] || { label: key, color: "#8392ab", Icon: EditIcon };
                    const { Icon } = cfg;
                    return (
                      <SoftBox key={key} display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <SoftBox display="flex" alignItems="center" gap={1}>
                          <SoftBox
                            sx={{
                              width: 28, height: 28, borderRadius: 1,
                              background: `${cfg.color}22`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Icon sx={{ color: cfg.color, fontSize: 16 }} />
                          </SoftBox>
                          <SoftTypography variant="caption" color="text">{cfg.label}</SoftTypography>
                        </SoftBox>
                        <Chip
                          label={count}
                          size="small"
                          sx={{ height: 20, fontSize: 11, background: `${cfg.color}22`, color: cfg.color }}
                        />
                      </SoftBox>
                    );
                  })}
              </Card>
            )}
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AuditLogs;
