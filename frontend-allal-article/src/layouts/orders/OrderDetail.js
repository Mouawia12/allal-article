/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import { ordersApi } from "services";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ReceiptIcon from "@mui/icons-material/Receipt";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ResourceLockBanner from "components/ResourceLockBanner";
const getMockResourceLock = () => null;

function normalize(apiOrder) {
  return {
    id: apiOrder.orderNumber,
    _id: apiOrder.id,
    customer: apiOrder.customerName ?? "—",
    customerPhone: apiOrder.customerPhone ?? "—",
    customerAddress: apiOrder.customerAddress ?? "—",
    salesperson: apiOrder.salesUserName ?? "—",
    date: apiOrder.createdAt ? apiOrder.createdAt.slice(0, 10) : "—",
    status: apiOrder.orderStatus ?? "draft",
    shippingStatus: apiOrder.shippingStatus ?? "none",
    notes: apiOrder.notes ?? "",
    createdBy: apiOrder.salesUserName ?? "—",
    priceListName: apiOrder.priceListName ?? "",
    shippedAt: apiOrder.shippedAt ? apiOrder.shippedAt.slice(0, 10) : null,
    lines: (apiOrder.items ?? []).map((item) => ({
      id: item.id,
      product: item.productName ?? "—",
      code: item.productSku ?? "—",
      requestedQty: item.requestedQty ?? 0,
      approvedQty: item.approvedQty ?? 0,
      shippedQty: item.shippedQty ?? 0,
      returnedQty: item.returnedQty ?? 0,
      cancelledQty: item.cancelledQty ?? 0,
      unitPrice: item.unitPrice ?? 0,
      status: item.lineStatus ?? "pending",
      willShip: (item.approvedQty ?? 0) > 0 && item.lineStatus !== "cancelled",
      notes: item.notes ?? "",
    })),
  };
}

function normalizeEvent(evt) {
  return {
    time: evt.createdAt ? new Date(evt.createdAt).toLocaleString("ar-DZ") : "—",
    user: evt.performedByName ?? "النظام",
    action: evt.eventType ?? "حدث",
  };
}


function formatDZD(value) {
  return Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 0,
  });
}


const statusConfig = {
  draft: { label: "مسودة", color: "secondary" },
  submitted: { label: "مرسلة للإدارة", color: "info" },
  under_review: { label: "قيد المراجعة", color: "warning" },
  confirmed: { label: "مؤكدة", color: "success" },
  shipped: { label: "مشحونة", color: "success" },
  completed: { label: "مكتملة", color: "success" },
  partially_returned: { label: "مرتجع جزئي", color: "warning" },
  returned: { label: "مرتجع بالكامل", color: "error" },
  cancelled: { label: "ملغاة", color: "error" },
  rejected: { label: "مرفوضة", color: "error" },
};

const shippingConfig = {
  none: { label: "—", color: "secondary" },
  pending: { label: "بانتظار الشحن", color: "warning" },
  shipped: { label: "تم الشحن", color: "success" },
};

const lineStatusConfig = {
  pending: { label: "في الانتظار", color: "warning", bg: "#fff" },
  approved: { label: "معتمد", color: "success", bg: "#f0fff4" },
  modified: { label: "معدّل", color: "info", bg: "#fffbeb" },
  shipped: { label: "مشحون", color: "success", bg: "#f0fff4" },
  cancelled: { label: "ملغى", color: "error", bg: "#fff5f5" },
};

