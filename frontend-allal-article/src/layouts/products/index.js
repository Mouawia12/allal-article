/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import LinearProgress from "@mui/material/LinearProgress";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import GridViewIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SettingsIcon from "@mui/icons-material/Settings";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import useProductFavorites from "hooks/useProductFavorites";
import { inventoryApi, productsApi, mediaApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";
import {
  formatCatalogDate,
  formatCatalogPrice,
  normalizeCatalogProducts,
} from "utils/productCatalog";

const favoriteCategory = "المفضلة";

function getStockStatus(product) {
  const available = product.available ?? product.onHand - product.reserved;
  if (product.onHand <= 0) return { label: "نفذ", color: "error" };
  if (available <= 0) return { label: "محجوز", color: "warning" };
  if (available <= product.minStockQty || available < 20) return { label: "منخفض", color: "warning" };
  return { label: "متوفر", color: "success" };
}

function extractContent(response) {
  return response?.data?.content ?? response?.data ?? [];
}

// ─── Product Grid Card ────────────────────────────────────────────────────────
function ProductGridCard({ product, isFavorite, onToggleFavorite, onView, onEdit }) {
  const stock = getStockStatus(product);
  const available = product.available ?? product.onHand - product.reserved;
  const usedPercent = product.onHand > 0
    ? Math.min(100, Math.round((product.reserved / product.onHand) * 100))
    : 0;

  return (
    <Card
      sx={{
        p: 1.75,
        height: "100%",
        minHeight: 350,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #edf2f7",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      <SoftBox
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 1.5,
          background: product.image ? "#f8fafc" : `linear-gradient(135deg, ${product.color}66, ${product.color})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
          overflow: "hidden",
          border: product.image ? "1px solid #edf2f7" : "none",
        }}
      >
        {product.image ? (
          <SoftBox
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
          />
        ) : (
          <Inventory2Icon sx={{ color: "#fff", fontSize: 32, opacity: 0.8 }} />
        )}
        <SoftBox position="absolute" top={6} right={6}>
          <SoftBadge variant="gradient" color={stock.color} size="xs" badgeContent={stock.label} container />
        </SoftBox>
        <Tooltip title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(product.id);
            }}
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              width: 28,
              height: 28,
              background: "#fff",
              color: isFavorite ? "#fb8c00" : "#8392ab",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              "&:hover": { background: "#fff7e6", color: "#fb8c00" },
            }}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isFavorite ? <StarIcon sx={{ fontSize: 18 }} /> : <StarBorderIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </SoftBox>

      <SoftTypography
        variant="button"
        fontWeight="bold"
        lineHeight={1.3}
        mb={0.3}
        sx={{
          minHeight: 36,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {product.name}
      </SoftTypography>
      <SoftBox display="flex" alignItems="center" gap={0.75} mb={1} flexWrap="wrap">
        <SoftTypography variant="caption" color="secondary" sx={{ wordBreak: "break-word" }}>
          {product.code} · {product.category}
        </SoftTypography>
        {isFavorite && (
          <Chip label="مفضل" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
        )}
      </SoftBox>

      <SoftBox
        mb={1.25}
        px={1.25}
        py={1}
        borderRadius={2}
        sx={{ background: "#f8fbff", border: "1px solid #d7ebff" }}
      >
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <SoftTypography variant="caption" color="secondary">السعر الحالي</SoftTypography>
          <SoftTypography variant="button" fontWeight="bold" color="info">
            {formatCatalogPrice(product.price)}
          </SoftTypography>
        </SoftBox>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={1} mt={0.5}>
          <SoftTypography variant="caption" color="secondary">آخر تعديل سعر</SoftTypography>
          <SoftTypography variant="caption" fontWeight="bold" color="text">
            {formatCatalogDate(product.lastPriceUpdatedAt)}
          </SoftTypography>
        </SoftBox>
      </SoftBox>

      <SoftBox mb={1}>
        <SoftBox
          display="grid"
          gridTemplateColumns="repeat(3, minmax(0, 1fr))"
          gap={0.75}
          mb={1}
        >
          {[
            { label: "فعلي", value: product.onHand, color: "text" },
            { label: "محجوز", value: product.reserved, color: "warning" },
            { label: "متاح", value: available, color: available <= 0 ? "error" : "success" },
          ].map((item) => (
            <SoftBox key={item.label} textAlign="center" sx={{ background: "#f8f9fa", borderRadius: 1, p: 0.75 }}>
              <SoftTypography variant="caption" color={item.color} fontWeight="bold" display="block">
                {item.value}
              </SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                {item.label}
              </SoftTypography>
            </SoftBox>
          ))}
        </SoftBox>
        <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
          <SoftTypography variant="caption" color="text">متاح: {available} {product.unit}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">محجوز: {product.reserved}</SoftTypography>
        </SoftBox>
        <LinearProgress
          variant="determinate"
          value={usedPercent}
          sx={{ height: 6, borderRadius: 3, bgcolor: "#e9ecef",
            "& .MuiLinearProgress-bar": {
              background: usedPercent > 80 ? "#ea0606" : usedPercent > 50 ? "#fb8c00" : "#66BB6A",
            }
          }}
        />
      </SoftBox>

      <SoftBox display="flex" gap={1} mt="auto">
        <SoftButton variant="outlined" color="info" size="small" fullWidth startIcon={<VisibilityIcon />} onClick={() => onView(product.id)}>
          عرض
        </SoftButton>
        <SoftButton variant="outlined" color="secondary" size="small" fullWidth startIcon={<EditIcon />} onClick={() => onEdit(product.id)}>
          تعديل
        </SoftButton>
      </SoftBox>
    </Card>
  );
}

// ─── Product List Row ─────────────────────────────────────────────────────────
function ProductListRow({ product, index, isFavorite, onToggleFavorite, onView, onEdit }) {
  const stock = getStockStatus(product);
  const available = product.available ?? product.onHand - product.reserved;
  const projected = product.projected ?? available - product.pending;

  return (
    <tr
      style={{
        borderBottom: "1px solid #f0f2f5",
        background: index % 2 === 0 ? "#fff" : "#fafbfc",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
      onMouseLeave={(e) => (e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafbfc")}
    >
      <td style={{ padding: "10px 14px" }}>
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <SoftBox
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: product.image ? "#f8fafc" : `linear-gradient(135deg, ${product.color}66, ${product.color})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              border: product.image ? "1px solid #edf2f7" : "none",
            }}
          >
            {product.image ? (
              <SoftBox
                component="img"
                src={product.image}
                alt={product.name}
                sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.35 }}
              />
            ) : (
              <Inventory2Icon sx={{ color: "#fff", fontSize: 18 }} />
            )}
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="button" fontWeight="medium">{product.name}</SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">{product.code}</SoftTypography>
            <SoftTypography variant="caption" color="text" display="block">
              {formatCatalogPrice(product.price)} · آخر تعديل سعر: {formatCatalogDate(product.lastPriceUpdatedAt)}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <SoftTypography variant="caption" color="text">{product.category}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <SoftTypography variant="caption" fontWeight="bold">{product.onHand}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <SoftTypography variant="caption" color="warning">{product.reserved}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <SoftTypography variant="caption" color={available < 20 ? "error" : "success"} fontWeight="bold">{available}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <SoftTypography variant="caption" color={projected < 0 ? "error" : "text"}>{projected}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <SoftTypography variant="caption" color="secondary">{product.unit}</SoftTypography>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <SoftBadge variant="gradient" color={stock.color} size="xs" badgeContent={stock.label} container />
      </td>
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        <Tooltip title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(product.id);
            }}
            sx={{
              color: isFavorite ? "#fb8c00" : "#8392ab",
              border: "1px solid #e9ecef",
              borderRadius: 1,
              "&:hover": { background: "#fff7e6", color: "#fb8c00" },
            }}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isFavorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </td>
      <td style={{ padding: "10px 14px" }}>
        <SoftBox display="flex" gap={0.5}>
          <Tooltip title="عرض"><IconButton size="small" color="primary" onClick={() => onView(product.id)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="تعديل"><IconButton size="small" onClick={() => onEdit(product.id)}><EditIcon fontSize="small" /></IconButton></Tooltip>
        </SoftBox>
      </td>
    </tr>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Products({
  initialCategory = "الكل",
  title = "الأصناف",
  subtitle = "إدارة كتالوج الأصناف والمخزون",
}) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [view, setView] = useState("grid");
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [loadError, setLoadError] = useState("");
  const productImageUrls = useRef([]);
  const { favoriteCount, isFavorite, toggleFavorite } = useProductFavorites();

  useEffect(() => () => {
    productImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
    productImageUrls.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    Promise.all([
      productsApi.list({ size: 500 }),
      inventoryApi.listStock({ size: 1000 }),
    ])
      .then(async ([productsResponse, stockResponse]) => {
        if (cancelled) return;
        const normalized = normalizeCatalogProducts(extractContent(productsResponse), extractContent(stockResponse));
        const nextImageUrls = [];
        const withImages = await Promise.all(normalized.map(async (product) => {
          if (!product.primaryImageMediaId) return product;
          try {
            const response = await mediaApi.content(product.primaryImageMediaId);
            const imageUrl = URL.createObjectURL(response.data);
            nextImageUrls.push(imageUrl);
            return { ...product, image: imageUrl };
          } catch {
            return product;
          }
        }));
        if (cancelled) {
          nextImageUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        productImageUrls.current.forEach((url) => URL.revokeObjectURL(url));
        productImageUrls.current = nextImageUrls;
        setProducts(withImages);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(getApiErrorMessage(error, "تعذر تحميل الأصناف"));
        setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryFilters = useMemo(() => {
    const realCategories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return ["الكل", favoriteCategory, ...realCategories.filter((cat) => cat !== "الكل")];
  }, [products]);

  const filtered = products.filter((p) => {
    const matchCat =
      category === "الكل" ||
      (category === favoriteCategory && isFavorite(p.id)) ||
      p.category === category;
    const query = search.trim().toLowerCase();
    const matchSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  const outOfStock = products.filter(p => p.onHand === 0).length;
  const availableCount = products.filter(p => (p.available ?? p.onHand - p.reserved) > 0).length;
  const lowStock = products.filter((p) => {
    const available = p.available ?? p.onHand - p.reserved;
    return available > 0 && available < 20;
  }).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">{title}</SoftTypography>
            <SoftTypography variant="body2" color="text">{subtitle}</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} alignItems="center">
            <SoftButton variant="outlined" color="info" size="small" startIcon={<PriceChangeIcon />} onClick={() => navigate("/products/price-lists")}>
              قوائم الأسعار
            </SoftButton>
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<CloudUploadIcon />}>
              استيراد
            </SoftButton>
            <Tooltip title="إعدادات الأصناف">
              <IconButton size="small" onClick={() => navigate("/products/settings")}
                sx={{ border: "1px solid #e9ecef", borderRadius: "8px", p: "6px" }}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => navigate("/products/new")}>
              إضافة صنف
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الأصناف",   value: products.length, color: "info" },
            { label: "المفضلة",           value: favoriteCount, color: "warning" },
            { label: "متوفرة",            value: availableCount, color: "success" },
            { label: "مخزون منخفض",       value: lowStock, color: "warning" },
            { label: "نفذت من المخزون",   value: outOfStock, color: "error" },
          ].map((s) => (
            <Grid item xs={6} sm={4} md={2.4} key={s.label}>
              <Card sx={{ p: 2, textAlign: "center" }}>
                <SoftTypography variant="h3" fontWeight="bold" color={s.color}>{s.value}</SoftTypography>
                <SoftTypography variant="caption" color="text">{s.label}</SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <SoftBox>
          <SoftBox pb={2}>
            {/* Filters Row */}
            <SoftBox display="flex" gap={2} alignItems="center" mb={2} flexWrap="wrap">
              <TextField
                size="small"
                placeholder="بحث بالاسم أو الكود..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                  ),
                }}
                sx={{ width: 280 }}
              />
              <SoftBox display="flex" gap={1} flexWrap="wrap" flex={1}>
                {categoryFilters.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    size="small"
                    onClick={() => setCategory(cat)}
                    color={category === cat ? "info" : "default"}
                    variant={category === cat ? "filled" : "outlined"}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </SoftBox>
              <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)} size="small">
                <ToggleButton value="grid"><GridViewIcon fontSize="small" /></ToggleButton>
                <ToggleButton value="list"><ListIcon fontSize="small" /></ToggleButton>
              </ToggleButtonGroup>
            </SoftBox>

            <SoftTypography variant="caption" color="text" mb={2} display="block">
              {filtered.length} صنف
            </SoftTypography>

            {/* Grid View */}
            {view === "grid" && (
              <Grid container spacing={2}>
                {filtered.length === 0 ? (
                  <Grid item xs={12}>
                    <SoftBox textAlign="center" py={6}>
                      <SoftTypography variant="body2" color="text">
                        لا توجد أصناف مطابقة
                      </SoftTypography>
                    </SoftBox>
                  </Grid>
                ) : (
                  filtered.map((p) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={p.id}>
                      <ProductGridCard
                        product={p}
                        isFavorite={isFavorite(p.id)}
                        onToggleFavorite={toggleFavorite}
                        onView={(id) => navigate(`/products/${id}`)}
                        onEdit={(id) => navigate(`/products/${id}/edit`)}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            )}

            {/* List View */}
            {view === "list" && (
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["الصنف", "الفئة", "الكمية الفعلية", "محجوز", "متاح", "متوقع", "الوحدة", "الحالة", "مفضلة", "إجراء"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary" textTransform="uppercase">{h}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ textAlign: "center", padding: 32 }}>
                          <SoftTypography variant="body2" color="text">
                            لا توجد أصناف مطابقة
                          </SoftTypography>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p, i) => (
                        <ProductListRow
                          key={p.id}
                          product={p}
                          index={i}
                          isFavorite={isFavorite(p.id)}
                          onToggleFavorite={toggleFavorite}
                          onView={(id) => navigate(`/products/${id}`)}
                          onEdit={(id) => navigate(`/products/${id}/edit`)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </SoftBox>
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Products;
