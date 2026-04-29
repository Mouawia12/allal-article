/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { localizeNode, useI18n } from "i18n";
import { planColors } from "data/mock/ownerMock";
import ownerApi from "services/ownerApi";
import { applyApiErrors, getApiErrorMessage, hasErrors } from "utils/formErrors";

const fmt = (n) => (n != null ? Number(n).toLocaleString("fr-DZ") : "∞");

const PLAN_FEATURES = {
  trial:        ["إدارة الطلبيات", "المخزون", "الفواتير"],
  basic:        ["إدارة الطلبيات", "المخزون", "الفواتير", "التقارير الأساسية"],
  professional: ["إدارة الطلبيات", "المخزون", "الفواتير", "المحاسبة", "التقارير المتقدمة", "التكامل مع الموردين"],
  enterprise:   ["كل ميزات الاحترافي", "إدارة متعددة الفروع", "API مخصص", "دعم مخصص", "تدريب فريق العمل"],
};

// ─── Edit Plan Dialog ─────────────────────────────────────────────────────────
function EditPlanDialog({ plan, onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    price_monthly:      plan?.price_monthly ?? "",
    max_users:          plan?.max_users ?? "",
    max_orders_monthly: plan?.max_orders_monthly ?? "",
    max_products:       plan?.max_products ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k] || errors._global) setErrors((current) => ({ ...current, [k]: "", _global: "" }));
  };

  const handleSave = async () => {
    const nextErrors = {};
    ["price_monthly", "max_users", "max_orders_monthly", "max_products"].forEach((field) => {
      const value = form[field];
      if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        nextErrors[field] = t("القيمة يجب أن تكون رقماً موجباً أو فارغة");
      }
    });
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    setSaving(true);
    setErrors({});
    try {
      await ownerApi.updatePlan(plan.id, {
        price_monthly:      form.price_monthly === "" ? null : Number(form.price_monthly),
        max_users:          form.max_users === "" ? null : Number(form.max_users),
        max_orders_monthly: form.max_orders_monthly === "" ? null : Number(form.max_orders_monthly),
        max_products:       form.max_products === "" ? null : Number(form.max_products),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      applyApiErrors(e, setErrors, "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (!plan) return null;
  return localizeNode((
    <Dialog open={!!plan} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>تعديل خطة — {plan.name_ar}</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="السعر الشهري (دج)"
            value={form.price_monthly}
            onChange={set("price_monthly")}
            size="small" fullWidth type="number"
            error={!!errors.price_monthly}
            helperText={errors.price_monthly || "اتركه فارغاً لخطة مجانية أو مخصصة السعر"}
          />
          <TextField label="أقصى مستخدمين (فارغ = ∞)"       value={form.max_users}          onChange={set("max_users")}          size="small" fullWidth type="number" error={!!errors.max_users} helperText={errors.max_users || ""} />
          <TextField label="أقصى طلبيات/شهر (فارغ = ∞)"     value={form.max_orders_monthly} onChange={set("max_orders_monthly")} size="small" fullWidth type="number" error={!!errors.max_orders_monthly} helperText={errors.max_orders_monthly || ""} />
          <TextField label="أقصى أصناف (فارغ = ∞)"          value={form.max_products}       onChange={set("max_products")}       size="small" fullWidth type="number" error={!!errors.max_products} helperText={errors.max_products || ""} />
          {errors._global && (
            <Alert severity="error">
              {errors._global}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box
          component="button" onClick={onClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab", fontFamily: "inherit" }}
        >
          إلغاء
        </Box>
        <Box
          component="button"
          onClick={handleSave}
          disabled={saving}
          sx={{
            background: saving ? "#b0e8f5" : "linear-gradient(135deg, #17c1e8, #0ea5c9)",
            border: "none", borderRadius: 2, px: 2.5, py: 0.8,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 0.8,
          }}
        >
          {saving && <CircularProgress size={12} sx={{ color: "#fff" }} />}
          {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
        </Box>
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onEdit, onToggle, onToggleError }) {
  const { t } = useI18n();
  const [toggling, setToggling] = useState(false);
  const color    = planColors[plan.code] ?? "#8392ab";
  const features = PLAN_FEATURES[plan.code] ?? [];

  const handleToggle = async (e) => {
    const newVal = e.target.checked;
    setToggling(true);
    try {
      await ownerApi.updatePlan(plan.id, { is_active: newVal });
      onToggle?.();
    } catch (error) {
      onToggleError?.(getApiErrorMessage(error, "تعذر تحديث حالة الخطة"));
    } finally {
      setToggling(false);
    }
  };

  return localizeNode((
    <Card sx={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", border: `2px solid ${color}33`, overflow: "visible" }}>
      <Box sx={{ background: color, borderRadius: "10px 10px 0 0", p: 2, color: "#fff" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Box sx={{ fontSize: 16, fontWeight: 700 }}>{plan.name_ar}</Box>
            <Box sx={{ fontSize: 12, opacity: 0.85 }}>{plan.name_en}</Box>
          </Box>
          <Tooltip title="تعديل الخطة">
            <IconButton size="small" onClick={onEdit} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ mt: 1.5, fontSize: 22, fontWeight: 800 }}>
          {plan.price_monthly != null && plan.price_monthly > 0 ? (
            <>{Number(plan.price_monthly).toLocaleString("fr-DZ")} <span style={{ fontSize: 13, fontWeight: 400 }}>دج/شهر</span></>
          ) : (
            <span style={{ fontSize: 16, fontWeight: 600 }}>مجاني / تجريبي</span>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 2, flex: 1 }}>
        {/* Limits */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.max_users)} مستخدم</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ShoppingCartIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.max_orders_monthly)} طلبية</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <InventoryIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.max_products)} صنف</Box>
          </Box>
        </Box>

        {features.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ mb: 2 }}>
              <Box sx={{ fontSize: 11, fontWeight: 600, color: "#8392ab", mb: 1 }}>الميزات المتاحة</Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {features.map((f) => (
                  <Chip key={f} label={f} size="small"
                    sx={{ height: 20, fontSize: 10, background: `${color}14`, color }} />
                ))}
              </Box>
            </Box>
          </>
        )}

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Box sx={{ fontSize: 11, color: "#8392ab" }}>المشتركون الحاليون</Box>
            <Box sx={{ fontSize: 18, fontWeight: 700, color }}>{Number(plan.tenant_count ?? 0)}</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {toggling && <CircularProgress size={12} sx={{ color }} />}
            <Box sx={{ fontSize: 12, color: "#8392ab" }}>{plan.is_active ? "مفعّلة" : "معطّلة"}</Box>
            <Tooltip title={plan.is_active ? "إيقاف الخطة (لن تظهر للمشتركين الجدد)" : "تفعيل الخطة"}>
              <Switch
                size="small"
                checked={!!plan.is_active}
                disabled={toggling}
                onChange={handleToggle}
                sx={{ "& .MuiSwitch-thumb": { background: color } }}
              />
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Card>
  ), t);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerPlans() {
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editPlan, setEditPlan] = useState(null);
  const [pageError, setPageError] = useState("");
  const [toast,    setToast]    = useState({ open: false, msg: "", severity: "success" });

  const load = () => {
    setLoading(true);
    setPageError("");
    ownerApi.listPlans()
      .then((r) => setPlans(r.data ?? []))
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل الباقات"));
        setPlans([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSaved = () => {
    load();
    setToast({ open: true, msg: "تم حفظ التعديلات بنجاح", severity: "success" });
  };

  const handleToggle = () => {
    load();
    setToast({ open: true, msg: "تم تحديث حالة الخطة", severity: "info" });
  };

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>إدارة خطط الاشتراك</Box>
          <Box sx={{ fontSize: 13, color: "#8392ab" }}>
            تعديل الأسعار والحدود يُحدَّث تلقائياً على الصفحة الرئيسية
          </Box>
        </Box>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => setEditPlan(plan)}
                onToggle={handleToggle}
                onToggleError={(msg) => setToast({ open: true, msg, severity: "error" })}
              />
            ))}
          </Box>
        )}

        <Card sx={{ p: 2.5 }}>
          <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1 }}>ملاحظات حول إدارة الخطط</Box>
          <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 12, color: "#8392ab", lineHeight: 2 }}>
            <li>تعديل الأسعار يُطبَّق فوراً على الصفحة الرئيسية وصفحة التسعير.</li>
            <li>تعطيل خطة يمنع اختيارها للمشتركين الجدد ويُخفيها من الصفحة الرئيسية.</li>
            <li>تغيير الحدود (المستخدمون/الطلبيات) يُطبَّق فوراً على المشتركين الحاليين.</li>
            <li>خطة &quot;مؤسسي&quot; ذات سعر مخصص — يُحدَّد بالتفاوض المباشر مع كل مشترك.</li>
          </Box>
        </Card>

        <EditPlanDialog
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSaved={handleSaved}
        />

        <Snackbar
          open={toast.open}
          autoHideDuration={3500}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Box>
    </OwnerLayout>
  );
}
