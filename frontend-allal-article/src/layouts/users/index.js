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
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import CloseIcon from "@mui/icons-material/Close";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockUsers = [
  {
    id: 1, name: "أحمد محمد",    email: "ahmed@company.com",  role: "salesperson", status: "active",
    lastLogin: "2024-01-22 15:30", ordersCount: 8, phone: "0555-111111",
  },
  {
    id: 2, name: "خالد عمر",     email: "khaled@company.com", role: "salesperson", status: "active",
    lastLogin: "2024-01-22 14:00", ordersCount: 10, phone: "0561-222222",
  },
  {
    id: 3, name: "محمد سعيد",    email: "msaeed@company.com", role: "salesperson", status: "active",
    lastLogin: "2024-01-22 09:15", ordersCount: 18, phone: "0536-333333",
  },
  {
    id: 4, name: "يوسف علي",     email: "yousef@company.com", role: "salesperson", status: "active",
    lastLogin: "2024-01-21 16:45", ordersCount: 11, phone: "0502-444444",
  },
  {
    id: 5, name: "سارة الإدارة", email: "sara@company.com",   role: "admin",       status: "active",
    lastLogin: "2024-01-22 16:00", ordersCount: 0, phone: "0518-555555",
  },
  {
    id: 6, name: "المالك",       email: "owner@company.com",  role: "owner",       status: "active",
    lastLogin: "2024-01-22 08:00", ordersCount: 0, phone: "0544-000000",
  },
  {
    id: 7, name: "مستخدم معطل", email: "old@company.com",    role: "salesperson", status: "inactive",
    lastLogin: "2023-12-01 10:00", ordersCount: 3, phone: "0557-666666",
  },
];

const roleConfig = {
  owner:       { label: "مالك",          color: "#7928ca" },
  admin:       { label: "إدارة",         color: "#17c1e8" },
  salesperson: { label: "بائع",          color: "#82d616" },
  viewer:      { label: "مشاهدة فقط",   color: "#8392ab" },
};

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

const allPermissions = [
  { key: "view_orders",    label: "عرض الطلبيات",           group: "الطلبيات" },
  { key: "create_order",   label: "إنشاء طلبية",            group: "الطلبيات" },
  { key: "edit_order",     label: "تعديل الطلبية",          group: "الطلبيات" },
  { key: "confirm_order",  label: "تأكيد الطلبية",          group: "الطلبيات" },
  { key: "reject_order",   label: "رفض الطلبية",            group: "الطلبيات" },
  { key: "view_all_orders",label: "عرض كل الطلبيات",        group: "الطلبيات" },
  { key: "view_products",  label: "عرض الأصناف",            group: "الأصناف" },
  { key: "create_product", label: "إضافة صنف",              group: "الأصناف" },
  { key: "edit_product",   label: "تعديل صنف",              group: "الأصناف" },
  { key: "view_stock",     label: "عرض المخزون",            group: "المخزون" },
  { key: "edit_stock",     label: "تعديل المخزون",          group: "المخزون" },
  { key: "view_customers", label: "عرض الزبائن",            group: "الزبائن" },
  { key: "manage_customers",label: "إدارة الزبائن",         group: "الزبائن" },
  { key: "view_reports",   label: "عرض التقارير",           group: "التقارير" },
  { key: "view_logs",      label: "عرض السجلات",            group: "السجلات" },
  { key: "manage_users",   label: "إدارة المستخدمين",       group: "النظام" },
  { key: "manage_settings",label: "إدارة إعدادات النظام",  group: "النظام" },
  { key: "manage_ai",      label: "إدارة إعدادات AI",       group: "النظام" },
];

const groupedPermissions = allPermissions.reduce((acc, p) => {
  if (!acc[p.group]) acc[p.group] = [];
  acc[p.group].push(p);
  return acc;
}, {});

