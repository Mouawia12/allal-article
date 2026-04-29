/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { dashboardApi } from "services";

const formatDZD = (v) =>
  Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_LABELS = {
  draft:        { label: "مسودة",        color: "#8392ab" },
  submitted:    { label: "مرسلة",        color: "#17c1e8" },
  under_review: { label: "قيد المراجعة", color: "#fb8c00" },
  confirmed:    { label: "مؤكدة",        color: "#82d616" },
  shipped:      { label: "مشحونة",       color: "#82d616" },
  completed:    { label: "مكتملة",       color: "#344767" },
  cancelled:    { label: "ملغاة",        color: "#ea0606" },
  rejected:     { label: "مرفوضة",       color: "#ea0606" },
};

function StatCard({ label, value, sub, color, trend }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold" textTransform="uppercase" display="block" mb={0.5}>
        {label}
      </SoftTypography>
      <SoftTypography variant="h3" fontWeight="bold" color={color || "text"}>{value}</SoftTypography>
      {sub && <SoftTypography variant="caption" color="text" display="block">{sub}</SoftTypography>}
      {trend != null && (
        <SoftBadge variant="gradient" color={trend >= 0 ? "success" : "error"} size="xs"
          badgeContent={`${trend >= 0 ? "+" : ""}${trend}%`} container sx={{ mt: 0.5 }} />
      )}
    </Card>
  );
}

