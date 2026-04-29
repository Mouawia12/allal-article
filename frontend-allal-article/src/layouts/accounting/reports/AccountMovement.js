/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";

import Alert from "@mui/material/Alert";
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

import { fmt, journalStatusLabels } from "../mockData";
import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

export default function AccountMovement() {
  const [accounts, setAccounts] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fyId, setFyId] = useState(null);
  const [account, setAccount] = useState(null);
  const [lines, setLines] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    setPageError("");
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        setAccounts(all.filter((a) => a.isPostable !== false && a.isActive !== false));
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل الحسابات"));
        setAccounts([]);
      });
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) {
          setFyId(active.id);
          setDateFrom(active.startDate || "");
          setDateTo(active.endDate || "");
        }
      })
      .catch((error) => {
        setPageError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل السنوات المالية");
          return current ? `${current}؛ ${message}` : message;
        });
        setFiscalYears([]);
      });
  }, []);

  useEffect(() => {
    if (!account || !fyId) return;
    setPageError("");
    accountingApi.generalLedger(account.id, fyId)
      .then((r) => setLines(r.data?.lines ?? []))
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل حركة الحساب"));
        setLines([]);
      });
  }, [account, fyId]);

  const filtered = useMemo(
    () => lines.filter((l) => (!dateFrom || l.date >= dateFrom) && (!dateTo || l.date <= dateTo)),
    [lines, dateFrom, dateTo]
  );

  const totalDebit  = filtered.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCredit = filtered.reduce((s, l) => s + (l.credit || 0), 0);

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
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => window.print()}>
            <PrintIcon sx={{ fontSize: 16, mr: 0.5 }} /> طباعة
          </SoftButton>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="flex-end">
          <SoftBox flex={1} minWidth={280}>
            <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">الحساب</SoftTypography>
            <Autocomplete
              size="small"
              options={accounts}
              value={account}
              onChange={(_, v) => setAccount(v)}
              getOptionLabel={(o) => `${o.code} — ${o.nameAr}`}
              filterOptions={(opts, { inputValue: q }) => opts.filter((o) => o.nameAr?.includes(q) || o.code?.includes(q))}
              renderInput={(params) => <TextField {...params} placeholder="اختر الحساب..." />}
              noOptionsText="لا نتائج"
            />
          </SoftBox>
          <SoftBox minWidth={180}>
            <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">السنة المالية</SoftTypography>
            <TextField select size="small" value={fyId ?? ""} onChange={(e) => setFyId(e.target.value)} sx={{ minWidth: 180 }}>
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>{fy.name}</option>
              ))}
            </TextField>
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
            <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
              {[
                { label: "إجمالي المدين", value: totalDebit, color: "#17c1e8" },
                { label: "إجمالي الدائن", value: totalCredit, color: "#82d616" },
                { label: "صافي الرصيد", value: Math.abs(totalDebit - totalCredit), color: "#344767" },
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
                      {["التاريخ", "رقم القيد", "البيان", "مدين", "دائن", "الرصيد المتراكم"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 10, color: "#8392ab", py: 1 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا توجد حركات في هذه الفترة</TableCell></TableRow>
                    ) : filtered.map((line, i) => (
                      <TableRow key={i} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                        <TableCell sx={cellSx}><SoftTypography variant="caption">{line.date}</SoftTypography></TableCell>
                        <TableCell sx={cellSx}><SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{line.journalNumber}</SoftTypography></TableCell>
                        <TableCell sx={cellSx}><SoftTypography variant="caption">{line.description || "—"}</SoftTypography></TableCell>
                        <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                          {line.debit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(line.debit)}</SoftTypography> : "—"}
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                          {line.credit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(line.credit)}</SoftTypography> : "—"}
                        </TableCell>
                        <TableCell style={{ textAlign: "right" }} sx={cellSx}>
                          <SoftTypography variant="caption" fontWeight="bold" sx={{ color: (line.runningBalance ?? 0) >= 0 ? "#344767" : "#ea0606" }}>
                            {fmt(Math.abs(line.runningBalance ?? 0))} {(line.runningBalance ?? 0) >= 0 ? "م" : "د"}
                          </SoftTypography>
                        </TableCell>
                      </TableRow>
                    ))}
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
