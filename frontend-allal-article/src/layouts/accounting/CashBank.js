/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
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
import TextField from "@mui/material/TextField";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CloseIcon from "@mui/icons-material/Close";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(n ?? 0) + " دج";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockCashAccounts = [
  { id: 1, type: "cash", name: "الصندوق الرئيسي",     accountCode: "141", balance: 4250000, currency: "DZD", active: true },
  { id: 2, type: "cash", name: "صندوق المبيعات",       accountCode: "143", balance: 850000,  currency: "DZD", active: true },
];

const mockBankAccounts = [
  { id: 3, type: "bank", name: "BNA — الحساب الجاري",  accountCode: "142", bankName: "BNA",  accountNo: "00021234567890", balance: 9800000,  lastReconciled: "2025-01-31", currency: "DZD", active: true },
  { id: 4, type: "bank", name: "CPA — الحساب الادخاري", accountCode: "142", bankName: "CPA", accountNo: "00039876543210", balance: 2500000,  lastReconciled: "2024-12-31", currency: "DZD", active: true },
];

const mockTransactions = [
  { id: 1, date: "2025-01-20", type: "receipt",  method: "cash",   amount: 250000,  ref: "PMT-001", party: "شركة الرياض", accountId: 1 },
  { id: 2, date: "2025-01-21", type: "payment",  method: "bank",   amount: 180000,  ref: "PUR-012", party: "مورد الأقمشة", accountId: 3 },
  { id: 3, date: "2025-01-22", type: "receipt",  method: "check",  amount: 500000,  ref: "PMT-002", party: "مؤسسة النور",  accountId: 3 },
  { id: 4, date: "2025-01-23", type: "payment",  method: "cash",   amount: 45000,   ref: "EXP-003", party: "مصاريف إدارية", accountId: 1 },
  { id: 5, date: "2025-01-24", type: "receipt",  method: "bank",   amount: 1200000, ref: "PMT-003", party: "شركة الخليج", accountId: 3 },
];

const methodLabels = { cash: "نقدي", bank: "تحويل بنكي", check: "شيك" };

function TransactionDialog({ onClose }) {
  const [form, setForm] = useState({ type: "receipt", method: "cash", amount: "", ref: "", party: "", date: "", accountId: 1 });

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">تسجيل حركة صندوق/بنك</SoftTypography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
          <SoftBox display="flex" gap={1}>
            <SoftButton
              size="small" variant={form.type === "receipt" ? "gradient" : "outlined"}
              color="success" onClick={() => setForm((p) => ({ ...p, type: "receipt" }))}
              fullWidth
            >
              <ArrowDownwardIcon sx={{ mr: 0.5, fontSize: 16 }} /> قبض
            </SoftButton>
            <SoftButton
              size="small" variant={form.type === "payment" ? "gradient" : "outlined"}
              color="error" onClick={() => setForm((p) => ({ ...p, type: "payment" }))}
              fullWidth
            >
              <ArrowUpwardIcon sx={{ mr: 0.5, fontSize: 16 }} /> صرف
            </SoftButton>
          </SoftBox>
          <TextField label="التاريخ" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
            value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          <Select size="small" value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))} fullWidth>
            <MenuItem value="cash">نقدي</MenuItem>
            <MenuItem value="bank">تحويل بنكي</MenuItem>
            <MenuItem value="check">شيك</MenuItem>
          </Select>
          <TextField label="المبلغ (دج)" type="number" size="small" fullWidth
            value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
          <TextField label="الطرف (زبون/مورد)" size="small" fullWidth
            value={form.party} onChange={(e) => setForm((p) => ({ ...p, party: e.target.value }))} />
          <TextField label="رقم المرجع" size="small" fullWidth
            value={form.ref} onChange={(e) => setForm((p) => ({ ...p, ref: e.target.value }))} />
          <SoftBox display="flex" gap={1} justifyContent="flex-end">
            <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
            <SoftButton variant="gradient" color="info" size="small" onClick={onClose}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> تسجيل
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </DialogContent>
    </Dialog>
  );
}

