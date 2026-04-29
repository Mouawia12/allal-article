/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
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
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SaveIcon from "@mui/icons-material/Save";
import TuneIcon from "@mui/icons-material/Tune";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";
const formatDZD = (v) => Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const getPriceListsFor = () => [];
const resolveProductPrice = (product) => ({ finalPrice: product?.price || product?.sellingPrice || 0, listName: "—" });
import {
  CustomerInfoDialog,
  emptyNewCustomerForm,
} from "./NewOrder";
import { ordersApi, customersApi, productsApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank, isPositiveNumber } from "utils/formErrors";
import { useI18n } from "i18n";


// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeCustomer(c) {
  return {
    totalAmount: 0, paidAmount: 0, ordersCount: 0, lastOrder: "—",
    salesperson: c.salespersonName || "—",
    wilaya: c.wilayaNameAr || "—",
    payments: [], orders: [],
    ...c,
  };
}

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
function OrderRow({ row, rowIndex, totalRows, priceListId, onChange, onDelete, onProductConfirmed, onQtyEnter, qtyRef, apiProducts, errors = {} }) {
  const product = row.product;
  const stockColor = !product ? "inherit" : product.stock === 0 ? "#ea0606" : product.stock < 10 ? "#fb8c00" : "#66BB6A";
  const priceInfo = product ? resolveProductPrice(product, priceListId, "sales") : null;
  const lineTotal = product && row.qty ? Number(row.qty || 0) * Number(priceInfo.unitPrice || 0) : 0;

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
          options={apiProducts}
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
              error={!!errors.productId}
              helperText={errors.productId || ""}
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
          error={!!errors.qty}
          helperText={errors.qty || ""}
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

      {/* Price */}
      <TableCell sx={{ py: 0.5, width: 130, textAlign: "center" }}>
        {priceInfo ? (
          <>
            <SoftTypography variant="caption" fontWeight="bold" color="info">
              {formatDZD(priceInfo.unitPrice)} دج
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              {priceInfo.sourceLabel}
            </SoftTypography>
          </>
        ) : (
          <SoftTypography variant="caption" color="secondary">—</SoftTypography>
        )}
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

      {/* Line Total */}
      <TableCell sx={{ py: 0.5, width: 120, textAlign: "center" }}>
        <SoftTypography variant="caption" fontWeight="bold" color={lineTotal ? "text" : "secondary"}>
          {lineTotal ? `${formatDZD(lineTotal)} دج` : "—"}
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
  const { t } = useI18n();
  const location = useLocation();
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [apiProducts, setApiProducts] = useState([]);
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ ...emptyNewCustomerForm });
  const [notes, setNotes] = useState("");
  const salesPriceLists = getPriceListsFor("sales");
  const [selectedPriceListId, setSelectedPriceListId] = useState("MAIN");
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [orderErrors, setOrderErrors] = useState({});
  const [orderSaving, setOrderSaving] = useState(false);
  const [newCustomerErrors, setNewCustomerErrors] = useState({});
  const [newCustomerSaving, setNewCustomerSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const selectedPriceList = salesPriceLists.find((l) => l.id === selectedPriceListId) || salesPriceLists[0];
  const nextId = useRef(2);
  const [rows, setRows] = useState([newRow(1)]);
  const qtyRefs = useRef({});
  const customerDebt = getCustomerDebt(customer);

  useEffect(() => {
    setLoadError("");
    customersApi.list().then((r) => {
      const list = (r.data?.content ?? r.data ?? []).map(normalizeCustomer);
      setCustomers(list);
      const preselected = location.state?.customer;
      if (preselected) {
        const match = list.find((c) => c.id === preselected.id) ?? preselected;
        setCustomer(match);
      }
    }).catch((error) => {
      setLoadError((current) =>
        current || getApiErrorMessage(error, "تعذر تحميل الزبائن")
      );
    });
    productsApi.list().then((r) => {
      const all = r.data?.content ?? r.data ?? [];
      setApiProducts(all.map((p) => ({ ...p, name: p.name ?? p.nameAr, code: p.code ?? String(p.id), unit: p.unit ?? "وحدة", weightPerUnit: p.weightPerUnit ?? 0, unitsPerPackage: p.unitsPerPackage ?? 1, packageUnit: p.packageUnit ?? "وحدة" })));
    }).catch((error) => {
      setLoadError((current) => {
        const message = getApiErrorMessage(error, "تعذر تحميل الأصناف");
        return current ? `${current}؛ ${message}` : message;
      });
    });
  }, []);

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
    setOrderErrors((current) => {
      const next = { ...current, _global: "" };
      delete next.items;
      delete next[`line-${rowId}-productId`];
      delete next[`line-${rowId}-qty`];
      return next;
    });
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
  const totalAmount = filledRows.reduce((sum, row) => {
    const priceInfo = resolveProductPrice(row.product, selectedPriceListId, "sales");
    return sum + Number(row.qty || 0) * priceInfo.unitPrice;
  }, 0);
  const totalItems = filledRows.length;

  const handleSave = (action) => {
    const validationErrors = {};
    if (!customer?.id) validationErrors._global = "الرجاء اختيار الزبون أولاً";
    if (filledRows.length === 0) validationErrors.items = "الرجاء إضافة صنف واحد على الأقل";
    filledRows.forEach((row) => {
      if (!row.product?.id) validationErrors[`line-${row.id}-productId`] = t("الصنف مطلوب");
      if (!isPositiveNumber(row.qty)) validationErrors[`line-${row.id}-qty`] = t("الكمية يجب أن تكون أكبر من صفر");
    });

    setOrderErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      customerId: customer.id,
      notes,
      status: action === "confirm" ? "confirmed" : "draft",
      priceListId: selectedPriceListId,
      items: filledRows.map((row) => {
        const priceInfo = resolveProductPrice(row.product, selectedPriceListId, "sales");
        return { productId: row.product.id, qty: Number(row.qty), unitPrice: priceInfo.unitPrice };
      }),
    };
    setOrderSaving(true);
    ordersApi.create(payload)
      .then(() => navigate("/orders"))
      .catch((error) => applyApiErrors(error, setOrderErrors, "فشل حفظ الطلبية"))
      .finally(() => setOrderSaving(false));
  };

  const updateNewCustomerField = (field, value) => {
    setNewCustomerForm((current) => ({ ...current, [field]: value }));
    if (newCustomerErrors[field] || newCustomerErrors._global) {
      setNewCustomerErrors((current) => ({ ...current, [field]: "", _global: "" }));
    }
  };

  const addNewCustomer = () => {
    const name = newCustomerForm.name.trim();
    const phone = newCustomerForm.phone.trim();
    const wilaya = newCustomerForm.wilaya.trim();
    const validationErrors = {};
    if (isBlank(name)) validationErrors.name = t("اسم الزبون مطلوب");
    if (isBlank(phone)) validationErrors.phone = t("رقم الهاتف مطلوب");
    if (isBlank(wilaya)) validationErrors.wilaya = t("الولاية مطلوبة");
    if (newCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerForm.email)) {
      validationErrors.email = t("البريد الإلكتروني غير صالح");
    }
    if (newCustomerForm.openingBalance && Number(newCustomerForm.openingBalance) < 0) {
      validationErrors.openingBalance = t("الرصيد الافتتاحي لا يمكن أن يكون سالباً");
    }

    setNewCustomerErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setNewCustomerSaving(true);
    customersApi.create({
      name, phone,
      phone2: newCustomerForm.phone2.trim(),
      email: newCustomerForm.email.trim(),
      wilaya,
      address: newCustomerForm.address.trim(),
      salesperson: newCustomerForm.salesperson.trim() || "غير محدد",
      shippingRoute: newCustomerForm.shippingRoute.trim() || `${wilaya} - عام`,
      openingBalance: Math.max(0, Number(newCustomerForm.openingBalance) || 0),
    }).then((r) => {
      const newCustomer = { orders: [], payments: [], totalAmount: 0, paidAmount: 0, ordersCount: 0, lastOrder: "—", ...r.data };
      setCustomers((current) => [...current, newCustomer]);
      setCustomer(newCustomer);
      setCustomerInfoOpen(false);
      setNewCustomerForm({ ...emptyNewCustomerForm });
      setNewCustomerErrors({});
      setNewCustomerDialog(false);
    }).catch((error) => applyApiErrors(error, setNewCustomerErrors, "فشل إضافة الزبون"))
      .finally(() => setNewCustomerSaving(false));
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
            <SoftButton variant="outlined" color="secondary" size="small" disabled={orderSaving} onClick={() => handleSave("draft")}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {orderSaving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" disabled={orderSaving} onClick={() => handleSave("confirm")}>
              <CheckCircleOutlineIcon sx={{ mr: 0.5, fontSize: 16 }} />
              {orderSaving ? "جارٍ الحفظ..." : "تأكيد الطلبية"}
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {(orderErrors._global || orderErrors.items) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {orderErrors._global || orderErrors.items}
          </Alert>
        )}

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
                    setOrderErrors((current) => ({ ...current, _global: "" }));
                    // auto-apply customer's linked price list, fallback to MAIN
                    setSelectedPriceListId(v?.defaultPriceListId || "MAIN");
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
                          <SoftBox display="flex" alignItems="center" gap={1}>
                            <SoftTypography variant="button" fontWeight="medium" lineHeight={1.3}>
                              {option.name}
                            </SoftTypography>
                            {option.defaultPriceListId && (
                              <Chip
                                label={salesPriceLists.find((l) => l.id === option.defaultPriceListId)?.name || option.defaultPriceListId}
                                size="small"
                                color="info"
                                sx={{ height: 16, fontSize: 9, "& .MuiChip-label": { px: 0.5 } }}
                              />
                            )}
                          </SoftBox>
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
                <Tooltip title="الإعدادات المتقدمة">
                  <IconButton
                    size="small"
                    onClick={(e) => setSettingsAnchor(e.currentTarget)}
                    sx={{
                      width: 40,
                      border: "1px solid #e9ecef",
                      borderRadius: 1,
                      color: selectedPriceListId !== "MAIN" ? "#17c1e8" : "#344767",
                    }}
                  >
                    <TuneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SoftBox>

              {/* Customer tags + active price list */}
              <SoftBox mt={1} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                {customer && (
                  <>
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
                  </>
                )}
                <SoftBox display="flex" alignItems="center" gap={0.5} ml={customer ? "auto" : 0}>
                  <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 10 }}>
                    الأسعار:
                  </SoftTypography>
                  <Chip
                    label={selectedPriceList?.name || "السعر الرئيسي"}
                    size="small"
                    color={selectedPriceListId !== "MAIN" ? "info" : "default"}
                    variant={selectedPriceListId !== "MAIN" ? "filled" : "outlined"}
                    sx={{ height: 18, fontSize: 9, "& .MuiChip-label": { px: 0.75 } }}
                  />
                  {customer?.defaultPriceListId && customer.defaultPriceListId === selectedPriceListId && (
                    <SoftTypography variant="caption" color="success" sx={{ fontSize: 9 }}>تلقائي</SoftTypography>
                  )}
                </SoftBox>
              </SoftBox>

              {/* Settings Menu */}
              <Menu
                anchorEl={settingsAnchor}
                open={Boolean(settingsAnchor)}
                onClose={() => setSettingsAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
              >
                <MenuItem
                  onClick={() => { setSettingsAnchor(null); setAdvancedSettingsOpen(true); }}
                  sx={{ gap: 1 }}
                >
                  <ListItemIcon sx={{ minWidth: "auto" }}>
                    <TuneIcon fontSize="small" sx={{ color: "#17c1e8" }} />
                  </ListItemIcon>
                  <SoftTypography variant="caption" fontWeight="medium">الإعدادات المتقدمة</SoftTypography>
                </MenuItem>
              </Menu>

              {/* Advanced Settings Dialog */}
              <Dialog
                open={advancedSettingsOpen}
                onClose={() => setAdvancedSettingsOpen(false)}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <TuneIcon sx={{ color: "#17c1e8", fontSize: 20 }} />
                      <SoftTypography variant="h6" fontWeight="bold">الإعدادات المتقدمة</SoftTypography>
                    </SoftBox>
                    <IconButton size="small" onClick={() => setAdvancedSettingsOpen(false)}>
                      <CloseIcon />
                    </IconButton>
                  </SoftBox>
                </DialogTitle>
                <DialogContent dividers>
                  <SoftTypography variant="caption" fontWeight="bold" color="secondary" display="block" mb={1}>
                    قائمة الأسعار
                  </SoftTypography>
                  <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                    <InputLabel>قائمة الأسعار</InputLabel>
                    <Select
                      value={selectedPriceListId}
                      label="قائمة الأسعار"
                      onChange={(e) => setSelectedPriceListId(e.target.value)}
                    >
                      {salesPriceLists.map((list) => (
                        <MenuItem key={list.id} value={list.id}>
                          <SoftTypography variant="caption" fontWeight="medium">{list.name}</SoftTypography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedPriceList?.description && (
                    <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                      {selectedPriceList.description}
                    </SoftTypography>
                  )}
                  <SoftTypography variant="caption" color="secondary" display="block" mb={2} sx={{ fontStyle: "italic" }}>
                    الأصناف غير المسعرة في القائمة تأخذ السعر الرئيسي تلقائياً.
                  </SoftTypography>

                  {/* Customer link info */}
                  {customer && (
                    <SoftBox
                      p={1.5}
                      sx={{
                        background: customer.defaultPriceListId ? "#f0fff4" : "#f8f9fa",
                        borderRadius: 1.5,
                        border: `1px solid ${customer.defaultPriceListId ? "#66BB6A33" : "#e9ecef"}`,
                      }}
                    >
                      <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                        {customer.name}
                      </SoftTypography>
                      {customer.defaultPriceListId ? (
                        <SoftTypography variant="caption" color="success">
                          مربوط تلقائياً بـ «{salesPriceLists.find((l) => l.id === customer.defaultPriceListId)?.name}»
                        </SoftTypography>
                      ) : (
                        <SoftTypography variant="caption" color="secondary">
                          لا توجد قائمة أسعار مرتبطة — يخضع للأسعار الرئيسية
                        </SoftTypography>
                      )}
                    </SoftBox>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => setAdvancedSettingsOpen(false)}
                  >
                    تأكيد
                  </SoftButton>
                </DialogActions>
              </Dialog>
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
                  <span style={{ color: "#fb8c00", fontWeight: 600 }}>{totalWeight.toFixed(2)} كغ</span>{" "}
                  · <span style={{ color: "#17c1e8", fontWeight: 600 }}>{formatDZD(totalAmount)} دج</span>
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
                    { label: "السعر",      w: 130 },
                    { label: "التعليب",    w: 110 },
                    { label: "الوزن",      w: 90  },
                    { label: "المخزون",    w: 80  },
                    { label: "الإجمالي",   w: 120 },
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
                    priceListId={selectedPriceListId}
                    onChange={handleChange}
                    onDelete={handleDelete}
                    onProductConfirmed={handleProductConfirmed}
                    onQtyEnter={handleQtyEnter}
                    apiProducts={apiProducts}
                    errors={{
                      productId: orderErrors[`line-${row.id}-productId`],
                      qty: orderErrors[`line-${row.id}-qty`],
                    }}
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
                <SoftBox textAlign="center">
                  <SoftTypography variant="caption" color="secondary" display="block">إجمالي المبلغ</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#17c1e8" }}>
                    {formatDZD(totalAmount)} دج
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
          <SoftButton variant="outlined" color="secondary" size="small" disabled={orderSaving} onClick={() => handleSave("draft")}>
            <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} />
            {orderSaving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
          </SoftButton>
          <SoftButton variant="gradient" color="success" size="small" disabled={orderSaving} onClick={() => handleSave("confirm")}>
            <CheckCircleOutlineIcon sx={{ mr: 0.5, fontSize: 16 }} />
            {orderSaving ? "جارٍ الحفظ..." : "تأكيد الطلبية"}
          </SoftButton>
        </SoftBox>
      </SoftBox>

      <Dialog open={newCustomerDialog} onClose={() => setNewCustomerDialog(false)} maxWidth="sm" fullWidth>
	        <DialogTitle>إضافة زبون جديد</DialogTitle>
	        <DialogContent>
	          <Grid container spacing={2} sx={{ mt: 0.5 }}>
	            {newCustomerErrors._global && (
	              <Grid item xs={12}>
	                <Alert severity="error">{newCustomerErrors._global}</Alert>
	              </Grid>
	            )}
	            <Grid item xs={12}>
	              <TextField
                fullWidth
                autoFocus
                label="اسم الزبون / الشركة *"
	                value={newCustomerForm.name}
	                onChange={(event) => updateNewCustomerField("name", event.target.value)}
	                error={!!newCustomerErrors.name}
	                helperText={newCustomerErrors.name}
	                size="small"
	              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
	                value={newCustomerForm.phone}
	                onChange={(event) => updateNewCustomerField("phone", event.target.value)}
	                error={!!newCustomerErrors.phone}
	                helperText={newCustomerErrors.phone}
	                size="small"
	              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الهاتف الثاني"
	                value={newCustomerForm.phone2}
	                onChange={(event) => updateNewCustomerField("phone2", event.target.value)}
	                error={!!newCustomerErrors.phone2}
	                helperText={newCustomerErrors.phone2}
	                size="small"
	              />
	            </Grid>
	            <Grid item xs={12} sm={6}>
	              <FormControl size="small" fullWidth error={!!(newCustomerErrors.wilaya || newCustomerErrors.wilayaId)}>
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
	                {(newCustomerErrors.wilaya || newCustomerErrors.wilayaId) && (
	                  <SoftTypography variant="caption" color="error" mt={0.5}>
	                    {newCustomerErrors.wilaya || newCustomerErrors.wilayaId}
	                  </SoftTypography>
	                )}
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
	                error={!!newCustomerErrors.email}
	                helperText={newCustomerErrors.email}
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
	                error={!!newCustomerErrors.openingBalance}
	                helperText={newCustomerErrors.openingBalance || "رصيد سابق قبل بدء التسجيل في البرنامج"}
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
	            disabled={newCustomerSaving}
	            onClick={addNewCustomer}
	          >
	            {newCustomerSaving ? "جارٍ الإضافة..." : "إضافة وتحديد"}
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
