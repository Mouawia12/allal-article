/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";
import {
  CustomerInfoDialog,
  emptyNewCustomerForm,
  mockCustomers as baseCustomers,
} from "./NewOrder";

// ─── Mock Data (same source-of-truth as NewOrder.js) ──────────────────────────
const mockProducts = [
  { id: 1,  name: "برغي M10 × 50mm",    code: "BRG-010-50", category: "مسامير وبراغي", stock: 850,  unit: "قطعة", weightPerUnit: 0.05,  unitsPerPackage: 100, packageUnit: "كرطون", price: 12 },
  { id: 2,  name: "برغي M8 × 30mm",     code: "BRG-008-30", category: "مسامير وبراغي", stock: 1200, unit: "قطعة", weightPerUnit: 0.03,  unitsPerPackage: 200, packageUnit: "كرطون", price: 8  },
  { id: 3,  name: "صامولة M10",          code: "SAM-010",    category: "مسامير وبراغي", stock: 600,  unit: "قطعة", weightPerUnit: 0.02,  unitsPerPackage: 500, packageUnit: "كيس",   price: 5  },
  { id: 4,  name: "مفتاح ربط 17mm",     code: "MFT-017",    category: "أدوات",          stock: 45,   unit: "قطعة", weightPerUnit: 0.35,  unitsPerPackage: 12,  packageUnit: "علبة",  price: 450 },
  { id: 5,  name: "مفتاح ربط 22mm",     code: "MFT-022",    category: "أدوات",          stock: 30,   unit: "قطعة", weightPerUnit: 0.5,   unitsPerPackage: 12,  packageUnit: "علبة",  price: 620 },
  { id: 6,  name: "كماشة عالمية",        code: "KMA-UNI",    category: "أدوات",          stock: 0,    unit: "قطعة", weightPerUnit: 0.4,   unitsPerPackage: 6,   packageUnit: "علبة",  price: 380 },
  { id: 7,  name: "كابل كهربائي 2.5mm", code: "KBL-25",     category: "كهرباء",         stock: 500,  unit: "متر",  weightPerUnit: 0.3,   unitsPerPackage: 100, packageUnit: "رزمة",  price: 95  },
  { id: 8,  name: "كابل كهربائي 1.5mm", code: "KBL-15",     category: "كهرباء",         stock: 800,  unit: "متر",  weightPerUnit: 0.2,   unitsPerPackage: 100, packageUnit: "رزمة",  price: 65  },
  { id: 9,  name: "شريط عازل كهربائي",  code: "SHR-EL",     category: "كهرباء",         stock: 200,  unit: "لفة",  weightPerUnit: 0.1,   unitsPerPackage: 20,  packageUnit: "كرطون", price: 35  },
  { id: 10, name: "أنبوب PVC 2 بوصة",   code: "ANB-PVC-2",  category: "سباكة",          stock: 100,  unit: "متر",  weightPerUnit: 1.2,   unitsPerPackage: 6,   packageUnit: "طرد",   price: 280 },
  { id: 11, name: "أنبوب PVC 1 بوصة",   code: "ANB-PVC-1",  category: "سباكة",          stock: 150,  unit: "متر",  weightPerUnit: 0.7,   unitsPerPackage: 6,   packageUnit: "طرد",   price: 180 },
  { id: 12, name: "صنبور مياه",          code: "SNB-MYA",    category: "سباكة",          stock: 25,   unit: "قطعة", weightPerUnit: 0.45,  unitsPerPackage: 10,  packageUnit: "علبة",  price: 320 },
  { id: 13, name: "دهان أبيض 4L",       code: "DHN-WHT-4",  category: "دهانات",         stock: 80,   unit: "علبة", weightPerUnit: 4.5,   unitsPerPackage: 4,   packageUnit: "كرطون", price: 1850 },
  { id: 14, name: "دهان رمادي 4L",      code: "DHN-GRY-4",  category: "دهانات",         stock: 60,   unit: "علبة", weightPerUnit: 4.5,   unitsPerPackage: 4,   packageUnit: "كرطون", price: 1850 },
  { id: 15, name: "شريط عازل حراري",    code: "SHR-HRR",    category: "مواد عزل",       stock: 120,  unit: "لفة",  weightPerUnit: 0.15,  unitsPerPackage: 24,  packageUnit: "كرطون", price: 55  },
  { id: 16, name: "لوح خشبي 2×4",      code: "LWH-2X4",    category: "معدات",          stock: 200,  unit: "قطعة", weightPerUnit: 2.0,   unitsPerPackage: 10,  packageUnit: "رزمة",  price: 750 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function newRow(id) {
  return { id, product: null, qty: "", inputValue: "" };
}

function calcWeight(product, qty) {
  if (!product || !qty) return 0;
  return (product.weightPerUnit * Number(qty)).toFixed(2);
}

function calcPackages(product, qty) {
  if (!product || !qty || !product.unitsPerPackage) return null;
  return Math.ceil(Number(qty) / product.unitsPerPackage);
}

function getCustomerDebt(customer) {
  if (!customer) return 0;
  if (typeof customer.balance === "number") return customer.balance;
  return Math.max(0, (customer.totalAmount || 0) - (customer.paidAmount || 0) - (customer.openingBalance || 0));
}

// ─── Row Component ────────────────────────────────────────────────────────────
function OrderRow({ row, rowIndex, totalRows, onChange, onDelete, onProductConfirmed, onQtyEnter, qtyRef }) {
  const product = row.product;
  const stockColor = !product ? "inherit" : product.stock === 0 ? "#ea0606" : product.stock < 10 ? "#fb8c00" : "#66BB6A";

  return (
    <TableRow
      sx={{
        "&:hover": { backgroundColor: "#f8f9fa" },
        borderRight: "3px solid transparent",
        ...(product && { borderRight: "3px solid #17c1e8" }),
      }}
    >
      {/* # */}
      <TableCell sx={{ width: 40, color: "#8392ab", fontSize: 12, py: 0.8, textAlign: "center" }}>
        {rowIndex + 1}
      </TableCell>

      {/* Product search */}
      <TableCell sx={{ py: 0.5, minWidth: 260 }}>
        <Autocomplete
          size="small"
          options={mockProducts}
          value={product}
          inputValue={row.inputValue}
          onInputChange={(_, v) => onChange(row.id, "inputValue", v)}
          onChange={(_, selected) => {
            onChange(row.id, "product", selected);
            onChange(row.id, "inputValue", selected ? selected.name : "");
            if (selected) onProductConfirmed(row.id);
          }}
          getOptionLabel={(o) => `${o.name} (${o.code})`}
          filterOptions={(opts, { inputValue }) => {
            const q = inputValue.toLowerCase();
            return opts.filter(
              (o) => o.name.includes(q) || o.code.toLowerCase().includes(q) || o.category.includes(q)
            );
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.id} style={{ padding: "6px 12px" }}>
              <SoftBox>
                <SoftTypography variant="button" fontWeight="medium" display="block" lineHeight={1.3}>
                  {option.name}
                </SoftTypography>
                <SoftTypography variant="caption" color="secondary">
                  {option.code} · {option.category} · مخزون:{" "}
                  <span style={{ color: option.stock === 0 ? "#ea0606" : "#66BB6A", fontWeight: 600 }}>
                    {option.stock}
                  </span>
                </SoftTypography>
              </SoftBox>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="اكتب اسم الصنف أو الكود..."
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: 1.5 },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
              }}
            />
          )}
          noOptionsText="لا توجد نتائج"
          clearOnBlur={false}
          blurOnSelect
        />
      </TableCell>

      {/* Qty */}
      <TableCell sx={{ py: 0.5, width: 100 }}>
        <TextField
          size="small"
          type="number"
          value={row.qty}
          inputRef={qtyRef}
          placeholder="الكمية"
          disabled={!product}
          inputProps={{ min: 1, style: { textAlign: "center" } }}
          onChange={(e) => onChange(row.id, "qty", e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onQtyEnter(row.id);
            }
          }}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": { fontSize: 13, borderRadius: 1.5 },
            "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
          }}
        />
      </TableCell>

      {/* Unit */}
      <TableCell sx={{ py: 0.5, width: 70, textAlign: "center" }}>
        <SoftTypography variant="caption" color="secondary">
          {product?.unit ?? "—"}
        </SoftTypography>
      </TableCell>

      {/* Packages */}
      <TableCell sx={{ py: 0.5, width: 110, textAlign: "center" }}>
        {product && row.qty ? (
          <SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#7928ca" }}>
            {calcPackages(product, row.qty)} {product.packageUnit}
          </SoftTypography>
        ) : (
          <SoftTypography variant="caption" color="secondary">—</SoftTypography>
        )}
      </TableCell>

      {/* Weight */}
      <TableCell sx={{ py: 0.5, width: 90, textAlign: "center" }}>
        {product && row.qty ? (
          <SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#fb8c00" }}>
            {calcWeight(product, row.qty)} كغ
          </SoftTypography>
        ) : (
          <SoftTypography variant="caption" color="secondary">—</SoftTypography>
        )}
      </TableCell>

      {/* Stock */}
      <TableCell sx={{ py: 0.5, width: 80, textAlign: "center" }}>
        <SoftTypography variant="caption" fontWeight="medium" sx={{ color: stockColor }}>
          {product ? product.stock : "—"}
        </SoftTypography>
      </TableCell>

      {/* Code */}
      <TableCell sx={{ py: 0.5, width: 110 }}>
        <SoftTypography variant="caption" color="secondary">
          {product?.code ?? "—"}
        </SoftTypography>
      </TableCell>

      {/* Delete */}
      <TableCell sx={{ py: 0.5, width: 48, textAlign: "center" }}>
        <Tooltip title="حذف السطر">
          <span>
            <IconButton
              size="small"
              disabled={totalRows === 1 && !product}
              onClick={() => onDelete(row.id)}
              sx={{ color: "#ea0606", opacity: totalRows === 1 && !product ? 0.3 : 1 }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminNewOrder() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState(baseCustomers);
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ ...emptyNewCustomerForm });
  const [notes, setNotes] = useState("");
  const nextId = useRef(2);
  const [rows, setRows] = useState([newRow(1)]);
  const qtyRefs = useRef({});
  const customerDebt = getCustomerDebt(customer);

  // Auto-focus qty after product selected
  const handleProductConfirmed = useCallback((rowId) => {
    setTimeout(() => qtyRefs.current[rowId]?.focus(), 50);
  }, []);

  // Ensure there's always one empty trailing row
  useEffect(() => {
    const last = rows[rows.length - 1];
    if (last.product && last.qty) {
      setRows((prev) => [...prev, newRow(nextId.current++)]);
    }
  }, [rows]);

  const handleChange = useCallback((rowId, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));
  }, []);

  const handleDelete = useCallback((rowId) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== rowId);
      // Always keep at least one empty row
      if (next.length === 0) return [newRow(nextId.current++)];
      // If last row is filled, add empty trailing row
      const last = next[next.length - 1];
      if (last.product) return [...next, newRow(nextId.current++)];
      return next;
    });
  }, []);

  // Enter in qty → focus next row's product field
  const handleQtyEnter = useCallback((rowId) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      const current = prev[idx];
      if (!current.product || !current.qty) return prev;

      // If this was the last filled row, a new row will be added by the useEffect
      // We need to focus after state update
      setTimeout(() => {
        const nextRow = prev[idx + 1];
        if (nextRow) {
          // Focus the Autocomplete input of the next row
          const inputs = document.querySelectorAll(".admin-order-row-input");
          if (inputs[idx + 1]) inputs[idx + 1].focus();
        }
      }, 80);
      return prev;
    });
  }, []);

  // Derived totals
  const filledRows = rows.filter((r) => r.product && r.qty);
  const totalWeight = filledRows.reduce((s, r) => s + Number(calcWeight(r.product, r.qty)), 0);
  const totalItems = filledRows.length;

  const handleSave = (action) => {
    if (!customer) {
      alert("الرجاء اختيار الزبون أولاً");
      return;
    }
    if (filledRows.length === 0) {
      alert("الرجاء إضافة صنف واحد على الأقل");
      return;
    }
    const status = action === "confirm" ? "confirmed" : "draft";
    console.log("Order saved:", { customer, status, rows: filledRows, notes });
    navigate("/orders");
  };

  const updateNewCustomerField = (field, value) => {
    setNewCustomerForm((current) => ({ ...current, [field]: value }));
  };

  const addNewCustomer = () => {
    const name = newCustomerForm.name.trim();
    const phone = newCustomerForm.phone.trim();
    const wilaya = newCustomerForm.wilaya.trim();

    if (!name || !phone || !wilaya) return;

    const openingBalance = Math.max(0, Number(newCustomerForm.openingBalance) || 0);
    const newCustomer = {
      id: Math.max(...customers.map((item) => item.id), 0) + 1,
      name,
      phone,
      phone2: newCustomerForm.phone2.trim(),
      email: newCustomerForm.email.trim(),
      wilaya,
      address: newCustomerForm.address.trim(),
      salesperson: newCustomerForm.salesperson.trim() || "غير محدد",
      ordersCount: 0,
      lastOrder: "—",
      totalAmount: 0,
      paidAmount: 0,
      openingBalance,
      balance: openingBalance,
      status: "active",
      shippingRoute: newCustomerForm.shippingRoute.trim() || `${wilaya} - عام`,
      orders: [],
      payments: [],
    };

    setCustomers((current) => [...current, newCustomer]);
    setCustomer(newCustomer);
    setCustomerInfoOpen(false);
    setNewCustomerForm({ ...emptyNewCustomerForm });
    setNewCustomerDialog(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={3} px={{ xs: 1, md: 2 }}>
        {/* ── Header ── */}
        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <IconButton onClick={() => navigate("/orders")} size="small">
              <ArrowBackIcon />
            </IconButton>
            <SoftBox>
              <SoftTypography variant="h5" fontWeight="bold">إضافة طلبية جديدة</SoftTypography>
              <SoftTypography variant="caption" color="secondary">واجهة الإدارة</SoftTypography>
            </SoftBox>
          </SoftBox>

          <SoftBox display="flex" gap={1.5}>
            <SoftButton variant="outlined" color="secondary" size="small" onClick={() => handleSave("draft")}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} />
              حفظ كمسودة
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" onClick={() => handleSave("confirm")}>
              <CheckCircleOutlineIcon sx={{ mr: 0.5, fontSize: 16 }} />
              تأكيد الطلبية
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* ── Customer + Notes ── */}
        <Card sx={{ mb: 2, p: 2.5 }}>
          <SoftBox display="flex" gap={2} flexWrap="wrap" alignItems="flex-start">
            {/* Customer picker */}
            <SoftBox flex="1" minWidth={260}>
              <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
                الزبون *
              </SoftTypography>
              <SoftBox display="flex" gap={1}>
                <Autocomplete
                  options={customers}
                  value={customer}
                  onChange={(_, v) => {
                    setCustomer(v);
                    setCustomerInfoOpen(false);
                  }}
                  getOptionLabel={(o) => o.name}
                  filterOptions={(opts, { inputValue }) => {
                    const q = inputValue.toLowerCase();
                    return opts.filter((o) => o.name.includes(q) || o.phone.includes(q) || o.wilaya.includes(q));
                  }}
                  renderOption={(props, option) => {
                    const debt = getCustomerDebt(option);

                    return (
                      <li {...props} key={option.id}>
                        <SoftBox>
                          <SoftTypography variant="button" fontWeight="medium" display="block" lineHeight={1.3}>
                            {option.name}
                          </SoftTypography>
                          <SoftTypography variant="caption" color="secondary">
                            {option.wilaya} · {option.phone}
                            {debt > 0 && (
                              <span style={{ color: "#ea0606", marginRight: 6 }}>
                                · رصيد: {debt.toLocaleString()} دج
                              </span>
                            )}
                          </SoftTypography>
                        </SoftBox>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="ابحث باسم الزبون، الهاتف، أو الولاية..."
                      variant="outlined"
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                      }}
                    />
                  )}
                  noOptionsText="لا توجد نتائج"
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Tooltip title={customer ? "عرض بطاقة الزبون" : "إضافة زبون جديد"}>
                  <IconButton
                    size="small"
                    onClick={() => customer ? setCustomerInfoOpen(true) : setNewCustomerDialog(true)}
                    sx={{
                      width: 40,
                      border: `1px solid ${customer ? "#17c1e8" : "#e9ecef"}`,
                      borderRadius: 1,
                      color: customer ? "#17c1e8" : "#344767",
                    }}
                  >
                    {customer ? <VisibilityIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </SoftBox>
              {customer && (
                <SoftBox mt={1} display="flex" gap={1} flexWrap="wrap">
                  <SoftTypography variant="caption" sx={{ background: "#f0f4ff", px: 1, py: 0.3, borderRadius: 1 }}>
                    {customer.wilaya}
                  </SoftTypography>
                  <SoftTypography variant="caption" sx={{ background: "#f0f4ff", px: 1, py: 0.3, borderRadius: 1 }}>
                    {customer.phone}
                  </SoftTypography>
                  {customerDebt > 0 && (
                    <SoftTypography
                      variant="caption"
                      sx={{ background: "#fff0f0", color: "#ea0606", px: 1, py: 0.3, borderRadius: 1, fontWeight: 600 }}
                    >
                      رصيد: {customerDebt.toLocaleString()} دج
                    </SoftTypography>
                  )}
                </SoftBox>
              )}
            </SoftBox>

            {/* Notes */}
            <SoftBox flex="1" minWidth={220}>
              <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
                ملاحظات
              </SoftTypography>
              <TextField
                multiline
                rows={2}
                fullWidth
                size="small"
                placeholder="ملاحظات اختيارية..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                }}
              />
            </SoftBox>
          </SoftBox>
        </Card>

        {/* ── Order Lines Table ── */}
        <Card>
          <SoftBox p={2} pb={0} display="flex" alignItems="center" justifyContent="space-between">
            <SoftTypography variant="h6" fontWeight="bold">أصناف الطلبية</SoftTypography>
            {totalItems > 0 && (
              <SoftBox display="flex" gap={2}>
                <SoftTypography variant="caption" color="secondary">
                  {totalItems} صنف ·{" "}
                  <span style={{ color: "#fb8c00", fontWeight: 600 }}>{totalWeight.toFixed(2)} كغ</span>
                </SoftTypography>
              </SoftBox>
            )}
          </SoftBox>

          <TableContainer sx={{ mt: 1 }}>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {[
                    { label: "#",          w: 40  },
                    { label: "الصنف",      w: null },
                    { label: "الكمية",     w: 100 },
                    { label: "الوحدة",     w: 70  },
                    { label: "التعليب",    w: 110 },
                    { label: "الوزن",      w: 90  },
                    { label: "المخزون",    w: 80  },
                    { label: "الكود",      w: 110 },
                    { label: "",           w: 48  },
                  ].map(({ label, w }, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        py: 1,
                        fontWeight: 600,
                        fontSize: 11,
                        color: "#8392ab",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        ...(w ? { width: w } : {}),
                        ...(i === 0 || i >= 2 ? { textAlign: "center" } : {}),
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <OrderRow
                    key={row.id}
                    row={row}
                    rowIndex={idx}
                    totalRows={rows.length}
                    onChange={handleChange}
                    onDelete={handleDelete}
                    onProductConfirmed={handleProductConfirmed}
                    onQtyEnter={handleQtyEnter}
                    qtyRef={(el) => {
                      if (el) qtyRefs.current[row.id] = el;
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary footer */}
          {totalItems > 0 && (
            <>
              <Divider sx={{ mt: 1, mb: 0 }} />
              <SoftBox px={3} py={1.5} display="flex" justifyContent="flex-end" gap={4}>
                <SoftBox textAlign="center">
                  <SoftTypography variant="caption" color="secondary" display="block">عدد الأصناف</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">{totalItems}</SoftTypography>
                </SoftBox>
                <SoftBox textAlign="center">
                  <SoftTypography variant="caption" color="secondary" display="block">الوزن الإجمالي</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#fb8c00" }}>
                    {totalWeight.toFixed(2)} كغ
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </>
          )}
        </Card>

        {/* ── Bottom actions (duplicate for convenience) ── */}
        <SoftBox display="flex" justifyContent="flex-end" gap={1.5} mt={2}>
          <SoftButton variant="text" color="secondary" onClick={() => navigate("/orders")}>
            إلغاء
          </SoftButton>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => handleSave("draft")}>
            <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} />
            حفظ كمسودة
          </SoftButton>
          <SoftButton variant="gradient" color="success" size="small" onClick={() => handleSave("confirm")}>
            <CheckCircleOutlineIcon sx={{ mr: 0.5, fontSize: 16 }} />
            تأكيد الطلبية
          </SoftButton>
        </SoftBox>
      </SoftBox>

      <Dialog open={newCustomerDialog} onClose={() => setNewCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة زبون جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                autoFocus
                label="اسم الزبون / الشركة *"
                value={newCustomerForm.name}
                onChange={(event) => updateNewCustomerField("name", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
                value={newCustomerForm.phone}
                onChange={(event) => updateNewCustomerField("phone", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الهاتف الثاني"
                value={newCustomerForm.phone2}
                onChange={(event) => updateNewCustomerField("phone2", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>الولاية *</InputLabel>
                <Select
                  value={newCustomerForm.wilaya}
                  label="الولاية *"
                  onChange={(event) => updateNewCustomerField("wilaya", event.target.value)}
                >
                  {WILAYAS.map((wilaya) => (
                    <MenuItem key={wilaya.code} value={wilaya.name}>
                      {wilaya.code} - {wilaya.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="العنوان التفصيلي"
                value={newCustomerForm.address}
                onChange={(event) => updateNewCustomerField("address", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="مسار الشحن"
                placeholder="مثال: وهران - الساحل"
                value={newCustomerForm.shippingRoute}
                onChange={(event) => updateNewCustomerField("shippingRoute", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                value={newCustomerForm.email}
                onChange={(event) => updateNewCustomerField("email", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الرصيد الافتتاحي (دج)"
                type="number"
                value={newCustomerForm.openingBalance}
                onChange={(event) => updateNewCustomerField("openingBalance", event.target.value)}
                helperText="رصيد سابق قبل بدء التسجيل في البرنامج"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البائع المسؤول"
                value={newCustomerForm.salesperson}
                onChange={(event) => updateNewCustomerField("salesperson", event.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setNewCustomerDialog(false)}>
            إلغاء
          </SoftButton>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            disabled={!newCustomerForm.name.trim() || !newCustomerForm.phone.trim() || !newCustomerForm.wilaya.trim()}
            onClick={addNewCustomer}
          >
            إضافة وتحديد
          </SoftButton>
        </DialogActions>
      </Dialog>

      <CustomerInfoDialog
        customer={customerInfoOpen ? customer : null}
        onClose={() => setCustomerInfoOpen(false)}
      />

      <Footer />
    </DashboardLayout>
  );
}
