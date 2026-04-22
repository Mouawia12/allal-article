/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

import { calcLineTotal, formatDZD, mockPurchases, purchaseProducts } from "./mockData";
import { mockPartnerProducts } from "data/mock/partnershipMock";
import {
  findSupplierByName,
  getSupplierName,
  getSupplierOptions,
  resolveSupplierLink,
  supplierMatchLabels,
} from "data/mock/suppliersMock";

let lineId = 1;

function createLine(product = null) {
  return {
    id: lineId++,
    product,
    qty: product ? 1 : "",
    unitPrice: product?.price || "",
    taxRate: product?.taxRate ?? 19,
    notes: "",
  };
}

function PurchaseLine({ line, canDelete, onChange, onDelete, onEnterLastField, productOptions }) {
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
          options={productOptions ?? purchaseProducts}
          value={line.product}
          onChange={(_, product) => {
            set("product", product);
            if (product) {
              set("unitPrice", product.price);
              set("taxRate", product.taxRate);
              if (!line.qty) set("qty", 1);
            }
          }}
          getOptionLabel={(option) => option ? `${option.id} - ${option.name}` : ""}
          renderInput={(params) => <TextField {...params} placeholder="اكتب كود أو اسم الصنف..." />}
        />
      </td>
      <td style={{ padding: "10px 8px", width: 90 }}>
        <TextField
          size="small"
          type="number"
          value={line.qty}
          onChange={(event) => set("qty", event.target.value)}
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
          inputProps={{ min: 0 }}
        />
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
  const editPurchase = mockPurchases.find((purchase) => purchase.id === id);
  const isEdit = Boolean(editPurchase);

  const supplierOptions = useMemo(() => getSupplierOptions(), []);
  const [supplier, setSupplier] = useState(() => (
    editPurchase?.supplier ? findSupplierByName(editPurchase.supplier) || editPurchase.supplier : null
  ));
  const [date, setDate] = useState(editPurchase?.date || new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState(editPurchase?.expectedDate || "");
  const [warehouse, setWarehouse] = useState(editPurchase?.warehouse || "المخزن الرئيسي");
  const [paymentTerms, setPaymentTerms] = useState(editPurchase?.paymentStatus === "paid" ? "cash" : "credit");
  const [notes, setNotes] = useState(editPurchase?.notes || "");
  const [lines, setLines] = useState(() => {
    if (!editPurchase) return [createLine()];
    return editPurchase.lines.map((line) => {
      const product = purchaseProducts.find((item) => item.id === line.productCode) || null;
      return {
        id: lineId++,
        product,
        qty: line.qty,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        notes: "",
      };
    });
  });
  const [savedDialog, setSavedDialog] = useState(null);

  // Linked supplier detection uses stable identifiers, not display names.
  const linkedMatch = useMemo(() => {
    if (!supplier) return null;
    const resolved = resolveSupplierLink(supplier);
    return resolved.isLinked ? resolved : null;
  }, [supplier]);

  const activeProducts = useMemo(() => {
    if (linkedMatch?.partner?.uuid && mockPartnerProducts[linkedMatch.partner.uuid]) {
      return mockPartnerProducts[linkedMatch.partner.uuid].map((p) => ({
        id: p.id,
        name: p.nameAr,
        unit: p.unit,
        price: p.price ?? 0,
        taxRate: 19,
        stock: p.stock,
        fromPartner: true,
      }));
    }
    return purchaseProducts;
  }, [linkedMatch]);

  const totals = useMemo(() => {
    const validLines = lines.filter((line) => line.product && Number(line.qty) > 0);
    const untaxed = validLines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0);
    const total = validLines.reduce((sum, line) => sum + calcLineTotal(line), 0);
    return { validLines, untaxed, tax: total - untaxed, total };
  }, [lines]);

  const changeLine = (lineToChange, key, value) => {
    setLines((items) => items.map((line) => line.id === lineToChange ? { ...line, [key]: value } : line));
  };

  const deleteLine = (lineToDelete) => {
    setLines((items) => items.filter((line) => line.id !== lineToDelete));
  };

  const addLine = () => {
    setLines((items) => [...items, createLine()]);
  };

  const save = (mode) => {
    if (!supplier || totals.validLines.length === 0) return;
    setSavedDialog(mode);
  };

  const simulatedId = isEdit ? editPurchase.id : "PUR-2024-007";

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
              {isEdit ? `تعديل ${editPurchase.id}` : "أمر شراء جديد"}
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              إدخال مشتريات تجريبي بنفس منطق أوامر المبيعات: مورد، سطور، كميات، أسعار، ورسوم
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<SaveIcon />} onClick={() => save("draft")}>
              حفظ كمسودة
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" startIcon={<CheckCircleIcon />} onClick={() => save("confirm")}>
              حفظ وتأكيد
            </SoftButton>
          </SoftBox>
        </SoftBox>

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
                    renderInput={(params) => <TextField {...params} label="المورد" placeholder="اختر أو اكتب المورد..." />}
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
                <Grid item xs={12} md={6}>
                  <FormControl size="small" fullWidth>
                    <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                      <MenuItem value="المخزن الرئيسي">المخزن الرئيسي</MenuItem>
                      <MenuItem value="مخزن الأدوات">مخزن الأدوات</MenuItem>
                      <MenuItem value="مخزن السباكة">مخزن السباكة</MenuItem>
                      <MenuItem value="مخزن الدهانات">مخزن الدهانات</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
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
                        onChange={changeLine}
                        onDelete={deleteLine}
                        onEnterLastField={addLine}
                        productOptions={activeProducts}
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
                  {supplier && totals.validLines.length
                    ? "الأمر جاهز للحفظ التجريبي."
                    : "اختر المورد وأضف صنفا واحدا على الأقل قبل الحفظ."}
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <Dialog open={!!savedDialog} onClose={() => setSavedDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">تمت المحاكاة</SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <SoftTypography variant="body2" color="text">
            {savedDialog === "confirm"
              ? "تم حفظ أمر الشراء وتأكيده تجريبيا. في الربط الحقيقي سيتم إنشاء قيد التزام للمورد وتحديث المخزون عند الاستلام."
              : "تم حفظ أمر الشراء كمسودة تجريبية."}
          </SoftTypography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="text" color="secondary" onClick={() => navigate("/purchases")}>العودة للقائمة</SoftButton>
          <SoftButton variant="gradient" color="info" onClick={() => navigate(`/purchases/${simulatedId}`)}>عرض الأمر</SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}
