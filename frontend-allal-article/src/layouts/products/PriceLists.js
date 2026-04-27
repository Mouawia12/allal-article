/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import GroupIcon from "@mui/icons-material/Group";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import SearchIcon from "@mui/icons-material/Search";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
const formatDZD = (v) => Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " دج";
const initialPriceLists = [];
const priceSourceLabels = {};
const resolveProductPrice = (product) => ({ finalPrice: product?.price || 0, listName: "—" });
import { suppliersApi, customersApi } from "services";


const priceProducts = [
  { id: 1, code: "BRG-010-50", name: "برغي M10 × 50mm", category: "مسامير وبراغي", unit: "قطعة", price: 12 },
  { id: 2, code: "BRG-008-30", name: "برغي M8 × 30mm", category: "مسامير وبراغي", unit: "قطعة", price: 8 },
  { id: 3, code: "SAM-010", name: "صامولة M10", category: "مسامير وبراغي", unit: "قطعة", price: 5 },
  { id: 4, code: "MFT-017", name: "مفتاح ربط 17mm", category: "أدوات", unit: "قطعة", price: 450 },
  { id: 5, code: "MFT-022", name: "مفتاح ربط 22mm", category: "أدوات", unit: "قطعة", price: 620 },
  { id: 7, code: "KBL-25", name: "كابل كهربائي 2.5mm", category: "كهرباء", unit: "متر", price: 95 },
  { id: 8, code: "KBL-15", name: "كابل كهربائي 1.5mm", category: "كهرباء", unit: "متر", price: 65 },
  { id: 9, code: "SHR-EL", name: "شريط عازل كهربائي", category: "كهرباء", unit: "لفة", price: 35 },
  { id: 10, code: "ANB-PVC-2", name: "أنبوب PVC 2 بوصة", category: "سباكة", unit: "متر", price: 280 },
  { id: 11, code: "ANB-PVC-1", name: "أنبوب PVC 1 بوصة", category: "سباكة", unit: "متر", price: 180 },
  { id: "RAW-STL-001", code: "RAW-STL-001", name: "حديد تسليح 12mm", category: "مشتريات", unit: "قنطار", price: 85000 },
  { id: "RAW-STL-002", code: "RAW-STL-002", name: "صفائح حديد 2mm", category: "مشتريات", unit: "لوح", price: 12000 },
  { id: "ELC-CBL-025", code: "ELC-CBL-025", name: "كابل كهربائي 2.5mm", category: "مشتريات", unit: "لفة", price: 18500 },
  { id: "TLS-DRL-001", code: "TLS-DRL-001", name: "مثقاب كهربائي", category: "مشتريات", unit: "قطعة", price: 14500 },
];

const typeLabels = { sales: "بيع", purchase: "شراء", both: "بيع وشراء" };

const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

function clonePriceLists() {
  return initialPriceLists.map((list) => ({
    ...list,
    items: [...(list.items || [])],
    assignedIds: [...(list.assignedIds || [])],
  }));
}

function getListItem(list, product) {
  return (list.items || []).find((item) => String(item.productKey) === String(product.code || product.id));
}