// ─── Permissions Dialog ───────────────────────────────────────────────────────
function PermissionsDialog({ user, onClose }) {
  const defaultPerms = {
    owner:       allPermissions.map(p => p.key),
    admin:       ["view_orders","create_order","edit_order","confirm_order","reject_order","view_all_orders","view_products","view_stock","view_customers","manage_customers","view_reports","view_logs"],
    salesperson: ["view_orders","create_order","view_products","view_customers"],
    viewer:      ["view_orders","view_products","view_customers","view_reports"],
  };

  const [perms, setPerms] = useState(new Set(defaultPerms[user?.role] || []));

  const toggle = (key) => {
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox display="flex" alignItems="center" gap={1}>
            <SecurityIcon />
            <SoftTypography variant="h6" fontWeight="bold">
              صلاحيات: {user.name}
            </SoftTypography>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {Object.entries(groupedPermissions).map(([group, groupPerms]) => (
            <Grid item xs={12} sm={6} key={group}>
              <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={1} display="block">
                {group}
              </SoftTypography>
              {groupPerms.map((p) => (
                <FormControlLabel
                  key={p.key}
                  control={
                    <Checkbox
                      size="small"
                      checked={perms.has(p.key)}
                      onChange={() => toggle(p.key)}
                      disabled={user.role === "owner"}
                    />
                  }
                  label={<SoftTypography variant="caption" color="text">{p.label}</SoftTypography>}
                  sx={{ display: "flex", mb: 0.5 }}
                />
              ))}
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={onClose}>حفظ الصلاحيات</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add/Edit User Dialog ─────────────────────────────────────────────────────
function UserFormDialog({ open, user, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? "تعديل المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="الاسم الكامل *" size="small" defaultValue={user?.name || ""} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="البريد الإلكتروني *" size="small" defaultValue={user?.email || ""} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="رقم الهاتف" size="small" defaultValue={user?.phone || ""} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth select label="الدور *" size="small" defaultValue={user?.role || "salesperson"}>
              {Object.entries(roleConfig).map(([key, cfg]) => (
                <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {!user && (
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="كلمة المرور *" type="password" size="small" />
            </Grid>
          )}
          {user && (
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="كلمة مرور جديدة (اختياري)" type="password" size="small" />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={onClose}>
          {user ? "حفظ التعديلات" : "إضافة المستخدم"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Users() {
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState(null); // null | user | true(new)
  const [permDialog, setPermDialog] = useState(null);

  const filtered = mockUsers.filter(
    (u) =>
      u.name.includes(search) ||
      u.email.includes(search) ||
      roleConfig[u.role]?.label.includes(search)
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">المستخدمون</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة حسابات المستخدمين والصلاحيات</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setFormDialog(true)}>
            إضافة مستخدم
          </SoftButton>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {Object.entries(roleConfig).map(([role, cfg]) => (
            <Grid item xs={6} sm={3} key={role}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" sx={{ color: cfg.color }}>
                  {mockUsers.filter(u => u.role === role).length}
                </SoftTypography>
                <SoftTypography variant="caption" color="text">{cfg.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <SoftBox p={2}>
            <TextField
              size="small"
              placeholder="بحث بالاسم، البريد، أو الدور..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
              sx={{ width: 300, mb: 2 }}
            />

            <SoftBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["المستخدم", "الدور", "الحالة", "آخر دخول", "الطلبيات", "إجراءات"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "right" }}>
                        <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, i) => {
                    const rc = roleConfig[user.role] || { label: user.role, color: "#8392ab" };
                    const colorIdx = user.id % avatarColors.length;
                    return (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: "1px solid #f0f2f5",
                          background: i % 2 === 0 ? "#fff" : "#fafbfc",
                          opacity: user.status === "inactive" ? 0.6 : 1,
                        }}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <SoftBox display="flex" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 36, height: 36, fontSize: 13 }}>
                              {user.name[0]}
                            </Avatar>
                            <SoftBox>
                              <SoftTypography variant="button" fontWeight="medium">{user.name}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary" display="block">{user.email}</SoftTypography>
                            </SoftBox>
                          </SoftBox>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <Chip
                            label={rc.label}
                            size="small"
                            sx={{ height: 22, fontSize: 11, background: `${rc.color}22`, color: rc.color, fontWeight: "bold" }}
                          />
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
                            <Tooltip title="تعديل">
                              <IconButton size="small" onClick={() => setFormDialog(user)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="الصلاحيات">
                              <IconButton size="small" color="primary" onClick={() => setPermDialog(user)}>
                                <SecurityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === "active" ? "تعطيل" : "تفعيل"}>
                              <IconButton
                                size="small"
                                color={user.status === "active" ? "error" : "success"}
                              >
                                {user.status === "active"
                                  ? <BlockIcon fontSize="small" />
                                  : <CheckCircleIcon fontSize="small" />
                                }
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
      />
      <PermissionsDialog user={permDialog} onClose={() => setPermDialog(null)} />

      <Footer />
    </DashboardLayout>
  );
}

export default Users;