const orderActionFlow = {
  draft: {
    title: "إرسال الطلبية للإدارة",
    body: "سيتم إرسال الطلبية للإدارة حتى تبدأ مراجعة الكميات والسطور.",
    button: "إرسال للإدارة",
    color: "info",
    icon: DescriptionIcon,
    nextStatus: "submitted",
    nextShippingStatus: "pending",
    log: "أرسل الطلبية للإدارة",
  },
  submitted: {
    title: "تسجيل قيد المراجعة",
    body: "سيتم وضع الطلبية في حالة قيد المراجعة حتى تظهر كطلبية مفتوحة للإدارة.",
    button: "سجلها قيد مراجعة",
    color: "warning",
    icon: EditIcon,
    nextStatus: "under_review",
    nextShippingStatus: "pending",
    log: "سجل الطلبية قيد المراجعة",
  },
  under_review: {
    title: "تأكيد الطلبية",
    body: "سيتم اعتماد السطور غير الملغاة وتجهيز الطلبية للشحن.",
    button: "تأكيد",
    color: "success",
    icon: CheckCircleIcon,
    nextStatus: "confirmed",
    nextShippingStatus: "pending",
    log: "أكد الطلبية واعتمد السطور",
  },
  confirmed: {
    title: "تسجيل الشحن",
    body: "سيتم شحن كامل الكميات المعتمدة، وستغلق إمكانية تعديل السطور المشحونة.",
    button: "تسجيل الشحن",
    color: "info",
    icon: LocalShippingIcon,
    nextStatus: "shipped",
    nextShippingStatus: "shipped",
    log: "سجل شحن الطلبية بالكامل",
  },
  shipped: {
    title: "اكتمال الطلبية",
    body: "سيتم اعتبار الطلبية مكتملة بعد الشحن وإغلاقها تشغيلياً مع بقاء المرتجع متاحاً عند الحاجة.",
    button: "اكتمال طلبية",
    color: "success",
    icon: CheckCircleIcon,
    nextStatus: "completed",
    nextShippingStatus: "shipped",
    log: "أكمل الطلبية بعد الشحن",
  },
};


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

function clampQty(value, maxQty) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), maxQty);
}

function isLineCancelled(line) {
  return line.status === "cancelled" || Number(line.cancelledQty || 0) >= Number(line.requestedQty || 0);
}

function getDerivedDraftStatus(line) {
  if (Number(line.cancelledQty || 0) >= Number(line.requestedQty || 0)) return "cancelled";
  if (line._touched) return "modified";
  return "approved";
}

function describeLineChange(before, after) {
  const changes = [];

  if (Number(before.approvedQty || 0) !== Number(after.approvedQty || 0)) {
    changes.push(`المعتمد ${before.approvedQty} -> ${after.approvedQty}`);
  }
  if (Number(before.cancelledQty || 0) !== Number(after.cancelledQty || 0)) {
    changes.push(`الملغى ${before.cancelledQty} -> ${after.cancelledQty}`);
  }
  if (before.status !== after.status) {
    changes.push(`الحالة ${lineStatusConfig[after.status]?.label || after.status}`);
  }

  return changes.length ? `${after.product}: ${changes.join("، ")}` : null;
}

