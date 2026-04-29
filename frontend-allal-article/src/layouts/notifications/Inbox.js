/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
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
import apiClient from "services/apiClient";

const severityConfig = {
  info:            { label: "معلومة",       color: "#17c1e8", bg: "#e3f8fd" },
  success:         { label: "تم",           color: "#82d616", bg: "#f0fde4" },
  warning:         { label: "تنبيه",        color: "#fb8c00", bg: "#fff3e0" },
  critical:        { label: "حرج",          color: "#ea0606", bg: "#ffeaea" },
  action_required: { label: "يتطلب إجراء", color: "#7928ca", bg: "#f5ecff" },
};

const categoryConfig = {
  products:  { label: "الأصناف",    icon: "inventory_2" },
  inventory: { label: "المخزون",    icon: "warehouse" },
  orders:    { label: "الطلبيات",   icon: "shopping_cart" },
  payments:  { label: "المدفوعات",  icon: "payment" },
  accounting:{ label: "المحاسبة",   icon: "paid" },
};

const lifecycleConfig = {
  new:       { label: "جديد",        color: "#17c1e8", bg: "#e3f8fd" },
  read:      { label: "مقروء",       color: "#8392ab", bg: "#f8f9fa" },
  snoozed:   { label: "مؤجل",        color: "#fb8c00", bg: "#fff3e0" },
  actioned:  { label: "تم الإجراء",  color: "#82d616", bg: "#f0fde4" },
  escalated: { label: "مصعد",        color: "#ea0606", bg: "#ffeaea" },
};

const FILTERS = [
  { key: "all",       label: "الكل" },
  { key: "unread",    label: "غير مقروء" },
  { key: "critical",  label: "حرجة" },
  { key: "action",    label: "تحتاج إجراء" },
  { key: "snoozed",   label: "مؤجلة" },
  { key: "escalated", label: "مصعدة" },
];

function StatTile({ label, value, color }) {
  return (
    <Card sx={{ p: 2, minHeight: 86 }}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold">{label}</SoftTypography>
      <SoftTypography variant="h4" color={color} fontWeight="bold">{value}</SoftTypography>
    </Card>
  );
}

