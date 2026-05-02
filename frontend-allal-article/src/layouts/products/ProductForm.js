/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import LocalOfferIcon from "@mui/icons-material/LocalOfferOutlined";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import ScaleIcon from "@mui/icons-material/ScaleOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TuneIcon from "@mui/icons-material/Tune";
import ViewModuleIcon from "@mui/icons-material/ViewModuleOutlined";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  generateBarcode,
  generateVariantCombinations,
  productSettings,
} from "./mockProductData";
import { productsApi, inventoryApi, mediaApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────
let unitRowId = 100;
const newUnitRow = (isBase = false) => ({
  _id: unitRowId++,
  unit: "",
  conversionFactor: isBase ? 1 : "",
  price: "",
  barcode: "",
  isBase,
});

let variantRowId = 200;
const newVariantRow = (attrs = {}) => ({
  _id: variantRowId++,
  sku: "",
  attrs,
  barcode: generateBarcode(),
  price: "",
  stock: "",
});

function buildSku(code, attrs) {
  const parts = Object.values(attrs)
    .map((v) => v.slice(0, 3).toUpperCase().replace(/\s/g, ""))
    .join("-");
  return `${code || "PRD"}-${parts}`.slice(0, 20);
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function joinLoadError(current, message) {
  return current ? `${current}؛ ${message}` : message;
}

function priceInputValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function productBaseUnitRow(product) {
  return {
    ...newUnitRow(true),
    unit: product.baseUnitName ?? product.baseUnit ?? product.unit ?? "",
    conversionFactor: 1,
    price: priceInputValue(product.currentPriceAmount),
    barcode: product.barcode ?? "",
  };
}

// ─── Section Card wrapper ─────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, action, accentColor = "#17c1e8", children, sx = {} }) {
  return (
    <Card
      sx={{
        mb: 3,
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: "12px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        overflow: "hidden",
        ...sx,
      }}
    >
      <SoftBox
        px={3} py={2}
        display="flex" justifyContent="space-between" alignItems="center"
        sx={{ borderBottom: "1px solid #f0f2f5" }}
      >
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <SoftBox
            sx={{
              width: 34, height: 34, borderRadius: "8px",
              background: `${accentColor}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#344767", display: "block", lineHeight: 1.3 }}>
              {title}
            </SoftTypography>
            {subtitle && (
              <SoftTypography variant="caption" color="secondary" sx={{ lineHeight: 1.2 }}>
                {subtitle}
              </SoftTypography>
            )}
          </SoftBox>
        </SoftBox>
        {action}
      </SoftBox>
      <SoftBox px={3} py={2.5}>{children}</SoftBox>
    </Card>
  );
}

// ─── Barcode Input ────────────────────────────────────────────────────────────
function BarcodeInput({ value, onChange, label = "الباركود", placeholder = "امسح أو اكتب يدوياً..." }) {
  const inputRef = useRef(null);
  const [scannerActive, setScannerActive] = useState(false);

  const focusForScan = () => {
    setScannerActive(true);
    inputRef.current?.focus();
  };

  return (
    <SoftBox>
      <TextField
        inputRef={inputRef}
        fullWidth
        size="small"
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setScannerActive(true)}
        onBlur={() => setScannerActive(false)}
        placeholder={placeholder}
        sx={{
          "& .MuiOutlinedInput-root": {
            ...(scannerActive && {
              "& fieldset": { borderColor: "#17c1e8", borderWidth: 2 },
              boxShadow: "0 0 0 3px #17c1e815",
            }),
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <QrCodeScannerIcon sx={{ fontSize: 16, color: scannerActive ? "#17c1e8" : "#8392ab" }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="توليد باركود تلقائي">
                <IconButton size="small" onClick={() => onChange(generateBarcode())}>
                  <RefreshIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
      {!value && (
        <SoftBox
          display="flex" alignItems="center" gap={0.5} mt={0.4}
          sx={{ cursor: "pointer" }} onClick={focusForScan}
        >
          <QrCodeScannerIcon sx={{ fontSize: 11, color: "#17c1e8" }} />
          <SoftTypography variant="caption" sx={{ color: "#17c1e8", fontSize: "10px" }}>
            {scannerActive ? "جاهز — امسح الباركود الآن" : "انقر للتفعيل ثم امسح"}
          </SoftTypography>
        </SoftBox>
      )}
      {value && (
        <SoftBox mt={0.4} px={1} py={0.3} sx={{ background: "#f8f9fa", borderRadius: 1, display: "inline-block" }}>
          <SoftTypography variant="caption" sx={{ fontFamily: "monospace", fontSize: "11px", color: "#344767", letterSpacing: 1 }}>
            {value}
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

// ─── Units Section ────────────────────────────────────────────────────────────
function UnitsSection({ units, unitOptions, onChange }) {
  const unitNames = unitOptions.map((u) => u.name);

  const update = (id, field, val) =>
    onChange(units.map((u) => (u._id === id ? { ...u, [field]: val } : u)));

  const add = () => onChange([...units, newUnitRow()]);
  const remove = (id) => onChange(units.filter((u) => u._id !== id));

  return (
    <SectionCard
      icon={<ViewModuleIcon sx={{ fontSize: 18, color: "#82d616" }} />}
      title="وحدات القياس"
      subtitle="بيع الصنف بأكثر من وحدة مع سعر مختلف لكل وحدة"
      accentColor="#82d616"
      action={
        <SoftButton variant="outlined" color="success" size="small" startIcon={<AddIcon />} onClick={add}>
          إضافة وحدة
        </SoftButton>
      }
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["الوحدة", "معامل التحويل", "السعر (دج)", "الباركود", ""].map((h, i) => (
                <TableCell
                  key={i}
                  sx={{
                    fontWeight: 700, fontSize: "10px", color: "#8392ab",
                    py: 1, textTransform: "uppercase", letterSpacing: 0.5,
                    borderBottom: "2px solid #f0f2f5",
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((row, idx) => (
              <TableRow
                key={row._id}
                sx={{
                  background: row.isBase ? "#f8fffb" : "transparent",
                  "&:hover": { background: row.isBase ? "#f0fff7" : "#fafbfc" },
                  borderLeft: row.isBase ? "3px solid #82d616" : "3px solid transparent",
                }}
              >
                <TableCell sx={{ py: 1, minWidth: 130 }}>
                  <SoftBox display="flex" alignItems="center" gap={1}>
                    <TextField
                      select size="small" fullWidth value={row.unit}
                      onChange={(e) => update(row._id, "unit", e.target.value)}
                      disabled={row.isBase}
                    >
                      {unitNames.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                    </TextField>
                    {row.isBase && (
                      <Chip label="أساسية" size="small" color="success"
                        sx={{ fontSize: "9px", height: 18, flexShrink: 0 }} />
                    )}
                  </SoftBox>
                </TableCell>
                <TableCell sx={{ py: 1, width: 120 }}>
                  <TextField
                    size="small" type="number" fullWidth value={row.conversionFactor}
                    onChange={(e) => update(row._id, "conversionFactor", e.target.value)}
                    disabled={row.isBase} inputProps={{ min: 0, step: 0.001 }}
                    placeholder={row.isBase ? "1 (أساسية)" : "مثال: 12"}
                  />
                </TableCell>
                <TableCell sx={{ py: 1, width: 130 }}>
                  <TextField
                    size="small" type="number" fullWidth value={row.price}
                    onChange={(e) => update(row._id, "price", e.target.value)}
                    inputProps={{ min: 0 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end"><SoftTypography variant="caption" color="secondary">دج</SoftTypography></InputAdornment>,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 1, minWidth: 190 }}>
                  <BarcodeInput value={row.barcode} onChange={(v) => update(row._id, "barcode", v)} label="" />
                </TableCell>
                <TableCell sx={{ py: 1, width: 40 }}>
                  {!row.isBase && (
                    <IconButton size="small" onClick={() => remove(row._id)}
                      sx={{ color: "#ea0606", "&:hover": { background: "#ea060610" } }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
}

// ─── Variants Section ─────────────────────────────────────────────────────────
function VariantsSection({ hasVariants, onToggle, variantAttrs, onAttrsChange, variants, onVariantsChange, productCode }) {
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValues, setNewAttrValues] = useState("");
  const knownAttrs = productSettings.variantAttributes.map((a) => a.name);

  const addAttr = () => {
    if (!newAttrName.trim() || newAttrName === "__custom__") return;
    const values = newAttrValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (!values.length) return;
    onAttrsChange([...variantAttrs, { name: newAttrName.trim(), values }]);
    setNewAttrName("");
    setNewAttrValues("");
  };

  const removeAttr = (name) => onAttrsChange(variantAttrs.filter((a) => a.name !== name));

  const generateVariants = () => {
    const combos = generateVariantCombinations(variantAttrs);
    const rows = combos.map((attrs) => ({
      ...newVariantRow(attrs),
      sku: buildSku(productCode, attrs),
    }));
    onVariantsChange(rows);
  };

  const updateVariant = (id, field, val) =>
    onVariantsChange(variants.map((v) => (v._id === id ? { ...v, [field]: val } : v)));

  const removeVariant = (id) => onVariantsChange(variants.filter((v) => v._id !== id));

  const attrNames = variantAttrs.map((a) => a.name);

  return (
    <SectionCard
      icon={<TuneIcon sx={{ fontSize: 18, color: "#cb0c9f" }} />}
      title="متغيرات الصنف"
      subtitle="ألوان، مقاسات، أو أي خاصية تُميز متغيرات هذا الصنف"
      accentColor="#cb0c9f"
      action={
        <FormControlLabel
          control={
            <Switch checked={hasVariants} onChange={(e) => onToggle(e.target.checked)} color="secondary" size="small" />
          }
          label={
            <SoftTypography variant="caption" fontWeight="medium" sx={{ color: hasVariants ? "#cb0c9f" : "#8392ab" }}>
              {hasVariants ? "مُفعّل" : "غير مُفعّل"}
            </SoftTypography>
          }
          labelPlacement="start"
          sx={{ mr: 0, gap: 0.5 }}
        />
      }
    >
      {!hasVariants ? (
        <SoftBox p={2} textAlign="center" sx={{ border: "1px dashed #e0e0e0", borderRadius: 2, background: "#fafbfc" }}>
          <TuneIcon sx={{ fontSize: 28, color: "#ccc", mb: 0.5, display: "block", mx: "auto" }} />
          <SoftTypography variant="caption" color="secondary">
            فعّل المتغيرات إذا كان الصنف متاحاً بألوان أو مقاسات مختلفة
          </SoftTypography>
        </SoftBox>
      ) : (
        <>
          {/* Attribute Builder */}
          <SoftBox mb={2} p={2} sx={{ background: "#fdf8ff", borderRadius: 2, border: "1px solid #cb0c9f22" }}>
            <SoftTypography variant="caption" fontWeight="bold" color="secondary" display="block" mb={1.5}
              sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              تعريف الخصائص
            </SoftTypography>
            <Grid container spacing={1.5} alignItems="flex-start">
              <Grid item xs={12} sm={4}>
                <TextField
                  select size="small" fullWidth label="اسم الخاصية"
                  value={newAttrName}
                  onChange={(e) => {
                    setNewAttrName(e.target.value);
                    const preset = productSettings.variantAttributes.find((a) => a.name === e.target.value);
                    if (preset) setNewAttrValues(preset.values.join(", "));
                    else if (e.target.value !== "__custom__") setNewAttrValues("");
                  }}
                >
                  {knownAttrs.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  <MenuItem value="__custom__">+ مخصص</MenuItem>
                </TextField>
              </Grid>
              {newAttrName === "__custom__" && (
                <Grid item xs={12} sm={3}>
                  <TextField size="small" fullWidth label="اسم مخصص"
                    onChange={(e) => setNewAttrName(e.target.value)} />
                </Grid>
              )}
              <Grid item xs={12} sm={newAttrName === "__custom__" ? 3 : 6}>
                <TextField
                  size="small" fullWidth label="القيم (افصل بفاصلة)"
                  value={newAttrValues}
                  onChange={(e) => setNewAttrValues(e.target.value)}
                  placeholder="أحمر, أزرق, أخضر"
                  onKeyDown={(e) => e.key === "Enter" && addAttr()}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <SoftButton variant="gradient" color="secondary" size="small" fullWidth
                  startIcon={<AddIcon />} onClick={addAttr}>
                  إضافة
                </SoftButton>
              </Grid>
            </Grid>
          </SoftBox>

          {/* Current attrs */}
          {variantAttrs.length > 0 && (
            <SoftBox mb={2}>
              <SoftBox display="flex" gap={1.5} flexWrap="wrap">
                {variantAttrs.map((a) => (
                  <SoftBox
                    key={a.name}
                    sx={{
                      border: "1px solid #cb0c9f33", borderRadius: 2,
                      px: 2, py: 1, background: "#fff",
                      minWidth: 140,
                    }}
                  >
                    <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#cb0c9f" }}>
                        {a.name}
                      </SoftTypography>
                      <IconButton size="small" onClick={() => removeAttr(a.name)}
                        sx={{ p: 0.2, color: "#ea0606" }}>
                        <DeleteOutlineIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </SoftBox>
                    <SoftBox display="flex" gap={0.4} flexWrap="wrap">
                      {a.values.map((v) => (
                        <Chip key={v} label={v} size="small"
                          sx={{ fontSize: "9px", height: 20, background: "#cb0c9f12", color: "#cb0c9f" }} />
                      ))}
                    </SoftBox>
                  </SoftBox>
                ))}
              </SoftBox>
            </SoftBox>
          )}

          {variantAttrs.length > 0 && (
            <SoftBox mb={2}>
              <SoftButton variant="gradient" color="secondary" size="small" startIcon={<TuneIcon />}
                onClick={generateVariants}>
                توليد المتغيرات تلقائياً &nbsp;
                <Chip
                  label={`${generateVariantCombinations(variantAttrs).length} متغير`}
                  size="small"
                  sx={{ height: 18, fontSize: "9px", background: "rgba(255,255,255,0.25)", color: "#fff" }}
                />
              </SoftButton>
            </SoftBox>
          )}

          {variantAttrs.length === 0 && (
            <SoftBox p={1.5} textAlign="center" sx={{ border: "1px dashed #e0e0e0", borderRadius: 2 }}>
              <SoftTypography variant="caption" color="secondary">
                أضف خصائص أولاً ثم اضغط &quot;توليد المتغيرات&quot;
              </SoftTypography>
            </SoftBox>
          )}

          {/* Variants Table */}
          {variants.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <SoftTypography variant="caption" fontWeight="bold" color="secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                  المتغيرات المولّدة ({variants.length})
                </SoftTypography>
              </SoftBox>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["SKU", ...attrNames, "الباركود", "السعر (دج)", "المخزون", ""].map((h, i) => (
                        <TableCell key={i} sx={{ fontWeight: 700, fontSize: "10px", color: "#8392ab",
                          py: 1, textTransform: "uppercase", letterSpacing: 0.4,
                          borderBottom: "2px solid #f0f2f5" }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v._id} hover sx={{ "&:hover": { background: "#fdf8ff" } }}>
                        <TableCell sx={{ py: 0.8, minWidth: 130 }}>
                          <TextField size="small" fullWidth value={v.sku}
                            onChange={(e) => updateVariant(v._id, "sku", e.target.value)}
                            sx={{ "& input": { fontSize: "11px", fontFamily: "monospace" } }} />
                        </TableCell>
                        {attrNames.map((n) => (
                          <TableCell key={n} sx={{ py: 0.8 }}>
                            <Chip label={v.attrs[n] ?? "—"} size="small"
                              sx={{ fontSize: "10px", background: "#cb0c9f12", color: "#cb0c9f" }} />
                          </TableCell>
                        ))}
                        <TableCell sx={{ py: 0.8, minWidth: 180 }}>
                          <BarcodeInput value={v.barcode}
                            onChange={(val) => updateVariant(v._id, "barcode", val)} label="" />
                        </TableCell>
                        <TableCell sx={{ py: 0.8, width: 120 }}>
                          <TextField size="small" type="number" fullWidth value={v.price}
                            onChange={(e) => updateVariant(v._id, "price", e.target.value)}
                            inputProps={{ min: 0 }} />
                        </TableCell>
                        <TableCell sx={{ py: 0.8, width: 90 }}>
                          <TextField size="small" type="number" fullWidth value={v.stock}
                            onChange={(e) => updateVariant(v._id, "stock", e.target.value)}
                            inputProps={{ min: 0 }} />
                        </TableCell>
                        <TableCell sx={{ py: 0.8, width: 40 }}>
                          <IconButton size="small" onClick={() => removeVariant(v._id)}
                            sx={{ color: "#ea0606", "&:hover": { background: "#ea060610" } }}>
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </SectionCard>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────
function AIPanel({ onAIFill }) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [dragging, setDragging]     = useState(false);

  const simulateProcess = () => {
    setProcessing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => { if (p >= 100) { clearInterval(iv); setProcessing(false); return 100; } return p + 12; });
    }, 150);
  };

  const handleAIFill = () => {
    setProcessing(true); setProgress(0);
    const iv = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(iv); setProcessing(false); onAIFill?.(); return 100; }
        return p + 15;
      });
    }, 100);
  };

  return (
    <Card sx={{ mb: 3, borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(102,126,234,0.15)" }}>
      <SoftBox
        px={2.5} py={1.5}
        sx={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        display="flex" alignItems="center" gap={1}
      >
        <AutoAwesomeIcon sx={{ color: "#fff", fontSize: 18 }} />
        <SoftTypography variant="button" fontWeight="bold" sx={{ color: "#fff", flex: 1 }}>
          ذكاء اصطناعي
        </SoftTypography>
        <Chip label="GPT-4o" size="small"
          sx={{ background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: "9px", height: 18 }} />
      </SoftBox>
      <SoftBox p={2.5}>
        <SoftButton
          variant="gradient" color="info" size="small" fullWidth
          startIcon={<AutoAwesomeIcon />}
          onClick={handleAIFill} disabled={processing}
          sx={{ mb: processing ? 1.5 : 0 }}
        >
          {processing ? "جاري التعبئة..." : "تعبئة تلقائية للبيانات"}
        </SoftButton>
        {processing && (
          <SoftBox>
            <LinearProgress variant="determinate" value={progress}
              sx={{ height: 4, borderRadius: 3, mb: 0.5, "& .MuiLinearProgress-bar": { background: "#667eea" } }} />
            <SoftTypography variant="caption" color="secondary">{progress}% مكتمل</SoftTypography>
          </SoftBox>
        )}

        <Divider sx={{ my: 2 }} />

        <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={1}
          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          استيراد من ملف
        </SoftTypography>
        <SoftBox
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); simulateProcess(); }}
          sx={{
            border: `2px dashed ${dragging ? "#667eea" : "#e0e0e0"}`,
            borderRadius: 2, p: 2, textAlign: "center",
            background: dragging ? "#f5f0ff" : "#fafbfc",
            cursor: "pointer", transition: "all 0.2s",
            "&:hover": { borderColor: "#667eea", background: "#f5f0ff" },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 28, color: dragging ? "#667eea" : "#adb5bd", mb: 0.5 }} />
          <SoftTypography variant="caption" color="secondary" display="block">Excel / PDF / صور المنتج</SoftTypography>
          <SoftTypography variant="caption" sx={{ color: "#667eea" }}>اسحب الملف هنا أو انقر للرفع</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImageUploadZone({
  images,
  onAdd,
  onRemove,
  onGenerate,
  onSetPrimary,
  onSelect,
  onProcess,
  generating,
  uploading,
  processingImageId,
  generateDisabled,
  processDisabled,
  selectedImageId,
  removingImageId,
  primaryUpdatingImageId,
}) {
  return (
    <SoftBox>
      <SoftBox display="flex" gap={1.2} mb={2} flexWrap="wrap">
        <SoftButton
          variant="gradient"
          color="info"
          size="small"
          startIcon={<AutoAwesomeIcon />}
          onClick={onGenerate}
          disabled={generating || generateDisabled}
        >
          {generating ? "جاري التوليد..." : "توليد صورة بالذكاء الاصطناعي"}
        </SoftButton>
        <SoftButton
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={onAdd}
          disabled={uploading || generateDisabled}
        >
          {uploading ? "جاري الرفع..." : "رفع صورة"}
        </SoftButton>
        <SoftButton
          variant="outlined"
          color="info"
          size="small"
          startIcon={<AutoFixHighIcon />}
          onClick={onProcess}
          disabled={processDisabled || !!processingImageId}
        >
          {processingImageId ? "جاري عزل الخلفية..." : "عزل الخلفية"}
        </SoftButton>
      </SoftBox>

      <SoftBox display="flex" gap={1.5} flexWrap="wrap">
        {images.map((img, i) => (
          <SoftBox
            key={img.id || img.media?.id || img.previewUrl || i}
            onClick={() => onSelect?.(img)}
            sx={{
              width: 110, height: 110, borderRadius: "10px",
              background: img.previewUrl || img.publicUrl ? "#f8fafc" : img.color || "#e9ecef",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              border: selectedImageId === img.id ? "2px solid #17c1e8" : "1px solid #e0e0e0",
              boxShadow: selectedImageId === img.id
                ? "0 0 0 3px #17c1e822, 0 6px 16px rgba(23,193,232,0.22)"
                : "0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
              cursor: img.id ? "pointer" : "default",
              transition: "border-color 0.18s, box-shadow 0.18s",
            }}
          >
            {img.previewUrl || img.publicUrl ? (
              <SoftBox
                component="img"
                src={img.previewUrl || img.publicUrl}
                alt={img.title || `صورة ${i + 1}`}
                sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.75 }}
              />
            ) : (
              <SoftTypography variant="caption" color="secondary" sx={{ fontSize: "10px" }}>
                صورة {i + 1}
              </SoftTypography>
            )}
            {img.generated && (
              <Chip
                label="AI"
                size="small"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  height: 18,
                  fontSize: 10,
                  background: "#17c1e8",
                  color: "#fff",
                }}
              />
            )}
            {img.processed && (
              <Chip
                label="معالجة"
                size="small"
                sx={{
                  position: "absolute",
                  top: 30,
                  left: 6,
                  height: 18,
                  fontSize: 9,
                  background: "#2dce89",
                  color: "#fff",
                }}
              />
            )}
            {img.isPrimary && (
              <Chip
                label="رئيسية"
                size="small"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  right: 6,
                  height: 18,
                  fontSize: 10,
                  background: "#fb8c00",
                  color: "#fff",
                }}
              />
            )}
            <Tooltip title={img.isPrimary ? "الصورة الرئيسية" : "تعيين كصورة رئيسية"}>
              <span>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSetPrimary(img);
                  }}
                  disabled={!img.id || img.isPrimary || primaryUpdatingImageId === img.id}
                  sx={{
                    position: "absolute", top: 4, left: 4,
                    background: "#fff", color: img.isPrimary ? "#fb8c00" : "#8392ab", p: 0.2,
                    width: 22, height: 22,
                    "&:hover": { background: "#fff7e6", color: "#fb8c00" },
                    "&.Mui-disabled": { background: "rgba(255,255,255,0.8)" },
                  }}
                >
                  {img.isPrimary ? <StarIcon sx={{ fontSize: 13 }} /> : <StarBorderIcon sx={{ fontSize: 13 }} />}
                </IconButton>
              </span>
            </Tooltip>
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                onRemove(img, i);
              }}
              disabled={removingImageId === img.id}
              sx={{
                position: "absolute", top: 4, right: 4,
                background: "rgba(234,6,6,0.92)", color: "#fff", p: 0.2,
                width: 20, height: 20,
                "&:hover": { background: "#c62828" },
                "&.Mui-disabled": { background: "rgba(234,6,6,0.45)", color: "#fff" },
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </SoftBox>
        ))}
        <SoftBox
          onClick={onAdd}
          sx={{
            width: 110, height: 110, borderRadius: "10px",
            border: "2px dashed #17c1e8",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.2s",
            "&:hover": { background: "#f0f7ff", borderColor: "#0ea5c9" },
          }}
        >
          <AddPhotoAlternateIcon sx={{ color: "#17c1e8", fontSize: 24 }} />
          <SoftTypography variant="caption" sx={{ color: "#17c1e8", fontSize: "10px", mt: 0.3 }}>
            إضافة
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit  = !!id;
  const { t } = useI18n();

  const [form, setForm] = useState({
    name: "", code: "", category: "", description: "", barcode: "",
    baseUnit: "", weightPerUnit: "", unitsPerPackage: "", packageUnit: "كرطون",
    initialStock: "0", initialWarehouseId: "",
  });
  const [units, setUnits] = useState([newUnitRow(true)]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variantAttrs, setVariantAttrs] = useState([]);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const imageObjectUrls = useRef([]);
  const imageFileInputRef = useRef(null);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageProcessingId, setImageProcessingId] = useState(null);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageDeletingId, setImageDeletingId] = useState(null);
  const [imagePrimaryUpdatingId, setImagePrimaryUpdatingId] = useState(null);
  const [touched, setTouched] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [catalogUnits, setCatalogUnits] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoadError("");
    inventoryApi.listWarehouses().then((r) => {
      const whs = extractList(r.data);
      setWarehouses(whs);
      const def = whs.find((w) => w.isDefault) ?? whs[0];
      if (def) setForm((p) => ({ ...p, initialWarehouseId: def.id }));
    }).catch((error) => {
      setLoadError((current) => joinLoadError(current, getApiErrorMessage(error, "تعذر تحميل المستودعات")));
      setWarehouses([]);
    });
    productsApi.listCategories().then((r) => {
      setCatalogCategories(extractList(r.data));
    }).catch((error) => {
      setLoadError((current) => joinLoadError(current, getApiErrorMessage(error, "تعذر تحميل الفئات")));
      setCatalogCategories([]);
    });
    productsApi.listUnits().then((r) => {
      setCatalogUnits(extractList(r.data));
    }).catch((error) => {
      setLoadError((current) => joinLoadError(current, getApiErrorMessage(error, "تعذر تحميل وحدات القياس")));
      setCatalogUnits([]);
    });
    if (isEdit) {
      productsApi.getById(id).then((r) => {
        const p = r.data;
        setForm({
          name: p.name ?? "", code: p.sku ?? p.code ?? "", category: p.categoryName ?? p.category ?? "",
          description: p.description ?? "", barcode: p.barcode ?? "",
          baseUnit: p.baseUnitName ?? p.baseUnit ?? p.unit ?? "", weightPerUnit: p.weightPerUnit ?? "",
          unitsPerPackage: p.unitsPerPackage ?? "", packageUnit: p.packageUnit ?? "كرطون",
          initialStock: String(p.stock ?? 0), initialWarehouseId: p.warehouseId ?? "",
        });
        setUnits(p.units?.length
          ? p.units.map((u) => ({
              ...u,
              _id: unitRowId++,
              price: priceInputValue(u.price ?? (u.isBase ? p.currentPriceAmount : "")),
              unit: u.unit ?? (u.isBase ? (p.baseUnitName ?? p.baseUnit ?? p.unit ?? "") : ""),
              barcode: u.barcode ?? (u.isBase ? (p.barcode ?? "") : ""),
            }))
          : [productBaseUnitRow(p)]);
        if (p.hasVariants) { setHasVariants(true); setVariantAttrs(p.variantAttributes ?? []); }
        if (p.variants?.length) setVariants(p.variants.map((v) => ({ ...v, _id: variantRowId++ })));
      }).catch((error) => {
        setLoadError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل بيانات الصنف");
          return current ? `${current}؛ ${message}` : message;
        });
      });
    }
  }, [id, isEdit]);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field] || errors._global || (field === "code" && errors.sku) || (field === "baseUnit" && errors.baseUnitId)) {
      setErrors((current) => ({
        ...current,
        [field]: "",
        ...(field === "code" ? { sku: "" } : {}),
        ...(field === "baseUnit" ? { baseUnitId: "" } : {}),
        _global: "",
      }));
    }
  };
  const rememberImageObjectUrl = (url) => {
    imageObjectUrls.current.push(url);
    return url;
  };

  const revokeImageUrl = (url) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
      imageObjectUrls.current = imageObjectUrls.current.filter((u) => u !== url);
    }
  };

  const imageWithPreview = async (productImage, generated = false) => {
    const media = productImage.media ?? productImage;
    try {
      const response = await mediaApi.content(media.id);
      const previewUrl = rememberImageObjectUrl(URL.createObjectURL(response.data));
      return {
        ...productImage,
        media,
        publicUrl: media.publicUrl,
        title: media.title,
        previewUrl,
        generated: generated || productImage.sourceType === "ai_generated" || media.title?.startsWith("AI"),
        processed: productImage.sourceType === "ai_processed",
      };
    } catch {
      return {
        ...productImage,
        media,
        publicUrl: media.publicUrl,
        title: media.title,
        previewUrl: media.publicUrl,
        generated: generated || productImage.sourceType === "ai_generated" || media.title?.startsWith("AI"),
        processed: productImage.sourceType === "ai_processed",
      };
    }
  };

  const refreshProductImages = async (preferredImageId = null) => {
    const refreshed = await productsApi.listImages(id);
    const list = Array.isArray(refreshed.data) ? refreshed.data : [];
    const withPreviews = await Promise.all(list.map((media) => imageWithPreview(media)));
    setImages((current) => {
      current.forEach((image) => revokeImageUrl(image.previewUrl));
      return withPreviews;
    });
    setSelectedImageId((current) => {
      if (preferredImageId && withPreviews.some((image) => image.id === preferredImageId)) return preferredImageId;
      if (current && withPreviews.some((image) => image.id === current)) return current;
      return withPreviews.find((image) => image.isPrimary)?.id ?? withPreviews[0]?.id ?? null;
    });
    return withPreviews;
  };

  const addImage = () => {
    if (!isEdit) {
      setImageError("احفظ الصنف أولاً ثم افتحه لرفع صور مرتبطة به.");
      return;
    }
    imageFileInputRef.current?.click();
  };

  const handleUploadProductImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type?.startsWith("image/")) {
      setImageError("اختر ملف صورة بصيغة PNG أو JPG أو WEBP.");
      return;
    }
    setImageUploading(true);
    setImageError("");
    try {
      const response = await productsApi.uploadImage(id, file);
      await refreshProductImages(response.data?.id);
    } catch (error) {
      setImageError(getApiErrorMessage(error, "تعذر رفع صورة الصنف"));
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = async (image, i) => {
    if (!image?.id) {
      setImages((p) => {
        const target = p[i];
        revokeImageUrl(target?.previewUrl);
        return p.filter((_, idx) => idx !== i);
      });
      if (selectedImageId === image?.id) setSelectedImageId(null);
      return;
    }
    setImageDeletingId(image.id);
    setImageError("");
    try {
      await productsApi.deleteImage(id, image.id);
      setImages((p) => {
        revokeImageUrl(image.previewUrl);
        const next = p.filter((item) => item.id !== image.id);
        if (image.isPrimary && next.length > 0 && !next.some((item) => item.isPrimary)) {
          return next.map((item, idx) => ({ ...item, isPrimary: idx === 0 }));
        }
        return next;
      });
      setSelectedImageId((current) => {
        if (current !== image.id) return current;
        const next = images.filter((item) => item.id !== image.id);
        return next.find((item) => item.isPrimary)?.id ?? next[0]?.id ?? null;
      });
    } catch (error) {
      setImageError(getApiErrorMessage(error, "تعذر حذف صورة الصنف"));
    } finally {
      setImageDeletingId(null);
    }
  };

  const setPrimaryImage = async (image) => {
    if (!image?.id || image.isPrimary) return;
    setImagePrimaryUpdatingId(image.id);
    setImageError("");
    try {
      const response = await productsApi.setPrimaryImage(id, image.id);
      const primaryId = response.data?.id ?? image.id;
      setImages((p) => p.map((item) => ({ ...item, isPrimary: item.id === primaryId })));
      setSelectedImageId(primaryId);
    } catch (error) {
      setImageError(getApiErrorMessage(error, "تعذر تعيين الصورة الرئيسية"));
    } finally {
      setImagePrimaryUpdatingId(null);
    }
  };

  const handleProcessSelectedImage = async () => {
    if (!isEdit) {
      setImageError("احفظ الصنف أولاً ثم افتحه لمعالجة الصور.");
      return;
    }
    const selectedImage = images.find((image) => image.id === selectedImageId)
      ?? images.find((image) => image.isPrimary)
      ?? images[0];
    if (!selectedImage?.id) {
      setImageError("اختر صورة من صور الصنف أولاً ثم اضغط عزل الخلفية.");
      return;
    }

    setImageProcessingId(selectedImage.id);
    setImageError("");
    try {
      const response = await productsApi.processImage(id, selectedImage.id);
      await refreshProductImages(response.data?.id);
    } catch (error) {
      setImageError(getApiErrorMessage(error, "تعذر معالجة صورة الصنف"));
    } finally {
      setImageProcessingId(null);
    }
  };

  useEffect(() => () => {
    imageObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    imageObjectUrls.current = [];
  }, []);

  useEffect(() => {
    setSelectedImageId((current) => {
      if (current && images.some((image) => image.id === current)) return current;
      return images.find((image) => image.isPrimary)?.id ?? images[0]?.id ?? null;
    });
  }, [images]);

  useEffect(() => {
    if (!isEdit) return undefined;
    let active = true;
    setImageError("");
    refreshProductImages()
      .then(() => {})
      .catch((error) => {
        if (active) setImageError(getApiErrorMessage(error, "تعذر تحميل صور الصنف"));
      });
    return () => { active = false; };
  }, [id, isEdit]);

  const handleGenerateProductImage = async () => {
    if (!isEdit) {
      setImageError("احفظ الصنف أولاً ثم افتحه لتوليد صور مرتبطة به.");
      return;
    }
    if (!form.name.trim()) {
      setImageError("اسم الصنف مطلوب قبل توليد الصورة.");
      return;
    }
    setImageGenerating(true);
    setImageError("");
    try {
      await productsApi.generateImage(id, {
        name: form.name,
        sku: form.code,
        description: form.description,
        category: form.category,
        baseUnit: form.baseUnit,
        packageUnit: form.packageUnit,
      });
      await refreshProductImages();
    } catch (error) {
      setImageError(getApiErrorMessage(error, "تعذر توليد صورة الصنف بالذكاء الاصطناعي"));
    } finally {
      setImageGenerating(false);
    }
  };

  useEffect(() => {
    setUnits((prev) => prev.map((u) => (u.isBase ? { ...u, unit: form.baseUnit } : u)));
  }, [form.baseUnit]);

  useEffect(() => {
    setUnits((prev) => prev.map((u) => (u.isBase ? { ...u, barcode: form.barcode } : u)));
  }, [form.barcode]);

  const handleAIFill = () => {
    const name = form.name || "صنف جديد";
    setForm((p) => ({
      ...p,
      code: p.code || `AI-${Date.now().toString().slice(-5)}`,
      baseUnit: p.baseUnit || "قطعة",
      category: p.category || catalogCategories[0]?.name || "",
      description: p.description || `${name} — منتج عالي الجودة مُولَّد بالذكاء الاصطناعي.`,
      weightPerUnit: p.weightPerUnit || "0.5",
      unitsPerPackage: p.unitsPerPackage || "12",
      packageUnit: "كرطون",
    }));
    if (!form.barcode) setForm((p) => ({ ...p, barcode: generateBarcode() }));
    setUnits((prev) => {
      const base = prev.find((u) => u.isBase);
      if (prev.length < 2) {
        return [
          { ...base, price: "1500", conversionFactor: 1 },
          { ...newUnitRow(), unit: "كرطون", conversionFactor: 12, price: "16000", barcode: generateBarcode() },
        ];
      }
      return prev;
    });
  };

  const handleSave = async () => {
    setTouched(true);
    const selectedUnit = catalogUnits.find((u) => u.name === form.baseUnit);
    const selectedCategory = catalogCategories.find((c) => c.name === form.category);
    const baseUnitPrice = units.find((u) => u.isBase)?.price;
    const unitsPerPackageValue = form.unitsPerPackage === "" ? 1 : Number(form.unitsPerPackage);
    const weightPerUnitValue = form.weightPerUnit === "" ? 0 : Number(form.weightPerUnit);
    const currentPriceAmount = baseUnitPrice === "" || baseUnitPrice === undefined ? null : Number(baseUnitPrice);
    const nextErrors = {};

    if (isBlank(form.name)) nextErrors.name = t("اسم الصنف مطلوب");
    if (isBlank(form.code)) nextErrors.sku = t("الكود مطلوب");
    if (isBlank(form.baseUnit)) nextErrors.baseUnitId = t("وحدة القياس مطلوبة");
    else if (!selectedUnit?.id) nextErrors.baseUnitId = t("اختر وحدة موجودة من القائمة");
    if (!Number.isFinite(unitsPerPackageValue) || unitsPerPackageValue <= 0) {
      nextErrors.unitsPerPackage = t("عدد الوحدات في التعليبة يجب أن يكون رقماً أكبر من صفر");
    }
    if (!Number.isFinite(weightPerUnitValue) || weightPerUnitValue < 0) {
      nextErrors.weightPerUnit = t("الوزن يجب أن يكون رقماً غير سالب");
    }
    if (currentPriceAmount !== null && (!Number.isFinite(currentPriceAmount) || currentPriceAmount < 0)) {
      nextErrors._global = t("سعر الوحدة الأساسية يجب أن يكون رقماً غير سالب");
    }
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      sku: form.code.trim(),
      name: form.name.trim(),
      categoryId: selectedCategory?.id ?? null,
      baseUnitId: selectedUnit.id,
      barcode: form.barcode.trim() || null,
      unitsPerPackage: unitsPerPackageValue,
      currentPriceAmount,
      minStockQty: 0,
      description: form.description.trim() || null,
      status: "active",
    };
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) await productsApi.update(id, payload);
      else await productsApi.create(payload);
      navigate("/products");
    } catch (error) {
      applyApiErrors(error, setErrors, "تعذر حفظ الصنف");
    } finally {
      setSaving(false);
    }
  };

  const cats   = catalogCategories.map((c) => c.name);
  const units_ = catalogUnits.map((u) => u.name);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Page Header ── */}
        <SoftBox
          mb={3} px={0.5}
          display="flex" alignItems="center" gap={1.5} flexWrap="wrap"
        >
          <IconButton
            size="small" onClick={() => navigate(isEdit ? `/products/${id}` : "/products")}
            sx={{ border: "1px solid #e9ecef", borderRadius: "8px", p: "6px" }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <SoftBox flex={1} minWidth={0}>
            <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#344767" }}>
              {isEdit ? "تعديل الصنف" : "إضافة صنف جديد"}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {isEdit ? "تعديل بيانات الصنف الموجود" : "أضف صنفاً جديداً مع وحداته ومتغيراته"}
            </SoftTypography>
          </SoftBox>

          <SoftBox display="flex" gap={1} alignItems="center">
            <Tooltip title="إعدادات الأصناف">
              <IconButton
                size="small" onClick={() => navigate("/products/settings")}
                sx={{ border: "1px solid #e9ecef", borderRadius: "8px", p: "6px" }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <SoftButton variant="outlined" color="secondary" size="small"
              onClick={() => navigate("/products")}>
              إلغاء
            </SoftButton>
            <SoftButton variant="gradient" color="info" size="small"
              startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
              {saving ? "جارٍ الحفظ..." : "حفظ الصنف"}
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {errors._global && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ── Left: Main Form ── */}
          <Grid item xs={12} lg={8}>

            {/* 1 — Basic Info + Barcode */}
            <SectionCard
              icon={<LocalOfferIcon sx={{ fontSize: 18, color: "#17c1e8" }} />}
              title="المعلومات الأساسية"
              subtitle="اسم الصنف، الفئة، الوحدة، والباركود"
              accentColor="#17c1e8"
            >
              <Grid container spacing={2}>
                {/* Row 1: name + code */}
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth label="اسم الصنف *" value={form.name}
                    onChange={set("name")} size="small"
                    error={!!errors.name || (touched && !form.name.trim())}
                    helperText={errors.name || (touched && !form.name.trim() ? "الاسم مطلوب" : "")}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth label="الكود / المرجع *" value={form.code}
                    onChange={set("code")} size="small" placeholder="مثال: BRG-010"
                    error={!!errors.sku || !!errors.code}
                    helperText={errors.sku || errors.code || ""}
                  />
                </Grid>

                {/* Row 2: category + base unit */}
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth select label="الفئة" value={form.category}
                    onChange={set("category")} size="small">
                    {cats.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth select label="وحدة القياس الأساسية *"
                    value={form.baseUnit} onChange={set("baseUnit")} size="small"
                    error={!!errors.baseUnitId || !!errors.baseUnit || (touched && !form.baseUnit)}
                    helperText={errors.baseUnitId || errors.baseUnit || (touched && !form.baseUnit ? "الوحدة مطلوبة" : "")}
                  >
                    {units_.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                  </TextField>
                </Grid>

                {/* Row 3: description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth multiline rows={2} label="الوصف"
                    value={form.description} onChange={set("description")} size="small"
                  />
                </Grid>

                {/* Divider */}
                <Grid item xs={12}>
                  <Divider sx={{ mt: 0.5, mb: 0 }} />
                  <SoftBox display="flex" alignItems="center" gap={0.8} mt={1} mb={0.5}>
                    <QrCodeScannerIcon sx={{ fontSize: 14, color: "#8392ab" }} />
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      الباركود
                    </SoftTypography>
                    <SoftTypography variant="caption" color="secondary">
                      — ضع المؤشر في الحقل ثم امسح بالقارئ
                    </SoftTypography>
                  </SoftBox>
                </Grid>

                {/* Row 4: barcode */}
                <Grid item xs={12} sm={8}>
                  <BarcodeInput
                    value={form.barcode}
                    onChange={(v) => setForm((p) => ({ ...p, barcode: v }))}
                    label="الباركود الرئيسي للصنف"
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* 2 — Units */}
            <UnitsSection units={units} unitOptions={catalogUnits} onChange={setUnits} />

            {/* 3 — Variants */}
            <VariantsSection
              hasVariants={hasVariants}
              onToggle={(v) => { setHasVariants(v); if (!v) setVariants([]); }}
              variantAttrs={variantAttrs} onAttrsChange={setVariantAttrs}
              variants={variants} onVariantsChange={setVariants}
              productCode={form.code}
            />

            {/* 4 — Weight & Packaging */}
            <SectionCard
              icon={<ScaleIcon sx={{ fontSize: 18, color: "#fb8c00" }} />}
              title="الوزن والتعليب"
              subtitle="لحساب وزن الطلبية وعدد الكراطين في فواتير الطريق"
              accentColor="#fb8c00"
            >
              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth type="number" label="وزن الوحدة (كغ)"
                    value={form.weightPerUnit} onChange={set("weightPerUnit")}
                    size="small" inputProps={{ min: 0, step: 0.001 }}
                    error={!!errors.weightPerUnit}
                    helperText={errors.weightPerUnit || ""}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth type="number" label="وحدات في التعليبة"
                    value={form.unitsPerPackage} onChange={set("unitsPerPackage")}
                    size="small" inputProps={{ min: 1 }}
                    error={!!errors.unitsPerPackage}
                    helperText={errors.unitsPerPackage || ""}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth select label="نوع التعليبة"
                    value={form.packageUnit} onChange={set("packageUnit")} size="small"
                  >
                    {["كرطون","علبة","ساشيه","كيس","رزمة","طرد"].map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {form.weightPerUnit && form.unitsPerPackage &&
                  Number(form.weightPerUnit) > 0 && Number(form.unitsPerPackage) > 0 && (
                  <Grid item xs={12}>
                    <SoftBox px={2} py={1.5} sx={{ background: "#fff8f0", borderRadius: 2, border: "1px solid #fb8c0022" }}>
                      <SoftTypography variant="caption" color="text">
                        طلب <strong>200 {form.baseUnit || "وحدة"}</strong> ←{" "}
                        <strong style={{ color: "#fb8c00" }}>
                          {Math.ceil(200 / Number(form.unitsPerPackage))} {form.packageUnit}
                        </strong>{" "}
                        — وزن إجمالي{" "}
                        <strong style={{ color: "#fb8c00" }}>
                          {(200 * Number(form.weightPerUnit)).toFixed(2)} كغ
                        </strong>
                      </SoftTypography>
                    </SoftBox>
                  </Grid>
                )}
              </Grid>
            </SectionCard>

            {/* 5 — Initial Stock */}
            {!isEdit && !hasVariants && (
              <SectionCard
                icon={<InventoryIcon sx={{ fontSize: 18, color: "#344767" }} />}
                title="المخزون الابتدائي"
                subtitle="الكمية المتاحة عند إنشاء الصنف"
                accentColor="#344767"
              >
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth type="number" label="الكمية"
                      value={form.initialStock} onChange={set("initialStock")}
                      size="small" inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth select label="المستودع"
                      value={form.initialWarehouseId} onChange={set("initialWarehouseId")} size="small"
                    >
                      {warehouses.map((w) => (
                        <MenuItem key={w.id} value={w.id}>
                          {w.name}{w.isDefault ? " · افتراضي" : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth type="number" label="حد التنبيه"
                      size="small" defaultValue={20} inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            )}
            {!isEdit && hasVariants && (
              <SoftBox mb={3} px={2} py={1.5}
                sx={{ background: "#f0f7ff", borderRadius: 2, border: "1px dashed #17c1e8" }}>
                <SoftTypography variant="caption" color="info">
                  المخزون يُدار لكل متغير على حدة — عدّل الكميات في جدول المتغيرات أعلاه
                </SoftTypography>
              </SoftBox>
            )}

            {/* 6 — Images */}
            <SectionCard
              icon={<AddPhotoAlternateIcon sx={{ fontSize: 18, color: "#8392ab" }} />}
              title="صور الصنف"
              subtitle="ولّد صوراً للصنف من الاسم والوصف أو أضفها يدوياً"
              accentColor="#8392ab"
            >
              {imageError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImageError("")}>
                  {imageError}
                </Alert>
              )}
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleUploadProductImage}
              />
              <ImageUploadZone
                images={images}
                onAdd={addImage}
                onRemove={removeImage}
                onGenerate={handleGenerateProductImage}
                onSetPrimary={setPrimaryImage}
                onSelect={(image) => image?.id && setSelectedImageId(image.id)}
                onProcess={handleProcessSelectedImage}
                generating={imageGenerating}
                uploading={imageUploading}
                processingImageId={imageProcessingId}
                generateDisabled={!isEdit}
                processDisabled={!isEdit || imageUploading || imageGenerating || !images.some((image) => image.id === selectedImageId)}
                selectedImageId={selectedImageId}
                removingImageId={imageDeletingId}
                primaryUpdatingImageId={imagePrimaryUpdatingId}
              />
              {(imageGenerating || imageUploading || imageProcessingId) && (
                <SoftBox mt={1.5}>
                  <LinearProgress sx={{ height: 5, borderRadius: 3 }} />
                  <SoftTypography variant="caption" color="secondary">
                    {imageGenerating
                      ? "يتم توليد صورة جديدة من بيانات الصنف الحالية..."
                      : imageUploading
                        ? "يتم رفع الصورة وربطها بالصنف..."
                        : "يتم عزل الخلفية وحفظ نسخة معالجة كصورة رئيسية..."}
                  </SoftTypography>
                </SoftBox>
              )}
              {images.length === 0 && (
                <SoftBox mt={1}>
                  <SoftTypography variant="caption" color="secondary">
                    لم تُضف صور بعد — احفظ الصنف ثم اضغط توليد صورة بالذكاء الاصطناعي أو أضف صورة يدوياً
                  </SoftTypography>
                </SoftBox>
              )}
            </SectionCard>
          </Grid>

          {/* ── Right Panel (sticky) ── */}
          <Grid item xs={12} lg={4}>
            <SoftBox sx={{ position: "sticky", top: 16 }}>
              <AIPanel onAIFill={handleAIFill} />

              <Card sx={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <SoftBox px={2.5} py={1.5} sx={{ borderBottom: "1px solid #f0f2f5" }}>
                  <SoftTypography variant="button" fontWeight="bold" color="text">نصائح سريعة</SoftTypography>
                </SoftBox>
                <SoftBox px={2.5} py={2}>
                  {[
                    { icon: "🔍", text: "امسح الباركود بالقارئ بعد تركيز المؤشر في الحقل" },
                    { icon: "🎨", text: "فعّل المتغيرات للأصناف ذات الألوان أو المقاسات" },
                    { icon: "📦", text: "أضف وحدات كالكرطون مع معامل التحويل وسعر خاص" },
                    { icon: "✨", text: "استخدم التعبئة بالذكاء الاصطناعي لملء البيانات تلقائياً" },
                    { icon: "⚙", text: "أدر الوحدات والتصنيفات من أيقونة الإعدادات في الرأس" },
                  ].map((tip, i) => (
                    <SoftBox key={i} display="flex" gap={1.5} mb={1.2} alignItems="flex-start">
                      <SoftBox sx={{ fontSize: "14px", lineHeight: 1.5, flexShrink: 0 }}>{tip.icon}</SoftBox>
                      <SoftTypography variant="caption" color="text" sx={{ lineHeight: 1.6 }}>{tip.text}</SoftTypography>
                    </SoftBox>
                  ))}
                </SoftBox>
              </Card>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