function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [orderStatus, setOrderStatus] = useState("draft");
  const [shippingStatus, setShippingStatus] = useState("none");
  const [shippedAt, setShippedAt] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [draftLines, setDraftLines] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [activity, setActivity] = useState([]);

  const loadOrder = useCallback(() => {
    setLoading(true);
    Promise.all([ordersApi.getById(id), ordersApi.getEvents(id)])
      .then(([orderRes, eventsRes]) => {
        const norm = normalize(orderRes.data);
        setOrderData(norm);
        setOrderStatus(norm.status);
        setShippingStatus(norm.shippingStatus);
        setShippedAt(norm.shippedAt);
        setOrderLines(norm.lines);
        setActivity((eventsRes.data ?? []).map(normalizeEvent));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  if (loading || !orderData) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" py={10}>
          <CircularProgress />
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const order = orderData;
  const sc = statusConfig[orderStatus] || { label: orderStatus, color: "secondary" };
  const sh = shippingConfig[shippingStatus] || { label: "—", color: "secondary" };
  const editLock = getMockResourceLock("sales_order", order._id);
  const isShipped = ["shipped", "completed"].includes(orderStatus) || shippingStatus === "shipped";
  const canEdit = !isShipped && !["cancelled", "rejected"].includes(orderStatus) && !editLock;
  const canCancelOrder = !["shipped", "completed", "cancelled", "rejected"].includes(orderStatus);
  const primaryAction = orderActionFlow[orderStatus];
  const displayedLines = editMode ? draftLines : orderLines;

  const startEdit = () => {
    setDraftLines(orderLines.map((line) => ({ ...line, _touched: false })));
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftLines([]);
    setEditMode(false);
  };

  const updateDraftLine = (lineId, updater) => {
    setDraftLines((lines) =>
      lines.map((line) => (line.id === lineId ? updater({ ...line, _touched: true }) : line))
    );
  };

  const setApprovedQty = (lineId, value) => {
    updateDraftLine(lineId, (line) => {
      const requestedQty = Number(line.requestedQty || 0);
      const approvedQty = clampQty(value, requestedQty);
      const cancelledQty = requestedQty - approvedQty;
      return {
        ...line,
        approvedQty,
        cancelledQty,
        willShip: approvedQty > 0,
        status: cancelledQty >= requestedQty ? "cancelled" : "modified",
      };
    });
  };

  const setCancelledQty = (lineId, value) => {
    updateDraftLine(lineId, (line) => {
      const requestedQty = Number(line.requestedQty || 0);
      const cancelledQty = clampQty(value, requestedQty);
      const approvedQty = requestedQty - cancelledQty;
      return {
        ...line,
        approvedQty,
        cancelledQty,
        willShip: approvedQty > 0,
        status: cancelledQty >= requestedQty ? "cancelled" : "modified",
      };
    });
  };

  const cancelDraftLine = (lineId) => {
    updateDraftLine(lineId, (line) => ({
      ...line,
      approvedQty: 0,
      cancelledQty: Number(line.requestedQty || 0),
      shippedQty: 0,
      willShip: false,
      status: "cancelled",
      notes: line.notes || "ألغي أثناء تعديل الفاتورة",
    }));
  };

  const saveEdit = () => {
    const changes = [];
    const nextLines = draftLines.map((line) => {
      const requestedQty = Number(line.requestedQty || 0);
      const cancelledQty = clampQty(line.cancelledQty, requestedQty);
      const approvedQty = requestedQty - cancelledQty;
      const status = cancelledQty >= requestedQty ? "cancelled" : line._touched ? "modified" : "approved";
      const nextLine = {
        ...line,
        approvedQty,
        cancelledQty,
        shippedQty: 0,
        willShip: approvedQty > 0,
        status,
        notes: status === "cancelled" && !line.notes ? "ملغى أثناء مراجعة الإدارة" : line.notes,
      };
      delete nextLine._touched;

      const before = orderLines.find((item) => item.id === line.id);
      const changeText = before ? describeLineChange(before, nextLine) : null;
      if (changeText) changes.push(changeText);

      return nextLine;
    });

    setOrderLines(nextLines);
    setEditMode(false);
    setDraftLines([]);
  };

  const handleAction = async (action) => {
    try {
      if (action === "reject") {
        await ordersApi.reject(id, adminNote.trim() || undefined);
      } else if (action === "cancel") {
        await ordersApi.cancel(id, adminNote.trim() || undefined);
      } else if (action === "draft") {
        await ordersApi.submit(id);
      } else if (action === "submitted" || action === "under_review") {
        await ordersApi.confirm(id, {});
      } else if (action === "confirmed") {
        await ordersApi.ship(id);
      } else if (action === "shipped") {
        await ordersApi.complete(id);
      }
      setConfirmDialog(null);
      setAdminNote("");
      loadOrder();
    } catch (err) {
      console.error(err);
      setConfirmDialog(null);
      setAdminNote("");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-hidden-line { display: none !important; }
          }
        `}
      </style>
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <IconButton onClick={() => navigate("/orders")} size="small" className="no-print">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1} minWidth={220}>
            <SoftBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
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
              <SoftBadge
                variant="contained"
                color={sh.color}
                size="sm"
                badgeContent={sh.label}
                container
              />
            </SoftBox>
            <SoftTypography variant="body2" color="text">
              تفاصيل الطلبية ومراجعة السطور قبل الشحن
            </SoftTypography>
          </SoftBox>

          <SoftBox display="flex" gap={1} flexWrap="wrap" className="no-print">
            {primaryAction && !editMode && (
              <SoftButton
                variant="gradient"
                color={primaryAction.color}
                size="small"
                startIcon={<primaryAction.icon />}
                onClick={() => setConfirmDialog(orderStatus)}
              >
                {primaryAction.button}
              </SoftButton>
            )}
            {["submitted", "under_review"].includes(orderStatus) && !editMode && (
              <SoftButton
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => setConfirmDialog("reject")}
              >
                رفض الطلبية
              </SoftButton>
            )}
            {canCancelOrder && !editMode && (
              <SoftButton
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => setConfirmDialog("cancel")}
              >
                إلغاء الطلبية
              </SoftButton>
            )}
            {!editMode && (
              <>
                {["confirmed", "shipped", "completed"].includes(orderStatus) && (
                  <SoftButton
                    variant="outlined"
                    color="info"
                    size="small"
                    startIcon={<DescriptionIcon />}
                    onClick={() => navigate("/road-invoices/new")}
                  >
                    تحويل إلى فاتورة طريق
                  </SoftButton>
                )}
                {isShipped && (
                  <SoftButton
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<AssignmentReturnIcon />}
                    onClick={() => setReturnDialog(true)}
                  >
                    إنشاء مرتجع
                  </SoftButton>
                )}
                <SoftButton
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<EditIcon />}
                  disabled={!canEdit}
                  onClick={startEdit}
                >
                  تعديل الفاتورة
                </SoftButton>
              </>
            )}
            {editMode && (
              <>
                <SoftButton variant="gradient" color="success" size="small" startIcon={<SaveIcon />} onClick={saveEdit}>
                  حفظ التعديل
                </SoftButton>
                <SoftButton variant="outlined" color="secondary" size="small" onClick={cancelEdit}>
                  إلغاء التعديل
                </SoftButton>
              </>
            )}
          </SoftBox>
        </SoftBox>

        <ResourceLockBanner lock={editLock} resourceLabel="الطلبية" />

        {isShipped && (
          <SoftBox mb={2} p={1.5} sx={{ background: "#f0fff4", border: "1px solid #b7eb8f", borderRadius: 2 }}>
            <SoftTypography variant="body2" color="text">
              {orderStatus === "completed"
                ? "الطلبية مكتملة، وتم إقفال تعديل السطور. يمكن تسجيل مرتجع فقط عند الحاجة."
                : "الطلبية مشحونة بالكامل، لذلك تم إيقاف تعديل السطور المشحونة. يمكن تسجيل اكتمال الطلبية أو فتح مرتجع عند الحاجة."}
            </SoftTypography>
            {shippedAt && (
              <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
                تاريخ الشحن: {shippedAt}
              </SoftTypography>
            )}
          </SoftBox>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ mb: 3, p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                معلومات الطلبية
              </SoftTypography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={PersonIcon} label="الزبون" value={order.customer} />
                  <InfoRow icon={PersonIcon} label="الهاتف" value={order.customerPhone} />
                  <InfoRow icon={PersonIcon} label="العنوان" value={order.customerAddress} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={PersonIcon} label="البائع" value={order.salesperson} />
                  <InfoRow icon={CalendarTodayIcon} label="تاريخ الإنشاء" value={order.date} />
                  {shippedAt && <InfoRow icon={CalendarTodayIcon} label="تاريخ الشحن" value={shippedAt} />}
                  <InfoRow icon={ReceiptIcon} label="أنشأ بواسطة" value={order.createdBy} />
                  <InfoRow icon={ReceiptIcon} label="قائمة الأسعار" value={order.priceListName || "السعر الرئيسي"} />
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

            <Card>
              <SoftBox p={3}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={1} flexWrap="wrap">
                  <SoftBox>
                    <SoftTypography variant="h6" fontWeight="bold">
                      سطور الطلبية
                    </SoftTypography>
                    <SoftTypography variant="caption" color="secondary">
                      تعديل المعتمد يحسب الملغى تلقائياً، وتعديل الملغى يحسب المعتمد تلقائياً.
                    </SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="caption" color="text">
                    {orderLines.length} صنف
                  </SoftTypography>
                </SoftBox>

                <SoftBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        {[
                          "الصنف",
                          "كود",
                          "سعر",
                          "إجمالي",
                          "مطلوب",
                          "معتمد",
                          "مشحون",
                          "مرتجع",
                          "ملغى",
                          "الحالة",
                          "شحن؟",
                          "ملاحظات",
                          ...(editMode ? ["إجراء"] : []),
                        ].map((h) => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary" textTransform="uppercase">
                              {h}
                            </SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayedLines.map((line) => {
                        const derivedStatus = editMode ? getDerivedDraftStatus(line) : line.status;
                        const lsc = lineStatusConfig[derivedStatus] || { label: derivedStatus, color: "secondary", bg: "#fff" };
                        const cancelled = derivedStatus === "cancelled" || isLineCancelled(line);
                        const returnedQty = Number(line.returnedQty || 0);
                        const shippedQty = Number(line.shippedQty || 0);
                        const fullyReturned = shippedQty > 0 && returnedQty >= shippedQty;
                        const partiallyReturned = returnedQty > 0 && !fullyReturned;
                        const rowBg = cancelled || fullyReturned ? "#fee2e2" : partiallyReturned ? "#fff7ed" : lsc.bg;

                        return (
                          <tr
                            key={line.id}
                            className={cancelled ? "print-hidden-line" : undefined}
                            style={{
                              background: rowBg,
                              borderBottom: "1px solid #e9ecef",
                              opacity: cancelled ? 0.78 : 1,
                            }}
                          >
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography
                                variant="button"
                                fontWeight="medium"
                                sx={
                                  cancelled || fullyReturned
                                    ? { textDecoration: "line-through", color: "#e53935" }
                                    : partiallyReturned
                                      ? { color: "#c2410c" }
                                      : {}
                                }
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
                              <SoftTypography variant="caption" fontWeight="bold" color="info">
                                {formatDZD(line.unitPrice)} دج
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" fontWeight="bold">
                                {formatDZD(Number(line.approvedQty || 0) * Number(line.unitPrice || 0))} دج
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" fontWeight="bold">
                                {line.requestedQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              {editMode ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={line.approvedQty}
                                  onChange={(event) => setApprovedQty(line.id, event.target.value)}
                                  inputProps={{ min: 0, max: line.requestedQty, style: { width: 72, padding: "4px 8px", textAlign: "center" } }}
                                />
                              ) : (
                                <SoftTypography
                                  variant="caption"
                                  fontWeight="bold"
                                  color={line.approvedQty < line.requestedQty ? "warning" : "text"}
                                >
                                  {line.approvedQty}
                                </SoftTypography>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" color="text">
                                {line.shippedQty}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography
                                variant="caption"
                                color={returnedQty > 0 ? "error" : "text"}
                                fontWeight={returnedQty > 0 ? "bold" : "regular"}
                              >
                                {returnedQty || "—"}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              {editMode ? (
                                <TextField
                                  type="number"
                                  size="small"
                                  value={line.cancelledQty}
                                  onChange={(event) => setCancelledQty(line.id, event.target.value)}
                                  inputProps={{ min: 0, max: line.requestedQty, style: { width: 72, padding: "4px 8px", textAlign: "center" } }}
                                />
                              ) : (
                                <SoftTypography variant="caption" color={line.cancelledQty > 0 ? "error" : "text"}>
                                  {line.cancelledQty || "—"}
                                </SoftTypography>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftBadge
                                variant={cancelled ? "gradient" : "contained"}
                                color={lsc.color}
                                size="xs"
                                badgeContent={lsc.label}
                                container
                              />
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <SoftTypography variant="caption" color={!cancelled && line.shippedQty > 0 ? "success" : "secondary"}>
                                {!cancelled && line.shippedQty > 0 ? "✓" : "—"}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="text">
                                {line.notes || "—"}
                              </SoftTypography>
                            </td>
                            {editMode && (
                              <td style={{ padding: "10px 12px" }}>
                                <SoftButton
                                  variant="text"
                                  color="error"
                                  size="small"
                                  disabled={cancelled}
                                  onClick={() => cancelDraftLine(line.id)}
                                >
                                  إلغاء السطر
                                </SoftButton>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SoftBox>

                <SoftBox mt={2} display="flex" gap={2} flexWrap="wrap">
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">
                    دلالة الألوان:
                  </SoftTypography>
                  {[
                    { color: "#fee2e2", label: "ملغى أو مرتجع بالكامل" },
                    { color: "#fff7ed", label: "مرتجع جزئياً" },
                    { color: "#fffbeb", label: "معدّل" },
                    { color: "#f0fff4", label: "معتمد / مشحون" },
                  ].map((l) => (
                    <SoftBox key={l.label} display="flex" alignItems="center" gap={0.5}>
                      <SoftBox width={14} height={14} borderRadius="3px" sx={{ background: l.color, border: "1px solid #e0e0e0" }} />
                      <SoftTypography variant="caption" color="text">
                        {l.label}
                      </SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ mb: 3, p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                ملخص الطلبية
              </SoftTypography>
              {[
                { label: "إجمالي السطور", value: orderLines.length },
                { label: "السطور المعتمدة", value: orderLines.filter((l) => !isLineCancelled(l)).length },
                { label: "السطور الملغاة", value: orderLines.filter((l) => isLineCancelled(l)).length },
                { label: "إجمالي الكمية المطلوبة", value: orderLines.reduce((s, l) => s + Number(l.requestedQty || 0), 0) },
                { label: "إجمالي الكمية المعتمدة", value: orderLines.reduce((s, l) => s + Number(l.approvedQty || 0), 0) },
                { label: "إجمالي كمية الملغى", value: orderLines.reduce((s, l) => s + Number(l.cancelledQty || 0), 0) },
                { label: "إجمالي كمية المرتجع", value: orderLines.reduce((s, l) => s + Number(l.returnedQty || 0), 0) },
                { label: "إجمالي الطلبية", value: `${formatDZD(orderLines.reduce((s, l) => s + Number(l.approvedQty || 0) * Number(l.unitPrice || 0), 0))} دج` },
              ].map((row) => (
                <SoftBox key={row.label} display="flex" justifyContent="space-between" mb={1}>
                  <SoftTypography variant="caption" color="text">
                    {row.label}
                  </SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">
                    {row.value}
                  </SoftTypography>
                </SoftBox>
              ))}
            </Card>

            <Card sx={{ p: 3 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <HistoryIcon fontSize="small" sx={{ color: "#8392ab" }} />
                <SoftTypography variant="h6" fontWeight="bold">
                  سجل التغييرات
                </SoftTypography>
              </SoftBox>
              {activity.map((entry, i) => (
                <SoftBox key={`${entry.time}-${i}`} mb={2} pl={2} sx={{ borderLeft: "2px solid #e9ecef" }}>
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

      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">
            إنشاء مرتجع - {order.id}
          </SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <SoftTypography variant="body2" color="text" mb={2}>
            حدد كميات المرتجع لكل صنف. لا يمكن إدخال كمية أكبر من الكمية المشحونة.
          </SoftTypography>
          <SoftBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["الصنف", "الكمية المشحونة", "كمية المرتجع"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                      <SoftTypography variant="caption" fontWeight="bold" color="secondary">
                        {h}
                      </SoftTypography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderLines.filter((line) => line.shippedQty > 0).map((line) => (
                  <tr key={line.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        {line.product}
                      </SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">
                        {line.code}
                      </SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        {line.shippedQty}
                      </SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <TextField
                        type="number"
                        size="small"
                        defaultValue={0}
                        inputProps={{
                          min: 0,
                          max: line.shippedQty,
                          style: { padding: "4px 8px", width: 80 },
                        }}
                        helperText={`الحد الأقصى: ${line.shippedQty}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SoftBox>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>السائق الذي شحن المرتجع</InputLabel>
                <Select defaultValue="" label="السائق الذي شحن المرتجع">
                  {["حمزة بلقاسم", "كريم بوزيد", "يوسف منصوري", "عمر زياني"].map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>من استلمه في الإدارة</InputLabel>
                <Select defaultValue="" label="من استلمه في الإدارة">
                  {["أحمد محمد", "خالد عمر", "محمد سعيد", "يوسف علي"].map((e) => (
                    <MenuItem key={e} value={e}>
                      {e}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="ملاحظات المرتجع" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setReturnDialog(false)}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="warning" size="small" onClick={() => setReturnDialog(false)}>
            تسجيل المرتجع
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmDialog === "reject"
            ? "رفض الطلبية"
            : confirmDialog === "cancel"
              ? "إلغاء الطلبية"
              : orderActionFlow[confirmDialog]?.title}
        </DialogTitle>
        <DialogContent>
          <SoftTypography variant="body2" color="text" mb={2}>
            {confirmDialog === "reject"
              ? "هل أنت متأكد من رفض هذه الطلبية؟ يرجى إضافة سبب الرفض."
              : confirmDialog === "cancel"
                ? "سيتم إلغاء الطلبية وكل السطور غير المشحونة قبل خروجها من المخزن. يرجى إضافة سبب الإلغاء."
              : orderActionFlow[confirmDialog]?.body}
          </SoftTypography>
          {["reject", "cancel"].includes(confirmDialog) && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label={confirmDialog === "reject" ? "سبب الرفض" : "سبب الإلغاء"}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              size="small"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setConfirmDialog(null)}>
            إلغاء
          </SoftButton>
          <SoftButton
            variant="gradient"
            color={["reject", "cancel"].includes(confirmDialog) ? "error" : orderActionFlow[confirmDialog]?.color || "info"}
            size="small"
            onClick={() => handleAction(confirmDialog)}
          >
            {confirmDialog === "reject"
              ? "رفض"
              : confirmDialog === "cancel"
                ? "إلغاء الطلبية"
                : orderActionFlow[confirmDialog]?.button}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default OrderDetail;
