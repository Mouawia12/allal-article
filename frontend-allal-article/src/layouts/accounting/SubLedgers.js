/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import GroupIcon from "@mui/icons-material/Group";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(Math.abs(Number(n ?? 0))) + " دج";

function ControlBar({ controlCode, controlBalance, subledgerTotal }) {
  const diff = Number(controlBalance) - Number(subledgerTotal);
  const matched = Math.abs(diff) < 1 || Number(controlBalance) === 0;
  return (
    <SoftBox
      p={1.5} mb={2} sx={{
        background: matched ? "#f0fde4" : "#ffeaea",
        border: `1px solid ${matched ? "#82d61644" : "#ea060622"}`,
        borderRadius: 2,
        display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center",
      }}
    >
      {matched
        ? <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 20 }} />
        : <WarningAmberIcon sx={{ color: "#ea0606", fontSize: 20 }} />
      }
      <SoftBox>
        <SoftTypography variant="caption" color="secondary">الحساب الرقابي ({controlCode})</SoftTypography>
        <SoftTypography variant="body2" fontWeight="bold">{fmt(controlBalance)}</SoftTypography>
      </SoftBox>
      <SoftBox>
        <SoftTypography variant="caption" color="secondary">إجمالي التفصيل</SoftTypography>
        <SoftTypography variant="body2" fontWeight="bold">{fmt(subledgerTotal)}</SoftTypography>
      </SoftBox>
      {!matched && (
        <SoftBox>
          <SoftTypography variant="caption" color="secondary">الفرق</SoftTypography>
          <SoftTypography variant="body2" fontWeight="bold" sx={{ color: "#ea0606" }}>{fmt(diff)}</SoftTypography>
        </SoftBox>
      )}
      <Chip
        label={matched ? "متطابق" : "فرق في الأرصدة"}
        color={matched ? "success" : "error"}
        size="small"
        sx={{ fontSize: "0.7rem" }}
      />
    </SoftBox>
  );
}

