/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import GradientLineChart from "examples/Charts/LineCharts/GradientLineChart";

// ─── Mock Charts Data ─────────────────────────────────────────────────────────
const ordersChartData = {
  labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
  datasets: [
    { label: "طلبيات مؤكدة", color: "success",   data: [32, 28, 45, 38, 52, 61] },
    { label: "طلبيات ملغاة", color: "error",     data: [4,  6,  3,  5,  2,  3 ] },
  ],
};

const salesLineData = {
  labels: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"],
  datasets: [
    { label: "المبيعات (ألف دج)", data: [145, 132, 198, 172, 234, 287], color: "info" },
  ],
};

const reportsBarData = {
  chart: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: { label: "Sales", data: [450, 200, 100, 220, 500, 100] },
  },
  items: [
    { icon: { color: "info", component: "library_books" }, label: "Users", progress: { content: "37K", percentage: 60 } },
    { icon: { color: "error", component: "touch_app" }, label: "Clicks", progress: { content: "2M", percentage: 80 } },
    { icon: { color: "primary", component: "payment" }, label: "Sales", progress: { content: "$435,000", percentage: 30 } },
    { icon: { color: "warning", component: "extension" }, label: "Items", progress: { content: "43,123", percentage: 50 } },
  ],
};

// ─── Top Products ─────────────────────────────────────────────────────────────
const topProducts = [
  { rank: 1, name: "كابل كهربائي 2.5mm", code: "KBL-25",     qty: 1240, color: "#17c1e8", pct: 95 },
  { rank: 2, name: "برغي M10 × 50mm",   code: "BRG-010-50", qty: 980,  color: "#82d616", pct: 75 },
  { rank: 3, name: "كابل كهربائي 1.5mm", code: "KBL-15",    qty: 820,  color: "#fb8c00", pct: 63 },
  { rank: 4, name: "صامولة M10",         code: "SAM-010",    qty: 700,  color: "#ea0606", pct: 54 },
  { rank: 5, name: "شريط عازل كهربائي", code: "SHR-EL",     qty: 560,  color: "#7928ca", pct: 43 },
];

// ─── Top Salespersons ─────────────────────────────────────────────────────────
const topSalespeople = [
  { name: "محمد سعيد",  orders: 18, amount: "312,000", rate: 94, color: "#17c1e8" },
  { name: "شركة الرياض", orders: 12, amount: "145,200", rate: 92, color: "#82d616" },
  { name: "يوسف علي",   orders: 11, amount: "117,000", rate: 87, color: "#fb8c00" },
  { name: "خالد عمر",   orders: 10, amount: "98,000",  rate: 82, color: "#ea0606" },
  { name: "أحمد محمد",  orders: 8,  amount: "72,400",  rate: 75, color: "#7928ca" },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, color }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold" textTransform="uppercase" display="block" mb={0.5}>
        {label}
      </SoftTypography>
      <SoftTypography variant="h3" fontWeight="bold" color={color || "text"}>
        {value}
      </SoftTypography>
      {sub && <SoftTypography variant="caption" color="text">{sub}</SoftTypography>}
      {trend && (
        <SoftBadge
          variant="gradient"
          color={trend > 0 ? "success" : "error"}
          size="xs"
          badgeContent={`${trend > 0 ? "+" : ""}${trend}%`}
          container
          sx={{ mt: 0.5 }}
        />
      )}
    </Card>
  );
}

