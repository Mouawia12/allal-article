/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import HistoryIcon from "@mui/icons-material/History";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockOrderDetail = {
  id: "ORD-2024-003",
  customer: "شركة الإنشاءات المتحدة",
  customerPhone: "0555-123456",
  customerAddress: "الرياض، حي الملك فهد",
  salesperson: "محمد سعيد",
  date: "2024-01-17",
  confirmedDate: null,
  status: "under_review",
  shippingStatus: "pending",
  notes: "يرجى الشحن في أسرع وقت ممكن",
  createdBy: "محمد سعيد",
  lines: [
    {
      id: 1, product: "برغي M10 × 50mm", code: "BRG-010-50",
      requestedQty: 500, approvedQty: 500, shippedQty: 0, cancelledQty: 0,
      status: "pending", willShip: true, notes: "",
    },
    {
      id: 2, product: "صامولة M10", code: "SAM-010",
      requestedQty: 500, approvedQty: 400, shippedQty: 0, cancelledQty: 100,
      status: "modified", willShip: true, notes: "الكمية عدلت من الإدارة",
    },
    {
      id: 3, product: "مفتاح ربط 17mm", code: "MFT-017",
      requestedQty: 10, approvedQty: 0, shippedQty: 0, cancelledQty: 10,
      status: "cancelled", willShip: false, notes: "غير متوفر في المخزون",
    },
    {
      id: 4, product: "شريط عازل كهربائي", code: "SHR-EL",
      requestedQty: 50, approvedQty: 50, shippedQty: 0, cancelledQty: 0,
      status: "approved", willShip: true, notes: "",
    },
    {
      id: 5, product: "كابل كهربائي 2.5mm", code: "KBL-25",
      requestedQty: 200, approvedQty: 0, shippedQty: 0, cancelledQty: 200,
      status: "deleted_by_admin", willShip: false, notes: "حذفت من قبل الإدارة",
    },
  ],
};

const statusConfig = {
  draft:        { label: "مسودة",        color: "secondary" },
  submitted:    { label: "مرسلة",        color: "info" },
  under_review: { label: "قيد المراجعة", color: "warning" },
  confirmed:    { label: "مؤكدة",        color: "success" },
  fulfilled:    { label: "مكتملة",       color: "success" },
  cancelled:    { label: "ملغاة",        color: "error" },
  rejected:     { label: "مرفوضة",       color: "error" },
};

