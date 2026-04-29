/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { useI18n } from "i18n";
import { planColors, statusConfig } from "data/mock/ownerMock";
import ownerApi from "services/ownerApi";

const fmt = (n) => (n != null ? Number(n).toLocaleString("fr-DZ") : "—");

export default function OwnerRevenue() {
  const { t: translate } = useI18n();
  const currency = translate("دج");

  const [revenue, setRevenue] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      ownerApi.getRevenue(),
      ownerApi.listTenants(),
    ])
      .then(([rv, tn]) => {
        setRevenue(rv.data ?? null);
        setTenants(tn.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const mrr = revenue?.mrr ?? 0;
  const arr = mrr * 12;
  const activeTenants = tenants.filter((t) => t.status === "active" || t.status === "trial");
  const arpu = activeTenants.length > 0 ? Math.round(mrr / activeTenants.length) : 0;
  const monthly = revenue?.monthly ?? [];
  const max = monthly.length > 0 ? Math.max(...monthly.map((m) => Number(m.revenue ?? 0))) : 0;

  if (loading) {
    return (
      <OwnerLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </OwnerLayout>
    );
  }

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
            { label: "MRR", value: `${fmt(mrr)} ${currency}`, sub: "الإيراد الشهري المتكرر", color: "#17c1e8" },
            { label: "ARR", value: `${fmt(arr)} ${currency}`, sub: "الإيراد السنوي المتوقع", color: "#7928ca" },
            { label: "ARPU", value: `${fmt(arpu)} ${currency}`, sub: "متوسط الإيراد لكل مشترك", color: "#82d616" },
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
          {monthly.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, color: "#8392ab", fontSize: 13 }}>لا توجد بيانات إيراد بعد</Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", height: 160 }}>
              {monthly.map((m) => {
                const pct = max > 0 ? (Number(m.revenue) / max) * 100 : 0;
                return (
                  <Box key={m.month} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                    <Box sx={{ color: "#344767", fontSize: 11, fontWeight: 600 }}>{fmt(m.revenue)}</Box>
                    <Box sx={{
                      width: "100%", height: `${pct}%`, minHeight: 6,
                      background: "linear-gradient(180deg, #17c1e8 0%, #0ea5c9 100%)",
                      borderRadius: "6px 6px 0 0",
                    }} />
                    <Box sx={{ color: "#adb5bd", fontSize: 10, textAlign: "center" }}>{m.month}</Box>
                  </Box>
                );
              })}
            </Box>
          )}
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
                  {["الشركة", "الخطة", "الحالة", "الاشتراك الشهري", "تاريخ الإنشاء"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", color: "#8392ab", fontSize: 13, py: 4 }}>
                      لا يوجد مشتركون نشطون بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {activeTenants.map((t) => {
                      const sc = statusConfig[t.status] ?? statusConfig.active;
                      const color = planColors[t.plan_code] ?? "#8392ab";
                      const monthly = Number(t.price_monthly ?? 0);
                      return (
                        <TableRow key={t.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                          <TableCell sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>{t.company_name}</TableCell>
                          <TableCell>
                            <Chip label={t.plan_name ?? t.plan_code} size="small"
                              sx={{ fontSize: 10, fontWeight: 600, color, background: `${color}18` }} />
                          </TableCell>
                          <TableCell>
                            <Chip label={sc.labelAr} size="small"
                              sx={{ background: sc.bg, color: sc.color, fontWeight: 600, fontSize: 10 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, fontWeight: 700, color: monthly > 0 ? "#17c1e8" : "#8392ab" }}>
                            {monthly > 0 ? `${fmt(monthly)} ${currency}` : "مجاني"}
                          </TableCell>
                          <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>
                            {t.created_at ? new Date(t.created_at).toLocaleDateString("ar-DZ") : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ background: "#f8f9fa", borderTop: "2px solid #dee2e6" }}>
                      <TableCell colSpan={3} sx={{ fontSize: 12, fontWeight: 700, color: "#344767" }}>الإجمالي الشهري</TableCell>
                      <TableCell sx={{ fontSize: 15, fontWeight: 800, color: "#17c1e8" }}>
                        {fmt(mrr)} {currency}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </OwnerLayout>
  );
}