// ─── Orders Report Tab ────────────────────────────────────────────────────────
function OrdersReport() {
  return (
    <SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي الطلبيات"    value="256"      trend={12}  color="info" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="مؤكدة"              value="198"      trend={8}   color="success" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="ملغاة"              value="23"       trend={-5}  color="error" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي المبيعات"    value="1.17M دج" trend={15}  color="dark" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <ReportsBarChart
            title="الطلبيات الشهرية"
            description={<>المؤكدة مقارنة بالملغاة</>}
            chart={reportsBarData.chart}
            items={reportsBarData.items}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: "100%" }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>توزيع حالات الطلبيات</SoftTypography>
            {[
              { label: "مؤكدة",       value: 198, pct: 77, color: "#66BB6A" },
              { label: "مرسلة",       value: 22,  pct: 9,  color: "#17c1e8" },
              { label: "قيد المراجعة", value: 13,  pct: 5,  color: "#fb8c00" },
              { label: "ملغاة",       value: 15,  pct: 6,  color: "#ea0606" },
              { label: "مرفوضة",      value: 8,   pct: 3,  color: "#8392ab" },
            ].map((row) => (
              <SoftBox key={row.label} mb={2}>
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" color="text">{row.label}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">{row.value} ({row.pct}%)</SoftTypography>
                </SoftBox>
                <LinearProgress
                  variant="determinate"
                  value={row.pct}
                  sx={{
                    height: 8, borderRadius: 4, bgcolor: "#e9ecef",
                    "& .MuiLinearProgress-bar": { background: row.color },
                  }}
                />
              </SoftBox>
            ))}
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

// ─── Products Report Tab ──────────────────────────────────────────────────────
function ProductsReport() {
  return (
    <SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي الأصناف"     value="16"  color="info" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="أصناف نشطة"         value="14"  color="success" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="أصناف منخفضة"       value="3"   color="warning" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="أصناف نفذت"         value="1"   color="error" /></Grid>
      </Grid>
      <Card sx={{ p: 3 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>أكثر الأصناف مبيعاً</SoftTypography>
        {topProducts.map((p) => (
          <SoftBox key={p.rank} mb={2.5}>
            <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftBox
                  sx={{
                    width: 24, height: 24, borderRadius: 1,
                    background: p.color, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 11, fontWeight: "bold",
                  }}
                >
                  {p.rank}
                </SoftBox>
                <SoftTypography variant="button" fontWeight="medium">{p.name}</SoftTypography>
                <SoftTypography variant="caption" color="secondary">{p.code}</SoftTypography>
              </SoftBox>
              <SoftTypography variant="caption" fontWeight="bold">{p.qty.toLocaleString()} وحدة</SoftTypography>
            </SoftBox>
            <LinearProgress
              variant="determinate"
              value={p.pct}
              sx={{
                height: 6, borderRadius: 3, bgcolor: "#e9ecef",
                "& .MuiLinearProgress-bar": { background: p.color },
              }}
            />
          </SoftBox>
        ))}
      </Card>
    </SoftBox>
  );
}

// ─── Sales Reps Report Tab ────────────────────────────────────────────────────
function SalesRepsReport() {
  return (
    <SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="عدد البائعين"    value="5"       color="info" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي الطلبيات" value="256"     color="success" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="أعلى مبيعات"     value="312K دج" color="dark" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="معدل الإلغاء"    value="9%"      color="warning" /></Grid>
      </Grid>
      <Card sx={{ p: 3 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>أداء البائعين</SoftTypography>
        <SoftBox sx={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                {["البائع", "عدد الطلبيات", "إجمالي المبيعات (دج)", "معدل النجاح", "التقييم"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "right" }}>
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topSalespeople.map((sp, i) => (
                <tr key={sp.name} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftBox display="flex" alignItems="center" gap={1.5}>
                      <SoftBox
                        sx={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: sp.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontSize: 12, fontWeight: "bold",
                        }}
                      >
                        {sp.name[0]}
                      </SoftBox>
                      <SoftTypography variant="button" fontWeight="medium">{sp.name}</SoftTypography>
                    </SoftBox>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftTypography variant="caption" fontWeight="bold">{sp.orders}</SoftTypography>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftTypography variant="caption" fontWeight="bold">{sp.amount}</SoftTypography>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <LinearProgress
                        variant="determinate"
                        value={sp.rate}
                        sx={{
                          height: 6, borderRadius: 3, bgcolor: "#e9ecef", width: 80,
                          "& .MuiLinearProgress-bar": { background: sp.color },
                        }}
                      />
                      <SoftTypography variant="caption" fontWeight="bold">{sp.rate}%</SoftTypography>
                    </SoftBox>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftBadge
                      variant="gradient"
                      color={sp.rate >= 90 ? "success" : sp.rate >= 80 ? "info" : "warning"}
                      size="xs"
                      badgeContent={sp.rate >= 90 ? "ممتاز" : sp.rate >= 80 ? "جيد" : "متوسط"}
                      container
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SoftBox>
      </Card>
    </SoftBox>
  );
}

// ─── Inventory Report Tab ─────────────────────────────────────────────────────
function InventoryReport() {
  return (
    <SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي وحدات المخزون" value="4,395"  color="info" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="محجوز"                value="1,010"  color="warning" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="متاح"                 value="3,385"  color="success" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="نسبة الاستخدام"       value="23%"    color="dark" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>توزيع المخزون حسب الفئة</SoftTypography>
            {[
              { label: "مسامير وبراغي", value: 2650, pct: 60, color: "#FF6B6B" },
              { label: "كهرباء",        value: 1500, pct: 34, color: "#FFE66D" },
              { label: "أدوات",         value: 75,   pct: 2,  color: "#4ECDC4" },
              { label: "سباكة",         value: 265,  pct: 6,  color: "#A8E6CF" },
              { label: "دهانات",        value: 140,  pct: 3,  color: "#DDA0DD" },
            ].map((row) => (
              <SoftBox key={row.label} mb={2}>
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" color="text">{row.label}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">{row.value.toLocaleString()}</SoftTypography>
                </SoftBox>
                <LinearProgress
                  variant="determinate"
                  value={row.pct}
                  sx={{
                    height: 8, borderRadius: 4, bgcolor: "#e9ecef",
                    "& .MuiLinearProgress-bar": { background: row.color },
                  }}
                />
              </SoftBox>
            ))}
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>أصناف تحتاج تموين</SoftTypography>
            {[
              { name: "كماشة عالمية",    code: "KMA-UNI",    status: "نفذ",     color: "error" },
              { name: "أنبوب PVC 1 بوصة", code: "ANB-PVC-1", status: "منخفض",   color: "warning" },
              { name: "مفتاح ربط 17mm",  code: "MFT-017",    status: "منخفض",   color: "warning" },
              { name: "مفتاح ربط 22mm",  code: "MFT-022",    status: "منخفض",   color: "warning" },
            ].map((item) => (
              <SoftBox key={item.code} display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <SoftBox>
                  <SoftTypography variant="caption" fontWeight="bold">{item.name}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block">{item.code}</SoftTypography>
                </SoftBox>
                <SoftBadge variant="gradient" color={item.color} size="xs" badgeContent={item.status} container />
              </SoftBox>
            ))}
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Reports() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState("month");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">التقارير</SoftTypography>
            <SoftTypography variant="body2" color="text">تحليلات ومؤشرات أداء النظام</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            <TextField
              select
              size="small"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ width: 140 }}
            >
              <MenuItem value="week">هذا الأسبوع</MenuItem>
              <MenuItem value="month">هذا الشهر</MenuItem>
              <MenuItem value="quarter">هذا الربع</MenuItem>
              <MenuItem value="year">هذه السنة</MenuItem>
            </TextField>
            <SoftButton variant="outlined" color="secondary" size="small">تصدير</SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {["الطلبيات", "الأصناف", "البائعون", "المخزون"].map((t) => (
                <Tab key={t} label={<SoftTypography variant="caption" fontWeight="medium">{t}</SoftTypography>} />
              ))}
            </Tabs>
          </SoftBox>
          <SoftBox p={3}>
            {tab === 0 && <OrdersReport />}
            {tab === 1 && <ProductsReport />}
            {tab === 2 && <SalesRepsReport />}
            {tab === 3 && <InventoryReport />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Reports;
