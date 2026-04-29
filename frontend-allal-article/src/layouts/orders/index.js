/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SoftBox from "components/SoftBox";
import SoftBadge from "components/SoftBadge";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { ordersApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const statusConfig = {
  draft:        { label: "مسودة",        color: "secondary" },
  submitted:    { label: "مرسلة",        color: "info" },
  under_review: { label: "قيد المراجعة", color: "warning" },
  confirmed:    { label: "مؤكدة",        color: "success" },
  shipped:      { label: "مشحونة",       color: "success" },
  completed:    { label: "مكتملة",       color: "success" },
  cancelled:    { label: "ملغاة",        color: "error" },
  rejected:     { label: "مرفوضة",       color: "error" },
};

const shippingConfig = {
  none:    { label: "—",           color: "secondary" },
  pending: { label: "في الانتظار", color: "warning" },
  shipped: { label: "تم الشحن",    color: "success" },
};

const tabs = [
  { key: "all",          label: "الكل" },
  { key: "draft",        label: "مسودة" },
  { key: "submitted",    label: "مرسلة" },
  { key: "under_review", label: "قيد المراجعة" },
  { key: "confirmed",    label: "مؤكدة" },
  { key: "shipped",      label: "مشحونة" },
  { key: "completed",    label: "مكتملة" },
  { key: "cancelled",    label: "ملغاة" },
  { key: "rejected",     label: "مرفوضة" },
];

function normalizeOrder(o) {
  return {
    _id:           o.id,
    id:            o.orderNumber || String(o.id),
    customer:      o.customerName || "—",
    salesperson:   o.salesUserName || "—",
    date:          o.createdAt ? o.createdAt.slice(0, 10) : "—",
    status:        o.orderStatus || "draft",
    shippingStatus: o.shippingStatus || "none",
    lines:         (o.items || []).length,
    returnedQty:   0,
    priceList:     o.priceListName || "—",
    total:         o.totalAmount != null ? Number(o.totalAmount).toLocaleString("fr-DZ") : "0",
  };
}

function ColHeader({ children }) {
  return (
    <SoftTypography variant="caption" fontWeight="bold" color="secondary" textTransform="uppercase">
      {children}
    </SoftTypography>
  );
}

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    ordersApi.list({ size: 100 })
      .then((r) => {
        const raw = Array.isArray(r.data?.content) ? r.data.content
          : Array.isArray(r.data) ? r.data : [];
        setOrders(raw.map(normalizeOrder));
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل الطلبيات"));
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeKey = tabs[activeTab].key;
  const filtered = orders.filter((o) => {
    const matchStatus = activeKey === "all" || o.status === activeKey;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.salesperson.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">الطلبيات</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة ومتابعة جميع الطلبيات</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" onClick={() => navigate("/orders/new")} startIcon={<AddIcon />}>
            طلبية جديدة
          </SoftButton>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الطلبيات", value: orders.length, color: "info" },
            { label: "مرسلة / قيد المراجعة", value: orders.filter(o => ["submitted","under_review"].includes(o.status)).length, color: "warning" },
            { label: "مؤكدة / مشحونة / مكتملة", value: orders.filter(o => ["confirmed","shipped","completed"].includes(o.status)).length, color: "success" },
            { label: "ملغاة / مرفوضة", value: orders.filter(o => ["cancelled","rejected"].includes(o.status)).length, color: "error" },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={stat.color}>{stat.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{stat.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}
              variant="scrollable" scrollButtons="auto">
              {tabs.map((t) => (
                <Tab key={t.key} label={
                  <SoftTypography variant="caption" fontWeight="medium">
                    {t.label}
                    {t.key !== "all" && (
                      <Chip size="small" label={orders.filter(o => o.status === t.key).length}
                        sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
                    )}
                  </SoftTypography>
                } />
              ))}
            </Tabs>
          </SoftBox>

          <SoftBox p={2} display="flex" gap={2} alignItems="center">
            <TextField size="small" placeholder="بحث برقم الطلبية، الزبون، أو البائع..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 340 }} />
            <Tooltip title="فلاتر متقدمة">
              <IconButton size="small"><FilterListIcon /></IconButton>
            </Tooltip>
            <SoftTypography variant="caption" color="text" ml="auto">{filtered.length} نتيجة</SoftTypography>
          </SoftBox>

          <SoftBox sx={{ overflowX: "auto" }}>
            {loading ? (
              <SoftBox textAlign="center" py={5}>
                <SoftTypography variant="body2" color="secondary">جارٍ التحميل...</SoftTypography>
              </SoftBox>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e9ecef" }}>
                    {["رقم الطلبية","الزبون","البائع","التاريخ","الحالة","الشحن","السطور","المرتجع","قائمة الأسعار","الإجمالي (دج)","إجراء"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "right" }}>
                        <ColHeader>{h}</ColHeader>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ textAlign: "center", padding: 40 }}>
                        <SoftTypography variant="body2" color="text">لا توجد نتائج</SoftTypography>
                      </td>
                    </tr>
                  ) : filtered.map((order, i) => {
                    const sc = statusConfig[order.status]   || { label: order.status,   color: "secondary" };
                    const sh = shippingConfig[order.shippingStatus] || { label: "—", color: "secondary" };
                    return (
                      <tr key={order._id}
                        style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc")}
                        onClick={() => navigate(`/orders/${order._id}`)}>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium" color="info">{order.id}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium">{order.customer}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="caption" color="text">{order.salesperson}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="caption" color="text">{order.date}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftBadge variant="gradient" color={sc.color} size="xs" badgeContent={sc.label} container />
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftBadge variant="contained" color={sh.color} size="xs" badgeContent={sh.label} container />
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="text">{order.lines}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {order.returnedQty > 0
                            ? <SoftTypography variant="caption" color="error" fontWeight="bold">{order.returnedQty}</SoftTypography>
                            : <SoftTypography variant="caption" color="secondary">—</SoftTypography>}
                        </td>
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" color="text">{order.priceList}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <SoftTypography variant="button" fontWeight="medium">{order.total}</SoftTypography>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton size="small" color="primary"
                              onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order._id}`); }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Orders;
