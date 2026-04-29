/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";
import {
  allPermissions,
  getUserPermissions,
  permissionsByModule,
  roleConfig,
  roleDefaultPermissions,
} from "data/config/permissionsConfig";
import { usersApi } from "services";

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

// ─── Permissions Dialog ───────────────────────────────────────────────────────
function PermissionsDialog({ user, onClose, onSave }) {
  const effectivePerms = getUserPermissions(user);
  const [perms, setPerms] = useState(new Set(effectivePerms));
  const isOwner = user?.role === "owner";

  const toggle = (code) => {
    if (isOwner) return;
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const toggleModule = (moduleName) => {
    if (isOwner) return;
    const moduleCodes = (permissionsByModule[moduleName] || []).map((p) => p.code);
    const allActive = moduleCodes.every((c) => perms.has(c));
    setPerms((prev) => {
      const next = new Set(prev);
      if (allActive) moduleCodes.forEach((c) => next.delete(c));
      else moduleCodes.forEach((c) => next.add(c));
      return next;
    });
  };

  const resetToRole = () => {
    setPerms(new Set(roleDefaultPermissions[user?.role] || []));
  };

  if (!user) return null;
  const rc = roleConfig[user.role] || roleConfig.viewer;

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: avatarColors[user.id % avatarColors.length], width: 36, height: 36, fontSize: 13 }}>
              {user.name[0]}
            </Avatar>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">صلاحيات: {user.name}</SoftTypography>
              <SoftBox display="flex" gap={0.7} alignItems="center">
                <Chip label={rc.label} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }} />
                <SoftTypography variant="caption" color="secondary">{perms.size} صلاحية ممنوحة</SoftTypography>
              </SoftBox>
            </SoftBox>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            {!isOwner && (
              <Tooltip title="إعادة تعيين لصلاحيات الدور الافتراضية">
                <SoftButton variant="outlined" color="secondary" size="small" onClick={resetToRole}>
                  إعادة تعيين
                </SoftButton>
              </Tooltip>
            )}
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </SoftBox>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        {isOwner && (
          <SoftBox p={1.5} mb={2} sx={{ background: "#f5ecff", borderRadius: 2, border: "1px solid #7928ca22" }}>
            <SoftTypography variant="caption" color="secondary">
              المالك يملك جميع الصلاحيات دائماً ولا يمكن تغييرها.
            </SoftTypography>
          </SoftBox>
        )}
        <Grid container spacing={2}>
          {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
            const allActive = modulePerms.every((p) => perms.has(p.code));
            const someActive = modulePerms.some((p) => perms.has(p.code));
            return (
              <Grid item xs={12} sm={6} key={moduleName}>
                <SoftBox sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
                  {/* Module header */}
                  <SoftBox
                    display="flex" alignItems="center" justifyContent="space-between"
                    px={1.5} py={1} sx={{ background: allActive ? "#f0faff" : "#f8f9fa", cursor: isOwner ? "default" : "pointer" }}
                    onClick={() => toggleModule(moduleName)}
                  >
                    <SoftTypography variant="caption" fontWeight="bold" color={allActive ? "info" : "secondary"}>
                      {moduleName}
                    </SoftTypography>
                    <Checkbox
                      size="small"
                      checked={allActive}
                      indeterminate={!allActive && someActive}
                      disabled={isOwner}
                      sx={{ p: 0, color: "#17c1e8", "&.Mui-checked": { color: "#17c1e8" }, "&.MuiCheckbox-indeterminate": { color: "#17c1e8" } }}
                    />
                  </SoftBox>
                  {/* Permissions */}
                  <SoftBox px={1.5} py={0.5}>
                    {modulePerms.map((p) => (
                      <FormControlLabel
                        key={p.code}
                        control={
                          <Checkbox
                            size="small"
                            checked={perms.has(p.code)}
                            onChange={() => toggle(p.code)}
                            disabled={isOwner}
                            sx={{ "&.Mui-checked": { color: "#17c1e8" } }}
                          />
                        }
                        label={
                          <SoftBox>
                            <SoftTypography variant="caption" color="text">{p.label}</SoftTypography>
                            {p.description && (
                              <SoftTypography variant="caption" color="secondary" display="block" sx={{ fontSize: "10px" }}>
                                {p.description}
                              </SoftTypography>
                            )}
                          </SoftBox>
                        }
                        sx={{ display: "flex", mb: 0.3, mr: 0 }}
                      />
                    ))}
                  </SoftBox>
                </SoftBox>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={() => { onSave && onSave(user, perms); onClose(); }}>
          حفظ الصلاحيات
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── User Form Dialog ─────────────────────────────────────────────────────────
function UserFormDialog({ open, user, onClose, onSave }) {
  const isEdit = Boolean(user);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState(() => user ? { ...user } : {
    name: "", email: "", phone: "", role: "salesperson", status: "active",
    assignedWilaya: "", maxDiscountPct: 0, canViewAllOrders: false, lang: "ar", notes: "",
    password: "",
  });

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    onSave && onSave({ ...form, id: user?.id || Date.now(), lastLogin: user?.lastLogin || "—", ordersCount: user?.ordersCount || 0, customPermissions: user?.customPermissions || [] });
    onClose();
  };

  const rc = roleConfig[form.role] || roleConfig.salesperson;
  const isSalesperson = form.role === "salesperson";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">{isEdit ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {isEdit ? `تعديل بيانات ${user.name}` : "ملء البيانات الأساسية ثم حفظ الصلاحيات"}
            </SoftTypography>
          </SoftBox>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          {/* ── الهوية ── */}
          <Grid item xs={12}>
            <SoftTypography variant="caption" fontWeight="bold" color="secondary">الهوية</SoftTypography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="الاسم الكامل *" value={form.name}
              onChange={(e) => set("name", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="البريد الإلكتروني *" value={form.email}
              onChange={(e) => set("email", e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="رقم الهاتف" value={form.phone}
              onChange={(e) => set("phone", e.target.value)} />
          </Grid>

          {/* ── الدور والحالة ── */}
          <Grid item xs={12}>
            <SoftTypography variant="caption" fontWeight="bold" color="secondary">الدور والصلاحيات</SoftTypography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>الدور *</InputLabel>
              <Select value={form.role} label="الدور *" onChange={(e) => set("role", e.target.value)}>
                {Object.entries(roleConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <Chip label={cfg.label} size="small" sx={{ height: 18, fontSize: 10, background: cfg.bg, color: cfg.color }} />
                    </SoftBox>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select value={form.status} label="الحالة" onChange={(e) => set("status", e.target.value)}>
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="inactive">معطل</MenuItem>
                <MenuItem value="suspended">موقوف</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* ── إعدادات خاصة بالبائع ── */}
          {isSalesperson && (
            <>
              <Grid item xs={12}>
                <SoftTypography variant="caption" fontWeight="bold" color="secondary">إعدادات البائع</SoftTypography>
                <Divider sx={{ mt: 0.5, mb: 1.5 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>الولاية المُسندة</InputLabel>
                  <Select value={form.assignedWilaya} label="الولاية المُسندة"
                    onChange={(e) => set("assignedWilaya", e.target.value)}>
                    <MenuItem value="">— كل الولايات —</MenuItem>
                    {WILAYAS.map((w) => (
                      <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SoftBox>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">
                    الحد الأقصى للخصم: {form.maxDiscountPct}%
                  </SoftTypography>
                  <Slider
                    value={form.maxDiscountPct}
                    onChange={(_, v) => set("maxDiscountPct", v)}
                    min={0} max={30} step={1}
                    marks={[{ value: 0, label: "0%" }, { value: 15, label: "15%" }, { value: 30, label: "30%" }]}
                    sx={{ color: rc.color, mt: 1 }}
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch checked={form.canViewAllOrders}
                      onChange={(e) => set("canViewAllOrders", e.target.checked)} color="info" />
                  }
                  label={
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="medium">يرى كل الطلبيات</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        افتراضياً يرى فقط طلبياته الشخصية
                      </SoftTypography>
                    </SoftBox>
                  }
                />
              </Grid>
            </>
          )}

          {/* ── التفضيلات ── */}
          <Grid item xs={12}>
            <SoftTypography variant="caption" fontWeight="bold" color="secondary">التفضيلات والأمان</SoftTypography>
            <Divider sx={{ mt: 0.5, mb: 1.5 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel>لغة الواجهة</InputLabel>
              <Select value={form.lang} label="لغة الواجهة" onChange={(e) => set("lang", e.target.value)}>
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth size="small"
              label={isEdit ? "كلمة مرور جديدة (اتركها فارغة إن لم تريد التغيير)" : "كلمة المرور *"}
              type={showPass ? "text" : "password"}
              value={form.password || ""}
              onChange={(e) => set("password", e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" sx={{ color: "#94a3b8" }} /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="ملاحظات داخلية" multiline rows={2}
              value={form.notes} onChange={(e) => set("notes", e.target.value)}
              placeholder="ملاحظات خاصة بهذا المستخدم (لا تظهر للمستخدم)" />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          disabled={!form.name.trim() || !form.email.trim()}
          onClick={handleSave}>
          {isEdit ? "حفظ التعديلات" : "إضافة المستخدم"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [formDialog, setFormDialog] = useState(null);
  const [permDialog, setPermDialog] = useState(null);

  const normalizeUser = (u) => ({
    ...u,
    role: u.roleCode || u.role || "viewer",
    assignedWilaya: u.assignedWilaya || "",
    maxDiscountPct: u.maxDiscountPct || 0,
    canViewAllOrders: u.canViewAllOrders || false,
    lang: u.lang || "ar",
    lastLogin: u.lastLogin || "—",
    ordersCount: u.ordersCount || 0,
    customPermissions: [],
    notes: u.notes || "",
    password: "",
  });

  const loadUsers = useCallback(() => {
    usersApi.list()
      .then((r) => {
        const raw = r.data?.data;
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
        setUsers(list.map(normalizeUser));
      })
      .catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadUsers();
    usersApi.listRoles().then((r) => setRoles(r.data?.data ?? [])).catch(console.error);
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const matchSearch = u.name?.includes(search) || u.email?.includes(search) || (roleConfig[u.role]?.label || "").includes(search);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const upsertUser = async (u) => {
    try {
      const roleObj = roles.find((r) => r.code === u.role);
      const req = { name: u.name, email: u.email, phone: u.phone || "", roleId: roleObj?.id, userType: u.userType || "staff" };
      if (u.password) req.password = u.password;
      if (u.id && u.id < 1e13) {
        await usersApi.update(u.id, req);
      } else {
        await usersApi.create(req);
      }
      loadUsers();
    } catch (e) { console.error(e); }
  };

  const toggleStatus = async (userId) => {
    try {
      const updated = await usersApi.toggleStatus(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: updated.status } : u));
    } catch (e) { console.error(e); }
  };

  const savePermissions = (user, perms) => {
    const roleBase = new Set(roleDefaultPermissions[user.role] || []);
    const custom = [...perms].filter((c) => !roleBase.has(c));
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, customPermissions: custom } : u));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">المستخدمون</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة حسابات المستخدمين، الأدوار، والصلاحيات الدقيقة</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setFormDialog(true)}>
            إضافة مستخدم
          </SoftButton>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {Object.entries(roleConfig).map(([role, cfg]) => (
            <Grid item xs={6} sm={4} md={2} key={role}>
              <Card
                sx={{ p: 2, textAlign: "center", cursor: "pointer", border: roleFilter === role ? `2px solid ${cfg.color}` : "1px solid #e9ecef", transition: "all 0.15s" }}
                onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
              >
                <SoftTypography variant="h4" fontWeight="bold" sx={{ color: cfg.color }}>
                  {users.filter((u) => u.role === role).length}
                </SoftTypography>
                <SoftTypography variant="caption" color="text">{cfg.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <SoftBox p={2}>
            {/* Search + filter */}
            <SoftBox display="flex" gap={1.5} mb={2} flexWrap="wrap">
              <TextField
                size="small" placeholder="بحث بالاسم أو البريد..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{ width: 260 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} displayEmpty>
                  <MenuItem value="all">كل الأدوار</MenuItem>
                  {Object.entries(roleConfig).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <SoftTypography variant="caption" color="secondary" sx={{ alignSelf: "center" }}>
                {filtered.length} مستخدم
              </SoftTypography>
            </SoftBox>

            <SoftBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["المستخدم", "الدور", "الولاية", "خصم أقصى", "الحالة", "آخر دخول", "الطلبيات", "إجراءات"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => {
                    const rc = roleConfig[user.role] || { label: user.role, color: "#8392ab", bg: "#f1f5f9" };
                    const colorIdx = user.id % avatarColors.length;
                    const effectivePerms = getUserPermissions(user);
                    const hasCustom = (user.customPermissions || []).length > 0;
                    return (
                      <tr key={user.id} style={{
                        borderBottom: "1px solid #f0f2f5",
                        background: i % 2 === 0 ? "#fff" : "#fafbfc",
                        opacity: user.status === "inactive" ? 0.55 : 1,
                      }}>
                        <td style={{ padding: "10px 14px" }}>
                          <SoftBox display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 36, height: 36, fontSize: 13, fontWeight: 700 }}>
                              {user.name[0]}
                            </Avatar>
                            <SoftBox>
                              <SoftBox display="flex" alignItems="center" gap={0.5}>
                                <SoftTypography variant="button" fontWeight="medium">{user.name}</SoftTypography>
                                {hasCustom && (
                                  <Tooltip title={`${effectivePerms.size} صلاحية (مخصصة)`}>
                                    <Chip label="مخصص" size="small" sx={{ height: 16, fontSize: 9, background: "#fff3e0", color: "#fb8c00" }} />
                                  </Tooltip>
                                )}
                              </SoftBox>
                              <SoftTypography variant="caption" color="secondary" display="block">{user.email}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary" display="block">{user.phone}</SoftTypography>
                            </SoftBox>
                          </SoftBox>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <Chip label={rc.label} size="small"
                            sx={{ height: 22, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SoftTypography variant="caption" color="text">{user.assignedWilaya || "—"}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <SoftTypography variant="caption" fontWeight="bold" sx={{ color: user.maxDiscountPct > 0 ? "#fb8c00" : "#8392ab" }}>
                            {user.maxDiscountPct}%
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SoftBadge
                            variant="gradient"
                            color={user.status === "active" ? "success" : "secondary"}
                            size="xs"
                            badgeContent={user.status === "active" ? "نشط" : "معطل"}
                            container
                          />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SoftTypography variant="caption" color="text">{user.lastLogin}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{user.ordersCount}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <SoftBox display="flex" gap={0.5}>
                            <Tooltip title="تعديل البيانات">
                              <IconButton size="small" onClick={() => setFormDialog(user)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={`الصلاحيات (${effectivePerms.size})`}>
                              <IconButton size="small" color="primary" onClick={() => setPermDialog(user)}>
                                <SecurityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === "active" ? "تعطيل الحساب" : "تفعيل الحساب"}>
                              <IconButton size="small"
                                color={user.status === "active" ? "error" : "success"}
                                onClick={() => toggleStatus(user.id)}>
                                {user.status === "active" ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </SoftBox>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>

      <UserFormDialog
        open={!!formDialog}
        user={typeof formDialog === "object" ? formDialog : null}
        onClose={() => setFormDialog(null)}
        onSave={(u) => { upsertUser(u); setFormDialog(null); }}
      />
      <PermissionsDialog
        user={permDialog}
        onClose={() => setPermDialog(null)}
        onSave={savePermissions}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default Users;
