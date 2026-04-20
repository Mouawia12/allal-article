/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PaymentIcon from "@mui/icons-material/Payment";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Avatar from "@mui/material/Avatar";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import GridViewIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const categories = ["الكل", "مسامير وبراغي", "أدوات", "كهرباء", "سباكة", "دهانات", "مواد عزل", "معدات"];

// weightPerUnit: وزن وحدة قياس واحدة (كغ) | unitsPerPackage: عدد القطع في كرطون/علبة | packageUnit: اسم وحدة التعليب
const mockProducts = [
  { id: 1,  name: "برغي M10 × 50mm",    code: "BRG-010-50", category: "مسامير وبراغي", stock: 850,  unit: "قطعة", color: "#FF6B6B", weightPerUnit: 0.05,  unitsPerPackage: 100, packageUnit: "كرطون" },
  { id: 2,  name: "برغي M8 × 30mm",     code: "BRG-008-30", category: "مسامير وبراغي", stock: 1200, unit: "قطعة", color: "#FF6B6B", weightPerUnit: 0.03,  unitsPerPackage: 200, packageUnit: "كرطون" },
  { id: 3,  name: "صامولة M10",          code: "SAM-010",    category: "مسامير وبراغي", stock: 600,  unit: "قطعة", color: "#FF6B6B", weightPerUnit: 0.02,  unitsPerPackage: 500, packageUnit: "كيس"   },
  { id: 4,  name: "مفتاح ربط 17mm",     code: "MFT-017",    category: "أدوات",          stock: 45,   unit: "قطعة", color: "#4ECDC4", weightPerUnit: 0.35,  unitsPerPackage: 12,  packageUnit: "علبة"  },
  { id: 5,  name: "مفتاح ربط 22mm",     code: "MFT-022",    category: "أدوات",          stock: 30,   unit: "قطعة", color: "#4ECDC4", weightPerUnit: 0.5,   unitsPerPackage: 12,  packageUnit: "علبة"  },
  { id: 6,  name: "كماشة عالمية",        code: "KMA-UNI",    category: "أدوات",          stock: 0,    unit: "قطعة", color: "#4ECDC4", weightPerUnit: 0.4,   unitsPerPackage: 6,   packageUnit: "علبة"  },
  { id: 7,  name: "كابل كهربائي 2.5mm", code: "KBL-25",     category: "كهرباء",         stock: 500,  unit: "متر",  color: "#FFE66D", weightPerUnit: 0.3,   unitsPerPackage: 100, packageUnit: "رزمة"  },
  { id: 8,  name: "كابل كهربائي 1.5mm", code: "KBL-15",     category: "كهرباء",         stock: 800,  unit: "متر",  color: "#FFE66D", weightPerUnit: 0.2,   unitsPerPackage: 100, packageUnit: "رزمة"  },
  { id: 9,  name: "شريط عازل كهربائي",  code: "SHR-EL",     category: "كهرباء",         stock: 200,  unit: "لفة",  color: "#FFE66D", weightPerUnit: 0.1,   unitsPerPackage: 20,  packageUnit: "كرطون" },
  { id: 10, name: "أنبوب PVC 2 بوصة",   code: "ANB-PVC-2",  category: "سباكة",          stock: 100,  unit: "متر",  color: "#A8E6CF", weightPerUnit: 1.2,   unitsPerPackage: 6,   packageUnit: "طرد"   },
  { id: 11, name: "أنبوب PVC 1 بوصة",   code: "ANB-PVC-1",  category: "سباكة",          stock: 150,  unit: "متر",  color: "#A8E6CF", weightPerUnit: 0.7,   unitsPerPackage: 6,   packageUnit: "طرد"   },
  { id: 12, name: "صنبور مياه",          code: "SNB-MYA",    category: "سباكة",          stock: 25,   unit: "قطعة", color: "#A8E6CF", weightPerUnit: 0.45,  unitsPerPackage: 10,  packageUnit: "علبة"  },
  { id: 13, name: "دهان أبيض 4L",       code: "DHN-WHT-4",  category: "دهانات",         stock: 80,   unit: "علبة", color: "#DDA0DD", weightPerUnit: 4.5,   unitsPerPackage: 4,   packageUnit: "كرطون" },
  { id: 14, name: "دهان رمادي 4L",      code: "DHN-GRY-4",  category: "دهانات",         stock: 60,   unit: "علبة", color: "#DDA0DD", weightPerUnit: 4.5,   unitsPerPackage: 4,   packageUnit: "كرطون" },
  { id: 15, name: "شريط عازل حراري",    code: "SHR-HRR",    category: "مواد عزل",       stock: 120,  unit: "لفة",  color: "#B0C4DE", weightPerUnit: 0.15,  unitsPerPackage: 24,  packageUnit: "كرطون" },
  { id: 16, name: "لوح خشبي 2×4",      code: "LWH-2X4",    category: "معدات",          stock: 200,  unit: "قطعة", color: "#F4A460", weightPerUnit: 2.0,   unitsPerPackage: 10,  packageUnit: "رزمة"  },
];

// حساب عدد الكراطين/العلب من الكمية
function calcPackages(qty, product) {
  if (!product.unitsPerPackage || product.unitsPerPackage <= 0) return null;
  return Math.ceil(qty / product.unitsPerPackage);
}

