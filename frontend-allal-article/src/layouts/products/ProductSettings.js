/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/MailOutline";
import LockIcon from "@mui/icons-material/Lock";
import SendIcon from "@mui/icons-material/Send";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { productSettings, updateProductSettings } from "./mockProductData";
import { hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";
import { emailNotificationsApi, usersApi } from "services";

// ─── Units Tab ────────────────────────────────────────────────────────────────
function UnitsTab() {
  const { t } = useI18n();
  const [units, setUnits] = useState(productSettings.units);
  const [dialog, setDialog] = useState(null); // null | { mode, item }
  const [form, setForm] = useState({ name: "", symbol: "" });
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm({ name: "", symbol: "" }); setErrors({}); setDialog({ mode: "add" }); };
  const openEdit = (u) => { setForm({ name: u.name, symbol: u.symbol }); setErrors({}); setDialog({ mode: "edit", item: u }); };
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors._global) setErrors((current) => ({ ...current, [field]: "", _global: "" }));
  };

  const save = () => {
    const nextErrors = {};
    const name = form.name.trim();
    if (isBlank(name)) nextErrors.name = t("اسم الوحدة مطلوب");
    if (units.some((u) => u.id !== dialog.item?.id && u.name.trim() === name)) {
      nextErrors.name = "هذه الوحدة موجودة من قبل";
    }
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    let next;
    if (dialog.mode === "add") {
      const newU = { id: Date.now(), name, symbol: form.symbol.trim(), isSystem: false };
      next = [...units, newU];
    } else {
      next = units.map((u) => u.id === dialog.item.id ? { ...u, name, symbol: form.symbol.trim() } : u);
    }
    setUnits(next);
    updateProductSettings({ units: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = units.filter((u) => u.id !== id);
    setUnits(next);
    updateProductSettings({ units: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">وحدات القياس</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          وحدة جديدة
        </SoftButton>
      </SoftBox>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: "#f8f9fa" }}>
              {["الاسم", "الرمز", "النوع", ""].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#8392ab" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontSize: 13 }}>{u.name}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{u.symbol}</TableCell>
                <TableCell>
                  {u.isSystem
                    ? <Chip label="نظام" size="small" color="default" sx={{ fontSize: 11 }} />
                    : <Chip label="مخصص" size="small" color="info" sx={{ fontSize: 11 }} />
                  }
                </TableCell>
                <TableCell>
                  <SoftBox display="flex" gap={0.5}>
                    <Tooltip title={u.isSystem ? "وحدة النظام لا يمكن تعديلها" : "تعديل"}>
                      <span>
                        <IconButton size="small" disabled={u.isSystem} onClick={() => openEdit(u)}>
                          {u.isSystem ? <LockIcon sx={{ fontSize: 14, color: "#ccc" }} /> : <EditIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={u.isSystem ? "لا يمكن حذف وحدات النظام" : "حذف"}>
                      <span>
                        <IconButton size="small" disabled={u.isSystem} onClick={() => remove(u.id)}>
                          <DeleteOutlineIcon sx={{ fontSize: 14, color: u.isSystem ? "#ccc" : "#ea0606" }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </SoftBox>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "وحدة جديدة" : "تعديل الوحدة"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            {errors._global && <Alert severity="error">{errors._global}</Alert>}
            <TextField label="اسم الوحدة *" size="small" fullWidth value={form.name}
              onChange={(e) => setField("name", e.target.value)} placeholder="مثال: دزينة، كيس..."
              error={!!errors.name} helperText={errors.name || ""} />
            <TextField label="الرمز" size="small" fullWidth value={form.symbol}
              onChange={(e) => setField("symbol", e.target.value)} placeholder="مثال: DZ, KG..." />
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const { t } = useI18n();
  const [cats, setCats] = useState(productSettings.categories);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#17c1e8" });
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm({ name: "", color: "#17c1e8" }); setErrors({}); setDialog({ mode: "add" }); };
  const openEdit = (c) => { setForm({ name: c.name, color: c.color }); setErrors({}); setDialog({ mode: "edit", item: c }); };
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors._global) setErrors((current) => ({ ...current, [field]: "", _global: "" }));
  };

  const save = () => {
    const nextErrors = {};
    const name = form.name.trim();
    if (isBlank(name)) nextErrors.name = t("اسم التصنيف مطلوب");
    if (cats.some((c) => c.id !== dialog.item?.id && c.name.trim() === name)) {
      nextErrors.name = "هذا التصنيف موجود من قبل";
    }
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    let next;
    if (dialog.mode === "add") {
      next = [...cats, { id: Date.now(), name, color: form.color }];
    } else {
      next = cats.map((c) => c.id === dialog.item.id ? { ...c, name, color: form.color } : c);
    }
    setCats(next);
    updateProductSettings({ categories: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = cats.filter((c) => c.id !== id);
    setCats(next);
    updateProductSettings({ categories: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">تصنيفات الأصناف</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          تصنيف جديد
        </SoftButton>
      </SoftBox>
      <SoftBox display="flex" flexWrap="wrap" gap={1.5}>
        {cats.map((c) => (
          <SoftBox key={c.id} display="flex" alignItems="center" gap={0.5}
            sx={{ border: "1px solid #e9ecef", borderRadius: 2, px: 1.5, py: 0.8, background: "#fff" }}>
            <SoftBox sx={{ width: 12, height: 12, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <SoftTypography variant="caption" fontWeight="medium">{c.name}</SoftTypography>
            <IconButton size="small" onClick={() => openEdit(c)} sx={{ p: 0.2 }}>
              <EditIcon sx={{ fontSize: 12, color: "#8392ab" }} />
            </IconButton>
            <IconButton size="small" onClick={() => remove(c.id)} sx={{ p: 0.2 }}>
              <DeleteOutlineIcon sx={{ fontSize: 12, color: "#ea0606" }} />
            </IconButton>
          </SoftBox>
        ))}
      </SoftBox>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "تصنيف جديد" : "تعديل التصنيف"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            {errors._global && <Alert severity="error">{errors._global}</Alert>}
            <TextField label="اسم التصنيف *" size="small" fullWidth value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              error={!!errors.name} helperText={errors.name || ""} />
            <SoftBox display="flex" alignItems="center" gap={1}>
              <SoftTypography variant="caption" color="secondary">اللون:</SoftTypography>
              <input type="color" value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                style={{ width: 40, height: 32, border: "none", borderRadius: 4, cursor: "pointer" }} />
              <SoftTypography variant="caption" color="secondary" sx={{ fontFamily: "monospace" }}>{form.color}</SoftTypography>
            </SoftBox>
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Variant Attributes Tab ───────────────────────────────────────────────────
function VariantAttrsTab() {
  const { t } = useI18n();
  const [attrs, setAttrs] = useState(productSettings.variantAttributes);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: "", valuesStr: "" });
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm({ name: "", valuesStr: "" }); setErrors({}); setDialog({ mode: "add" }); };
  const openEdit = (a) => { setForm({ name: a.name, valuesStr: a.values.join(", ") }); setErrors({}); setDialog({ mode: "edit", item: a }); };
  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors._global) setErrors((current) => ({ ...current, [field]: "", _global: "" }));
  };

  const save = () => {
    const nextErrors = {};
    const name = form.name.trim();
    const values = form.valuesStr.split(",").map((v) => v.trim()).filter(Boolean);
    if (isBlank(name)) nextErrors.name = t("اسم الخاصية مطلوب");
    if (attrs.some((a) => a.id !== dialog.item?.id && a.name.trim() === name)) {
      nextErrors.name = "هذه الخاصية موجودة من قبل";
    }
    if (!values.length) nextErrors.valuesStr = "أضف قيمة واحدة على الأقل";
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    let next;
    if (dialog.mode === "add") {
      next = [...attrs, { id: Date.now(), name, values }];
    } else {
      next = attrs.map((a) => a.id === dialog.item.id ? { ...a, name, values } : a);
    }
    setAttrs(next);
    updateProductSettings({ variantAttributes: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = attrs.filter((a) => a.id !== id);
    setAttrs(next);
    updateProductSettings({ variantAttributes: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">خصائص المتغيرات</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          خاصية جديدة
        </SoftButton>
      </SoftBox>
      <SoftBox display="flex" flexDirection="column" gap={1.5}>
        {attrs.map((a) => (
          <SoftBox key={a.id} p={1.5} sx={{ border: "1px solid #e9ecef", borderRadius: 2 }}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <SoftTypography variant="button" fontWeight="bold">{a.name}</SoftTypography>
              <SoftBox display="flex" gap={0.5}>
                <IconButton size="small" onClick={() => openEdit(a)}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                <IconButton size="small" onClick={() => remove(a.id)}><DeleteOutlineIcon sx={{ fontSize: 14, color: "#ea0606" }} /></IconButton>
              </SoftBox>
            </SoftBox>
            <SoftBox display="flex" flexWrap="wrap" gap={0.5}>
              {a.values.map((v) => (
                <Chip key={v} label={v} size="small" sx={{ fontSize: 11 }} />
              ))}
            </SoftBox>
          </SoftBox>
        ))}
      </SoftBox>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "خاصية جديدة" : "تعديل الخاصية"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            {errors._global && <Alert severity="error">{errors._global}</Alert>}
            <TextField label="اسم الخاصية *" size="small" fullWidth value={form.name}
              onChange={(e) => setField("name", e.target.value)} placeholder="مثال: اللون، المقاس..."
              error={!!errors.name} helperText={errors.name || ""} />
            <TextField label="القيم (افصل بفواصل)" size="small" fullWidth value={form.valuesStr}
              onChange={(e) => setField("valuesStr", e.target.value)}
              placeholder="مثال: أحمر, أزرق, أخضر" multiline rows={2}
              error={!!errors.valuesStr}
              helperText={errors.valuesStr || "اكتب القيم مفصولة بفاصلة ثم حفظ"} />
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Email Notifications Tab ─────────────────────────────────────────────────
const COMMON_EMAIL_DOMAIN_FIXES = {
  "ahoo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "hotnail.com": "hotmail.com",
};

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function emailWarning(email) {
  const domain = email.split("@")[1]?.toLowerCase();
  const suggestion = COMMON_EMAIL_DOMAIN_FIXES[domain];
  return suggestion ? `هل تقصد ${email.split("@")[0]}@${suggestion}؟` : "";
}

function EmailNotificationsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [users, setUsers] = useState([]);
  const [outbox, setOutbox] = useState([]);
  const [feedback, setFeedback] = useState(null); // {severity, message}
  const [extraEmailDraft, setExtraEmailDraft] = useState("");
  const [settings, setSettings] = useState({
    enabled: false,
    recipientUserIds: [],
    extraEmails: [],
    events: {
      productCreated: true,
      productPriceChanged: true,
      productLowStock: true,
      bulkImportCompleted: true,
    },
    bulkAttachThresholdRows: 10,
  });

  const reloadOutbox = () => {
    emailNotificationsApi.listOutbox(15)
      .then((r) => setOutbox(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOutbox([]));
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      emailNotificationsApi.get().catch(() => ({ data: null })),
      usersApi.list({ size: 200 }).catch(() => ({ data: { content: [] } })),
    ]).then(([settingsRes, usersRes]) => {
      if (!active) return;
      if (settingsRes?.data) {
        setSettings((prev) => ({ ...prev, ...settingsRes.data,
          events: { ...prev.events, ...(settingsRes.data.events || {}) } }));
      }
      const list = usersRes?.data?.content || usersRes?.data || [];
      setUsers(Array.isArray(list) ? list : []);
      setLoading(false);
      reloadOutbox();
    });
    return () => { active = false; };
  }, []);

  const setEvent = (key, value) =>
    setSettings((s) => ({ ...s, events: { ...s.events, [key]: value } }));

  const addExtraEmail = () => {
    const e = normalizeEmail(extraEmailDraft);
    if (!e || !e.includes("@")) {
      setFeedback({ severity: "warning", message: "أدخل بريداً إلكترونياً صحيحاً" });
      return;
    }
    if (settings.extraEmails.includes(e)) {
      setExtraEmailDraft("");
      return;
    }
    setSettings((s) => ({ ...s, extraEmails: [...s.extraEmails, e] }));
    setExtraEmailDraft("");
    const warning = emailWarning(e);
    if (warning) setFeedback({ severity: "warning", message: warning });
  };

  const removeExtraEmail = (e) =>
    setSettings((s) => ({ ...s, extraEmails: s.extraEmails.filter((x) => x !== e) }));

  const save = () => {
    setSaving(true);
    setFeedback(null);
    emailNotificationsApi.save(settings)
      .then((r) => {
        if (r?.data) {
          setSettings((prev) => ({ ...prev, ...r.data,
            events: { ...prev.events, ...(r.data.events || {}) } }));
        }
        setFeedback({ severity: "success", message: "تم حفظ الإعدادات بنجاح" });
      })
      .catch((err) => {
        setFeedback({ severity: "error",
          message: err?.response?.data?.message || "تعذر حفظ الإعدادات" });
      })
      .finally(() => setSaving(false));
  };

  const sendTest = () => {
    setTesting(true);
    setFeedback(null);
    emailNotificationsApi.save(settings)
      .then((r) => {
        if (r?.data) {
          setSettings((prev) => ({ ...prev, ...r.data,
            events: { ...prev.events, ...(r.data.events || {}) } }));
        }
        return emailNotificationsApi.sendTest();
      })
      .then((r) => {
        setFeedback({ severity: "success",
          message: `تم إرسال رسالة اختبار إلى ${r?.data?.recipientCount ?? 0} مستلم` });
        setTimeout(reloadOutbox, 1500);
      })
      .catch((err) => {
        setFeedback({ severity: "error",
          message: err?.response?.data?.message || "تعذر إرسال رسالة الاختبار. تأكد من اختيار المستلمين أولاً." });
      })
      .finally(() => setTesting(false));
  };

  const selectedUsers = users.filter((u) => settings.recipientUserIds.includes(u.id));

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" py={6}>
        <CircularProgress size={28} />
      </SoftBox>
    );
  }

  return (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <EmailIcon sx={{ color: "#cb0c9f" }} />
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">إشعارات البريد الإلكتروني</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              اختر المستخدمين الذين يصلهم بريد عند إضافة صنف، تعديل سعر، تنبيه مخزون أو استيراد جماعي
            </SoftTypography>
          </SoftBox>
        </SoftBox>
        <FormControlLabel
          control={<Switch checked={settings.enabled}
            onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))} />}
          label={<SoftTypography variant="caption" fontWeight="medium">
            {settings.enabled ? "مُفعّل" : "موقوف"}
          </SoftTypography>}
        />
      </SoftBox>

      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Card sx={{ p: 2.5, mb: 2.5, border: "1px solid #e9ecef", boxShadow: "none" }}>
        <SoftTypography variant="button" fontWeight="bold" display="block" mb={1.5}>
          المستلمون من المستخدمين
        </SoftTypography>
        <Autocomplete
          multiple
          options={users}
          value={selectedUsers}
          getOptionLabel={(u) => `${u.name || u.fullName || ""} — ${u.email}`}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_, value) =>
            setSettings((s) => ({ ...s, recipientUserIds: value.map((u) => u.id) }))}
          renderTags={(value, getTagProps) =>
            value.map((u, i) => (
              <Chip key={u.id} size="small" color="info" variant="outlined"
                label={u.name || u.email} {...getTagProps({ index: i })} />
            ))
          }
          renderInput={(params) => (
            <TextField {...params} size="small" placeholder="ابحث عن مستخدم..." />
          )}
        />

        <SoftTypography variant="button" fontWeight="bold" display="block" mt={3} mb={1}>
          عناوين بريد إضافية
        </SoftTypography>
        <SoftBox display="flex" gap={1} alignItems="center" mb={1}>
          <TextField size="small" fullWidth placeholder="example@domain.com"
            value={extraEmailDraft}
            onChange={(e) => setExtraEmailDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraEmail(); } }} />
          <SoftButton variant="outlined" color="info" size="small"
            startIcon={<AddIcon />} onClick={addExtraEmail}>إضافة</SoftButton>
        </SoftBox>
        <SoftBox display="flex" flexWrap="wrap" gap={0.7}>
          {settings.extraEmails.map((e) => (
            <Tooltip key={e} title={emailWarning(e)}>
              <Chip
                label={e}
                size="small"
                color={emailWarning(e) ? "warning" : "default"}
                onDelete={() => removeExtraEmail(e)}
              />
            </Tooltip>
          ))}
          {!settings.extraEmails.length && (
            <SoftTypography variant="caption" color="secondary">
              لم يُضَف أي بريد إضافي بعد.
            </SoftTypography>
          )}
        </SoftBox>
      </Card>

      <Card sx={{ p: 2.5, mb: 2.5, border: "1px solid #e9ecef", boxShadow: "none" }}>
        <SoftTypography variant="button" fontWeight="bold" display="block" mb={1.5}>
          الأحداث التي يصل بها إشعار
        </SoftTypography>
        {[
          { key: "productCreated",      label: "إضافة صنف جديد",        hint: "عند إنشاء أي صنف جديد" },
          { key: "productPriceChanged", label: "تعديل سعر صنف",          hint: "عند تغيير السعر الحالي" },
          { key: "productLowStock",     label: "تنبيه مخزون منخفض",      hint: "عندما تصل الكمية للحد الأدنى" },
          { key: "bulkImportCompleted", label: "اكتمال استيراد جماعي",  hint: "ملخص بعد إضافة عدة أصناف عبر الاستيراد" },
        ].map((ev) => (
          <SoftBox key={ev.key} display="flex" justifyContent="space-between" alignItems="center"
            sx={{ borderBottom: "1px solid #f1f3f5", py: 1, "&:last-of-type": { borderBottom: 0 } }}>
            <SoftBox>
              <SoftTypography variant="button" fontWeight="medium" display="block">{ev.label}</SoftTypography>
              <SoftTypography variant="caption" color="secondary">{ev.hint}</SoftTypography>
            </SoftBox>
            <Switch
              checked={!!settings.events[ev.key]}
              onChange={(e) => setEvent(ev.key, e.target.checked)}
            />
          </SoftBox>
        ))}
        <Divider sx={{ my: 2 }} />
        <SoftBox display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <SoftTypography variant="caption" color="secondary">
            إرفاق ملف CSV عند الاستيراد إذا تجاوز عدد الصفوف:
          </SoftTypography>
          <TextField size="small" type="number" sx={{ maxWidth: 110 }}
            value={settings.bulkAttachThresholdRows}
            onChange={(e) => setSettings((s) => ({ ...s,
              bulkAttachThresholdRows: Math.max(1, Number(e.target.value) || 1) }))} />
          <SoftTypography variant="caption" color="secondary">صف</SoftTypography>
        </SoftBox>
      </Card>

      <SoftBox display="flex" gap={1.5} mb={3}>
        <SoftButton variant="gradient" color="info" size="small" onClick={save} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </SoftButton>
        <SoftButton variant="outlined" color="dark" size="small"
          startIcon={<SendIcon sx={{ fontSize: 16 }} />} onClick={sendTest} disabled={testing || !settings.enabled}>
          {testing ? "جارٍ الإرسال..." : "إرسال رسالة اختبار"}
        </SoftButton>
      </SoftBox>

      <Card sx={{ p: 2.5, border: "1px solid #e9ecef", boxShadow: "none" }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <SoftTypography variant="button" fontWeight="bold">آخر الرسائل المُرسَلة</SoftTypography>
          <SoftButton variant="text" color="info" size="small" onClick={reloadOutbox}>تحديث</SoftButton>
        </SoftBox>
        {outbox.length === 0 ? (
          <SoftTypography variant="caption" color="secondary">
            لا توجد رسائل بعد. ستظهر هنا فور إرسال أول إشعار.
          </SoftTypography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["الموضوع", "الحدث", "المستلمون", "الحالة", "التاريخ"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#8392ab" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {outbox.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontSize: 12 }}>{row.subject}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: "monospace", color: "#8392ab" }}>{row.eventCode}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{row.recipientCount}</TableCell>
                    <TableCell>
                      {row.status === "sent" && <Chip size="small" color="success" label="تم الإرسال" sx={{ fontSize: 11 }} />}
                      {row.status === "failed" && (
                        <Tooltip title={row.errorMessage || ""}>
                          <Chip size="small" color="error" label="فشل" sx={{ fontSize: 11 }} />
                        </Tooltip>
                      )}
                      {row.status === "pending" && <Chip size="small" label="قيد الإرسال" sx={{ fontSize: 11 }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>
                      {row.sentAt || row.createdAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </SoftBox>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton size="small" onClick={() => navigate("/products")}><ArrowBackIcon fontSize="small" /></IconButton>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">إعدادات الأصناف</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              إدارة الوحدات والتصنيفات وخصائص المتغيرات وإشعارات البريد
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        <Card>
          <SoftBox sx={{ borderBottom: "1px solid #e9ecef" }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label="وحدات القياس" sx={{ fontSize: "0.8rem" }} />
              <Tab label="التصنيفات" sx={{ fontSize: "0.8rem" }} />
              <Tab label="خصائص المتغيرات" sx={{ fontSize: "0.8rem" }} />
              <Tab label="إشعارات البريد" sx={{ fontSize: "0.8rem" }} icon={<EmailIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
            </Tabs>
          </SoftBox>
          <SoftBox p={3}>
            {tab === 0 && <UnitsTab />}
            {tab === 1 && <CategoriesTab />}
            {tab === 2 && <VariantAttrsTab />}
            {tab === 3 && <EmailNotificationsTab />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
