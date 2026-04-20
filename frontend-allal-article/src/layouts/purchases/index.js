/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PendingIcon from "@mui/icons-material/Pending";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { formatDZD, mockPurchases, paymentConfig, statusConfig, supplierOptions } from "./mockData";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftBox display="flex" alignItems="center" gap={2}>
        <SoftBox
          sx={{
            width: 44, height: 44, borderRadius: 2,
            background: `linear-gradient(195deg, ${color}99, ${color})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 22 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="h5" fontWeight="bold">{value}</SoftTypography>
          <SoftTypography variant="caption" color="text">{label}</SoftTypography>
          {sub && <SoftTypography variant="caption" color="secondary" display="block">{sub}</SoftTypography>}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Purchases() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const tabStatus = ["all", "pending", "confirmed", "received", "cancelled"][tab];

  const filtered = mockPurchases.filter((p) => {
    const matchStatus = tabStatus === "all" || p.status === tabStatus;
    const matchPayment = paymentFilter === "all" || p.paymentStatus === paymentFilter;
    const matchSupplier = supplierFilter === "all" || p.supplier === supplierFilter;
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier.includes(search);
    return matchStatus && matchPayment && matchSupplier && matchSearch;
  });

  const pendingCount   = mockPurchases.filter(p => p.status === "pending").length;
  const confirmedCount = mockPurchases.filter(p => p.status === "confirmed").length;
  const receivedCount  = mockPurchases.filter(p => p.status === "received").length;
  const unpaidAmount   = mockPurchases
    .filter(p => p.paymentStatus !== "paid")
    .reduce((s, p) => s + p.totalAmount, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">المشتريات</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة أوامر الشراء ومتابعة الموردين</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />}
            onClick={() => navigate("/purchases/new")}>
            أمر شراء جديد
          </SoftButton>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="في الانتظار"  value={pendingCount}   color="#fb8c00" icon={PendingIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مؤكدة"         value={confirmedCount} color="#17c1e8" icon={ReceiptIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مستلمة"        value={receivedCount}  color="#66BB6A" icon={LocalShippingIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard
              label="غير مدفوعة"
              value={`${(unpaidAmount / 1000000).toFixed(1)}م دج`}
              color="#ea0606"
              icon={TrendingUpIcon}
              sub="إجمالي الديون للموردين"
            />
          </Grid>
        </Grid>

        {/* Table Card */}
        <Card>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {[
                { label: "الكل",          count: mockPurchases.length },
                { label: "في الانتظار",  count: pendingCount },
                { label: "مؤكدة",         count: confirmedCount },
                { label: "مستلمة",        count: receivedCount },
                { label: "ملغاة",         count: mockPurchases.filter(p => p.status === "cancelled").length },
              ].map((t, i) => (
                <Tab key={i} label={
                  <SoftTypography variant="caption" fontWeight="medium">
                    {t.label}
                    <Chip size="small" label={t.count} sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
                  </SoftTypography>
                } />
              ))}
            </Tabs>
          </SoftBox>

          <SoftBox p={2}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="بحث برقم الأمر أو المورد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ width: 300 }}
              />
              <SoftButton
                variant={showFilters ? "gradient" : "outlined"}
                color={showFilters ? "info" : "secondary"}
                size="small"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters((value) => !value)}
              >
                فلتر
              </SoftButton>
            </SoftBox>

            {showFilters && (
              <SoftBox display="flex" gap={1.5} flexWrap="wrap" mb={2}>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <Select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                    <MenuItem value="all">كل الموردين</MenuItem>
                    {supplierOptions.map((supplier) => (
                      <MenuItem key={supplier} value={supplier}>{supplier}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                    <MenuItem value="all">كل حالات الدفع</MenuItem>
                    {Object.entries(paymentConfig).map(([key, cfg]) => (
                      <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <SoftTypography variant="caption" color="text" sx={{ alignSelf: "center", mr: "auto" }}>
                  {filtered.length} نتيجة
                </SoftTypography>
              </SoftBox>
            )}

            <SoftBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["رقم الأمر", "المورد", "تاريخ الطلب", "التاريخ المتوقع", "الأصناف", "الإجمالي (دج)", "الحالة", "الدفع", "المستلِم", "إجراء"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: 40 }}>
                        <SoftTypography variant="body2" color="text">
                          لا توجد أوامر شراء مطابقة
                        </SoftTypography>
                      </td>
                    </tr>
                  ) : filtered.map((p, i) => {
                    const sc = statusConfig[p.status];
                    const pc = paymentConfig[p.paymentStatus];
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderBottom: "1px solid #f0f2f5",
                          background: i % 2 === 0 ? "#fff" : "#fafbfc",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafbfc")}
                        onClick={() => navigate(`/purchases/${p.id}`)}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="info"
                            sx={{ cursor: "pointer" }} onClick={() => navigate(`/purchases/${p.id}`)}>
                            {p.id}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{p.supplier}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{p.date}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{p.expectedDate}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{p.itemsCount}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{formatDZD(p.totalAmount)}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge variant="gradient" color={sc.color} size="xs" badgeContent={sc.label} container />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge variant="gradient" color={pc.color} size="xs" badgeContent={pc.label} container />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{p.receivedBy || "—"}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => { e.stopPropagation(); navigate(`/purchases/${p.id}`); }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Purchases;
