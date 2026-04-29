/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import apiClient from "services/apiClient";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import BusinessIcon from "@mui/icons-material/Business";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { applyApiErrors, hasErrors, isBlank } from "utils/formErrors";

const LEGAL_FORMS = [
  { value: "SARL",              label: "شركة ذات مسؤولية محدودة (SARL)" },
  { value: "EURL",              label: "مؤسسة ذات شخص وحيد (EURL)" },
  { value: "SPA",               label: "شركة مساهمة (SPA)" },
  { value: "SNC",               label: "شركة اسم جماعي (SNC)" },
  { value: "auto_entrepreneur", label: "مستثمر ذاتي (Auto-entrepreneur)" },
  { value: "other",             label: "أخرى" },
];
const ALGERIAN_BANKS = [
  "BNA — البنك الوطني الجزائري", "CPA — القرض الشعبي الجزائري",
  "BEA — بنك الجزائر الخارجي", "BADR — بنك الفلاحة والتنمية الريفية",
  "BDL — بنك التنمية المحلية", "CNEP — الصندوق الوطني للتوفير والاحتياط",
  "SGA — سوسيتيه جنرال الجزائر", "BNP Paribas El Djazaïr", "Natixis Algérie", "أخرى",
];

// ─── Image Upload Field ───────────────────────────────────────────────────────
function ImageUpload({ label, value, hint }) {
  const [preview, setPreview] = useState(value);
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 500, mb: 1 }}>{label}</Box>
      <Box
        onClick={() => inputRef.current.click()}
        sx={{
          width: 120, height: 90, border: "2px dashed #dee2e6", borderRadius: 2,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: "pointer", background: preview ? "transparent" : "#f8f9fa",
          overflow: "hidden", position: "relative",
          "&:hover": { borderColor: "#17c1e8" },
        }}
      >
        {preview ? (
          <Box component="img" src={preview} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <>
            <CloudUploadIcon sx={{ fontSize: 28, color: "#adb5bd", mb: 0.5 }} />
            <Box sx={{ fontSize: 10, color: "#adb5bd", textAlign: "center", px: 1 }}>انقر للرفع</Box>
          </>
        )}
      </Box>
      {hint && <Box sx={{ fontSize: 10, color: "#adb5bd", mt: 0.5 }}>{hint}</Box>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </Box>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({ children }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>{children}</Box>;
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────
function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;
}

// ─── Completeness indicator ───────────────────────────────────────────────────
function CompletenessBar({ profile }) {
  const fields = [
    profile.nameAr, profile.nameFr, profile.legalForm, profile.tradeRegisterNumber,
    profile.taxId, profile.statisticalId, profile.address, profile.phone,
    profile.email, profile.bankName, profile.rib,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);
  const color = pct >= 90 ? "#82d616" : pct >= 60 ? "#fb8c00" : "#ea0606";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {pct >= 90
        ? <CheckCircleIcon sx={{ fontSize: 18, color }} />
        : <WarningAmberIcon sx={{ fontSize: 18, color }} />
      }
      <Box>
        <Box sx={{ fontSize: 12, fontWeight: 600, color }}>اكتمال الملف: {pct}%</Box>
        <Box sx={{ fontSize: 10, color: "#8392ab" }}>{filled} / {fields.length} حقل مملوء</Box>
      </Box>
      <Box sx={{ flex: 1, height: 6, background: "#f0f2f5", borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 300ms" }} />
      </Box>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nameAr: "", nameFr: "", legalForm: "SARL", tradeRegisterNumber: "",
  taxId: "", statisticalId: "", articleImposition: "",
  address: "", wilaya: "", postalCode: "",
  phone: "", mobile: "", fax: "", email: "", website: "",
  bankName: "", bankBranch: "", rib: "", capitalSocial: "",
  logoUrl: null, stampImageUrl: null, signatureImageUrl: null,
  invoiceFooterAr: "", invoiceFooterFr: "",
};

export default function CompanyProfile() {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    apiClient.get("/api/settings/company")
      .then((r) => {
        if (r.data && typeof r.data === "object" && Object.keys(r.data).length > 0) {
          setForm((prev) => ({ ...prev, ...r.data }));
        }
      })
      .catch(console.error);
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
    if (errors[k] || errors._global) setErrors((current) => ({ ...current, [k]: "", _global: "" }));
  };

  const handleSave = () => {
    const nextErrors = {};
    if (isBlank(form.nameAr)) nextErrors.nameAr = "اسم الشركة بالعربية مطلوب";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "البريد الإلكتروني غير صالح";
    if (hasErrors(nextErrors)) { setErrors(nextErrors); setTab(nextErrors.nameAr ? 0 : 1); return; }
    setSaving(true);
    setErrors({});
    apiClient.put("/api/settings/company", form)
      .then(() => setSaved(true))
      .catch((error) => applyApiErrors(error, setErrors, "تعذر حفظ معلومات الشركة"))
      .finally(() => setSaving(false));
  };

  const TABS = [
    { label: "بيانات الشركة",  icon: <BusinessIcon sx={{ fontSize: 16 }} /> },
    { label: "معلومات الاتصال", icon: <ContactPhoneIcon sx={{ fontSize: 16 }} /> },
    { label: "المعلومات البنكية", icon: <AccountBalanceIcon sx={{ fontSize: 16 }} /> },
    { label: "الفواتير والطباعة", icon: <ReceiptLongIcon sx={{ fontSize: 16 }} /> },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">معلومات الشركة</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              تُستخدم هذه البيانات في رأس وتذييل الفواتير والوثائق الرسمية
            </SoftTypography>
          </SoftBox>
          <Box
            component="button"
            disabled={saving}
            onClick={handleSave}
            sx={{
              background: saved
                ? "linear-gradient(135deg, #82d616, #5faa0e)"
                : "linear-gradient(135deg, #17c1e8, #0ea5c9)",
              border: "none", borderRadius: "10px", px: 3, py: 1,
              cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13,
              opacity: saving ? 0.75 : 1,
              display: "flex", alignItems: "center", gap: 0.8,
              transition: "background 300ms",
            }}
          >
            {saved ? <><CheckCircleIcon sx={{ fontSize: 16 }} /> تم الحفظ</> : saving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Box>
        </SoftBox>

        {errors._global && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global}
          </Alert>
        )}

        {/* Completeness */}
        <Card sx={{ p: 2, mb: 2.5 }}>
          <CompletenessBar profile={form} />
        </Card>

        <Card>
          {/* Tab header */}
          <SoftBox borderBottom="1px solid #eee">
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {TABS.map((t, i) => (
                <Tab
                  key={i}
                  icon={t.icon}
                  iconPosition="start"
                  label={<SoftTypography variant="caption" fontWeight="medium">{t.label}</SoftTypography>}
                  sx={{ minHeight: 48 }}
                />
              ))}
            </Tabs>
          </SoftBox>

          <SoftBox p={3}>

            {/* ── Tab 0: Company Info ─────────────────────────────────────── */}
            <TabPanel value={tab} index={0}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

                {/* Logo upload */}
                <Box>
                  <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1.5 }}>الشعار والصور</Box>
                  <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <ImageUpload label="شعار الشركة" value={form.logoUrl} hint="PNG/SVG موصى به · 300×100 بكسل" />
                    <ImageUpload label="الختم الرسمي" value={form.stampImageUrl} hint="صورة شفافة PNG" />
                    <ImageUpload label="توقيع المفوَّض" value={form.signatureImageUrl} hint="صورة شفافة PNG" />
                  </Box>
                </Box>

                <Divider />

                {/* Names */}
                <Box>
                  <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1.5 }}>تسمية الشركة</Box>
                  <FieldRow>
                    <TextField label="الاسم بالعربية" value={form.nameAr} onChange={set("nameAr")} size="small" fullWidth required
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.nameAr}
                      helperText={errors.nameAr || ""} />
                    <TextField label="Nom en français" value={form.nameFr} onChange={set("nameFr")} size="small" fullWidth
                      InputLabelProps={{ shrink: true }} />
                  </FieldRow>
                </Box>

                <Divider />

                {/* Legal identifiers */}
                <Box>
                  <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1.5 }}>المعرفات القانونية</Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <FieldRow>
                      <FormControl size="small" fullWidth>
                        <InputLabel shrink>الشكل القانوني</InputLabel>
                        <Select value={form.legalForm} onChange={set("legalForm")} label="الشكل القانوني" notched>
                          {LEGAL_FORMS.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                        </Select>
                      </FormControl>
                      <TextField
                        label="رأس المال الاجتماعي (دج)"
                        value={form.capitalSocial}
                        onChange={set("capitalSocial")}
                        size="small" fullWidth type="number"
                        InputLabelProps={{ shrink: true }}
                      />
                    </FieldRow>
                    <FieldRow>
                      <TextField label="رقم السجل التجاري (RC)" value={form.tradeRegisterNumber} onChange={set("tradeRegisterNumber")}
                        size="small" fullWidth InputLabelProps={{ shrink: true }}
                        helperText="مثال: 16/00-0123456B19" />
                      <TextField label="رقم التعريف الجبائي (NIF)" value={form.taxId} onChange={set("taxId")}
                        size="small" fullWidth InputLabelProps={{ shrink: true }}
                        helperText="15 رقماً" inputProps={{ maxLength: 15 }} />
                    </FieldRow>
                    <FieldRow>
                      <TextField label="الرقم الإحصائي (NIS)" value={form.statisticalId} onChange={set("statisticalId")}
                        size="small" fullWidth InputLabelProps={{ shrink: true }}
                        helperText="15 رقماً" inputProps={{ maxLength: 15 }} />
                      <TextField label="رقم المادة الضريبية" value={form.articleImposition} onChange={set("articleImposition")}
                        size="small" fullWidth InputLabelProps={{ shrink: true }} />
                    </FieldRow>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            {/* ── Tab 1: Contact ──────────────────────────────────────────── */}
            <TabPanel value={tab} index={1}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField label="العنوان" value={form.address} onChange={set("address")} size="small" fullWidth
                  InputLabelProps={{ shrink: true }} multiline rows={2} />
                <FieldRow>
                  <TextField label="الولاية" value={form.wilaya} onChange={set("wilaya")} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                  <TextField label="الرمز البريدي" value={form.postalCode} onChange={set("postalCode")} size="small" fullWidth
                    InputLabelProps={{ shrink: true }} inputProps={{ maxLength: 5 }} />
                </FieldRow>
                <FieldRow>
                  <TextField label="الهاتف" value={form.phone} onChange={set("phone")} size="small" fullWidth InputLabelProps={{ shrink: true }}
                    helperText="مثال: 023-12-34-56" />
                  <TextField label="الجوال" value={form.mobile} onChange={set("mobile")} size="small" fullWidth InputLabelProps={{ shrink: true }}
                    helperText="مثال: 0555-123-456" />
                </FieldRow>
                <FieldRow>
                  <TextField label="الفاكس" value={form.fax} onChange={set("fax")} size="small" fullWidth InputLabelProps={{ shrink: true }} />
                  <TextField label="البريد الإلكتروني" value={form.email} onChange={set("email")} size="small" fullWidth
                    InputLabelProps={{ shrink: true }} type="email"
                    error={!!errors.email}
                    helperText={errors.email || ""} />
                </FieldRow>
                <TextField label="الموقع الإلكتروني" value={form.website} onChange={set("website")} size="small" fullWidth
                  InputLabelProps={{ shrink: true }} />
              </Box>
            </TabPanel>

            {/* ── Tab 2: Banking ──────────────────────────────────────────── */}
            <TabPanel value={tab} index={2}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FieldRow>
                  <FormControl size="small" fullWidth>
                    <InputLabel shrink>البنك</InputLabel>
                    <Select value={form.bankName} onChange={set("bankName")} label="البنك" notched>
                      {ALGERIAN_BANKS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField label="الوكالة / الفرع" value={form.bankBranch} onChange={set("bankBranch")} size="small" fullWidth
                    InputLabelProps={{ shrink: true }} />
                </FieldRow>
                <TextField
                  label="رقم الحساب البنكي (RIB)"
                  value={form.rib}
                  onChange={set("rib")}
                  size="small" fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="مثال: 002 00015 0000012345678 50"
                />
                <Box sx={{ background: "#f0fde4", border: "1px solid #82d61644", borderRadius: 2, p: 1.5, fontSize: 12, color: "#344767" }}>
                  <Box sx={{ fontWeight: 600, mb: 0.5 }}>ملاحظة:</Box>
                  بيانات الحساب البنكي تظهر في تذييل فواتير البيع لتسهيل تحديد تحويلات العملاء.
                </Box>
              </Box>
            </TabPanel>

            {/* ── Tab 3: Invoice Appearance ───────────────────────────────── */}
            <TabPanel value={tab} index={3}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box>
                  <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1 }}>نص تذييل الفاتورة</Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      label="التذييل بالعربية"
                      value={form.invoiceFooterAr}
                      onChange={set("invoiceFooterAr")}
                      size="small" fullWidth multiline rows={2}
                      InputLabelProps={{ shrink: true }}
                      helperText="يظهر في أسفل كل فاتورة مطبوعة (النسخة العربية)"
                    />
                    <TextField
                      label="Le pied de page en français"
                      value={form.invoiceFooterFr}
                      onChange={set("invoiceFooterFr")}
                      size="small" fullWidth multiline rows={2}
                      InputLabelProps={{ shrink: true }}
                      helperText="Aparaît en bas de chaque facture imprimée (version française)"
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Preview */}
                <Box>
                  <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1.5 }}>معاينة رأس الفاتورة</Box>
                  <Box sx={{
                    border: "1px solid #dee2e6", borderRadius: 2, p: 2.5,
                    background: "#fff", direction: "rtl",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      {/* Left: logo placeholder */}
                      <Box sx={{ width: 80, height: 50, border: "1px dashed #dee2e6", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Box sx={{ fontSize: 9, color: "#adb5bd" }}>الشعار</Box>
                      </Box>
                      {/* Right: company info */}
                      <Box sx={{ textAlign: "right" }}>
                        <Box sx={{ fontSize: 15, fontWeight: 700, color: "#344767" }}>{form.nameAr || "اسم الشركة"}</Box>
                        <Box sx={{ fontSize: 11, color: "#8392ab" }}>{form.nameFr}</Box>
                        <Box sx={{ fontSize: 11, color: "#8392ab", mt: 0.3 }}>{form.address}</Box>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {[
                        { label: "RC", value: form.tradeRegisterNumber },
                        { label: "NIF", value: form.taxId },
                        { label: "NIS", value: form.statisticalId },
                        { label: "AI", value: form.articleImposition },
                      ].map(({ label, value }) => value && (
                        <Box key={label} sx={{ fontSize: 10 }}>
                          <Box component="span" sx={{ color: "#8392ab" }}>{label}: </Box>
                          <Box component="span" sx={{ color: "#344767", fontWeight: 600 }}>{value}</Box>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ fontSize: 10, color: "#8392ab", textAlign: "center" }}>
                      {form.invoiceFooterAr || "نص التذييل سيظهر هنا"}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
