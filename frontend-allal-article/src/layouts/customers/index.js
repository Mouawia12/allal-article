/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
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
import { WILAYAS } from "data/wilayas";


// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockCustomers = [
  {
    id: 1, name: "شركة الرياض للمقاولات", phone: "0555-123456", phone2: "0555-654321",
    address: "حي السعادة، شارع العلماء", wilaya: "وهران",
    salesperson: "أحمد محمد", ordersCount: 12, lastOrder: "2024-01-22",
    totalAmount: 14520000, paidAmount: 12000000, openingBalance: 500000,
    status: "active", shippingRoute: "وهران - الساحل",
    orders: [
      { id: "ORD-001", date: "2024-01-22", amount: 2500000, paid: 2500000, status: "paid" },
      { id: "ORD-002", date: "2024-01-15", amount: 4800000, paid: 2400000, status: "partial" },
      { id: "ORD-003", date: "2024-01-08", amount: 3200000, paid: 0,       status: "unpaid" },
    ],
    payments: [
      { id: "PMT-001", date: "2024-01-22", amount: 2500000, type: "cash",   direction: "in",  receiver: "أحمد محمد", payer: "شركة الرياض" },
      { id: "PMT-002", date: "2024-01-18", amount: 2400000, type: "bank",   direction: "in",  receiver: "خالد عمر",  payer: "شركة الرياض" },
      { id: "PMT-003", date: "2024-01-20", amount:  200000, type: "cash",   direction: "out", receiver: "شركة الرياض", payer: "الإدارة" },
    ],
  },
  {
    id: 2, name: "مؤسسة البناء الحديث", phone: "0561-789012", phone2: "",
    address: "المنطقة الصناعية، قطعة 14", wilaya: "الجزائر",
    salesperson: "خالد عمر", ordersCount: 7, lastOrder: "2024-01-16",
    totalAmount: 8750000, paidAmount: 8750000, openingBalance: 0,
    status: "active", shippingRoute: "الجزائر - وسط",
    orders: [
      { id: "ORD-010", date: "2024-01-16", amount: 3500000, paid: 3500000, status: "paid" },
      { id: "ORD-011", date: "2024-01-05", amount: 5250000, paid: 5250000, status: "paid" },
    ],
    payments: [],
  },
  {
    id: 3, name: "شركة الإنشاءات المتحدة", phone: "0536-345678", phone2: "0536-111222",
    address: "حي النصر، الطريق الوطني 4", wilaya: "سطيف",
    salesperson: "محمد سعيد", ordersCount: 18, lastOrder: "2024-01-17",
    totalAmount: 31200000, paidAmount: 16200000, openingBalance: 1000000,
    status: "active", shippingRoute: "سطيف - الشرق",
    orders: [
      { id: "ORD-020", date: "2024-01-17", amount: 10000000, paid: 0,        status: "unpaid" },
      { id: "ORD-021", date: "2024-01-10", amount: 10000000, paid: 5000000,  status: "partial" },
      { id: "ORD-022", date: "2024-01-03", amount: 11200000, paid: 11200000, status: "paid" },
    ],
    payments: [
      { id: "PMT-010", date: "2024-01-17", amount: 5000000, type: "cheque", direction: "in", receiver: "محمد سعيد", payer: "شركة الإنشاءات" },
    ],
  },
  {
    id: 4, name: "مجموعة الخليج للتطوير", phone: "0502-901234", phone2: "",
    address: "شارع الاستقلال رقم 7", wilaya: "قسنطينة",
    salesperson: "أحمد محمد", ordersCount: 4, lastOrder: "2024-01-18",
    totalAmount: 4280000, paidAmount: 4280000, openingBalance: 0,
    status: "active", shippingRoute: "قسنطينة - الشرق",
    orders: [
      { id: "ORD-030", date: "2024-01-18", amount: 4280000, paid: 4280000, status: "paid" },
    ],
    payments: [],
  },
  {
    id: 5, name: "شركة الأفق للتجارة", phone: "0518-567890", phone2: "",
    address: "حي الشهداء رقم 22", wilaya: "وهران",
    salesperson: "يوسف علي", ordersCount: 9, lastOrder: "2024-01-18",
    totalAmount: 9860000, paidAmount: 5000000, openingBalance: 250000,
    status: "active", shippingRoute: "وهران - الغرب",
    orders: [
      { id: "ORD-040", date: "2024-01-18", amount: 4860000, paid: 0,       status: "unpaid" },
      { id: "ORD-041", date: "2024-01-11", amount: 5000000, paid: 5000000, status: "paid" },
    ],
    payments: [
      { id: "PMT-020", date: "2024-01-12", amount: 5000000, type: "bank", direction: "in", receiver: "يوسف علي", payer: "شركة الأفق" },
    ],
  },
  {
    id: 6, name: "مؤسسة النجاح التجارية", phone: "0544-123456", phone2: "",
    address: "شارع بن باديس رقم 3", wilaya: "الجلفة",
    salesperson: "خالد عمر", ordersCount: 3, lastOrder: "2024-01-10",
    totalAmount: 2980000, paidAmount: 2980000, openingBalance: 0,
    status: "inactive", shippingRoute: "—",
    orders: [],
    payments: [],
  },
];

