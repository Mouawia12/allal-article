/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { localizeNode, useI18n } from "i18n";
import { statusConfig } from "data/mock/ownerMock";
import ownerApi from "services/ownerApi";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";

const fmt = (n) => n?.toLocaleString("fr-DZ") ?? "—";

// ─── New Tenant Dialog ────────────────────────────────────────────────────────
function NewTenantDialog({ open, onClose, plans, onCreated }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ companyName:"", contactEmail:"", contactPhone:"", wilayaCode:"", planCode:"trial", ownerName:"", ownerPassword:"" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k] || errors._global) setErrors((current) => ({ ...current, [k]: "", _global: "" }));
  };

  const handleCreate = async () => {
    const nextErrors = {};
    if (isBlank(form.companyName)) nextErrors.companyName = t("اسم الشركة مطلوب");
    if (isBlank(form.contactEmail)) nextErrors.contactEmail = t("البريد الإلكتروني مطلوب");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) nextErrors.contactEmail = t("البريد الإلكتروني غير صالح");
    if (form.ownerPassword && form.ownerPassword.length < 8) nextErrors.ownerPassword = t("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (form.wilayaCode && !/^\d{1,2}$/.test(form.wilayaCode)) nextErrors.wilayaCode = t("رمز الولاية يجب أن يكون رقماً");
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    setLoading(true); setErrors({});
    try {
      const r = await ownerApi.createTenant(form);
      setResult(r.data);
      onCreated?.();
    } catch (e) {
      applyApiErrors(e, setErrors, "حدث خطأ أثناء الإنشاء");
    } finally { setLoading(false); }
  };

  const handleClose = () => { setForm({ companyName:"", contactEmail:"", contactPhone:"", wilayaCode:"", planCode:"trial", ownerName:"", ownerPassword:"" }); setResult(null); setErrors({}); onClose(); };

  return localizeNode((
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>إضافة مشترك جديد</Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {result ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ background: "#f0fde4", border: "1px solid #82d61644", borderRadius: 2, p: 2, fontSize: 13, color: "#344767" }}>
              <Box sx={{ fontWeight: 700, mb: 1, color: "#82d616" }}>✓ تم إنشاء المشترك بنجاح</Box>
              <Box>Schema: <b>{result.schemaName}</b></Box>
              <Box>البريد: <b>{result.ownerEmail}</b></Box>
              <Box>كلمة المرور: <b>{result.ownerPassword}</b></Box>
              <Box sx={{ mt: 1, fontSize: 11, color: "#ea0606", fontWeight: 600 }}>احتفظ بهذه المعلومات — لن تظهر مجدداً</Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {errors._global && <Alert severity="error">{errors._global}</Alert>}
            <TextField label="اسم الشركة *" value={form.companyName} onChange={set("companyName")} size="small" fullWidth error={!!errors.companyName} helperText={errors.companyName || ""} />
            <TextField label="البريد الإلكتروني للتواصل *" value={form.contactEmail} onChange={set("contactEmail")} size="small" fullWidth type="email" error={!!errors.contactEmail} helperText={errors.contactEmail || ""} />
            <TextField label="رقم الهاتف" value={form.contactPhone} onChange={set("contactPhone")} size="small" fullWidth error={!!errors.contactPhone} helperText={errors.contactPhone || ""} />
            <TextField label="الولاية (رمز)" value={form.wilayaCode} onChange={set("wilayaCode")} size="small" fullWidth placeholder="16" error={!!errors.wilayaCode} helperText={errors.wilayaCode || ""} />
            <TextField label="اسم مدير الحساب الأول" value={form.ownerName} onChange={set("ownerName")} size="small" fullWidth placeholder="يُستخدم اسم الشركة افتراضياً" />
            <TextField label="كلمة مرور المدير (اختياري)" value={form.ownerPassword} onChange={set("ownerPassword")} size="small" fullWidth placeholder="تُولَّد تلقائياً إن تُركت فارغة" error={!!errors.ownerPassword} helperText={errors.ownerPassword || ""} />
            <FormControl size="small" fullWidth>
              <Select value={form.planCode} onChange={set("planCode")}>
                {(plans ?? []).map((p) => (
                  <MenuItem key={p.code} value={p.code}>
                    {p.name_ar} — {p.price_monthly ? `${fmt(p.price_monthly)} دج/شهر` : "مجاني"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ background: "#e3f8fd", border: "1px solid #b2ebf9", borderRadius: 2, p: 1.5, fontSize: 12, color: "#344767" }}>
              <Box sx={{ fontWeight: 600, mb: 0.5 }}>سيتم تلقائياً:</Box>
              <Box>• إنشاء مخطط قاعدة البيانات المنفصل</Box>
              <Box>• توليد شجرة الحسابات المحاسبية الجزائرية (SCF)</Box>
              <Box>• إنشاء حساب المدير الأول</Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box component="button" onClick={handleClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab" }}>
          {result ? "إغلاق" : "إلغاء"}
        </Box>
        {!result && (
          <Box component="button" onClick={handleCreate} disabled={loading}
            sx={{ background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "#fff", fontWeight: 600, opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
            {loading ? "جاري الإنشاء..." : "إنشاء المشترك"}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────
function ResetPasswordDialog({ tenant, onClose }) {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [done,     setDone]     = useState(false);

  if (!tenant) return null;

  const handleReset = async () => {
    const nextErrors = {};
    if (password.length < 8) nextErrors.password = t("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (password !== confirm) nextErrors.confirm = t("كلمتا المرور غير متطابقتان");
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    setLoading(true); setErrors({});
    try {
      await ownerApi.resetPassword(tenant.id, password);
      setDone(true);
    } catch (e) {
      applyApiErrors(e, setErrors, "حدث خطأ أثناء تغيير كلمة المرور");
    } finally { setLoading(false); }
  };

  const handleClose = () => { setPassword(""); setConfirm(""); setErrors({}); setDone(false); onClose(); };

  return localizeNode((
    <Dialog open={!!tenant} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>تغيير كلمة مرور المدير</Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {done ? (
          <Box sx={{ background: "#f0fde4", border: "1px solid #82d61644", borderRadius: 2, p: 2, fontSize: 13, color: "#82d616", fontWeight: 600 }}>
            ✓ تم تغيير كلمة المرور بنجاح للمشترك <b>{tenant.company_name}</b>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ fontSize: 12, color: "#8392ab", background: "#f8f9fa", borderRadius: 2, p: 1.5 }}>
              المشترك: <b style={{ color: "#344767" }}>{tenant.company_name}</b>
              <br />سيتم تغيير كلمة مرور حساب المدير الأول ({tenant.contact_email})
            </Box>
            <TextField
              label="كلمة المرور الجديدة *"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password || errors._global) setErrors((current) => ({ ...current, password: "", _global: "" })); }}
              size="small" fullWidth
              error={!!errors.password}
              helperText={errors.password || "8 أحرف على الأقل"}
            />
            <TextField
              label="تأكيد كلمة المرور *"
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); if (errors.confirm || errors._global) setErrors((current) => ({ ...current, confirm: "", _global: "" })); }}
              size="small" fullWidth
              error={!!errors.confirm}
              helperText={errors.confirm || ""}
            />
            {errors._global && (
              <Alert severity="error">
                {errors._global}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box component="button" onClick={handleClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab", fontFamily: "inherit" }}>
          {done ? "إغلاق" : "إلغاء"}
        </Box>
        {!done && (
          <Box component="button" onClick={handleReset} disabled={loading}
            sx={{ background: loading ? "#b0e8f5" : "linear-gradient(135deg, #7928ca, #5e1e9e)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: loading ? "not-allowed" : "pointer", fontSize: 13, color: "#fff", fontWeight: 600, opacity: loading ? 0.7 : 1, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 0.8 }}>
            <LockResetIcon sx={{ fontSize: 15 }} />
            {loading ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Tenant Detail Dialog ─────────────────────────────────────────────────────
function TenantDetailDialog({ tenant, onClose, onStatusChange }) {
  const { t } = useI18n();
  const [resetOpen, setResetOpen] = useState(false);
  if (!tenant) return null;
  const sc = statusConfig[tenant.status];
  const userPct = tenant.maxUsers ? Math.round((tenant.usersCount / tenant.maxUsers) * 100) : 0;

  return localizeNode((
    <Dialog open={!!tenant} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Box sx={{ fontWeight: 700, fontSize: 16 }}>{tenant.name}</Box>
          <Box sx={{ fontSize: 12, color: "#8392ab" }}>{tenant.uuid}</Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Chip label={sc?.labelAr} size="small" sx={{ background: sc?.bg, color: sc?.color, fontWeight: 600 }} />
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Plan */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ fontSize: 13, fontWeight: 600, color: "#17c1e8" }}>{tenant.plan_name ?? "—"}</Box>
            {tenant.price_monthly
              ? <Box sx={{ fontSize: 12, color: "#8392ab" }}>— {fmt(tenant.price_monthly)} دج/شهر</Box>
              : <Box sx={{ fontSize: 12, color: "#8392ab" }}>— مجاني</Box>
            }
          </Box>

          <Divider />

          {/* Info grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {[
              { label: "البريد الإلكتروني", value: tenant.contact_email },
              { label: "الهاتف", value: tenant.contact_phone },
              { label: "الولاية", value: tenant.wilaya_code },
              { label: "مخطط قاعدة البيانات", value: tenant.schema_name },
              { label: "تاريخ الإنشاء", value: tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("ar-DZ") : "—" },
              { label: "آخر نشاط", value: tenant.last_activity_at ? new Date(tenant.last_activity_at).toLocaleDateString("ar-DZ") : "—" },
              { label: "تفعيل", value: tenant.activated_at ? new Date(tenant.activated_at).toLocaleDateString("ar-DZ") : "—" },
              { label: "انتهاء التجربة", value: tenant.trial_ends_at ?? "—" },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Box sx={{ fontSize: 10, color: "#8392ab", mb: 0.2 }}>{label}</Box>
                <Box sx={{ fontSize: 12, fontWeight: 500, color: "#344767" }}>{value ?? "—"}</Box>
              </Box>
            ))}
          </Box>

          <Divider />

          {tenant.suspended_reason && (
            <Box sx={{ background: "#ffeaea", border: "1px solid #ea060644", borderRadius: 2, p: 1.5, fontSize: 12, color: "#ea0606" }}>
              سبب الإيقاف: {tenant.suspended_reason}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap" }}>
        {tenant.status === "active" && (
          <Box component="button" onClick={() => onStatusChange(tenant.id, "suspended")}
            sx={{ background: "#ffeaea", border: "1px solid #ea060644", color: "#ea0606", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, fontFamily: "inherit" }}>
            <PauseCircleIcon sx={{ fontSize: 15 }} /> إيقاف الاشتراك
          </Box>
        )}
        {tenant.status === "suspended" && (
          <Box component="button" onClick={() => onStatusChange(tenant.id, "active")}
            sx={{ background: "#f0fde4", border: "1px solid #82d61644", color: "#82d616", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, fontFamily: "inherit" }}>
            <PlayCircleIcon sx={{ fontSize: 15 }} /> استئناف الاشتراك
          </Box>
        )}
        {tenant.status === "trial" && (
          <Box component="button" onClick={() => onStatusChange(tenant.id, "active")}
            sx={{ background: "#e3f8fd", border: "1px solid #17c1e844", color: "#17c1e8", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, fontFamily: "inherit" }}>
            <PlayCircleIcon sx={{ fontSize: 15 }} /> تفعيل الاشتراك
          </Box>
        )}
        <Box component="button" onClick={() => setResetOpen(true)}
          sx={{ background: "#f3e8ff", border: "1px solid #7928ca44", color: "#7928ca", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, fontFamily: "inherit" }}>
          <LockResetIcon sx={{ fontSize: 15 }} /> تغيير كلمة المرور
        </Box>
        <Box
          component="button"
          onClick={onClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab", marginLeft: "auto" }}
        >
          إغلاق
        </Box>
      </DialogActions>
      <ResetPasswordDialog tenant={resetOpen ? tenant : null} onClose={() => setResetOpen(false)} />
    </Dialog>
  ), t);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerTenants() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter]   = useState("all");
  const [newOpen, setNewOpen]         = useState(false);
  const [detail, setDetail]           = useState(null);
  const [tenants, setTenants]         = useState([]);
  const [plans, setPlans]             = useState([]);
  const [pageError, setPageError]     = useState("");

  const load = () => {
    const appendError = (error, fallback) => {
      setPageError((current) => {
        const message = getApiErrorMessage(error, fallback);
        return current ? `${current}؛ ${message}` : message;
      });
    };
    setPageError("");
    ownerApi.listTenants()
      .then((r) => setTenants(r.data ?? []))
      .catch((error) => {
        appendError(error, "تعذر تحميل المشتركين");
        setTenants([]);
      });
    ownerApi.listPlans()
      .then((r) => setPlans(r.data ?? []))
      .catch((error) => {
        appendError(error, "تعذر تحميل الباقات");
        setPlans([]);
      });
  };
  useEffect(load, []);

  const handleStatusChange = async (id, status) => {
    try {
      setPageError("");
      await ownerApi.updateStatus(id, status, null);
      load();
      setDetail(null);
    } catch (e) {
      setPageError(getApiErrorMessage(e, "تعذر تحديث حالة المشترك"));
    }
  };

  const filtered = tenants.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (planFilter !== "all" && t.plan_code !== planFilter) return false;
    if (search && !t.company_name?.includes(search) && !t.contact_email?.includes(search)) return false;
    return true;
  });

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>إدارة المشتركين</Box>
            <Box sx={{ fontSize: 13, color: "#8392ab" }}>عرض وإدارة جميع مشتركي المنصة</Box>
          </Box>
          <Box
            component="button"
            onClick={() => setNewOpen(true)}
            sx={{ display: "flex", alignItems: "center", gap: 0.8, background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: "10px", px: 2.5, py: 1, cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13 }}
          >
            <AddIcon sx={{ fontSize: 18 }} /> مشترك جديد
          </Box>
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="بحث بالاسم، البريد، الولاية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#8392ab" }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty>
              <MenuItem value="all">كل الحالات</MenuItem>
              <MenuItem value="active">نشط</MenuItem>
              <MenuItem value="trial">تجريبي</MenuItem>
              <MenuItem value="suspended">موقوف</MenuItem>
              <MenuItem value="cancelled">ملغى</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} displayEmpty>
              <MenuItem value="all">كل الخطط</MenuItem>
              {plans.map((p) => <MenuItem key={p.code} value={p.code}>{p.name_ar}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ fontSize: 12, color: "#8392ab", alignSelf: "center", ml: 1 }}>
            {filtered.length} مشترك
          </Box>
        </Box>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        {/* Table */}
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["الشركة", "الولاية", "البريد الإلكتروني", "الخطة", "الحالة", "المستخدمون", "الطلبيات/الشهر", "آخر نشاط", ""].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا يوجد مشتركون بعد</TableCell></TableRow>
                ) : filtered.map((t) => {
                  const sc         = statusConfig[t.status];
                  const usersCount  = Number(t.users_count ?? 0);
                  const maxUsers    = t.max_users ? Number(t.max_users) : null;
                  const usersPct    = maxUsers ? Math.round((usersCount / maxUsers) * 100) : null;
                  const ordersCount = Number(t.orders_this_month ?? 0);
                  return (
                    <TableRow key={t.id} sx={{ "&:hover": { background: "#f8f9fa" }, cursor: "pointer" }} onClick={() => setDetail(t)}>
                      <TableCell>
                        <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>{t.company_name}</Box>
                        <Box sx={{ fontSize: 10, color: "#adb5bd" }}>{t.schema_name}</Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#8392ab" }}>{t.wilaya_code ?? "—"}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{t.contact_email}</TableCell>
                      <TableCell>
                        <Chip label={t.plan_name ?? "—"} size="small" sx={{ fontSize: 10, fontWeight: 600, color: "#17c1e8", background: "#e3f8fd", border: "1px solid #17c1e844" }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={sc?.labelAr ?? t.status} size="small" sx={{ background: sc?.bg ?? "#f8f9fa", color: sc?.color ?? "#344767", fontWeight: 600, fontSize: 10 }} />
                      </TableCell>
                      {/* المستخدمون */}
                      <TableCell sx={{ minWidth: 80 }}>
                        <Box sx={{ fontSize: 12, fontWeight: 600, color: usersPct >= 90 ? "#ea0606" : usersPct >= 70 ? "#fb8c00" : "#344767" }}>
                          {usersCount}{maxUsers ? `/${maxUsers}` : ""}
                        </Box>
                        {usersPct != null && (
                          <LinearProgress variant="determinate" value={usersPct}
                            sx={{ height: 3, borderRadius: 2, mt: 0.5, background: "#f0f2f5",
                              "& .MuiLinearProgress-bar": { background: usersPct >= 90 ? "#ea0606" : usersPct >= 70 ? "#fb8c00" : "#17c1e8", borderRadius: 2 } }} />
                        )}
                      </TableCell>
                      {/* الطلبيات/الشهر */}
                      <TableCell sx={{ fontSize: 12, fontWeight: 600, color: ordersCount > 0 ? "#17c1e8" : "#adb5bd" }}>
                        {ordersCount.toLocaleString("fr-DZ")}
                      </TableCell>
                      {/* آخر نشاط */}
                      <TableCell sx={{ fontSize: 11, color: "#8392ab", whiteSpace: "nowrap" }}>
                        {t.last_activity_at ? new Date(t.last_activity_at).toLocaleDateString("ar-DZ") : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="تفاصيل">
                          <IconButton size="small" onClick={() => setDetail(t)}><VisibilityIcon sx={{ fontSize: 15 }} /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <NewTenantDialog open={newOpen} onClose={() => setNewOpen(false)} plans={plans} onCreated={load} />
        <TenantDetailDialog tenant={detail} onClose={() => setDetail(null)} onStatusChange={handleStatusChange} />
      </Box>
    </OwnerLayout>
  );
}
