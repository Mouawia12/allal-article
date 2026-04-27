/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
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

import { buildTree, mockAccounts, mockFiscalYears } from "../mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " دج";

function flattenTree(nodes, r = []) {
  nodes.forEach((n) => { r.push(n); if (n.children?.length) flattenTree(n.children, r); });
  return r;
}

const allAccounts = flattenTree(buildTree(mockAccounts));

// Revenue with contra-account handling: credit-normal = positive, debit-normal = negative
function netRevenueTotal() {
  return allAccounts
    .filter((a) => a.classification === "revenue" && a.isPostable)
    .reduce((s, a) => s + (a.normalBalance === "credit" ? (a.balance ?? 0) : -(a.balance ?? 0)), 0);
}

function sumByClassification(cls) {
  return allAccounts
    .filter((a) => a.classification === cls && a.isPostable)
    .reduce((s, a) => s + (a.balance ?? 0), 0);
}

function groupByParent(cls, excludeCodes = []) {
  const level2 = mockAccounts.filter(
    (a) => a.classification === cls && a.level === 2 && !excludeCodes.includes(a.code)
  );
  return level2.map((grp) => ({
    ...grp,
    items: allAccounts.filter((a) => a.classification === cls && a.parentId === grp.id && a.isPostable),
    subtotal: allAccounts
      .filter((a) => a.classification === cls && a.parentId === grp.id && a.isPostable)
      .reduce((s, a) => s + (a.balance ?? 0), 0),
  })).filter((g) => g.items.length > 0);
}

// ─── Row Components ───────────────────────────────────────────────────────────
function SectionHeader({ label, color }) {
  return (
    <TableRow sx={{ background: `${color}10` }}>
      <TableCell colSpan={3} sx={{ fontWeight: 800, fontSize: 13, color, py: 1.5, borderBottom: `2px solid ${color}40` }}>
        {label}
      </TableCell>
    </TableRow>
  );
}

function GroupRow({ label }) {
  return (
    <TableRow>
      <TableCell sx={{ pl: 3, fontWeight: 700, fontSize: 12, color: "#3a416f", py: 1 }} colSpan={3}>
        {label}
      </TableCell>
    </TableRow>
  );
}

function AccountRow({ code, name, balance }) {
  return (
    <TableRow hover>
      <TableCell sx={{ pl: 5, fontSize: 12 }}>{code}</TableCell>
      <TableCell sx={{ fontSize: 12 }}>{name}</TableCell>
      <TableCell sx={{ fontSize: 12, textAlign: "left", fontWeight: 500 }}>{fmt(balance)}</TableCell>
    </TableRow>
  );
}

function SubtotalRow({ label, value, color }) {
  return (
    <TableRow sx={{ background: "#f8f9fa" }}>
      <TableCell colSpan={2} sx={{ fontWeight: 700, fontSize: 12, color, pl: 3, py: 1 }}>
        {label}
      </TableCell>
      <TableCell sx={{ fontWeight: 700, fontSize: 12, textAlign: "left", color }}>
        {fmt(value)}
      </TableCell>
    </TableRow>
  );
}

