/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { calcLineTotal, formatDZD } from "./mockData";
const getPriceListsFor = () => [];
const priceSourceLabels = {};
const getSupplierName = (v) => (typeof v === "string" ? v : v?.name || "");
const resolveSupplierLink = () => ({ isLinked: false });
const supplierMatchLabels = {};
import { purchasesApi, productsApi, suppliersApi, inventoryApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isPositiveNumber } from "utils/formErrors";
import {
  extractArray,
  normalizeProductsForOrder,
  resolveProductPrice,
} from "utils/orderProductData";
import { useI18n } from "i18n";

let lineId = 1;

function createLine(product = null) {
  const priceInfo = product ? resolveProductPrice(product, "MAIN", "purchase") : null;

  return {
    id: lineId++,
    product,
    qty: product ? 1 : "",
    unitPrice: priceInfo?.unitPrice || product?.price || "",
    pricingSource: priceInfo?.source || "product_default",
    taxRate: product?.taxRate ?? 19,
    notes: "",
  };
}

function PurchaseLine({ line, canDelete, priceListId, onChange, onDelete, onEnterLastField, productOptions, errors = {} }) {
  const set = (key, value) => onChange(line.id, key, value);
  const lineTotal = calcLineTotal({
    qty: line.qty,
    unitPrice: line.unitPrice,
    taxRate: line.taxRate,
  });

  return (
    <tr style={{ borderBottom: "1px solid #f0f2f5" }}>
      <td style={{ padding: "10px 8px", minWidth: 260 }}>
        <Autocomplete
          size="small"
          options={productOptions}
          value={line.product}
          onChange={(_, product) => {
            if (product) {
              const priceInfo = resolveProductPrice(product, priceListId, "purchase");
              set("__product_with_price", {
                product,
                unitPrice: priceInfo.unitPrice,
                pricingSource: priceInfo.source,
                taxRate: product.taxRate,
                qty: line.qty || 1,
              });
              return;
            }
            set("__product_with_price", { product: null, unitPrice: "", pricingSource: "product_default", qty: "" });
          }}
          getOptionLabel={(option) => option ? `${option.id} - ${option.name}` : ""}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="اكتب كود أو اسم الصنف..."
              error={!!errors.productId}
              helperText={errors.productId}
            />
          )}
        />
      </td>
      <td style={{ padding: "10px 8px", width: 90 }}>
        <TextField
          size="small"
          type="number"
          value={line.qty}
          onChange={(event) => set("qty", event.target.value)}
          error={!!errors.qty}
          helperText={errors.qty}
          inputProps={{ min: 0, step: "0.01" }}
        />
      </td>
      <td style={{ padding: "10px 8px", width: 90 }}>
        <TextField size="small" value={line.product?.unit || "—"} disabled />
      </td>
      <td style={{ padding: "10px 8px", width: 130 }}>
        <TextField
          size="small"
          type="number"
          value={line.unitPrice}
          onChange={(event) => set("unitPrice", event.target.value)}
          error={!!errors.unitPrice}
          helperText={errors.unitPrice}
          inputProps={{ min: 0 }}
        />
        <SoftTypography variant="caption" color="secondary" display="block" mt={0.3}>
          {priceSourceLabels[line.pricingSource] || "السعر الرئيسي"}
        </SoftTypography>
      </td>
      <td style={{ padding: "10px 8px", width: 95 }}>
        <TextField
          size="small"
          type="number"
          value={line.taxRate}
          onChange={(event) => set("taxRate", event.target.value)}
          inputProps={{ min: 0, max: 100 }}
        />
      </td>
      <td style={{ padding: "10px 8px", minWidth: 160 }}>
        <TextField
          size="small"
          value={line.notes}
          placeholder="ملاحظة"
          onChange={(event) => set("notes", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onEnterLastField();
          }}
        />
      </td>
      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" fontWeight="bold">
          {formatDZD(lineTotal)}
        </SoftTypography>
      </td>
      <td style={{ padding: "10px 8px", width: 52 }}>
        <Tooltip title="حذف السطر">
          <span>
            <IconButton size="small" color="error" disabled={!canDelete} onClick={() => onDelete(line.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </td>
    </tr>
  );
}

