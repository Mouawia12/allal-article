/* eslint-disable react/prop-types */
import { useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { localizeNode, useI18n } from "i18n";
import { mockPlans, mockTenants } from "data/mock/ownerMock";

const fmt = (n) => (n != null ? n.toLocaleString("fr-DZ") : "∞");

// ─── Edit Plan Dialog ─────────────────────────────────────────────────────────
function EditPlanDialog({ plan, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    priceMonthly: plan?.priceMonthly ?? "",
    maxUsers: plan?.maxUsers ?? "",
    maxOrders: plan?.maxOrders ?? "",
    maxProducts: plan?.maxProducts ?? "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!plan) return null;
  return localizeNode((
    <Dialog open={!!plan} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>تعديل خطة — {plan.nameAr}</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="السعر الشهري (دج)"
            value={form.priceMonthly}
            onChange={set("priceMonthly")}
            size="small" fullWidth
            helperText="اتركه فارغاً لخطة مخصصة السعر"
          />
          <TextField label="أقصى مستخدمين (فارغ = ∞)" value={form.maxUsers} onChange={set("maxUsers")} size="small" fullWidth />
          <TextField label="أقصى طلبيات/شهر (فارغ = ∞)" value={form.maxOrders} onChange={set("maxOrders")} size="small" fullWidth />
          <TextField label="أقصى أصناف (فارغ = ∞)" value={form.maxProducts} onChange={set("maxProducts")} size="small" fullWidth />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box
          component="button"
          onClick={onClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab" }}
        >
          إلغاء
        </Box>
        <Box
          component="button"
          onClick={onClose}
          sx={{ background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600 }}
        >
          حفظ التعديلات
        </Box>
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, subscriberCount, onEdit }) {
  const { t } = useI18n();
  const [active, setActive] = useState(plan.isActive);

  return localizeNode((
    <Card sx={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", border: `2px solid ${plan.color}33`, overflow: "visible" }}>
      {/* Header strip */}
      <Box sx={{ background: plan.color, borderRadius: "10px 10px 0 0", p: 2, color: "#fff" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Box sx={{ fontSize: 16, fontWeight: 700 }}>{plan.nameAr}</Box>
            <Box sx={{ fontSize: 12, opacity: 0.85 }}>{plan.nameEn}</Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="تعديل الخطة">
              <IconButton size="small" onClick={onEdit} sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }}>
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ mt: 1.5, fontSize: 22, fontWeight: 800 }}>
          {plan.priceMonthly != null ? (
            <>{plan.priceMonthly.toLocaleString("fr-DZ")} <span style={{ fontSize: 13, fontWeight: 400 }}>دج/شهر</span></>
          ) : (
            <span style={{ fontSize: 16, fontWeight: 600 }}>سعر مخصص</span>
          )}
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, flex: 1 }}>
        {/* Limits */}
        <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.maxUsers)} مستخدم</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ShoppingCartIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.maxOrders)} طلبية</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <InventoryIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            <Box sx={{ fontSize: 12, color: "#344767" }}>{fmt(plan.maxProducts)} صنف</Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Features */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ fontSize: 11, fontWeight: 600, color: "#8392ab", mb: 1 }}>الميزات المتاحة</Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {plan.featuresAr.map((f) => (
              <Box key={f} sx={{ display: "flex", alignItems: "center", gap: 0.4, fontSize: 11, color: "#344767" }}>
                <CheckCircleIcon sx={{ fontSize: 13, color: plan.color }} /> {f}
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Box sx={{ fontSize: 11, color: "#8392ab" }}>المشتركون الحاليون</Box>
            <Box sx={{ fontSize: 18, fontWeight: 700, color: plan.color }}>{subscriberCount}</Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ fontSize: 12, color: "#8392ab" }}>{active ? "مفعّلة" : "معطّلة"}</Box>
            <Switch
              size="small"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              sx={{ "& .MuiSwitch-thumb": { background: plan.color } }}
            />
          </Box>
        </Box>
      </Box>
    </Card>
  ), t);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerPlans() {
  const [editPlan, setEditPlan] = useState(null);

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>إدارة خطط الاشتراك</Box>
          <Box sx={{ fontSize: 13, color: "#8392ab" }}>تعديل أسعار وحدود وميزات كل خطة</Box>
        </Box>

        {/* Plan cards */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          {mockPlans.map((plan) => {
            const count = mockTenants.filter((t) => t.planId === plan.id && t.status !== "cancelled").length;
            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                subscriberCount={count}
                onEdit={() => setEditPlan(plan)}
              />
            );
          })}
        </Box>

        {/* Info note */}
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1 }}>ملاحظات حول إدارة الخطط</Box>
          <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 12, color: "#8392ab", lineHeight: 2 }}>
            <li>تعديل أسعار الخطط لا يؤثر على المشتركين الحاليين حتى تجديد اشتراكاتهم.</li>
            <li>تعطيل خطة يمنع اختيارها للمشتركين الجدد، لكن لا يؤثر على الحاليين.</li>
            <li>تغيير الحدود (المستخدمون/الطلبيات) يُطبَّق فوراً على المشتركين في تلك الخطة.</li>
            <li>خطة &quot;مؤسسي&quot; ذات سعر مخصص — يُحدَّد بالتفاوض المباشر مع كل مشترك.</li>
          </Box>
        </Card>

        <EditPlanDialog plan={editPlan} onClose={() => setEditPlan(null)} />
      </Box>
    </OwnerLayout>
  );
}
