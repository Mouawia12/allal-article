/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
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

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockLogs = [
  {
    id: 1,  time: "2024-01-22 15:45", user: "محمد سعيد",  role: "بائع",   action: "create_order",
    entity: "ORD-2024-010", description: "أنشأ طلبية جديدة وأرسلها للإدارة",
    details: { customer: "مؤسسة الإبداع التجارية", lines: 9, total: "41,000" },
  },
  {
    id: 2,  time: "2024-01-22 15:10", user: "الإدارة",    role: "إدارة",  action: "confirm_order",
    entity: "ORD-2024-007", description: "تم تأكيد الطلبية",
    details: { previousStatus: "under_review", newStatus: "confirmed" },
  },
  {
    id: 3,  time: "2024-01-22 14:55", user: "الإدارة",    role: "إدارة",  action: "modify_qty",
    entity: "ORD-2024-003 / صامولة M10", description: "تعديل كمية صنف داخل الطلبية",
    details: { field: "approvedQty", oldValue: 500, newValue: 400 },
  },
  {
    id: 4,  time: "2024-01-22 14:50", user: "الإدارة",    role: "إدارة",  action: "cancel_line",
    entity: "ORD-2024-003 / مفتاح ربط 17mm", description: "إلغاء سطر من الطلبية",
    details: { reason: "غير متوفر في المخزون" },
  },
  {
    id: 5,  time: "2024-01-22 14:30", user: "الإدارة",    role: "إدارة",  action: "delete_line",
    entity: "ORD-2024-003 / كابل كهربائي 2.5mm", description: "حذف سطر من الطلبية",
    details: { note: "حذفت من قبل الإدارة" },
  },
  {
    id: 6,  time: "2024-01-22 14:00", user: "خالد عمر",   role: "بائع",   action: "create_order",
    entity: "ORD-2024-009", description: "أنشأ طلبية جديدة وأرسلها للإدارة",
    details: { customer: "شركة التقدم للمقاولات", lines: 5, total: "15,200" },
  },
  {
    id: 7,  time: "2024-01-22 13:30", user: "أحمد محمد",  role: "بائع",   action: "add_customer",
    entity: "شركة التقدم للمقاولات", description: "إضافة زبون جديد",
    details: { phone: "0512-000001", city: "الرياض" },
  },
  {
    id: 8,  time: "2024-01-21 11:20", user: "المالك",     role: "مالك",   action: "update_product",
    entity: "BRG-010-50 / برغي M10", description: "تعديل بيانات صنف",
    details: { field: "description", oldValue: "—", newValue: "برغي فولاذي عالي الجودة..." },
  },
  {
    id: 9,  time: "2024-01-21 10:00", user: "يوسف علي",   role: "بائع",   action: "ship_order",
    entity: "ORD-2024-005", description: "تسجيل شحن طلبية",
    details: { lines: 6, qty: 320 },
  },
  {
    id: 10, time: "2024-01-21 09:45", user: "المالك",     role: "مالك",   action: "ai_process",
    entity: "AI Job #12", description: "معالجة صور أصناف بالذكاء الاصطناعي",
    details: { images: 5, processed: 5, model: "GPT-4o" },
  },
  {
    id: 11, time: "2024-01-20 16:00", user: "الإدارة",    role: "إدارة",  action: "reject_order",
    entity: "ORD-2024-008", description: "رفض الطلبية",
    details: { reason: "منتجات غير متوفرة" },
  },
  {
    id: 12, time: "2024-01-20 08:15", user: "أحمد محمد",  role: "بائع",   action: "login",
    entity: "—", description: "تسجيل دخول للنظام",
    details: { device: "Mobile", ip: "192.168.1.x" },
  },
  {
    id: 13, time: "2024-01-22 16:05", user: "أحمد محمد", role: "إدارة", action: "customer_payment_received",
    entity: "PMT-004 / مؤسسة الإبداع التجارية", description: "تسجيل دفعة من زبون",
    details: {
      customer: "مؤسسة الإبداع التجارية",
      amount: "250,000 دج",
      method: "نقدي",
      receivedBy: "أحمد محمد",
      paidBy: "مؤسسة الإبداع التجارية",
      reference: "PMT-004",
    },
  },
  {
    id: 14, time: "2024-01-22 16:20", user: "الإدارة", role: "إدارة", action: "customer_payment_refund",
    entity: "PMT-005 / شركة التقدم للمقاولات", description: "تسجيل دفعة عكسية للزبون",
    details: {
      customer: "شركة التقدم للمقاولات",
      amount: "50,000 دج",
      method: "تحويل بنكي",
      paidBy: "الإدارة",
      receivedBy: "شركة التقدم للمقاولات",
      reason: "تسوية دفعة زائدة",
      reference: "PMT-005",
    },
  },
  {
    id: 15, time: "2024-01-22 16:40", user: "المالك", role: "مالك", action: "product_price_changed",
    entity: "BRG-010-50 / برغي M10", description: "تغيير سعر صنف",
    details: { oldPrice: "120 دج", newPrice: "135 دج", priceList: "السعر الرئيسي", reason: "تحديث تكلفة الشراء" },
  },
  {
    id: 16, time: "2024-01-22 16:52", user: "الإدارة", role: "إدارة", action: "inventory_adjustment",
    entity: "WH-MAIN / دهان أبيض 20L", description: "تسوية كمية مخزون",
    details: { product: "دهان أبيض 20L", warehouse: "المخزن الرئيسي", oldQty: 48, newQty: 44, reason: "جرد يدوي" },
  },
  {
    id: 17, time: "2024-01-22 17:05", user: "يوسف علي", role: "إدارة", action: "stock_transfer",
    entity: "TRF-2024-003", description: "تحويل مخزون بين مستودعين",
    details: { product: "صامولة M10", qty: 200, from: "المخزن الرئيسي", to: "مخزن سطيف" },
  },
  {
    id: 18, time: "2024-01-22 17:20", user: "الإدارة", role: "إدارة", action: "create_return",
    entity: "RET-2024-002 / ORD-2024-007", description: "إنشاء مرتجع طلبية",
    details: { customer: "مؤسسة الإبداع التجارية", order: "ORD-2024-007", returnedQty: 12, receivedBy: "الإدارة" },
  },
  {
    id: 19, time: "2024-01-22 17:35", user: "الإدارة", role: "إدارة", action: "supplier_payment_paid",
    entity: "SP-003 / مصنع الصلب الجزائري", description: "تسجيل دفعة لمورد",
    details: { supplier: "مصنع الصلب الجزائري", amount: "320,000 دج", method: "تحويل بنكي", paidBy: "الإدارة", reference: "SP-003" },
  },
  {
    id: 20, time: "2024-01-22 17:50", user: "المالك", role: "مالك", action: "user_permission_changed",
    entity: "خالد عمر", description: "تعديل صلاحيات مستخدم",
    details: { targetUser: "خالد عمر", permission: "customers.payments", oldValue: "غير مفعلة", newValue: "مفعلة" },
  },
  {
    id: 21, time: "2024-01-22 18:05", user: "المالك", role: "مالك", action: "settings_changed",
    entity: "إعدادات الذكاء الاصطناعي", description: "تعديل إعدادات النظام",
    details: { setting: "ai.provider", oldValue: "غير محدد", newValue: "OpenAI", scope: "tenant" },
  },
  {
    id: 22, time: "2024-01-22 18:12", user: "النظام", role: "نظام", action: "failed_login",
    entity: "admin@example.com", description: "محاولة دخول فاشلة",
    details: { email: "admin@example.com", ip: "192.168.1.x", reason: "كلمة مرور غير صحيحة" },
  },
  {
    id: 23, time: "2024-01-22 18:25", user: "الإدارة", role: "إدارة", action: "data_exported",
    entity: "تقرير الزبائن المديونين", description: "تصدير بيانات حساسة",
    details: { exportType: "PDF", records: 18, filter: "مديونون / ولاية الجزائر" },
  },
];

