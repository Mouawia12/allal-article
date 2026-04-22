/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

import Card from "@mui/material/Card";
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
import EditIcon from "@mui/icons-material/Edit";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import SearchIcon from "@mui/icons-material/Search";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  formatDZD,
  priceLists as initialPriceLists,
  priceSourceLabels,
  resolveProductPrice,
} from "data/mock/pricingInventoryMock";

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

const typeLabels = {
  sales: "بيع",
  purchase: "شراء",
  both: "بيع وشراء",
};

function clonePriceLists() {
  return initialPriceLists.map((list) => ({
    ...list,
    items: [...(list.items || [])],
  }));
}

function getListItem(list, product) {
  return (list.items || []).find((item) => String(item.productKey) === String(product.code || product.id));
}

function PriceLists() {
  const [lists, setLists] = useState(clonePriceLists);
  const [selectedId, setSelectedId] = useState("AHMED");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listForm, setListForm] = useState({ name: "", type: "sales", code: "" });

  const selectedList = lists.find((list) => list.id === selectedId) || lists[0];
  const customCount = selectedList.items.filter((item) => Number(item.unitPrice || 0) > 0).length;
  const fallbackCount = priceProducts.length - customCount;

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
    };
    setLists((current) => [nextList, ...current]);
    setSelectedId(id);
    setDialogOpen(false);
  };

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
              <SoftTypography variant="h3" color="secondary" fontWeight="bold">{typeLabels[selectedList.type]}</SoftTypography>
              <SoftTypography variant="caption" color="text">نوع القائمة الحالية</SoftTypography>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <PriceChangeIcon sx={{ color: "#17c1e8" }} />
                <SoftTypography variant="h6" fontWeight="bold">القوائم</SoftTypography>
              </SoftBox>
              <SoftBox display="flex" flexDirection="column" gap={1.5}>
                {lists.map((list) => (
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
                      <SoftBox>
                        <SoftTypography variant="button" fontWeight="bold">{list.name}</SoftTypography>
                        <SoftTypography variant="caption" color="secondary" display="block">
                          {list.code} · {typeLabels[list.type]}
                        </SoftTypography>
                      </SoftBox>
                      <SoftBadge
                        variant="gradient"
                        color={list.isDefault ? "success" : "info"}
                        size="xs"
                        badgeContent={list.isDefault ? "افتراضية" : "نشطة"}
                        container
                      />
                    </SoftBox>
                    <SoftTypography variant="caption" color="text" display="block" mt={1}>
                      {list.description}
                    </SoftTypography>
                    <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
                      آخر تعديل: {list.updatedAt}
                    </SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
                <SoftBox>
                  <SoftTypography variant="h6" fontWeight="bold">{selectedList.name}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    اترك السعر فارغاً أو 0 ليستخدم النظام السعر الرئيسي للصنف
                  </SoftTypography>
                </SoftBox>
                <TextField
                  size="small"
                  value={search}
                  placeholder="بحث بالصنف أو الكود..."
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                  sx={{ width: { xs: "100%", md: 300 } }}
                />
              </SoftBox>

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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>قائمة أسعار جديدة</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                size="small"
                label="اسم القائمة"
                value={listForm.name}
                onChange={(event) => setListForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="مثال: أسعار أحمد"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="الكود"
                value={listForm.code}
                onChange={(event) => setListForm((form) => ({ ...form, code: event.target.value }))}
                placeholder="اختياري"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                size="small"
                label="نوع القائمة"
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
          <SoftButton key="cancel" variant="outlined" color="secondary" size="small" onClick={() => setDialogOpen(false)}>
            إلغاء
          </SoftButton>
          <SoftButton key="create" variant="gradient" color="info" size="small" disabled={!listForm.name.trim()} onClick={saveNewList}>
            إنشاء القائمة
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default PriceLists;
