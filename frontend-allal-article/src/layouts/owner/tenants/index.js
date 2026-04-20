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
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import { localizeNode, useI18n } from "i18n";
import { mockTenants, mockPlans, statusConfig, planColors } from "data/mock/ownerMock";

const fmt = (n) => n?.toLocaleString("fr-DZ") ?? "—";

// ─── New Tenant Dialog ────────────────────────────────────────────────────────
function NewTenantDialog({ open, onClose }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", phone: "", wilaya: "", planId: 1 });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return localizeNode((
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>إضافة مشترك جديد</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="اسم الشركة" value={form.name} onChange={set("name")} size="small" fullWidth required />
          <TextField label="البريد الإلكتروني للمدير" value={form.email} onChange={set("email")} size="small" fullWidth required type="email" />
          <TextField label="رقم الهاتف" value={form.phone} onChange={set("phone")} size="small" fullWidth />
          <TextField label="الولاية" value={form.wilaya} onChange={set("wilaya")} size="small" fullWidth />
          <FormControl size="small" fullWidth>
            <Select value={form.planId} onChange={set("planId")} displayEmpty>
              {mockPlans.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
                    {p.nameAr} — {p.priceMonthly ? `${fmt(p.priceMonthly)} دج/شهر` : "مجاني"}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ background: "#e3f8fd", border: "1px solid #b2ebf9", borderRadius: 2, p: 1.5, fontSize: 12, color: "#344767" }}>
            <Box sx={{ fontWeight: 600, mb: 0.5 }}>سيتم تلقائياً:</Box>
            <Box>• إنشاء مخطط قاعدة البيانات المنفصل (schema)</Box>
            <Box>• توليد شجرة الحسابات المحاسبية الجزائرية</Box>
            <Box>• إنشاء حساب المدير الأول وإرسال بريد الترحيب</Box>
            <Box>• تفعيل فترة تجريبية 30 يوم</Box>
          </Box>
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
          إنشاء المشترك
        </Box>
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Tenant Detail Dialog ─────────────────────────────────────────────────────
function TenantDetailDialog({ tenant, onClose }) {
  const { t } = useI18n();
  if (!tenant) return null;
  const plan = mockPlans.find((p) => p.id === tenant.planId);
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
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", background: plan?.color }} />
            <Box sx={{ fontSize: 13, fontWeight: 600, color: plan?.color }}>{plan?.nameAr}</Box>
            {plan?.priceMonthly ? (
              <Box sx={{ fontSize: 12, color: "#8392ab" }}>— {fmt(plan.priceMonthly)} دج/شهر</Box>
            ) : (
              <Box sx={{ fontSize: 12, color: "#8392ab" }}>— مجاني</Box>
            )}
          </Box>

          <Divider />

          {/* Info grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {[
              { label: "البريد الإلكتروني", value: tenant.contactEmail },
              { label: "الهاتف", value: tenant.contactPhone },
              { label: "الولاية", value: tenant.wilaya },
              { label: "مخطط قاعدة البيانات", value: tenant.schemaName },
              { label: "تاريخ الإنشاء", value: tenant.createdAt },
              { label: "آخر نشاط", value: tenant.lastActivityAt },
              { label: "بداية الاشتراك", value: tenant.subscriptionStartedAt ?? "—" },
              { label: "تجديد الاشتراك", value: tenant.subscriptionRenewsAt ?? "—" },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Box sx={{ fontSize: 10, color: "#8392ab", mb: 0.2 }}>{label}</Box>
                <Box sx={{ fontSize: 12, fontWeight: 500, color: "#344767" }}>{value}</Box>
              </Box>
            ))}
          </Box>

          <Divider />

          {/* Usage */}
          <Box>
            <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1 }}>الاستخدام</Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
              <Box sx={{ fontSize: 12, color: "#344767" }}>المستخدمون</Box>
              <Box sx={{ fontSize: 12, color: "#8392ab" }}>
                {tenant.usersCount} / {tenant.maxUsers ?? "∞"}
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={userPct}
              sx={{ height: 6, borderRadius: 3, background: "#f0f2f5", "& .MuiLinearProgress-bar": { background: userPct > 85 ? "#ea0606" : "#17c1e8", borderRadius: 3 } }}
            />
            <Box sx={{ display: "flex", gap: 3, mt: 1.5 }}>
              <Box>
                <Box sx={{ fontSize: 10, color: "#8392ab" }}>طلبيات هذا الشهر</Box>
                <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767" }}>{fmt(tenant.ordersThisMonth)}</Box>
              </Box>
              <Box>
                <Box sx={{ fontSize: 10, color: "#8392ab" }}>إجمالي الطلبيات</Box>
                <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767" }}>{fmt(tenant.totalOrders)}</Box>
              </Box>
              <Box>
                <Box sx={{ fontSize: 10, color: "#8392ab" }}>مساحة التخزين</Box>
                <Box sx={{ fontSize: 14, fontWeight: 700, color: "#344767" }}>{tenant.storageUsedMB} MB</Box>
              </Box>
            </Box>
          </Box>

          {tenant.suspendedReason && (
            <Box sx={{ background: "#ffeaea", border: "1px solid #ea060644", borderRadius: 2, p: 1.5, fontSize: 12, color: "#ea0606" }}>
              سبب الإيقاف: {tenant.suspendedReason}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {tenant.status === "active" && (
          <Box
            component="button"
            sx={{ background: "#ffeaea", border: "1px solid #ea060644", color: "#ea0606", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <PauseCircleIcon sx={{ fontSize: 15 }} /> إيقاف الاشتراك
          </Box>
        )}
        {tenant.status === "suspended" && (
          <Box
            component="button"
            sx={{ background: "#f0fde4", border: "1px solid #82d61644", color: "#82d616", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <PlayCircleIcon sx={{ fontSize: 15 }} /> استئناف الاشتراك
          </Box>
        )}
        <Box
          component="button"
          onClick={onClose}
          sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab", marginLeft: "auto" }}
        >
          إغلاق
        </Box>
      </DialogActions>
    </Dialog>
  ), t);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerTenants() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [newOpen, setNewOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const filtered = mockTenants.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (planFilter !== "all" && t.planId !== Number(planFilter)) return false;
    if (search && !t.name.includes(search) && !t.contactEmail.includes(search) && !t.wilaya.includes(search)) return false;
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
              {mockPlans.map((p) => <MenuItem key={p.id} value={p.id}>{p.nameAr}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ fontSize: 12, color: "#8392ab", alignSelf: "center", ml: 1 }}>
            {filtered.length} مشترك
          </Box>
        </Box>

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
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا توجد نتائج</TableCell></TableRow>
                ) : filtered.map((t) => {
                  const plan = mockPlans.find((p) => p.id === t.planId);
                  const sc = statusConfig[t.status];
                  return (
                    <TableRow key={t.id} sx={{ "&:hover": { background: "#f8f9fa" }, cursor: "pointer" }} onClick={() => setDetail(t)}>
                      <TableCell>
                        <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>{t.name}</Box>
                        <Box sx={{ fontSize: 10, color: "#adb5bd" }}>{t.schemaName}</Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#8392ab" }}>{t.wilaya}</TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{t.contactEmail}</TableCell>
                      <TableCell>
                        <Chip
                          label={plan?.nameAr}
                          size="small"
                          sx={{ fontSize: 10, fontWeight: 600, color: plan?.color, background: `${plan?.color}18`, border: `1px solid ${plan?.color}44` }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={sc?.labelAr} size="small" sx={{ background: sc?.bg, color: sc?.color, fontWeight: 600, fontSize: 10 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "#344767" }}>
                        {t.usersCount} / {t.maxUsers ?? "∞"}
                      </TableCell>
                      <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 12, color: "#344767" }}>
                        {fmt(t.ordersThisMonth)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 11, color: "#8392ab", whiteSpace: "nowrap" }}>{t.lastActivityAt}</TableCell>
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

        <NewTenantDialog open={newOpen} onClose={() => setNewOpen(false)} />
        <TenantDetailDialog tenant={detail} onClose={() => setDetail(null)} />
      </Box>
    </OwnerLayout>
  );
}