const actionConfig = {
  create_order:  { label: "إنشاء طلبية",   color: "#17c1e8", Icon: AddShoppingCartIcon },
  confirm_order: { label: "تأكيد طلبية",   color: "#66BB6A", Icon: CheckCircleIcon },
  reject_order:  { label: "رفض طلبية",     color: "#ea0606", Icon: CancelIcon },
  modify_qty:    { label: "تعديل كمية",    color: "#fb8c00", Icon: EditIcon },
  cancel_line:   { label: "إلغاء سطر",     color: "#ea0606", Icon: CancelIcon },
  delete_line:   { label: "حذف سطر",       color: "#ea0606", Icon: DeleteIcon },
  add_customer:  { label: "إضافة زبون",    color: "#82d616", Icon: PersonAddIcon },
  update_product:{ label: "تعديل صنف",     color: "#fb8c00", Icon: InventoryIcon },
  product_price_changed: { label: "تغيير سعر", color: "#fb8c00", Icon: PriceChangeIcon },
  ship_order:    { label: "شحن طلبية",     color: "#17c1e8", Icon: LocalShippingIcon },
  create_return: { label: "إنشاء مرتجع",    color: "#ea0606", Icon: AssignmentReturnIcon },
  inventory_adjustment: { label: "تسوية مخزون", color: "#fb8c00", Icon: InventoryIcon },
  stock_transfer: { label: "تحويل مخزون", color: "#17c1e8", Icon: SwapHorizIcon },
  customer_payment_received: { label: "استلام دفعة", color: "#66BB6A", Icon: PaymentsIcon },
  customer_payment_refund:   { label: "دفعة عكسية",  color: "#ea0606", Icon: ReplyIcon },
  supplier_payment_paid:     { label: "دفع لمورد",   color: "#344767", Icon: PaymentsIcon },
  user_permission_changed: { label: "تعديل صلاحيات", color: "#7928ca", Icon: ManageAccountsIcon },
  settings_changed: { label: "تعديل إعدادات", color: "#344767", Icon: SettingsApplicationsIcon },
  failed_login: { label: "فشل دخول", color: "#ea0606", Icon: WarningAmberIcon },
  data_exported: { label: "تصدير بيانات", color: "#8392ab", Icon: FileDownloadIcon },
  ai_process:    { label: "معالجة AI",      color: "#7928ca", Icon: AutoAwesomeIcon },
  login:         { label: "تسجيل دخول",    color: "#8392ab", Icon: LoginIcon },
};

