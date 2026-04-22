/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "components/AppIcon";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  categoryConfig,
  lifecycleConfig,
  mockTenantNotifications,
  severityConfig,
} from "data/mock/notificationsMock";

const filters = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروء" },
  { key: "critical", label: "حرجة" },
  { key: "action", label: "تحتاج إجراء" },
  { key: "snoozed", label: "مؤجلة" },
  { key: "escalated", label: "مصعدة" },
];

function StatTile({ label, value, color }) {
  return (
    <Card sx={{ p: 2, minHeight: 86 }}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold">
        {label}
      </SoftTypography>
      <SoftTypography variant="h4" color={color} fontWeight="bold">
        {value}
      </SoftTypography>
    </Card>
  );
}

function NotificationCard({ item, onOpen }) {
  const severity = severityConfig[item.severity] || severityConfig.info;
  const category = categoryConfig[item.category] || { label: item.category, icon: "notifications" };
  const lifecycle = lifecycleConfig[item.state] || lifecycleConfig.new;

  return (
    <Card
      sx={{
        p: 2,
        borderInlineStart: `4px solid ${severity.color}`,
        opacity: item.isRead ? 0.72 : 1,
      }}
    >
      <SoftBox display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
        <SoftBox display="flex" gap={1.5} alignItems="flex-start" flex={1} minWidth={260}>
          <SoftBox
            width="2.5rem"
            height="2.5rem"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ background: severity.bg, color: severity.color, flexShrink: 0 }}
          >
            <Icon fontSize="small">{category.icon}</Icon>
          </SoftBox>
          <SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
              <SoftTypography variant="button" fontWeight="bold">
                {item.title}
              </SoftTypography>
              {!item.isRead && <Chip size="small" label="جديد" sx={{ height: 20, fontSize: 10 }} />}
            </SoftBox>
            <SoftTypography variant="caption" color="text" display="block">
              {item.body}
            </SoftTypography>
            <SoftBox display="flex" gap={1} flexWrap="wrap" mt={1}>
              <Chip size="small" label={category.label} sx={{ height: 22, fontSize: 10 }} />
              <Chip
                size="small"
                label={severity.label}
                sx={{ height: 22, fontSize: 10, color: severity.color, background: severity.bg }}
              />
              <Chip
                size="small"
                label={lifecycle.label}
                sx={{ height: 22, fontSize: 10, color: lifecycle.color, background: lifecycle.bg }}
              />
              <Chip size="small" label={item.entityLabel} sx={{ height: 22, fontSize: 10 }} />
            </SoftBox>
            <SoftBox mt={1.5} p={1.25} sx={{ background: "#f8f9fa", borderRadius: 1 }}>
              <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block">
                لماذا وصلني؟
              </SoftTypography>
              <SoftTypography variant="caption" color="text" display="block">
                {item.reason}
              </SoftTypography>
              {item.escalation && (
                <SoftTypography variant="caption" color="warning" display="block" mt={0.5}>
                  {item.escalation}
                </SoftTypography>
              )}
              <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
                {item.retention}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        </SoftBox>

        <SoftBox display="flex" flexDirection="column" alignItems="flex-end" gap={1} minWidth={160}>
          <SoftTypography variant="caption" color="secondary">
            {item.createdAt}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            {item.actor}
          </SoftTypography>
          <SoftButton variant="outlined" color="info" size="small" onClick={() => onOpen(item.actionUrl)}>
            فتح
          </SoftButton>
          <SoftBox display="flex" gap={0.75} justifyContent="flex-end" flexWrap="wrap" maxWidth={220}>
            {item.actions?.map((action) => (
              <SoftButton
                key={action.code}
                variant={action.code === "snooze" ? "text" : "outlined"}
                color={action.code === "reject" ? "error" : "secondary"}
                size="small"
                onClick={() => action.url && onOpen(action.url)}
              >
                {action.label}
              </SoftButton>
            ))}
          </SoftBox>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

export default function NotificationsInbox() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const visibleNotifications = useMemo(() => {
    return mockTenantNotifications.filter((item) => {
      if (filter === "unread") return !item.isRead;
      if (filter === "critical") return ["critical", "action_required"].includes(item.severity);
      if (filter === "action") return item.requiresAction;
      if (filter === "snoozed") return item.state === "snoozed";
      if (filter === "escalated") return item.state === "escalated";
      return true;
    });
  }, [filter]);

  const stats = {
    total: mockTenantNotifications.length,
    unread: mockTenantNotifications.filter((item) => !item.isRead).length,
    critical: mockTenantNotifications.filter((item) => item.severity === "critical").length,
    action: mockTenantNotifications.filter((item) => item.requiresAction).length,
    escalated: mockTenantNotifications.filter((item) => item.state === "escalated").length,
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">
              مركز الإشعارات
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              متابعة تنبيهات الأصناف، المخزون، الصلاحيات، الشركاء، والمحاسبة
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => navigate("/notifications/preferences")}>
            تفضيلات الإشعارات
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}><StatTile label="الإجمالي" value={stats.total} color="dark" /></Grid>
          <Grid item xs={6} md={3}><StatTile label="غير مقروء" value={stats.unread} color="info" /></Grid>
          <Grid item xs={6} md={3}><StatTile label="حرج" value={stats.critical} color="error" /></Grid>
          <Grid item xs={6} md={3}><StatTile label="مصعد / إجراء" value={`${stats.escalated}/${stats.action}`} color="warning" /></Grid>
        </Grid>

        <Card sx={{ mb: 2 }}>
          <SoftBox px={2} pt={2}>
            <Tabs value={filter} onChange={(_, next) => setFilter(next)} textColor="inherit">
              {filters.map((item) => (
                <Tab key={item.key} value={item.key} label={item.label} />
              ))}
            </Tabs>
          </SoftBox>
        </Card>

        <SoftBox display="flex" flexDirection="column" gap={1.5}>
          {visibleNotifications.map((item) => (
            <NotificationCard key={item.publicId} item={item} onOpen={navigate} />
          ))}
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
