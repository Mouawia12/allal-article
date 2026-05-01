/* eslint-disable react/prop-types */
import { useCallback, useMemo, useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import SearchIcon from "@mui/icons-material/Search";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import MoveUpIcon from "@mui/icons-material/MoveUp";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { inventoryApi, productsApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank, isPositiveNumber } from "utils/formErrors";
import { useI18n } from "i18n";

const warehouseTypeLabels = {
  central: "مركزي",
  operational: "تشغيلي",
  quarantine: "حجر/مرتجع",
  default: "افتراضي",
};

const warehouseTypeOptions = [
  { value: "central", label: "مركزي" },
  { value: "operational", label: "تشغيلي" },
  { value: "quarantine", label: "حجر/مرتجع" },
  { value: "default", label: "افتراضي" },
];

const movementTypeLabels = {
  INITIAL_STOCK: "رصيد افتتاحي",
  ADJUSTMENT_IN: "تسوية دخول",
  ADJUSTMENT_OUT: "تسوية خروج",
  TRANSFER_IN: "تحويل دخول",
  TRANSFER_OUT: "تحويل خروج",
  PURCHASE_IN: "استلام مشتريات",
  SALE_OUT: "خروج بيع",
};

const emptyAdjustment = {
  productId: "",
  warehouseId: "",
  qty: "",
  type: "IN",
  notes: "",
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 0,
  });
}

function getStatus(item) {
  const available = Number(item.available ?? Number(item.onHand || 0) - Number(item.reserved || 0));
  if (Number(item.onHand || 0) === 0) return { label: "نفذ", color: "error" };
  if (available <= 0) return { label: "غير متاح", color: "error" };
  if (available <= item.minStock) return { label: "منخفض", color: "warning" };
  return { label: "متوفر", color: "success" };
}

function SummaryCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftBox display="flex" alignItems="center" gap={2}>
        <SoftBox
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `linear-gradient(195deg, ${color}99, ${color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 24 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="h4" fontWeight="bold">{value}</SoftTypography>
          <SoftTypography variant="caption" color="text">{label}</SoftTypography>
          {sub && <SoftTypography variant="caption" color="secondary" display="block">{sub}</SoftTypography>}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

function getWarehouseName(id, warehouses) {
  return warehouses.find((warehouse) => Number(warehouse.id) === Number(id))?.name || "—";
}

function extractApiList(response) {
  if (Array.isArray(response.data)) return response.data;
  return response.data?.content ?? [];
}

function normalizeWarehouse(warehouse) {
  const warehouseType = warehouse.warehouseType || warehouse.type || "operational";
  const capacity = Number(warehouse.capacity ?? warehouse.capacityQty ?? 0) || 1;

  return {
    ...warehouse,
    warehouseType,
    type: warehouseTypeLabels[warehouseType] || warehouseType,
    manager: warehouse.managerName || warehouse.manager || "—",
    capacity,
    capacityQty: Number(warehouse.capacityQty ?? capacity),
    isDefault: Boolean(warehouse.isDefault),
  };
}

function normalizeProductOption(product) {
  return {
    ...product,
    id: product.id,
    name: product.name || product.nameAr || `صنف ${product.id}`,
    code: product.sku || product.code || String(product.id),
    category: product.categoryName || product.category || "عام",
    unit: product.baseUnitSymbol || product.baseUnitName || product.unit || "وحدة",
    minStock: Number(product.minStockQty ?? product.minStock ?? 0),
  };
}

function hydrateStockLines(stockLines, warehouses) {
  return stockLines.map((line) => {
    const warehouse = warehouses.find((w) => Number(w.id) === Number(line.warehouseId ?? line.warehouse_id));
    // Normalize field names: API uses onHandQty/reservedQty/availableQty
    const onHand = Number(line.onHand ?? line.onHandQty ?? 0);
    const reserved = Number(line.reserved ?? line.reservedQty ?? 0);
    const pending = Number(line.pending ?? line.pendingQty ?? 0);
    const available = Number(line.available ?? line.availableQty ?? onHand - reserved);
    const projected = Number(line.projected ?? line.projectedQty ?? available + pending);
    const name = line.name ?? line.productName ?? "";
    const code = line.code ?? line.productSku ?? line.productCode ?? "";
    const category = line.category ?? line.categoryName ?? "";
    const unit = line.unit ?? line.baseUnitSymbol ?? line.baseUnitName ?? "وحدة";
    const minStock = Number(line.minStock ?? line.minStockQty ?? 0);
    return {
      ...line,
      name, code, category, unit,
      onHand, reserved, pending, minStock,
      warehouseName: line.warehouseName ?? warehouse?.name ?? "—",
      warehouseType: line.warehouseType ?? warehouse?.type ?? "—",
      available, projected,
      color: "#17c1e8",
    };
  });
}

const emptyTransfer = {
  fromWarehouseId: "",
  toWarehouseId: "",
  productId: "",
  qty: 0,
  reason: "",
};

function Inventory() {
  const { t } = useI18n();
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState(0);
  const [viewTab, setViewTab] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [stockLines, setStockLines] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [transferMode, setTransferMode] = useState("product");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transfer, setTransfer] = useState(emptyTransfer);
  const [transferErrors, setTransferErrors] = useState({});
  const [transferSaving, setTransferSaving] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustment, setAdjustment] = useState(emptyAdjustment);
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [adjustmentSaving, setAdjustmentSaving] = useState(false);
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    type: "operational",
    city: "",
    manager: "",
    capacity: 1000,
    isDefault: false,
  });
  const [warehouseErrors, setWarehouseErrors] = useState({});
  const [warehouseSaving, setWarehouseSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [dataLoading, setDataLoading] = useState(false);

  const loadInventoryData = useCallback(() => {
    const appendError = (error, fallback) => {
      setPageError((current) => {
        const message = getApiErrorMessage(error, fallback);
        return current ? `${current}؛ ${message}` : message;
      });
    };
    setPageError("");
    setDataLoading(true);

    return Promise.all([
      inventoryApi.listWarehouses()
        .then((r) => extractApiList(r).map(normalizeWarehouse))
        .catch((error) => {
          appendError(error, "تعذر تحميل المستودعات");
          return [];
        }),
      inventoryApi.listStock({ size: 1000 })
        .then(extractApiList)
        .catch((error) => {
          appendError(error, "تعذر تحميل المخزون");
          return [];
        }),
      inventoryApi.listMovements({ size: 100 })
        .then(extractApiList)
        .catch((error) => {
          appendError(error, "تعذر تحميل حركات المخزون");
          return [];
        }),
      productsApi.list({ size: 500 })
        .then((r) => extractApiList(r).map(normalizeProductOption))
        .catch((error) => {
          appendError(error, "تعذر تحميل الأصناف");
          return [];
        }),
    ]).then(([nextWarehouses, nextStock, nextMovements, nextProducts]) => {
      setWarehouses(nextWarehouses);
      setStockLines(nextStock);
      setMovements(nextMovements);
      setProducts(nextProducts);
    }).finally(() => setDataLoading(false));
  }, []);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  const inventory = useMemo(() => hydrateStockLines(stockLines, warehouses), [stockLines, warehouses]);

  const filteredByWarehouse =
    selectedWarehouse === "all"
      ? inventory
      : inventory.filter((item) => Number(item.warehouseId) === Number(selectedWarehouse));

  const filterStatus = ["all", "out", "low", "ok"][statusTab];
  const filtered = filteredByWarehouse.filter((item) => {
    const status = getStatus(item);
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "out" && status.color === "error") ||
      (filterStatus === "low" && status.color === "warning") ||
      (filterStatus === "ok" && status.color === "success");

    const matchSearch =
      (item.name || "").includes(search) ||
      (item.code || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").includes(search) ||
      (item.warehouseName || "").includes(search);

    return matchStatus && matchSearch;
  });

  const outCount = filteredByWarehouse.filter((item) => getStatus(item).color === "error").length;
  const lowCount = filteredByWarehouse.filter((item) => getStatus(item).color === "warning").length;
  const okCount = filteredByWarehouse.filter((item) => getStatus(item).color === "success").length;
  const totalOnHand = filteredByWarehouse.reduce((sum, item) => sum + Number(item.onHand || 0), 0);
  const totalReserved = filteredByWarehouse.reduce((sum, item) => sum + Number(item.reserved || 0), 0);
  const totalPending = filteredByWarehouse.reduce((sum, item) => sum + Number(item.pending || 0), 0);

  const fromLine = inventory.find(
    (line) =>
      Number(line.productId) === Number(transfer.productId) &&
      Number(line.warehouseId) === Number(transfer.fromWarehouseId)
  );
  const maxTransferQty = Math.max(0, Number(fromLine?.available || 0));

  const openTransfer = (mode, defaults = {}) => {
    setTransferMode(mode);
    setTransferErrors({});
    setTransfer({
      ...emptyTransfer,
      ...defaults,
      toWarehouseId:
        defaults.toWarehouseId ||
        warehouses.find((warehouse) => Number(warehouse.id) !== Number(defaults.fromWarehouseId || emptyTransfer.fromWarehouseId))?.id ||
        emptyTransfer.toWarehouseId,
    });
    setTransferOpen(true);
  };

  const setTransferField = (field) => (event) => {
    const value = event.target.value;
    setTransfer((draft) => {
      const next = { ...draft, [field]: value };
      if (field === "fromWarehouseId" && Number(value) === Number(next.toWarehouseId)) {
        next.toWarehouseId = warehouses.find((warehouse) => Number(warehouse.id) !== Number(value))?.id || "";
      }
      if (field === "fromWarehouseId") {
        next.productId = "";
        next.qty = 0;
      }
      if (field === "toWarehouseId" && Number(value) === Number(next.fromWarehouseId)) {
        next.fromWarehouseId = warehouses.find((warehouse) => Number(warehouse.id) !== Number(value))?.id || "";
      }
      return next;
    });
  };

  const closeTransfer = () => {
    setTransferOpen(false);
    setTransfer(emptyTransfer);
    setTransferErrors({});
  };

  const handleTransfer = async () => {
    const validationErrors = {};
    if (!transfer.fromWarehouseId) validationErrors.fromWarehouseId = t("المستودع المصدر مطلوب");
    if (!transfer.toWarehouseId) validationErrors.toWarehouseId = t("المستودع الوجهة مطلوب");
    if (Number(transfer.fromWarehouseId) === Number(transfer.toWarehouseId)) {
      validationErrors._global = t("لا يمكن التحويل إلى نفس المستودع");
    }

    if (transferMode === "product") {
      const qty = Math.min(Math.max(Number(transfer.qty || 0), 0), maxTransferQty);
      if (!transfer.productId) validationErrors.productId = t("الصنف مطلوب");
      if (!qty) validationErrors.qty = t("الكمية يجب أن تكون أكبر من صفر");
      if (Number(transfer.qty || 0) > maxTransferQty) {
        validationErrors.qty = t(`الكمية أكبر من المتاح للتحويل (${formatNumber(maxTransferQty)})`);
      }
    } else {
      const transferableLines = inventory.filter(
        (line) => Number(line.warehouseId) === Number(transfer.fromWarehouseId) && Number(line.available || 0) > 0
      );
      if (!transferableLines.length) validationErrors._global = t("لا توجد كميات متاحة للتحويل من هذا المستودع");
    }

    setTransferErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setTransferSaving(true);
    try {
      if (transferMode === "product") {
        await inventoryApi.transfer({
          productId: Number(transfer.productId),
          fromWarehouseId: Number(transfer.fromWarehouseId),
          toWarehouseId: Number(transfer.toWarehouseId),
          qty: Number(transfer.qty),
          notes: transfer.reason || null,
        });
      } else {
        const transferableLines = inventory.filter(
          (line) => Number(line.warehouseId) === Number(transfer.fromWarehouseId) && Number(line.available || 0) > 0
        );
        for (const line of transferableLines) {
          await inventoryApi.transfer({
            productId: Number(line.productId),
            fromWarehouseId: Number(transfer.fromWarehouseId),
            toWarehouseId: Number(transfer.toWarehouseId),
            qty: Number(line.available),
            notes: transfer.reason || "تحويل مستودع كامل",
          });
        }
      }
      await loadInventoryData();
      closeTransfer();
    } catch (error) {
      applyApiErrors(error, setTransferErrors, "فشل تنفيذ التحويل");
    } finally {
      setTransferSaving(false);
    }
  };

  const openAdjustment = (defaults = {}) => {
    setAdjustment({
      ...emptyAdjustment,
      warehouseId: selectedWarehouse !== "all" ? selectedWarehouse : "",
      ...defaults,
    });
    setAdjustmentErrors({});
    setAdjustmentOpen(true);
  };

  const closeAdjustment = () => {
    setAdjustmentOpen(false);
    setAdjustment(emptyAdjustment);
    setAdjustmentErrors({});
  };

  const setAdjustmentField = (field) => (event) => {
    const value = event.target.value;
    setAdjustment((current) => ({ ...current, [field]: value }));
    if (adjustmentErrors[field] || adjustmentErrors._global) {
      setAdjustmentErrors((current) => ({ ...current, [field]: "", _global: "" }));
    }
  };

  const saveAdjustment = async () => {
    const validationErrors = {};
    if (!adjustment.productId) validationErrors.productId = t("الصنف مطلوب");
    if (!adjustment.warehouseId) validationErrors.warehouseId = t("المستودع مطلوب");
    if (!isPositiveNumber(adjustment.qty)) validationErrors.qty = t("الكمية يجب أن تكون أكبر من صفر");

    setAdjustmentErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setAdjustmentSaving(true);
    try {
      await inventoryApi.adjust({
        productId: Number(adjustment.productId),
        warehouseId: Number(adjustment.warehouseId),
        qty: Number(adjustment.qty),
        type: adjustment.type,
        notes: adjustment.notes || null,
      });
      await loadInventoryData();
      closeAdjustment();
    } catch (error) {
      applyApiErrors(error, setAdjustmentErrors, "فشل حفظ تسوية المخزون");
    } finally {
      setAdjustmentSaving(false);
    }
  };

  const openWarehouseDialog = (warehouse = null) => {
    setEditingWarehouseId(warehouse?.id || null);
    setWarehouseForm({
      code: warehouse?.code || "",
      name: warehouse?.name || "",
      type: warehouse?.warehouseType || "operational",
      city: warehouse?.city || "",
      manager: warehouse?.managerName || warehouse?.manager || "",
      capacity: warehouse?.capacity ?? warehouse?.capacityQty ?? 1000,
      isDefault: Boolean(warehouse?.isDefault),
    });
    setWarehouseErrors({});
    setWarehouseDialog(true);
  };

  const closeWarehouseDialog = () => {
    setWarehouseDialog(false);
    setEditingWarehouseId(null);
  };

  const setWarehouseField = (field) => (event) => {
    const value = field === "isDefault" ? event.target.checked : event.target.value;
    setWarehouseForm((form) => ({ ...form, [field]: value }));
    if (warehouseErrors[field] || warehouseErrors._global) {
      setWarehouseErrors((current) => ({ ...current, [field]: "", _global: "" }));
    }
  };

  const saveWarehouse = () => {
    const code = warehouseForm.code.trim();
    const name = warehouseForm.name.trim();
    const validationErrors = {};
    if (isBlank(code)) validationErrors.code = t("كود المستودع مطلوب");
    if (isBlank(name)) validationErrors.name = t("اسم المستودع مطلوب");
    if (!isPositiveNumber(warehouseForm.capacity)) validationErrors.capacityQty = t("الطاقة الاستيعابية يجب أن تكون أكبر من صفر");

    setWarehouseErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      code,
      name,
      warehouseType: warehouseForm.type,
      city: warehouseForm.city.trim() || "غير محدد",
      capacityQty: Number(warehouseForm.capacity || 1),
      isDefault: Boolean(warehouseForm.isDefault),
    };
    const apiCall = editingWarehouseId
      ? inventoryApi.updateWarehouse(editingWarehouseId, payload)
      : inventoryApi.createWarehouse(payload);
    setWarehouseSaving(true);
    apiCall
      .then((r) => {
        const saved = normalizeWarehouse(r.data);
        setWarehouses((current) => {
          const exists = current.some((w) => Number(w.id) === Number(saved.id));
          const updated = exists
            ? current.map((w) => (Number(w.id) === Number(saved.id) ? saved : w))
            : [...current, saved];
          return saved.isDefault
            ? updated.map((w) => ({ ...w, isDefault: Number(w.id) === Number(saved.id) }))
            : updated;
        });
        setWarehouseErrors({});
        closeWarehouseDialog();
      })
      .catch((error) => applyApiErrors(error, setWarehouseErrors, "فشل حفظ المستودع"))
      .finally(() => setWarehouseSaving(false));
  };

  const warehouseRows = warehouses.map((warehouse) => {
    const lines = inventory.filter((line) => Number(line.warehouseId) === Number(warehouse.id));
    const onHand = lines.reduce((sum, line) => sum + Number(line.onHand || 0), 0);
    const reserved = lines.reduce((sum, line) => sum + Number(line.reserved || 0), 0);
    const available = lines.reduce((sum, line) => sum + Number(line.available || 0), 0);
    const usagePct = Math.min(Math.round((onHand / warehouse.capacity) * 100), 100);

    return { ...warehouse, linesCount: lines.length, onHand, reserved, available, usagePct };
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">المخزون والمستودعات</SoftTypography>
            <SoftTypography variant="body2" color="text">
              متابعة أرصدة كل مستودع وتحويل الأصناف بين المستودعات
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton
              variant="outlined"
              color="success"
              size="small"
              startIcon={<TrendingUpIcon />}
              onClick={() => openAdjustment()}
            >
              تسوية مخزون
            </SoftButton>
            <SoftButton
              variant="outlined"
              color="info"
              size="small"
              startIcon={<SwapHorizIcon />}
              onClick={() => openTransfer("product")}
            >
              تحويل صنف
            </SoftButton>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              startIcon={<MoveUpIcon />}
              onClick={() => openTransfer("warehouse")}
            >
              تحويل مستودع كامل
            </SoftButton>
            <SoftButton
              variant="text"
              color="secondary"
              size="small"
              disabled={dataLoading}
              onClick={loadInventoryData}
            >
              تحديث
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="إجمالي الرصيد" value={formatNumber(totalOnHand)} color="#17c1e8" icon={WarehouseIcon} sub={selectedWarehouse === "all" ? "كل المستودعات" : getWarehouseName(selectedWarehouse, warehouses)} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="نفدت من المخزون" value={outCount} color="#ea0606" icon={ErrorIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="مخزون منخفض" value={lowCount} color="#fb8c00" icon={WarningIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="محجوز حالياً" value={formatNumber(totalReserved)} color="#66BB6A" icon={CheckCircleIcon} sub={`${formatNumber(totalPending)} قيد الطلب`} />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs
              value={viewTab}
              onChange={(_, value) => setViewTab(value)}
              textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {[
                "أرصدة المستودعات",
                "إدارة المستودعات",
                "حركات المخزون",
              ].map((label) => (
                <Tab
                  key={label}
                  label={<SoftTypography variant="caption" fontWeight="medium">{label}</SoftTypography>}
                />
              ))}
            </Tabs>
          </SoftBox>

          {viewTab === 0 && (
            <SoftBox p={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
                <TextField
                  size="small"
                  placeholder="بحث بالصنف، الكود، الفئة، أو المستودع..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ width: { xs: "100%", md: 360 } }}
                />
                <FormControl size="small" sx={{ minWidth: 210 }}>
                  <InputLabel>المستودع</InputLabel>
                  <Select value={selectedWarehouse} label="المستودع" onChange={(e) => setSelectedWarehouse(e.target.value)}>
                    <MenuItem value="all">كل المستودعات</MenuItem>
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </SoftBox>

              <SoftBox mb={2} borderBottom="1px solid #eee">
                <Tabs
                  value={statusTab}
                  onChange={(_, value) => setStatusTab(value)}
                  textColor="inherit"
                  TabIndicatorProps={{ style: { background: "#17c1e8" } }}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {[
                    { label: "الكل", count: filteredByWarehouse.length },
                    { label: "نفد", count: outCount },
                    { label: "منخفض", count: lowCount },
                    { label: "متوفر", count: okCount },
                  ].map((item) => (
                    <Tab
                      key={item.label}
                      label={
                        <SoftTypography variant="caption" fontWeight="medium">
                          {item.label}
                          <Chip size="small" label={item.count} sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
                        </SoftTypography>
                      }
                    />
                  ))}
                </Tabs>
              </SoftBox>

              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {[
                        "الصنف",
                        "المستودع",
                        "الفئة",
                        "الفعلي",
                        "محجوز",
                        "غير مؤكد",
                        "المتاح",
                        "المتوقع",
                        "حد التنبيه",
                        "الحالة",
                        "إجراء",
                      ].map((header) => (
                        <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, index) => {
                      const status = getStatus(item);
                      const usedPct = item.onHand > 0 ? Math.round((item.reserved / item.onHand) * 100) : 0;
                      return (
                        <tr
                          key={`${item.productId}-${item.warehouseId}`}
                          style={{
                            borderBottom: "1px solid #f0f2f5",
                            background:
                              status.color === "error"
                                ? "#fff5f5"
                                : status.color === "warning"
                                  ? "#fffbeb"
                                  : index % 2 === 0 ? "#fff" : "#fafbfc",
                          }}
                        >
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBox display="flex" alignItems="center" gap={1.5}>
                              <SoftBox
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1.5,
                                  background: `linear-gradient(135deg, ${item.color}66, ${item.color})`,
                                  flexShrink: 0,
                                }}
                              />
                              <SoftBox>
                                <SoftTypography variant="caption" fontWeight="bold" display="block">{item.name}</SoftTypography>
                                <SoftTypography variant="caption" color="secondary">{item.code}</SoftTypography>
                              </SoftBox>
                            </SoftBox>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{item.warehouseName}</SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">{item.warehouseType}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="text">{item.category}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{formatNumber(item.onHand)} {item.unit}</SoftTypography>
                            <LinearProgress
                              variant="determinate"
                              value={usedPct}
                              sx={{
                                height: 4,
                                borderRadius: 2,
                                bgcolor: "#e9ecef",
                                mt: 0.5,
                                width: 74,
                                "& .MuiLinearProgress-bar": { background: usedPct > 80 ? "#ea0606" : usedPct > 50 ? "#fb8c00" : "#66BB6A" },
                              }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" color="warning" fontWeight="bold">{formatNumber(item.reserved)}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" color="text">{formatNumber(item.pending)}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography
                              variant="caption"
                              fontWeight="bold"
                              color={item.available <= 0 ? "error" : item.available <= item.minStock ? "warning" : "success"}
                            >
                              {formatNumber(item.available)}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" color={item.projected < 0 ? "error" : "text"}>
                              {formatNumber(item.projected)}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" color="secondary">{formatNumber(item.minStock)}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBadge variant="gradient" color={status.color} size="xs" badgeContent={status.label} container />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBox display="flex" gap={0.5}>
                              <Tooltip title="تحويل هذا الصنف">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  sx={{ border: "1px solid #e0e0e0", p: 0.4 }}
                                  onClick={() =>
                                    openTransfer("product", {
                                      fromWarehouseId: item.warehouseId,
                                      productId: item.productId,
                                      qty: Math.max(0, item.available),
                                    })
                                  }
                                >
                                  <SwapHorizIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="تسوية هذا الصنف">
                                <IconButton
                                  size="small"
                                  sx={{ border: "1px solid #e0e0e0", p: 0.4 }}
                                  onClick={() =>
                                    openAdjustment({
                                      productId: item.productId,
                                      warehouseId: item.warehouseId,
                                      type: "IN",
                                    })
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </SoftBox>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </SoftBox>
            </SoftBox>
          )}

          {viewTab === 1 && (
            <SoftBox p={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
                <SoftBox>
                  <SoftTypography variant="h6" fontWeight="bold">إدارة المستودعات</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    كل مستودع له أرصدة مستقلة، وتحويل المخزون يكتب حركة خروج ودخول مرتبطة.
                  </SoftTypography>
                </SoftBox>
                <SoftButton variant="outlined" color="info" size="small" startIcon={<AddIcon />} onClick={() => openWarehouseDialog()}>
                  مستودع جديد
                </SoftButton>
              </SoftBox>
              <Grid container spacing={2}>
                {warehouseRows.map((warehouse) => (
                  <Grid item xs={12} md={6} xl={3} key={warehouse.id}>
                    <Card sx={{ p: 2.5, height: "100%" }}>
                      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                        <SoftBox>
                          <SoftTypography variant="h6" fontWeight="bold">{warehouse.name}</SoftTypography>
                          <SoftTypography variant="caption" color="secondary">{warehouse.city} - {warehouse.type}</SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" gap={0.5} flexWrap="wrap" justifyContent="flex-end">
                          {warehouse.isDefault && (
                            <SoftBadge variant="gradient" color="info" size="xs" badgeContent="افتراضي" container />
                          )}
                          <SoftBadge variant="gradient" color="success" size="xs" badgeContent="نشط" container />
                        </SoftBox>
                      </SoftBox>
                      <SoftTypography variant="caption" color="text" display="block" mb={1}>
                        المسؤول: {warehouse.manager}
                      </SoftTypography>
                      <SoftBox display="flex" justifyContent="space-between" mb={0.75}>
                        <SoftTypography variant="caption" color="secondary">الأصناف</SoftTypography>
                        <SoftTypography variant="caption" fontWeight="bold">{warehouse.linesCount}</SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" mb={0.75}>
                        <SoftTypography variant="caption" color="secondary">المتاح</SoftTypography>
                        <SoftTypography variant="caption" fontWeight="bold">{formatNumber(warehouse.available)}</SoftTypography>
                      </SoftBox>
                      <SoftBox display="flex" justifyContent="space-between" mb={0.75}>
                        <SoftTypography variant="caption" color="secondary">المحجوز</SoftTypography>
                        <SoftTypography variant="caption" color="warning" fontWeight="bold">{formatNumber(warehouse.reserved)}</SoftTypography>
                      </SoftBox>
                      <SoftBox mt={1.5}>
                        <SoftTypography variant="caption" color="secondary">استخدام الطاقة</SoftTypography>
                        <LinearProgress
                          variant="determinate"
                          value={warehouse.usagePct}
                          sx={{
                            height: 6,
                            borderRadius: 2,
                            bgcolor: "#e9ecef",
                            mt: 0.75,
                            "& .MuiLinearProgress-bar": { background: warehouse.usagePct > 85 ? "#ea0606" : "#17c1e8" },
                          }}
                        />
                        <SoftTypography variant="caption" color="text" display="block" mt={0.5}>{warehouse.usagePct}%</SoftTypography>
                      </SoftBox>
                      <SoftBox mt={2} display="flex" gap={1} flexWrap="wrap">
                        <SoftButton
                          variant="outlined"
                          color="info"
                          size="small"
                          onClick={() => openTransfer("warehouse", { fromWarehouseId: warehouse.id })}
                        >
                          تحويل كامل
                        </SoftButton>
                        <SoftButton variant="text" color="secondary" size="small" onClick={() => openWarehouseDialog(warehouse)}>تعديل</SoftButton>
                      </SoftBox>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </SoftBox>
          )}

          {viewTab === 2 && (
            <SoftBox p={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
                <SoftBox>
                  <SoftTypography variant="h6" fontWeight="bold">سجل حركات المخزون</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    كل دخول وخروج وتحويل يتم تسجيله من الباك مع الرصيد قبل وبعد الحركة.
                  </SoftTypography>
                </SoftBox>
                <SoftBox display="flex" gap={1} flexWrap="wrap">
                  <SoftButton variant="outlined" color="success" size="small" startIcon={<TrendingUpIcon />} onClick={() => openAdjustment()}>
                    تسوية مخزون
                  </SoftButton>
                  <SoftButton variant="outlined" color="info" size="small" startIcon={<SwapHorizIcon />} onClick={() => openTransfer("product")}>
                    تحويل صنف
                  </SoftButton>
                  <SoftButton variant="gradient" color="info" size="small" startIcon={<MoveUpIcon />} onClick={() => openTransfer("warehouse")}>
                    تحويل مستودع كامل
                  </SoftButton>
                </SoftBox>
              </SoftBox>
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["رقم", "النوع", "المستودع", "الصنف", "الكمية", "قبل", "بعد", "المستخدم", "الوقت", "ملاحظات"].map((header) => (
                        <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ padding: 28, textAlign: "center" }}>
                          <SoftTypography variant="body2" color="secondary">لا توجد حركات مخزون بعد</SoftTypography>
                        </td>
                      </tr>
                    )}
                    {movements.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="info" fontWeight="bold">{item.id}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge
                            variant="gradient"
                            color={String(item.movementType || "").includes("OUT") ? "warning" : "info"}
                            size="xs"
                            badgeContent={movementTypeLabels[item.movementType] || item.movementType}
                            container
                          />
                        </td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{item.warehouseName || getWarehouseName(item.warehouseId, warehouses)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{item.productName || "—"}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{formatNumber(item.qty)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{formatNumber(item.balanceBefore)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{formatNumber(item.balanceAfter)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{item.performedByName || "—"}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="secondary">{item.createdAt ? item.createdAt.slice(0, 16).replace("T", " ") : "—"}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="text">{item.notes || "—"}</SoftTypography></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SoftBox>
            </SoftBox>
          )}
        </Card>
      </SoftBox>

      <Dialog open={transferOpen} onClose={closeTransfer} maxWidth="md" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">
            {transferMode === "warehouse" ? "تحويل مستودع كامل" : "تحويل صنف بين مستودعات"}
          </SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {transferErrors._global && (
              <Grid item xs={12}>
                <Alert severity="error">{transferErrors._global}</Alert>
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>من مستودع</InputLabel>
                <Select value={transfer.fromWarehouseId} label="من مستودع" onChange={setTransferField("fromWarehouseId")}>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>إلى مستودع</InputLabel>
                <Select value={transfer.toWarehouseId} label="إلى مستودع" onChange={setTransferField("toWarehouseId")}>
                  {warehouses.filter((warehouse) => Number(warehouse.id) !== Number(transfer.fromWarehouseId)).map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {transferMode === "product" && (
              <>
                <Grid item xs={12} md={7}>
                  <FormControl fullWidth size="small" error={!!transferErrors.productId}>
                    <InputLabel>الصنف</InputLabel>
                    <Select value={transfer.productId} label="الصنف" onChange={setTransferField("productId")}>
                      {[...new Map(
                        inventory
                          .filter((s) => !transfer.fromWarehouseId || Number(s.warehouseId) === Number(transfer.fromWarehouseId))
                          .map((s) => [s.productId, s])
                      ).values()].map((s) => (
                        <MenuItem key={s.productId} value={s.productId}>
                          {s.name || s.productName || "—"} - {s.code || s.productSku || ""}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {transferErrors.productId && (
                    <SoftTypography variant="caption" color="error">{transferErrors.productId}</SoftTypography>
                  )}
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="الكمية"
                    value={transfer.qty}
                    onChange={setTransferField("qty")}
                    error={!!transferErrors.qty}
                    inputProps={{ min: 0, max: maxTransferQty }}
                    helperText={transferErrors.qty || `المتاح للتحويل: ${formatNumber(maxTransferQty)} ${fromLine?.unit || "وحدة"}`}
                  />
                </Grid>
              </>
            )}

            {transferMode === "warehouse" && (
              <Grid item xs={12}>
                <SoftBox p={1.5} sx={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 2 }}>
                  <SoftTypography variant="body2" color="text">
                    سيتم تحويل كل الكميات المتاحة فقط من المستودع المصدر إلى المستودع الوجهة. الكميات المحجوزة تبقى في المستودع المصدر حتى لا تنكسر طلبيات مؤكدة.
                  </SoftTypography>
                </SoftBox>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="سبب التحويل"
                value={transfer.reason}
                onChange={setTransferField("reason")}
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="text" color="secondary" onClick={closeTransfer}>تراجع</SoftButton>
          <SoftButton
            variant="gradient"
            color="info"
            disabled={
              transferSaving ||
              Number(transfer.fromWarehouseId) === Number(transfer.toWarehouseId) ||
              (transferMode === "product" && (!Number(transfer.qty || 0) || maxTransferQty <= 0))
            }
            onClick={handleTransfer}
          >
            {transferSaving ? "جارٍ التنفيذ..." : "تنفيذ التحويل"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={adjustmentOpen} onClose={closeAdjustment} maxWidth="sm" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">تسوية مخزون</SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {adjustmentErrors._global && (
              <Grid item xs={12}>
                <Alert severity="error">{adjustmentErrors._global}</Alert>
              </Grid>
            )}
            <Grid item xs={12} md={7}>
              <FormControl fullWidth size="small" error={!!adjustmentErrors.productId}>
                <InputLabel>الصنف</InputLabel>
                <Select value={adjustment.productId} label="الصنف" onChange={setAdjustmentField("productId")}>
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - {product.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {adjustmentErrors.productId && (
                <SoftTypography variant="caption" color="error">{adjustmentErrors.productId}</SoftTypography>
              )}
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth size="small" error={!!adjustmentErrors.warehouseId}>
                <InputLabel>المستودع</InputLabel>
                <Select value={adjustment.warehouseId} label="المستودع" onChange={setAdjustmentField("warehouseId")}>
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {adjustmentErrors.warehouseId && (
                <SoftTypography variant="caption" color="error">{adjustmentErrors.warehouseId}</SoftTypography>
              )}
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth size="small">
                <InputLabel>نوع الحركة</InputLabel>
                <Select value={adjustment.type} label="نوع الحركة" onChange={setAdjustmentField("type")}>
                  <MenuItem value="IN">إدخال / زيادة</MenuItem>
                  <MenuItem value="OUT">إخراج / نقص</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="الكمية"
                value={adjustment.qty}
                onChange={setAdjustmentField("qty")}
                error={!!adjustmentErrors.qty}
                helperText={adjustmentErrors.qty}
                inputProps={{ min: 0, step: "0.001" }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="ملاحظات"
                value={adjustment.notes}
                onChange={setAdjustmentField("notes")}
                multiline
                minRows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={closeAdjustment}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="success" size="small" disabled={adjustmentSaving} onClick={saveAdjustment}>
            {adjustmentSaving ? "جارٍ الحفظ..." : "حفظ التسوية"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Dialog open={warehouseDialog} onClose={closeWarehouseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="bold">
            {editingWarehouseId ? "تعديل مستودع" : "إضافة مستودع جديد"}
          </SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {warehouseErrors._global && (
              <Grid item xs={12}>
                <Alert severity="error">{warehouseErrors._global}</Alert>
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="كود المستودع"
                value={warehouseForm.code}
                onChange={setWarehouseField("code")}
                placeholder="MAIN"
                error={!!warehouseErrors.code}
                helperText={warehouseErrors.code}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="اسم المستودع"
                value={warehouseForm.name}
                onChange={setWarehouseField("name")}
                placeholder="مثال: مخزن الدهانات"
                error={!!warehouseErrors.name}
                helperText={warehouseErrors.name}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>النوع</InputLabel>
                <Select value={warehouseForm.type} label="النوع" onChange={setWarehouseField("type")}>
                  {warehouseTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="المدينة"
                value={warehouseForm.city}
                onChange={setWarehouseField("city")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="المسؤول"
                value={warehouseForm.manager}
                onChange={setWarehouseField("manager")}
                disabled
                helperText="تعيين المسؤول يتم لاحقاً من إدارة المستخدمين"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="الطاقة الاستيعابية"
                value={warehouseForm.capacity}
                onChange={setWarehouseField("capacity")}
                error={!!(warehouseErrors.capacity || warehouseErrors.capacityQty)}
                helperText={warehouseErrors.capacity || warehouseErrors.capacityQty}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={warehouseForm.isDefault}
                    onChange={setWarehouseField("isDefault")}
                    color="info"
                  />
                }
                label="اجعله المستودع الافتراضي"
              />
              <SoftTypography variant="caption" color="secondary" display="block">
                عند تفعيل هذا الخيار يلغى الافتراضي تلقائياً من أي مستودع آخر.
              </SoftTypography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={closeWarehouseDialog}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="info" size="small" disabled={warehouseSaving} onClick={saveWarehouse}>
            {warehouseSaving ? "جارٍ الحفظ..." : editingWarehouseId ? "حفظ التعديل" : "إضافة المستودع"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Inventory;
