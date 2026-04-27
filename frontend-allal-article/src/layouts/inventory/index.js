/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";

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
import { inventoryApi } from "services";

const products = [
  { id: 1, code: "BRG-010-50", name: "برغي M10 × 50mm", category: "مسامير وبراغي", unit: "قطعة", minStock: 100, color: "#FF6B6B" },
  { id: 2, code: "BRG-008-30", name: "برغي M8 × 30mm", category: "مسامير وبراغي", unit: "قطعة", minStock: 200, color: "#FF6B6B" },
  { id: 3, code: "SAM-010", name: "صامولة M10", category: "مسامير وبراغي", unit: "قطعة", minStock: 100, color: "#FF8E53" },
  { id: 4, code: "MFT-017", name: "مفتاح ربط 17mm", category: "أدوات", unit: "قطعة", minStock: 20, color: "#4ECDC4" },
  { id: 5, code: "MFT-022", name: "مفتاح ربط 22mm", category: "أدوات", unit: "قطعة", minStock: 15, color: "#4ECDC4" },
  { id: 6, code: "KMA-UNI", name: "كماشة عالمية", category: "أدوات", unit: "قطعة", minStock: 10, color: "#4ECDC4" },
  { id: 7, code: "KBL-25", name: "كابل كهربائي 2.5mm", category: "كهرباء", unit: "متر", minStock: 100, color: "#FFE66D" },
  { id: 8, code: "KBL-15", name: "كابل كهربائي 1.5mm", category: "كهرباء", unit: "متر", minStock: 100, color: "#FFE66D" },
  { id: 9, code: "SHR-EL", name: "شريط عازل كهربائي", category: "كهرباء", unit: "لفة", minStock: 50, color: "#F7DC6F" },
  { id: 10, code: "ANB-PVC-2", name: "أنبوب PVC 2 بوصة", category: "سباكة", unit: "متر", minStock: 30, color: "#A8E6CF" },
  { id: 11, code: "ANB-PVC-1", name: "أنبوب PVC 1 بوصة", category: "سباكة", unit: "متر", minStock: 20, color: "#A8E6CF" },
  { id: 12, code: "DHN-WHT-4", name: "دهان أبيض 4L", category: "دهانات", unit: "علبة", minStock: 20, color: "#DDA0DD" },
];

const initialStockLines = [
  { productId: 1, warehouseId: "WH-MAIN", onHand: 520, reserved: 120, pending: 70 },
  { productId: 1, warehouseId: "WH-TOOLS", onHand: 210, reserved: 60, pending: 20 },
  { productId: 1, warehouseId: "WH-PLUMB", onHand: 120, reserved: 20, pending: 10 },
  { productId: 2, warehouseId: "WH-MAIN", onHand: 780, reserved: 160, pending: 100 },
  { productId: 2, warehouseId: "WH-TOOLS", onHand: 420, reserved: 140, pending: 100 },
  { productId: 3, warehouseId: "WH-MAIN", onHand: 360, reserved: 90, pending: 40 },
  { productId: 3, warehouseId: "WH-TOOLS", onHand: 240, reserved: 60, pending: 40 },
  { productId: 4, warehouseId: "WH-TOOLS", onHand: 45, reserved: 10, pending: 5 },
  { productId: 5, warehouseId: "WH-TOOLS", onHand: 30, reserved: 5, pending: 10 },
  { productId: 6, warehouseId: "WH-TOOLS", onHand: 0, reserved: 0, pending: 5 },
  { productId: 7, warehouseId: "WH-MAIN", onHand: 330, reserved: 60, pending: 120 },
  { productId: 7, warehouseId: "WH-PLUMB", onHand: 170, reserved: 40, pending: 80 },
  { productId: 8, warehouseId: "WH-MAIN", onHand: 600, reserved: 100, pending: 80 },
  { productId: 8, warehouseId: "WH-PLUMB", onHand: 200, reserved: 50, pending: 20 },
  { productId: 9, warehouseId: "WH-MAIN", onHand: 140, reserved: 20, pending: 10 },
  { productId: 9, warehouseId: "WH-RETURN", onHand: 60, reserved: 0, pending: 10 },
  { productId: 10, warehouseId: "WH-PLUMB", onHand: 100, reserved: 40, pending: 30 },
  { productId: 11, warehouseId: "WH-PLUMB", onHand: 15, reserved: 10, pending: 5 },
  { productId: 12, warehouseId: "WH-MAIN", onHand: 80, reserved: 20, pending: 10 },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-DZ", {
    maximumFractionDigits: 0,
  });
}

