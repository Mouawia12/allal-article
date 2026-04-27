/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PrintIcon from "@mui/icons-material/Print";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { accountingApi } from "services";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 2 }).format(n ?? 0) + " دج";

function BSSection({ title, color, lines, total }) {
  const grouped = (lines ?? []).reduce((acc, line) => {
    const key = line.lineCode || "other";
    if (!acc[key]) acc[key] = { label: line.lineCode || title, items: [] };
    acc[key].items.push(line);
    return acc;
  }, {});

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: `${color}20` }}>
            <TableCell sx={{ fontWeight: 700, color, fontSize: 13 }} colSpan={2}>{title}</TableCell>
            <TableCell sx={{ fontWeight: 700, color, fontSize: 13, textAlign: "right", minWidth: 130 }}>الرصيد</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.values(grouped).map((group) => (
            group.items.map((line, idx) => (
              <TableRow key={line.accountCode + idx} hover>
                <TableCell sx={{ width: 30, color: "#8392ab", fontSize: 11 }}>{line.accountCode}</TableCell>
                <TableCell sx={{ pl: `${(line.level ?? 1) * 16}px`, fontSize: 12 }}>{line.accountName}</TableCell>
                <TableCell sx={{ textAlign: "right", fontSize: 12, fontWeight: line.level <= 1 ? 700 : 400 }}>
                  {fmt(line.balance)}
                </TableCell>
              </TableRow>
            ))
          ))}
          <TableRow sx={{ background: `${color}15` }}>
            <TableCell colSpan={2} sx={{ fontWeight: 800, fontSize: 13, color, py: 1.2 }}>
              إجمالي {title}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, fontSize: 13, color, textAlign: "right" }}>{fmt(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BalanceSheet() {
  const navigate = useNavigate();
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fyId, setFyId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) setFyId(active.id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!fyId) return;
    setLoading(true);
    accountingApi.balanceSheet(fyId)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fyId]);

  const totalAssets = Number(data?.totalAssets ?? 0);
  const totalLiabEquity = Number(data?.totalLiabilitiesAndEquity ?? 0);
  const isBalanced = Math.abs(totalAssets - totalLiabEquity) < 1;

  const totalLiabilities = (data?.liabilities ?? []).reduce((s, l) => s + Number(l.balance ?? 0), 0);
  const totalEquity = (data?.equity ?? []).reduce((s, l) => s + Number(l.balance ?? 0), 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <IconButton size="small" onClick={() => navigate(-1)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <SoftBox>
              <SoftTypography variant="h5" fontWeight="bold">الميزانية العمومية</SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                الأصول والخصوم وحقوق الملكية — {data?.fiscalYearName ?? ""}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select value={fyId ?? ""} onChange={(e) => setFyId(Number(e.target.value))}>
                {fiscalYears.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}
              onClick={() => window.print()}>
              طباعة
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loading && (
          <SoftTypography variant="caption" color="secondary">جارٍ التحميل...</SoftTypography>
        )}

        {data && (
          <>
            {/* Balance check banner */}
            <SoftBox
              display="flex" alignItems="center" gap={1.5} px={2} py={1.5} mb={3}
              sx={{
                background: isBalanced ? "#f0fde4" : "#ffeaea",
                borderRadius: "10px",
                border: `1px solid ${isBalanced ? "#82d616" : "#ea0606"}40`,
              }}
            >
              {isBalanced
                ? <CheckCircleOutlineIcon sx={{ color: "#82d616" }} />
                : <ErrorOutlineIcon sx={{ color: "#ea0606" }} />}
              <SoftTypography variant="caption" fontWeight="medium">
                {isBalanced
                  ? `الميزانية متوازنة — الأصول = ${fmt(totalAssets)} / الخصوم + حقوق الملكية = ${fmt(totalLiabEquity)}`
                  : `تحذير: الميزانية غير متوازنة — فارق ${fmt(Math.abs(totalAssets - totalLiabEquity))}`}
              </SoftTypography>
            </SoftBox>

            {/* KPI Summary */}
            <SoftBox display="flex" gap={2} mb={3} flexWrap="wrap">
              {[
                { label: "إجمالي الأصول",         value: totalAssets,       color: "#17c1e8" },
                { label: "إجمالي الخصوم",          value: totalLiabilities,  color: "#fb8c00" },
                { label: "إجمالي حقوق الملكية",   value: totalEquity,       color: "#7928ca" },
                { label: "الخصوم + حقوق الملكية", value: totalLiabEquity,   color: "#3a416f" },
              ].map(({ label, value, color }) => (
                <Card key={label} sx={{ flex: "1 1 200px", minWidth: 160 }}>
                  <SoftBox p={2}>
                    <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                    <SoftTypography variant="h6" fontWeight="bold" sx={{ color }}>{fmt(value)}</SoftTypography>
                  </SoftBox>
                </Card>
              ))}
            </SoftBox>

            {/* Statement Title */}
            <SoftBox textAlign="center" mb={2}>
              <SoftTypography variant="h6" fontWeight="bold">الميزانية العمومية — {data.fiscalYearName}</SoftTypography>
              {data.periodName && (
                <SoftTypography variant="caption" color="secondary">الفترة: {data.periodName}</SoftTypography>
              )}
            </SoftBox>

            <Grid container spacing={3}>
              {/* LEFT: Assets */}
              <Grid item xs={12} md={6}>
                <Card>
                  <BSSection title="الأصول" color="#17c1e8" lines={data.assets} total={totalAssets} />
                </Card>
              </Grid>

              {/* RIGHT: Liabilities + Equity */}
              <Grid item xs={12} md={6}>
                <Card sx={{ mb: 2 }}>
                  <BSSection title="الخصوم" color="#fb8c00" lines={data.liabilities} total={totalLiabilities} />
                </Card>
                <Card>
                  <BSSection title="حقوق الملكية" color="#7928ca" lines={data.equity} total={totalEquity} />
                  <Divider />
                  <SoftBox p={2} display="flex" justifyContent="space-between" alignItems="center"
                    sx={{ background: "#3a416f10" }}>
                    <SoftTypography variant="button" fontWeight="bold" color="text">
                      إجمالي الخصوم + حقوق الملكية
                    </SoftTypography>
                    <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#3a416f" }}>
                      {fmt(totalLiabEquity)}
                    </SoftTypography>
                  </SoftBox>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
