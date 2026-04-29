/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { reportsApi, dashboardApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const COLORS = ["#17c1e8", "#82d616", "#fb8c00", "#ea0606", "#7928ca", "#344767"];
const fmt = (v) => Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function periodDates(period) {
  const now = new Date();
  let from = new Date(now);
  if (period === "week") from.setDate(now.getDate() - 7);
  else if (period === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === "quarter") from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else from = new Date(now.getFullYear(), 0, 1);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold" textTransform="uppercase" display="block" mb={0.5}>
        {label}
      </SoftTypography>
      <SoftTypography variant="h3" fontWeight="bold" color={color || "text"}>{value}</SoftTypography>
    </Card>
  );
}

function LoadingBox() {
  return (
    <SoftBox display="flex" justifyContent="center" py={6}>
      <CircularProgress size={32} />
    </SoftBox>
  );
}

function EmptyBox({ text = "لا توجد بيانات للفترة المحددة" }) {
  return (
    <SoftBox textAlign="center" py={6}>
      <SoftTypography variant="body2" color="secondary">{text}</SoftTypography>
    </SoftBox>
  );
}

function ReportErrorBox({ message }) {
  return (
    <Alert severity="error">
      {message}
    </Alert>
  );
}

// ─── Orders Tab (uses dashboard stats) ───────────────────────────────────────
function OrdersReport({ stats }) {
  if (!stats) return <LoadingBox />;
  const byStatus = stats.ordersByStatus || [];
  const monthly = stats.monthlySales || [];
  const maxRevenue = Math.max(...monthly.map((m) => Number(m.revenue || 0)), 1);

  return (
    <SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={3}><StatCard label="إجمالي الطلبيات" value={fmt(stats.totalOrders)} color="info" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="مكتملة + مشحونة" value={fmt(stats.completedOrders)} color="success" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="في الانتظار" value={fmt(stats.pendingOrders)} color="warning" /></Grid>
        <Grid item xs={6} sm={3}><StatCard label="مبيعات هذا الشهر" value={`${fmt(stats.revenueThisMonth)} دج`} color="dark" /></Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3 }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>المبيعات الشهرية</SoftTypography>
            {monthly.length === 0 ? <EmptyBox /> : (
              <SoftBox>
                <SoftBox display="flex" alignItems="flex-end" gap={1} height={140} mb={1}>
                  {monthly.map((m, i) => {
                    const pct = Math.round((Number(m.revenue || 0) / maxRevenue) * 100);
                    return (
                      <SoftBox key={m.month} flex={1} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                        <SoftTypography variant="caption" color="info" sx={{ fontSize: 9 }}>
                          {fmt(Number(m.revenue) / 1000)}k
                        </SoftTypography>
                        <SoftBox sx={{ width: "100%", background: COLORS[i % COLORS.length],
                          borderRadius: "4px 4px 0 0", height: `${Math.max(pct, 4)}%` }} />
                        <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 9 }}>
                          {(m.month_label || m.month || "").slice(0, 3)}
                        </SoftTypography>
                      </SoftBox>
                    );
                  })}
                </SoftBox>
                <SoftBox display="flex" gap={2} flexWrap="wrap">
                  {monthly.map((m) => (
                    <SoftBox key={m.month} textAlign="center">
                      <SoftTypography variant="caption" fontWeight="bold" display="block">{m.orders_count} طلبية</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 9 }}>{m.month_label || m.month}</SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              </SoftBox>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: "100%" }}>
            <SoftTypography variant="h6" fontWeight="bold" mb={2}>توزيع حالات الطلبيات</SoftTypography>
            {byStatus.length === 0 ? <EmptyBox /> : (() => {
              const total = byStatus.reduce((s, r) => s + Number(r.count || 0), 0);
              const LABELS = { draft: "مسودة", submitted: "مرسلة", under_review: "قيد المراجعة",
                confirmed: "مؤكدة", shipped: "مشحونة", completed: "مكتملة", cancelled: "ملغاة", rejected: "مرفوضة" };
              return byStatus.map((row, i) => {
                const pct = total > 0 ? Math.round((Number(row.count) / total) * 100) : 0;
                return (
                  <SoftBox key={row.status} mb={2}>
                    <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                      <SoftTypography variant="caption" color="text">{LABELS[row.status] || row.status}</SoftTypography>
                      <SoftTypography variant="caption" fontWeight="bold">{row.count} ({pct}%)</SoftTypography>
                    </SoftBox>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, bgcolor: "#e9ecef",
                        "& .MuiLinearProgress-bar": { background: COLORS[i % COLORS.length] } }} />
                  </SoftBox>
                );
              });
            })()}
          </Card>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsReport({ from, to }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    reportsApi.salesByProduct(from, to)
      .then((r) => setData(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError, "تعذر تحميل تقرير الأصناف"));
        setData([]);
      });
  }, [from, to]);

  if (!data) return <LoadingBox />;
  if (error) return <ReportErrorBox message={error} />;
  if (data.length === 0) return <EmptyBox />;

  const maxQty = Math.max(...data.map((d) => Number(d.totalQty || d.qty || 0)), 1);

  return (
    <Card sx={{ p: 3 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>أكثر الأصناف مبيعاً</SoftTypography>
      {data.slice(0, 10).map((p, i) => {
        const qty = Number(p.totalQty || p.qty || 0);
        const pct = Math.round((qty / maxQty) * 100);
        return (
          <SoftBox key={p.entityId || i} mb={2.5}>
            <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftBox sx={{ width: 24, height: 24, borderRadius: 1, background: COLORS[i % COLORS.length],
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: "bold" }}>
                  {i + 1}
                </SoftBox>
                <SoftTypography variant="button" fontWeight="medium">{p.entityName || p.name || "—"}</SoftTypography>
              </SoftBox>
              <SoftBox textAlign="right">
                <SoftTypography variant="caption" fontWeight="bold" display="block">{fmt(qty)} وحدة</SoftTypography>
                <SoftTypography variant="caption" color="secondary">{fmt(p.totalAmount)} دج</SoftTypography>
              </SoftBox>
            </SoftBox>
            <LinearProgress variant="determinate" value={pct}
              sx={{ height: 6, borderRadius: 3, bgcolor: "#e9ecef",
                "& .MuiLinearProgress-bar": { background: COLORS[i % COLORS.length] } }} />
          </SoftBox>
        );
      })}
    </Card>
  );
}

// ─── Sales Reps Tab ───────────────────────────────────────────────────────────
function SalesRepsReport({ from, to }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    reportsApi.salesBySalesperson(from, to)
      .then((r) => setData(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError, "تعذر تحميل تقرير البائعين"));
        setData([]);
      });
  }, [from, to]);

  if (!data) return <LoadingBox />;
  if (error) return <ReportErrorBox message={error} />;
  if (data.length === 0) return <EmptyBox text="لا توجد مبيعات مكتملة في هذه الفترة" />;

  const maxAmount = Math.max(...data.map((d) => Number(d.totalAmount || 0)), 1);

  return (
    <Card sx={{ p: 3 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>أداء البائعين</SoftTypography>
      <SoftBox sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              {["البائع", "عدد الطلبيات", "إجمالي المبيعات", "المشاركة"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "right" }}>
                  <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((sp, i) => {
              const pct = Math.round((Number(sp.totalAmount || 0) / maxAmount) * 100);
              return (
                <tr key={sp.entityId || i} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftBox display="flex" alignItems="center" gap={1.5}>
                      <SoftBox sx={{ width: 36, height: 36, borderRadius: "50%", background: COLORS[i % COLORS.length],
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: "bold" }}>
                        {(sp.entityName || "?")[0]}
                      </SoftBox>
                      <SoftTypography variant="button" fontWeight="medium">{sp.entityName || "—"}</SoftTypography>
                    </SoftBox>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftTypography variant="caption" fontWeight="bold">{sp.orderCount}</SoftTypography>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftTypography variant="caption" fontWeight="bold">{fmt(sp.totalAmount)} دج</SoftTypography>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: "#e9ecef", width: 80,
                          "& .MuiLinearProgress-bar": { background: COLORS[i % COLORS.length] } }} />
                      <SoftTypography variant="caption" fontWeight="bold">{pct}%</SoftTypography>
                    </SoftBox>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SoftBox>
    </Card>
  );
}

// ─── Customers Tab ────────────────────────────────────────────────────────────
function CustomersReport({ from, to }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    reportsApi.salesByCustomer(from, to)
      .then((r) => setData(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch((apiError) => {
        setError(getApiErrorMessage(apiError, "تعذر تحميل تقرير الزبائن"));
        setData([]);
      });
  }, [from, to]);

  if (!data) return <LoadingBox />;
  if (error) return <ReportErrorBox message={error} />;
  if (data.length === 0) return <EmptyBox text="لا توجد مبيعات مكتملة في هذه الفترة" />;

  const maxAmount = Math.max(...data.map((d) => Number(d.totalAmount || 0)), 1);

  return (
    <Card sx={{ p: 3 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>أفضل الزبائن</SoftTypography>
      {data.slice(0, 10).map((c, i) => {
        const pct = Math.round((Number(c.totalAmount || 0) / maxAmount) * 100);
        return (
          <SoftBox key={c.entityId || i} mb={2}>
            <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftBadge variant="gradient" color="info" size="xs" badgeContent={i + 1} container />
                <SoftTypography variant="caption" fontWeight="medium">{c.entityName || "—"}</SoftTypography>
              </SoftBox>
              <SoftBox textAlign="right">
                <SoftTypography variant="caption" fontWeight="bold" color="info" display="block">
                  {fmt(c.totalAmount)} دج
                </SoftTypography>
                <SoftTypography variant="caption" color="secondary">{c.orderCount} طلبية</SoftTypography>
              </SoftBox>
            </SoftBox>
            <LinearProgress variant="determinate" value={pct}
              sx={{ height: 6, borderRadius: 3, bgcolor: "#e9ecef",
                "& .MuiLinearProgress-bar": { background: COLORS[i % COLORS.length] } }} />
          </SoftBox>
        );
      })}
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Reports() {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  const { from, to } = periodDates(period);

  useEffect(() => {
    setLoadError("");
    dashboardApi.getStats()
      .then((r) => setStats(r.data))
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل بيانات التقارير"));
        setStats(null);
      });
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">التقارير</SoftTypography>
            <SoftTypography variant="body2" color="text">تحليلات ومؤشرات أداء النظام</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            <TextField select size="small" value={period}
              onChange={(e) => setPeriod(e.target.value)} sx={{ width: 140 }}>
              <MenuItem value="week">هذا الأسبوع</MenuItem>
              <MenuItem value="month">هذا الشهر</MenuItem>
              <MenuItem value="quarter">هذا الربع</MenuItem>
              <MenuItem value="year">هذه السنة</MenuItem>
            </TextField>
            <SoftTypography variant="caption" color="secondary">
              {from} → {to}
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {["الطلبيات", "الأصناف", "البائعون", "الزبائن"].map((t) => (
                <Tab key={t} label={<SoftTypography variant="caption" fontWeight="medium">{t}</SoftTypography>} />
              ))}
            </Tabs>
          </SoftBox>
          <SoftBox p={3}>
            {tab === 0 && <OrdersReport stats={stats} />}
            {tab === 1 && <ProductsReport from={from} to={to} />}
            {tab === 2 && <SalesRepsReport from={from} to={to} />}
            {tab === 3 && <CustomersReport from={from} to={to} />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Reports;
