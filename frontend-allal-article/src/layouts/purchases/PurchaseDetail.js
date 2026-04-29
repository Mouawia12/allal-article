/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import PrintIcon from "@mui/icons-material/Print";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ResourceLockBanner from "components/ResourceLockBanner";
const getMockResourceLock = () => null;

import {
  calcLineTotal,
  calcReturnLineTotal,
  formatDZD,
  paymentConfig,
  statusConfig,
} from "./mockData";
import { purchasesApi } from "services";

function InfoItem({ label, value }) {
  return (
    <SoftBox>
      <SoftTypography variant="caption" color="secondary" display="block" fontWeight="bold">
        {label}
      </SoftTypography>
      <SoftTypography variant="button" color="text" fontWeight="medium">
        {value || "—"}
      </SoftTypography>
    </SoftBox>
  );
}

function MetricCard({ label, value, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2 }}>
      <SoftBox display="flex" alignItems="center" gap={1.5}>
        <SoftBox
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color, fontSize: 20 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="button" fontWeight="bold" sx={{ color }}>
            {value}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary" display="block">
            {label}
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

const actionText = {
  confirm: {
    title: "إرسال أمر الشراء للمورد",
    body: "سيتم اعتماد أمر الشراء وإرساله للمورد ليصبح جاهزاً للاستلام عند وصول البضاعة.",
    button: "إرسال للمورد",
    color: "info",
  },
  receive: {
    title: "تسجيل الاستلام",
    body: "سيتم استلام كامل الكميات غير الملغاة وإيقاف تعديل أمر الشراء بعد دخوله للمخزون.",
    button: "تسجيل الاستلام",
    color: "success",
  },
  invoice: {
    title: "إنشاء فاتورة مورد",
    body: "سيتم إنشاء رقم فاتورة مورد تجريبي وربطه بأمر الشراء.",
    button: "إنشاء الفاتورة",
    color: "info",
  },
  pay: {
    title: "تسجيل دفعة",
    body: "سيتم اعتبار أمر الشراء مدفوعا بالكامل في هذه المحاكاة.",
    button: "تسجيل الدفع",
    color: "success",
  },
  cancel: {
    title: "إلغاء أمر الشراء",
    body: "سيتم تحويل الأمر إلى حالة ملغى مع حفظ سبب الإلغاء في سجل النشاط.",
    button: "إلغاء الأمر",
    color: "error",
  },
};

