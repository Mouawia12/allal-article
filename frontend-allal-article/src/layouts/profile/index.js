/* eslint-disable react/prop-types */
import { useState } from "react";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import BadgeIcon from "@mui/icons-material/Badge";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DiscountIcon from "@mui/icons-material/Discount";
import VisibilityIcon2 from "@mui/icons-material/Visibility";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  currentUser,
  getUserPermissions,
  permissionsByModule,
  roleConfig,
} from "data/mock/usersMock";

// ─── helpers ─────────────────────────────────────────────────────────────────
const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <SoftBox display="flex" alignItems="flex-start" gap={1.5} mb={2}>
      <SoftBox
        sx={{ width: 34, height: 34, borderRadius: 2, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <Icon fontSize="small" sx={{ color: "#64748b" }} />
      </SoftBox>
      <SoftBox>
        <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block">
          {label}
        </SoftTypography>
        <SoftTypography variant="button" color="text" fontWeight="medium">
          {value || "—"}
        </SoftTypography>
      </SoftBox>
    </SoftBox>
  );
}

// ─── My Permissions panel ─────────────────────────────────────────────────────
function MyPermissions({ user }) {
  const perms = getUserPermissions(user);
  const totalPerms = perms.size;
  const totalAll = Object.values(permissionsByModule).reduce((s, arr) => s + arr.length, 0);
  const pct = Math.round((totalPerms / totalAll) * 100);
  const rc = roleConfig[user.role] || roleConfig.viewer;

  return (
    <SoftBox>
      {/* Summary */}
      <SoftBox
        p={2} mb={2.5}
        sx={{ background: `${rc.color}0e`, borderRadius: 2, border: `1px solid ${rc.color}30` }}
      >
        <SoftBox display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <SoftBox sx={{ width: 42, height: 42, borderRadius: 2.5, background: rc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SecurityIcon sx={{ color: rc.color, fontSize: 20 }} />
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">{rc.label}</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {totalPerms} صلاحية ممنوحة من أصل {totalAll}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6, borderRadius: 3, bgcolor: "#e2e8f0",
            "& .MuiLinearProgress-bar": { background: rc.color },
          }}
        />
      </SoftBox>

      {/* By module */}
      <Grid container spacing={1.5}>
        {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
          const granted = modulePerms.filter((p) => perms.has(p.code));
          if (granted.length === 0) return null;
          return (
            <Grid item xs={12} sm={6} key={moduleName}>
              <SoftBox sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
                <SoftBox
                  display="flex" alignItems="center" justifyContent="space-between"
                  px={1.5} py={1} sx={{ background: "#f8fafc" }}
                >
                  <SoftTypography variant="caption" fontWeight="bold" color="secondary">
                    {moduleName}
                  </SoftTypography>
                  <Chip
                    label={`${granted.length}/${modulePerms.length}`}
                    size="small"
                    sx={{ height: 18, fontSize: 9, fontWeight: 700, background: rc.bg, color: rc.color }}
                  />
                </SoftBox>
                <SoftBox px={1.5} py={0.8} display="flex" flexDirection="column" gap={0.4}>
                  {granted.map((p) => (
                    <SoftBox key={p.code} display="flex" alignItems="center" gap={0.8}>
                      <CheckCircleIcon sx={{ fontSize: 13, color: "#82d616", flexShrink: 0 }} />
                      <SoftTypography variant="caption" color="text">{p.label}</SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              </SoftBox>
            </Grid>
          );
        })}
      </Grid>
    </SoftBox>
  );
}

// ─── Edit Profile tab ─────────────────────────────────────────────────────────
function EditProfile({ user }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    lang: user.lang,
  });
  const [showPass, setShowPass] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SoftBox>
      {/* Personal info */}
      <SoftTypography variant="caption" fontWeight="bold" color="secondary">البيانات الشخصية</SoftTypography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="الاسم الكامل"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="رقم الهاتف"
            value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="البريد الإلكتروني"
            value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" fullWidth>
            <InputLabel>لغة الواجهة</InputLabel>
            <Select value={form.lang} label="لغة الواجهة"
              onChange={(e) => setForm((f) => ({ ...f, lang: e.target.value }))}>
              <MenuItem value="ar">العربية</MenuItem>
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Password */}
      <SoftTypography variant="caption" fontWeight="bold" color="secondary">تغيير كلمة المرور</SoftTypography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="كلمة المرور الحالية"
            type={showPass ? "text" : "password"} value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
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
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="كلمة المرور الجديدة"
            type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth size="small" label="تأكيد كلمة المرور"
            type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
            error={confirmPass && confirmPass !== newPass}
            helperText={confirmPass && confirmPass !== newPass ? "كلمتا المرور غير متطابقتان" : ""} />
        </Grid>
      </Grid>

      <SoftBox display="flex" justifyContent="flex-end" gap={1}>
        {saved && (
          <SoftBox display="flex" alignItems="center" gap={0.5}>
            <CheckCircleIcon sx={{ color: "#82d616", fontSize: 18 }} />
            <SoftTypography variant="caption" sx={{ color: "#82d616" }}>تم الحفظ</SoftTypography>
          </SoftBox>
        )}
        <SoftButton variant="gradient" color="info" size="small" onClick={handleSave}>
          حفظ التعديلات
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Profile() {
  const user = currentUser;
  const [tab, setTab] = useState(0);
  const rc = roleConfig[user.role] || roleConfig.viewer;
  const colorIdx = user.id % avatarColors.length;
  const perms = getUserPermissions(user);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Profile hero card ── */}
        <Card sx={{ mb: 3, overflow: "visible" }}>
          {/* Banner */}
          <SoftBox sx={{
            height: 120, borderRadius: "12px 12px 0 0",
            background: `linear-gradient(135deg, ${rc.color} 0%, ${rc.color}99 100%)`,
          }} />

          <SoftBox px={3} pb={2.5}>
            <SoftBox display="flex" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap={2}
              sx={{ mt: -5 }}>
              {/* Avatar */}
              <SoftBox display="flex" alignItems="flex-end" gap={2}>
                <Avatar sx={{
                  bgcolor: avatarColors[colorIdx], width: 80, height: 80,
                  fontSize: 28, fontWeight: 800, border: "4px solid #fff",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", borderRadius: 3,
                }}>
                  {getInitials(user.name)}
                </Avatar>
                <SoftBox pb={0.5}>
                  <SoftTypography variant="h5" fontWeight="bold">{user.name}</SoftTypography>
                  <SoftBox display="flex" gap={0.7} alignItems="center" mt={0.3}>
                    <Chip label={rc.label} size="small"
                      sx={{ height: 20, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }} />
                    <SoftTypography variant="caption" color="secondary">{user.email}</SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>

              <SoftBox display="flex" gap={1} pb={0.5}>
                <SoftButton variant="outlined" color="secondary" size="small" startIcon={<EditIcon />}
                  onClick={() => setTab(1)}>
                  تعديل الملف
                </SoftButton>
              </SoftBox>
            </SoftBox>
          </SoftBox>
        </Card>

        <Grid container spacing={3}>
          {/* ── Left col: info ── */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5, mb: 2 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>معلومات الحساب</SoftTypography>
              <InfoRow icon={PersonIcon} label="الاسم الكامل" value={user.name} />
              <InfoRow icon={EmailIcon} label="البريد الإلكتروني" value={user.email} />
              <InfoRow icon={PhoneIcon} label="رقم الهاتف" value={user.phone} />
              <InfoRow icon={BadgeIcon} label="الدور" value={rc.label} />
              {user.assignedWilaya && (
                <InfoRow icon={LocationOnIcon} label="الولاية المُسندة" value={user.assignedWilaya} />
              )}
              {user.role === "salesperson" && (
                <InfoRow icon={DiscountIcon} label="الحد الأقصى للخصم" value={`${user.maxDiscountPct}%`} />
              )}
              {user.role === "salesperson" && (
                <InfoRow icon={VisibilityIcon2} label="يرى كل الطلبيات" value={user.canViewAllOrders ? "نعم" : "طلبياته فقط"} />
              )}
            </Card>

            {/* Activity stats */}
            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>إحصاءات النشاط</SoftTypography>
              {[
                { label: "آخر دخول",      value: user.lastLogin },
                { label: "الطلبيات المنشأة", value: user.ordersCount },
                { label: "الصلاحيات الممنوحة", value: perms.size },
              ].map((s) => (
                <SoftBox key={s.label} display="flex" justifyContent="space-between" mb={1.5}>
                  <SoftTypography variant="caption" color="secondary">{s.label}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold" color="text">{s.value}</SoftTypography>
                </SoftBox>
              ))}
              {user.notes && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <SoftBox sx={{ p: 1.5, background: "#fffbeb", borderRadius: 2, border: "1px solid #fbbf2433" }}>
                    <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={0.3}>
                      ملاحظات
                    </SoftTypography>
                    <SoftTypography variant="caption" color="text">{user.notes}</SoftTypography>
                  </SoftBox>
                </>
              )}
            </Card>
          </Grid>

          {/* ── Right col: tabs ── */}
          <Grid item xs={12} lg={8}>
            <Card>
              <SoftBox px={2} pt={2} borderBottom="1px solid #e9ecef">
                <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                  TabIndicatorProps={{ style: { background: rc.color } }}>
                  <Tab label={
                    <SoftBox display="flex" alignItems="center" gap={0.5}>
                      <SecurityIcon fontSize="small" />
                      <SoftTypography variant="caption" fontWeight="medium">صلاحياتي</SoftTypography>
                    </SoftBox>
                  } />
                  <Tab label={
                    <SoftBox display="flex" alignItems="center" gap={0.5}>
                      <PersonIcon fontSize="small" />
                      <SoftTypography variant="caption" fontWeight="medium">تعديل الملف</SoftTypography>
                    </SoftBox>
                  } />
                </Tabs>
              </SoftBox>
              <SoftBox p={2.5}>
                {tab === 0 && <MyPermissions user={user} />}
                {tab === 1 && <EditProfile user={user} />}
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Profile;