// ─── Assign Entities Dialog ───────────────────────────────────────────────────
function AssignEntitiesDialog({ open, onClose, priceList, onSave, suppliers = [], customers = [] }) {
  const isPurchase = priceList?.type === "purchase";
  const entities = isPurchase ? suppliers : customers;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(() => priceList?.assignedIds || []);

  // Sync when priceList changes
  const [lastListId, setLastListId] = useState(null);
  if (open && priceList && priceList.id !== lastListId) {
    setSelected(priceList.assignedIds || []);
    setLastListId(priceList.id);
  }

  const filtered = entities.filter((e) => {
    const q = search.trim();
    if (!q) return true;
    return (
      e.name.includes(q) ||
      (e.wilaya || "").includes(q) ||
      (e.category || "").includes(q)
    );
  });

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    const allFilteredIds = filtered.map((e) => e.id);
    const allSelected = allFilteredIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.includes(e.id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">
              {isPurchase ? "تحديد الموردين المرتبطين" : "تحديد الزبائن المرتبطين"}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              قائمة: {priceList?.name}
            </SoftTypography>
          </SoftBox>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        <SoftBox
          p={1.5} mb={2}
          sx={{ background: "#f0faff", borderRadius: 1.5, border: "1px solid #17c1e822" }}
        >
          <SoftTypography variant="caption" color="secondary">
            {isPurchase ? "الموردون" : "الزبائن"} المحددون سيخضعون تلقائياً لأسعار هذه القائمة عند اختيارهم في الطلبيات.
            من لم يُحدَّد يبقى على الأسعار الأساسية.
          </SoftTypography>
        </SoftBox>

        <TextField
          fullWidth size="small"
          placeholder={isPurchase ? "بحث في الموردين..." : "بحث في الزبائن..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1.5 }}
        />

        {/* Select all row */}
        <SoftBox
          display="flex" alignItems="center" gap={1} px={1} py={0.8} mb={1}
          sx={{ borderBottom: "1px solid #e9ecef", cursor: "pointer" }}
          onClick={toggleAll}
        >
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={!allFilteredSelected && filtered.some((e) => selected.includes(e.id))}
            size="small"
            sx={{ p: 0, color: "#17c1e8", "&.Mui-checked": { color: "#17c1e8" }, "&.MuiCheckbox-indeterminate": { color: "#17c1e8" } }}
          />
          <SoftTypography variant="caption" fontWeight="bold" color="secondary">
            {allFilteredSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
            {search && ` (${filtered.length} نتيجة)`}
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" flexDirection="column" gap={0.8} sx={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.map((entity) => {
            const isSelected = selected.includes(entity.id);
            const colorIdx = (typeof entity.id === "number" ? entity.id : entity.id.toString().charCodeAt(0)) % avatarColors.length;
            return (
              <SoftBox
                key={entity.id}
                onClick={() => toggle(entity.id)}
                display="flex" alignItems="center" gap={1.5}
                px={1.5} py={1}
                sx={{
                  border: isSelected ? "2px solid #17c1e8" : "1px solid #e9ecef",
                  borderRadius: 1.5,
                  cursor: "pointer",
                  background: isSelected ? "#f0faff" : "#fff",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: "#17c1e8", background: "#f0faff" },
                }}
              >
                <Checkbox
                  checked={isSelected}
                  size="small"
                  sx={{ p: 0, color: "#17c1e8", "&.Mui-checked": { color: "#17c1e8" } }}
                />
                <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 32, height: 32, fontSize: 12, fontWeight: "bold", flexShrink: 0 }}>
                  {getInitials(entity.name)}
                </Avatar>
                <SoftBox minWidth={0}>
                  <SoftTypography variant="caption" fontWeight="bold" noWrap display="block">
                    {entity.name}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary" noWrap display="block">
                    {entity.wilaya || entity.category || "—"}
                  </SoftTypography>
                </SoftBox>
                {isSelected && (
                  <Chip
                    size="small"
                    label="مربوط"
                    sx={{ ml: "auto", height: 20, fontSize: 10, background: "#17c1e822", color: "#17c1e8", flexShrink: 0 }}
                  />
                )}
              </SoftBox>
            );
          })}
          {filtered.length === 0 && (
            <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>
              لا توجد نتائج
            </SoftTypography>
          )}
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftTypography variant="caption" color="secondary" flex={1}>
          {selected.length} {isPurchase ? "مورد" : "زبون"} محدد
        </SoftTypography>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton
          variant="gradient" color="info" size="small"
          onClick={() => { onSave(selected); onClose(); }}
        >
          حفظ التحديد
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function PriceLists() {
  const [lists, setLists] = useState(clonePriceLists);
  const [selectedId, setSelectedId] = useState("AHMED");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [listForm, setListForm] = useState({ name: "", type: "sales", code: "" });
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    suppliersApi.list().then((r) => setSuppliers(r.data?.content ?? r.data ?? [])).catch(console.error);
    customersApi.list().then((r) => setCustomers(r.data?.content ?? r.data ?? [])).catch(console.error);
  }, []);

  const selectedList = lists.find((list) => list.id === selectedId) || lists[0];
  const customCount = selectedList.items.filter((item) => Number(item.unitPrice || 0) > 0).length;
  const fallbackCount = priceProducts.length - customCount;
  const assignedCount = (selectedList.assignedIds || []).length;
  const isPurchase = selectedList.type === "purchase";

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return priceProducts.filter((product) => {
      if (!q) return true;
      return (
        product.name.includes(search) ||
        product.code.toLowerCase().includes(q) ||
        product.category.includes(search)
      );
    });
  }, [search]);

  const setProductPrice = (product, value) => {
    const numeric = Math.max(0, Number(value || 0));
    setLists((current) =>
      current.map((list) => {
        if (list.id !== selectedList.id) return list;
        const productKey = product.code || product.id;
        const exists = list.items.some((item) => String(item.productKey) === String(productKey));
        const nextItems = exists
          ? list.items.map((item) =>
              String(item.productKey) === String(productKey) ? { ...item, unitPrice: numeric } : item
            )
          : [...list.items, { productKey, unitPrice: numeric }];
        return { ...list, items: nextItems, updatedAt: "2026-04-22" };
      })
    );
  };

  const saveAssignedIds = (ids) => {
    setLists((current) =>
      current.map((list) =>
        list.id === selectedId ? { ...list, assignedIds: ids } : list
      )
    );
  };

  const openNewList = () => {
    setListForm({ name: "", type: "sales", code: "" });
    setDialogOpen(true);
  };

  const saveNewList = () => {
    const name = listForm.name.trim();
    if (!name) return;
    const id = `CUSTOM-${Date.now()}`;
    const code = listForm.code.trim() || `PL-${lists.length + 1}`;
    const nextList = {
      id,
      code,
      name,
      type: listForm.type,
      description: "قائمة أسعار جديدة تجريبية، تبدأ بدون تسعير وتستخدم السعر الرئيسي كمرجع.",
      isDefault: false,
      isActive: true,
      updatedAt: "2026-04-22",
      items: [],
      assignedIds: [],
    };
    setLists((current) => [nextList, ...current]);
    setSelectedId(id);
    setDialogOpen(false);
  };

  // Resolve assigned entity names for display
  const assignedEntities = useMemo(() => {
    const ids = selectedList.assignedIds || [];
    if (ids.length === 0) return [];
    const pool = isPurchase ? suppliers : customers;
    return ids.map((id) => pool.find((e) => e.id === id)).filter(Boolean);
  }, [selectedList, isPurchase, suppliers, customers]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <IconButton size="small" onClick={() => window.history.back()}>
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1} minWidth={220}>
            <SoftTypography variant="h4" fontWeight="bold">قوائم الأسعار</SoftTypography>
            <SoftTypography variant="body2" color="text">
              إدارة أسعار البيع والشراء مع fallback تلقائي للسعر الرئيسي عند غياب التسعير
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={openNewList}>
            قائمة أسعار جديدة
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <SoftTypography variant="h3" color="info" fontWeight="bold">{lists.length}</SoftTypography>
              <SoftTypography variant="caption" color="text">قوائم الأسعار</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <SoftTypography variant="h3" color="success" fontWeight="bold">{customCount}</SoftTypography>
              <SoftTypography variant="caption" color="text">أسعار محددة</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <SoftTypography variant="h3" color="warning" fontWeight="bold">{fallbackCount}</SoftTypography>
              <SoftTypography variant="caption" color="text">تأخذ السعر الرئيسي</SoftTypography>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <SoftTypography variant="h3" color={assignedCount > 0 ? "info" : "secondary"} fontWeight="bold">
                {assignedCount}
              </SoftTypography>
              <SoftTypography variant="caption" color="text">
                {isPurchase ? "مورد" : "زبون"} مربوط بالقائمة
              </SoftTypography>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* ── Left: List selector ── */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <PriceChangeIcon sx={{ color: "#17c1e8" }} />
                <SoftTypography variant="h6" fontWeight="bold">القوائم</SoftTypography>
              </SoftBox>
              <SoftBox display="flex" flexDirection="column" gap={1.5}>
                {lists.map((list) => {
                  const count = (list.assignedIds || []).length;
                  return (
                    <SoftBox
                      key={list.id}
                      onClick={() => setSelectedId(list.id)}
                      p={1.5}
                      sx={{
                        border: selectedId === list.id ? "2px solid #17c1e8" : "1px solid #e9ecef",
                        borderRadius: 2,
                        cursor: "pointer",
                        background: selectedId === list.id ? "#f0faff" : "#fff",
                      }}
                    >
                      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <SoftBox minWidth={0}>
                          <SoftTypography variant="button" fontWeight="bold">{list.name}</SoftTypography>
                          <SoftTypography variant="caption" color="secondary" display="block">
                            {list.code} · {typeLabels[list.type]}
                          </SoftTypography>
                        </SoftBox>
                        <SoftBox display="flex" flexDirection="column" alignItems="flex-end" gap={0.5} flexShrink={0}>
                          <SoftBadge
                            variant="gradient"
                            color={list.isDefault ? "success" : "info"}
                            size="xs"
                            badgeContent={list.isDefault ? "افتراضية" : "نشطة"}
                            container
                          />
                          {count > 0 && (
                            <Chip
                              size="small"
                              icon={<GroupIcon sx={{ fontSize: "12px !important" }} />}
                              label={count}
                              sx={{ height: 20, fontSize: 10, background: "#17c1e811", color: "#17c1e8" }}
                            />
                          )}
                        </SoftBox>
                      </SoftBox>
                      <SoftTypography variant="caption" color="text" display="block" mt={1}>
                        {list.description}
                      </SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
                        آخر تعديل: {list.updatedAt}
                      </SoftTypography>
                    </SoftBox>
                  );
                })}
              </SoftBox>
            </Card>
          </Grid>

          {/* ── Right: Price table + assignment ── */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5 }}>
              {/* Header */}
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
                <SoftBox>
                  <SoftTypography variant="h6" fontWeight="bold">{selectedList.name}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    اترك السعر فارغاً أو 0 ليستخدم النظام السعر الرئيسي للصنف
                  </SoftTypography>
                </SoftBox>
                <SoftBox display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Tooltip title={isPurchase ? "تحديد الموردين الذين تنطبق عليهم هذه القائمة" : "تحديد الزبائن الذين تنطبق عليهم هذه القائمة"}>
                    <SoftButton
                      variant={assignedCount > 0 ? "gradient" : "outlined"}
                      color="info"
                      size="small"
                      startIcon={<GroupIcon />}
                      onClick={() => setAssignDialog(true)}
                    >
                      {isPurchase ? "الموردون" : "الزبائن"}
                      {assignedCount > 0 && (
                        <Chip
                          size="small"
                          label={assignedCount}
                          sx={{ mr: 0.5, height: 18, fontSize: 10, background: "rgba(255,255,255,0.3)", color: "inherit" }}
                        />
                      )}
                    </SoftButton>
                  </Tooltip>
                  <TextField
                    size="small"
                    value={search}
                    placeholder="بحث بالصنف أو الكود..."
                    onChange={(event) => setSearch(event.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                    sx={{ width: { xs: "100%", sm: 240 } }}
                  />
                </SoftBox>
              </SoftBox>

              {/* Assigned entities chips */}
              {assignedEntities.length > 0 && (
                <SoftBox mb={2} display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold">
                    {isPurchase ? "موردون مرتبطون:" : "زبائن مرتبطون:"}
                  </SoftTypography>
                  {assignedEntities.slice(0, 6).map((e) => (
                    <Chip
                      key={e.id}
                      size="small"
                      label={e.name}
                      sx={{ height: 22, fontSize: 11, background: "#17c1e811", color: "#0d7fa8" }}
                    />
                  ))}
                  {assignedEntities.length > 6 && (
                    <Chip
                      size="small"
                      label={`+${assignedEntities.length - 6} أخرى`}
                      sx={{ height: 22, fontSize: 11, background: "#e9ecef", color: "#8392ab" }}
                    />
                  )}
                  <SoftButton
                    variant="text" color="info" size="small"
                    sx={{ fontSize: 11, py: 0, minHeight: "unset", textDecoration: "underline" }}
                    onClick={() => setAssignDialog(true)}
                  >
                    تعديل
                  </SoftButton>
                </SoftBox>
              )}

              {/* Products table */}
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["الصنف", "السعر الرئيسي", "سعر القائمة", "المطبق فعلياً", "المصدر", "إجراء"].map((header) => (
                        <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" color="secondary" fontWeight="bold">{header}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const item = getListItem(selectedList, product);
                      const resolved = resolveProductPrice(product, selectedList.id, selectedList.type === "purchase" ? "purchase" : "sales");
                      const listPrice = Number(item?.unitPrice || 0);

                      return (
                        <tr key={product.code} style={{ borderBottom: "1px solid #f0f2f5" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{product.name}</SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">
                              {product.code} · {product.category}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{formatDZD(product.price)} دج</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", width: 150 }}>
                            <TextField
                              size="small"
                              type="number"
                              value={item?.unitPrice ?? ""}
                              placeholder="0 = رئيسي"
                              onChange={(event) => setProductPrice(product, event.target.value)}
                              inputProps={{ min: 0 }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color={resolved.source === "price_list" ? "info" : "text"}>
                              {formatDZD(resolved.unitPrice)} دج
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <Chip
                              size="small"
                              label={priceSourceLabels[resolved.source]}
                              color={resolved.source === "price_list" ? "info" : "default"}
                              sx={{ height: 22, fontSize: 11 }}
                            />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <Tooltip title={listPrice > 0 ? "السعر مفعل داخل القائمة" : "يستخدم السعر الرئيسي"}>
                              <IconButton size="small" sx={{ border: "1px solid #e9ecef", borderRadius: 1 }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* New price list dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>قائمة أسعار جديدة</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth size="small" label="اسم القائمة"
                value={listForm.name}
                onChange={(event) => setListForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="مثال: أسعار أحمد"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth size="small" label="الكود"
                value={listForm.code}
                onChange={(event) => setListForm((form) => ({ ...form, code: event.target.value }))}
                placeholder="اختياري"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth select size="small" label="نوع القائمة"
                value={listForm.type}
                onChange={(event) => setListForm((form) => ({ ...form, type: event.target.value }))}
              >
                <MenuItem key="sales" value="sales">بيع</MenuItem>
                <MenuItem key="purchase" value="purchase">شراء</MenuItem>
                <MenuItem key="both" value="both">بيع وشراء</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialogOpen(false)}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="info" size="small" disabled={!listForm.name.trim()} onClick={saveNewList}>
            إنشاء القائمة
          </SoftButton>
        </DialogActions>
      </Dialog>

      {/* Assign entities dialog */}
      <AssignEntitiesDialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        priceList={selectedList}
        onSave={saveAssignedIds}
        suppliers={suppliers}
        customers={customers}
      />

      <Footer />
    </DashboardLayout>
  );
}

export default PriceLists;