const mockCustomers = [
  {
    id: 1,
    name: "شركة الرياض للمقاولات",
    phone: "0555-123456",
    phone2: "0555-654321",
    email: "riyadh@example.com",
    wilaya: "وهران",
    address: "حي السعادة، شارع العلماء",
    salesperson: "أحمد محمد",
    ordersCount: 12,
    lastOrder: "2024-01-22",
    totalAmount: 14520000,
    paidAmount: 12000000,
    openingBalance: 500000,
    status: "active",
    shippingRoute: "وهران - الساحل",
    orders: [
      { id: "ORD-001", date: "2024-01-22", amount: 2500000, paid: 2500000, status: "paid" },
      { id: "ORD-002", date: "2024-01-15", amount: 4800000, paid: 2400000, status: "partial" },
      { id: "ORD-003", date: "2024-01-08", amount: 3200000, paid: 0, status: "unpaid" },
    ],
    payments: [
      { id: "PMT-001", date: "2024-01-22", amount: 2500000, type: "cash", direction: "in", receiver: "أحمد محمد", payer: "شركة الرياض" },
      { id: "PMT-002", date: "2024-01-18", amount: 2400000, type: "bank", direction: "in", receiver: "خالد عمر", payer: "شركة الرياض" },
      { id: "PMT-003", date: "2024-01-20", amount: 200000, type: "cash", direction: "out", receiver: "شركة الرياض", payer: "الإدارة" },
    ],
  },
  {
    id: 2,
    name: "مؤسسة البناء الحديث",
    phone: "0561-789012",
    phone2: "",
    email: "modern@example.com",
    wilaya: "الجزائر",
    address: "المنطقة الصناعية، قطعة 14",
    salesperson: "خالد عمر",
    ordersCount: 7,
    lastOrder: "2024-01-16",
    totalAmount: 8750000,
    paidAmount: 8750000,
    openingBalance: 0,
    status: "active",
    shippingRoute: "الجزائر - وسط",
    orders: [
      { id: "ORD-010", date: "2024-01-16", amount: 3500000, paid: 3500000, status: "paid" },
      { id: "ORD-011", date: "2024-01-05", amount: 5250000, paid: 5250000, status: "paid" },
    ],
    payments: [],
  },
  {
    id: 3,
    name: "شركة الإنشاءات المتحدة",
    phone: "0536-345678",
    phone2: "0536-111222",
    email: "united@example.com",
    wilaya: "سطيف",
    address: "حي النصر، الطريق الوطني 4",
    salesperson: "محمد سعيد",
    ordersCount: 18,
    lastOrder: "2024-01-17",
    totalAmount: 31200000,
    paidAmount: 16200000,
    openingBalance: 1000000,
    status: "active",
    shippingRoute: "سطيف - الشرق",
    orders: [
      { id: "ORD-020", date: "2024-01-17", amount: 10000000, paid: 0, status: "unpaid" },
      { id: "ORD-021", date: "2024-01-10", amount: 10000000, paid: 5000000, status: "partial" },
      { id: "ORD-022", date: "2024-01-03", amount: 11200000, paid: 11200000, status: "paid" },
    ],
    payments: [
      { id: "PMT-010", date: "2024-01-17", amount: 5000000, type: "cheque", direction: "in", receiver: "محمد سعيد", payer: "شركة الإنشاءات" },
    ],
  },
  {
    id: 4,
    name: "مجموعة الخليج للتطوير",
    phone: "0502-901234",
    phone2: "",
    email: "gulf@example.com",
    wilaya: "قسنطينة",
    address: "شارع الاستقلال رقم 7",
    salesperson: "أحمد محمد",
    ordersCount: 4,
    lastOrder: "2024-01-18",
    totalAmount: 4280000,
    paidAmount: 4280000,
    openingBalance: 0,
    status: "active",
    shippingRoute: "قسنطينة - الشرق",
    orders: [
      { id: "ORD-030", date: "2024-01-18", amount: 4280000, paid: 4280000, status: "paid" },
    ],
    payments: [],
  },
  {
    id: 5,
    name: "شركة الأفق للتجارة",
    phone: "0518-567890",
    phone2: "",
    email: "horizon@example.com",
    wilaya: "وهران",
    address: "حي الشهداء رقم 22",
    salesperson: "يوسف علي",
    ordersCount: 9,
    lastOrder: "2024-01-18",
    totalAmount: 9860000,
    paidAmount: 5000000,
    openingBalance: 250000,
    status: "active",
    shippingRoute: "وهران - الغرب",
    orders: [
      { id: "ORD-040", date: "2024-01-18", amount: 4860000, paid: 0, status: "unpaid" },
      { id: "ORD-041", date: "2024-01-11", amount: 5000000, paid: 5000000, status: "paid" },
    ],
    payments: [
      { id: "PMT-020", date: "2024-01-12", amount: 5000000, type: "bank", direction: "in", receiver: "يوسف علي", payer: "شركة الأفق" },
    ],
  },
];

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];
const paymentTypeLabel = { cash: "نقدي", bank: "تحويل بنكي", cheque: "شيك" };
const orderStatusColors = { paid: "#66BB6A", partial: "#fb8c00", unpaid: "#ea0606" };
const orderStatusLabels = { paid: "مدفوعة", partial: "مدفوعة جزئياً", unpaid: "غير مدفوعة" };

const emptyNewCustomerForm = {
  name: "",
  phone: "",
  phone2: "",
  wilaya: "",
  address: "",
  email: "",
  shippingRoute: "",
  openingBalance: "",
  salesperson: "",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("") || "ز";
}

function getCustomerBalance(customer, paidDelta = 0) {
  if (!customer) return 0;

  if (typeof customer.balance === "number") {
    return Math.max(0, customer.balance - paidDelta);
  }

  return Math.max(
    0,
    (customer.totalAmount || 0) - ((customer.paidAmount || 0) + paidDelta) - (customer.openingBalance || 0)
  );
}

function formatMillionAmount(amount) {
  return `${((amount || 0) / 1000000).toFixed(2)}م دج`;
}