export default function PurchaseDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [purchase, setPurchase] = useState(null);
  const [status, setStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [receivedBy, setReceivedBy] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [receivedLines, setReceivedLines] = useState([]);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returnReceiver, setReturnReceiver] = useState("");
  const [returnQuantities, setReturnQuantities] = useState({});
  const [dialog, setDialog] = useState(null);
  const [note, setNote] = useState("");
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    purchasesApi.getById(id)
      .then((r) => {
        const raw = r.data;
        const p = {
          returnItems: [],
          ...raw,
          id: raw.poNumber || String(raw.id),
          _id: raw.id,
          supplier: raw.supplierName || "—",
          date: raw.createdAt ? raw.createdAt.slice(0, 10) : "—",
          lines: (raw.items || []).map((item) => ({
            ...item,
            qty: item.orderedQty ?? 0,
            unitPrice: item.unitPrice ?? 0,
            taxRate: 0,
          })),
        };
        setPurchase(p);
        setStatus(p.status);
        setPaymentStatus(p.paymentStatus);
        setReceivedBy(p.receivedBy || "");
        setInvoiceNo(p.invoiceNo || "");
        const lines = p.lines.map((l) => ({ receivedQty: 0, returnedQty: 0, ...l }));
        setReceivedLines(lines);
        setReturnQuantities(Object.fromEntries(lines.map((l) => [l.id, 0])));
        setActivity([
          { time: p.date, user: "—", action: "أنشأ أمر الشراء" },
          ...(p.receivedDate ? [{ time: p.receivedDate, user: "—", action: "سجل استلام البضاعة" }] : []),
        ]);
      })
      .catch(console.error);
  }, [id]);

  const totals = useMemo(() => {
    const untaxed = receivedLines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0);
    const total = receivedLines.reduce((sum, line) => sum + calcLineTotal(line), 0);
    const receivedQty = receivedLines.reduce((sum, line) => sum + Number(line.receivedQty || 0), 0);
    const returnedQty = receivedLines.reduce((sum, line) => sum + Number(line.returnedQty || 0), 0);
    const returnAmount = receivedLines.reduce((sum, line) => sum + calcReturnLineTotal(line), 0);
    const orderedQty = receivedLines.reduce((sum, line) => sum + Number(line.qty || 0), 0);
    return {
      untaxed,
      tax: total - untaxed,
      total,
      receivedQty,
      returnedQty,
      returnAmount,
      netReceivedQty: Math.max(receivedQty - returnedQty, 0),
      orderedQty,
    };
  }, [receivedLines]);

  const statusInfo = statusConfig[status] || { label: status, color: "secondary" };
  const paymentInfo = paymentConfig[paymentStatus] || { label: paymentStatus, color: "secondary" };
  const currentAction = dialog ? actionText[dialog] : null;
  const editLock = purchase ? getMockResourceLock("purchase_order", purchase.id) : null;
  const purchaseLockedForEdit = ["received", "cancelled"].includes(status);

  if (!purchase) return <DashboardLayout><DashboardNavbar /><SoftBox py={3} px={3}><SoftTypography>جارٍ التحميل...</SoftTypography></SoftBox><Footer /></DashboardLayout>;
  const returnableLines = receivedLines.filter(
    (line) => Number(line.receivedQty || 0) > Number(line.returnedQty || 0)
  );
  const returnDraftQty = receivedLines.reduce(
    (sum, line) => sum + Number(returnQuantities[line.id] || 0),
    0
  );
  const returnDraftAmount = receivedLines.reduce(
    (sum, line) => sum + calcReturnLineTotal(line, Number(returnQuantities[line.id] || 0)),
    0
  );
  const hasReturnableQty = returnableLines.length > 0;

  const appendActivity = (action) => {
    setActivity((items) => [
      { time: new Date().toLocaleString("ar-DZ"), user: "المستخدم الحالي", action },
      ...items,
    ]);
  };

  const resetReturnDraft = () => {
    setReturnQuantities(Object.fromEntries(receivedLines.map((line) => [line.id, 0])));
    setReturnNote("");
    setReturnReceiver("");
  };

  const closeReturnDialog = () => {
    setReturnDialog(false);
    resetReturnDraft();
  };

  const setReturnQty = (line, value) => {
    const maxQty = Math.max(0, Number(line.receivedQty || 0) - Number(line.returnedQty || 0));
    const parsed = Number(value);
    const normalized = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), maxQty) : 0;

    setReturnQuantities((items) => ({ ...items, [line.id]: normalized }));
  };

  const handleRegisterReturn = () => {
    if (returnDraftQty <= 0) return;

    const draft = { ...returnQuantities };
    setReceivedLines((lines) =>
      lines.map((line) => {
        const requestedQty = Number(draft[line.id] || 0);
        const availableQty = Math.max(
          0,
          Number(line.receivedQty || 0) - Number(line.returnedQty || 0)
        );
        const confirmedQty = Math.min(requestedQty, availableQty);

        if (!confirmedQty) return line;
        return { ...line, returnedQty: Number(line.returnedQty || 0) + confirmedQty };
      })
    );

    appendActivity(
      `سجل مرتجع مشتريات بكمية ${returnDraftQty} وقيمة ${formatDZD(returnDraftAmount)} دج${
        returnReceiver ? ` - مستلم المورد: ${returnReceiver}` : ""
      }${returnNote.trim() ? ` - ${returnNote.trim()}` : ""}`
    );
    closeReturnDialog();
  };

  const runAction = () => {
    if (dialog === "confirm") {
      purchasesApi.confirm(id)
        .then(() => { setStatus("confirmed"); appendActivity("أرسل أمر الشراء للمورد"); })
        .catch(console.error);
    }
    if (dialog === "receive") {
      purchasesApi.receive(id, { receivedBy: "المستخدم الحالي" })
        .then(() => {
          setStatus("received");
          setReceivedBy("المستخدم الحالي");
          setReceivedLines((lines) =>
            lines.map((line) => ({ ...line, receivedQty: line.qty, returnedQty: line.returnedQty || 0 }))
          );
          appendActivity("سجل استلام كامل الكميات وأقفل تعديل أمر الشراء");
        })
        .catch(console.error);
    }
    if (dialog === "invoice") {
      const nextInvoice = invoiceNo || `BILL-${new Date().getFullYear()}-025`;
      setInvoiceNo(nextInvoice);
      appendActivity(`أنشأ فاتورة المورد ${nextInvoice}`);
    }
    if (dialog === "pay") {
      setPaymentStatus("paid");
      appendActivity("سجل دفع فاتورة المورد بالكامل");
    }
    if (dialog === "cancel") {
      purchasesApi.cancel(id)
        .then(() => {
          setStatus("cancelled");
          appendActivity(note.trim() ? `ألغى أمر الشراء: ${note.trim()}` : "ألغى أمر الشراء");
        })
        .catch(console.error);
    }
    setDialog(null);
    setNote("");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <IconButton size="small" onClick={() => navigate("/purchases")}>
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1} minWidth={220}>
            <SoftBox display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
              <SoftTypography variant="h4" fontWeight="bold">{purchase.id}</SoftTypography>
              <SoftBadge variant="gradient" color={statusInfo.color} size="sm" badgeContent={statusInfo.label} container />
              <SoftBadge variant="contained" color={paymentInfo.color} size="sm" badgeContent={paymentInfo.label} container />
            </SoftBox>
            <SoftTypography variant="body2" color="text">تفاصيل أمر الشراء ومتابعة الاستلام والفوترة</SoftTypography>
          </SoftBox>

          <SoftBox display="flex" gap={1} flexWrap="wrap">
            {status === "pending" && (
              <SoftButton size="small" variant="gradient" color="success" startIcon={<CheckCircleIcon />} onClick={() => setDialog("confirm")}>
                إرسال للمورد
              </SoftButton>
            )}
            {status === "confirmed" && (
              <SoftButton size="small" variant="gradient" color="info" startIcon={<LocalShippingIcon />} onClick={() => setDialog("receive")}>
                تسجيل الاستلام
              </SoftButton>
            )}
            {status !== "cancelled" && (
              <>
                <SoftButton size="small" variant="outlined" color="info" startIcon={<ReceiptLongIcon />} onClick={() => setDialog("invoice")}>
                  {invoiceNo ? "عرض فاتورة المورد" : "إنشاء فاتورة مورد"}
                </SoftButton>
                {hasReturnableQty && (
                  <SoftButton
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<AssignmentReturnIcon />}
                    onClick={() => setReturnDialog(true)}
                  >
                    مرتجع مشتريات
                  </SoftButton>
                )}
                {paymentStatus !== "paid" && (
                  <SoftButton size="small" variant="outlined" color="success" startIcon={<PaymentIcon />} onClick={() => setDialog("pay")}>
                    تسجيل دفعة
                  </SoftButton>
                )}
                <SoftButton
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<EditIcon />}
                  disabled={Boolean(editLock) || purchaseLockedForEdit}
                  onClick={() => navigate(`/purchases/${purchase.id}/edit`)}
                >
                  تعديل
                </SoftButton>
                <SoftButton size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setDialog("cancel")}>
                  إلغاء
                </SoftButton>
              </>
            )}
            <Tooltip title="طباعة أمر الشراء">
              <IconButton size="small" sx={{ border: "1px solid #eee", borderRadius: 1.5 }} onClick={() => window.print()}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </SoftBox>
        </SoftBox>

        <ResourceLockBanner lock={editLock} resourceLabel="أمر الشراء" />

        {status === "received" && (
          <SoftBox mb={2} p={1.5} sx={{ background: "#f0fff4", border: "1px solid #b7eb8f", borderRadius: 2 }}>
            <SoftTypography variant="body2" color="text">
              أمر الشراء مستلم بالكامل، لذلك تم إيقاف تعديل السطور. أي تصحيح بعد الاستلام يتم عبر مرتجع مشتريات أو قيد تسوية.
            </SoftTypography>
          </SoftBox>
        )}

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard label="الإجمالي مع الرسم" value={`${formatDZD(totals.total)} دج`} color="#17c1e8" icon={ReceiptLongIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard label="غير خاضع للرسم" value={`${formatDZD(totals.untaxed)} دج`} color="#344767" icon={InventoryIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard label="الرسم TVA" value={`${formatDZD(totals.tax)} دج`} color="#fb8c00" icon={ReceiptLongIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard label="مرتجع مشتريات" value={`${totals.returnedQty} / ${formatDZD(totals.returnAmount)} دج`} color="#ea0606" icon={AssignmentReturnIcon} />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <MetricCard label="صافي المستلم" value={`${totals.netReceivedQty} / ${totals.orderedQty}`} color="#82d616" icon={LocalShippingIcon} />
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5, mb: 2 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>بيانات الأمر</SoftTypography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><InfoItem label="المورد" value={purchase.supplier} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="هاتف المورد" value={purchase.supplierPhone} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="المخزن" value={purchase.warehouse} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="تاريخ الطلب" value={purchase.date} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="التاريخ المتوقع" value={purchase.expectedDate} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="المستلِم" value={receivedBy} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="طالب الشراء" value={purchase.requestedBy} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="فاتورة المورد" value={invoiceNo} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="قائمة الأسعار" value={purchase.priceListName || "أسعار شراء الموردين"} /></Grid>
                <Grid item xs={12} md={4}><InfoItem label="عنوان المورد" value={purchase.supplierAddress} /></Grid>
              </Grid>
              {purchase.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">ملاحظات</SoftTypography>
                  <SoftTypography variant="body2" color="text">{purchase.notes}</SoftTypography>
                </>
              )}
            </Card>

            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>أسطر المشتريات</SoftTypography>
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["الكود", "الصنف", "المطلوب", "المستلم", "المرتجع", "الصافي", "الوحدة", "سعر الوحدة", "TVA", "الإجمالي"].map((header) => (
                        <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" color="secondary" fontWeight="bold">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {receivedLines.map((line, index) => {
                      const returnedQty = Number(line.returnedQty || 0);
                      const receivedQty = Number(line.receivedQty || 0);
                      const fullyReturned = receivedQty > 0 && returnedQty >= receivedQty;
                      const partiallyReturned = returnedQty > 0 && !fullyReturned;
                      const netQty = Math.max(receivedQty - returnedQty, 0);
                      const rowBg = fullyReturned ? "#fee2e2" : partiallyReturned ? "#fff7ed" : index % 2 === 0 ? "#fff" : "#fafbfc";

                      return (
                        <tr key={line.id} style={{ borderBottom: "1px solid #f0f2f5", background: rowBg }}>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="info" fontWeight="bold">{line.productCode}</SoftTypography></td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography
                              variant="caption"
                              fontWeight="medium"
                              sx={
                                fullyReturned
                                  ? { color: "#e53935", textDecoration: "line-through" }
                                  : partiallyReturned
                                    ? { color: "#c2410c" }
                                    : {}
                              }
                            >
                              {line.product}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{line.qty}</SoftTypography></td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: receivedQty >= line.qty ? "#82d616" : "#fb8c00" }}>
                              {receivedQty}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography
                              variant="caption"
                              fontWeight={returnedQty > 0 ? "bold" : "regular"}
                              sx={{ color: fullyReturned ? "#e53935" : partiallyReturned ? "#c2410c" : "#8392ab" }}
                            >
                              {returnedQty || "—"}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: netQty > 0 ? "#344767" : "#e53935" }}>
                              {netQty}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{line.unit}</SoftTypography></td>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{formatDZD(line.unitPrice)}</SoftTypography></td>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{line.taxRate}%</SoftTypography></td>
                          <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" fontWeight="bold">{formatDZD(calcLineTotal(line))}</SoftTypography></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </SoftBox>
              <SoftBox mt={2} display="flex" gap={2} flexWrap="wrap">
                <SoftTypography variant="caption" color="secondary" fontWeight="bold">دلالة الألوان:</SoftTypography>
                {[
                  { color: "#fff7ed", label: "مرتجع جزئي" },
                  { color: "#fee2e2", label: "مرتجع بالكامل" },
                ].map((item) => (
                  <SoftBox key={item.label} display="flex" alignItems="center" gap={0.5}>
                    <SoftBox width={14} height={14} borderRadius="3px" sx={{ background: item.color, border: "1px solid #e0e0e0" }} />
                    <SoftTypography variant="caption" color="text">{item.label}</SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5, mb: 2 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={1.5}>
                <AssignmentReturnIcon fontSize="small" sx={{ color: "#ea0606" }} />
                <SoftTypography variant="h6" fontWeight="bold">أثر المرتجع محاسبياً</SoftTypography>
              </SoftBox>
              {[
                "تخفيض ذمة المورد أو إنشاء إشعار دائن مرتبط بفاتورة المورد.",
                "عكس TVA القابل للاسترجاع حسب قيمة الكمية المرتجعة.",
                "تسجيل حركة خروج مخزون من المخزن المرتبط بأمر الشراء.",
                `ربط المرتجع بالفاتورة ${invoiceNo || "غير منشأة بعد"} لحفظ أثر التدقيق.`,
              ].map((item) => (
                <SoftBox key={item} display="flex" gap={1} mb={1}>
                  <SoftTypography variant="caption" color="error" fontWeight="bold">•</SoftTypography>
                  <SoftTypography variant="caption" color="text">{item}</SoftTypography>
                </SoftBox>
              ))}
            </Card>

            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>سجل النشاط</SoftTypography>
              {activity.map((item, index) => (
                <SoftBox key={`${item.time}-${index}`} pb={index === activity.length - 1 ? 0 : 1.5} mb={index === activity.length - 1 ? 0 : 1.5} borderBottom={index === activity.length - 1 ? "none" : "1px solid #eee"}>
                  <SoftTypography variant="caption" color="secondary" display="block">{item.time}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">{item.user}</SoftTypography>
                  <SoftTypography variant="caption" color="text" display="block">{item.action}</SoftTypography>
                </SoftBox>
              ))}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">{currentAction?.title}</SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <SoftTypography variant="body2" color="text">{currentAction?.body}</SoftTypography>
          {dialog === "cancel" && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              size="small"
              label="سبب الإلغاء"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="text" color="secondary" onClick={() => setDialog(null)}>تراجع</SoftButton>
          <SoftButton variant="gradient" color={currentAction?.color || "info"} onClick={runAction}>
            {currentAction?.button}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={returnDialog} onClose={closeReturnDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">مرتجع مشتريات — {purchase.id}</SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <SoftBox
            mb={2}
            p={1.5}
            sx={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 2 }}
          >
            <SoftTypography variant="body2" color="text">
              المرتجع سيخفض المخزون وصافي ذمة المورد، ويولّد أثر TVA عكسي بقيمة الكميات المسجلة.
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
              معاينة: {returnDraftQty} كمية مرتجعة بقيمة {formatDZD(returnDraftAmount)} دج.
            </SoftTypography>
          </SoftBox>

          <SoftBox sx={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8f9fa" }}>
                  {["الصنف", "المستلم", "مرتجع سابق", "المتاح", "كمية المرتجع", "الأثر المالي"].map((header) => (
                    <th key={header} style={{ padding: "8px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <SoftTypography variant="caption" color="secondary" fontWeight="bold">{header}</SoftTypography>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {returnableLines.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 32 }}>
                      <SoftTypography variant="body2" color="text">لا توجد كميات مستلمة قابلة للمرتجع</SoftTypography>
                    </td>
                  </tr>
                ) : (
                  returnableLines.map((line) => {
                    const receivedQty = Number(line.receivedQty || 0);
                    const alreadyReturned = Number(line.returnedQty || 0);
                    const availableQty = Math.max(receivedQty - alreadyReturned, 0);
                    const draftQty = Number(returnQuantities[line.id] || 0);

                    return (
                      <tr key={line.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                        <td style={{ padding: "8px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{line.product}</SoftTypography>
                          <SoftTypography variant="caption" color="secondary" display="block">{line.productCode}</SoftTypography>
                        </td>
                        <td style={{ padding: "8px 12px" }}><SoftTypography variant="caption">{receivedQty}</SoftTypography></td>
                        <td style={{ padding: "8px 12px" }}>
                          <SoftTypography variant="caption" color={alreadyReturned > 0 ? "error" : "secondary"} fontWeight={alreadyReturned > 0 ? "bold" : "regular"}>
                            {alreadyReturned || "—"}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "8px 12px" }}><SoftTypography variant="caption" fontWeight="bold">{availableQty}</SoftTypography></td>
                        <td style={{ padding: "8px 12px" }}>
                          <TextField
                            type="number"
                            size="small"
                            value={draftQty}
                            onChange={(event) => setReturnQty(line, event.target.value)}
                            inputProps={{
                              min: 0,
                              max: availableQty,
                              step: 1,
                              style: { padding: "4px 8px", width: 90, textAlign: "center" },
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color={draftQty > 0 ? "error" : "secondary"}>
                            {draftQty > 0 ? `${formatDZD(calcReturnLineTotal(line, draftQty))} دج` : "—"}
                          </SoftTypography>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </SoftBox>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                size="small"
                label="مستلم المورد / رقم إذن الإرجاع"
                value={returnReceiver}
                onChange={(event) => setReturnReceiver(event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                size="small"
                label="سبب المرتجع"
                value={returnNote}
                onChange={(event) => setReturnNote(event.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftBox flex={1}>
            <SoftTypography variant="caption" color="secondary">
              المبلغ العكسي: {formatDZD(returnDraftAmount)} دج
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="text" color="secondary" onClick={closeReturnDialog}>تراجع</SoftButton>
          <SoftButton variant="gradient" color="error" disabled={returnDraftQty <= 0} onClick={handleRegisterReturn}>
            تسجيل المرتجع
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}
