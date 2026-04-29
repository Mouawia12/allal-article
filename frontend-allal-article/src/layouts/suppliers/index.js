/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import Snackbar from "@mui/material/Snackbar";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PaymentIcon from "@mui/icons-material/Payment";
import PhoneIcon from "@mui/icons-material/Phone";
import ReceiptIcon from "@mui/icons-material/Receipt";
import SearchIcon from "@mui/icons-material/Search";

import SoftBadge from "components/SoftBadge";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { purchasesApi, suppliersApi, referenceApi } from "services";

const formatDZD = (n) => (n != null ? Number(n).toLocaleString("fr-DZ") : "0");
const resolveSupplierLink = () => ({ isLinked: false, supplier: null, partner: null, matchedBy: null, permissions: {} });
const getSupplierBalance = () => 0;

const supplierMatchLabels = {
  partnerUuid: "معرف الشريك", taxNumber: "الرقم الضريبي",
  commercialRegister: "السجل التجاري", email: "البريد الإلكتروني", phone: "رقم الهاتف",
};

function normalizeSupplier(s) {
  return {
    totalPurchases: 0,
    paidAmount: 0,
    orders: [],
    payments: [],
    lastPurchase: "—",
    partnerUuid: null,
    manualPartnerUuid: null,
    status: "active",
    ...s,
    wilaya: s.wilayaNameAr || null,
  };
}

const emptySupplierForm = {
  name: "",
  legalName: "",
  phone: "",
  email: "",
  taxNumber: "",
  commercialRegister: "",
  nisNumber: "",
  wilayaId: "",
  address: "",
  category: "",
  paymentTerms: "",
  openingBalance: "",
};

function buildSupplierForm(supplier = null) {
  if (!supplier) return { ...emptySupplierForm };
  return {
    name: supplier.name || "",
    legalName: supplier.legalName || "",
    phone: supplier.phone || "",
    email: supplier.email || "",
    taxNumber: supplier.taxNumber || "",
    commercialRegister: supplier.commercialRegister || "",
    nisNumber: supplier.nisNumber || "",
    wilayaId: supplier.wilayaId || "",
    address: supplier.address || "",
    category: supplier.category || "",
    paymentTerms: supplier.paymentTerms || "",
    openingBalance: supplier.openingBalance || "",
  };
}

