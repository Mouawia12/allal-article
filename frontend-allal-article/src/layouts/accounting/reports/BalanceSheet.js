/* eslint-disable react/prop-types */
import { useState } from "react";
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

import { buildTree, mockAccounts, mockFiscalYears } from "../mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " دج";

function flattenTree(nodes, r = []) {
  nodes.forEach((n) => { r.push(n); if (n.children?.length) flattenTree(n.children, r); });
  return r;
}

const allAccounts = flattenTree(buildTree(mockAccounts));

function sumCls(cls) {
  return allAccounts.filter((a) => a.classification === cls && a.isPostable)
    .reduce((s, a) => s + (a.balance ?? 0), 0);
}

function groupedByCls(cls) {
  const level2 = mockAccounts.filter((a) => a.classification === cls && a.level === 2);
  return level2.map((grp) => ({
    ...grp,
    items: allAccounts.filter((a) => a.classification === cls && a.parentId === grp.id && a.isPostable),
    subtotal: allAccounts
      .filter((a) => a.classification === cls && a.parentId === grp.id && a.isPostable)
      .reduce((s, a) => s + (a.balance ?? 0), 0),
  })).filter((g) => g.items.length > 0);
}

// ─── Table Section ─────────────────────────────────────────────────────────────
function BSSection({ title, color, groups, total }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: `${color}12` }}>
            <TableCell colSpan={3} sx={{ fontWeight: 800, fontSize: 13, color, py: 1.5, borderBottom: `2px solid ${color}40` }}>
              {title}
            </TableCell>
          </TableRow>
          <TableRow sx={{ background: "#f8f9fa" }}>
            {["الكود", "البند", "الرصيد (دج)"].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.map((grp) => (
            <>
              <TableRow key={`g${grp.id}`}>
                <TableCell sx={{ pl: 2, fontWeight: 700, fontSize: 12, color: "#3a416f", py: 0.8 }} colSpan={3}>
                  {grp.nameAr}
                </TableCell>
              </TableRow>
              {grp.items.map((acc) => (
                <TableRow key={acc.id} hover>
                  <TableCell sx={{ pl: 4, fontSize: 12 }}>{acc.code}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{acc.nameAr}</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{fmt(acc.balance ?? 0)}</TableCell>
                </TableRow>
              ))}
              <TableRow key={`s${grp.id}`} sx={{ background: "#f8f9fa" }}>
                <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: 12, color, pl: 2, py: 0.8 }}>
                  إجمالي {grp.nameAr}
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color }}>{fmt(grp.subtotal)}</TableCell>
              </TableRow>
            </>
          ))}
          <TableRow sx={{ background: `${color}15` }}>
            <TableCell colSpan={2} sx={{ fontWeight: 800, fontSize: 13, color, py: 1.2 }}>
              إجمالي {title}
            </TableCell>
            <TableCell sx={{ fontWeight: 800, fontSize: 13, color }}>{fmt(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function BalanceSheet() {
  const navigate = useNavigate();
  const [fyId, setFyId] = useState(mockFiscalYears.find((f) => !f.isClosed)?.id ?? mockFiscalYears[0]?.id);
  const fy = mockFiscalYears.find((f) => f.id === fyId);

  const totalAssets      = sumCls("asset");
  const totalLiabilities = sumCls("liability");
  const totalEquity      = sumCls("equity");
  const rightSide        = totalLiabilities + totalEquity;
  const isBalanced       = Math.abs(totalAssets - rightSide) < 1;

  const assetGroups     = groupedByCls("asset");
  const liabilityGroups = groupedByCls("liability");
  const equityGroups    = groupedByCls("equity");

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
                الأصول والخصوم وحقوق الملكية — {fy?.name}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select value={fyId} onChange={(e) => setFyId(Number(e.target.value))}>
                {mockFiscalYears.map((f) => (
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
              ? `الميزانية متوازنة — الأصول = ${fmt(totalAssets)} / الخصوم + حقوق الملكية = ${fmt(rightSide)}`
              : `تحذير: الميزانية غير متوازنة — فارق ${fmt(Math.abs(totalAssets - rightSide))}`}
          </SoftTypography>
        </SoftBox>

        {/* KPI Summary */}
        <SoftBox display="flex" gap={2} mb={3} flexWrap="wrap">
          {[
            { label: "إجمالي الأصول",         value: totalAssets,      color: "#17c1e8" },
            { label: "إجمالي الخصوم",          value: totalLiabilities, color: "#fb8c00" },
            { label: "إجمالي حقوق الملكية",   value: totalEquity,      color: "#7928ca" },
            { label: "الخصوم + حقوق الملكية", value: rightSide,        color: "#3a416f" },
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
          <SoftTypography variant="h6" fontWeight="bold">الميزانية العمومية — {fy?.name}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            بتاريخ: {fy?.endDate}
          </SoftTypography>
        </SoftBox>

        <Grid container spacing={3}>
          {/* LEFT: Assets */}
          <Grid item xs={12} md={6}>
            <Card>
              <BSSection
                title="الأصول"
                color="#17c1e8"
                groups={assetGroups}
                total={totalAssets}
              />
            </Card>
          </Grid>

          {/* RIGHT: Liabilities + Equity */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2 }}>
              <BSSection
                title="الخصوم"
                color="#fb8c00"
                groups={liabilityGroups}
                total={totalLiabilities}
              />
            </Card>
            <Card>
              <BSSection
                title="حقوق الملكية"
                color="#7928ca"
                groups={equityGroups}
                total={totalEquity}
              />
              <Divider />
              <SoftBox p={2} display="flex" justifyContent="space-between" alignItems="center"
                sx={{ background: "#3a416f10" }}>
                <SoftTypography variant="button" fontWeight="bold" color="text">
                  إجمالي الخصوم + حقوق الملكية
                </SoftTypography>
                <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#3a416f" }}>
                  {fmt(rightSide)}
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
