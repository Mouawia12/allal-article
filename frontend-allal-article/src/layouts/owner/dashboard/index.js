/* eslint-disable react/prop-types */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { useI18n } from "i18n";
import { mockOwnerStats, mockProvisioningEvents, mockPlans, planColors, statusConfig } from "data/mock/ownerMock";

const fmt = (n) => n?.toLocaleString("fr-DZ") ?? "—";

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <Card sx={{ flex: 1, minWidth: 160, p: 2.5, display: "flex", gap: 2, alignItems: "flex-start" }}>
      <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Box sx={{ color: "#fff", display: "flex" }}>{icon}</Box>
      </Box>
      <Box>
        <Box sx={{ color: "#8392ab", fontSize: 12, mb: 0.3 }}>{label}</Box>
        <Box sx={{ color: "#344767", fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</Box>
        {sub && <Box sx={{ color: "#8392ab", fontSize: 11, mt: 0.5 }}>{sub}</Box>}
      </Box>
    </Card>
  );
}

// ─── Revenue Bar ─────────────────────────────────────────────────────────────
function RevenueBar({ months, currency }) {
  const max = Math.max(...months.map((m) => m.revenue));
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.8, height: 100, mt: 1 }}>
      {months.map((m) => {
        const pct = max > 0 ? (m.revenue / max) * 100 : 0;
        return (
          <Box key={m.month} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ color: "#8392ab", fontSize: 9, textAlign: "center" }}>{fmt(m.revenue)}</Box>
            <Box
              title={`${m.month}: ${fmt(m.revenue)} ${currency}`}
              sx={{
                width: "100%", height: `${pct}%`, minHeight: 4,
                background: "linear-gradient(180deg, #17c1e8, #0ea5c9)",
                borderRadius: "4px 4px 0 0",
                cursor: "default",
                "&:hover": { opacity: 0.8 },
              }}
            />
            <Box sx={{ color: "#adb5bd", fontSize: 9, textAlign: "center", writingMode: "vertical-lr", transform: "rotate(180deg)", height: 36 }}>
              {m.month}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Event type label ─────────────────────────────────────────────────────────
const eventLabels = {
  tenant_created:   { label: "تأسيس مشترك",   color: "#82d616", bg: "#f0fde4" },
  plan_upgraded:    { label: "ترقية الخطة",    color: "#17c1e8", bg: "#e3f8fd" },
  tenant_suspended: { label: "إيقاف مشترك",   color: "#ea0606", bg: "#ffeaea" },
  tenant_cancelled: { label: "إلغاء مشترك",   color: "#8392ab", bg: "#f8f9fa" },
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const { t } = useI18n();
  const s = mockOwnerStats;
  const currency = t("دج");

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>

        {/* Page title */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>لوحة تحكم المالك</Box>
          <Box sx={{ fontSize: 13, color: "#8392ab" }}>نظرة عامة على اشتراكات المنصة والإيرادات</Box>
        </Box>

        {/* KPI cards */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <StatCard
            icon={<TrendingUpIcon />}
            label="MRR (الإيراد الشهري)"
            value={`${fmt(s.mrr)} ${currency}`}
            sub={`ARR: ${fmt(s.arr)} ${currency}`}
            color="linear-gradient(135deg, #17c1e8, #0ea5c9)"
          />
          <StatCard
            icon={<GroupIcon />}
            label="المشتركون النشطون"
            value={s.activeCount}
            sub={`${t("تجريبي")}: ${s.trialCount} · ${t("موقوف")}: ${s.suspendedCount}`}
            color="linear-gradient(135deg, #82d616, #5faa0e)"
          />
          <StatCard
            icon={<ReceiptLongIcon />}
            label="الطلبيات هذا الشهر"
            value={fmt(s.ordersThisMonth)}
            sub={`${t("الإجمالي")}: ${fmt(s.totalOrders)}`}
            color="linear-gradient(135deg, #7928ca, #5e1e9e)"
          />
          <StatCard
            icon={<NewReleasesIcon />}
            label="مشتركون جدد هذا الشهر"
            value={s.newThisMonth}
            sub={`${t("إلغاءات")}: ${s.churnedThisMonth}`}
            color="linear-gradient(135deg, #fb8c00, #e07b00)"
          />
        </Box>

        {/* Revenue chart + Plan breakdown */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>

          {/* Monthly Revenue Chart */}
          <Card sx={{ flex: 2, minWidth: 300, p: 2.5 }}>
            <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767", mb: 0.5 }}>الإيراد الشهري</Box>
            <Box sx={{ fontSize: 11, color: "#8392ab", mb: 1 }}>آخر 6 أشهر (دج)</Box>
            <RevenueBar months={s.monthlyRevenue} currency={currency} />
          </Card>

          {/* Revenue by plan */}
          <Card sx={{ flex: 1, minWidth: 220, p: 2.5 }}>
            <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767", mb: 1.5 }}>توزيع الخطط</Box>
            {s.revenueByPlan.map((item) => {
              const plan = mockPlans.find((p) => p.id === item.planId);
              const pct = s.activeCount > 0 ? Math.round((item.count / s.totalCount) * 100) : 0;
              return (
                <Box key={item.planId} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                    <Box sx={{ fontSize: 12, fontWeight: 600, color: plan?.color ?? "#344767" }}>{item.planName}</Box>
                    <Box sx={{ fontSize: 11, color: "#8392ab" }}>{item.count} · {fmt(item.revenue)} {currency}</Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 6, borderRadius: 3, background: "#f0f2f5",
                      "& .MuiLinearProgress-bar": { background: plan?.color ?? "#17c1e8", borderRadius: 3 },
                    }}
                  />
                </Box>
              );
            })}
          </Card>
        </Box>

        {/* Tenant status overview */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <Card key={key} sx={{ flex: 1, minWidth: 110, p: 2, textAlign: "center", border: `1px solid ${cfg.color}22` }}>
              <Box sx={{ fontSize: 22, fontWeight: 700, color: cfg.color }}>
                {key === "active" ? s.activeCount : key === "trial" ? s.trialCount : key === "suspended" ? s.suspendedCount : s.cancelledCount}
              </Box>
              <Box sx={{ fontSize: 12, color: "#8392ab" }}>{cfg.labelAr}</Box>
            </Card>
          ))}
        </Box>

        {/* Recent provisioning events */}
        <Card>
          <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
            <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767" }}>آخر العمليات</Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["التاريخ", "المشترك", "العملية", "المنفذ", "التفاصيل"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockProvisioningEvents.map((ev) => {
                  const cfg = eventLabels[ev.event];
                  return (
                    <TableRow key={ev.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab", whiteSpace: "nowrap" }}>{ev.createdAt}</TableCell>
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#344767" }}>{ev.tenantName}</TableCell>
                      <TableCell>
                        <Chip label={cfg?.label ?? ev.event} size="small"
                          sx={{ background: cfg?.bg, color: cfg?.color, fontWeight: 600, fontSize: 10 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{ev.performedBy}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#344767" }}>{ev.details}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

      </Box>
    </OwnerLayout>
  );
}
