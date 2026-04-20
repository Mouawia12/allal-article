/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockInvoices = [
  {
    id: "FTR-2024-001", date: "2024-01-22", wilaya: "وهران",
    customer: "موزع وهران الرئيسي", driver: "حمزة بلقاسم",
    ordersCount: 3, itemsCount: 12, totalWeight: "2.4 طن",
    status: "draft", printCount: 0,
  },
  {
    id: "FTR-2024-002", date: "2024-01-21", wilaya: "وهران",
    customer: "موزع وهران الرئيسي", driver: "حمزة بلقاسم",
    ordersCount: 2, itemsCount: 8, totalWeight: "1.8 طن",
    status: "sent", printCount: 2,
  },
  {
    id: "FTR-2024-003", date: "2024-01-20", wilaya: "الجزائر",
    customer: "موزع العاصمة", driver: "كريم بوزيد",
    ordersCount: 5, itemsCount: 20, totalWeight: "4.1 طن",
    status: "delivered", printCount: 3,
  },
  {
    id: "FTR-2024-004", date: "2024-01-19", wilaya: "قسنطينة",
    customer: "موزع الشرق", driver: "يوسف منصوري",
    ordersCount: 4, itemsCount: 15, totalWeight: "3.2 طن",
    status: "sent", printCount: 1,
  },
  {
    id: "FTR-2024-005", date: "2024-01-18", wilaya: "سطيف",
    customer: "موزع سطيف الرئيسي", driver: "عمر زياني",
    ordersCount: 2, itemsCount: 7, totalWeight: "1.5 طن",
    status: "delivered", printCount: 2,
  },
];

const statusConfig = {
  draft:     { label: "مسودة",   color: "secondary" },
  sent:      { label: "مرسلة",   color: "info" },
  delivered: { label: "مسلّمة",  color: "success" },
  cancelled: { label: "ملغاة",   color: "error" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftBox display="flex" alignItems="center" gap={2}>
        <SoftBox sx={{
          width: 44, height: 44, borderRadius: 2,
          background: `linear-gradient(195deg, ${color}99, ${color})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon sx={{ color: "#fff", fontSize: 22 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="h5" fontWeight="bold">{value}</SoftTypography>
          <SoftTypography variant="caption" color="text">{label}</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function RoadInvoices() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [wilayaFilter, setWilayaFilter] = useState("all");

  const tabStatus = ["all", "draft", "sent", "delivered"][tab];

  const filtered = mockInvoices.filter((inv) => {
    const matchStatus = tabStatus === "all" || inv.status === tabStatus;
    const matchWilaya = wilayaFilter === "all" || inv.wilaya === wilayaFilter;
    const matchSearch =
      inv.id.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer.includes(search) ||
      inv.driver.includes(search) ||
      inv.wilaya.includes(search);
    return matchStatus && matchWilaya && matchSearch;
  });

  const draftCount     = mockInvoices.filter(i => i.status === "draft").length;
  const sentCount      = mockInvoices.filter(i => i.status === "sent").length;
  const deliveredCount = mockInvoices.filter(i => i.status === "delivered").length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">فواتير الطريق</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة فواتير الشحن وتتبعها حسب الولاية والسائق</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton variant="outlined" color="secondary" size="small"
              onClick={() => navigate("/road-invoices/from-orders")}>
              تحويل من طلبيات
            </SoftButton>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />}
              onClick={() => navigate("/road-invoices/new")}>
              فاتورة جديدة
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="إجمالي الفواتير" value={mockInvoices.length} color="#344767" icon={ReceiptIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="في الطريق"        value={sentCount}      color="#17c1e8" icon={LocalShippingIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مسلّمة"            value={deliveredCount} color="#66BB6A" icon={ReceiptIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مسودات"           value={draftCount}    color="#fb8c00" icon={ReceiptIcon} />
          </Grid>
        </Grid>

        {/* Table Card */}
        <Card>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {[
                { label: "الكل",      count: mockInvoices.length },
                { label: "مسودات",   count: draftCount },
                { label: "في الطريق", count: sentCount },
                { label: "مسلّمة",    count: deliveredCount },
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
            <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
              <TextField
                size="small"
                placeholder="بحث برقم الفاتورة أو الزبون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ width: 280 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">كل الولايات</MenuItem>
                  {WILAYAS.map((w) => (
                    <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SoftBox>

            <SoftBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["رقم الفاتورة", "التاريخ", "الولاية", "الزبون", "السائق", "الطلبيات", "الأصناف", "الوزن", "الطباعة", "الحالة", "إجراء"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, i) => {
                    const sc = statusConfig[inv.status];
                    return (
                      <tr key={inv.id} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="info"
                            sx={{ cursor: "pointer" }} onClick={() => navigate(`/road-invoices/${inv.id}`)}>
                            {inv.id}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{inv.date}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{inv.wilaya}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{inv.customer}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{inv.driver}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{inv.ordersCount}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption">{inv.itemsCount}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{inv.totalWeight}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color={inv.printCount > 0 ? "success" : "secondary"}>
                            {inv.printCount > 0 ? `×${inv.printCount}` : "لم تُطبع"}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge variant="gradient" color={sc.color} size="xs" badgeContent={sc.label} container />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBox display="flex" gap={0.5}>
                            <Tooltip title="عرض">
                              <IconButton size="small" onClick={() => navigate(`/road-invoices/${inv.id}`)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="طباعة">
                              <IconButton size="small" sx={{ color: "#344767" }}>
                                <PrintIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="إرسال عبر واتساب PDF">
                              <IconButton size="small" sx={{ color: "#25D366" }}>
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </SoftBox>
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

export default RoadInvoices;