function TotalRow({ label, value, highlight }) {
  return (
    <TableRow sx={{ background: highlight ? (value >= 0 ? "#f0fde4" : "#ffeaea") : "#f0f2f5" }}>
      <TableCell colSpan={2} sx={{ fontWeight: 800, fontSize: 13, py: 1.5 }}>{label}</TableCell>
      <TableCell sx={{ fontWeight: 800, fontSize: 13, textAlign: "left",
        color: highlight ? (value >= 0 ? "#82d616" : "#ea0606") : "#3a416f" }}>
        {fmt(value)}
      </TableCell>
    </TableRow>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function IncomeStatement() {
  const navigate = useNavigate();
  const [fyId, setFyId] = useState(mockFiscalYears.find((f) => !f.isClosed)?.id ?? mockFiscalYears[0]?.id);

  const revenueGroups = groupByParent("revenue");
  // Exclude COGS group (code "51") from operating-expense section — shown separately
  const expenseGroups = groupByParent("expense", ["51"]);

  const totalRevenue      = netRevenueTotal();
  const cogsBalance       = mockAccounts.find((a) => a.code === "511")?.balance ?? 0;
  const sales411          = mockAccounts.find((a) => a.code === "411")?.balance ?? 0;
  const returns412        = mockAccounts.find((a) => a.code === "412")?.balance ?? 0;
  const grossProfit       = (sales411 - returns412) - cogsBalance;
  const totalExpense      = sumByClassification("expense");
  const operatingExpenses = totalExpense - cogsBalance;
  const netProfit         = totalRevenue - totalExpense;

  const fy = mockFiscalYears.find((f) => f.id === fyId);

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
                الإيرادات والمصروفات وصافي الربح — {fy?.name}
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

        {/* KPI Cards */}
        <SoftBox display="flex" gap={2} mb={3} flexWrap="wrap">
          {[
            { label: "إجمالي الإيرادات", value: totalRevenue, color: "#82d616", Icon: TrendingUpIcon },
            { label: "إجمالي الربح الإجمالي", value: grossProfit, color: "#17c1e8", Icon: TrendingFlatIcon },
            { label: "المصروفات التشغيلية", value: operatingExpenses, color: "#ea0606", Icon: TrendingDownIcon },
            { label: "صافي الربح / الخسارة", value: netProfit,  color: netProfit >= 0 ? "#82d616" : "#ea0606", Icon: netProfit >= 0 ? TrendingUpIcon : TrendingDownIcon },
          ].map(({ label, value, color, Icon }) => (
            <Card key={label} sx={{ flex: "1 1 200px", minWidth: 160 }}>
              <SoftBox p={2} display="flex" alignItems="center" gap={1.5}>
                <SoftBox sx={{
                  width: 40, height: 40, borderRadius: "10px",
                  background: `${color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon sx={{ color, fontSize: 20 }} />
                </SoftBox>
                <SoftBox>
                  <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color }}>{fmt(value)}</SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>
          ))}
        </SoftBox>

        {/* Statement Table */}
        <Card>
          <SoftBox p={2} borderBottom="1px solid #f0f2f5">
            <SoftTypography variant="h6" fontWeight="bold" textAlign="center">
              قائمة الدخل — {fy?.name}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block" textAlign="center">
              الفترة: {fy?.startDate} إلى {fy?.endDate}
            </SoftTypography>
          </SoftBox>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["الكود", "البند", "المبلغ (دج)"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* ── Revenues ── */}
                <SectionHeader label="الإيرادات" color="#82d616" />
                {revenueGroups.map((grp) => (
                  <>
                    <GroupRow key={`grp-${grp.id}`} label={grp.nameAr} />
                    {grp.items.map((acc) => (
                      <AccountRow key={acc.id} code={acc.code} name={acc.nameAr} balance={acc.balance} />
                    ))}
                    <SubtotalRow key={`sub-${grp.id}`} label={`إجمالي ${grp.nameAr}`} value={grp.subtotal} color="#82d616" />
                  </>
                ))}
                <TotalRow label="إجمالي الإيرادات" value={totalRevenue} />

                {/* ── COGS ── */}
                <SectionHeader label="تكلفة البضاعة المباعة" color="#7928ca" />
                {allAccounts.filter((a) => a.classification === "expense" && a.parentId !== null && a.isPostable &&
                  mockAccounts.find((p) => p.id === a.parentId)?.code === "51").map((acc) => (
                  <AccountRow key={acc.id} code={acc.code} name={acc.nameAr} balance={acc.balance} />
                ))}
                <SubtotalRow
                  label="تكلفة البضاعة المباعة"
                  value={mockAccounts.find((a) => a.code === "511")?.balance ?? 0}
                  color="#7928ca"
                />
                <TotalRow label="إجمالي الربح" value={grossProfit} highlight />

                {/* ── Operating Expenses ── */}
                <SectionHeader label="المصروفات التشغيلية" color="#ea0606" />
                {expenseGroups.map((grp) => (
                  <>
                    <GroupRow key={`egrp-${grp.id}`} label={grp.nameAr} />
                    {grp.items.map((acc) => (
                      <AccountRow key={acc.id} code={acc.code} name={acc.nameAr} balance={acc.balance} />
                    ))}
                    <SubtotalRow key={`esub-${grp.id}`} label={`إجمالي ${grp.nameAr}`} value={grp.subtotal} color="#ea0606" />
                  </>
                ))}
                <TotalRow label="إجمالي المصروفات التشغيلية" value={operatingExpenses} />

                {/* ── Net Profit ── */}
                <TableRow>
                  <TableCell colSpan={3} sx={{ py: 0.5 }} />
                </TableRow>
                <TotalRow label="صافي الربح / الخسارة" value={netProfit} highlight />
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
