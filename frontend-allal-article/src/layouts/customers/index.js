/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Snackbar from "@mui/material/Snackbar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentIcon from "@mui/icons-material/Payment";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { customersApi, referenceApi, usersApi } from "services";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}
const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];
const paymentMethodLabel = { cash: "نقدي", bank: "تحويل بنكي", cheque: "شيك" };

function netCustomerBalance(customer) {
  return (customer.totalAmount || 0) + (customer.openingBalance || 0) - (customer.paidAmount || 0);
}

function openingBalanceDirection(value) {
  return Number(value) < 0 ? "credit" : "debit";
}

function signedOpeningBalance(amount, direction) {
  const value = Math.abs(Number(amount) || 0);
  return direction === "credit" ? -value : value;
}

function positiveAmount(value) {
  return Math.abs(Number(value) || 0);
}

function compactMillionNumber(value, decimals = 0) {
  const millionValue = (Number(value) || 0) / 10000;
  if (Number.isInteger(millionValue)) return millionValue.toLocaleString("fr-DZ");

  return millionValue.toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

function CompactMillionAmount({ value, decimals = 0 }) {
  return (
    <span
      dir="ltr"
      data-amount-format="compact-million"
      style={{
        direction: "ltr",
        unicodeBidi: "isolate",
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "baseline",
        gap: "0.25em",
        whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span data-amount-part="number" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
        {compactMillionNumber(value, decimals)}
      </span>
      <span data-amount-part="unit" dir="ltr" style={{ direction: "ltr", unicodeBidi: "isolate" }}>
        م
      </span>
    </span>
  );
}

function MoneyAmount({ value, million = false, decimals = 0 }) {
  const amount = Number(value) || 0;
  const formatted = amount.toLocaleString("fr-DZ");

  return million ? (
    <CompactMillionAmount value={amount} decimals={decimals} />
  ) : (
    <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
      {formatted} دج
    </span>
  );
}

function normalizeCustomer(c) {
  return {
    totalAmount: 0,
    paidAmount: 0,
    ordersCount: 0,
    lastOrder: "—",
    shippingRoute: c.shippingRoute || "—",
    salesperson: c.salespersonName || "—",
    wilaya: c.wilayaNameAr || "—",
    payments: [],
    orders: [],
    ...c,
  };
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const show = (message, severity = "success") => setToast({ open: true, message, severity });
  const hide = () => setToast((t) => ({ ...t, open: false }));
  return { toast, show, hide };
}

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onView }) {
  const colorIdx = customer.id % avatarColors.length;
  const balance = netCustomerBalance(customer);
  const hasDebt = balance > 0;
  const hasCredit = balance < 0;
  const balanceAmount = hasDebt || hasCredit
    ? <CompactMillionAmount value={positiveAmount(balance)} decimals={1} />
    : "صفر";

  return (
    <Card
      sx={{
        p: 2.5, height: "100%", cursor: "pointer",
        transition: "all 0.2s", border: "1px solid #e9ecef",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
      onClick={() => onView(customer)}
    >
      <SoftBox display="flex" alignItems="flex-start" gap={2} mb={2}>
        <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 48, height: 48, fontSize: 16, fontWeight: "bold" }}>
          {getInitials(customer.name)}
        </Avatar>
        <SoftBox flex={1} minWidth={0}>
          <SoftTypography variant="button" fontWeight="bold" lineHeight={1.3} display="block" noWrap>
            {customer.name}
          </SoftTypography>
          <SoftBox display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
            <SoftBadge
              variant={customer.status === "active" ? "gradient" : "contained"}
              color={customer.status === "active" ? "success" : "secondary"}
              size="xs" badgeContent={customer.status === "active" ? "نشط" : "غير نشط"} container
            />
            {hasDebt && (
              <SoftBadge variant="gradient" color="error" size="xs"
                badgeContent={<>مديون <CompactMillionAmount value={balance} decimals={1} /></>} container />
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>

      {[
        { key: "phone",    icon: PhoneIcon,         value: customer.phone || "—" },
        { key: "wilaya",   icon: LocationOnIcon,    value: customer.wilaya || "—" },
        { key: "sales",    icon: PersonIcon,        value: customer.salesperson || "—" },
        { key: "shipping", icon: LocalShippingIcon, value: customer.shippingRoute || "—" },
      ].map(({ key, icon: Icon, value }) => (
        <SoftBox key={key} display="flex" alignItems="center" gap={1} mb={0.6}>
          <Icon fontSize="small" sx={{ color: "#8392ab", flexShrink: 0 }} />
          <SoftTypography variant="caption" color="text" noWrap>{value}</SoftTypography>
        </SoftBox>
      ))}

      <SoftBox mt={2} pt={2} sx={{ borderTop: "1px solid #e9ecef" }} display="flex" justifyContent="space-between">
        <SoftBox textAlign="center">
          <SoftTypography variant="h6" fontWeight="bold" color="info">{customer.ordersCount}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">طلبية</SoftTypography>
        </SoftBox>
        <SoftBox textAlign="center">
          <SoftTypography variant="button" fontWeight="bold" color={hasDebt ? "error" : "success"}>
            {balanceAmount}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">
            {hasCredit ? "رصيد لصالح الزبون" : "الرصيد"}
          </SoftTypography>
        </SoftBox>
        <SoftBox textAlign="center">
          <SoftTypography variant="caption" color="text">{customer.lastOrder}</SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">آخر طلبية</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Payment Dialog ───────────────────────────────────────────────────────────
function AddPaymentDialog({ open, onClose, customer, onSaved, users }) {
  const [direction, setDirection] = useState("in");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [receivedById, setReceivedById] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDirection("in"); setAmount(""); setMethod("cash");
      setReceivedById(""); setCounterpartyName(customer?.name || "");
      setReferenceNumber(""); setPaymentDate(""); setNotes(""); setError("");
    }
  }, [open, customer]);

  const validate = () => {
    if (!amount || Number(amount) <= 0) return "المبلغ يجب أن يكون أكبر من صفر";
    return "";
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError("");
    try {
      const r = await customersApi.addPayment(customer.id, {
        amount: Number(amount),
        direction,
        paymentMethod: method,
        receivedById: receivedById ? Number(receivedById) : null,
        counterpartyName: counterpartyName || null,
        referenceNumber: referenceNumber || null,
        paymentDate: paymentDate || null,
        notes: notes || null,
      });
      onSaved(r.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="bold">تسجيل دفعة</SoftTypography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <SoftBox display="flex" gap={1} mb={2}>
          <SoftButton variant={direction === "in" ? "gradient" : "outlined"} color="success" size="small" fullWidth
            startIcon={<ArrowDownwardIcon />} onClick={() => setDirection("in")}>
            استلام من الزبون
          </SoftButton>
          <SoftButton variant={direction === "out" ? "gradient" : "outlined"} color="error" size="small" fullWidth
            startIcon={<ArrowUpwardIcon />} onClick={() => setDirection("out")}>
            إرجاع مبلغ للزبون
          </SoftButton>
        </SoftBox>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="المبلغ (دج) *" type="number"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              error={!!error && (!amount || Number(amount) <= 0)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>طريقة الدفع *</InputLabel>
              <Select value={method} onChange={(e) => setMethod(e.target.value)} label="طريقة الدفع *">
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bank">تحويل بنكي</MenuItem>
                <MenuItem value="cheque">شيك</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>من استلم الدفعة</InputLabel>
              <Select value={receivedById} onChange={(e) => setReceivedById(e.target.value)} label="من استلم الدفعة">
                <MenuItem value=""><em>غير محدد</em></MenuItem>
                {(users || []).map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small"
              label={direction === "in" ? "اسم الطرف الدافع (من دفع)" : "اسم المستلم"}
              value={counterpartyName} onChange={(e) => setCounterpartyName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="رقم المرجع / الشيك"
              value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="تاريخ الدفعة" type="date"
              value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="ملاحظات" multiline rows={2}
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color={direction === "in" ? "success" : "error"} size="small"
          disabled={saving} onClick={save}>
          {saving ? "جارٍ التسجيل..." : direction === "in" ? "تسجيل الاستلام" : "تسجيل الإرجاع"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Customer Detail Dialog ───────────────────────────────────────────────────
export function CustomerDetailDialog({ customer: initialCustomer, onClose, onUpdate, onEdit, users }) {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(initialCustomer);
  const [tab, setTab] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => { setCustomer(initialCustomer); }, [initialCustomer]);

  useEffect(() => {
    if (!customer || tab !== 2) return;
    setLoadingPayments(true);
    customersApi.listPayments(customer.id)
      .then((r) => setPayments(Array.isArray(r.data) ? r.data : []))
      .catch(console.error)
      .finally(() => setLoadingPayments(false));
  }, [customer, tab]);

  if (!customer) return null;

  const colorIdx = customer.id % avatarColors.length;
  const balance = netCustomerBalance(customer);
  const balanceLabel = balance < 0 ? "رصيد لصالح الزبون" : "الرصيد المتبقي";

  const handlePaymentSaved = (newPayment) => {
    const signedAmount = newPayment.direction === "in"
      ? positiveAmount(newPayment.amount)
      : -positiveAmount(newPayment.amount);
    const updatedCustomer = {
      ...customer,
      paidAmount: (customer.paidAmount || 0) + signedAmount,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setCustomer(updatedCustomer);
    onUpdate(updatedCustomer);
  };

  return (
    <Dialog open={!!customer} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 48, height: 48, fontWeight: "bold" }}>
              {getInitials(customer.name)}
            </Avatar>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">{customer.name}</SoftTypography>
              <SoftBox display="flex" gap={0.5} alignItems="center">
                <SoftBadge variant="gradient"
                  color={customer.status === "active" ? "success" : "secondary"}
                  size="xs" badgeContent={customer.status === "active" ? "نشط" : "غير نشط"} container />
                <SoftTypography variant="caption" color="secondary">| {customer.wilaya || "—"}</SoftTypography>
              </SoftBox>
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <SoftBox sx={{ px: 3, py: 1.5, background: balance > 0 ? "#fff5f5" : "#f0fff4", borderBottom: "1px solid #eee" }}
        display="flex" gap={4} flexWrap="wrap">
        {[
          { label: "إجمالي الطلبيات", value: <MoneyAmount value={customer.totalAmount || 0} million decimals={2} />, color: "#344767" },
          { label: "إجمالي المدفوع",  value: <MoneyAmount value={customer.paidAmount || 0} million decimals={2} />,  color: "#66BB6A" },
          { label: "الرصيد الافتتاحي", value: <MoneyAmount value={customer.openingBalance || 0} million decimals={2} />, color: "#17c1e8" },
          { label: balanceLabel, value: <MoneyAmount value={positiveAmount(balance)} million decimals={2} />, color: balance > 0 ? "#ea0606" : "#66BB6A" },
        ].map((item) => (
          <SoftBox key={item.label} textAlign="center">
            <SoftTypography variant="caption" color="secondary">{item.label}</SoftTypography>
            <SoftTypography variant="button" fontWeight="bold" display="block" sx={{ color: item.color }}>
              {item.value}
            </SoftTypography>
          </SoftBox>
        ))}
      </SoftBox>

      <SoftBox px={2} borderBottom="1px solid #eee">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
          TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">البيانات</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">سجل الطلبيات</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">سجل الدفعات</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">الشحن</SoftTypography>} />
        </Tabs>
      </SoftBox>

      <DialogContent sx={{ p: 2, minHeight: 300 }}>
        {tab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {[
                ["الهاتف الرئيسي", customer.phone],
                ["الهاتف الثاني",  customer.phone2 || "—"],
                ["الولاية",        customer.wilaya || "—"],
                ["العنوان",        customer.address || "—"],
              ].map(([label, value]) => (
                <SoftBox key={label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{label}</SoftTypography>
                  <SoftTypography variant="body2" color="text">{value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
            <Grid item xs={12} sm={6}>
              {[
                ["البائع المسؤول",   customer.salesperson || "—"],
                ["مسار الشحن",       customer.shippingRoute || "—"],
                ["الرصيد الافتتاحي", `${(customer.openingBalance || 0).toLocaleString("fr-DZ")} دج`],
                ["البريد الإلكتروني", customer.email || "—"],
              ].map(([label, value]) => (
                <SoftBox key={label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{label}</SoftTypography>
                  <SoftTypography variant="body2" fontWeight="bold" color="text">{value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <SoftBox>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <SoftTypography variant="caption" color="text">
                {(customer.orders || []).length} طلبية
              </SoftTypography>
              <SoftBox display="flex" gap={1}>
                <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}
                  onClick={() => window.print()}>
                  طباعة كشف الحساب
                </SoftButton>
                <SoftButton variant="outlined" color="success" size="small" startIcon={<WhatsAppIcon />}
                  sx={{ color: "#25D366", borderColor: "#25D366" }}>
                  واتساب PDF
                </SoftButton>
              </SoftBox>
            </SoftBox>
            {(!customer.orders || customer.orders.length === 0) ? (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                لا توجد طلبيات مسجلة
              </SoftTypography>
            ) : customer.orders.map((o) => {
              const amount = o.totalAmount || o.amount || 0;
              const paid = o.paidAmount || o.paid || 0;
              const remaining = amount - paid;
              const payStatus = remaining <= 0 ? "paid" : paid > 0 ? "partial" : "unpaid";
              const payColors = { paid: "#66BB6A", partial: "#fb8c00", unpaid: "#ea0606" };
              const payLabels = { paid: "مدفوعة", partial: "مدفوعة جزئياً", unpaid: "غير مدفوعة" };
              return (
                <SoftBox key={o.id} mb={1.5} p={1.5} sx={{
                  border: `2px solid ${payColors[payStatus]}33`,
                  borderRight: `4px solid ${payColors[payStatus]}`,
                  borderRadius: 1.5,
                  background: payStatus === "unpaid" ? "#fff5f5" : payStatus === "partial" ? "#fffbeb" : "#f0fff4",
                }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{o.orderNumber || o.id}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {o.createdAt ? o.createdAt.slice(0, 10) : o.date || "—"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox textAlign="right">
                      <SoftTypography variant="caption" fontWeight="bold">
                        {amount.toLocaleString("fr-DZ")} دج
                      </SoftTypography>
                      {remaining > 0 && (
                        <SoftTypography variant="caption" color="error" display="block">
                          متبقي: {remaining.toLocaleString("fr-DZ")} دج
                        </SoftTypography>
                      )}
                    </SoftBox>
                    <SoftBadge variant="gradient"
                      color={payStatus === "paid" ? "success" : payStatus === "partial" ? "warning" : "error"}
                      size="xs" badgeContent={payLabels[payStatus]} container />
                  </SoftBox>
                </SoftBox>
              );
            })}
          </SoftBox>
        )}

        {tab === 2 && (
          <SoftBox>
            <SoftBox display="flex" justifyContent="space-between" mb={2}>
              <SoftTypography variant="caption" color="text">{payments.length} دفعة مسجلة</SoftTypography>
              <SoftButton variant="gradient" color="info" size="small" startIcon={<PaymentIcon />}
                onClick={() => setPaymentDialog(true)}>
                تسجيل دفعة
              </SoftButton>
            </SoftBox>
            {loadingPayments && (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={2}>جارٍ التحميل...</SoftTypography>
            )}
            {!loadingPayments && payments.length === 0 && (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>لا توجد دفعات مسجلة</SoftTypography>
            )}
            {payments.map((p) => (
              <SoftBox key={p.id} mb={1.5} p={1.5} sx={{
                border: `1px solid ${p.direction === "in" ? "#66BB6A44" : "#ea060644"}`,
                borderRight: `4px solid ${p.direction === "in" ? "#66BB6A" : "#ea0606"}`,
                borderRadius: 1.5,
                background: p.direction === "in" ? "#f0fff4" : "#fff5f5",
              }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftBox>
                    <SoftBox display="flex" alignItems="center" gap={0.5}>
                      {p.direction === "in"
                        ? <ArrowDownwardIcon fontSize="small" sx={{ color: "#66BB6A" }} />
                        : <ArrowUpwardIcon fontSize="small" sx={{ color: "#ea0606" }} />}
                      <SoftTypography variant="caption" fontWeight="bold">
                        {p.direction === "in" ? "استلام" : "إرجاع"} — {paymentMethodLabel[p.paymentMethod] || p.paymentMethod}
                      </SoftTypography>
                    </SoftBox>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      {p.paymentDate} | من دفع: {p.counterpartyName || "—"}
                      {p.receivedByName ? ` | استلم: ${p.receivedByName}` : ""}
                      {p.referenceNumber ? ` | مرجع: ${p.referenceNumber}` : ""}
                    </SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="button" fontWeight="bold"
                    sx={{ color: p.direction === "in" ? "#66BB6A" : "#ea0606" }}>
                    <MoneyAmount value={positiveAmount(p.amount)} />
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>
        )}

        {tab === 3 && (
          <SoftBox>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">مسار الشحن</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.shippingRoute || "—"}</SoftTypography>
                </SoftBox>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">الولاية</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.wilaya || "—"}</SoftTypography>
                </SoftBox>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">العنوان التفصيلي</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.address || "—"}</SoftTypography>
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">زبون الفواتير الطريق</SoftTypography>
                  <SoftTypography variant="body2" color="text">
                    {customer.wilaya ? `موزع ${customer.wilaya} الرئيسي` : "—"}
                  </SoftTypography>
                </SoftBox>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">البائع المسؤول</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.salesperson || "—"}</SoftTypography>
                </SoftBox>
              </Grid>
            </Grid>
            <Divider />
            <SoftBox mt={2}>
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
                سجل الشحنات
              </SoftTypography>
              {(customer.shipments || []).length === 0 ? (
                <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>
                  لا توجد شحنات مسجلة لهذا الزبون
                </SoftTypography>
              ) : (customer.shipments || []).map((s) => (
                <SoftBox key={s.id || s.invoice} mb={1} p={1.5}
                  sx={{ background: "#f8f9fa", borderRadius: 1.5, border: "1px solid #e9ecef" }}>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{s.invoiceNumber || s.invoice}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {s.date} | السائق: {s.driverName || s.driver || "—"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBadge variant="gradient"
                      color={s.status === "delivered" || s.status === "مسلّمة" ? "success" : "info"}
                      size="xs" badgeContent={s.status === "delivered" ? "مسلّمة" : s.status || "في الطريق"} container />
                  </SoftBox>
                </SoftBox>
              ))}
            </SoftBox>
          </SoftBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إغلاق</SoftButton>
        <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />}
          onClick={() => { onClose(); onEdit(customer); }}>
          تعديل
        </SoftButton>
        <SoftButton variant="outlined" color="success" size="small" startIcon={<PaymentIcon />}
          onClick={() => { setTab(2); setPaymentDialog(true); }}>
          دفعة
        </SoftButton>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<ShoppingCartIcon />}
          onClick={() => { onClose(); navigate("/orders/new", { state: { customer } }); }}>
          طلبية جديدة
        </SoftButton>
      </DialogActions>

      <AddPaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        customer={customer}
        onSaved={handlePaymentSaved}
        users={users}
      />
    </Dialog>
  );
}

// ─── Add / Edit Customer Dialog ───────────────────────────────────────────────
const emptyForm = {
  name: "", phone: "", phone2: "", wilayaId: "", address: "",
  shippingRoute: "", email: "", openingBalance: "", openingBalanceDirection: "debit", notes: "",
};

function CustomerFormDialog({ open, onClose, onSaved, editCustomer, wilayas }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isEdit = !!editCustomer;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setForm({
          name: editCustomer.name || "",
          phone: editCustomer.phone || "",
          phone2: editCustomer.phone2 || "",
          wilayaId: editCustomer.wilayaId || "",
          address: editCustomer.address || "",
          shippingRoute: editCustomer.shippingRoute || "",
          email: editCustomer.email || "",
          openingBalance: Math.abs(Number(editCustomer.openingBalance) || 0) || "",
          openingBalanceDirection: openingBalanceDirection(editCustomer.openingBalance),
          notes: editCustomer.notes || "",
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [open, editCustomer, isEdit]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "الاسم مطلوب";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "بريد إلكتروني غير صالح";
    if (form.openingBalance && isNaN(Number(form.openingBalance))) errs.openingBalance = "يجب أن يكون رقماً";
    return errs;
  };

  const save = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        phone2: form.phone2.trim() || null,
        wilayaId: form.wilayaId ? Number(form.wilayaId) : null,
        address: form.address.trim() || null,
        shippingRoute: form.shippingRoute.trim() || null,
        email: form.email.trim() || null,
        openingBalance: signedOpeningBalance(form.openingBalance, form.openingBalanceDirection),
        notes: form.notes.trim() || null,
        salespersonId: null,
      };
      const r = isEdit
        ? await customersApi.update(editCustomer.id, payload)
        : await customersApi.create(payload);
      onSaved(r.data);
      onClose();
    } catch (e) {
      const msg = e.response?.data?.message || "حدث خطأ أثناء الحفظ";
      setErrors({ _global: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "تعديل الزبون" : "إضافة زبون جديد"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {errors._global && (
            <Grid item xs={12}>
              <Alert severity="error">{errors._global}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField fullWidth label="اسم الزبون / الشركة *" size="small"
              value={form.name} onChange={(e) => set("name", e.target.value)}
              error={!!errors.name} helperText={errors.name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="رقم الهاتف *" size="small"
              value={form.phone} onChange={(e) => set("phone", e.target.value)}
              error={!!errors.phone} helperText={errors.phone} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="الهاتف الثاني" size="small"
              value={form.phone2} onChange={(e) => set("phone2", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth error={!!errors.wilayaId}>
              <InputLabel>الولاية</InputLabel>
              <Select value={form.wilayaId} onChange={(e) => set("wilayaId", e.target.value)} label="الولاية">
                <MenuItem value=""><em>بدون ولاية</em></MenuItem>
                {wilayas.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.code} - {w.nameAr}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="العنوان التفصيلي" size="small"
              value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="مسار الشحن" size="small"
              placeholder="مثال: وهران - الساحل"
              value={form.shippingRoute} onChange={(e) => set("shippingRoute", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="البريد الإلكتروني" size="small"
              value={form.email} onChange={(e) => set("email", e.target.value)}
              error={!!errors.email} helperText={errors.email} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="الرصيد الافتتاحي (دج)" type="number" size="small"
              value={form.openingBalance} onChange={(e) => set("openingBalance", e.target.value)}
              error={!!errors.openingBalance} helperText={errors.openingBalance || "رصيد سابق قبل بدء التسجيل"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>طبيعة الرصيد</InputLabel>
              <Select
                value={form.openingBalanceDirection}
                onChange={(e) => set("openingBalanceDirection", e.target.value)}
                label="طبيعة الرصيد"
              >
                <MenuItem value="debit">مدين - هو يخلصنا</MenuItem>
                <MenuItem value="credit">دائن - نحنا نخلصوه</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="ملاحظات" size="small" multiline rows={2}
              value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" disabled={saving} onClick={save}>
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "حفظ الزبون"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Print Report Dialog ──────────────────────────────────────────────────────
function PrintReportDialog({ open, onClose, customers, isDebtMode, wilayaFilter }) {
  const title = isDebtMode
    ? `تقرير الديون${wilayaFilter !== "all" ? ` — ولاية ${wilayaFilter}` : ""}`
    : `قائمة الزبائن${wilayaFilter !== "all" ? ` — ولاية ${wilayaFilter}` : ""}`;
  const printDate = new Date().toLocaleDateString("ar-DZ");
  const totalDebt = customers.reduce((s, c) => {
    const d = netCustomerBalance(c);
    return s + (d > 0 ? d : 0);
  }, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="bold">
            {isDebtMode ? "معاينة تقرير الديون" : "معاينة قائمة الزبائن"}
          </SoftTypography>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color="success" size="small" startIcon={<WhatsAppIcon />}
              sx={{ color: "#25D366", borderColor: "#25D366" }}>
              واتساب PDF
            </SoftButton>
            <SoftButton variant="gradient" color="info" size="small" startIcon={<PrintIcon />}
              onClick={() => window.print()}>
              طباعة
            </SoftButton>
            <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
          </SoftBox>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <SoftBox textAlign="center" mb={3}>
          <SoftTypography variant="h5" fontWeight="bold">{title}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            تاريخ الطباعة: {printDate} | إجمالي: {customers.length} زبون
            {isDebtMode && <> | إجمالي الديون: <CompactMillionAmount value={totalDebt} decimals={2} /></>}
          </SoftTypography>
        </SoftBox>

        {isDebtMode ? (
          <SoftBox>
            <SoftBox mb={2} p={1.5} sx={{ background: "#fff5f5", borderRadius: 2, border: "1px solid #ea060622" }}>
              <SoftBox display="flex" justifyContent="space-between">
                <SoftTypography variant="button" fontWeight="bold" color="error">إجمالي الديون المستحقة</SoftTypography>
                <SoftTypography variant="h6" fontWeight="bold" color="error">
                  {totalDebt.toLocaleString("fr-DZ")} دج
                </SoftTypography>
              </SoftBox>
            </SoftBox>
            {customers.map((c) => {
              const debt = netCustomerBalance(c);
              if (debt <= 0) return null;
              return (
                <SoftBox key={c.id} mb={2} sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
                  <SoftBox px={2} py={1.5} sx={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}
                    display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="button" fontWeight="bold">{c.name}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {c.wilaya || "—"} | {c.phone} | البائع: {c.salesperson || "—"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox textAlign="right">
                      <SoftTypography variant="caption" color="secondary">إجمالي الدين</SoftTypography>
                      <SoftTypography variant="h6" fontWeight="bold" color="error" display="block">
                        {debt.toLocaleString("fr-DZ")} دج
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>
                  <SoftBox px={2} py={1}>
                    {[
                      { label: "إجمالي الطلبيات", value: (c.totalAmount || 0).toLocaleString("fr-DZ"), color: "#344767" },
                      { label: "إجمالي المدفوع",   value: (c.paidAmount || 0).toLocaleString("fr-DZ"),  color: "#66BB6A" },
                      { label: "الرصيد الافتتاحي", value: (c.openingBalance || 0).toLocaleString("fr-DZ"), color: "#17c1e8" },
                    ].map((row) => (
                      <SoftBox key={row.label} display="flex" justifyContent="space-between" mb={0.5}>
                        <SoftTypography variant="caption" color="secondary">{row.label}:</SoftTypography>
                        <SoftTypography variant="caption" fontWeight="bold" sx={{ color: row.color }}>
                          {row.value} دج
                        </SoftTypography>
                      </SoftBox>
                    ))}
                  </SoftBox>
                </SoftBox>
              );
            })}
          </SoftBox>
        ) : (
          <SoftBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["#", "اسم الزبون", "الهاتف", "الولاية", "البائع", "الطلبيات", "الحالة"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "right", borderBottom: "2px solid #e9ecef" }}>
                      <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                    <td style={{ padding: "7px 10px" }}><SoftTypography variant="caption" color="secondary">{i + 1}</SoftTypography></td>
                    <td style={{ padding: "7px 10px" }}><SoftTypography variant="caption" fontWeight="bold">{c.name}</SoftTypography></td>
                    <td style={{ padding: "7px 10px" }}><SoftTypography variant="caption">{c.phone}</SoftTypography></td>
                    <td style={{ padding: "7px 10px" }}><SoftTypography variant="caption">{c.wilaya || "—"}</SoftTypography></td>
                    <td style={{ padding: "7px 10px" }}><SoftTypography variant="caption">{c.salesperson || "—"}</SoftTypography></td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}>
                      <SoftTypography variant="caption" fontWeight="bold">{c.ordersCount || 0}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftBadge variant="gradient"
                        color={c.status === "active" ? "success" : "secondary"}
                        size="xs" badgeContent={c.status === "active" ? "نشط" : "غير نشط"} container />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SoftBox>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Customers() {
  const [customers, setCustomers] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [printDialog, setPrintDialog] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    Promise.all([
      customersApi.list({ size: 200 }),
      referenceApi.wilayas(),
      usersApi.list({ size: 200 }),
    ])
      .then(([cr, wr, ur]) => {
        const cList = Array.isArray(cr.data?.content) ? cr.data.content
          : Array.isArray(cr.data) ? cr.data : [];
        setCustomers(cList.map(normalizeCustomer));
        setWilayas(Array.isArray(wr.data) ? wr.data : []);
        const uList = Array.isArray(ur.data?.content) ? ur.data.content
          : Array.isArray(ur.data) ? ur.data : [];
        setUsers(uList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const debt = netCustomerBalance(c);
    const matchStatus =
      tab === 0 ? true :
      tab === 1 ? c.status === "active" :
      tab === 2 ? c.status === "inactive" :
      debt > 0;
    const matchWilaya = wilayaFilter === "all" || c.wilaya === wilayaFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.salesperson || "").toLowerCase().includes(q) ||
      (c.wilaya || "").includes(q);
    return matchStatus && matchWilaya && matchSearch;
  });

  const totalDebt = customers.reduce((s, c) => {
    const d = netCustomerBalance(c);
    return s + (d > 0 ? d : 0);
  }, 0);

  const handleSaved = (savedCustomer) => {
    const normalized = normalizeCustomer(savedCustomer);
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === normalized.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...prev[idx], ...normalized };
        return updated;
      }
      return [normalized, ...prev];
    });
    showToast("تم الحفظ بنجاح");
  };

  const uniqueWilayaNames = [...new Set(customers.map((c) => c.wilaya).filter(Boolean))].sort();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">الزبائن</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة قائمة الزبائن والمدفوعات والرصيد</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color={tab === 3 ? "error" : "secondary"}
              startIcon={<PrintIcon />} onClick={() => setPrintDialog(true)}>
              {tab === 3 ? "طباعة تقرير الديون" : "طباعة تقرير"}
            </SoftButton>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
              إضافة زبون
            </SoftButton>
          </SoftBox>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الزبائن", value: customers.length, color: "info" },
            { label: "نشطون", value: customers.filter(c => c.status === "active").length, color: "success" },
            { label: "مديونون", value: customers.filter(c => netCustomerBalance(c) > 0).length, color: "error" },
            { label: "إجمالي الديون", value: <CompactMillionAmount value={totalDebt} decimals={1} />, color: "warning" },
          ].map((s) => (
            <Grid item xs={6} sm={3} key={s.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={s.color}>{s.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{s.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <SoftBox p={2}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">الكل</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">نشطون</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">غير نشطين</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium" sx={{ color: tab === 3 ? "#ea0606" : "inherit" }}>مديونون</SoftTypography>} />
              </Tabs>
              <SoftBox display="flex" gap={1} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select value={wilayaFilter} onChange={(e) => setWilayaFilter(e.target.value)} displayEmpty>
                    <MenuItem value="all">كل الولايات</MenuItem>
                    {uniqueWilayaNames.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField size="small" placeholder="بحث..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={{ width: 200 }} />
              </SoftBox>
            </SoftBox>

            {loading ? (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>جارٍ التحميل...</SoftTypography>
            ) : (
              <>
                <SoftTypography variant="caption" color="text" mb={2} display="block">{filtered.length} زبون</SoftTypography>
                <Grid container spacing={2}>
                  {filtered.map((c) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
                      <CustomerCard customer={c} onView={setSelectedCustomer} />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <CustomerDetailDialog
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdate={handleSaved}
        onEdit={(c) => { setSelectedCustomer(null); setEditCustomer(c); }}
        users={users}
      />

      <CustomerFormDialog
        open={addDialog || !!editCustomer}
        onClose={() => { setAddDialog(false); setEditCustomer(null); }}
        onSaved={handleSaved}
        editCustomer={editCustomer}
        wilayas={wilayas}
      />

      <PrintReportDialog
        open={printDialog}
        onClose={() => setPrintDialog(false)}
        customers={filtered}
        isDebtMode={tab === 3}
        wilayaFilter={wilayaFilter}
      />

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={hideToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} onClose={hideToast}>{toast.message}</Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}

export default Customers;
