/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";

// ─── Mock Orders for selection ────────────────────────────────────────────────
const availableOrders = [
  { id: "ORD-2024-010", customer: "شركة وهران للمقاولات", wilaya: "وهران", date: "2024-01-22", itemsCount: 4 },
  { id: "ORD-2024-011", customer: "مؤسسة البناء الغربي",  wilaya: "وهران", date: "2024-01-22", itemsCount: 3 },
  { id: "ORD-2024-012", customer: "شركة الإنشاء الحديث", wilaya: "وهران", date: "2024-01-21", itemsCount: 6 },
  { id: "ORD-2024-013", customer: "مجموعة النور",         wilaya: "الجزائر", date: "2024-01-22", itemsCount: 2 },
  { id: "ORD-2024-014", customer: "شركة الأمل",           wilaya: "سطيف", date: "2024-01-21", itemsCount: 5 },
];

// ─── Mock wilaya-default customers ───────────────────────────────────────────
const wilayaDefaults = {
  "وهران":    "موزع وهران الرئيسي",
  "الجزائر": "موزع العاصمة",
  "سطيف":    "موزع سطيف الرئيسي",
  "قسنطينة": "موزع الشرق",
};

// ─── Mock Lines ───────────────────────────────────────────────────────────────
const mockLines = [
  { id: 1, product: "برغي M10 × 50mm",     category: "مسامير وبراغي", code: "BRG-010-50", qty: 500,  price: 12,   weight: 0.05 },
  { id: 2, product: "برغي M8 × 30mm",      category: "مسامير وبراغي", code: "BRG-008-30", qty: 300,  price: 9,    weight: 0.03 },
  { id: 3, product: "صامولة M10",           category: "مسامير وبراغي", code: "SAM-010",    qty: 400,  price: 6,    weight: 0.02 },
  { id: 4, product: "كابل كهربائي 2.5mm",  category: "كهرباء",         code: "KBL-25",     qty: 100,  price: 85,   weight: 0.3  },
  { id: 5, product: "شريط عازل كهربائي",   category: "كهرباء",         code: "SHR-EL",     qty: 50,   price: 45,   weight: 0.1  },
  { id: 6, product: "دهان أبيض 4L",        category: "دهانات",         code: "DHN-WHT-4",  qty: 20,   price: 650,  weight: 4    },
];

// ─── Orders Selection Dialog ──────────────────────────────────────────────────
function SelectOrdersDialog({ open, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [wilayaF, setWilayaF] = useState("all");
  const [selected, setSelected] = useState([]);

  const filtered = availableOrders.filter((o) => {
    const matchW = wilayaF === "all" || o.wilaya === wilayaF;
    const matchS = o.id.includes(search) || o.customer.includes(search);
    return matchW && matchS;
  });

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={wilayaF} onChange={(e) => setWilayaF(e.target.value)} displayEmpty>
              <MenuItem value="all">كل الولايات</MenuItem>
              {WILAYAS.map((w) => <MenuItem key={w.code} value={w.name}>{w.name}</MenuItem>)}
            </Select>
          </FormControl>
        </SoftBox>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={{ padding: "8px 12px", width: 40 }}></th>
              {["رقم الطلبية", "الزبون", "الولاية", "التاريخ", "أصناف"].map((h) => (
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
                  <SoftTypography variant="caption" fontWeight="bold" color="info">{o.id}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <SoftTypography variant="caption">{o.customer}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <SoftTypography variant="caption" fontWeight="bold">{o.wilaya}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <SoftTypography variant="caption" color="text">{o.date}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                  <SoftTypography variant="caption">{o.itemsCount}</SoftTypography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selected.length > 0 && (
          <SoftBox mt={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
            <SoftTypography variant="caption" fontWeight="bold" color="info">
              تم اختيار {selected.length} طلبية
            </SoftTypography>
            {(() => {
              const selectedOrders = availableOrders.filter(o => selected.includes(o.id));
              const wilayas = [...new Set(selectedOrders.map(o => o.wilaya))];
              if (wilayas.length === 1 && wilayaDefaults[wilayas[0]]) {
                return (
                  <SoftTypography variant="caption" color="text" display="block">
                    الزبون التلقائي لولاية {wilayas[0]}: <strong>{wilayaDefaults[wilayas[0]]}</strong>
                  </SoftTypography>
                );
              }
              if (wilayas.length > 1) {
                return (
                  <SoftTypography variant="caption" color="error" display="block">
                    تحذير: الطلبيات المختارة من ولايات مختلفة ({wilayas.join("، ")})
                  </SoftTypography>
                );
              }
              return null;
            })()}
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          onClick={() => { onConfirm(selected); onClose(); }}
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
  const [lines, setLines] = useState(mockLines);
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
        onConfirm={(ids) => console.log("Selected orders:", ids)}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default RoadInvoiceForm;