function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

const paymentTypeLabel = { cash: "نقدي", bank: "تحويل بنكي", cheque: "شيك" };

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onView }) {
  const colorIdx = customer.id % avatarColors.length;
  const balance = customer.totalAmount - customer.paidAmount - customer.openingBalance;
  const hasDebt = balance > 0;

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
                badgeContent={`مديون ${(balance / 1000000).toFixed(1)}م`} container />
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>

      {[
        { icon: PhoneIcon,       value: customer.phone },
        { icon: LocationOnIcon,  value: `${customer.wilaya} — ${customer.address.substring(0, 28)}...` },
        { icon: PersonIcon,      value: customer.salesperson },
        { icon: LocalShippingIcon, value: customer.shippingRoute },
      ].map(({ icon: Icon, value }) => (
        <SoftBox key={value} display="flex" alignItems="center" gap={1} mb={0.6}>
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
            {hasDebt ? `${(balance / 1000000).toFixed(1)}م` : "صفر"} دج
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">الرصيد</SoftTypography>
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
function AddPaymentDialog({ open, onClose, customer }) {
  const [direction, setDirection] = useState("in");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("cash");
  const [receiver, setReceiver] = useState("");
  const [payer, setPayer] = useState(customer?.name || "");
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h6" fontWeight="bold">تسجيل دفعة</SoftTypography>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        {/* Direction toggle */}
        <SoftBox display="flex" gap={1} mb={2}>
          <SoftButton
            variant={direction === "in" ? "gradient" : "outlined"}
            color="success" size="small" fullWidth
            startIcon={<ArrowDownwardIcon />}
            onClick={() => setDirection("in")}
          >
            استلام دفعة من الزبون
          </SoftButton>
          <SoftButton
            variant={direction === "out" ? "gradient" : "outlined"}
            color="error" size="small" fullWidth
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setDirection("out")}
          >
            إرجاع مبلغ للزبون
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small" label="المبلغ (دج)" type="number"
              value={amount} onChange={(e) => setAmount(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} label="طريقة الدفع">
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bank">تحويل بنكي</MenuItem>
                <MenuItem value="cheque">شيك</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small"
              label={direction === "in" ? "استلم بواسطة" : "دفع بواسطة (الإدارة)"}
              value={receiver} onChange={(e) => setReceiver(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small"
              label={direction === "in" ? "من الزبون" : "استلمها الزبون"}
              value={payer} onChange={(e) => setPayer(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth size="small" label="ملاحظات"
              multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color={direction === "in" ? "success" : "error"} size="small" onClick={onClose}>
          {direction === "in" ? "تسجيل الاستلام" : "تسجيل الإرجاع"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Customer Detail Dialog ───────────────────────────────────────────────────
function CustomerDetailDialog({ customer, onClose }) {
  const [tab, setTab] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  if (!customer) return null;

  const colorIdx = customer.id % avatarColors.length;
  const balance = customer.totalAmount - customer.paidAmount - customer.openingBalance;

  const orderStatusColors = { paid: "#66BB6A", partial: "#fb8c00", unpaid: "#ea0606" };
  const orderStatusLabels = { paid: "مدفوعة", partial: "مدفوعة جزئياً", unpaid: "غير مدفوعة" };

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
                <SoftBadge
                  variant="gradient"
                  color={customer.status === "active" ? "success" : "secondary"}
                  size="xs" badgeContent={customer.status === "active" ? "نشط" : "غير نشط"} container
                />
                <SoftTypography variant="caption" color="secondary">| {customer.wilaya}</SoftTypography>
              </SoftBox>
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      {/* Balance summary bar */}
      <SoftBox
        sx={{ px: 3, py: 1.5, background: balance > 0 ? "#fff5f5" : "#f0fff4", borderBottom: "1px solid #eee" }}
        display="flex" gap={4} flexWrap="wrap"
      >
        {[
          { label: "إجمالي الطلبيات", value: `${(customer.totalAmount / 1000000).toFixed(2)}م دج`, color: "#344767" },
          { label: "إجمالي المدفوع",  value: `${(customer.paidAmount / 1000000).toFixed(2)}م دج`,  color: "#66BB6A" },
          { label: "الرصيد الافتتاحي", value: `${(customer.openingBalance / 1000000).toFixed(2)}م دج`, color: "#17c1e8" },
          { label: "الرصيد المتبقي",   value: `${(balance / 1000000).toFixed(2)}م دج`, color: balance > 0 ? "#ea0606" : "#66BB6A" },
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
        {/* Tab 0: Info */}
        {tab === 0 && (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {[
                { label: "الهاتف الرئيسي",  value: customer.phone },
                { label: "الهاتف الثاني",   value: customer.phone2 || "—" },
                { label: "الولاية",          value: customer.wilaya },
                { label: "العنوان",          value: customer.address },
              ].map((row) => (
                <SoftBox key={row.label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                  <SoftTypography variant="body2" color="text">{row.value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
            <Grid item xs={12} sm={6}>
              {[
                { label: "البائع المسؤول",   value: customer.salesperson },
                { label: "مسار الشحن",       value: customer.shippingRoute },
                { label: "آخر طلبية",        value: customer.lastOrder },
                { label: "الرصيد الافتتاحي", value: `${customer.openingBalance.toLocaleString()} دج` },
              ].map((row) => (
                <SoftBox key={row.label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                  <SoftTypography variant="body2" fontWeight="bold" color="text">{row.value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Orders */}
        {tab === 1 && (
          <SoftBox>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <SoftTypography variant="caption" color="text">{customer.orders.length} طلبية</SoftTypography>
              <SoftBox display="flex" gap={1}>
                <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}>
                  طباعة كشف الحساب
                </SoftButton>
                <SoftButton variant="outlined" color="success" size="small" startIcon={<WhatsAppIcon />}
                  sx={{ color: "#25D366", borderColor: "#25D366" }}>
                  واتساب PDF
                </SoftButton>
              </SoftBox>
            </SoftBox>
            {customer.orders.map((o) => {
              const remaining = o.amount - o.paid;
              return (
                <SoftBox key={o.id} mb={1.5} p={1.5} sx={{
                  border: `2px solid ${orderStatusColors[o.status]}33`,
                  borderRight: `4px solid ${orderStatusColors[o.status]}`,
                  borderRadius: 1.5,
                  background: o.status === "unpaid" ? "#fff5f5" : o.status === "partial" ? "#fffbeb" : "#f0fff4",
                }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{o.id}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">{o.date}</SoftTypography>
                    </SoftBox>
                    <SoftBox textAlign="right">
                      <SoftTypography variant="caption" fontWeight="bold">
                        {o.amount.toLocaleString()} دج
                      </SoftTypography>
                      {remaining > 0 && (
                        <SoftTypography variant="caption" color="error" display="block">
                          متبقي: {remaining.toLocaleString()} دج
                        </SoftTypography>
                      )}
                    </SoftBox>
                    <SoftBadge variant="gradient"
                      color={o.status === "paid" ? "success" : o.status === "partial" ? "warning" : "error"}
                      size="xs" badgeContent={orderStatusLabels[o.status]} container />
                  </SoftBox>
                </SoftBox>
              );
            })}
          </SoftBox>
        )}

        {/* Tab 2: Payments */}
        {tab === 2 && (
          <SoftBox>
            <SoftBox display="flex" justifyContent="space-between" mb={2}>
              <SoftTypography variant="caption" color="text">{customer.payments.length} دفعة مسجلة</SoftTypography>
              <SoftButton variant="gradient" color="info" size="small" startIcon={<PaymentIcon />}
                onClick={() => setPaymentDialog(true)}>
                تسجيل دفعة
              </SoftButton>
            </SoftBox>
            {customer.payments.length === 0 && (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                لا توجد دفعات مسجلة
              </SoftTypography>
            )}
            {customer.payments.map((p) => (
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
                        : <ArrowUpwardIcon fontSize="small" sx={{ color: "#ea0606" }} />
                      }
                      <SoftTypography variant="caption" fontWeight="bold">
                        {p.direction === "in" ? "استلام" : "إرجاع"} — {paymentTypeLabel[p.type]}
                      </SoftTypography>
                    </SoftBox>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      {p.date} | استلم: {p.receiver} | من: {p.payer}
                    </SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="button" fontWeight="bold"
                    sx={{ color: p.direction === "in" ? "#66BB6A" : "#ea0606" }}>
                    {p.direction === "in" ? "+" : "-"}{p.amount.toLocaleString()} دج
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>
        )}

        {/* Tab 3: Shipping */}
        {tab === 3 && (
          <SoftBox>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={6}>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">مسار الشحن</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.shippingRoute}</SoftTypography>
                </SoftBox>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">الولاية</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.wilaya}</SoftTypography>
                </SoftBox>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">زبون الفواتير (تلقائي)</SoftTypography>
                  <SoftTypography variant="body2" color="text">موزع {customer.wilaya} الرئيسي</SoftTypography>
                </SoftBox>
              </Grid>
            </Grid>
            <Divider />
            <SoftBox mt={2}>
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
                سجل الشحنات
              </SoftTypography>
              {[
                { date: "2024-01-22", driver: "حمزة بلقاسم", invoice: "FTR-2024-001", status: "في الطريق" },
                { date: "2024-01-10", driver: "كريم بوزيد",  invoice: "FTR-2024-002", status: "مسلّمة" },
              ].map((s) => (
                <SoftBox key={s.invoice} mb={1} p={1.5}
                  sx={{ background: "#f8f9fa", borderRadius: 1.5, border: "1px solid #e9ecef" }}>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{s.invoice}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {s.date} | السائق: {s.driver}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBadge variant="gradient"
                      color={s.status === "مسلّمة" ? "success" : "info"}
                      size="xs" badgeContent={s.status} container />
                  </SoftBox>
                </SoftBox>
              ))}
            </SoftBox>
          </SoftBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إغلاق</SoftButton>
        <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />}>تعديل</SoftButton>
        <SoftButton variant="outlined" color="success" size="small" startIcon={<PaymentIcon />}
          onClick={() => setPaymentDialog(true)}>
          دفعة
        </SoftButton>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<ShoppingCartIcon />}>
          طلبية جديدة
        </SoftButton>
      </DialogActions>

      <AddPaymentDialog open={paymentDialog} onClose={() => setPaymentDialog(false)} customer={customer} />
    </Dialog>
  );
}

// ─── Add Customer Dialog ──────────────────────────────────────────────────────
function AddCustomerDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>إضافة زبون جديد</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="اسم الزبون / الشركة *" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="رقم الهاتف *" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="الهاتف الثاني" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>الولاية *</InputLabel>
              <Select defaultValue="" label="الولاية *">
                {WILAYAS.map((w) => (
                  <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="العنوان التفصيلي" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="مسار الشحن" size="small" placeholder="مثال: وهران - الساحل" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="البريد الإلكتروني" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="الرصيد الافتتاحي (دج)" type="number" size="small"
              helperText="رصيد سابق قبل بدء التسجيل في البرنامج" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="البائع المسؤول" size="small" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={onClose}>حفظ الزبون</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Print Dialog ─────────────────────────────────────────────────────────────
function PrintReportDialog({ open, onClose, customers, isDebtMode, wilayaFilter }) {
  const title = isDebtMode
    ? `تقرير الديون${wilayaFilter !== "all" ? ` — ولاية ${wilayaFilter}` : ""}`
    : `قائمة الزبائن${wilayaFilter !== "all" ? ` — ولاية ${wilayaFilter}` : ""}`;

  const printDate = new Date().toLocaleDateString("ar-DZ");
  const totalDebt = customers.reduce((s, c) => {
    const d = c.totalAmount - c.paidAmount - c.openingBalance;
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
        {/* ── Report Header ── */}
        <SoftBox textAlign="center" mb={3}>
          <SoftTypography variant="h5" fontWeight="bold">{title}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            تاريخ الطباعة: {printDate} | إجمالي: {customers.length} زبون
            {isDebtMode && ` | إجمالي الديون: ${(totalDebt / 1000000).toFixed(2)}م دج`}
          </SoftTypography>
        </SoftBox>

        {isDebtMode ? (
          /* ── Debt Report Template ── */
          <SoftBox>
            <SoftBox mb={2} p={1.5} sx={{ background: "#fff5f5", borderRadius: 2, border: "1px solid #ea060622" }}>
              <SoftBox display="flex" justifyContent="space-between">
                <SoftTypography variant="button" fontWeight="bold" color="error">
                  إجمالي الديون المستحقة
                </SoftTypography>
                <SoftTypography variant="h6" fontWeight="bold" color="error">
                  {totalDebt.toLocaleString()} دج
                </SoftTypography>
              </SoftBox>
            </SoftBox>

            {customers.map((c) => {
              const debt = c.totalAmount - c.paidAmount - c.openingBalance;
              if (debt <= 0) return null;
              return (
                <SoftBox key={c.id} mb={2} sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
                  {/* Customer header */}
                  <SoftBox px={2} py={1.5} sx={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}
                    display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="button" fontWeight="bold">{c.name}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {c.wilaya} | {c.phone} | البائع: {c.salesperson}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox textAlign="right">
                      <SoftTypography variant="caption" color="secondary">إجمالي الدين</SoftTypography>
                      <SoftTypography variant="h6" fontWeight="bold" color="error" display="block">
                        {debt.toLocaleString()} دج
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>

                  {/* Orders breakdown */}
                  <SoftBox px={2} py={1}>
                    {[
                      { label: "إجمالي الطلبيات", value: c.totalAmount.toLocaleString(), color: "#344767" },
                      { label: "إجمالي المدفوع",  value: c.paidAmount.toLocaleString(),  color: "#66BB6A" },
                      { label: "الرصيد الافتتاحي", value: c.openingBalance.toLocaleString(), color: "#17c1e8" },
                    ].map((row) => (
                      <SoftBox key={row.label} display="flex" justifyContent="space-between" mb={0.5}>
                        <SoftTypography variant="caption" color="secondary">{row.label}:</SoftTypography>
                        <SoftTypography variant="caption" fontWeight="bold" sx={{ color: row.color }}>
                          {row.value} دج
                        </SoftTypography>
                      </SoftBox>
                    ))}
                    <Divider sx={{ my: 0.5 }} />
                    {c.orders && c.orders.filter(o => o.status !== "paid").map((o) => (
                      <SoftBox key={o.id} display="flex" justifyContent="space-between" mb={0.4}
                        sx={{ background: o.status === "unpaid" ? "#fff5f5" : "#fffbeb", p: "4px 8px", borderRadius: 1 }}>
                        <SoftTypography variant="caption">{o.id} — {o.date}</SoftTypography>
                        <SoftBox display="flex" gap={2}>
                          <SoftTypography variant="caption" color="secondary">
                            إجمالي: {o.amount.toLocaleString()}
                          </SoftTypography>
                          <SoftTypography variant="caption" color="error" fontWeight="bold">
                            متبقي: {(o.amount - o.paid).toLocaleString()} دج
                          </SoftTypography>
                        </SoftBox>
                      </SoftBox>
                    ))}
                  </SoftBox>
                </SoftBox>
              );
            })}
          </SoftBox>
        ) : (
          /* ── Regular Customers List Template ── */
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
                    <td style={{ padding: "7px 10px" }}>
                      <SoftTypography variant="caption" color="secondary">{i + 1}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftTypography variant="caption" fontWeight="bold">{c.name}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftTypography variant="caption">{c.phone}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftTypography variant="caption">{c.wilaya}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftTypography variant="caption">{c.salesperson}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}>
                      <SoftTypography variant="caption" fontWeight="bold">{c.ordersCount}</SoftTypography>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <SoftBadge
                        variant="gradient"
                        color={c.status === "active" ? "success" : "secondary"}
                        size="xs"
                        badgeContent={c.status === "active" ? "نشط" : "غير نشط"}
                        container
                      />
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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [printDialog, setPrintDialog] = useState(false);

  // tab: 0=الكل 1=نشطون 2=غير نشطين 3=مديونون
  const filtered = mockCustomers.filter((c) => {
    const debt = c.totalAmount - c.paidAmount - c.openingBalance;
    const matchStatus =
      tab === 0 ? true :
      tab === 1 ? c.status === "active" :
      tab === 2 ? c.status === "inactive" :
      debt > 0;
    const matchWilaya = wilayaFilter === "all" || c.wilaya === wilayaFilter;
    const matchSearch =
      c.name.includes(search) ||
      c.phone.includes(search) ||
      c.salesperson.includes(search) ||
      c.wilaya.includes(search);
    return matchStatus && matchWilaya && matchSearch;
  });

  const totalDebt = mockCustomers.reduce((s, c) => {
    const d = c.totalAmount - c.paidAmount - c.openingBalance;
    return s + (d > 0 ? d : 0);
  }, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">الزبائن</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة قائمة الزبائن والمدفوعات والرصيد</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton
              variant="outlined"
              color={tab === 3 ? "error" : "secondary"}
              startIcon={<PrintIcon />}
              onClick={() => setPrintDialog(true)}
            >
              {tab === 3 ? "طباعة تقرير الديون" : "طباعة تقرير"}
            </SoftButton>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
              إضافة زبون
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الزبائن",   value: mockCustomers.length,                                           color: "info" },
            { label: "نشطون",             value: mockCustomers.filter(c => c.status === "active").length,        color: "success" },
            { label: "مديونون",           value: mockCustomers.filter(c => c.totalAmount - c.paidAmount > 0).length, color: "error" },
            { label: "إجمالي الديون",    value: `${(totalDebt / 1000000).toFixed(1)}م دج`,                      color: "warning" },
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
            {/* Tabs + Filters */}
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
                    {WILAYAS.map((w) => (
                      <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small" placeholder="بحث..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ width: 200 }}
                />
              </SoftBox>
            </SoftBox>

            <SoftTypography variant="caption" color="text" mb={2} display="block">
              {filtered.length} زبون
            </SoftTypography>

            <Grid container spacing={2}>
              {filtered.map((c) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
                  <CustomerCard customer={c} onView={setSelectedCustomer} />
                </Grid>
              ))}
            </Grid>
          </SoftBox>
        </Card>
      </SoftBox>

      <CustomerDetailDialog customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      <AddCustomerDialog open={addDialog} onClose={() => setAddDialog(false)} />

      <PrintReportDialog
        open={printDialog}
        onClose={() => setPrintDialog(false)}
        customers={filtered}
        isDebtMode={tab === 3}
        wilayaFilter={wilayaFilter}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default Customers;
