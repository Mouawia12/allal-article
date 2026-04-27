/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import OwnerLayout from "examples/LayoutContainers/OwnerLayout";
import ownerApi from "services/ownerApi";

// ─── Config ───────────────────────────────────────────────────────────────────
const severityConfig = {
  critical:        { label: "حرج",           color: "#ea0606", bg: "#ffeaea" },
  action_required: { label: "يتطلب إجراء",   color: "#7928ca", bg: "#f5ecff" },
  warning:         { label: "تحذير",          color: "#fb8c00", bg: "#fff3e0" },
  info:            { label: "معلومة",         color: "#17c1e8", bg: "#e3f8fd" },
};

const categoryConfig = {
  subscription:   { label: "الاشتراك" },
  provisioning:   { label: "التهيئة" },
  plan_limit:     { label: "حدود الخطة" },
  partnership:    { label: "الشراكة" },
  system:         { label: "النظام" },
};

const lifecycleConfig = {
  new:       { label: "جديد",    color: "#17c1e8", bg: "#e3f8fd" },
  seen:      { label: "مُشاهَد", color: "#8392ab", bg: "#f8f9fa" },
  resolved:  { label: "محلول",   color: "#82d616", bg: "#f0fde4" },
  escalated: { label: "مصعد",   color: "#ea0606", bg: "#ffeaea" },
};

function OwnerStat({ label, value, color }) {
  return (
    <Card sx={{ flex: 1, minWidth: 150, p: 2 }}>
      <Box sx={{ color: "#8392ab", fontSize: 12, fontWeight: 700 }}>{label}</Box>
      <Box sx={{ color, fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{value}</Box>
    </Card>
  );
}

export default function OwnerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    ownerApi.listEvents(50)
      .then((r) => {
        const events = (r.data?.data ?? []).map((ev) => ({
          publicId: ev.id,
          tenantName: ev.company_name ?? "—",
          title: ev.event_type === "provision" ? "تهيئة مشترك جديد" : ev.event_type,
          body: `المخطط: ${ev.schema_name ?? "—"}`,
          reason: "",
          category: "provisioning",
          severity: ev.status === "failed" ? "critical" : ev.status === "completed" ? "info" : "warning",
          state: ev.status === "completed" ? "resolved" : ev.status === "failed" ? "escalated" : "new",
          isRead: ev.status !== "started",
          createdAt: ev.created_at ? new Date(ev.created_at).toLocaleString("ar-DZ") : "—",
          actions: [],
          actionUrl: "/owner/tenants",
        }));
        setNotifications(events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visible = category === "all"
    ? notifications
    : notifications.filter((item) => item.category === category);

  const stats = {
    unread:    notifications.filter((item) => !item.isRead).length,
    critical:  notifications.filter((item) => item.severity === "critical").length,
    action:    notifications.filter((item) => item.severity === "action_required").length,
    escalated: notifications.filter((item) => item.state === "escalated").length,
  };

  const categories = [...new Set(notifications.map((item) => item.category))];

  return (
    <OwnerLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Box>
            <Box sx={{ fontSize: 20, fontWeight: 700, color: "#344767" }}>إشعارات مالك المنصة</Box>
            <Box sx={{ fontSize: 13, color: "#8392ab" }}>
              اشتراكات، تهيئة مشتركين، حدود الخطط
            </Box>
          </Box>
          <Select size="small" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180, background: "#fff" }}>
            <MenuItem value="all">كل التصنيفات</MenuItem>
            {categories.map((key) => (
              <MenuItem key={key} value={key}>{categoryConfig[key]?.label || key}</MenuItem>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <OwnerStat label="غير مقروء"    value={stats.unread}    color="#17c1e8" />
          <OwnerStat label="حرج"          value={stats.critical}  color="#ea0606" />
          <OwnerStat label="يتطلب إجراء" value={stats.action}    color="#7928ca" />
          <OwnerStat label="مصعد"         value={stats.escalated} color="#ea0606" />
        </Box>

        <Card>
          <Box sx={{ p: 2, borderBottom: "1px solid #eee", fontSize: 14, fontWeight: 700, color: "#344767" }}>
            قائمة الإشعارات
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: "#f8f9fa" }}>
                    {["الوقت", "المشترك", "الإشعار", "التصنيف", "الأولوية", "الحالة", "الإجراء"].map((header) => (
                      <TableCell key={header} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1 }}>
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: "center", color: "#8392ab", fontSize: 13, py: 4 }}>
                        لا توجد إشعارات بعد
                      </TableCell>
                    </TableRow>
                  ) : visible.map((item) => {
                    const severity = severityConfig[item.severity] ?? severityConfig.info;
                    const categoryInfo = categoryConfig[item.category] ?? { label: item.category };
                    const lifecycle = lifecycleConfig[item.state] ?? lifecycleConfig.new;
                    return (
                      <TableRow key={item.publicId} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                        <TableCell sx={{ fontSize: 11, color: "#8392ab", whiteSpace: "nowrap" }}>{item.createdAt}</TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#344767", fontWeight: 600 }}>{item.tenantName}</TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 700 }}>{item.title}</Box>
                          <Box sx={{ fontSize: 11, color: "#8392ab" }}>{item.body}</Box>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={categoryInfo.label} sx={{ height: 22, fontSize: 10 }} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={severity.label}
                            sx={{ height: 22, fontSize: 10, background: severity.bg, color: severity.color, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={lifecycle.label}
                            sx={{ height: 22, fontSize: 10, background: lifecycle.bg, color: lifecycle.color, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          {item.actions?.map((action) => (
                            <Box
                              key={action.code}
                              component="button"
                              onClick={() => navigate(action.url || item.actionUrl)}
                              sx={{
                                border: "1px solid #17c1e8", background: "transparent", color: "#17c1e8",
                                borderRadius: 1.5, px: 1.2, py: 0.5, fontSize: 11, fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              {action.label}
                            </Box>
                          ))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </OwnerLayout>
  );
}
