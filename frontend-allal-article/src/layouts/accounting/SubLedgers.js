/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
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
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(Math.abs(n ?? 0)) + " دج";

// ─── Mock Sub-Ledger Data ─────────────────────────────────────────────────────
const mockCustomerSubledger = [
  { id: 1, name: "شركة الرياض للتجارة", phone: "0551234567", balance: 4500000,  controlCode: "131", ledgerBalance: 4500000,  matched: true  },
  { id: 2, name: "مؤسسة النور",          phone: "0662345678", balance: 2100000,  controlCode: "131", ledgerBalance: 2100000,  matched: true  },
  { id: 3, name: "شركة الخليج",          phone: "0771234567", balance: 8750000,  controlCode: "131", ledgerBalance: 8750000,  matched: true  },
  { id: 4, name: "متجر الأمل",           phone: "0550987654", balance: 1800000,  controlCode: "131", ledgerBalance: 1750000,  matched: false },
  { id: 5, name: "شركة المستقبل",        phone: "0661234567", balance: 1300000,  controlCode: "131", ledgerBalance: 1300000,  matched: true  },
];

const mockSupplierSubledger = [
  { id: 1, name: "مورد الأقمشة",        phone: "0551111111", balance: 3200000,  controlCode: "221", ledgerBalance: 3200000,  matched: true  },
  { id: 2, name: "شركة البلاستيك",      phone: "0662222222", balance: 2100000,  controlCode: "221", ledgerBalance: 2100000,  matched: true  },
  { id: 3, name: "مورد التغليف",        phone: "0773333333", balance: 1800000,  controlCode: "221", ledgerBalance: 1600000,  matched: false },
  { id: 4, name: "مورد الخشب",          phone: "0554444444", balance: 1100000,  controlCode: "221", ledgerBalance: 1100000,  matched: true  },
];

const mockTaxSubledger = [
  { id: 1, code: "TVA-19", label: "TVA 19%",     payable: 620000,  recoverable: 0,       net: 620000  },
  { id: 2, code: "TVA-9",  label: "TVA 9%",      payable: 85000,   recoverable: 320000,  net: -235000 },
  { id: 3, code: "TAP",    label: "TAP 2%",      payable: 45000,   recoverable: 0,       net: 45000   },
];

const mockBankSubledger = [
  { id: 1, code: "142", name: "الحساب البنكي الرئيسي", bankName: "BNA", accountNo: "00021234567890", balance: 9800000, lastReconciled: "2025-01-31" },
];

function ControlBar({ controlCode, controlBalance, subledgerTotal, matched }) {
  const diff = controlBalance - subledgerTotal;
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

function CustomerTab() {
  const [search, setSearch] = useState("");
  const filtered = mockCustomerSubledger.filter((c) => c.name.includes(search) || c.phone.includes(search));
  const total = mockCustomerSubledger.reduce((s, c) => s + c.balance, 0);
  const controlBalance = 18450000;
  const matched = total === controlBalance;

  return (
    <>
      <ControlBar controlCode="131" controlBalance={controlBalance} subledgerTotal={total} matched={matched} />
      <SoftBox mb={2}>
        <TextField
          size="small" placeholder="بحث بالاسم أو الهاتف..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 260 }}
        />
      </SoftBox>
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
    </>
  );
}

function SupplierTab() {
  const [search, setSearch] = useState("");
  const filtered = mockSupplierSubledger.filter((s) => s.name.includes(search));
  const total = mockSupplierSubledger.reduce((s, c) => s + c.balance, 0);
  const controlBalance = 8200000;
  const matched = total === controlBalance;

  return (
    <>
      <ControlBar controlCode="221" controlBalance={controlBalance} subledgerTotal={total} matched={matched} />
      <SoftBox mb={2}>
        <TextField
          size="small" placeholder="بحث بالاسم..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 260 }}
        />
      </SoftBox>
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
    </>
  );
}

function TaxTab() {
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
          {mockTaxSubledger.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>{t.code}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{t.label}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{fmt(t.payable)}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" sx={{ color: "#82d616" }}>{fmt(t.recoverable)}</SoftTypography></TableCell>
              <TableCell>
                <SoftTypography variant="caption" fontWeight="bold" sx={{ color: t.net >= 0 ? "#ea0606" : "#82d616" }}>
                  {t.net >= 0 ? "+" : "-"}{fmt(Math.abs(t.net))}
                </SoftTypography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function BankTab() {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الكود</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الحساب</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>البنك</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>رقم الحساب</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الرصيد</TableCell>
            <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>آخر مطابقة</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {mockBankSubledger.map((b) => (
            <TableRow key={b.id} hover>
              <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>{b.code}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">{b.name}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{b.bankName}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>{b.accountNo}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption" fontWeight="bold">{fmt(b.balance)}</SoftTypography></TableCell>
              <TableCell><SoftTypography variant="caption">{b.lastReconciled}</SoftTypography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function SubLedgers() {
  const [tab, setTab] = useState(0);

  const unmatchedCount =
    mockCustomerSubledger.filter((c) => !c.matched).length +
    mockSupplierSubledger.filter((s) => !s.matched).length;

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

        <Grid container spacing={2} mb={3}>
          {[
            { label: "ذمم العملاء", value: mockCustomerSubledger.reduce((s, c) => s + c.balance, 0), icon: <GroupIcon />, color: "#17c1e8" },
            { label: "ذمم الموردين", value: mockSupplierSubledger.reduce((s, c) => s + c.balance, 0), icon: <GroupIcon />, color: "#fb8c00" },
            { label: "ضرائب صافي", value: mockTaxSubledger.reduce((s, t) => s + t.net, 0), icon: <AccountBalanceIcon />, color: "#ea0606" },
            { label: "أرصدة البنوك", value: mockBankSubledger.reduce((s, b) => s + b.balance, 0), icon: <AccountBalanceIcon />, color: "#344767" },
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
              <Tab label="العملاء" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
              <Tab label="الموردون" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
              <Tab label="الضرائب" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
              <Tab label="البنوك" sx={{ fontSize: "0.8rem", minWidth: 80 }} />
            </Tabs>
          </SoftBox>
          <SoftBox px={2} pb={2}>
            {tab === 0 && <CustomerTab />}
            {tab === 1 && <SupplierTab />}
            {tab === 2 && <TaxTab />}
            {tab === 3 && <BankTab />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