function SupplierCard({ supplier, onView }) {
  const link = resolveSupplierLink(supplier);
  const balance = getSupplierBalance(supplier);

  return (
    <Card
      onClick={() => onView(supplier)}
      sx={{
        p: 2.5,
        height: "100%",
        cursor: "pointer",
        border: "1px solid #e9ecef",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 18px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} gap={1.5}>
        <SoftBox minWidth={0}>
          <SoftTypography variant="button" fontWeight="bold" display="block" noWrap>
            {supplier.name}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block" noWrap>
            {supplier.legalName || supplier.category || "مورد"}
          </SoftTypography>
        </SoftBox>
        <SoftBadge
          variant="gradient"
          color={link.isLinked ? "info" : "secondary"}
          size="xs"
          badgeContent={link.isLinked ? "مرتبط" : "غير مرتبط"}
          container
        />
      </SoftBox>

      {[
        { icon: PhoneIcon, value: supplier.phone || "—" },
        { icon: EmailIcon, value: supplier.email || "—" },
        { icon: LocationOnIcon, value: `${supplier.wilaya || "—"} - ${supplier.address || "—"}` },
        { icon: BusinessIcon, value: supplier.taxNumber || "بدون رقم ضريبي" },
      ].map(({ icon: Icon, value }) => (
        <SoftBox key={value} display="flex" alignItems="center" gap={1} mb={0.7}>
          <Icon fontSize="small" sx={{ color: "#8392ab", flexShrink: 0 }} />
          <SoftTypography variant="caption" color="text" noWrap>{value}</SoftTypography>
        </SoftBox>
      ))}

      <SoftBox mt={2} pt={2} sx={{ borderTop: "1px solid #e9ecef" }} display="flex" justifyContent="space-between">
        <SoftBox>
          <SoftTypography variant="caption" color="secondary">الرصيد</SoftTypography>
          <SoftTypography variant="button" fontWeight="bold" display="block" sx={{ color: balance > 0 ? "#ea0606" : "#66BB6A" }}>
            {balance > 0 ? `${formatDZD(balance)} دج` : "صفر"}
          </SoftTypography>
        </SoftBox>
        <SoftBox textAlign="left">
          <SoftTypography variant="caption" color="secondary">آخر شراء</SoftTypography>
          <SoftTypography variant="caption" color="text" display="block">{supplier.lastPurchase}</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

function SupplierDetailDialog({ supplier, onClose, onEdit }) {
  const [tab, setTab] = useState(0);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    if (!supplier) return;
    purchasesApi.list({ supplier: supplier.name })
      .then((r) => setPurchases((r.data?.content ?? r.data ?? []).map((p) => ({ totalAmount: 0, ...p }))))
      .catch(console.error);
  }, [supplier]);

  if (!supplier) return null;

  const link = resolveSupplierLink(supplier);
  const balance = getSupplierBalance(supplier);

  return (
    <Dialog open={!!supplier} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">{supplier.name}</SoftTypography>
            <SoftBox display="flex" gap={0.7} mt={0.5} flexWrap="wrap">
              <SoftBadge variant="gradient" color={supplier.status === "active" ? "success" : "secondary"} size="xs" badgeContent={supplier.status === "active" ? "نشط" : "غير نشط"} container />
              <SoftBadge variant="gradient" color={link.isLinked ? "info" : "secondary"} size="xs" badgeContent={link.isLinked ? "مورد مرتبط" : "غير مرتبط"} container />
              <SoftTypography variant="caption" color="secondary">{supplier.wilaya || "بدون ولاية"}</SoftTypography>
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <SoftBox px={3} py={1.5} sx={{ background: balance > 0 ? "#fff5f5" : "#f0fff4", borderBottom: "1px solid #eee" }} display="flex" gap={4} flexWrap="wrap">
        {[
          { label: "إجمالي المشتريات", value: `${formatDZD(supplier.totalPurchases)} دج`, color: "#344767" },
          { label: "إجمالي المدفوع", value: `${formatDZD(supplier.paidAmount)} دج`, color: "#66BB6A" },
          { label: "الرصيد الافتتاحي", value: `${formatDZD(supplier.openingBalance)} دج`, color: "#17c1e8" },
          { label: "المتبقي للمورد", value: `${formatDZD(balance)} دج`, color: balance > 0 ? "#ea0606" : "#66BB6A" },
        ].map((item) => (
          <SoftBox key={item.label} textAlign="center">
            <SoftTypography variant="caption" color="secondary">{item.label}</SoftTypography>
            <SoftTypography variant="button" fontWeight="bold" display="block" sx={{ color: item.color }}>{item.value}</SoftTypography>
          </SoftBox>
        ))}
      </SoftBox>

      <SoftBox px={2} borderBottom="1px solid #eee">
        <Tabs value={tab} onChange={(_, value) => setTab(value)} textColor="inherit" TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">البيانات</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">أوامر الشراء</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">الدفعات</SoftTypography>} />
          <Tab label={<SoftTypography variant="caption" fontWeight="medium">الربط</SoftTypography>} />
        </Tabs>
      </SoftBox>

      <DialogContent sx={{ p: 2, minHeight: 300 }}>
        {tab === 0 && (
          <Grid container spacing={2}>
            {[
              ["الاسم القانوني", supplier.legalName],
              ["الهاتف", supplier.phone],
              ["البريد الإلكتروني", supplier.email],
              ["الولاية", supplier.wilaya],
              ["العنوان", supplier.address],
              ["التصنيف", supplier.category],
              ["شروط الدفع", supplier.paymentTerms],
              ["الرقم الضريبي", supplier.taxNumber],
              ["السجل التجاري", supplier.commercialRegister],
              ["NIS", supplier.nisNumber],
            ].map(([label, value]) => (
              <Grid item xs={12} sm={6} key={label}>
                <SoftTypography variant="caption" color="secondary" fontWeight="bold">{label}</SoftTypography>
                <SoftTypography variant="body2" color="text">{value || "—"}</SoftTypography>
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <SoftBox>
            {purchases.length === 0 ? (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>لا توجد أوامر شراء لهذا المورد</SoftTypography>
            ) : purchases.map((purchase) => (
              <SoftBox key={purchase.id} p={1.5} mb={1.2} sx={{ border: "1px solid #e9ecef", borderRadius: 1.5, background: "#f8f9fa" }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <SoftBox>
                    <SoftTypography variant="caption" fontWeight="bold">{purchase.id}</SoftTypography>
                    <SoftTypography variant="caption" color="secondary" display="block">{purchase.date}</SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="button" fontWeight="bold">{formatDZD(purchase.totalAmount)} دج</SoftTypography>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>
        )}

        {tab === 2 && (
          <SoftBox>
            {(supplier.payments || []).length === 0 ? (
              <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>لا توجد دفعات مسجلة</SoftTypography>
            ) : (supplier.payments || []).map((payment) => (
              <SoftBox key={payment.id} p={1.5} mb={1.2} sx={{ border: "1px solid #66BB6A44", borderRight: "4px solid #66BB6A", borderRadius: 1.5, background: "#f0fff4" }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftBox>
                    <SoftTypography variant="caption" fontWeight="bold">دفع للمورد - {payment.type}</SoftTypography>
                    <SoftTypography variant="caption" color="secondary" display="block">{payment.date}</SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#66BB6A" }}>{formatDZD(payment.amount)} دج</SoftTypography>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>
        )}

        {tab === 3 && (
          <SoftBox>
            <SoftBox p={2} sx={{ border: `1px solid ${link.isLinked ? "#17c1e855" : "#e9ecef"}`, borderRadius: 1.5, background: link.isLinked ? "#e3f8fd" : "#f8f9fa" }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={1}>
                {link.isLinked ? <LinkIcon sx={{ color: "#17c1e8" }} /> : <LinkOffIcon sx={{ color: "#8392ab" }} />}
                <SoftTypography variant="button" fontWeight="bold">
                  {link.isLinked ? "هذا المورد مرتبط بشريك" : "هذا المورد غير مرتبط"}
                </SoftTypography>
              </SoftBox>
              {link.isLinked ? (
                <>
                  <SoftTypography variant="body2" color="text">الشريك: {link.partner.name}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block">
                    تم التعرف على الربط عبر: {supplierMatchLabels[link.matchedBy]}
                  </SoftTypography>
                </>
              ) : (
                <SoftTypography variant="body2" color="text">
                  اربطه بإدخال UUID الشريك أو بتوحيد الرقم الضريبي/السجل التجاري/البريد/الهاتف مع بيانات الشريك.
                </SoftTypography>
              )}
            </SoftBox>

            <Grid container spacing={2} mt={1}>
              {[
                ["الرقم الضريبي", supplier.taxNumber],
                ["السجل التجاري", supplier.commercialRegister],
                ["NIS", supplier.nisNumber],
                ["البريد الإلكتروني", supplier.email],
                ["الهاتف", supplier.phone],
              ].map(([label, value]) => (
                <Grid item xs={12} sm={6} key={label}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">{label}</SoftTypography>
                  <SoftTypography variant="body2" color="text">{value || "—"}</SoftTypography>
                </Grid>
              ))}
            </Grid>
          </SoftBox>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إغلاق</SoftButton>
        <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />} onClick={() => onEdit(supplier)}>تعديل</SoftButton>
        <SoftButton variant="outlined" color="success" size="small" startIcon={<PaymentIcon />}>دفعة</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<ReceiptIcon />}>أمر شراء</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

function SupplierFormDialog({ open, onClose, onSave, supplier = null, wilayas = [] }) {
  const [form, setForm] = useState(() => buildSupplierForm(supplier));
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(supplier);

  useEffect(() => {
    if (open) {
      setForm(buildSupplierForm(supplier));
      setErrors({});
    }
  }, [open, supplier]);

  const set = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  const save = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "اسم المورد مطلوب";
    if (!form.phone.trim()) errs.phone = "رقم الهاتف مطلوب";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "بريد إلكتروني غير صالح";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
    setForm(buildSupplierForm(null));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "تعديل المورد" : "إضافة مورد جديد"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth autoFocus size="small" label="اسم المورد *" value={form.name}
              onChange={(e) => set("name", e.target.value)} error={!!errors.name} helperText={errors.name} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="الاسم القانوني" value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="الهاتف *" value={form.phone}
              onChange={(e) => set("phone", e.target.value)} error={!!errors.phone} helperText={errors.phone} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="البريد الإلكتروني" value={form.email}
              onChange={(e) => set("email", e.target.value)} error={!!errors.email} helperText={errors.email} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="الرقم الضريبي NIF" value={form.taxNumber}
              onChange={(e) => set("taxNumber", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="السجل التجاري RC" value={form.commercialRegister}
              onChange={(e) => set("commercialRegister", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="NIS" value={form.nisNumber}
              onChange={(e) => set("nisNumber", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>الولاية</InputLabel>
              <Select value={form.wilayaId} label="الولاية" onChange={(e) => set("wilayaId", e.target.value)}>
                <MenuItem value=""><em>بدون ولاية</em></MenuItem>
                {wilayas.map((w) => (
                  <MenuItem key={w.id} value={w.id}>{w.code} - {w.nameAr}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="العنوان" value={form.address}
              onChange={(e) => set("address", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="التصنيف" value={form.category}
              onChange={(e) => set("category", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="الرصيد الافتتاحي (دج)" type="number"
              value={form.openingBalance} onChange={(e) => set("openingBalance", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="شروط الدفع" value={form.paymentTerms}
              onChange={(e) => set("paymentTerms", e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={save}>
          {isEdit ? "حفظ التعديلات" : "حفظ المورد"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = (message, severity = "success") => setToast({ open: true, message, severity });

  useEffect(() => {
    suppliersApi.list()
      .then((r) => setSuppliers((r.data?.content ?? r.data ?? []).map(normalizeSupplier)))
      .catch(console.error);
    referenceApi.wilayas()
      .then((r) => setWilayas(r.data ?? []))
      .catch(console.error);
  }, []);

  const uniqueWilayas = [...new Set(suppliers.map((s) => s.wilaya).filter(Boolean))].sort();

  const filtered = suppliers.filter((supplier) => {
    const link = resolveSupplierLink(supplier);
    const balance = getSupplierBalance(supplier);
    const matchTab =
      tab === 0 ? true :
      tab === 1 ? link.isLinked :
      tab === 2 ? !link.isLinked :
      balance > 0;
    const matchWilaya = wilayaFilter === "all" || supplier.wilaya === wilayaFilter;
    const matchSearch = [
      supplier.name,
      supplier.legalName,
      supplier.phone,
      supplier.email,
      supplier.taxNumber,
      supplier.commercialRegister,
      supplier.wilaya,
    ].some((value) => String(value || "").toLowerCase().includes(search.toLowerCase()));

    return matchTab && matchWilaya && matchSearch;
  });

  const linkedCount = suppliers.filter((s) => resolveSupplierLink(s).isLinked).length;
  const totalBalance = suppliers.reduce((sum, s) => sum + getSupplierBalance(s), 0);

  const upsertSupplier = (supplier) => {
    setSuppliers((current) => (
      current.some((item) => item.id === supplier.id)
        ? current.map((item) => item.id === supplier.id ? supplier : item)
        : [...current, supplier]
    ));
    setSelectedSupplier(supplier);
  };

  const handleSaveSupplier = (formData, existingSupplier) => {
    const apiData = {
      name: formData.name,
      legalName: formData.legalName || null,
      phone: formData.phone,
      email: formData.email || null,
      taxNumber: formData.taxNumber || null,
      commercialRegister: formData.commercialRegister || null,
      nisNumber: formData.nisNumber || null,
      wilayaId: formData.wilayaId ? Number(formData.wilayaId) : null,
      address: formData.address || null,
      category: formData.category || "عام",
      paymentTerms: formData.paymentTerms || null,
      openingBalance: Number(formData.openingBalance) || 0,
    };
    const apiCall = existingSupplier?.id
      ? suppliersApi.update(existingSupplier.id, apiData).then((r) => normalizeSupplier({ ...existingSupplier, ...r.data }))
      : suppliersApi.create(apiData).then((r) => normalizeSupplier(r.data));
    apiCall
      .then((s) => { upsertSupplier(s); showToast("تم حفظ المورد بنجاح"); })
      .catch((e) => showToast(e.response?.data?.message || "حدث خطأ أثناء الحفظ", "error"));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">الموردين</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة بطاقات الموردين وربطهم مع شبكة الشركاء</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}>
            إضافة مورد
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الموردين", value: suppliers.length, color: "info" },
            { label: "مرتبطون", value: linkedCount, color: "success" },
            { label: "غير مرتبطين", value: suppliers.length - linkedCount, color: "secondary" },
            { label: "أرصدة مستحقة", value: `${(totalBalance / 1000000).toFixed(1)}م دج`, color: "warning" },
          ].map((stat) => (
            <Grid item xs={6} sm={3} key={stat.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={stat.color}>{stat.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{stat.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <SoftBox p={2}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
              <Tabs value={tab} onChange={(_, value) => setTab(value)} textColor="inherit" TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">الكل</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">مرتبطون</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">غير مرتبطين</SoftTypography>} />
                <Tab label={<SoftTypography variant="caption" fontWeight="medium">أرصدة</SoftTypography>} />
              </Tabs>
              <SoftBox display="flex" gap={1} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select value={wilayaFilter} onChange={(e) => setWilayaFilter(e.target.value)} displayEmpty>
                    <MenuItem value="all">كل الولايات</MenuItem>
                    {uniqueWilayas.map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  placeholder="بحث..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={{ width: 220 }}
                />
              </SoftBox>
            </SoftBox>

            <SoftTypography variant="caption" color="text" mb={2} display="block">
              {filtered.length} مورد
            </SoftTypography>

            <Grid container spacing={2}>
              {filtered.map((supplier) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={supplier.id}>
                  <SupplierCard supplier={supplier} onView={setSelectedSupplier} />
                </Grid>
              ))}
            </Grid>
          </SoftBox>
        </Card>
      </SoftBox>

      <SupplierDetailDialog
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        onEdit={(supplier) => { setEditSupplier(supplier); setSelectedSupplier(null); }}
      />
      <SupplierFormDialog
        open={addDialog}
        wilayas={wilayas}
        onClose={() => setAddDialog(false)}
        onSave={(formData) => {
          handleSaveSupplier(formData, null);
          setAddDialog(false);
        }}
      />
      <SupplierFormDialog
        open={!!editSupplier}
        supplier={editSupplier}
        wilayas={wilayas}
        onClose={() => setEditSupplier(null)}
        onSave={(formData) => {
          handleSaveSupplier(formData, editSupplier);
          setEditSupplier(null);
        }}
      />

      <Snackbar open={toast.open} autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Footer />
    </DashboardLayout>
  );
}

export default Suppliers;
