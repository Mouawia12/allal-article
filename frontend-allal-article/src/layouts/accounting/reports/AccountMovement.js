/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import PrintIcon from "@mui/icons-material/Print";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { buildTree, fmt, journalSourceLabels, journalStatusLabels, mockAccounts, mockJournals } from "../mockData";

function flattenTree(nodes, r = []) {
  nodes.forEach((n) => { r.push(n); if (n.children?.length) flattenTree(n.children, r); });
  return r;
}

const allAccounts = flattenTree(buildTree(mockAccounts)).filter((a) => a.isPostable);

// Mock: generate account movement lines from journals
function getMovement(accountId) {
  const lines = [];
  let running = 0;
  mockJournals
    .filter((j) => j.status !== "void")
    .forEach((j) => {
      j.lines.forEach((l) => {
        if (l.accountId === accountId) {
          running += (l.debit || 0) - (l.credit || 0);
          lines.push({ date: j.date, journalNo: j.number, source: j.source, description: l.description || j.description, debit: l.debit, credit: l.credit, running, status: j.status });
        }
      });
    });
  return lines;
}

export default function AccountMovement() {
  const [account, setAccount] = useState(null);
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo]     = useState("2025-12-31");

  const lines = useMemo(() => {
    if (!account) return [];
    return getMovement(account.id).filter((l) => l.date >= dateFrom && l.date <= dateTo);
  }, [account, dateFrom, dateTo]);

  const totalDebit  = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

  const cellSx = { py: 0.8, fontSize: 12 };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">حركة حساب</SoftTypography>
            <SoftTypography variant="caption" color="secondary">عرض حركات حساب معين خلال فترة محددة</SoftTypography>
          </SoftBox>
          <SoftButton variant="outlined" color="secondary" size="small">
            <PrintIcon sx={{ fontSize: 16, mr: 0.5 }} /> طباعة
          </SoftButton>
        </SoftBox>

        {/* Filters */}
        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="flex-end">
          <SoftBox flex={1} minWidth={280}>
            <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">الحساب</SoftTypography>
            <Autocomplete
              size="small"
              options={allAccounts}
              value={account}
              onChange={(_, v) => setAccount(v)}
              getOptionLabel={(o) => `${o.code} — ${o.nameAr}`}
              filterOptions={(opts, { inputValue: q }) => opts.filter((o) => o.nameAr.includes(q) || o.code.includes(q))}
              renderInput={(params) => <TextField {...params} placeholder="اختر الحساب..." />}
              noOptionsText="لا نتائج"
            />
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">من تاريخ</SoftTypography>
            <TextField size="small" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">إلى تاريخ</SoftTypography>
            <TextField size="small" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
          </SoftBox>
        </SoftBox>

        {!account ? (
          <SoftBox p={4} sx={{ textAlign: "center", color: "#8392ab" }}>
            <SoftTypography variant="body2">اختر حساباً لعرض حركاته</SoftTypography>
          </SoftBox>
        ) : (
          <>
            {/* Account Summary */}
            <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
              {[
                { label: "إجمالي المدين",  value: totalDebit,  color: "#17c1e8" },
                { label: "إجمالي الدائن",  value: totalCredit, color: "#82d616" },
                { label: "صافي الرصيد",    value: Math.abs(totalDebit - totalCredit), color: "#344767" },
              ].map(({ label, value, color }) => (
                <SoftBox key={label} sx={{ background: "#fff", border: "1px solid #eee", borderRadius: 2, px: 2, py: 1.5, minWidth: 140 }}>
                  <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color }}>{fmt(value)}</SoftTypography>
                </SoftBox>
              ))}
            </SoftBox>

            <Card>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8f9fa" }}>
                      {["التاريخ", "رقم القيد", "المصدر", "البيان", "مدين", "دائن", "الرصيد المتراكم", "الحالة"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10, color: "#8392ab", py: 1, textTransform: "uppercase" }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا توجد حركات في هذه الفترة</TableCell></TableRow>
                    ) : lines.map((line, i) => {
                      const st = journalStatusLabels[line.status];
                      return (
                        <TableRow key={i} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                          <TableCell sx={cellSx}><SoftTypography variant="caption">{line.date}</SoftTypography></TableCell>
                          <TableCell sx={cellSx}><SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{line.journalNo}</SoftTypography></TableCell>
                          <TableCell sx={cellSx}><SoftTypography variant="caption">{journalSourceLabels[line.source]}</SoftTypography></TableCell>
                          <TableCell sx={cellSx}><SoftTypography variant="caption">{line.description || "—"}</SoftTypography></TableCell>
                          <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                            {line.debit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(line.debit)}</SoftTypography> : "—"}
                          </TableCell>
                          <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                            {line.credit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(line.credit)}</SoftTypography> : "—"}
                          </TableCell>
                          <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: line.running >= 0 ? "#344767" : "#ea0606" }}>
                              {fmt(Math.abs(line.running))} {line.running >= 0 ? "م" : "د"}
                            </SoftTypography>
                          </TableCell>
                          <TableCell sx={cellSx}>
                            <Chip label={st?.label} size="small" sx={{ background: st?.bg, color: st?.color, fontWeight: 600, fontSize: 10, height: 18 }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