function MiniBarChart({ data = [] }) {
  if (!data.length) {
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center" height={120}>
        <SoftTypography variant="caption" color="secondary">لا توجد بيانات بعد</SoftTypography>
      </SoftBox>
    );
  }
  const maxVal = Math.max(...data.map((d) => Number(d.revenue || 0)), 1);
  return (
    <SoftBox display="flex" alignItems="flex-end" gap={1} height={120} pt={1}>
      {data.map((d) => {
        const pct = Math.round((Number(d.revenue || 0) / maxVal) * 100);
        return (
          <SoftBox key={d.month} flex={1} display="flex" flexDirection="column" alignItems="center" gap={0.5}>
            <SoftTypography variant="caption" color="info" fontWeight="bold" sx={{ fontSize: 9 }}>
              {formatDZD(d.revenue / 1000)}k
            </SoftTypography>
            <SoftBox
              sx={{
                width: "100%", background: "linear-gradient(195deg,#49a3f1,#1A73E8)",
                borderRadius: "4px 4px 0 0", transition: "height 0.4s",
                height: `${Math.max(pct, 4)}%`,
              }}
            />
            <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 9, whiteSpace: "nowrap" }}>
              {(d.month_label || d.month || "").slice(0, 3)}
            </SoftTypography>
          </SoftBox>
        );
      })}
    </SoftBox>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const s = stats || {};
  const monthlySales = s.monthlySales || [];
  const byStatus = s.ordersByStatus || [];
  const topCustomers = s.topCustomers || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── KPI Row ── */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} xl={3}>
            <StatCard
              label="إجمالي الطلبيات"
              value={formatDZD(s.totalOrders || 0)}
              sub={`هذا الشهر: ${s.ordersThisMonth || 0}`}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <StatCard
              label="المبيعات هذا الشهر"
              value={`${formatDZD(s.revenueThisMonth || 0)} دج`}
              sub={`الإجمالي: ${formatDZD(s.totalRevenue || 0)} دج`}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <StatCard
              label="الزبائن النشطون"
              value={formatDZD(s.totalCustomers || 0)}
              sub="إجمالي الزبائن"
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} xl={3}>
            <StatCard
              label="الأصناف النشطة"
              value={formatDZD(s.totalProducts || 0)}
              sub={s.lowStockProducts > 0 ? `${s.lowStockProducts} صنف منخفض المخزون` : "المخزون طبيعي"}
              color={s.lowStockProducts > 0 ? "error" : "text"}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} mb={3}>
          {/* Monthly sales chart */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 2.5, height: "100%" }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={0.5}>
                المبيعات الشهرية (6 أشهر)
              </SoftTypography>
              <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                الطلبيات المكتملة والمشحونة
              </SoftTypography>
              <MiniBarChart data={monthlySales} />
              {monthlySales.length > 0 && (
                <SoftBox display="flex" gap={3} mt={2} flexWrap="wrap">
                  {monthlySales.map((d) => (
                    <SoftBox key={d.month} textAlign="center">
                      <SoftTypography variant="caption" fontWeight="bold" color="text" display="block">
                        {d.orders_count} طلبية
                      </SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block" sx={{ fontSize: 10 }}>
                        {d.month_label || d.month}
                      </SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              )}
            </Card>
          </Grid>

          {/* Orders by status */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2.5, height: "100%" }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                توزيع الطلبيات حسب الحالة
              </SoftTypography>
              {byStatus.length === 0 ? (
                <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>
                  لا توجد طلبيات بعد
                </SoftTypography>
              ) : (
                <SoftBox display="flex" flexDirection="column" gap={1.5}>
                  {byStatus.map((row) => {
                    const cfg = STATUS_LABELS[row.status] || { label: row.status, color: "#8392ab" };
                    const total = byStatus.reduce((sum, r) => sum + Number(r.count || 0), 0);
                    const pct = total > 0 ? Math.round((Number(row.count) / total) * 100) : 0;
                    return (
                      <SoftBox key={row.status}>
                        <SoftBox display="flex" justifyContent="space-between" mb={0.3}>
                          <SoftTypography variant="caption" fontWeight="medium">{cfg.label}</SoftTypography>
                          <SoftTypography variant="caption" color="secondary">{row.count} ({pct}%)</SoftTypography>
                        </SoftBox>
                        <SoftBox sx={{ height: 6, background: "#f0f2f5", borderRadius: 3, overflow: "hidden" }}>
                          <SoftBox sx={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 3, transition: "width 0.5s" }} />
                        </SoftBox>
                      </SoftBox>
                    );
                  })}
                </SoftBox>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Pending + Top customers */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={0.5}>في الانتظار</SoftTypography>
              <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                طلبيات تحتاج متابعة
              </SoftTypography>
              <SoftTypography variant="h2" fontWeight="bold" color="warning">
                {s.pendingOrders || 0}
              </SoftTypography>
              <SoftTypography variant="caption" color="text">مرسلة / قيد المراجعة / مؤكدة</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={0.5}>منجزة</SoftTypography>
              <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                طلبيات مكتملة / مشحونة
              </SoftTypography>
              <SoftTypography variant="h2" fontWeight="bold" color="success">
                {s.completedOrders || 0}
              </SoftTypography>
              <SoftTypography variant="caption" color="text">مكتملة + مشحونة</SoftTypography>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>أفضل الزبائن هذا الشهر</SoftTypography>
              {topCustomers.length === 0 ? (
                <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>
                  لا توجد مبيعات مكتملة هذا الشهر
                </SoftTypography>
              ) : (
                <SoftBox display="flex" flexDirection="column" gap={1}>
                  {topCustomers.map((c, i) => (
                    <SoftBox key={i} display="flex" justifyContent="space-between" alignItems="center"
                      p={1} sx={{ background: i % 2 === 0 ? "#f8f9fa" : "#fff", borderRadius: 1 }}>
                      <SoftBox display="flex" alignItems="center" gap={1.5}>
                        <SoftBox sx={{ width: 24, height: 24, borderRadius: "50%", background: "#17c1e8",
                          display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <SoftTypography variant="caption" color="white" fontWeight="bold">{i + 1}</SoftTypography>
                        </SoftBox>
                        <SoftTypography variant="caption" fontWeight="medium">{c.name}</SoftTypography>
                      </SoftBox>
                      <SoftBox textAlign="right">
                        <SoftTypography variant="caption" fontWeight="bold" color="info" display="block">
                          {formatDZD(c.total)} دج
                        </SoftTypography>
                        <SoftTypography variant="caption" color="secondary">{c.orders_count} طلبية</SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
