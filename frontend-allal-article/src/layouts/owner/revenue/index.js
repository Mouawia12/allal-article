/* eslint-disable react/prop-types */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { useI18n } from "i18n";
import { mockOwnerStats, mockTenants, mockPlans, statusConfig } from "data/mock/ownerMock";

const fmt = (n) => n?.toLocaleString("fr-DZ") ?? "—";

export default function OwnerRevenue() {
  const { t: translate } = useI18n();
  const s = mockOwnerStats;
  const max = Math.max(...s.monthlyRevenue.map((m) => m.revenue));
  const currency = translate("دج");

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>تقرير الإيرادات</Box>
          <Box sx={{ fontSize: 13, color: "#8392ab" }}>ملخص مالي شامل لاشتراكات المنصة</Box>
        </Box>

        {/* Summary KPIs */}
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "MRR", value: `${fmt(s.mrr)} ${currency}`, sub: "الإيراد الشهري المتكرر", color: "#17c1e8" },
            { label: "ARR", value: `${fmt(s.arr)} ${currency}`, sub: "الإيراد السنوي المتوقع", color: "#7928ca" },
            { label: "ARPU", value: `${fmt(Math.round(s.mrr / (s.activeCount || 1)))} ${currency}`, sub: "متوسط الإيراد لكل مشترك", color: "#82d616" },
          ].map(({ label, value, sub, color }) => (
            <Card key={label} sx={{ flex: 1, minWidth: 180, p: 2.5 }}>
              <Box sx={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", mb: 0.5 }}>{label}</Box>
              <Box sx={{ fontSize: 22, fontWeight: 800, color: "#344767" }}>{value}</Box>
              <Box sx={{ fontSize: 11, color: "#8392ab" }}>{sub}</Box>
            </Card>
          ))}
        </Box>

        {/* Monthly chart */}
        <Card sx={{ p: 2.5, mb: 3 }}>
          <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767", mb: 0.5 }}>الإيراد الشهري</Box>
          <Box sx={{ fontSize: 11, color: "#8392ab", mb: 2 }}>آخر 6 أشهر (دج)</Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", height: 160 }}>
            {s.monthlyRevenue.map((m) => {
              const pct = max > 0 ? (m.revenue / max) * 100 : 0;
              return (
                <Box key={m.month} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ color: "#344767", fontSize: 11, fontWeight: 600 }}>{fmt(m.revenue)}</Box>
                  <Box
                    sx={{
                      width: "100%", height: `${pct}%`, minHeight: 6,
                      background: "linear-gradient(180deg, #17c1e8 0%, #0ea5c9 100%)",
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                  <Box sx={{ color: "#adb5bd", fontSize: 10, textAlign: "center" }}>{m.month}</Box>
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Per-tenant revenue table */}
        <Card>
          <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
            <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767" }}>إيراد كل مشترك</Box>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["الشركة", "الخطة", "الحالة", "الاشتراك الشهري", "تاريخ التجديد"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {mockTenants.filter((t) => t.status !== "cancelled").map((t) => {
                  const plan = mockPlans.find((p) => p.id === t.planId);
                  const sc = statusConfig[t.status];
                  const monthly = plan?.priceMonthly ?? 0;
                  return (
                    <TableRow key={t.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>{t.name}</TableCell>
                      <TableCell>
                        <Chip label={plan?.nameAr} size="small"
                          sx={{ fontSize: 10, fontWeight: 600, color: plan?.color, background: `${plan?.color}18` }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sc?.labelAr} size="small" sx={{ background: sc?.bg, color: sc?.color, fontWeight: 600, fontSize: 10 }} />
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 13, fontWeight: 700, color: monthly > 0 ? "#17c1e8" : "#8392ab" }}>
                        {monthly > 0 ? `${fmt(monthly)} ${currency}` : "مجاني"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>
                        {t.subscriptionRenewsAt ?? (t.trialEndsAt ? `${translate("تجريبي")} ${translate("حتى")} ${t.trialEndsAt}` : "—")}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals row */}
                <TableRow sx={{ background: "#f8f9fa", borderTop: "2px solid #dee2e6" }}>
                  <TableCell colSpan={3} sx={{ fontSize: 12, fontWeight: 700, color: "#344767" }}>الإجمالي الشهري</TableCell>
                  <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 15, fontWeight: 800, color: "#17c1e8" }}>
                    {fmt(s.mrr)} {currency}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </OwnerLayout>
  );
}