const lineStatusConfig = {
  pending:          { label: "في الانتظار",  color: "warning",   bg: "#fff" },
  approved:         { label: "معتمد",        color: "success",   bg: "#f0fff4" },
  modified:         { label: "معدّل",         color: "info",      bg: "#fffbeb" },
  partially_allocated:{ label: "جزئي",       color: "info",      bg: "#e8f4f8" },
  allocated:        { label: "مخصص",         color: "success",   bg: "#f0fff4" },
  cancelled:        { label: "ملغى",         color: "error",     bg: "#fff5f5" },
  deleted_by_admin: { label: "محذوف",        color: "error",     bg: "#fee2e2" },
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: IconComp, label, value }) {
  return (
    <SoftBox display="flex" alignItems="center" mb={1} gap={1}>
      <IconComp fontSize="small" sx={{ color: "#8392ab" }} />
      <SoftTypography variant="caption" color="secondary" fontWeight="bold" minWidth={110}>
        {label}:
      </SoftTypography>
      <SoftTypography variant="caption" color="text">
        {value}
      </SoftTypography>
    </SoftBox>
  );
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
const activityLog = [
  { time: "2024-01-17 09:15", user: "محمد سعيد",   action: "أنشأ الطلبية وأرسلها للإدارة" },
  { time: "2024-01-17 10:30", user: "الإدارة",     action: "تم فتح الطلبية للمراجعة" },
  { time: "2024-01-17 10:45", user: "الإدارة",     action: "عدّل كمية صامولة M10 من 500 إلى 400" },
  { time: "2024-01-17 10:46", user: "الإدارة",     action: "ألغى مفتاح ربط 17mm — السبب: غير متوفر" },
  { time: "2024-01-17 10:47", user: "الإدارة",     action: "حذف كابل كهربائي 2.5mm من الطلبية" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const order = { ...mockOrderDetail, id: id || mockOrderDetail.id };

  const [confirmDialog, setConfirmDialog] = useState(null); // null | "approve" | "reject"
  const [adminNote, setAdminNote] = useState("");
  const [orderStatus, setOrderStatus] = useState(order.status);

  const sc = statusConfig[orderStatus] || { label: orderStatus, color: "secondary" };

  const handleAction = (action) => {
    if (action === "approve") setOrderStatus("confirmed");
    if (action === "reject") setOrderStatus("rejected");
    setConfirmDialog(null);
    setAdminNote("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── Header ── */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/orders")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftBox display="flex" alignItems="center" gap={2}>
              <SoftTypography variant="h4" fontWeight="bold">
                {order.id}
              </SoftTypography>
              <SoftBadge
                variant="gradient"
                color={sc.color}
                size="sm"
                badgeContent={sc.label}
                container
              />
            </SoftBox>
            <SoftTypography variant="body2" color="text">
              تفاصيل الطلبية
            </SoftTypography>
          </SoftBox>
          {/* Action Buttons */}
          {orderStatus === "under_review" && (
            <SoftBox display="flex" gap={1}>
              <SoftButton
                variant="gradient"
                color="success"
                size="small"
                startIcon={<CheckCircleIcon />}
                onClick={() => setConfirmDialog("approve")}
              >
                تأكيد الطلبية
              </SoftButton>
              <SoftButton
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => setConfirmDialog("reject")}
              >
                رفض الطلبية
              </SoftButton>
              <SoftButton variant="outlined" color="info" size="small" startIcon={<EditIcon />}>
                تعديل
              </SoftButton>
            </SoftBox>
          )}
          {orderStatus === "confirmed" && (
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              startIcon={<LocalShippingIcon />}
            >
              تسجيل الشحن
            </SoftButton>
          )}
        </SoftBox>

        <Grid container spacing={3}>
          {/* ── Left Column ── */}
          <Grid item xs={12} lg={8}>
            {/* Order Info Card */}
            <Card sx={{ mb: 3, p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                معلومات الطلبية
              </SoftTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={PersonIcon}       label="الزبون"      value={order.customer} />
                  <InfoRow icon={PersonIcon}       label="الهاتف"      value={order.customerPhone} />
                  <InfoRow icon={PersonIcon}       label="العنوان"     value={order.customerAddress} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={PersonIcon}       label="البائع"      value={order.salesperson} />
                  <InfoRow icon={CalendarTodayIcon} label="تاريخ الإنشاء" value={order.date} />
                  <InfoRow icon={ReceiptIcon}      label="أنشأ بواسطة" value={order.createdBy} />
                </Grid>
              </Grid>
              {order.notes && (
                <SoftBox mt={2} p={2} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">
                    ملاحظات:
                  </SoftTypography>
                  <SoftTypography variant="body2" color="text" mt={0.5}>
                    {order.notes}
                  </SoftTypography>
                </SoftBox>
              )}
            </Card>

            {/* Lines Table */}
            <Card>
              <SoftBox p={3}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <SoftTypography variant="h6" fontWeight="bold">
                    سطور الطلبية
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    {order.lines.length} صنف
                  </SoftTypography>
                </SoftBox>

                <SoftBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        {["الصنف", "كود", "مطلوب", "معتمد", "مشحون", "ملغى", "الحالة", "شحن؟", "ملاحظات"].map((h) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary" textTransform="uppercase">
                              {h}
                            </SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {order.lines.map((line) => {
                        const lsc = lineStatusConfig[line.status] || { label: line.status, color: "secondary", bg: "#fff" };
                        const isDeleted = line.status === "cancelled" || line.status === "deleted_by_admin";
                        return (
                          <tr
                            key={line.id}
                            style={{
                              background: lsc.bg,
                              borderBottom: "1px solid #e9ecef",
                              opacity: isDeleted ? 0.75 : 1,
                            }}
                          >
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography
                                variant="button"
                                fontWeight="medium"
                                sx={isDeleted ? { textDecoration: "line-through", color: "#e53935" } : {}}
                              >
                                {line.product}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="text">
                                {line.code}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" fontWeight="bold">
                                {line.requestedQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography
                                variant="caption"
                                fontWeight="bold"
                                color={line.approvedQty < line.requestedQty ? "warning" : "text"}
                              >
                                {line.approvedQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" color="text">
                                {line.shippedQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" color={line.cancelledQty > 0 ? "error" : "text"}>
                                {line.cancelledQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftBadge
                                variant={isDeleted ? "gradient" : "contained"}
                                color={lsc.color}
                                size="xs"
                                badgeContent={lsc.label}
                                container
                              />
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" color={line.willShip ? "success" : "secondary"}>
                                {line.willShip ? "✓" : "—"}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="text">
                                {line.notes || "—"}
                              </SoftTypography>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SoftBox>

                {/* Legend */}
                <SoftBox mt={2} display="flex" gap={2} flexWrap="wrap">
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">
                    ملاحظة:
                  </SoftTypography>
                  {[
                    { color: "#fee2e2", label: "محذوف من الإدارة" },
                    { color: "#fff5f5", label: "ملغى" },
                    { color: "#fffbeb", label: "معدّل" },
                    { color: "#f0fff4", label: "معتمد" },
                  ].map((l) => (
                    <SoftBox key={l.label} display="flex" alignItems="center" gap={0.5}>
                      <SoftBox width={14} height={14} borderRadius="3px" sx={{ background: l.color, border: "1px solid #e0e0e0" }} />
                      <SoftTypography variant="caption" color="text">{l.label}</SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>

          {/* ── Right Column ── */}
          <Grid item xs={12} lg={4}>
            {/* Status Summary */}
            <Card sx={{ mb: 3, p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                ملخص الطلبية
              </SoftTypography>
              {[
                { label: "إجمالي السطور",     value: order.lines.length },
                { label: "السطور المعتمدة",    value: order.lines.filter(l => l.status === "approved").length },
                { label: "السطور الملغاة",     value: order.lines.filter(l => ["cancelled","deleted_by_admin"].includes(l.status)).length },
                { label: "إجمالي الكمية المطلوبة", value: order.lines.reduce((s, l) => s + l.requestedQty, 0) },
                { label: "إجمالي الكمية المعتمدة", value: order.lines.reduce((s, l) => s + l.approvedQty, 0) },
              ].map((row) => (
                <SoftBox key={row.label} display="flex" justifyContent="space-between" mb={1}>
                  <SoftTypography variant="caption" color="text">{row.label}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">{row.value}</SoftTypography>
                </SoftBox>
              ))}
            </Card>

            {/* Activity Log */}
            <Card sx={{ p: 3 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <HistoryIcon fontSize="small" sx={{ color: "#8392ab" }} />
                <SoftTypography variant="h6" fontWeight="bold">
                  سجل التغييرات
                </SoftTypography>
              </SoftBox>
              {activityLog.map((entry, i) => (
                <SoftBox key={i} mb={2} pl={2} sx={{ borderLeft: "2px solid #e9ecef" }}>
                  <SoftTypography variant="caption" color="secondary" display="block">
                    {entry.time}
                  </SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold" color="text">
                    {entry.user}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text" display="block">
                    {entry.action}
                  </SoftTypography>
                </SoftBox>
              ))}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* ── Confirm Dialog ── */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmDialog === "approve" ? "تأكيد الطلبية" : "رفض الطلبية"}
        </DialogTitle>
        <DialogContent>
          <SoftTypography variant="body2" color="text" mb={2}>
            {confirmDialog === "approve"
              ? "هل أنت متأكد من تأكيد هذه الطلبية؟ سيتم إعلام البائع بالقرار."
              : "هل أنت متأكد من رفض هذه الطلبية؟ يرجى إضافة سبب الرفض."}
          </SoftTypography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="ملاحظات / سبب القرار"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setConfirmDialog(null)}>
            إلغاء
          </SoftButton>
          <SoftButton
            variant="gradient"
            color={confirmDialog === "approve" ? "success" : "error"}
            size="small"
            onClick={() => handleAction(confirmDialog)}
          >
            {confirmDialog === "approve" ? "تأكيد" : "رفض"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default OrderDetail;
