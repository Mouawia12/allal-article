/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ordersApi } from "services";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import MergeIcon from "@mui/icons-material/CallMerge";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";

// ─── Wilaya defaults (static config, no backend GET endpoint yet) ─────────────
const wilayaDefaults = {
  "وهران":    "موزع وهران الرئيسي",
  "الجزائر": "موزع العاصمة",
  "سطيف":    "موزع سطيف الرئيسي",
  "قسنطينة": "موزع الشرق",
};

// ─── Orders Selection Dialog ──────────────────────────────────────────────────
function SelectOrdersDialog({ open, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOrdersLoading(true);
    ordersApi.list({ orderStatus: "confirmed", size: 100 })
      .then((r) => setOrders(r.data?.content ?? r.data ?? []))
      .catch(console.error)
      .finally(() => setOrdersLoading(false));
  }, [open]);

  const filtered = orders.filter((o) =>
    !search || (o.orderNumber ?? "").includes(search) || (o.customerName ?? "").includes(search)
  );

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleConfirm = () => {
    const selectedOrders = orders.filter((o) => selected.includes(o.id));
    const lines = selectedOrders.flatMap((o) =>
      (o.items ?? [])
        .filter((item) => item.lineStatus !== "cancelled" && (item.approvedQty ?? 0) > 0)
        .map((item) => ({
          id: `${o.id}-${item.id}`,
          product: item.productName ?? "—",
          category: "—",
          code: item.productSku ?? "—",
          qty: item.approvedQty ?? item.requestedQty ?? 0,
          price: Number(item.unitPrice ?? 0),
          weight: 0,
        }))
    );
    onConfirm(lines);
    setSelected([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>اختر الطلبيات للتحويل لفاتورة طريق</DialogTitle>
      <DialogContent dividers>
        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ width: 240 }}
          />
        </SoftBox>
        {ordersLoading ? (
          <SoftBox display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </SoftBox>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "8px 12px", width: 40 }}></th>
                {["رقم الطلبية", "الزبون", "التاريخ", "أصناف"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f0f2f5", background: selected.includes(o.id) ? "#f0f7ff" : "#fff" }}>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <Checkbox size="small" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <SoftTypography variant="caption" fontWeight="bold" color="info">{o.orderNumber}</SoftTypography>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <SoftTypography variant="caption">{o.customerName}</SoftTypography>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <SoftTypography variant="caption" color="text">{o.createdAt ? o.createdAt.slice(0, 10) : "—"}</SoftTypography>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    <SoftTypography variant="caption">{(o.items ?? []).length}</SoftTypography>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !ordersLoading && (
                <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">لا توجد طلبيات مؤكدة</SoftTypography>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
        {selected.length > 0 && (
          <SoftBox mt={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
            <SoftTypography variant="caption" fontWeight="bold" color="info">
              تم اختيار {selected.length} طلبية
            </SoftTypography>
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          onClick={handleConfirm}
          disabled={selected.length === 0}>
          تحويل {selected.length > 0 ? `(${selected.length})` : ""}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
function RoadInvoiceForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromOrders = location.pathname.includes("from-orders");

  const [wilaya, setWilaya] = useState("وهران");
  const [customer, setCustomer] = useState(wilayaDefaults["وهران"] || "");
  const [driver, setDriver] = useState("");
  const [lines, setLines] = useState([]);
  const [selectOrdersOpen, setSelectOrdersOpen] = useState(isFromOrders);

  const handleWilayaChange = (w) => {
    setWilaya(w);
    if (wilayaDefaults[w]) setCustomer(wilayaDefaults[w]);
    else setCustomer("");
  };

  const handleDeleteLine = (id) => setLines((prev) => prev.filter((l) => l.id !== id));

  const handleQtyChange = (id, qty) =>
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, qty: Number(qty) } : l));

  const handlePriceChange = (id, price) =>
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, price: Number(price) } : l));

  // Merge items of same category — sum qty of duplicates, keep first, remove rest
  const handleMergeItems = () => {
    const grouped = {};
    lines.forEach((l) => {
      const key = l.category;
      if (!grouped[key]) {
        grouped[key] = { ...l };
      } else {
        grouped[key].qty += l.qty;
      }
    });
    setLines(Object.values(grouped));
  };

  const totalWeight = lines.reduce((s, l) => s + l.qty * l.weight, 0).toFixed(1);
  const totalAmount = lines.reduce((s, l) => s + l.qty * l.price, 0).toLocaleString();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/road-invoices")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">
              {isFromOrders ? "تحويل طلبيات إلى فاتورة طريق" : "فاتورة طريق جديدة"}
            </SoftTypography>
            <SoftTypography variant="body2" color="text">قم بمراجعة الأصناف وتعديلها قبل الطباعة</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            {isFromOrders && (
              <SoftButton variant="outlined" color="secondary" size="small" startIcon={<AddIcon />}
                onClick={() => setSelectOrdersOpen(true)}>
                إضافة طلبيات
              </SoftButton>
            )}
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}>
              طباعة
            </SoftButton>
            <SoftButton variant="outlined" color="success" size="small" startIcon={<WhatsAppIcon />}
              sx={{ color: "#25D366", borderColor: "#25D366" }}>
              واتساب PDF
            </SoftButton>
            <SoftButton variant="gradient" color="info" size="small">حفظ الفاتورة</SoftButton>
          </SoftBox>
        </SoftBox>

        <Grid container spacing={2}>
          {/* Left: Header Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5, height: "100%" }}>
              <SoftTypography variant="button" fontWeight="bold" mb={2} display="block">
                معلومات الفاتورة
              </SoftTypography>
              <SoftBox display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth>
                  <InputLabel>الولاية</InputLabel>
                  <Select value={wilaya} onChange={(e) => handleWilayaChange(e.target.value)} label="الولاية">
                    {WILAYAS.map((w) => (
                      <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="الزبون"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  fullWidth
                  helperText={wilayaDefaults[wilaya] ? `تلقائي: ${wilayaDefaults[wilaya]}` : "لا يوجد زبون تلقائي لهذه الولاية"}
                />
                <TextField
                  size="small"
                  label="السائق"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  fullWidth
                />
                <TextField size="small" label="تاريخ الفاتورة" type="date" fullWidth
                  defaultValue={new Date().toISOString().split("T")[0]}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField size="small" label="ملاحظات" multiline rows={3} fullWidth />
              </SoftBox>
            </Card>
          </Grid>

          {/* Right: Items Table */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <SoftTypography variant="button" fontWeight="bold">
                  الأصناف ({lines.length})
                </SoftTypography>
                <SoftBox display="flex" gap={1} alignItems="center">
                  <SoftTypography variant="caption" color="secondary">
                    الوزن الإجمالي: <strong>{totalWeight} كغ</strong>
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary" mx={1}>|</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    الإجمالي: <strong>{totalAmount} دج</strong>
                  </SoftTypography>
                  <Tooltip title="دمج الأصناف المتشابهة في نفس الفئة لتوفير المساحة عند الطباعة">
                    <SoftButton variant="outlined" color="warning" size="small" startIcon={<MergeIcon />}
                      onClick={handleMergeItems}>
                      دمج الأصناف
                    </SoftButton>
                  </Tooltip>
                </SoftBox>
              </SoftBox>

              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["الصنف", "الفئة", "الكمية", "السعر (دج)", "الوزن (كغ)", "الإجمالي", "حذف"].map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "8px 10px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{l.product}</SoftTypography>
                          <SoftTypography variant="caption" color="secondary" display="block">{l.code}</SoftTypography>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <SoftTypography variant="caption" color="text">{l.category}</SoftTypography>
                        </td>
                        <td style={{ padding: "8px 10px", minWidth: 80 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={l.qty}
                            onChange={(e) => handleQtyChange(l.id, e.target.value)}
                            inputProps={{ min: 1, style: { padding: "4px 8px", width: 70 } }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", minWidth: 90 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={l.price}
                            onChange={(e) => handlePriceChange(l.id, e.target.value)}
                            inputProps={{ min: 0, style: { padding: "4px 8px", width: 80 } }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="text">
                            {(l.qty * l.weight).toFixed(2)}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">
                            {(l.qty * l.price).toLocaleString()}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <Tooltip title="حذف الصنف">
                            <IconButton size="small" color="error" onClick={() => handleDeleteLine(l.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SoftBox>

              <Divider sx={{ my: 2 }} />
              <SoftBox display="flex" justifyContent="flex-end" gap={3}>
                <SoftBox textAlign="right">
                  <SoftTypography variant="caption" color="secondary">الوزن الكلي</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">{totalWeight} كغ</SoftTypography>
                </SoftBox>
                <SoftBox textAlign="right">
                  <SoftTypography variant="caption" color="secondary">إجمالي الفاتورة</SoftTypography>
                  <SoftTypography variant="h5" fontWeight="bold" color="info">{totalAmount} دج</SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <SelectOrdersDialog
        open={selectOrdersOpen}
        onClose={() => setSelectOrdersOpen(false)}
        onConfirm={(newLines) => setLines((prev) => {
          const existingCodes = new Set(prev.map((l) => l.code));
          const toAdd = newLines.filter((l) => !existingCodes.has(l.code));
          return [...prev, ...toAdd];
        })}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default RoadInvoiceForm;
