/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import LockIcon from "@mui/icons-material/Lock";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
const severityConfig = {
  info:            { label: "معلومة",       color: "#17c1e8" },
  warning:         { label: "تنبيه",        color: "#fb8c00" },
  critical:        { label: "حرج",          color: "#ea0606" },
  action_required: { label: "يتطلب إجراء", color: "#7928ca" },
};
const categoryConfig = {
  products:  { label: "الأصناف" },
  inventory: { label: "المخزون" },
  orders:    { label: "الطلبيات" },
  payments:  { label: "المدفوعات" },
  accounting:{ label: "المحاسبة" },
};

const digestLabels = {
  instant: "فوري",
  hourly: "كل ساعة",
  daily: "يومي",
  muted: "مكتوم",
};

const severityOptions = ["info", "success", "warning", "critical", "action_required"];

function PreferenceRow({ item, value, onChange }) {
  const category = categoryConfig[item.category] || { label: item.category };
  const severity = severityConfig[item.severity] || severityConfig.info;

  return (
    <Card sx={{ p: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <SoftBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <SoftTypography variant="button" fontWeight="bold">
              {item.title}
            </SoftTypography>
            {!item.mutable && (
              <Chip
                icon={<LockIcon sx={{ fontSize: "14px !important" }} />}
                size="small"
                label="إجباري"
                sx={{ height: 22, fontSize: 10 }}
              />
            )}
          </SoftBox>
          <SoftTypography variant="caption" color="secondary" display="block">
            {item.code}
          </SoftTypography>
        </Grid>

        <Grid item xs={6} md={2}>
          <Chip size="small" label={category.label} sx={{ height: 24, fontSize: 11 }} />
        </Grid>

        <Grid item xs={6} md={2}>
          <Chip
            size="small"
            label={severity.label}
            sx={{ height: 24, fontSize: 11, color: severity.color, background: severity.bg }}
          />
        </Grid>

        <Grid item xs={12} sm={4} md={2}>
          <Select
            fullWidth
            size="small"
            value={value.digestMode}
            disabled={!item.mutable}
            onChange={(event) => onChange(item.code, { digestMode: event.target.value })}
          >
            {Object.entries(digestLabels).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid item xs={12} sm={4} md={1}>
          <Select
            fullWidth
            size="small"
            value={value.minimumSeverity}
            disabled={!item.mutable}
            onChange={(event) => onChange(item.code, { minimumSeverity: event.target.value })}
          >
            {severityOptions.map((key) => (
              <MenuItem key={key} value={key}>{severityConfig[key].label}</MenuItem>
            ))}
          </Select>
        </Grid>

        <Grid item xs={12} sm={4} md={1}>
          <Switch
            checked={value.enabled}
            disabled={!item.mutable}
            onChange={(event) => onChange(item.code, { enabled: event.target.checked })}
            color="info"
          />
        </Grid>
      </Grid>
    </Card>
  );
}

export default function NotificationPreferences() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h4" fontWeight="bold">تفضيلات الإشعارات</SoftTypography>
          <SoftTypography variant="body2" color="text">
            سيتم تحميل أنواع الإشعارات من الباكند قريباً
          </SoftTypography>
        </SoftBox>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <SoftTypography variant="body2" color="secondary">
            لا توجد إعدادات إشعارات بعد. ستُضاف عند توفر الـ API.
          </SoftTypography>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
