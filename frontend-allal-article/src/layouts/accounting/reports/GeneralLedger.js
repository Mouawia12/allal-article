/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
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
import TextField from "@mui/material/TextField";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterListIcon from "@mui/icons-material/FilterList";
import PrintIcon from "@mui/icons-material/Print";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { style: "decimal", maximumFractionDigits: 2 }).format(Math.abs(n ?? 0)) + " دج";

const fmtSigned = (n) => {
  const v = Number(n ?? 0);
  return (v >= 0 ? "" : "-") + fmt(v);
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GeneralLedger() {
  const navigate = useNavigate();
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fyId, setFyId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    setPageError("");
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) setFyId(active.id);
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل السنوات المالية"));
        setFiscalYears([]);
      });
    accountingApi.listAccounts()
      .then((r) => setAccounts((r.data?.content ?? r.data ?? []).filter((a) => a.isPostable !== false)))
      .catch((error) => {
        setPageError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل الحسابات");
          return current ? `${current}؛ ${message}` : message;
        });
        setAccounts([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedAccount || !fyId) return;
    setLoading(true);
    setPageError("");
    accountingApi.generalLedger(selectedAccount.id, fyId)
      .then((r) => setData(r.data))
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل الأستاذ العام"));
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedAccount, fyId]);

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
                حركات الحساب والرصيد الجاري
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}
            onClick={() => window.print()}>
            طباعة
          </SoftButton>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        {/* Filters */}
        <Card sx={{ mb: 2 }}>
          <SoftBox p={2} display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FilterListIcon sx={{ color: "#8392ab" }} fontSize="small" />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select value={fyId ?? ""} onChange={(e) => setFyId(Number(e.target.value))}>
                {fiscalYears.map((f) => (
                  <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              options={accounts}
              getOptionLabel={(a) => `${a.code} — ${a.name}`}
              value={selectedAccount}
              onChange={(_, v) => setSelectedAccount(v)}
              size="small"
              sx={{ minWidth: 280 }}
              renderInput={(params) => <TextField {...params} label="اختر الحساب" />}
            />
          </SoftBox>
        </Card>

        {loading && (
          <SoftTypography variant="caption" color="secondary">جارٍ التحميل...</SoftTypography>
        )}

        {!selectedAccount && !loading && (
          <SoftBox textAlign="center" py={6}>
            <SoftTypography variant="body2" color="secondary">اختر حساباً لعرض الأستاذ العام</SoftTypography>
          </SoftBox>
        )}

        {data && !loading && (
          <>
            {/* Account summary */}
            <SoftBox display="flex" gap={2} mb={3} flexWrap="wrap">
              {[
                { label: "الرصيد الافتتاحي",  value: data.openingBalance,  color: "#17c1e8" },
                { label: "إجمالي المدين",      value: data.totalDebit,      color: "#82d616" },
                { label: "إجمالي الدائن",      value: data.totalCredit,     color: "#fb8c00" },
                { label: "الرصيد الختامي",     value: data.closingBalance,  color: Number(data.closingBalance) >= 0 ? "#344767" : "#ea0606" },
              ].map(({ label, value, color }) => (
                <Card key={label} sx={{ flex: "1 1 160px" }}>
                  <SoftBox p={2}>
                    <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
                    <SoftTypography variant="h6" fontWeight="bold" sx={{ color }}>{fmt(value)}</SoftTypography>
                  </SoftBox>
                </Card>
              ))}
            </SoftBox>

            <Card>
              <SoftBox p={2} display="flex" alignItems="center" gap={1} borderBottom="1px solid #eee">
                <SoftTypography variant="button" fontWeight="bold">{data.accountCode} — {data.accountName}</SoftTypography>
                <Chip label={`${data.lines?.length ?? 0} قيد`} size="small" />
              </SoftBox>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8f9fa" }}>
                      {["التاريخ", "رقم القيد", "البيان", "مدين", "دائن", "الرصيد"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.lines ?? []).map((line, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontSize: 12 }}>{line.date}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#17c1e8" }}>{line.journalNumber}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{line.description}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#82d616" }}>{Number(line.debit) > 0 ? fmt(line.debit) : "—"}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#fb8c00" }}>{Number(line.credit) > 0 ? fmt(line.credit) : "—"}</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{fmtSigned(line.runningBalance)}</TableCell>
                      </TableRow>
                    ))}
                    {/* Totals row */}
                    <TableRow sx={{ background: "#f8f9fa", fontWeight: 800 }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 800 }}>الإجمالي</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#82d616" }}>{fmt(data.totalDebit)}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#fb8c00" }}>{fmt(data.totalCredit)}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{fmtSigned(data.closingBalance)}</TableCell>
                    </TableRow>
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