function AddPaymentDialog({ open, onClose, customer, onSave }) {
  const [direction, setDirection] = useState("in");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("cash");
  const [receiver, setReceiver] = useState("");
  const [payer, setPayer] = useState(customer?.name || "");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    setDirection("in");
    setAmount("");
    setType("cash");
    setReceiver("");
    setPayer(customer?.name || "");
    setNotes("");
  }, [customer, open]);

  const handleSave = () => {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) return;

    onSave({
      id: `PMT-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: numericAmount,
      type,
      direction,
      receiver: receiver.trim() || (direction === "in" ? "البائع الحالي" : customer?.name || "الزبون"),
      payer: payer.trim() || (direction === "in" ? customer?.name || "الزبون" : "الإدارة"),
      notes: notes.trim(),
    });
    onClose();
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
          <SoftButton
            variant={direction === "in" ? "gradient" : "outlined"}
            color="success"
            size="small"
            fullWidth
            startIcon={<ArrowDownwardIcon />}
            onClick={() => setDirection("in")}
          >
            استلام دفعة من الزبون
          </SoftButton>
          <SoftButton
            variant={direction === "out" ? "gradient" : "outlined"}
            color="error"
            size="small"
            fullWidth
            startIcon={<ArrowUpwardIcon />}
            onClick={() => setDirection("out")}
          >
            إرجاع مبلغ للزبون
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="المبلغ (دج)"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select value={type} label="طريقة الدفع" onChange={(event) => setType(event.target.value)}>
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bank">تحويل بنكي</MenuItem>
                <MenuItem value="cheque">شيك</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label={direction === "in" ? "استلم بواسطة" : "دفع بواسطة (الإدارة)"}
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label={direction === "in" ? "من الزبون" : "استلمها الزبون"}
              value={payer}
              onChange={(event) => setPayer(event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="ملاحظات"
              multiline
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton
          variant="gradient"
          color={direction === "in" ? "success" : "error"}
          size="small"
          disabled={!Number(amount)}
          onClick={handleSave}
        >
          {direction === "in" ? "تسجيل الاستلام" : "تسجيل الإرجاع"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

function CustomerInfoDialog({ customer, onClose }) {
  const [tab, setTab] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [recordedPayments, setRecordedPayments] = useState([]);

  useEffect(() => {
    setTab(0);
    setPaymentDialog(false);
    setRecordedPayments([]);
  }, [customer?.id]);

  if (!customer) return null;

  const colorIdx = customer.id % avatarColors.length;
  const payments = [...(customer.payments || []), ...recordedPayments];
  const paidDelta = recordedPayments.reduce(
    (sum, payment) => sum + (payment.direction === "in" ? payment.amount : -payment.amount),
    0
  );
  const totalAmount = customer.totalAmount || 0;
  const paidAmount = (customer.paidAmount || 0) + paidDelta;
  const openingBalance = customer.openingBalance || 0;
  const balance = getCustomerBalance(customer, paidDelta);
  const orders = customer.orders || [];

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
                  size="xs"
                  badgeContent={customer.status === "active" ? "نشط" : "غير نشط"}
                  container
                />
                <SoftTypography variant="caption" color="secondary">| {customer.wilaya || "بدون ولاية"}</SoftTypography>
              </SoftBox>
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <SoftBox
        sx={{ px: 3, py: 1.5, background: balance > 0 ? "#fff5f5" : "#f0fff4", borderBottom: "1px solid #eee" }}
        display="flex"
        gap={4}
        flexWrap="wrap"
      >
        {[
          { label: "إجمالي الطلبيات", value: formatMillionAmount(totalAmount), color: "#344767" },
          { label: "إجمالي المدفوع", value: formatMillionAmount(paidAmount), color: "#66BB6A" },
          { label: "الرصيد الافتتاحي", value: formatMillionAmount(openingBalance), color: "#17c1e8" },
          { label: "الرصيد المتبقي", value: formatMillionAmount(balance), color: balance > 0 ? "#ea0606" : "#66BB6A" },
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
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          textColor="inherit"
          TabIndicatorProps={{ style: { background: "#17c1e8" } }}
        >
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
                { label: "الهاتف الرئيسي", value: customer.phone || "—" },
                { label: "الهاتف الثاني", value: customer.phone2 || "—" },
                { label: "الولاية", value: customer.wilaya || "—" },
                { label: "العنوان", value: customer.address || "—" },
                { label: "البريد الإلكتروني", value: customer.email || "—" },
              ].map((row) => (
                <SoftBox key={row.label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                  <SoftTypography variant="body2" color="text">{row.value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
            <Grid item xs={12} sm={6}>
              {[
                { label: "البائع المسؤول", value: customer.salesperson || "—" },
                { label: "مسار الشحن", value: customer.shippingRoute || "—" },
                { label: "عدد الطلبيات", value: `${customer.ordersCount || 0} طلبية` },
                { label: "آخر طلبية", value: customer.lastOrder || "—" },
                { label: "الرصيد الافتتاحي", value: `${openingBalance.toLocaleString()} دج` },
              ].map((row) => (
                <SoftBox key={row.label} mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                  <SoftTypography variant="body2" fontWeight="bold" color="text">{row.value}</SoftTypography>
                </SoftBox>
              ))}
            </Grid>
          </Grid>
        )}

        {tab === 1 && (
          <SoftBox>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <SoftTypography variant="caption" color="text">{orders.length} طلبية</SoftTypography>
              <SoftBox display="flex" gap={1}>
                <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}>
                  طباعة كشف الحساب
                </SoftButton>
                <SoftButton
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  sx={{ color: "#25D366", borderColor: "#25D366" }}
                >
                  واتساب PDF
                </SoftButton>
              </SoftBox>
            </SoftBox>
            {orders.length === 0 && (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                لا توجد طلبيات مسجلة
              </SoftTypography>
            )}
            {orders.map((order) => {
              const remaining = order.amount - order.paid;

              return (
                <SoftBox
                  key={order.id}
                  mb={1.5}
                  p={1.5}
                  sx={{
                    border: `2px solid ${orderStatusColors[order.status]}33`,
                    borderRight: `4px solid ${orderStatusColors[order.status]}`,
                    borderRadius: 1.5,
                    background:
                      order.status === "unpaid" ? "#fff5f5" : order.status === "partial" ? "#fffbeb" : "#f0fff4",
                  }}
                >
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{order.id}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">{order.date}</SoftTypography>
                    </SoftBox>
                    <SoftBox textAlign="right">
                      <SoftTypography variant="caption" fontWeight="bold">
                        {order.amount.toLocaleString()} دج
                      </SoftTypography>
                      {remaining > 0 && (
                        <SoftTypography variant="caption" color="error" display="block">
                          متبقي: {remaining.toLocaleString()} دج
                        </SoftTypography>
                      )}
                    </SoftBox>
                    <SoftBadge
                      variant="gradient"
                      color={order.status === "paid" ? "success" : order.status === "partial" ? "warning" : "error"}
                      size="xs"
                      badgeContent={orderStatusLabels[order.status]}
                      container
                    />
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
              <SoftButton
                variant="gradient"
                color="info"
                size="small"
                startIcon={<PaymentIcon />}
                onClick={() => setPaymentDialog(true)}
              >
                تسجيل دفعة
              </SoftButton>
            </SoftBox>
            {payments.length === 0 && (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                لا توجد دفعات مسجلة
              </SoftTypography>
            )}
            {payments.map((payment) => (
              <SoftBox
                key={payment.id}
                mb={1.5}
                p={1.5}
                sx={{
                  border: `1px solid ${payment.direction === "in" ? "#66BB6A44" : "#ea060644"}`,
                  borderRight: `4px solid ${payment.direction === "in" ? "#66BB6A" : "#ea0606"}`,
                  borderRadius: 1.5,
                  background: payment.direction === "in" ? "#f0fff4" : "#fff5f5",
                }}
              >
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftBox>
                    <SoftBox display="flex" alignItems="center" gap={0.5}>
                      {payment.direction === "in" ? (
                        <ArrowDownwardIcon fontSize="small" sx={{ color: "#66BB6A" }} />
                      ) : (
                        <ArrowUpwardIcon fontSize="small" sx={{ color: "#ea0606" }} />
                      )}
                      <SoftTypography variant="caption" fontWeight="bold">
                        {payment.direction === "in" ? "استلام" : "إرجاع"} - {paymentTypeLabel[payment.type]}
                      </SoftTypography>
                    </SoftBox>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      {payment.date} | استلم: {payment.receiver} | من: {payment.payer}
                    </SoftTypography>
                    {payment.notes && (
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {payment.notes}
                      </SoftTypography>
                    )}
                  </SoftBox>
                  <SoftTypography
                    variant="button"
                    fontWeight="bold"
                    sx={{ color: payment.direction === "in" ? "#66BB6A" : "#ea0606" }}
                  >
                    {payment.direction === "in" ? "+" : "-"}{payment.amount.toLocaleString()} دج
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">زبون الفواتير (تلقائي)</SoftTypography>
                  <SoftTypography variant="body2" color="text">
                    {customer.wilaya ? `موزع ${customer.wilaya} الرئيسي` : "—"}
                  </SoftTypography>
                </SoftBox>
                <SoftBox mb={1.5}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">العنوان</SoftTypography>
                  <SoftTypography variant="body2" color="text">{customer.address || "—"}</SoftTypography>
                </SoftBox>
              </Grid>
            </Grid>
            <Divider />
            <SoftBox mt={2}>
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}>
                سجل الشحنات
              </SoftTypography>
              {orders.slice(0, 2).map((order, index) => (
                <SoftBox
                  key={`${order.id}-shipping`}
                  mb={1}
                  p={1.5}
                  sx={{ background: "#f8f9fa", borderRadius: 1.5, border: "1px solid #e9ecef" }}
                >
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{`FTR-${order.id}`}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {order.date} | السائق: {index === 0 ? "حمزة بلقاسم" : "كريم بوزيد"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBadge
                      variant="gradient"
                      color={index === 0 ? "info" : "success"}
                      size="xs"
                      badgeContent={index === 0 ? "في الطريق" : "مسلّمة"}
                      container
                    />
                  </SoftBox>
                </SoftBox>
              ))}
              {orders.length === 0 && (
                <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>
                  لا توجد شحنات مرتبطة بهذا الزبون
                </SoftTypography>
              )}
            </SoftBox>
          </SoftBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إغلاق</SoftButton>
        <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />}>تعديل</SoftButton>
        <SoftButton
          variant="outlined"
          color="success"
          size="small"
          startIcon={<PaymentIcon />}
          onClick={() => setPaymentDialog(true)}
        >
          دفعة
        </SoftButton>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<ShoppingCartIcon />} onClick={onClose}>
          طلبية جديدة
        </SoftButton>
      </DialogActions>

      <AddPaymentDialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        customer={customer}
        onSave={(payment) => setRecordedPayments((current) => [...current, payment])}
      />
    </Dialog>
  );
}

function getProductGridColumns() {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth < 600) {
    return 2;
  }

  if (window.innerWidth < 900) {
    return 3;
  }

  return 4;
}

function isTypingContext(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, button, a, [contenteditable='true'], [role='button'], [role='textbox'], [role='combobox'], [role='listbox']"
    )
  );
}

function getOrderProductStatus(product) {
  if (product.stock === 0) {
    return { label: "نفذ المخزون", color: "error" };
  }

  if (product.stock < 50) {
    return { label: "مخزون منخفض", color: "warning" };
  }

  return { label: "متوفر", color: "success" };
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, cartItem, onAdd, onEdit, onRemove, selected, onSelect, cardRef }) {
  const inCart = !!cartItem;
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 50;

  return (
    <Card
      ref={cardRef}
      onClick={onSelect}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: inCart ? "2px solid #17c1e8" : "1px solid #e9ecef",
        outline: selected ? "3px solid rgba(23, 193, 232, 0.25)" : "none",
        outlineOffset: 0,
        boxShadow: selected
          ? "0 0 0 1px #17c1e8, 0 12px 28px rgba(23, 193, 232, 0.18)"
          : "none",
        transform: selected ? "translateY(-2px)" : "none",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      {/* Product Color Block (placeholder for image) */}
      <SoftBox
        sx={{
          width: "100%",
          height: 70,
          borderRadius: 2,
          background: outOfStock
            ? "#e0e0e0"
            : `linear-gradient(135deg, ${product.color}88, ${product.color})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
        }}
      >
        <Inventory2Icon sx={{ color: "#fff", fontSize: 28, opacity: 0.8 }} />
        {inCart && (
          <SoftBox
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "#17c1e8",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckIcon sx={{ color: "#fff", fontSize: 14 }} />
          </SoftBox>
        )}
      </SoftBox>

      {/* Info */}
      <SoftTypography variant="button" fontWeight="bold" lineHeight={1.3} mb={0.5}>
        {product.name}
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" mb={1}>
        {product.code}
      </SoftTypography>

      {/* Stock Badge */}
      <SoftBox mb={1.5}>
        {outOfStock ? (
          <Chip label="نفذ المخزون" size="small" color="error" sx={{ height: 20, fontSize: 11 }} />
        ) : lowStock ? (
          <Chip label={`مخزون منخفض: ${product.stock}`} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
        ) : (
          <Chip label={`${product.stock} ${product.unit}`} size="small" color="success" sx={{ height: 20, fontSize: 11 }} />
        )}
      </SoftBox>

      {/* Cart Actions */}
      {inCart ? (
        <SoftBox display="flex" gap={1} mt="auto">
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            fullWidth
            startIcon={<EditIcon />}
            onClick={() => onEdit(product)}
          >
            {cartItem.qty} {product.unit}
          </SoftButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(product.id)}
            sx={{ border: "1px solid #ea0606", borderRadius: 1 }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </SoftBox>
      ) : (
        <SoftButton
          variant="gradient"
          color={outOfStock ? "secondary" : "info"}
          size="small"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => !outOfStock && onAdd(product)}
          disabled={outOfStock}
          sx={{ mt: "auto" }}
        >
          {outOfStock ? "غير متوفر" : "إضافة"}
        </SoftButton>
      )}
    </Card>
  );
}

