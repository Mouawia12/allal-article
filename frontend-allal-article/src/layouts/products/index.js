/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
import demoBoltsImage from "assets/images/products/demo-bolts.jpg";
import demoToolsImage from "assets/images/products/demo-tools.jpg";
import demoCablesImage from "assets/images/products/demo-cables.jpg";
import demoBuildingSuppliesImage from "assets/images/products/demo-building-supplies.jpg";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const categories = ["الكل", "مسامير وبراغي", "أدوات", "كهرباء", "سباكة", "دهانات", "مواد عزل", "معدات"];
const favoriteCategory = "المفضلة";
const categoryFilters = ["الكل", favoriteCategory, ...categories.filter((cat) => cat !== "الكل")];

const mockProducts = [
  { id: 1,  name: "برغي M10 × 50mm",    code: "BRG-010-50", category: "مسامير وبراغي", onHand: 850,  reserved: 200, pending: 100, unit: "قطعة", color: "#FF6B6B", price: 650,  lastPriceUpdatedAt: "2024-01-22", image: demoBoltsImage },
  { id: 2,  name: "برغي M8 × 30mm",     code: "BRG-008-30", category: "مسامير وبراغي", onHand: 1200, reserved: 300, pending: 200, unit: "قطعة", color: "#FF6B6B", price: 900,  lastPriceUpdatedAt: "2024-01-19", image: demoBoltsImage },
  { id: 3,  name: "صامولة M10",          code: "SAM-010",    category: "مسامير وبراغي", onHand: 600,  reserved: 150, pending: 80,  unit: "قطعة", color: "#FF8E53", price: 450,  lastPriceUpdatedAt: "2024-01-18", image: demoBoltsImage },
  { id: 4,  name: "مفتاح ربط 17mm",     code: "MFT-017",    category: "أدوات",          onHand: 45,   reserved: 10,  pending: 5,   unit: "قطعة", color: "#4ECDC4", price: 35,   lastPriceUpdatedAt: "2024-01-15", image: demoToolsImage },
  { id: 5,  name: "مفتاح ربط 22mm",     code: "MFT-022",    category: "أدوات",          onHand: 30,   reserved: 5,   pending: 10,  unit: "قطعة", color: "#4ECDC4", price: 25,   lastPriceUpdatedAt: "2024-01-14", image: demoToolsImage },
  { id: 6,  name: "كماشة عالمية",        code: "KMA-UNI",    category: "أدوات",          onHand: 0,    reserved: 0,   pending: 5,   unit: "قطعة", color: "#4ECDC4", price: 0,    lastPriceUpdatedAt: "2024-01-10", image: demoToolsImage },
  { id: 7,  name: "كابل كهربائي 2.5mm", code: "KBL-25",     category: "كهرباء",         onHand: 500,  reserved: 100, pending: 200, unit: "متر",  color: "#FFE66D", price: 400,  lastPriceUpdatedAt: "2024-01-21", image: demoCablesImage },
  { id: 8,  name: "كابل كهربائي 1.5mm", code: "KBL-15",     category: "كهرباء",         onHand: 800,  reserved: 150, pending: 100, unit: "متر",  color: "#FFE66D", price: 650,  lastPriceUpdatedAt: "2024-01-16", image: demoCablesImage },
  { id: 9,  name: "شريط عازل كهربائي",  code: "SHR-EL",     category: "كهرباء",         onHand: 200,  reserved: 30,  pending: 20,  unit: "لفة",  color: "#F7DC6F", price: 170,  lastPriceUpdatedAt: "2024-01-13", image: demoCablesImage },
  { id: 10, name: "أنبوب PVC 2 بوصة",  code: "ANB-PVC-2",  category: "سباكة",          onHand: 100,  reserved: 40,  pending: 30,  unit: "متر",  color: "#A8E6CF", price: 60,   lastPriceUpdatedAt: "2024-01-20", image: demoBuildingSuppliesImage },
  { id: 11, name: "أنبوب PVC 1 بوصة",  code: "ANB-PVC-1",  category: "سباكة",          onHand: 150,  reserved: 20,  pending: 10,  unit: "متر",  color: "#A8E6CF", price: 130,  lastPriceUpdatedAt: "2024-01-12", image: demoBuildingSuppliesImage },
  { id: 12, name: "صنبور مياه",          code: "SNB-MYA",    category: "سباكة",          onHand: 25,   reserved: 5,   pending: 3,   unit: "قطعة", color: "#88D8B0", price: 20,   lastPriceUpdatedAt: "2024-01-11" },
  { id: 13, name: "دهان أبيض 4L",       code: "DHN-WHT-4",  category: "دهانات",         onHand: 80,   reserved: 20,  pending: 10,  unit: "علبة", color: "#DDA0DD", price: 320,  lastPriceUpdatedAt: "2024-01-17", image: demoBuildingSuppliesImage },
  { id: 14, name: "دهان رمادي 4L",      code: "DHN-GRY-4",  category: "دهانات",         onHand: 60,   reserved: 10,  pending: 5,   unit: "علبة", color: "#DA70D6", price: 305,  lastPriceUpdatedAt: "2024-01-09" },
  { id: 15, name: "شريط عازل حراري",    code: "SHR-HRR",    category: "مواد عزل",       onHand: 120,  reserved: 30,  pending: 0,   unit: "لفة",  color: "#B0C4DE", price: 115,  lastPriceUpdatedAt: "2024-01-08" },
  { id: 16, name: "لوح خشبي 2×4",      code: "LWH-2X4",    category: "معدات",          onHand: 200,  reserved: 50,  pending: 20,  unit: "قطعة", color: "#F4A460", price: 215,  lastPriceUpdatedAt: "2024-01-06" },
];

