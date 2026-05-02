/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect, useCallback } from "react";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
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
import { priceListsApi, productsApi, suppliersApi, customersApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";

const formatDZD = (v) =>
  Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " دج";

const typeLabels = { sales: "بيع", purchase: "شراء", both: "بيع وشراء" };
const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];

function getInitials(name = "") {
  return (name || "").split(" ").slice(0, 2).map((w) => w[0] || "").join("");
}

function extractCollection(data) {
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data)) return data;
  return [];
}

function productBasePrice(product) {
  return Number(product?.currentPriceAmount ?? product?.price ?? 0);
}

function productUnit(product) {
  return product?.baseUnitSymbol || product?.baseUnitName || "وحدة";
}

function normalizeAssignedIds(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
}

function assignmentEntityType(priceList) {
  return priceList?.type === "purchase" ? "supplier" : "customer";
}

// ─── Assign Entities Dialog ───────────────────────────────────────────────────
function AssignEntitiesDialog({ open, onClose, priceList, onSave, saving = false, suppliers = [], customers = [] }) {
  const isPurchase = priceList?.type === "purchase";
  const entities = isPurchase ? suppliers : customers;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (open) setSelected(priceList?.assignedIds || []);
  }, [open, priceList]);

  const filtered = entities.filter((e) => {
    const q = search.trim();
    return !q || (e.name || "").includes(q) || (e.wilaya || e.city || "").includes(q);
  });

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((e) => selected.includes(e.id));

  const toggleAll = () => {
    const allIds = filtered.map((e) => e.id);
    if (allFilteredSelected) {
      setSelected((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">
              {isPurchase ? "تحديد الموردين المرتبطين" : "تحديد الزبائن المرتبطين"}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">قائمة: {priceList?.name}</SoftTypography>
          </SoftBox>
          <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2 }}>
        <TextField
          fullWidth size="small"
          placeholder={isPurchase ? "بحث في الموردين..." : "بحث في الزبائن..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1.5 }}
        />
        <SoftBox display="flex" alignItems="center" gap={1} px={1} py={0.8} mb={1}
          sx={{ borderBottom: "1px solid #e9ecef", cursor: "pointer" }} onClick={toggleAll}>
          <Checkbox checked={allFilteredSelected}
            indeterminate={!allFilteredSelected && filtered.some((e) => selected.includes(e.id))}
            size="small" sx={{ p: 0, color: "#17c1e8", "&.Mui-checked": { color: "#17c1e8" } }} />
          <SoftTypography variant="caption" fontWeight="bold" color="secondary">
            {allFilteredSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
          </SoftTypography>
        </SoftBox>
        <SoftBox display="flex" flexDirection="column" gap={0.8} sx={{ maxHeight: 360, overflowY: "auto" }}>
          {filtered.map((entity) => {
            const isSelected = selected.includes(entity.id);
            const colorIdx = (typeof entity.id === "number" ? entity.id : 0) % avatarColors.length;
            return (
              <SoftBox key={entity.id} onClick={() => toggle(entity.id)}
                display="flex" alignItems="center" gap={1.5} px={1.5} py={1}
                sx={{
                  border: isSelected ? "2px solid #17c1e8" : "1px solid #e9ecef",
                  borderRadius: 1.5, cursor: "pointer",
                  background: isSelected ? "#f0faff" : "#fff",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: "#17c1e8", background: "#f0faff" },
                }}>
                <Checkbox checked={isSelected} size="small"
                  sx={{ p: 0, color: "#17c1e8", "&.Mui-checked": { color: "#17c1e8" } }} />
                <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 32, height: 32, fontSize: 12, fontWeight: "bold" }}>
                  {getInitials(entity.name)}
                </Avatar>
                <SoftBox minWidth={0}>
                  <SoftTypography variant="caption" fontWeight="bold" noWrap display="block">{entity.name}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" noWrap display="block">
                    {entity.wilayaCode || entity.city || "—"}
                  </SoftTypography>
                </SoftBox>
                {isSelected && (
                  <Chip size="small" label="مربوط"
                    sx={{ ml: "auto", height: 20, fontSize: 10, background: "#17c1e822", color: "#17c1e8" }} />
                )}
              </SoftBox>
            );
          })}
          {filtered.length === 0 && (
            <SoftTypography variant="body2" color="secondary" textAlign="center" py={3}>لا توجد نتائج</SoftTypography>
          )}
        </SoftBox>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftTypography variant="caption" color="secondary" flex={1}>
          {selected.length} {isPurchase ? "مورد" : "زبون"} محدد
        </SoftTypography>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose} disabled={saving}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          disabled={saving}
          onClick={() => onSave(selected)}>
          {saving ? "جاري الحفظ..." : "حفظ التحديد"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function PriceLists() {
  const { t } = useI18n();
  const [lists, setLists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [pageError, setPageError] = useState("");
  const [itemsError, setItemsError] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [listForm, setListForm] = useState({ name: "", type: "sales", code: "" });
  const [listErrors, setListErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [addProduct, setAddProduct] = useState(null);
  const [addPrice, setAddPrice] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [removingProductId, setRemovingProductId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [assignedMap, setAssignedMap] = useState({});
  const [savingAssignments, setSavingAssignments] = useState(false);
  const [snack, setSnack] = useState("");

  // Load price lists
  const loadLists = useCallback(() => {
    setLoadingLists(true);
    setPageError("");
    priceListsApi.list()
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.content ?? []);
        setLists(data);
        setAssignedMap(Object.fromEntries(
          data.map((list) => [
            list.id,
            normalizeAssignedIds(list.assignedIds ?? list.assigned_ids),
          ])
        ));
        if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل قوائم الأسعار"));
        setLists([]);
      })
      .finally(() => setLoadingLists(false));
  }, [selectedId]);

  useEffect(() => { loadLists(); }, []);

  // Load items for selected list
  useEffect(() => {
    if (!selectedId) return;
    setLoadingItems(true);
    setItemsError("");
    setAddProduct(null);
    setAddPrice("");
    priceListsApi.getItems(selectedId)
      .then((r) => {
        const nextItems = extractCollection(r.data);
        setItems(nextItems);
        setLists((prev) => prev.map((list) =>
          list.id === selectedId ? { ...list, items_count: nextItems.length } : list
        ));
      })
      .catch((error) => {
        setItemsError(getApiErrorMessage(error, "تعذر تحميل أصناف قائمة الأسعار"));
        setItems([]);
      })
      .finally(() => setLoadingItems(false));
  }, [selectedId]);

  // Load products for adding items to a list
  useEffect(() => {
    setLoadingProducts(true);
    setProductsError("");
    productsApi.list({ size: 1000 })
      .then((r) => setProducts(extractCollection(r.data)))
      .catch((error) => {
        setProductsError(getApiErrorMessage(error, "تعذر تحميل الأصناف"));
        setProducts([]);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // Load suppliers + customers for assign dialog
  useEffect(() => {
    suppliersApi.list()
      .then((r) => setSuppliers(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch((error) => {
        setPageError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل الموردين");
          return current ? `${current}؛ ${message}` : message;
        });
      });
    customersApi.list()
      .then((r) => setCustomers(Array.isArray(r.data) ? r.data : (r.data?.content ?? [])))
      .catch((error) => {
        setPageError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل الزبائن");
          return current ? `${current}؛ ${message}` : message;
        });
      });
  }, []);

  const selectedList = lists.find((l) => l.id === selectedId) || null;
  const isPurchase = selectedList?.type === "purchase";
  const assignedIds = assignedMap[selectedId] || [];
  const assignedCount = assignedIds.length;

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      (item.product_name || "").toLowerCase().includes(q) ||
      (item.product_code || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const availableProducts = useMemo(() => {
    const existingIds = new Set(items.map((item) => String(item.product_id)));
    return products.filter((product) => !existingIds.has(String(product.id)));
  }, [items, products]);

  const addSelectedProduct = useCallback(() => {
    if (!selectedId) return;
    if (!addProduct) {
      setSnack("اختر صنفاً أولاً");
      return;
    }
    const price = addPrice === "" ? 0 : Number(addPrice);
    if (!Number.isFinite(price) || price < 0) {
      setSnack("السعر يجب أن يكون رقماً موجباً أو 0");
      return;
    }
    setAddingItem(true);
    priceListsApi.upsertItem(selectedId, addProduct.id, price)
      .then(() => priceListsApi.getItems(selectedId))
      .then((r) => {
        const nextItems = extractCollection(r.data);
        setItems(nextItems);
        setLists((prev) => prev.map((list) =>
          list.id === selectedId ? { ...list, items_count: nextItems.length } : list
        ));
        setAddProduct(null);
        setAddPrice("");
        setSnack("تمت إضافة الصنف إلى القائمة");
      })
      .catch((error) => setSnack(getApiErrorMessage(error, "فشل إضافة الصنف")))
      .finally(() => setAddingItem(false));
  }, [addPrice, addProduct, selectedId]);

  const setProductPrice = useCallback((item, value) => {
    const rawPrice = Number(value || 0);
    if (!Number.isFinite(rawPrice) || rawPrice < 0) {
      setSnack("السعر يجب أن يكون رقماً موجباً أو 0");
      return;
    }
    const price = Math.max(0, rawPrice);
    priceListsApi.upsertItem(selectedId, item.product_id, price)
      .then(() => {
        setItems((prev) =>
          prev.map((i) => i.product_id === item.product_id
            ? { ...i, unit_price_amount: price || null }
            : i)
        );
      })
      .catch((error) => setSnack(getApiErrorMessage(error, "فشل حفظ السعر")));
  }, [selectedId]);

  const removeProductFromList = useCallback((item) => {
    if (!selectedId || !item?.product_id) return;
    setRemovingProductId(item.product_id);
    priceListsApi.removeItem(selectedId, item.product_id)
      .then(() => {
        const nextItems = items.filter((row) => String(row.product_id) !== String(item.product_id));
        setItems(nextItems);
        setLists((prev) => prev.map((list) =>
          list.id === selectedId ? { ...list, items_count: nextItems.length } : list
        ));
        setSnack("تم حذف الصنف من القائمة");
      })
      .catch((error) => setSnack(getApiErrorMessage(error, "فشل حذف الصنف")))
      .finally(() => setRemovingProductId(null));
  }, [items, selectedId]);

  const setListField = (field, value) => {
    setListForm((current) => ({ ...current, [field]: value }));
    if (listErrors[field] || listErrors._global) {
      setListErrors((current) => ({ ...current, [field]: "", _global: "" }));
    }
  };

  const saveNewList = () => {
    const name = listForm.name.trim();
    const nextErrors = {};
    if (isBlank(name)) nextErrors.name = t("اسم قائمة الأسعار مطلوب");
    if (listForm.code && lists.some((list) => list.code === listForm.code.trim())) {
      nextErrors.code = t("الكود موجود مسبقاً");
    }
    if (hasErrors(nextErrors)) { setListErrors(nextErrors); return; }
    setSaving(true);
    setListErrors({});
    priceListsApi.create({
      name,
      code: listForm.code.trim() || `PL-${Date.now()}`,
      type: listForm.type,
    })
      .then((r) => {
        const newList = r.data;
        setLists((prev) => [newList, ...prev]);
        setAssignedMap((prev) => ({ ...prev, [newList.id]: [] }));
        setSelectedId(newList.id);
        setDialogOpen(false);
        setSnack("تم إنشاء قائمة الأسعار");
      })
      .catch((error) => {
        applyApiErrors(error, setListErrors, "فشل إنشاء القائمة");
        setSnack("فشل إنشاء القائمة");
      })
      .finally(() => setSaving(false));
  };

  const saveAssignedIds = (ids) => {
    if (!selectedList) return;
    const entityType = assignmentEntityType(selectedList);
    setSavingAssignments(true);
    priceListsApi.saveAssignments(selectedList.id, entityType, ids)
      .then((r) => {
        const assignedIds = normalizeAssignedIds(r.data?.assignedIds ?? ids);
        setAssignedMap((prev) => ({ ...prev, [selectedList.id]: assignedIds }));
        setLists((prev) => prev.map((list) =>
          list.id === selectedList.id
            ? { ...list, assignedIds, assigned_count: assignedIds.length }
            : list
        ));
        setAssignDialog(false);
        setSnack("تم حفظ ربط قائمة الأسعار");
      })
      .catch((error) => setSnack(getApiErrorMessage(error, "فشل حفظ ربط قائمة الأسعار")))
      .finally(() => setSavingAssignments(false));
  };

  const customCount = items.filter((i) => Number(i.unit_price_amount || 0) > 0).length;

  if (loadingLists) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <IconButton size="small" onClick={() => window.history.back()}><ArrowBackIcon /></IconButton>
          <SoftBox flex={1} minWidth={220}>
            <SoftTypography variant="h4" fontWeight="bold">قوائم الأسعار</SoftTypography>
            <SoftTypography variant="body2" color="text">
              إدارة أسعار البيع والشراء مع fallback تلقائي للسعر الرئيسي
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />}
            onClick={() => { setListForm({ name: "", type: "sales", code: "" }); setListErrors({}); setDialogOpen(true); }}>
            قائمة أسعار جديدة
          </SoftButton>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "قوائم الأسعار", value: lists.length, color: "info" },
            { label: "أسعار محددة", value: customCount, color: "success" },
            { label: "إجمالي الأصناف", value: items.length, color: "warning" },
            { label: isPurchase ? "مورد مربوط" : "زبون مربوط", value: assignedCount, color: "secondary" },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" color={s.color} fontWeight="bold">{s.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{s.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        {lists.length === 0 ? (
          <Card sx={{ p: 6, textAlign: "center" }}>
            <PriceChangeIcon sx={{ fontSize: 64, color: "#e9ecef", mb: 2 }} />
            <SoftTypography variant="h5" color="secondary">لا توجد قوائم أسعار بعد</SoftTypography>
            <SoftTypography variant="body2" color="secondary" mb={3}>
              أنشئ قائمة أسعار لتطبيق أسعار مخصصة على الزبائن أو الموردين
            </SoftTypography>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />}
              onClick={() => { setListForm({ name: "", type: "sales", code: "" }); setListErrors({}); setDialogOpen(true); }}>
              إنشاء قائمة أولى
            </SoftButton>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {/* Left: list selector */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ p: 2.5 }}>
                <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                  <PriceChangeIcon sx={{ color: "#17c1e8" }} />
                  <SoftTypography variant="h6" fontWeight="bold">القوائم</SoftTypography>
                </SoftBox>
                <SoftBox display="flex" flexDirection="column" gap={1.5}>
                  {lists.map((list) => {
                    const count = (assignedMap[list.id] || []).length;
                    return (
                      <SoftBox key={list.id} onClick={() => setSelectedId(list.id)} p={1.5}
                        sx={{
                          border: selectedId === list.id ? "2px solid #17c1e8" : "1px solid #e9ecef",
                          borderRadius: 2, cursor: "pointer",
                          background: selectedId === list.id ? "#f0faff" : "#fff",
                        }}>
                        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
                          <SoftBox minWidth={0}>
                            <SoftTypography variant="button" fontWeight="bold">{list.name}</SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">
                              {list.code} · {typeLabels[list.type] || list.type} · {Number(list.items_count || 0)} صنف
                            </SoftTypography>
                          </SoftBox>
                          <SoftBox display="flex" flexDirection="column" alignItems="flex-end" gap={0.5} flexShrink={0}>
                            <SoftBadge variant="gradient"
                              color={list.is_default ? "success" : "info"} size="xs"
                              badgeContent={list.is_default ? "افتراضية" : "نشطة"} container />
                            {count > 0 && (
                              <Chip size="small" icon={<GroupIcon sx={{ fontSize: "12px !important" }} />}
                                label={count}
                                sx={{ height: 20, fontSize: 10, background: "#17c1e811", color: "#17c1e8" }} />
                            )}
                          </SoftBox>
                        </SoftBox>
                        {list.description && (
                          <SoftTypography variant="caption" color="text" display="block" mt={1}>
                            {list.description}
                          </SoftTypography>
                        )}
                        <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
                          آخر تعديل: {list.updated_at || "—"}
                        </SoftTypography>
                      </SoftBox>
                    );
                  })}
                </SoftBox>
              </Card>
            </Grid>

            {/* Right: price table */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ p: 2.5 }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
                  <SoftBox>
                    <SoftTypography variant="h6" fontWeight="bold">{selectedList?.name || "—"}</SoftTypography>
                    <SoftTypography variant="caption" color="secondary">
                      اترك السعر فارغاً أو 0 ليستخدم النظام السعر الرئيسي للصنف
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    <Tooltip title={isPurchase ? "تحديد الموردين" : "تحديد الزبائن"}>
                      <SoftButton variant={assignedCount > 0 ? "gradient" : "outlined"} color="info" size="small"
                        startIcon={<GroupIcon />} onClick={() => setAssignDialog(true)}>
                        {isPurchase ? "الموردون" : "الزبائن"}
                        {assignedCount > 0 && (
                          <Chip size="small" label={assignedCount}
                            sx={{ mr: 0.5, height: 18, fontSize: 10, background: "rgba(255,255,255,0.3)", color: "inherit" }} />
                        )}
                      </SoftButton>
                    </Tooltip>
                    <TextField size="small" value={search} placeholder="بحث بالصنف أو الكود..."
                      onChange={(e) => setSearch(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                      sx={{ width: { xs: "100%", sm: 240 } }} />
                  </SoftBox>
                </SoftBox>

                <SoftBox
                  mb={2}
                  p={1.5}
                  sx={{ border: "1px solid #e9ecef", borderRadius: 2, background: "#f8f9fa" }}
                >
                  {productsError && (
                    <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setProductsError("")}>
                      {productsError}
                    </Alert>
                  )}
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Autocomplete
                        size="small"
                        options={availableProducts}
                        loading={loadingProducts}
                        value={addProduct}
                        onChange={(_, product) => {
                          setAddProduct(product);
                          setAddPrice("");
                        }}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        getOptionLabel={(option) =>
                          option ? `${option.sku || option.id} - ${option.name}` : ""
                        }
                        noOptionsText={loadingProducts ? "جاري تحميل الأصناف..." : "كل الأصناف مضافة أو لا توجد أصناف"}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="الصنف"
                            placeholder="ابحث بالكود أو الاسم..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingProducts ? <CircularProgress color="inherit" size={16} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="سعر القائمة"
                        value={addPrice}
                        onChange={(event) => setAddPrice(event.target.value)}
                        placeholder={addProduct ? `الرئيسي ${formatDZD(productBasePrice(addProduct))}` : "0 = رئيسي"}
                        inputProps={{ min: 0, step: "0.01" }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <SoftButton
                        fullWidth
                        variant="gradient"
                        color="info"
                        size="small"
                        startIcon={<AddIcon />}
                        disabled={!addProduct || addingItem}
                        onClick={addSelectedProduct}
                      >
                        {addingItem ? "جاري الإضافة..." : "إضافة صنف"}
                      </SoftButton>
                    </Grid>
                  </Grid>
                  {addProduct && (
                    <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
                      الوحدة: {productUnit(addProduct)} · السعر الرئيسي: {formatDZD(productBasePrice(addProduct))}
                    </SoftTypography>
                  )}
                </SoftBox>

                {loadingItems ? (
                  <SoftBox display="flex" justifyContent="center" py={6}><CircularProgress /></SoftBox>
                ) : itemsError ? (
                  <Alert severity="error" sx={{ m: 2 }} onClose={() => setItemsError("")}>
                    {itemsError}
                  </Alert>
                ) : filteredItems.length === 0 ? (
                  <SoftBox textAlign="center" py={6}>
                    <SoftTypography variant="body2" color="secondary">
                      {items.length === 0
                        ? "لا توجد أصناف في هذه القائمة بعد. أضف صنفاً من الحقل أعلاه."
                        : "لا توجد نتائج للبحث"}
                    </SoftTypography>
                  </SoftBox>
                ) : (
                  <SoftBox sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                          {["الصنف", "السعر الرئيسي", "سعر القائمة", "الوحدة", "إجراء"].map((h) => (
                            <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <SoftTypography variant="caption" color="secondary" fontWeight="bold">{h}</SoftTypography>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={`${selectedId}-${item.product_id}`} style={{ borderBottom: "1px solid #f0f2f5" }}>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">{item.product_name}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary" display="block">{item.product_code}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">
                                {formatDZD(item.base_price)}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", width: 160 }}>
                              <TextField size="small" type="number"
                                defaultValue={item.unit_price_amount || ""}
                                placeholder="0 = رئيسي"
                                onBlur={(e) => setProductPrice(item, e.target.value)}
                                inputProps={{ min: 0 }} />
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{item.unit || "—"}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px", width: 70 }}>
                              <Tooltip title="حذف من القائمة">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    disabled={String(removingProductId) === String(item.product_id)}
                                    onClick={() => removeProductFromList(item)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </SoftBox>
                )}
              </Card>
            </Grid>
          </Grid>
        )}
      </SoftBox>

      {/* New price list dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>قائمة أسعار جديدة</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {listErrors._global && (
              <Grid item xs={12}>
                <Alert severity="error">{listErrors._global}</Alert>
              </Grid>
            )}
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" label="اسم القائمة" value={listForm.name}
                onChange={(e) => setListField("name", e.target.value)}
                placeholder="مثال: أسعار الجملة"
                error={!!listErrors.name}
                helperText={listErrors.name || ""} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="الكود" value={listForm.code}
                onChange={(e) => setListField("code", e.target.value)}
                placeholder="اختياري"
                error={!!listErrors.code}
                helperText={listErrors.code || ""} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth select size="small" label="نوع القائمة" value={listForm.type}
                onChange={(e) => setListField("type", e.target.value)}
                error={!!listErrors.type}
                helperText={listErrors.type || ""}>
                <MenuItem value="sales">بيع</MenuItem>
                <MenuItem value="purchase">شراء</MenuItem>
                <MenuItem value="both">بيع وشراء</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialogOpen(false)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small"
            disabled={!listForm.name.trim() || saving} onClick={saveNewList}>
            {saving ? "جاري الإنشاء..." : "إنشاء القائمة"}
          </SoftButton>
        </DialogActions>
      </Dialog>

      {/* Assign entities dialog */}
      {selectedList && (
        <AssignEntitiesDialog
          open={assignDialog}
          onClose={() => setAssignDialog(false)}
          priceList={{ ...selectedList, assignedIds }}
          onSave={saveAssignedIds}
          saving={savingAssignments}
          suppliers={suppliers}
          customers={customers}
        />
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack("")}
        message={snack} anchorOrigin={{ vertical: "bottom", horizontal: "left" }} />

      <Footer />
    </DashboardLayout>
  );
}

export default PriceLists;