function ProductListRow({ product, cartItem, selected, rowRef, onSelect, onAdd, onEdit, onRemove }) {
  const inCart = !!cartItem;
  const outOfStock = product.stock === 0;
  const status = getOrderProductStatus(product);

  return (
    <tr
      ref={rowRef}
      style={{
        borderBottom: "1px solid #eef2f7",
        background: selected ? "#eef9ff" : "#fff",
        cursor: "pointer",
        outline: selected ? "2px solid rgba(23, 193, 232, 0.35)" : "none",
        outlineOffset: -2,
      }}
      onClick={onSelect}
      onMouseEnter={(event) => {
        if (!selected) {
          event.currentTarget.style.background = "#f8fbff";
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = selected ? "#eef9ff" : "#fff";
      }}
    >
      <td style={{ padding: "12px 14px" }}>
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <SoftBox
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              background: outOfStock
                ? "#d7dbe3"
                : `linear-gradient(135deg, ${product.color}88, ${product.color})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Inventory2Icon sx={{ color: "#fff", fontSize: 18, opacity: 0.9 }} />
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold">
              {product.name}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              {product.code} · {product.category}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" fontWeight="bold" color={outOfStock ? "error" : "success"}>
          {product.stock}
        </SoftTypography>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" color="secondary">
          {product.unit}
        </SoftTypography>
      </td>
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <SoftBadge variant="gradient" color={status.color} size="xs" badgeContent={status.label} container />
      </td>
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        {inCart ? (
          <SoftBox display="flex" gap={1} justifyContent="flex-end">
            <SoftButton
              variant="outlined"
              color="info"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(product)}
            >
              {cartItem.qty} {product.unit}
            </SoftButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onRemove(product.id)}
              sx={{ border: "1px solid #ea0606", borderRadius: 1 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </SoftBox>
        ) : (
          <SoftButton
            variant="gradient"
            color={outOfStock ? "secondary" : "info"}
            size="small"
            startIcon={<AddIcon />}
            onClick={() => !outOfStock && onAdd(product)}
            disabled={outOfStock}
          >
            {outOfStock ? "غير متوفر" : "إضافة"}
          </SoftButton>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function NewOrder() {
  const navigate = useNavigate();
  const productCardRefs = useRef({});
  const searchInputRef = useRef(null);

  const [view, setView] = useState("grid");
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({}); // { productId: { product, qty, willShip } }
  const [selectedProductId, setSelectedProductId] = useState(mockProducts[0]?.id ?? null);
  const [qtyDialog, setQtyDialog] = useState(null); // { product, qty }
  const [qtyInput, setQtyInput] = useState("1");
  const [replaceQtyOnNextDigit, setReplaceQtyOnNextDigit] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [customers, setCustomers] = useState(mockCustomers);
  const [successDialog, setSuccessDialog] = useState(false);
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);

  const normalizeQty = (value) => {
    const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");

    if (!digitsOnly) return "1";

    const normalized = String(Math.max(1, Number(digitsOnly)));

    return normalized;
  };

  const parsedQty = Math.max(1, Number(normalizeQty(qtyInput)));

  const keypadButtons = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["clear", "0", "backspace"],
  ];

  const filteredProducts = mockProducts.filter((p) => {
    const matchCat = category === "الكل" || p.category === category;
    const matchSearch = p.name.includes(search) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartItems = Object.values(cart);
  const cartCount = cartItems.length;

  useEffect(() => {
    if (filteredProducts.length === 0) {
      setSelectedProductId(null);
      return;
    }

    const selectionStillVisible = filteredProducts.some((product) => product.id === selectedProductId);

    if (!selectionStillVisible) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  useEffect(() => {
    if (!selectedProductId || qtyDialog || newCustomerDialog || successDialog) {
      return;
    }

    productCardRefs.current[selectedProductId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [newCustomerDialog, qtyDialog, selectedProductId, successDialog]);

  const openAddDialog = (product) => {
    setQtyDialog({ product, isEdit: false });
    setQtyInput("1");
    setReplaceQtyOnNextDigit(true);
  };

  const openEditDialog = (product) => {
    setQtyDialog({ product, isEdit: true });
    setQtyInput(String(cart[product.id]?.qty || 1));
    setReplaceQtyOnNextDigit(true);
  };

  const confirmQty = (rawQty = qtyInput) => {
    if (!qtyDialog) return;
    const nextQty = Math.max(1, Number(normalizeQty(rawQty)));

    setCart((prev) => ({
      ...prev,
      [qtyDialog.product.id]: { product: qtyDialog.product, qty: nextQty, willShip: true },
    }));
    setQtyInput(String(nextQty));
    setQtyDialog(null);
    setReplaceQtyOnNextDigit(true);
  };

  const handleQtyChange = (value) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    setQtyInput(digitsOnly);
    setReplaceQtyOnNextDigit(false);
  };

  const handleQtyBlur = () => {
    setQtyInput(normalizeQty(qtyInput));
  };

  const handleQtyKeyDown = (event) => {
    if (/^\d$/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (replaceQtyOnNextDigit) {
        event.preventDefault();
        setQtyInput(event.key);
        setReplaceQtyOnNextDigit(false);
      }
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    confirmQty(event.currentTarget.value);
  };

  const handleKeypadPress = (key) => {
    if (key === "clear") {
      setQtyInput("1");
      setReplaceQtyOnNextDigit(true);
      return;
    }

    if (key === "backspace") {
      if (replaceQtyOnNextDigit) {
        setQtyInput("1");
        setReplaceQtyOnNextDigit(true);
        return;
      }

      setQtyInput((prev) => {
        const current = prev || "1";

        if (current.length <= 1) {
          return "1";
        }

        return current.slice(0, -1);
      });
      setReplaceQtyOnNextDigit(false);
      return;
    }

    setQtyInput((prev) => {
      const current = prev || "1";

      if (replaceQtyOnNextDigit || current === "0") {
        return key;
      }

      if (current.length >= 6) {
        return current;
      }

      return `${current}${key}`;
    });
    setReplaceQtyOnNextDigit(false);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const toggleWillShip = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], willShip: !prev[productId].willShip },
    }));
  };

  const handleSubmit = (isDraft) => {
    setSuccessDialog(isDraft ? "draft" : "submitted");
  };

  const updateNewCustomerField = (field, value) => {
    setNewCustomerForm((current) => ({ ...current, [field]: value }));
  };

  const addNewCustomer = () => {
    const name = newCustomerForm.name.trim();
    const phone = newCustomerForm.phone.trim();
    const wilaya = newCustomerForm.wilaya.trim();

    if (!name || !phone || !wilaya) return;

    const openingBalance = Math.max(0, Number(newCustomerForm.openingBalance) || 0);
    const newCust = {
      id: Math.max(...customers.map((item) => item.id), 0) + 1,
      name,
      phone,
      phone2: newCustomerForm.phone2.trim(),
      email: newCustomerForm.email.trim(),
      wilaya,
      address: newCustomerForm.address.trim(),
      salesperson: newCustomerForm.salesperson.trim() || "غير محدد",
      ordersCount: 0,
      lastOrder: "—",
      totalAmount: 0,
      paidAmount: 0,
      openingBalance,
      balance: openingBalance,
      status: "active",
      shippingRoute: newCustomerForm.shippingRoute.trim() || `${wilaya} - عام`,
      orders: [],
      payments: [],
    };

    setCustomers((prev) => [...prev, newCust]);
    setCustomer(newCust);
    setNewCustomerForm(emptyNewCustomerForm);
    setNewCustomerDialog(false);
  };

  const focusSearchInput = () => {
    const searchInputElement =
      searchInputRef.current?.querySelector?.("input") ?? searchInputRef.current;

    searchInputElement?.focus();
    searchInputElement?.select?.();
  };

  useEffect(() => {
    const handleProductGridKeyboard = (event) => {
      const typingContext = isTypingContext(event.target);
      const isSlashSearchShortcut =
        event.code === "Slash" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
      const isSearchShortcut =
        (event.code === "F2" && (event.ctrlKey || event.metaKey)) ||
        (event.code === "KeyK" && (event.ctrlKey || event.metaKey)) ||
        (event.code === "KeyS" && event.altKey && !event.ctrlKey && !event.metaKey) ||
        (event.code === "KeyF" && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) ||
        isSlashSearchShortcut;

      if (isSearchShortcut && !typingContext) {
        event.preventDefault();
        focusSearchInput();
        return;
      }

      if (
        qtyDialog ||
        newCustomerDialog ||
        successDialog ||
        filteredProducts.length === 0 ||
        typingContext
      ) {
        return;
      }

      const currentIndex = Math.max(
        0,
        filteredProducts.findIndex((product) => product.id === selectedProductId)
      );
      const columns = view === "grid" ? getProductGridColumns() : 1;
      const isRtl = document.documentElement.dir === "rtl";
      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          nextIndex = isRtl
            ? Math.min(filteredProducts.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowRight":
          event.preventDefault();
          nextIndex = isRtl
            ? Math.max(0, currentIndex - 1)
            : Math.min(filteredProducts.length - 1, currentIndex + 1);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowUp":
          event.preventDefault();
          nextIndex = Math.max(0, currentIndex - columns);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowDown":
          event.preventDefault();
          nextIndex = Math.min(filteredProducts.length - 1, currentIndex + columns);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "Enter": {
          event.preventDefault();
          const selectedProduct = filteredProducts[currentIndex];

          if (!selectedProduct || selectedProduct.stock === 0) {
            return;
          }

          if (cart[selectedProduct.id]) {
            openEditDialog(selectedProduct);
            return;
          }

          openAddDialog(selectedProduct);
          return;
        }
        default:
      }
    };

    document.addEventListener("keydown", handleProductGridKeyboard, true);

    return () => {
      document.removeEventListener("keydown", handleProductGridKeyboard, true);
    };
  }, [cart, filteredProducts, newCustomerDialog, qtyDialog, selectedProductId, successDialog, view]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── Page Header ── */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/orders")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">
              إنشاء طلبية جديدة
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              اختر الأصناف وأضفها للسلة
            </SoftTypography>
          </SoftBox>
          <Badge badgeContent={cartCount} color="info">
            <ShoppingCartIcon />
          </Badge>
        </SoftBox>

        <Grid container spacing={3}>
          {/* ─────────────────────────────── LEFT: Products Panel ── */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ mb: 2, p: 2 }}>
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="بحث سريع عن الصنف باسمه أو كوده..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                inputRef={searchInputRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              {/* Category Tabs */}
              <SoftBox display="flex" gap={1} flexWrap="wrap">
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    onClick={() => setCategory(cat)}
                    color={category === cat ? "info" : "default"}
                    variant={category === cat ? "filled" : "outlined"}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </SoftBox>
              <SoftBox mt={2} display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                <SoftTypography variant="caption" color="text">
                  {filteredProducts.length} صنف
                </SoftTypography>
                <ToggleButtonGroup value={view} exclusive onChange={(_, nextView) => nextView && setView(nextView)} size="small">
                  <ToggleButton value="grid">
                    <GridViewIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ListIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </SoftBox>
            </Card>

            {/* Product Grid */}
            <SoftBox
              mb={1.5}
              px={0.5}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
            >
              <SoftTypography variant="caption" color="info" fontWeight="medium">
                استخدم الأسهم للتنقل بين الأصناف و Enter لفتح إضافة الكمية و / أو Option+Shift+F للبحث
              </SoftTypography>
              {selectedProductId && (
                <SoftTypography variant="caption" color="secondary">
                  الصنف المحدد: {filteredProducts.find((product) => product.id === selectedProductId)?.name}
                </SoftTypography>
              )}
            </SoftBox>
            {view === "grid" ? (
              <Grid container spacing={2}>
                {filteredProducts.length === 0 ? (
                  <Grid item xs={12}>
                    <SoftBox textAlign="center" py={6}>
                      <SoftTypography variant="body2" color="text">
                        لا توجد أصناف مطابقة
                      </SoftTypography>
                    </SoftBox>
                  </Grid>
                ) : (
                  filteredProducts.map((product) => (
                    <Grid item xs={6} sm={4} md={3} key={product.id}>
                      <ProductCard
                        product={product}
                        cartItem={cart[product.id]}
                        selected={selectedProductId === product.id}
                        onSelect={() => setSelectedProductId(product.id)}
                        cardRef={(node) => {
                          if (node) {
                            productCardRefs.current[product.id] = node;
                            return;
                          }

                          delete productCardRefs.current[product.id];
                        }}
                        onAdd={openAddDialog}
                        onEdit={openEditDialog}
                        onRemove={removeFromCart}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            ) : (
              <Card>
                <SoftBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fbff" }}>
                        {["الصنف", "المخزون", "الوحدة", "الحالة", "الإجراء"].map((header) => (
                          <th
                            key={header}
                            style={{
                              padding: "12px 14px",
                              textAlign: header === "الإجراء" ? "left" : "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary">
                              {header}
                            </SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                            <SoftTypography variant="body2" color="text">
                              لا توجد أصناف مطابقة
                            </SoftTypography>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <ProductListRow
                            key={product.id}
                            product={product}
                            cartItem={cart[product.id]}
                            selected={selectedProductId === product.id}
                            onSelect={() => setSelectedProductId(product.id)}
                            rowRef={(node) => {
                              if (node) {
                                productCardRefs.current[product.id] = node;
                                return;
                              }

                              delete productCardRefs.current[product.id];
                            }}
                            onAdd={openAddDialog}
                            onEdit={openEditDialog}
                            onRemove={removeFromCart}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </SoftBox>
              </Card>
            )}
          </Grid>

          {/* ──────────────────────────────── RIGHT: Cart Panel ── */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, position: "sticky", top: 20 }}>
              <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <ShoppingCartIcon sx={{ color: "#17c1e8" }} />
                  <SoftTypography variant="h6" fontWeight="bold">
                    السلة
                  </SoftTypography>
                </SoftBox>
                <SoftBadge
                  variant="gradient"
                  color="info"
                  size="sm"
                  badgeContent={`${cartCount} صنف`}
                  container
                />
              </SoftBox>

              {/* Customer */}
              <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
                الزبون *
              </SoftTypography>
              <SoftBox display="flex" gap={1} mb={2}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(o) => o.name}
                  value={customer}
                  onChange={(_, v) => setCustomer(v)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="اختر الزبون..." />
                  )}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Tooltip title={customer ? "عرض بيانات الزبون" : "إضافة زبون جديد"}>
                  <IconButton
                    size="small"
                    onClick={() => customer ? setCustomerInfoOpen(true) : setNewCustomerDialog(true)}
                    sx={{
                      border: `1px solid ${customer ? "#17c1e8" : "#e9ecef"}`,
                      borderRadius: 1,
                      color: customer ? "#17c1e8" : "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    {customer
                      ? <VisibilityIcon fontSize="small" />
                      : <PersonAddIcon fontSize="small" />
                    }
                  </IconButton>
                </Tooltip>
              </SoftBox>

              <Divider sx={{ my: 2 }} />

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <SoftBox textAlign="center" py={4}>
                  <ShoppingCartIcon sx={{ color: "#e0e0e0", fontSize: 48 }} />
                  <SoftTypography variant="body2" color="secondary" mt={1}>
                    السلة فارغة
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    اختر أصنافاً من القائمة
                  </SoftTypography>
                </SoftBox>
              ) : (
                <SoftBox maxHeight={350} sx={{ overflowY: "auto" }}>
                  {cartItems.map(({ product, qty, willShip }) => (
                    <SoftBox key={product.id} mb={1.5}>
                      <SoftBox
                        p={1.5}
                        sx={{
                          background: "#f8f9fa",
                          borderRadius: 2,
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                          <SoftBox flex={1}>
                            <SoftTypography variant="caption" fontWeight="bold" lineHeight={1.3}>
                              {product.name}
                            </SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">
                              {product.code}
                            </SoftTypography>
                          </SoftBox>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(product.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </SoftBox>

                        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                          {/* Qty Controls */}
                          <SoftBox>
                            <SoftBox display="flex" alignItems="center" gap={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => setCart(prev => ({
                                  ...prev,
                                  [product.id]: { ...prev[product.id], qty: Math.max(1, qty - 1) }
                                }))}
                                sx={{ border: "1px solid #e0e0e0", p: 0.3 }}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                              <SoftTypography variant="button" fontWeight="bold" minWidth={40} textAlign="center">
                                {qty}
                              </SoftTypography>
                              <IconButton
                                size="small"
                                onClick={() => setCart(prev => ({
                                  ...prev,
                                  [product.id]: { ...prev[product.id], qty: qty + 1 }
                                }))}
                                sx={{ border: "1px solid #e0e0e0", p: 0.3 }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                              <SoftTypography variant="caption" color="secondary" ml={0.5}>
                                {product.unit}
                              </SoftTypography>
                            </SoftBox>
                            {/* Packages count */}
                            {product.unitsPerPackage > 0 && (
                              <SoftTypography variant="caption" sx={{ color: "#7928ca", fontWeight: "bold", display: "block", mt: 0.3 }}>
                                = {calcPackages(qty, product)} {product.packageUnit}
                              </SoftTypography>
                            )}
                          </SoftBox>

                          {/* Ship Toggle */}
                          <Tooltip title={willShip ? "سيتم الشحن" : "استلام مباشر"}>
                            <Chip
                              size="small"
                              icon={<LocalShippingIcon fontSize="small" />}
                              label={willShip ? "شحن" : "مباشر"}
                              color={willShip ? "info" : "default"}
                              onClick={() => toggleWillShip(product.id)}
                              sx={{ cursor: "pointer", height: 22, fontSize: 10 }}
                            />
                          </Tooltip>
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Notes */}
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="ملاحظات"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Summary */}
              {cartItems.length > 0 && (
                <SoftBox mb={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftTypography variant="caption" color="text">إجمالي الأصناف:</SoftTypography>
                    <SoftTypography variant="caption" fontWeight="bold">{cartItems.length}</SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftTypography variant="caption" color="text">إجمالي الوحدات:</SoftTypography>
                    <SoftTypography variant="caption" fontWeight="bold">
                      {cartItems.reduce((s, i) => s + i.qty, 0)}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              )}

              {/* Action Buttons */}
              <SoftBox display="flex" flexDirection="column" gap={1}>
                <SoftButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  startIcon={<SendIcon />}
                  disabled={cartItems.length === 0 || !customer}
                  onClick={() => handleSubmit(false)}
                >
                  إرسال الطلبية للإدارة
                </SoftButton>
                <SoftButton
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<SaveIcon />}
                  disabled={cartItems.length === 0}
                  onClick={() => handleSubmit(true)}
                >
                  حفظ كمسودة
                </SoftButton>
              </SoftBox>

              {!customer && cartItems.length > 0 && (
                <SoftTypography variant="caption" color="error" textAlign="center" display="block" mt={1}>
                  * يجب اختيار الزبون أولاً
                </SoftTypography>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* ── Qty Dialog ── */}
      <Dialog open={!!qtyDialog} onClose={() => setQtyDialog(null)} maxWidth="xs" fullWidth>
        {qtyDialog && (
          <>
            <DialogTitle>
              {qtyDialog.isEdit ? "تعديل الكمية" : "إضافة للسلة"}
            </DialogTitle>
            <DialogContent>
              <SoftTypography variant="button" fontWeight="bold" display="block" mb={2}>
                {qtyDialog.product.name}
              </SoftTypography>
              <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2} my={2}>
                <IconButton
                  onClick={() => {
                    setQtyInput(String(Math.max(1, parsedQty - 1)));
                    setReplaceQtyOnNextDigit(false);
                  }}
                  sx={{ border: "2px solid #17c1e8", p: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={qtyInput}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  onBlur={handleQtyBlur}
                  onKeyDown={handleQtyKeyDown}
                  autoFocus
                  variant="outlined"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    style: {
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: "bold",
                      width: 120,
                      padding: "10px 0",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: "#fff",
                    },
                  }}
                />
                <IconButton
                  onClick={() => {
                    setQtyInput(String(parsedQty + 1));
                    setReplaceQtyOnNextDigit(false);
                  }}
                  sx={{ border: "2px solid #17c1e8", p: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </SoftBox>
              <SoftBox
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.2,
                }}
              >
                {keypadButtons.flat().map((key) => {
                  const isAction = key === "clear" || key === "backspace";
                  const isClear = key === "clear";
                  const label = key === "clear" ? "مسح" : key;

                  return (
                    <SoftButton
                      key={key}
                      variant={isAction ? "outlined" : "gradient"}
                      color={isClear ? "secondary" : "info"}
                      onClick={() => handleKeypadPress(key)}
                      sx={{
                        minHeight: 52,
                        borderRadius: 2,
                        fontSize: key.length === 1 ? "1rem" : "0.8rem",
                        fontWeight: "bold",
                        boxShadow: isAction ? "none" : "0 8px 18px rgba(23, 193, 232, 0.18)",
                      }}
                    >
                      {key === "backspace" ? <BackspaceOutlinedIcon fontSize="small" /> : label}
                    </SoftButton>
                  );
                })}
              </SoftBox>
              <SoftBox mt={1.5} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftTypography variant="caption" color="secondary">
                    الوحدة: <strong>{qtyDialog.product.unit}</strong>
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    المخزون المتاح: <strong>{qtyDialog.product.stock}</strong>
                  </SoftTypography>
                </SoftBox>
                {qtyDialog.product.unitsPerPackage > 0 && (
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <SoftTypography variant="caption" color="secondary">
                      التعليب: <strong>{qtyDialog.product.unitsPerPackage} {qtyDialog.product.unit} / {qtyDialog.product.packageUnit}</strong>
                    </SoftTypography>
                    <SoftTypography variant="caption" sx={{ color: "#7928ca", fontWeight: "bold" }}>
                      {parsedQty > 0 ? `= ${calcPackages(parsedQty, qtyDialog.product)} ${qtyDialog.product.packageUnit}` : ""}
                    </SoftTypography>
                  </SoftBox>
                )}
                {qtyDialog.product.weightPerUnit > 0 && parsedQty > 0 && (
                  <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontWeight: "bold", display: "block", mt: 0.5 }}>
                    الوزن الإجمالي: {(parsedQty * qtyDialog.product.weightPerUnit).toFixed(2)} كغ
                  </SoftTypography>
                )}
              </SoftBox>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setQtyDialog(null)}>
                إلغاء
              </SoftButton>
              <SoftButton variant="gradient" color="info" size="small" onClick={() => confirmQty()}>
                {qtyDialog.isEdit ? "تحديث" : "إضافة للسلة"}
              </SoftButton>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── New Customer Dialog ── */}
      <Dialog open={newCustomerDialog} onClose={() => setNewCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة زبون جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="اسم الزبون *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="رقم الهاتف" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="العنوان" size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setNewCustomerDialog(false)}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={addNewCustomer}>
            إضافة وتحديد
          </SoftButton>
        </DialogActions>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={!!successDialog} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 5 }}>
          <SoftBox
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: successDialog === "submitted" ? "linear-gradient(195deg,#66BB6A,#43A047)" : "linear-gradient(195deg,#42424a,#191919)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            {successDialog === "submitted" ? (
              <SendIcon sx={{ color: "#fff", fontSize: 32 }} />
            ) : (
              <SaveIcon sx={{ color: "#fff", fontSize: 32 }} />
            )}
          </SoftBox>
          <SoftTypography variant="h5" fontWeight="bold" mb={1}>
            {successDialog === "submitted" ? "تم إرسال الطلبية!" : "تم حفظ المسودة!"}
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {successDialog === "submitted"
              ? "تم إرسال الطلبية للإدارة وستتلقى إشعاراً عند مراجعتها."
              : "تم حفظ الطلبية كمسودة، يمكنك إكمالها لاحقاً."}
          </SoftTypography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
          <SoftButton variant="gradient" color="info" onClick={() => navigate("/orders")}>
            العودة للطلبيات
          </SoftButton>
          <SoftButton variant="outlined" color="secondary" onClick={() => { setSuccessDialog(false); setCart({}); setCustomer(null); }}>
            إنشاء طلبية جديدة
          </SoftButton>
        </DialogActions>
      </Dialog>

      <CustomerInfoDialog
        customer={customerInfoOpen ? customer : null}
        onClose={() => setCustomerInfoOpen(false)}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default NewOrder;
