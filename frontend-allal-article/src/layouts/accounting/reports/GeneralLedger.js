/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PrintIcon from "@mui/icons-material/Print";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { buildTree, classificationLabels, mockAccounts, mockJournals, mockFiscalYears } from "../mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 0 }).format(Math.abs(n)) + " دج";

function flattenTree(nodes, r = []) {
  nodes.forEach((n) => { r.push(n); if (n.children?.length) flattenTree(n.children, r); });
  return r;
}

const allAccounts = flattenTree(buildTree(mockAccounts));
const postableAccounts = allAccounts.filter((a) => a.isPostable && a.isActive);

// Build movements from journal lines; running balance respects account normalBalance
function buildMovements(accountId, normalBalance) {
  const rows = [];
  mockJournals
    .filter((j) => j.status === "posted")
    .forEach((j) => {
      j.lines.forEach((l) => {
        if (l.accountId === accountId) {
          rows.push({
            journalId: j.id,
            number: j.number,
            date: j.date,
            description: l.description || j.description,
            debit: l.debit,
            credit: l.credit,
          });
        }
      });
    });
  rows.sort((a, b) => a.date.localeCompare(b.date));
  let running = 0;
  return rows.map((r) => {
    running += normalBalance === "debit" ? (r.debit - r.credit) : (r.credit - r.debit);
    return { ...r, running };
  });
}

const statusCfg = {
  posted:   { label: "مرحّل",  bg: "#f0fde4", color: "#82d616" },
  draft:    { label: "مسودة",  bg: "#fff3e0", color: "#fb8c00" },
  reversed: { label: "معكوس",  bg: "#f8f9fa", color: "#8392ab" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GeneralLedger() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const activeFY = mockFiscalYears.find((fy) => !fy.isClosed);

  const movements = useMemo(() => {
    if (!selectedAccount) return [];
    let rows = buildMovements(selectedAccount.id, selectedAccount.normalBalance);
    if (dateFrom) rows = rows.filter((r) => r.date >= dateFrom);
    if (dateTo)   rows = rows.filter((r) => r.date <= dateTo);
    return rows;
  }, [selectedAccount, dateFrom, dateTo]);

  const totalDebit   = movements.reduce((s, r) => s + r.debit,  0);
  const totalCredit  = movements.reduce((s, r) => s + r.credit, 0);
  const finalBalance = movements.length > 0 ? movements[movements.length - 1].running : 0;
  const normalBal    = selectedAccount?.normalBalance ?? "debit";
  const balLabel     = (val) => {
    if (val === 0) return "صفر";
    return normalBal === "debit"
      ? (val > 0 ? "مدين" : "دائن")
      : (val > 0 ? "دائن" : "مدين");
  };

  const accountOptions = postableAccounts.map((a) => ({
    ...a,
    label: `${a.code} — ${a.nameAr}`,
  }));

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
              <SoftTypography variant="h5" fontWeight="bold">الأستاذ العام</SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                حركات تفصيلية لكل حساب مع الرصيد المتراكم
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}
            onClick={() => window.print()}>
            طباعة
          </SoftButton>
        </SoftBox>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <SoftBox p={2.5}>
            <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
              <FilterListIcon sx={{ color: "#8392ab", fontSize: 18 }} />
              <SoftTypography variant="button" fontWeight="medium">فلترة</SoftTypography>
            </SoftBox>
            <SoftBox display="flex" gap={2} flexWrap="wrap" alignItems="flex-end">
              <Autocomplete
                options={accountOptions}
                value={selectedAccount ? { ...selectedAccount, label: `${selectedAccount.code} — ${selectedAccount.nameAr}` } : null}
                onChange={(_, v) => setSelectedAccount(v)}
                renderInput={(params) => <TextField {...params} label="اختر حساباً" size="small" />}
                sx={{ minWidth: 280 }}
              />
              <TextField
                label="من تاريخ" type="date" size="small"
                value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
              <TextField
                label="إلى تاريخ" type="date" size="small"
                value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
              {(dateFrom || dateTo) && (
                <SoftButton variant="text" color="error" size="small"
                  onClick={() => { setDateFrom(""); setDateTo(""); }}>
                  مسح الفلتر
                </SoftButton>
              )}
            </SoftBox>
          </SoftBox>
        </Card>

        {!selectedAccount ? (
          <Card>
            <SoftBox p={4} textAlign="center">
              <SoftTypography variant="h6" color="secondary">اختر حساباً لعرض حركاته</SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                يعرض الأستاذ العام كل القيود المرحّلة على الحساب المختار مع الرصيد المتراكم
              </SoftTypography>
            </SoftBox>
          </Card>
        ) : (
          <>
            {/* Account Summary */}
            <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
              {[
                { label: "الحساب",       value: `${selectedAccount.code} — ${selectedAccount.nameAr}` },
                { label: "التصنيف",      value: classificationLabels[selectedAccount.classification]?.label },
                { label: "إجمالي مدين",  value: fmt(totalDebit)  },
                { label: "إجمالي دائن",  value: fmt(totalCredit) },
                { label: "الرصيد الختامي", value: fmt(Math.abs(finalBalance)) },
              ].map(({ label, value }) => (
                <Card key={label} sx={{ px: 2, py: 1.5, minWidth: 140 }}>
                  <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold">{value}</SoftTypography>
                </Card>
              ))}
            </SoftBox>

            {/* Movements Table */}
            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8f9fa" }}>
                      {["التاريخ", "رقم القيد", "البيان", "مدين", "دائن", "الرصيد المتراكم", ""].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#8392ab" }}>
                          لا توجد حركات لهذا الحساب في الفترة المحددة
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontSize: 12 }}>{row.date}</TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{row.number}</TableCell>
                          <TableCell sx={{ fontSize: 12, maxWidth: 220 }}>{row.description}</TableCell>
                          <TableCell sx={{ fontSize: 12, color: row.debit  > 0 ? "#3a416f" : "#ccc" }}>
                            {row.debit  > 0 ? fmt(row.debit)  : "—"}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, color: row.credit > 0 ? "#ea0606" : "#ccc" }}>
                            {row.credit > 0 ? fmt(row.credit) : "—"}
                          </TableCell>
                          <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>
                            <SoftBox display="flex" alignItems="center" gap={0.5}>
                              {fmt(Math.abs(row.running))}
                              <SoftTypography variant="caption" color="secondary">
                                {balLabel(row.running)}
                              </SoftTypography>
                            </SoftBox>
                          </TableCell>
                          <TableCell>
                            <IconButton size="small"
                              onClick={() => navigate("/accounting/journals")}>
                              <OpenInNewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {/* Totals row */}
                    {movements.length > 0 && (
                      <TableRow sx={{ background: "#f8f9fa" }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: 12 }}>الإجمالي</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{fmt(totalDebit)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>{fmt(totalCredit)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                          {fmt(Math.abs(finalBalance))} ({balLabel(finalBalance)})
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