const roleColors = {
  "بائع": "#17c1e8",
  "إدارة": "#82d616",
  "مالك": "#7928ca",
  "نظام": "#8392ab",
};

const actionTypes = ["الكل", ...Object.keys(actionConfig)];

// ─── Log Entry ────────────────────────────────────────────────────────────────
function LogEntry({ log, isLast }) {
  const cfg = actionConfig[log.action] || { label: log.action, color: "#8392ab", Icon: EditIcon };
  const { Icon } = cfg;
  const [expanded, setExpanded] = useState(false);

  return (
    <SoftBox display="flex" gap={2} mb={isLast ? 0 : 3}>
      {/* Timeline indicator */}
      <SoftBox display="flex" flexDirection="column" alignItems="center" flexShrink={0}>
        <SoftBox
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: cfg.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
              sx={{
                height: 20,
                fontSize: 10,
                background: `${cfg.color}22`,
                color: cfg.color,
                fontWeight: "bold",
              }}
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
            sx={{ height: 20, fontSize: 10, background: `${roleColors[log.role]}22`, color: roleColors[log.role] }}
          />
          <Chip label={log.role} size="small" variant="outlined" sx={{ height: 20, fontSize: 10 }} />
          {log.entity !== "—" && (
            <SoftTypography variant="caption" color="info" sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
              {log.entity}
            </SoftTypography>
          )}
        </SoftBox>

        {/* Details (expandable) */}
        <SoftBox
          onClick={() => setExpanded(!expanded)}
          sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5 }}
        >
          <SoftTypography variant="caption" color="info">
            {expanded ? "إخفاء التفاصيل ▲" : "عرض التفاصيل ▼"}
          </SoftTypography>
        </SoftBox>

        {expanded && (
          <SoftBox mt={1} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
            {Object.entries(log.details).map(([key, value]) => (
              <SoftBox key={key} display="flex" gap={1} mb={0.3}>
                <SoftTypography variant="caption" color="secondary" minWidth={100}>{key}:</SoftTypography>
                <SoftTypography variant="caption" color="text" fontWeight="bold">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </SoftTypography>
              </SoftBox>
            ))}
          </SoftBox>
        )}
      </SoftBox>
    </SoftBox>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("الكل");
  const [userFilter, setUserFilter] = useState("الكل");

  const users = ["الكل", ...new Set(mockLogs.map((l) => l.user))];

  const filtered = mockLogs.filter((log) => {
    const detailText = Object.values(log.details || {}).join(" ");
    const matchSearch =
      log.description.includes(search) ||
      log.user.includes(search) ||
      log.entity.includes(search) ||
      detailText.includes(search);
    const matchAction = actionFilter === "الكل" || log.action === actionFilter;
    const matchUser = userFilter === "الكل" || log.user === userFilter;
    return matchSearch && matchAction && matchUser;
  });

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
          <SoftButton variant="outlined" color="secondary" size="small">
            تصدير السجل
          </SoftButton>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي العمليات اليوم", value: mockLogs.filter(l => l.time.startsWith("2024-01-22")).length, color: "info" },
            { label: "عمليات الطلبيات",        value: mockLogs.filter(l => l.action.includes("order")).length,      color: "success" },
            { label: "عمليات الدفعات",         value: mockLogs.filter(l => l.action.includes("payment")).length,    color: "success" },
            { label: "حركات المخزون",          value: mockLogs.filter(l => ["inventory_adjustment", "stock_transfer"].includes(l.action)).length, color: "warning" },
            { label: "أمن وصلاحيات",           value: mockLogs.filter(l => ["user_permission_changed", "failed_login"].includes(l.action)).length, color: "dark" },
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
                سجل العمليات ({filtered.length})
              </SoftTypography>
              {filtered.length === 0 ? (
                <SoftBox textAlign="center" py={5}>
                  <SoftTypography variant="body2" color="text">لا توجد نتائج مطابقة</SoftTypography>
                </SoftBox>
              ) : (
                filtered.map((log, i) => (
                  <LogEntry key={log.id} log={log} isLast={i === filtered.length - 1} />
                ))
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

              {/* Search */}
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" mb={0.5} display="block">
                بحث
              </SoftTypography>
              <TextField
                fullWidth
                size="small"
                placeholder="ابحث في السجل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              {/* Action Type */}
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
                <MenuItem value="الكل">الكل</MenuItem>
                {Object.entries(actionConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </TextField>

              {/* User */}
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" mb={0.5} display="block">
                المستخدم
              </SoftTypography>
              <TextField
                fullWidth
                select
                size="small"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                sx={{ mb: 2 }}
              >
                {users.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>

              <SoftButton
                variant="outlined"
                color="secondary"
                size="small"
                fullWidth
                onClick={() => { setSearch(""); setActionFilter("الكل"); setUserFilter("الكل"); }}
              >
                مسح الفلاتر
              </SoftButton>
            </Card>

            {/* Action Type Summary */}
            <Card sx={{ p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>ملخص العمليات</SoftTypography>
              {Object.entries(actionConfig).map(([key, cfg]) => {
                const count = mockLogs.filter(l => l.action === key).length;
                if (count === 0) return null;
                const { Icon } = cfg;
                return (
                  <SoftBox key={key} display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <SoftBox
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 1,
                          background: `${cfg.color}22`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
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
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AuditLogs;