function getStockStatus(product) {
  const available = product.onHand - product.reserved;
  if (product.onHand === 0) return { label: "نفذ", color: "error" };
  if (available < 20) return { label: "منخفض", color: "warning" };
  return { label: "متوفر", color: "success" };
}

function formatPrice(value) {
  return `${new Intl.NumberFormat("ar-DZ").format(value)} دج`;
}

// ─── Product Grid Card ────────────────────────────────────────────────────────
function ProductGridCard({ product, isFavorite, onToggleFavorite, onView, onEdit }) {
  const stock = getStockStatus(product);
  const available = product.onHand - product.reserved;
  const usedPercent = product.onHand > 0 ? Math.round((product.reserved / product.onHand) * 100) : 0;

  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      {/* Color Block */}
      <SoftBox
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          minHeight: 0,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${product.color}66, ${product.color})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {product.image ? (
          <SoftBox
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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

      <SoftTypography variant="button" fontWeight="bold" lineHeight={1.3} mb={0.3}>
        {product.name}
      </SoftTypography>
      <SoftBox display="flex" alignItems="center" gap={0.75} mb={1} flexWrap="wrap">
        <SoftTypography variant="caption" color="secondary">
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
            {formatPrice(product.price)}
          </SoftTypography>
        </SoftBox>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={1} mt={0.5}>
          <SoftTypography variant="caption" color="secondary">آخر تعديل سعر</SoftTypography>
          <SoftTypography variant="caption" fontWeight="bold" color="text">
            {product.lastPriceUpdatedAt}
          </SoftTypography>
        </SoftBox>
      </SoftBox>

      {/* Stock Progress */}
      <SoftBox mb={1}>
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
  const available = product.onHand - product.reserved;
  const projected = available - product.pending;

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
              background: `linear-gradient(135deg, ${product.color}66, ${product.color})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {product.image ? (
              <SoftBox
                component="img"
                src={product.image}
                alt={product.name}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Inventory2Icon sx={{ color: "#fff", fontSize: 18 }} />
            )}
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="button" fontWeight="medium">{product.name}</SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">{product.code}</SoftTypography>
            <SoftTypography variant="caption" color="text" display="block">
              {formatPrice(product.price)} · آخر تعديل سعر: {product.lastPriceUpdatedAt}
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
  const [view, setView] = useState("grid");
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const { favoriteCount, isFavorite, toggleFavorite } = useProductFavorites();

  const filtered = mockProducts.filter((p) => {
    const matchCat =
      category === "الكل" ||
      (category === favoriteCategory && isFavorite(p.id)) ||
      p.category === category;
    const matchSearch = p.name.includes(search) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const outOfStock = mockProducts.filter(p => p.onHand === 0).length;
  const lowStock = mockProducts.filter(p => p.onHand > 0 && (p.onHand - p.reserved) < 20).length;

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
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color="info" size="small" startIcon={<PriceChangeIcon />} onClick={() => navigate("/products/price-lists")}>
              قوائم الأسعار
            </SoftButton>
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<CloudUploadIcon />}>
              استيراد
            </SoftButton>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => navigate("/products/new")}>
              إضافة صنف
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {[
            { label: "إجمالي الأصناف",   value: mockProducts.length, color: "info" },
            { label: "المفضلة",           value: favoriteCount, color: "warning" },
            { label: "متوفرة",            value: mockProducts.filter(p => p.onHand > 0).length, color: "success" },
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

        <Card>
          <SoftBox p={2}>
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
                    <Grid item xs={6} sm={4} md={3} lg={2} key={p.id}>
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
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Products;