export default function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { t } = useI18n();

  const purchasePriceLists = getPriceListsFor("purchase");
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [selectedPriceListId, setSelectedPriceListId] = useState("PURCHASE_MAIN");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("credit");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([createLine()]);
  const [savedId, setSavedId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const appendLoadError = (error, fallback) => {
      setLoadError((current) => {
        const message = getApiErrorMessage(error, fallback);
        return current ? `${current}؛ ${message}` : message;
      });
    };
    setLoadError("");
    suppliersApi.list()
      .then((r) => setSupplierOptions(r.data?.content ?? r.data ?? []))
      .catch((error) => appendLoadError(error, "تعذر تحميل الموردين"));
    productsApi.list({ size: 500 }).then((r) => {
      setProductOptions(normalizeProductsForOrder(extractArray(r.data)));
    }).catch((error) => appendLoadError(error, "تعذر تحميل الأصناف"));
    inventoryApi.listWarehouses().then((r) => {
      const whs = r.data?.content ?? r.data ?? [];
      setWarehouses(whs);
      const def = whs.find((w) => w.isDefault) ?? whs[0];
      if (def) setWarehouse(def.id);
    }).catch((error) => appendLoadError(error, "تعذر تحميل المستودعات"));
    if (isEdit) {
      purchasesApi.getById(id).then((r) => {
        const p = r.data;
        setExpectedDate(p.expectedDate || "");
        setNotes(p.notes || "");
        if (p.supplierId) setSupplier({ id: p.supplierId, name: p.supplierName || "" });
        if (p.items?.length) {
          setLines(p.items.map((l) => ({
            id: lineId++,
            product: l.productId ? { id: l.productId, name: l.productName || "", unit: l.unit || "وحدة", taxRate: l.taxRate ?? 19 } : null,
            qty: l.orderedQty ?? 0,
            unitPrice: l.unitPrice ?? 0,
            pricingSource: "product_default",
            taxRate: 0,
            notes: l.notes || "",
          })));
        }
      }).catch((error) => appendLoadError(error, "تعذر تحميل أمر الشراء"));
    }
  }, [id, isEdit]);

  const linkedMatch = useMemo(() => {
    if (!supplier) return null;
    const resolved = resolveSupplierLink(supplier);
    return resolved.isLinked ? resolved : null;
  }, [supplier]);

  useEffect(() => {
    setLines((items) =>
      items.map((line) => {
        if (!line.product || line.pricingSource === "manual_override") return line;
        const priceInfo = resolveProductPrice(line.product, selectedPriceListId, "purchase");
        return { ...line, unitPrice: priceInfo.unitPrice, pricingSource: priceInfo.source };
      })
    );
  }, [selectedPriceListId]);

  const totals = useMemo(() => {
    const validLines = lines.filter((line) => line.product && Number(line.qty) > 0);
    const untaxed = validLines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0);
    const total = validLines.reduce((sum, line) => sum + calcLineTotal(line), 0);
    return { validLines, untaxed, tax: total - untaxed, total };
  }, [lines]);

  const activeProducts = productOptions;

  const changeLine = (lineToChange, key, value) => {
    setErrors((current) => {
      const next = { ...current, _global: "" };
      delete next[`line-${lineToChange}-productId`];
      delete next[`line-${lineToChange}-qty`];
      delete next[`line-${lineToChange}-unitPrice`];
      delete next.items;
      return next;
    });
    setLines((items) =>
      items.map((line) =>
        line.id === lineToChange && key === "__product_with_price"
          ? { ...line, ...value }
          : line.id === lineToChange
          ? { ...line, [key]: value, ...(key === "unitPrice" ? { pricingSource: "manual_override" } : {}) }
          : line
      )
    );
  };

  const deleteLine = (lineToDelete) => {
    setLines((items) => items.filter((line) => line.id !== lineToDelete));
  };

  const addLine = () => {
    setLines((items) => [...items, createLine()]);
  };

  const save = (mode) => {
    const validationErrors = {};
    const supplierId = typeof supplier === "object" ? supplier.id : null;
    if (!supplierId) validationErrors.supplierId = t("المورد مطلوب");
    if (totals.validLines.length === 0) validationErrors.items = t("أضف صنفاً واحداً على الأقل");
    lines.forEach((line) => {
      if (!line.product && !line.qty && !line.unitPrice) return;
      if (!line.product?.id) validationErrors[`line-${line.id}-productId`] = t("الصنف مطلوب");
      if (!isPositiveNumber(line.qty)) validationErrors[`line-${line.id}-qty`] = t("الكمية يجب أن تكون أكبر من صفر");
      if (line.unitPrice !== "" && Number(line.unitPrice) < 0) {
        validationErrors[`line-${line.id}-unitPrice`] = t("السعر لا يمكن أن يكون سالباً");
      }
    });

    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      supplierId,
      expectedDate: expectedDate || null,
      notes: notes || null,
      items: totals.validLines.map((l) => ({
        productId: l.product.id,
        qty: Number(l.qty),
        unitPrice: Number(l.unitPrice) || null,
        notes: l.notes || null,
      })),
    };
    setSaving(true);
    purchasesApi.create(payload)
      .then((r) => {
        const newId = r.data?.id;
        if (mode === "confirm" && newId) {
          return purchasesApi.confirm(newId).then(() => newId);
        }
        return newId;
      })
      .then((newId) => setSavedId(newId))
      .catch((error) => applyApiErrors(error, setErrors, "فشل حفظ أمر الشراء"))
      .finally(() => setSaving(false));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <IconButton size="small" onClick={() => navigate("/purchases")}>
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">
              {isEdit ? `تعديل أمر الشراء` : "أمر شراء جديد"}
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              إدخال مشتريات تجريبي بنفس منطق أوامر المبيعات: مورد، سطور، كميات، أسعار، ورسوم
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<SaveIcon />} disabled={saving} onClick={() => save("draft")}>
              {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" startIcon={<CheckCircleIcon />} disabled={saving} onClick={() => save("confirm")}>
              {saving ? "جارٍ الحفظ..." : "حفظ وتأكيد"}
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {(errors._global || errors.items) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global || errors.items}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5, mb: 2 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>بيانات المورد والأمر</SoftTypography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    size="small"
                    options={supplierOptions}
                    value={supplier}
                    onChange={(_, value) => setSupplier(value)}
                    getOptionLabel={getSupplierName}
                    isOptionEqualToValue={(option, value) => {
                      if (!option || !value) return false;
                      if (typeof option === "string" || typeof value === "string") {
                        return getSupplierName(option) === getSupplierName(value);
                      }
                      return option.id === value.id;
                    }}
                    renderOption={(props, option) => {
                      const link = resolveSupplierLink(option);
                      return (
                        <li {...props} key={option.id || option.name}>
                          <SoftBox display="flex" alignItems="center" gap={1}>
                            {link.isLinked && (
                              <SoftBox sx={{ fontSize: 9, background: "#e3f8fd", color: "#17c1e8", border: "1px solid #b2ebf9", borderRadius: 1, px: 0.8, py: 0.2, fontWeight: 700, whiteSpace: "nowrap" }}>
                                مرتبط
                              </SoftBox>
                            )}
                            <span>{option.name}</span>
                            {option.taxNumber && (
                              <SoftTypography variant="caption" color="secondary">
                                {option.taxNumber}
                              </SoftTypography>
                            )}
                          </SoftBox>
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="المورد"
                        placeholder="اختر أو اكتب المورد..."
                        error={!!(errors.supplierId || errors.supplier)}
                        helperText={errors.supplierId || errors.supplier}
                      />
                    )}
                    freeSolo
                  />
                  {/* Linked partner banner */}
                  {linkedMatch && (
                    <SoftBox mt={0.8} sx={{ background: "#e3f8fd", border: "1px solid #17c1e844", borderRadius: 1.5, px: 1.5, py: 1 }}>
                      <SoftBox display="flex" alignItems="center" gap={0.8}>
                        <SoftBox sx={{ width: 8, height: 8, borderRadius: "50%", background: "#17c1e8", flexShrink: 0 }} />
                        <SoftTypography variant="caption" sx={{ color: "#17c1e8", fontWeight: 700 }}>مورد مرتبط</SoftTypography>
                      </SoftBox>
                      <SoftTypography variant="caption" color="secondary" display="block" sx={{ mt: 0.3 }}>
                        تم التعرف على الربط عبر {supplierMatchLabels[linkedMatch.matchedBy] || "معرف ثابت"}، وتعرض حقول الأصناف أدناه مخزون هذا الشريك مباشرةً.
                        {linkedMatch.permissions?.create_purchase_link && " عند الحفظ ستتحول الطلبية تلقائياً لفاتورة مبيعات عنده."}
                      </SoftTypography>
                    </SoftBox>
                  )}
                  {supplier && !linkedMatch && (
                    <SoftTypography variant="caption" color="secondary" display="block" sx={{ mt: 0.8 }}>
                      هذا المورد غير مربوط حالياً. اربطه من بطاقة المورد باستخدام UUID أو الرقم الضريبي أو البريد.
                    </SoftTypography>
                  )}
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" type="date" label="تاريخ الطلب" value={date} onChange={(e) => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth size="small" type="date" label="تاريخ الاستلام المتوقع" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>مستودع الاستلام</InputLabel>
                    <Select value={warehouse} label="مستودع الاستلام" onChange={(e) => setWarehouse(e.target.value)}>
                      {warehouses.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name}{item.isDefault ? " · افتراضي" : ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>قائمة الأسعار</InputLabel>
                    <Select
                      value={selectedPriceListId}
                      label="قائمة الأسعار"
                      onChange={(e) => setSelectedPriceListId(e.target.value)}
                    >
                      {purchasePriceLists.map((list) => (
                        <MenuItem key={list.id} value={list.id}>{list.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <Select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                      <MenuItem value="cash">دفع نقدي عند الاستلام</MenuItem>
                      <MenuItem value="credit">آجل / دين مورد</MenuItem>
                      <MenuItem value="partial">تسبيق ثم تسوية</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline minRows={2} size="small" label="ملاحظات" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2} gap={1}>
                <SoftTypography variant="h6" fontWeight="bold">أسطر الأمر</SoftTypography>
                <SoftButton size="small" variant="outlined" color="info" startIcon={<AddIcon />} onClick={addLine}>
                  إضافة سطر
                </SoftButton>
              </SoftBox>
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["الصنف", "الكمية", "الوحدة", "سعر الوحدة", "TVA", "ملاحظة", "الإجمالي", ""].map((header) => (
                        <th key={header} style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" color="secondary" fontWeight="bold">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <PurchaseLine
                        key={line.id}
                        line={line}
                        canDelete={lines.length > 1}
                        priceListId={selectedPriceListId}
                        onChange={changeLine}
                        onDelete={deleteLine}
                        onEnterLastField={addLine}
                        productOptions={activeProducts}
                        errors={{
                          productId: errors[`line-${line.id}-productId`],
                          qty: errors[`line-${line.id}-qty`],
                          unitPrice: errors[`line-${line.id}-unitPrice`],
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>ملخص الأمر</SoftTypography>
              <SoftBox display="flex" justifyContent="space-between" mb={1}>
                <SoftTypography variant="caption" color="secondary">قائمة الأسعار</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">
                  {purchasePriceLists.find((list) => list.id === selectedPriceListId)?.name || "—"}
                </SoftTypography>
              </SoftBox>
              <SoftBox display="flex" justifyContent="space-between" mb={1}>
                <SoftTypography variant="caption" color="secondary">مستودع الاستلام</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">
                  {warehouses.find((item) => item.id === warehouse)?.name || "—"}
                </SoftTypography>
              </SoftBox>
              <SoftBox display="flex" justifyContent="space-between" mb={1}>
                <SoftTypography variant="caption" color="secondary">عدد الأسطر</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">{totals.validLines.length}</SoftTypography>
              </SoftBox>
              <SoftBox display="flex" justifyContent="space-between" mb={1}>
                <SoftTypography variant="caption" color="secondary">المبلغ دون رسم</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">{formatDZD(totals.untaxed)} دج</SoftTypography>
              </SoftBox>
              <SoftBox display="flex" justifyContent="space-between" mb={1}>
                <SoftTypography variant="caption" color="secondary">TVA</SoftTypography>
                <SoftTypography variant="caption" fontWeight="bold">{formatDZD(totals.tax)} دج</SoftTypography>
              </SoftBox>
              <Divider sx={{ my: 1.5 }} />
              <SoftBox display="flex" justifyContent="space-between" mb={2}>
                <SoftTypography variant="button" fontWeight="bold">الإجمالي</SoftTypography>
                <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#17c1e8" }}>{formatDZD(totals.total)} دج</SoftTypography>
              </SoftBox>
              <SoftBox p={1.5} sx={{ background: supplier && totals.validLines.length ? "#f0fde4" : "#fff3e0", borderRadius: 1 }}>
                <SoftTypography variant="caption" sx={{ color: supplier && totals.validLines.length ? "#67a814" : "#fb8c00" }}>
                  {errors.supplierId || errors.items || errors._global
                    ? errors.supplierId || errors.items || errors._global
                    : supplier && totals.validLines.length
                    ? "الأمر جاهز للحفظ التجريبي."
                    : "اختر المورد وأضف صنفا واحدا على الأقل قبل الحفظ."}
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <Dialog open={!!savedId} onClose={() => setSavedId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">تم الحفظ</SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <SoftTypography variant="body2" color="text">
            تم حفظ أمر الشراء بنجاح.
          </SoftTypography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="text" color="secondary" onClick={() => navigate("/purchases")}>العودة للقائمة</SoftButton>
          {savedId && <SoftButton variant="gradient" color="info" onClick={() => navigate(`/purchases/${savedId}`)}>عرض الأمر</SoftButton>}
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}