function getStatus(item) {
  const available = item.onHand - item.reserved;
  if (item.onHand === 0) return { label: "نفذ", color: "error" };
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
  return warehouses.find((warehouse) => warehouse.id === id)?.name || "—";
}

function hydrateStockLines(stockLines, warehouses) {
  return stockLines.map((line) => {
    const product = products.find((item) => item.id === line.productId);
    const warehouse = warehouses.find((item) => item.id === line.warehouseId);
    const available = Number(line.onHand || 0) - Number(line.reserved || 0);
    const projected = available - Number(line.pending || 0);

    return {
      ...line,
      ...product,
      warehouseName: warehouse?.name || "—",
      warehouseType: warehouse?.type || "—",
      available,
      projected,
    };
  });
}

const emptyTransfer = {
  fromWarehouseId: "WH-MAIN",
  toWarehouseId: "WH-TOOLS",
  productId: 1,
  qty: 0,
  reason: "",
};

function Inventory() {
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState(0);
  const [viewTab, setViewTab] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [stockLines, setStockLines] = useState([]);
  const [transferMode, setTransferMode] = useState("product");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transfer, setTransfer] = useState(emptyTransfer);
  const [warehouseDialog, setWarehouseDialog] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: "",
    type: "تشغيلي",
    city: "",
    manager: "",
    capacity: 1000,
    isDefault: false,
  });
  const [transferLog, setTransferLog] = useState([
    {
      id: "TR-2026-001",
      type: "product",
      fromWarehouseId: "WH-MAIN",
      toWarehouseId: "WH-PLUMB",
      productName: "كابل كهربائي 2.5mm",
      qty: 40,
      unit: "متر",
      at: "2026-04-21 10:30",
      user: "أمين المخزن",
    },
  ]);

  useEffect(() => {
    inventoryApi.listWarehouses()
      .then((r) => setWarehouses(r.data?.content ?? r.data ?? []))
      .catch(console.error);
    inventoryApi.listStock()
      .then((r) => setStockLines((r.data?.content ?? r.data ?? []).map((s) => ({
        productCode: s.productCode ?? s.product?.code ?? "",
        productName: s.productName ?? s.product?.name ?? "",
        category: s.category ?? s.product?.category ?? "",
        unit: s.unit ?? s.product?.unit ?? "قطعة",
        minStock: s.minStock ?? 0,
        color: "#17c1e8",
        ...s,
      }))))
      .catch(console.error);
  }, []);

  const inventory = useMemo(() => hydrateStockLines(stockLines, warehouses), [stockLines, warehouses]);

  const filteredByWarehouse =
    selectedWarehouse === "all"
      ? inventory
      : inventory.filter((item) => item.warehouseId === selectedWarehouse);

  const filterStatus = ["all", "out", "low", "ok"][statusTab];
  const filtered = filteredByWarehouse.filter((item) => {
    const status = getStatus(item);
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "out" && item.onHand === 0) ||
      (filterStatus === "low" && status.color === "warning") ||
      (filterStatus === "ok" && status.color === "success");

    const matchSearch =
      item.name.includes(search) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.category.includes(search) ||
      item.warehouseName.includes(search);

    return matchStatus && matchSearch;
  });

  const outCount = filteredByWarehouse.filter((item) => item.onHand === 0).length;
  const lowCount = filteredByWarehouse.filter((item) => getStatus(item).color === "warning").length;
  const okCount = filteredByWarehouse.filter((item) => getStatus(item).color === "success").length;
  const totalOnHand = filteredByWarehouse.reduce((sum, item) => sum + Number(item.onHand || 0), 0);
  const totalReserved = filteredByWarehouse.reduce((sum, item) => sum + Number(item.reserved || 0), 0);
  const totalPending = filteredByWarehouse.reduce((sum, item) => sum + Number(item.pending || 0), 0);

  const selectedProduct = products.find((product) => product.id === Number(transfer.productId)) || products[0];
  const fromLine = stockLines.find(
    (line) =>
      line.productId === Number(transfer.productId) && line.warehouseId === transfer.fromWarehouseId
  );
  const maxTransferQty = Math.max(0, Number(fromLine?.onHand || 0) - Number(fromLine?.reserved || 0));

  const openTransfer = (mode, defaults = {}) => {
    setTransferMode(mode);
    setTransfer({
      ...emptyTransfer,
      ...defaults,
      toWarehouseId:
        defaults.toWarehouseId ||
        warehouses.find((warehouse) => warehouse.id !== (defaults.fromWarehouseId || emptyTransfer.fromWarehouseId))?.id ||
        emptyTransfer.toWarehouseId,
    });
    setTransferOpen(true);
  };

  const setTransferField = (field) => (event) => {
    const value = event.target.value;
    setTransfer((draft) => {
      const next = { ...draft, [field]: value };
      if (field === "fromWarehouseId" && value === next.toWarehouseId) {
        next.toWarehouseId = warehouses.find((warehouse) => warehouse.id !== value)?.id || "";
      }
      if (field === "toWarehouseId" && value === next.fromWarehouseId) {
        next.fromWarehouseId = warehouses.find((warehouse) => warehouse.id !== value)?.id || "";
      }
      return next;
    });
  };

  const closeTransfer = () => {
    setTransferOpen(false);
    setTransfer(emptyTransfer);
  };

  const moveLineQty = (lines, productId, fromWarehouseId, toWarehouseId, qty) => {
    const nextLines = lines.map((line) => ({ ...line }));
    const source = nextLines.find(
      (line) => line.productId === productId && line.warehouseId === fromWarehouseId
    );
    if (!source || qty <= 0) return nextLines;

    source.onHand = Math.max(0, Number(source.onHand || 0) - qty);

    let destination = nextLines.find(
      (line) => line.productId === productId && line.warehouseId === toWarehouseId
    );
    if (!destination) {
      destination = {
        productId,
        warehouseId: toWarehouseId,
        onHand: 0,
        reserved: 0,
        pending: 0,
      };
      nextLines.push(destination);
    }
    destination.onHand = Number(destination.onHand || 0) + qty;

    return nextLines;
  };

  const handleTransfer = () => {
    if (transfer.fromWarehouseId === transfer.toWarehouseId) return;

    const now = new Date().toLocaleString("ar-DZ");

    if (transferMode === "product") {
      const qty = Math.min(Math.max(Number(transfer.qty || 0), 0), maxTransferQty);
      if (!qty) return;

      setStockLines((lines) =>
        moveLineQty(
          lines,
          Number(transfer.productId),
          transfer.fromWarehouseId,
          transfer.toWarehouseId,
          qty
        )
      );
      setTransferLog((items) => [
        {
          id: `TR-${Date.now()}`,
          type: "product",
          fromWarehouseId: transfer.fromWarehouseId,
          toWarehouseId: transfer.toWarehouseId,
          productName: selectedProduct.name,
          qty,
          unit: selectedProduct.unit,
          at: now,
          user: "المستخدم الحالي",
          reason: transfer.reason,
        },
        ...items,
      ]);
      closeTransfer();
      return;
    }

    const transferableLines = stockLines.filter(
      (line) =>
        line.warehouseId === transfer.fromWarehouseId &&
        Math.max(0, Number(line.onHand || 0) - Number(line.reserved || 0)) > 0
    );
    if (!transferableLines.length) return;

    let nextLines = stockLines;
    const movedItems = [];
    transferableLines.forEach((line) => {
      const qty = Math.max(0, Number(line.onHand || 0) - Number(line.reserved || 0));
      nextLines = moveLineQty(nextLines, line.productId, transfer.fromWarehouseId, transfer.toWarehouseId, qty);
      const product = products.find((item) => item.id === line.productId);
      movedItems.push(`${product?.name || line.productId}: ${formatNumber(qty)} ${product?.unit || ""}`);
    });

    setStockLines(nextLines);
    setTransferLog((items) => [
      {
        id: `TR-${Date.now()}`,
        type: "warehouse",
        fromWarehouseId: transfer.fromWarehouseId,
        toWarehouseId: transfer.toWarehouseId,
        productName: "تحويل مستودع كامل",
        qty: transferableLines.length,
        unit: "سطر",
        at: now,
        user: "المستخدم الحالي",
        reason: transfer.reason,
        details: movedItems.join(" | "),
      },
      ...items,
    ]);
    closeTransfer();
  };

  const openWarehouseDialog = (warehouse = null) => {
    setEditingWarehouseId(warehouse?.id || null);
    setWarehouseForm({
      name: warehouse?.name || "",
      type: warehouse?.type || "تشغيلي",
      city: warehouse?.city || "",
      manager: warehouse?.manager || "",
      capacity: warehouse?.capacity || 1000,
      isDefault: Boolean(warehouse?.isDefault),
    });
    setWarehouseDialog(true);
  };

  const closeWarehouseDialog = () => {
    setWarehouseDialog(false);
    setEditingWarehouseId(null);
  };

  const setWarehouseField = (field) => (event) => {
    const value = field === "isDefault" ? event.target.checked : event.target.value;
    setWarehouseForm((form) => ({ ...form, [field]: value }));
  };

  const saveWarehouse = () => {
    const name = warehouseForm.name.trim();
    if (!name) return;
    const payload = {
      name,
      type: warehouseForm.type,
      city: warehouseForm.city.trim() || "غير محدد",
      manager: warehouseForm.manager.trim() || "غير محدد",
      capacity: Math.max(1, Number(warehouseForm.capacity || 1)),
      isDefault: Boolean(warehouseForm.isDefault),
    };
    const apiCall = editingWarehouseId
      ? inventoryApi.updateWarehouse(editingWarehouseId, payload)
      : inventoryApi.createWarehouse(payload);
    apiCall
      .then((r) => {
        const saved = r.data;
        setWarehouses((current) => {
          const exists = current.some((w) => w.id === saved.id);
          const updated = exists
            ? current.map((w) => (w.id === saved.id ? saved : w))
            : [...current, saved];
          return saved.isDefault
            ? updated.map((w) => ({ ...w, isDefault: w.id === saved.id }))
            : updated;
        });
        closeWarehouseDialog();
      })
      .catch(console.error);
  };

  const warehouseRows = warehouses.map((warehouse) => {
    const lines = inventory.filter((line) => line.warehouseId === warehouse.id);
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
          </SoftBox>
        </SoftBox>

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
                "تحويلات المخزون",
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
                              item.onHand === 0
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
                              <Tooltip title="تعديل حد التنبيه">
                                <IconButton size="small" sx={{ border: "1px solid #e0e0e0", p: 0.4 }}>
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
                  <SoftTypography variant="h6" fontWeight="bold">سجل تحويلات المخزون</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    التحويل ينقص المستودع المصدر ويزيد المستودع الوجهة دون المساس بالكميات المحجوزة.
                  </SoftTypography>
                </SoftBox>
                <SoftBox display="flex" gap={1} flexWrap="wrap">
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
                      {["رقم", "النوع", "من", "إلى", "الصنف/النطاق", "الكمية", "المستخدم", "الوقت", "ملاحظات"].map((header) => (
                        <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transferLog.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="info" fontWeight="bold">{item.id}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge variant="gradient" color={item.type === "warehouse" ? "warning" : "info"} size="xs" badgeContent={item.type === "warehouse" ? "مستودع كامل" : "صنف"} container />
                        </td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{getWarehouseName(item.fromWarehouseId, warehouses)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{getWarehouseName(item.toWarehouseId, warehouses)}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{item.productName}</SoftTypography>
                          {item.details && <SoftTypography variant="caption" color="secondary" display="block">{item.details}</SoftTypography>}
                        </td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{formatNumber(item.qty)} {item.unit}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption">{item.user}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="secondary">{item.at}</SoftTypography></td>
                        <td style={{ padding: "10px 12px" }}><SoftTypography variant="caption" color="text">{item.reason || "—"}</SoftTypography></td>
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
                  {warehouses.filter((warehouse) => warehouse.id !== transfer.fromWarehouseId).map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {transferMode === "product" && (
              <>
                <Grid item xs={12} md={7}>
                  <FormControl fullWidth size="small">
                    <InputLabel>الصنف</InputLabel>
                    <Select value={transfer.productId} label="الصنف" onChange={setTransferField("productId")}>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>{product.name} - {product.code}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="الكمية"
                    value={transfer.qty}
                    onChange={setTransferField("qty")}
                    inputProps={{ min: 0, max: maxTransferQty }}
                    helperText={`المتاح للتحويل: ${formatNumber(maxTransferQty)} ${selectedProduct.unit}`}
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
              transfer.fromWarehouseId === transfer.toWarehouseId ||
              (transferMode === "product" && (!Number(transfer.qty || 0) || maxTransferQty <= 0))
            }
            onClick={handleTransfer}
          >
            تنفيذ التحويل
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
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="اسم المستودع"
                value={warehouseForm.name}
                onChange={setWarehouseField("name")}
                placeholder="مثال: مخزن الدهانات"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel>النوع</InputLabel>
                <Select value={warehouseForm.type} label="النوع" onChange={setWarehouseField("type")}>
                  <MenuItem value="مركزي">مركزي</MenuItem>
                  <MenuItem value="تشغيلي">تشغيلي</MenuItem>
                  <MenuItem value="حجر/مرتجع">حجر/مرتجع</MenuItem>
                  <MenuItem value="افتراضي">افتراضي</MenuItem>
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
          <SoftButton variant="gradient" color="info" size="small" disabled={!warehouseForm.name.trim()} onClick={saveWarehouse}>
            {editingWarehouseId ? "حفظ التعديل" : "إضافة المستودع"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Inventory;