function CustomerTab({ customers, customerControl, customerTotal }) {
  const [search, setSearch] = useState("");
  const filtered = customers.filter(
    (c) => (c.name || "").includes(search) || (c.phone || "").includes(search)
  );

  return (
    <>
      <ControlBar controlCode="1201" controlBalance={customerControl} subledgerTotal={customerTotal} />
      <SoftBox mb={2}>
        <TextField
          size="small" placeholder="بحث بالاسم أو الهاتف..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 260 }}
        />
      </SoftBox>
      {filtered.length === 0 ? (
        <SoftTypography variant="body2" color="text" sx={{ py: 3, textAlign: "center" }}>
          لا توجد ذمم عملاء بعد
        </SoftTypography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الزبون</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الهاتف</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الرصيد المحاسبي</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>رصيد الأستاذ</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>تطابق</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover sx={{ background: !c.matched ? "#fff8f8" : "inherit" }}>
                  <TableCell><SoftTypography variant="caption" fontWeight="bold">{c.name}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{c.phone}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{fmt(c.balance)}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{fmt(c.ledgerBalance)}</SoftTypography></TableCell>
                  <TableCell>
                    {c.matched
                      ? <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 16 }} />
                      : <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 16 }} />
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton size="small"><OpenInNewIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

function SupplierTab({ suppliers, supplierControl, supplierTotal }) {
  const [search, setSearch] = useState("");
  const filtered = suppliers.filter((s) => (s.name || "").includes(search));

  return (
    <>
      <ControlBar controlCode="2101" controlBalance={supplierControl} subledgerTotal={supplierTotal} />
      <SoftBox mb={2}>
        <TextField
          size="small" placeholder="بحث بالاسم..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 260 }}
        />
      </SoftBox>
      {filtered.length === 0 ? (
        <SoftTypography variant="body2" color="text" sx={{ py: 3, textAlign: "center" }}>
          لا توجد ذمم موردين بعد
        </SoftTypography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>المورد</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الهاتف</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الرصيد المحاسبي</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>رصيد الأستاذ</TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>تطابق</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} hover sx={{ background: !s.matched ? "#fff8f8" : "inherit" }}>
                  <TableCell><SoftTypography variant="caption" fontWeight="bold">{s.name}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{s.phone}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{fmt(s.balance)}</SoftTypography></TableCell>
                  <TableCell><SoftTypography variant="caption">{fmt(s.ledgerBalance)}</SoftTypography></TableCell>
                  <TableCell>
                    {s.matched
                      ? <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 16 }} />
                      : <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 16 }} />
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton size="small"><OpenInNewIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

function TaxTab({ taxes }) {
  if (taxes.length === 0) {
    return (
      <SoftTypography variant="body2" color="text" sx={{ py: 3, textAlign: "center" }}>
        لا توجد حركات ضريبية مسجلة بعد
      </SoftTypography>
    );
  }
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>كود الضريبة</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الوصف</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>محصل (مستحق)</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>قابل للخصم</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الصافي</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxes.map((t) => (
            <TableRow key={t.code} hover>
              <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>{t.code}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{t.label}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{fmt(t.payable)}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" sx={{ color: "#82d616" }}>{fmt(t.recoverable)}</SoftTypography></TableCell>
              <TableCell>
                <SoftTypography variant="caption" fontWeight="bold" sx={{ color: Number(t.net) >= 0 ? "#ea0606" : "#82d616" }}>
                  {Number(t.net) >= 0 ? "+" : "-"}{fmt(Math.abs(Number(t.net)))}
                </SoftTypography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BankTab({ bankAccounts }) {
  if (bankAccounts.length === 0) {
    return (
      <SoftTypography variant="body2" color="text" sx={{ py: 3, textAlign: "center" }}>
        لا توجد حسابات بنكية بحركات مسجلة
      </SoftTypography>
    );
  }
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الكود</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الحساب</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الرصيد</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bankAccounts.map((b) => (
            <TableRow key={b.id} hover>
              <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>{b.accountCode}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">{b.name}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">{fmt(b.balance)}</SoftTypography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function SubLedgers() {
  const [tab, setTab]           = useState(0);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [data, setData]         = useState({
    customers: [], customerControl: 0, customerTotal: 0,
    suppliers: [], supplierControl: 0, supplierTotal: 0,
    taxes: [],
    bankAccounts: [],
  });

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    accountingApi.listSubledgers()
      .then((r) => setData(r.data ?? {}))
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل الذمم والمطابقة"));
        setData({
          customers: [], customerControl: 0, customerTotal: 0,
          suppliers: [], supplierControl: 0, supplierTotal: 0,
          taxes: [],
          bankAccounts: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const unmatchedCount = [
    ...(data.customers || []),
    ...(data.suppliers || []),
  ].filter((x) => !x.matched).length;

  const taxNetTotal = (data.taxes || []).reduce((s, t) => s + Number(t.net ?? 0), 0);
  const bankTotal   = (data.bankAccounts || []).reduce((s, b) => s + Number(b.balance ?? 0), 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">الذمم والمطابقة</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              مراجعة أرصدة الذمم التفصيلية ومطابقتها مع الحسابات الرقابية
            </SoftTypography>
          </SoftBox>
          {unmatchedCount > 0 && (
            <SoftBox p={1.5} sx={{ background: "#ffeaea", border: "1px solid #ea060622", borderRadius: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 18 }} />
              <SoftTypography variant="caption" sx={{ color: "#ea0606" }}>
                {unmatchedCount} حساب غير متطابق — يحتاج مراجعة
              </SoftTypography>
            </SoftBox>
          )}
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {loading ? (
          <SoftBox display="flex" justifyContent="center" py={6}><CircularProgress /></SoftBox>
        ) : (
          <>
            <Grid container spacing={2} mb={3}>
              {[
                { label: "ذمم العملاء",  value: data.customerTotal, icon: <GroupIcon />,         color: "#17c1e8" },
                { label: "ذمم الموردين", value: data.supplierTotal, icon: <GroupIcon />,         color: "#fb8c00" },
                { label: "ضرائب صافي",  value: taxNetTotal,         icon: <AccountBalanceIcon />, color: "#ea0606" },
                { label: "أرصدة البنوك", value: bankTotal,           icon: <AccountBalanceIcon />, color: "#344767" },
              ].map((m) => (
                <Grid item xs={6} sm={3} key={m.label}>
                  <Card sx={{ p: 1.5 }}>
                    <SoftTypography variant="caption" color="secondary">{m.label}</SoftTypography>
                    <SoftTypography variant="h6" fontWeight="bold" sx={{ color: m.color }}>{fmt(m.value)}</SoftTypography>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Card>
              <SoftBox px={2} pt={2}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: "1px solid #e9ecef", mb: 2 }}>
                  <Tab label="العملاء"  sx={{ fontSize: "0.8rem", minWidth: 80 }} />
                  <Tab label="الموردون" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
                  <Tab label="الضرائب" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
                  <Tab label="البنوك"   sx={{ fontSize: "0.8rem", minWidth: 80 }} />
                </Tabs>
              </SoftBox>
              <SoftBox px={2} pb={2}>
                {tab === 0 && <CustomerTab customers={data.customers || []} customerControl={data.customerControl} customerTotal={data.customerTotal} />}
                {tab === 1 && <SupplierTab suppliers={data.suppliers || []} supplierControl={data.supplierControl} supplierTotal={data.supplierTotal} />}
                {tab === 2 && <TaxTab taxes={data.taxes || []} />}
                {tab === 3 && <BankTab bankAccounts={data.bankAccounts || []} />}
              </SoftBox>
            </Card>
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
