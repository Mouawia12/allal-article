/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
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
import PrintIcon from "@mui/icons-material/Print";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { accountingApi } from "services";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 2 }).format(Math.abs(n ?? 0)) + " دج";

function ISSection({ title, color, lines, total }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: `${color}20` }}>
            <TableCell sx={{ fontWeight: 700, color, fontSize: 13 }} colSpan={2}>{title}</TableCell>
            <TableCell sx={{ fontWeight: 700, color, fontSize: 13, textAlign: "right", minWidth: 130 }}>المبلغ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(lines ?? []).map((line, idx) => (
            <TableRow key={line.accountCode + idx} hover>
              <TableCell sx={{ width: 30, color: "#8392ab", fontSize: 11 }}>{line.accountCode}</TableCell>
              <TableCell sx={{ pl: `${(line.level ?? 1) * 16}px`, fontSize: 12 }}>{line.accountName}</TableCell>
              <TableCell sx={{ textAlign: "right", fontSize: 12, fontWeight: line.level <= 1 ? 700 : 400 }}>
                {fmt(line.amount)}
              </TableCell>
            </TableRow>
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
export default function IncomeStatement() {
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
    accountingApi.incomeStatement(fyId)
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fyId]);

  const totalRevenue = Number(data?.totalRevenue ?? 0);
  const totalExpense = Number(data?.totalExpense ?? 0);
  const netIncome    = Number(data?.netIncome ?? 0);
  const isProfit = netIncome >= 0;

  const NetIcon = netIncome > 0 ? TrendingUpIcon : netIncome < 0 ? TrendingDownIcon : TrendingFlatIcon;
  const netColor = netIncome > 0 ? "#82d616" : netIncome < 0 ? "#ea0606" : "#344767";

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
              <SoftTypography variant="h5" fontWeight="bold">قائمة الدخل</SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                الإيرادات والمصاريف والنتيجة الصافية — {data?.fiscalYearName ?? ""}
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
            {/* KPI Summary */}
            <SoftBox display="flex" gap={2} mb={3} flexWrap="wrap">
              {[
                { label: "إجمالي الإيرادات", value: totalRevenue, color: "#82d616" },
                { label: "إجمالي المصاريف",  value: totalExpense, color: "#fb8c00" },
                { label: isProfit ? "صافي الربح" : "صافي الخسارة", value: netIncome, color: netColor },
              ].map(({ label, value, color }) => (
                <Card key={label} sx={{ flex: "1 1 200px", minWidth: 160 }}>
                  <SoftBox p={2}>
                    <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                    <SoftTypography variant="h6" fontWeight="bold" sx={{ color }}>{fmt(value)}</SoftTypography>
                  </SoftBox>
                </Card>
              ))}
            </SoftBox>

            {/* Revenue section */}
            <Card sx={{ mb: 2 }}>
              <ISSection title="الإيرادات" color="#82d616" lines={data.revenues} total={totalRevenue} />
            </Card>

            {/* Expense section */}
            <Card sx={{ mb: 2 }}>
              <ISSection title="المصاريف" color="#fb8c00" lines={data.expenses} total={totalExpense} />
            </Card>

            {/* Net result */}
            <Card>
              <SoftBox p={2.5} display="flex" justifyContent="space-between" alignItems="center"
                sx={{ background: `${netColor}10`, borderRadius: 2 }}>
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <NetIcon sx={{ color: netColor }} />
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: netColor }}>
                    {isProfit ? "صافي الربح" : "صافي الخسارة"}
                  </SoftTypography>
                </SoftBox>
                <SoftTypography variant="h5" fontWeight="bold" sx={{ color: netColor }}>
                  {fmt(netIncome)}
                </SoftTypography>
              </SoftBox>
            </Card>
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