export default function CashBank() {
  const [showDialog, setShowDialog] = useState(false);

  const totalCash = mockCashAccounts.reduce((s, a) => s + a.balance, 0);
  const totalBank = mockBankAccounts.reduce((s, a) => s + a.balance, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">الصندوق والبنك</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              إدارة حسابات الصندوق والبنك وتسجيل الحركات اليدوية
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => setShowDialog(true)}>
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> حركة جديدة
          </SoftButton>
        </SoftBox>

        {/* Summary */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, background: "linear-gradient(195deg, #49a3f1, #1A73E8)", color: "#fff" }}>
              <SoftBox display="flex" gap={1} alignItems="center" mb={0.5}>
                <PointOfSaleIcon sx={{ color: "#fff", fontSize: 20 }} />
                <SoftTypography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>إجمالي الصناديق</SoftTypography>
              </SoftBox>
              <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#fff" }}>{fmt(totalCash)}</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, background: "linear-gradient(195deg, #66BB6A, #388E3C)", color: "#fff" }}>
              <SoftBox display="flex" gap={1} alignItems="center" mb={0.5}>
                <AccountBalanceIcon sx={{ color: "#fff", fontSize: 20 }} />
                <SoftTypography variant="caption" sx={{ color: "rgba(255,255,255,0.8)" }}>إجمالي البنوك</SoftTypography>
              </SoftBox>
              <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#fff" }}>{fmt(totalBank)}</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <SoftTypography variant="caption" color="secondary">إجمالي السيولة</SoftTypography>
              <SoftTypography variant="h5" fontWeight="bold">{fmt(totalCash + totalBank)}</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <SoftTypography variant="caption" color="secondary">عدد الحسابات</SoftTypography>
              <SoftTypography variant="h5" fontWeight="bold">{mockCashAccounts.length + mockBankAccounts.length}</SoftTypography>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={2} mb={3}>
          {/* Cash accounts */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <SoftBox display="flex" gap={1} alignItems="center" mb={2}>
                <PointOfSaleIcon sx={{ color: "#17c1e8", fontSize: 20 }} />
                <SoftTypography variant="h6" fontWeight="bold">الصناديق</SoftTypography>
              </SoftBox>
              {mockCashAccounts.map((acc) => (
                <SoftBox key={acc.id} mb={1.5} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftTypography variant="caption" fontWeight="bold">{acc.name}</SoftTypography>
                    <Chip label={acc.accountCode} size="small" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }} />
                  </SoftBox>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#17c1e8", mt: 0.5 }}>
                    {fmt(acc.balance)}
                  </SoftTypography>
                </SoftBox>
              ))}
            </Card>
          </Grid>

          {/* Bank accounts */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <SoftBox display="flex" gap={1} alignItems="center" mb={2}>
                <AccountBalanceIcon sx={{ color: "#82d616", fontSize: 20 }} />
                <SoftTypography variant="h6" fontWeight="bold">حسابات البنك</SoftTypography>
              </SoftBox>
              {mockBankAccounts.map((acc) => (
                <SoftBox key={acc.id} mb={1.5} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftTypography variant="caption" fontWeight="bold">{acc.name}</SoftTypography>
                    <Chip label={acc.bankName} size="small" color="info" sx={{ fontSize: "0.7rem" }} />
                  </SoftBox>
                  <SoftTypography variant="caption" color="secondary" sx={{ fontFamily: "monospace" }}>{acc.accountNo}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#82d616", mt: 0.5 }}>
                    {fmt(acc.balance)}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">آخر مطابقة: {acc.lastReconciled}</SoftTypography>
                </SoftBox>
              ))}
            </Card>
          </Grid>
        </Grid>

        {/* Transactions */}
        <Card>
          <SoftBox p={2} borderBottom="1px solid #e9ecef">
            <SoftTypography variant="h6" fontWeight="bold">آخر الحركات</SoftTypography>
          </SoftBox>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>التاريخ</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>النوع</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>طريقة الدفع</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الطرف</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>المرجع</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>المبلغ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockTransactions.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><SoftTypography variant="caption">{t.date}</SoftTypography></TableCell>
                    <TableCell>
                      {t.type === "receipt"
                        ? <Chip label="قبض" size="small" color="success" sx={{ fontSize: "0.7rem" }} />
                        : <Chip label="صرف" size="small" color="error" sx={{ fontSize: "0.7rem" }} />
                      }
                    </TableCell>
                    <TableCell><SoftTypography variant="caption">{methodLabels[t.method]}</SoftTypography></TableCell>
                    <TableCell><SoftTypography variant="caption">{t.party}</SoftTypography></TableCell>
                    <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>{t.ref}</SoftTypography></TableCell>
                    <TableCell>
                      <SoftTypography variant="caption" fontWeight="bold" sx={{ color: t.type === "receipt" ? "#82d616" : "#ea0606" }}>
                        {t.type === "receipt" ? "+" : "-"}{fmt(t.amount)}
                      </SoftTypography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {showDialog && <TransactionDialog onClose={() => setShowDialog(false)} />}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