function NotificationCard({ item, onOpen, onMarkRead }) {
  const severity  = severityConfig[item.severity]  || severityConfig.info;
  const category  = categoryConfig[item.category]  || { label: item.category, icon: "notifications" };
  const lifecycle = lifecycleConfig[item.state]    || lifecycleConfig.new;

  return (
    <Card sx={{ p: 2, borderInlineStart: `4px solid ${severity.color}`, opacity: item.isRead ? 0.72 : 1 }}>
      <SoftBox display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
        <SoftBox display="flex" gap={1.5} alignItems="flex-start" flex={1} minWidth={260}>
          <SoftBox
            width="2.5rem" height="2.5rem" borderRadius="lg"
            display="flex" alignItems="center" justifyContent="center"
            sx={{ background: severity.bg, color: severity.color, flexShrink: 0 }}
          >
            <Icon fontSize="small">{category.icon}</Icon>
          </SoftBox>
          <SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1} flexWrap="wrap" mb={0.5}>
              <SoftTypography variant="button" fontWeight="bold">{item.title}</SoftTypography>
              {!item.isRead && <Chip size="small" label="جديد" sx={{ height: 20, fontSize: 10 }} />}
            </SoftBox>
            <SoftTypography variant="caption" color="text" display="block">{item.body}</SoftTypography>
            <SoftBox display="flex" gap={1} flexWrap="wrap" mt={1}>
              <Chip size="small" label={category.label} sx={{ height: 22, fontSize: 10 }} />
              <Chip size="small" label={severity.label}
                sx={{ height: 22, fontSize: 10, color: severity.color, background: severity.bg }} />
              <Chip size="small" label={lifecycle.label}
                sx={{ height: 22, fontSize: 10, color: lifecycle.color, background: lifecycle.bg }} />
            </SoftBox>
            {item.reason && (
              <SoftBox mt={1.5} p={1.25} sx={{ background: "#f8f9fa", borderRadius: 1 }}>
                <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block">
                  لماذا وصلني؟
                </SoftTypography>
                <SoftTypography variant="caption" color="text" display="block">{item.reason}</SoftTypography>
              </SoftBox>
            )}
          </SoftBox>
        </SoftBox>

        <SoftBox display="flex" flexDirection="column" alignItems="flex-end" gap={1} minWidth={160}>
          <SoftTypography variant="caption" color="secondary">{item.createdAt}</SoftTypography>
          {item.actor && (
            <SoftTypography variant="caption" color="secondary">{item.actor}</SoftTypography>
          )}
          {item.actionUrl && (
            <SoftButton variant="outlined" color="info" size="small" onClick={() => onOpen(item.actionUrl)}>
              فتح
            </SoftButton>
          )}
          {!item.isRead && (
            <SoftButton variant="text" color="secondary" size="small" onClick={() => onMarkRead(item.id)}>
              تعليم كمقروء
            </SoftButton>
          )}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

export default function NotificationsInbox() {
  const [filter, setFilter]           = useState("all");
  const [notifications, setNotifs]    = useState([]);
  const [stats, setStats]             = useState({ total: 0, unread: 0, critical: 0, escalated: 0 });
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(0);
  const [totalElements, setTotal]     = useState(0);
  const navigate = useNavigate();

  const fetch = useCallback((newPage, filterKey, reset) => {
    const setter = newPage === 0 ? setLoading : setLoadingMore;
    setter(true);
    const params = { page: newPage, size: 30 };
    if (filterKey && filterKey !== "all") params.filter = filterKey;
    apiClient.get("/api/notifications", { params })
      .then((r) => {
        const data = r.data;
        const content = Array.isArray(data?.content) ? data.content : [];
        setTotal(data?.totalElements ?? 0);
        if (data?.stats) setStats(data.stats);
        setNotifs((prev) => reset ? content : [...prev, ...content]);
        setPage(newPage);
      })
      .catch(console.error)
      .finally(() => setter(false));
  }, []);

  useEffect(() => {
    fetch(0, filter, true);
  }, [fetch, filter]);

  const handleMarkRead = (id) => {
    apiClient.post(`/api/notifications/${id}/read`).catch(console.error);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, state: "read" } : n));
  };

  const handleMarkAllRead = () => {
    apiClient.post("/api/notifications/read-all").catch(console.error);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true, state: n.state === "new" ? "read" : n.state })));
    setStats((s) => ({ ...s, unread: 0 }));
  };

  const visibleNotifications = useMemo(() => notifications, [notifications]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">مركز الإشعارات</SoftTypography>
            <SoftTypography variant="body2" color="text">
              متابعة تنبيهات الأصناف، المخزون، الصلاحيات، الشركاء، والمحاسبة
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            {stats.unread > 0 && (
              <SoftButton variant="outlined" color="secondary" size="small" onClick={handleMarkAllRead}>
                تعليم الكل كمقروء
              </SoftButton>
            )}
            <SoftButton variant="gradient" color="info" size="small"
              onClick={() => navigate("/notifications/preferences")}>
              تفضيلات الإشعارات
            </SoftButton>
          </SoftBox>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}><StatTile label="الإجمالي"       value={Number(stats.total     || 0)} color="dark"    /></Grid>
          <Grid item xs={6} md={3}><StatTile label="غير مقروء"      value={Number(stats.unread    || 0)} color="info"    /></Grid>
          <Grid item xs={6} md={3}><StatTile label="حرج"            value={Number(stats.critical  || 0)} color="error"   /></Grid>
          <Grid item xs={6} md={3}><StatTile label="مصعد"           value={Number(stats.escalated || 0)} color="warning" /></Grid>
        </Grid>

        <Card sx={{ mb: 2 }}>
          <SoftBox px={2} pt={2}>
            <Tabs value={filter} onChange={(_, next) => setFilter(next)} textColor="inherit">
              {FILTERS.map((item) => (
                <Tab key={item.key} value={item.key} label={item.label} />
              ))}
            </Tabs>
          </SoftBox>
        </Card>

        {loading ? (
          <SoftBox display="flex" justifyContent="center" py={6}><CircularProgress /></SoftBox>
        ) : visibleNotifications.length === 0 ? (
          <SoftBox textAlign="center" py={6}>
            <SoftTypography variant="body2" color="text">لا توجد إشعارات</SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
              ستظهر الإشعارات هنا عند حدوث أحداث في النظام
            </SoftTypography>
          </SoftBox>
        ) : (
          <>
            <SoftBox display="flex" flexDirection="column" gap={1.5}>
              {visibleNotifications.map((item) => (
                <NotificationCard
                  key={item.id || item.publicId}
                  item={item}
                  onOpen={navigate}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </SoftBox>
            {notifications.length < totalElements && (
              <SoftBox textAlign="center" mt={3}>
                <SoftButton variant="outlined" color="info" size="small"
                  onClick={() => fetch(page + 1, filter, false)}
                  disabled={loadingMore}>
                  {loadingMore ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  تحميل المزيد ({totalElements - notifications.length} متبقية)
                </SoftButton>
              </SoftBox>
            )}
          </>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
