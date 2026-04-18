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
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CloseIcon from "@mui/icons-material/Close";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockCustomers = [
  {
    id: 1, name: "شركة الرياض للمقاولات",   phone: "0555-123456", address: "الرياض، حي الملك فهد",
    salesperson: "أحمد محمد",  ordersCount: 12, lastOrder: "2024-01-22", totalAmount: "145,200", status: "active",
  },
  {
    id: 2, name: "مؤسسة البناء الحديث",      phone: "0561-789012", address: "جدة، حي السلامة",
    salesperson: "خالد عمر",    ordersCount: 7,  lastOrder: "2024-01-16", totalAmount: "87,500",  status: "active",
  },
  {
    id: 3, name: "شركة الإنشاءات المتحدة",  phone: "0536-345678", address: "الدمام، حي العزيزية",
    salesperson: "محمد سعيد",   ordersCount: 18, lastOrder: "2024-01-17", totalAmount: "312,000", status: "active",
  },
  {
    id: 4, name: "مجموعة الخليج للتطوير",   phone: "0502-901234", address: "أبوظبي، منطقة المصفح",
    salesperson: "أحمد محمد",   ordersCount: 4,  lastOrder: "2024-01-18", totalAmount: "42,800",  status: "active",
  },
  {
    id: 5, name: "شركة الأفق للتجارة",      phone: "0518-567890", address: "الرياض، حي النزهة",
    salesperson: "يوسف علي",    ordersCount: 9,  lastOrder: "2024-01-18", totalAmount: "98,600",  status: "active",
  },
  {
    id: 6, name: "مؤسسة النجاح التجارية",   phone: "0544-123456", address: "مكة، حي العزيزية",
    salesperson: "خالد عمر",    ordersCount: 3,  lastOrder: "2024-01-10", totalAmount: "29,800",  status: "inactive",
  },
  {
    id: 7, name: "شركة المستقبل للصناعة",  phone: "0557-789012", address: "الرياض، المنطقة الصناعية",
    salesperson: "محمد سعيد",   ordersCount: 15, lastOrder: "2024-01-20", totalAmount: "278,400", status: "active",
  },
  {
    id: 8, name: "مجموعة الوطن للأعمال",   phone: "0531-345678", address: "الطائف، حي الربوة",
    salesperson: "يوسف علي",    ordersCount: 2,  lastOrder: "2024-01-05", totalAmount: "18,200",  status: "inactive",
  },
];

function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

// ─── Customer Card ────────────────────────────────────────────────────────────
function CustomerCard({ customer, onView }) {
  const colorIdx = customer.id % avatarColors.length;
  return (
    <Card
      sx={{
        p: 2.5,
        height: "100%",
        cursor: "pointer",
        transition: "all 0.2s",
        border: "1px solid #e9ecef",
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
          <SoftBadge
            variant={customer.status === "active" ? "gradient" : "contained"}
            color={customer.status === "active" ? "success" : "secondary"}
            size="xs"
            badgeContent={customer.status === "active" ? "نشط" : "غير نشط"}
            container
          />
        </SoftBox>
      </SoftBox>

      {[
        { icon: PhoneIcon,     value: customer.phone },
        { icon: LocationOnIcon, value: customer.address },
        { icon: PersonIcon,    value: customer.salesperson },
      ].map(({ icon: Icon, value }) => (
        <SoftBox key={value} display="flex" alignItems="center" gap={1} mb={0.8}>
          <Icon fontSize="small" sx={{ color: "#8392ab", flexShrink: 0 }} />
          <SoftTypography variant="caption" color="text" noWrap>{value}</SoftTypography>
        </SoftBox>
      ))}

      <SoftBox
        mt={2}
        pt={2}
        sx={{ borderTop: "1px solid #e9ecef" }}
        display="flex"
        justifyContent="space-between"
      >
        <SoftBox textAlign="center">
          <SoftTypography variant="h6" fontWeight="bold" color="info">{customer.ordersCount}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">طلبية</SoftTypography>
        </SoftBox>
        <SoftBox textAlign="center">
          <SoftTypography variant="button" fontWeight="bold">{customer.totalAmount}</SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">إجمالي (دج)</SoftTypography>
        </SoftBox>
        <SoftBox textAlign="center">
          <SoftTypography variant="caption" color="text">{customer.lastOrder}</SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">آخر طلبية</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Customer Detail Dialog ───────────────────────────────────────────────────
function CustomerDetailDialog({ customer, onClose }) {
  if (!customer) return null;
  const colorIdx = customer.id % avatarColors.length;

  return (
    <Dialog open={!!customer} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 48, height: 48, fontWeight: "bold" }}>
              {getInitials(customer.name)}
            </Avatar>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">{customer.name}</SoftTypography>
              <SoftBadge
                variant="gradient"
                color={customer.status === "active" ? "success" : "secondary"}
                size="xs"
                badgeContent={customer.status === "active" ? "نشط" : "غير نشط"}
                container
              />
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            {[
              { label: "رقم الهاتف", value: customer.phone },
              { label: "العنوان",    value: customer.address },
              { label: "البائع المسؤول", value: customer.salesperson },
            ].map((row) => (
              <SoftBox key={row.label} mb={2}>
                <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                <SoftTypography variant="body2" color="text">{row.value}</SoftTypography>
              </SoftBox>
            ))}
          </Grid>
          <Grid item xs={12} sm={6}>
            {[
              { label: "إجمالي الطلبيات",   value: customer.ordersCount },
              { label: "إجمالي المبيعات",   value: `${customer.totalAmount} دج` },
              { label: "آخر طلبية",         value: customer.lastOrder },
            ].map((row) => (
              <SoftBox key={row.label} mb={2}>
                <SoftTypography variant="caption" color="secondary" fontWeight="bold">{row.label}</SoftTypography>
                <SoftTypography variant="body2" fontWeight="bold" color="text">{row.value}</SoftTypography>
              </SoftBox>
            ))}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إغلاق</SoftButton>
        <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />}>تعديل</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<ShoppingCartIcon />}>طلبية جديدة</SoftButton>
      </DialogActions>
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
            <TextField fullWidth label="رقم الهاتف" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="الهاتف الثاني" size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="العنوان" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="المدينة" size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="البريد الإلكتروني" size="small" />
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

// ─── Main ─────────────────────────────────────────────────────────────────────
function Customers() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [addDialog, setAddDialog] = useState(false);

  const statusFilter = tab === 0 ? null : tab === 1 ? "active" : "inactive";

  const filtered = mockCustomers.filter((c) => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchSearch =
      c.name.includes(search) ||
      c.phone.includes(search) ||
      c.salesperson.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">الزبائن</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة قائمة الزبائن ومتابعة طلبياتهم</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
            إضافة زبون
          </SoftButton>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الزبائن",   value: mockCustomers.length, color: "info" },
            { label: "نشطون",            value: mockCustomers.filter(c => c.status === "active").length, color: "success" },
            { label: "غير نشطين",        value: mockCustomers.filter(c => c.status === "inactive").length, color: "secondary" },
            { label: "إجمالي الطلبيات", value: mockCustomers.reduce((s, c) => s + c.ordersCount, 0), color: "warning" },
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
            {/* Tabs + Search */}
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">الكل</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">نشطون</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">غير نشطين</SoftTypography>} />
              </Tabs>
              <TextField
                size="small"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ width: 250 }}
              />
            </SoftBox>

            <SoftTypography variant="caption" color="text" mb={2} display="block">
              {filtered.length} زبون
            </SoftTypography>

            {/* Customer Cards Grid */}
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

      <Footer />
    </DashboardLayout>
  );
}

export default Customers;
