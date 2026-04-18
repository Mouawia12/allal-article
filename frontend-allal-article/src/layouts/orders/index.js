/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const mockOrders = [
  {
    id: "ORD-2024-001", customer: "شركة الرياض للمقاولات", salesperson: "أحمد محمد",
    date: "2024-01-15", status: "confirmed", shippingStatus: "shipped", lines: 5, total: "12,500",
  },
  {
    id: "ORD-2024-002", customer: "مؤسسة البناء الحديث", salesperson: "خالد عمر",
    date: "2024-01-16", status: "submitted", shippingStatus: "pending", lines: 3, total: "8,200",
  },
  {
    id: "ORD-2024-003", customer: "شركة الإنشاءات المتحدة", salesperson: "محمد سعيد",
    date: "2024-01-17", status: "under_review", shippingStatus: "pending", lines: 8, total: "34,600",
  },
  {
    id: "ORD-2024-004", customer: "مجموعة الخليج للتطوير", salesperson: "أحمد محمد",
    date: "2024-01-18", status: "draft", shippingStatus: "none", lines: 2, total: "4,100",
  },
  {
    id: "ORD-2024-005", customer: "شركة الأفق للتجارة", salesperson: "يوسف علي",
    date: "2024-01-18", status: "fulfilled", shippingStatus: "shipped", lines: 6, total: "22,300",
  },
  {
    id: "ORD-2024-006", customer: "مؤسسة النجاح التجارية", salesperson: "خالد عمر",
    date: "2024-01-19", status: "cancelled", shippingStatus: "none", lines: 4, total: "9,800",
  },
  {
    id: "ORD-2024-007", customer: "شركة المستقبل للصناعة", salesperson: "محمد سعيد",
    date: "2024-01-20", status: "confirmed", shippingStatus: "partial", lines: 7, total: "18,750",
  },
  {
    id: "ORD-2024-008", customer: "مجموعة الوطن للأعمال", salesperson: "يوسف علي",
    date: "2024-01-21", status: "rejected", shippingStatus: "none", lines: 3, total: "6,400",
  },
  {
    id: "ORD-2024-009", customer: "شركة التقدم للمقاولات", salesperson: "أحمد محمد",
    date: "2024-01-22", status: "submitted", shippingStatus: "pending", lines: 5, total: "15,200",
  },
  {
    id: "ORD-2024-010", customer: "مؤسسة الإبداع التجارية", salesperson: "خالد عمر",
    date: "2024-01-22", status: "under_review", shippingStatus: "pending", lines: 9, total: "41,000",
  },
];

// ─── Status Config ────────────────────────────────────────────────────────────
const statusConfig = {
  draft:        { label: "مسودة",       color: "secondary" },
  submitted:    { label: "مرسلة",       color: "info" },
  under_review: { label: "قيد المراجعة", color: "warning" },
  confirmed:    { label: "مؤكدة",       color: "success" },
  fulfilled:    { label: "مكتملة",      color: "success" },
  cancelled:    { label: "ملغاة",       color: "error" },
  rejected:     { label: "مرفوضة",      color: "error" },
};

const shippingConfig = {
  none:     { label: "—",             color: "secondary" },
  pending:  { label: "في الانتظار",   color: "warning" },
  partial:  { label: "جزئي",          color: "info" },
  shipped:  { label: "تم الشحن",      color: "success" },
};

const tabs = [
  { key: "all",         label: "الكل" },
  { key: "draft",       label: "مسودة" },
  { key: "submitted",   label: "مرسلة" },
  { key: "under_review",label: "قيد المراجعة" },
  { key: "confirmed",   label: "مؤكدة" },
  { key: "fulfilled",   label: "مكتملة" },
  { key: "cancelled",   label: "ملغاة" },
  { key: "rejected",    label: "مرفوضة" },
];

// ─── Column Header ────────────────────────────────────────────────────────────
function ColHeader({ children }) {
  return (
    <SoftTypography variant="caption" fontWeight="bold" color="secondary" textTransform="uppercase">
      {children}
    </SoftTypography>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Orders() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  const activeKey = tabs[activeTab].key;

  const filtered = mockOrders.filter((o) => {
    const matchStatus = activeKey === "all" || o.status === activeKey;
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.includes(search) ||
      o.salesperson.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── Page Header ── */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">
              الطلبيات
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              إدارة ومتابعة جميع الطلبيات
            </SoftTypography>
          </SoftBox>
          <SoftButton
            variant="gradient"
            color="info"
            onClick={() => navigate("/orders/new")}
            startIcon={<AddIcon />}
          >
            طلبية جديدة
          </SoftButton>
        </SoftBox>

        {/* ── Stats Row ── */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الطلبيات", value: mockOrders.length, color: "info" },
            { label: "مرسلة / قيد المراجعة", value: mockOrders.filter(o => ["submitted","under_review"].includes(o.status)).length, color: "warning" },
            { label: "مؤكدة", value: mockOrders.filter(o => o.status === "confirmed").length, color: "success" },
            { label: "ملغاة / مرفوضة", value: mockOrders.filter(o => ["cancelled","rejected"].includes(o.status)).length, color: "error" },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={stat.color}>
                  {stat.value}
                </SoftTypography>
                <SoftTypography variant="caption" color="text">
                  {stat.label}
                </SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Main Card ── */}
        <Card>
          {/* Tabs */}
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabs.map((t) => (
                <Tab
                  key={t.key}
                  label={
                    <SoftTypography variant="caption" fontWeight="medium">
                      {t.label}
                      {t.key !== "all" && (
                        <Chip
                          size="small"
                          label={mockOrders.filter(o => o.status === t.key).length}
                          sx={{ ml: 0.5, height: 18, fontSize: 10 }}
                        />
                      )}
                    </SoftTypography>
                  }
                />
              ))}
            </Tabs>
          </SoftBox>

          {/* Search Bar */}
          <SoftBox p={2} display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="بحث برقم الطلبية، الزبون، أو البائع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 340 }}
            />
            <Tooltip title="فلاتر متقدمة">
              <IconButton size="small">
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <SoftTypography variant="caption" color="text" ml="auto">
              {filtered.length} نتيجة
            </SoftTypography>
          </SoftBox>

          {/* Table */}
          <SoftBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e9ecef" }}>
                  {[
                    "رقم الطلبية", "الزبون", "البائع", "التاريخ",
                    "الحالة", "الشحن", "السطور", "الإجمالي (دج)", "إجراء",
                  ].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "right" }}>
                      <ColHeader>{h}</ColHeader>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: 40 }}>
                      <SoftTypography variant="body2" color="text">
                        لا توجد نتائج
                      </SoftTypography>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order, i) => {
                    const sc = statusConfig[order.status] || { label: order.status, color: "secondary" };
                    const sh = shippingConfig[order.shippingStatus] || { label: "—", color: "secondary" };
                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderBottom: "1px solid #f0f2f5",
                          background: i % 2 === 0 ? "#fff" : "#fafbfc",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc")}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium" color="info">
                            {order.id}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium">
                            {order.customer}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="caption" color="text">
                            {order.salesperson}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="caption" color="text">
                            {order.date}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftBadge
                            variant="gradient"
                            color={sc.color}
                            size="xs"
                            badgeContent={sc.label}
                            container
                          />
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftBadge
                            variant="contained"
                            color={sh.color}
                            size="xs"
                            badgeContent={sh.label}
                            container
                          />
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="text">
                            {order.lines}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium">
                            {order.total}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Orders;
