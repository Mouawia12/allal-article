/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import HistoryIcon from "@mui/icons-material/History";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
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
const priceLists = [];
const resolveProductPrice = (product) => ({ finalPrice: product?.price || 0, listName: "—" });
import demoBoltsImage from "assets/images/products/demo-bolts.jpg";
import demoToolsImage from "assets/images/products/demo-tools.jpg";
import demoCablesImage from "assets/images/products/demo-cables.jpg";
import demoBuildingSuppliesImage from "assets/images/products/demo-building-supplies.jpg";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockProductCatalog = [
  { id: 1,  name: "برغي M10 × 50mm",    code: "BRG-010-50", category: "مسامير وبراغي", onHand: 850,  reserved: 200, pending: 100, unit: "قطعة", color: "#FF6B6B", price: 650, lastPriceUpdatedAt: "2024-01-22", image: demoBoltsImage },
  { id: 2,  name: "برغي M8 × 30mm",     code: "BRG-008-30", category: "مسامير وبراغي", onHand: 1200, reserved: 300, pending: 200, unit: "قطعة", color: "#FF6B6B", price: 900, lastPriceUpdatedAt: "2024-01-19", image: demoBoltsImage },
  { id: 3,  name: "صامولة M10",          code: "SAM-010",    category: "مسامير وبراغي", onHand: 600,  reserved: 150, pending: 80,  unit: "قطعة", color: "#FF8E53", price: 450, lastPriceUpdatedAt: "2024-01-18", image: demoBoltsImage },
  { id: 4,  name: "مفتاح ربط 17mm",     code: "MFT-017",    category: "أدوات",          onHand: 45,   reserved: 10,  pending: 5,   unit: "قطعة", color: "#4ECDC4", price: 35,  lastPriceUpdatedAt: "2024-01-15", image: demoToolsImage },
  { id: 5,  name: "مفتاح ربط 22mm",     code: "MFT-022",    category: "أدوات",          onHand: 30,   reserved: 5,   pending: 10,  unit: "قطعة", color: "#4ECDC4", price: 25,  lastPriceUpdatedAt: "2024-01-14", image: demoToolsImage },
  { id: 6,  name: "كماشة عالمية",        code: "KMA-UNI",    category: "أدوات",          onHand: 0,    reserved: 0,   pending: 5,   unit: "قطعة", color: "#4ECDC4", price: 0,   lastPriceUpdatedAt: "2024-01-10", image: demoToolsImage },
  { id: 7,  name: "كابل كهربائي 2.5mm", code: "KBL-25",     category: "كهرباء",         onHand: 500,  reserved: 100, pending: 200, unit: "متر",  color: "#FFE66D", price: 400, lastPriceUpdatedAt: "2024-01-21", image: demoCablesImage },
  { id: 8,  name: "كابل كهربائي 1.5mm", code: "KBL-15",     category: "كهرباء",         onHand: 800,  reserved: 150, pending: 100, unit: "متر",  color: "#FFE66D", price: 650, lastPriceUpdatedAt: "2024-01-16", image: demoCablesImage },
  { id: 9,  name: "شريط عازل كهربائي",  code: "SHR-EL",     category: "كهرباء",         onHand: 200,  reserved: 30,  pending: 20,  unit: "لفة",  color: "#F7DC6F", price: 170, lastPriceUpdatedAt: "2024-01-13", image: demoCablesImage },
  { id: 10, name: "أنبوب PVC 2 بوصة",   code: "ANB-PVC-2",  category: "سباكة",          onHand: 100,  reserved: 40,  pending: 30,  unit: "متر",  color: "#A8E6CF", price: 60,  lastPriceUpdatedAt: "2024-01-20", image: demoBuildingSuppliesImage },
  { id: 11, name: "أنبوب PVC 1 بوصة",   code: "ANB-PVC-1",  category: "سباكة",          onHand: 150,  reserved: 20,  pending: 10,  unit: "متر",  color: "#A8E6CF", price: 130, lastPriceUpdatedAt: "2024-01-12", image: demoBuildingSuppliesImage },
  { id: 12, name: "صنبور مياه",          code: "SNB-MYA",    category: "سباكة",          onHand: 25,   reserved: 5,   pending: 3,   unit: "قطعة", color: "#88D8B0", price: 20,  lastPriceUpdatedAt: "2024-01-11" },
  { id: 13, name: "دهان أبيض 4L",       code: "DHN-WHT-4",  category: "دهانات",         onHand: 80,   reserved: 20,  pending: 10,  unit: "علبة", color: "#DDA0DD", price: 320, lastPriceUpdatedAt: "2024-01-17", image: demoBuildingSuppliesImage },
  { id: 14, name: "دهان رمادي 4L",      code: "DHN-GRY-4",  category: "دهانات",         onHand: 60,   reserved: 10,  pending: 5,   unit: "علبة", color: "#DA70D6", price: 305, lastPriceUpdatedAt: "2024-01-09" },
  { id: 15, name: "شريط عازل حراري",    code: "SHR-HRR",    category: "مواد عزل",       onHand: 120,  reserved: 30,  pending: 0,   unit: "لفة",  color: "#B0C4DE", price: 115, lastPriceUpdatedAt: "2024-01-08" },
  { id: 16, name: "لوح خشبي 2×4",       code: "LWH-2X4",    category: "معدات",          onHand: 200,  reserved: 50,  pending: 20,  unit: "قطعة", color: "#F4A460", price: 215, lastPriceUpdatedAt: "2024-01-06" },
];

const mockProductMovements = [
  { date: "2024-01-22", type: "out", qty: 50,  reference: "ORD-2024-007", note: "شحن للزبون" },
  { date: "2024-01-20", type: "in",  qty: 200, reference: "RECV-2024-012", note: "استلام من المورد" },
  { date: "2024-01-18", type: "out", qty: 100, reference: "ORD-2024-005", note: "شحن للزبون" },
  { date: "2024-01-15", type: "out", qty: 75,  reference: "ORD-2024-003", note: "شحن للزبون" },
  { date: "2024-01-10", type: "in",  qty: 500, reference: "RECV-2024-008", note: "استلام من المورد" },
];

const mockRelatedOrders = [
  { id: "ORD-2024-007", customer: "شركة المستقبل للصناعة", date: "2024-01-20", qty: 200, status: "confirmed" },
  { id: "ORD-2024-005", customer: "شركة الأفق للتجارة",     date: "2024-01-18", qty: 150, status: "fulfilled" },
  { id: "ORD-2024-003", customer: "شركة الإنشاءات المتحدة", date: "2024-01-17", qty: 500, status: "under_review" },
];

function buildMockProductDetail(product) {
  const available = product.onHand - product.reserved;
  const previousPrice = Math.max(0, product.price - 30);

  return {
    id: product.id,
    name: product.name,
    code: product.code,
    category: product.category,
    unit: product.unit,
    description: `${product.name} ضمن فئة ${product.category}. تعرض هذه الصفحة المخزون، السعر، الحركات، والطلبيات المرتبطة بالصنف.`,
    color: product.color,
    image: product.image,
    price: product.price,
    lastPriceUpdatedAt: `${product.lastPriceUpdatedAt} 14:30`,
    lastPriceUpdatedBy: "الإدارة التجارية",
    stock: {
      onHand: product.onHand,
      reserved: product.reserved,
      pending: product.pending,
      available,
      projected: available - product.pending,
    },
    lastUpdated: `${product.lastPriceUpdatedAt} 14:30`,
    movements: mockProductMovements,
    relatedOrders: mockRelatedOrders,
    priceHistory: [
      {
        id: `PRC-${product.id}-004`,
        changedAt: `${product.lastPriceUpdatedAt} 14:30`,
        previousPrice,
        newPrice: product.price,
        changedBy: "الإدارة التجارية",
        note: "تعديل بعد تحديث سعر التوريد",
      },
      {
        id: `PRC-${product.id}-003`,
        changedAt: "2024-01-16 09:10",
        previousPrice: Math.max(0, previousPrice - 30),
        newPrice: previousPrice,
        changedBy: "مدير المبيعات",
        note: "رفع هامش البيع للصنف السريع",
      },
      {
        id: `PRC-${product.id}-002`,
        changedAt: "2024-01-08 16:45",
        previousPrice: Math.max(0, previousPrice - 60),
        newPrice: Math.max(0, previousPrice - 30),
        changedBy: "الإدارة التجارية",
        note: "تحديث حسب لائحة الأسعار الشهرية",
      },
    ],
  };
}

const statusColors = {
  confirmed:    "success",
  fulfilled:    "success",
  under_review: "warning",
  submitted:    "info",
  draft:        "secondary",
  cancelled:    "error",
};

const statusLabels = {
  confirmed:    "مؤكدة",
  fulfilled:    "مكتملة",
  under_review: "قيد المراجعة",
  submitted:    "مرسلة",
  draft:        "مسودة",
  cancelled:    "ملغاة",
};

function formatPrice(value) {
  return `${new Intl.NumberFormat("ar-DZ").format(value)} دج`;
}

// ─── Stock Metric Card ────────────────────────────────────────────────────────
function StockMetric({ label, value, unit, color, subtext }) {
  return (
    <Card sx={{ p: 2, textAlign: "center", border: `2px solid ${color}22` }}>
      <SoftTypography variant="h3" fontWeight="bold" sx={{ color }}>
        {value}
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block">
        {unit}
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
        {label}
      </SoftTypography>
      {subtext && (
        <SoftTypography variant="caption" color="secondary" display="block" fontSize={10}>
          {subtext}
        </SoftTypography>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const product = buildMockProductDetail(
    mockProductCatalog.find((item) => String(item.id) === String(id)) || mockProductCatalog[0]
  );
  const [tab, setTab] = useState(0);
  const { isFavorite, toggleFavorite } = useProductFavorites();
  const favorite = isFavorite(product.id);

  const usedPercent = product.stock.onHand > 0
    ? Math.round((product.stock.reserved / product.stock.onHand) * 100)
    : 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/products")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">{product.name}</SoftTypography>
            <SoftTypography variant="body2" color="text">
              {product.code} · {product.category}
            </SoftTypography>
          </SoftBox>
          <SoftButton
            variant={favorite ? "gradient" : "outlined"}
            color="warning"
            size="small"
            startIcon={favorite ? <StarIcon /> : <StarBorderIcon />}
            onClick={() => toggleFavorite(product.id)}
          >
            {favorite ? "مضاف للمفضلة" : "إضافة للمفضلة"}
          </SoftButton>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/products/${id}/edit`)}
          >
            تعديل الصنف
          </SoftButton>
        </SoftBox>

        <Grid container spacing={3}>
          {/* Left: Product Info */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, mb: 3 }}>
              {/* Product Image Placeholder */}
              <SoftBox
	                sx={{
	                  width: "100%",
	                  maxWidth: 320,
	                  aspectRatio: "1 / 1",
	                  mx: "auto",
	                  borderRadius: 3,
	                  background: `linear-gradient(135deg, ${product.color}55, ${product.color})`,
	                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
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
                  <Inventory2Icon sx={{ color: "#fff", fontSize: 64, opacity: 0.8 }} />
                )}
                <Tooltip title={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}>
                  <IconButton
                    size="small"
                    onClick={() => toggleFavorite(product.id)}
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      width: 34,
                      height: 34,
                      background: "#fff",
                      color: favorite ? "#fb8c00" : "#8392ab",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                      "&:hover": { background: "#fff7e6", color: "#fb8c00" },
                    }}
                    aria-label={favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                  >
                    {favorite ? <StarIcon /> : <StarBorderIcon />}
                  </IconButton>
                </Tooltip>
              </SoftBox>

              <SoftTypography variant="h5" fontWeight="bold" mb={0.5}>{product.name}</SoftTypography>
              <SoftTypography variant="caption" color="secondary" mb={2} display="block">
                كود: {product.code}
              </SoftTypography>

              <SoftBox
                mb={2}
                px={1.5}
                py={1.25}
                borderRadius={2}
                sx={{ background: "#f8fbff", border: "1px solid #d7ebff" }}
              >
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                  <SoftBox>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      السعر الحالي
                    </SoftTypography>
                    <SoftTypography variant="h5" fontWeight="bold" color="info">
                      {formatPrice(product.price)}
                    </SoftTypography>
                  </SoftBox>
                  <SoftBox>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      آخر تعديل سعر
                    </SoftTypography>
                    <SoftTypography variant="button" fontWeight="bold" color="text" display="block">
                      {product.lastPriceUpdatedAt}
                    </SoftTypography>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      بواسطة {product.lastPriceUpdatedBy}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>

              {[
                { label: "الفئة",    value: product.category },
                { label: "الوحدة",   value: product.unit },
                { label: "المفضلة", value: favorite ? "مضاف للمفضلة" : "غير مضاف" },
                { label: "آخر تعديل سعر", value: product.lastPriceUpdatedAt },
                { label: "آخر تحديث", value: product.lastUpdated },
              ].map((row) => (
                <SoftBox key={row.label} display="flex" justifyContent="space-between" mb={1}>
                  <SoftTypography variant="caption" color="secondary">{row.label}</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold" color="text">{row.value}</SoftTypography>
                </SoftBox>
              ))}

              <Divider sx={{ my: 2 }} />

              <SoftTypography variant="caption" color="secondary" fontWeight="bold" mb={1} display="block">
                الوصف
              </SoftTypography>
              <SoftTypography variant="caption" color="text">{product.description}</SoftTypography>
            </Card>
          </Grid>

          {/* Right: Stock + Details */}
          <Grid item xs={12} lg={8}>
            {/* Stock Overview */}
            <Card sx={{ p: 3, mb: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                حالة المخزون
              </SoftTypography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="الكمية الفعلية"  value={product.stock.onHand}     unit={product.unit} color="#17c1e8" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="محجوز"            value={product.stock.reserved}   unit={product.unit} color="#fb8c00" subtext="طلبيات مؤكدة" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="متاح الآن"        value={product.stock.available}  unit={product.unit} color="#66BB6A" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="في طلبيات غير مؤكدة" value={product.stock.pending} unit={product.unit} color="#344767" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="المتوقع"          value={product.stock.projected}  unit={product.unit} color="#7b809a" subtext="بعد طرح غير المؤكد" />
                </Grid>
              </Grid>

              {/* Usage Bar */}
              <SoftBox>
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" color="text">نسبة الاستخدام</SoftTypography>
                  <SoftTypography variant="caption" fontWeight="bold">{usedPercent}%</SoftTypography>
                </SoftBox>
                <LinearProgress
                  variant="determinate"
                  value={usedPercent}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "#e9ecef",
                    "& .MuiLinearProgress-bar": {
                      background: usedPercent > 80 ? "#ea0606" : usedPercent > 50 ? "#fb8c00" : "#66BB6A",
                    },
                  }}
                />
                <SoftBox display="flex" justifyContent="space-between" mt={0.5}>
                  <SoftTypography variant="caption" color="secondary">0</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">{product.stock.onHand} {product.unit}</SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>

            {/* Tabs */}
            <Card>
              <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
                <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
                  variant="scrollable"
                  allowScrollButtonsMobile
                  TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
                  <Tab
                    label={(
                      <SoftBox display="flex" alignItems="center" gap={0.75}>
                        <HistoryIcon sx={{ fontSize: 16 }} />
                        <SoftTypography variant="caption" fontWeight="medium">سجل الحركات</SoftTypography>
                      </SoftBox>
                    )}
                  />
                  <Tab
                    label={(
                      <SoftBox display="flex" alignItems="center" gap={0.75}>
                        <ShoppingCartIcon sx={{ fontSize: 16 }} />
                        <SoftTypography variant="caption" fontWeight="medium">الطلبيات المرتبطة</SoftTypography>
                      </SoftBox>
                    )}
                  />
                  <Tab
                    label={(
                      <SoftBox display="flex" alignItems="center" gap={0.75}>
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        <SoftTypography variant="caption" fontWeight="medium">سجل الأسعار</SoftTypography>
                      </SoftBox>
                    )}
                  />
                  <Tab
                    label={(
                      <SoftBox display="flex" alignItems="center" gap={0.75}>
                        <TrendingUpIcon sx={{ fontSize: 16 }} />
                        <SoftTypography variant="caption" fontWeight="medium">قوائم الأسعار</SoftTypography>
                      </SoftBox>
                    )}
                  />
                </Tabs>
              </SoftBox>

              {/* Movements Tab */}
              {tab === 0 && (
                <SoftBox p={3}>
                  {product.movements.map((m, i) => (
                    <SoftBox key={i} display="flex" alignItems="center" mb={2} gap={2}>
                      <SoftBox
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: m.type === "in"
                            ? "linear-gradient(195deg,#66BB6A,#43A047)"
                            : "linear-gradient(195deg,#ef5350,#e53935)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {m.type === "in"
                          ? <ArrowUpwardIcon sx={{ color: "#fff", fontSize: 18 }} />
                          : <ArrowDownwardIcon sx={{ color: "#fff", fontSize: 18 }} />
                        }
                      </SoftBox>
                      <SoftBox flex={1}>
                        <SoftBox display="flex" justifyContent="space-between">
                          <SoftTypography variant="button" fontWeight="medium" color={m.type === "in" ? "success" : "error"}>
                            {m.type === "in" ? "+" : "-"}{m.qty} {product.unit}
                          </SoftTypography>
                          <SoftTypography variant="caption" color="secondary">{m.date}</SoftTypography>
                        </SoftBox>
                        <SoftTypography variant="caption" color="secondary">
                          {m.reference} · {m.note}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              )}

              {/* Orders Tab */}
              {tab === 1 && (
                <SoftBox p={3}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        {["رقم الطلبية", "الزبون", "التاريخ", "الكمية", "الحالة"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.relatedOrders.map((o) => (
                        <tr
                          key={o.id}
                          style={{ borderBottom: "1px solid #f0f2f5", cursor: "pointer" }}
                          onClick={() => navigate(`/orders/${o.id}`)}
                        >
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="info" fontWeight="bold">{o.id}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption">{o.customer}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="secondary">{o.date}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{o.qty}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBadge
                              variant="gradient"
                              color={statusColors[o.status] || "secondary"}
                              size="xs"
                              badgeContent={statusLabels[o.status] || o.status}
                              container
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SoftBox>
              )}

              {/* Price History Tab */}
              {tab === 2 && (
                <SoftBox p={3}>
                  <SoftBox
                    mb={2}
                    px={1.5}
                    py={1.25}
                    borderRadius={2}
                    sx={{ background: "#f8fbff", border: "1px solid #d7ebff" }}
                  >
                    <SoftTypography variant="caption" color="secondary" display="block">
                      هذا السجل مخصص للبائعين والإدارة لمراجعة آخر تغيرات سعر الصنف ومصدرها.
                    </SoftTypography>
                  </SoftBox>

                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        {["التاريخ", "السعر السابق", "السعر الجديد", "الفرق", "بواسطة", "ملاحظة"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.priceHistory.map((entry) => {
                        const diff = entry.newPrice - entry.previousPrice;

                        return (
                          <tr key={entry.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">{entry.changedAt}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{formatPrice(entry.previousPrice)}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold" color="info">{formatPrice(entry.newPrice)}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography
                                variant="caption"
                                fontWeight="bold"
                                color={diff >= 0 ? "success" : "error"}
                              >
                                {diff >= 0 ? "+" : ""}
                                {formatPrice(diff)}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption">{entry.changedBy}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{entry.note}</SoftTypography>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SoftBox>
              )}

              {tab === 3 && (
                <SoftBox p={3}>
                  <SoftBox
                    mb={2}
                    px={1.5}
                    py={1.25}
                    borderRadius={2}
                    sx={{ background: "#fffaf0", border: "1px solid #fde68a" }}
                  >
                    <SoftTypography variant="caption" color="secondary" display="block">
                      إذا كانت قيمة الصنف داخل القائمة غير موجودة أو 0، يظهر السعر الرئيسي تلقائياً في الطلبية.
                    </SoftTypography>
                  </SoftBox>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8f9fa" }}>
                        {["القائمة", "النوع", "السعر المطبق", "المصدر", "آخر تعديل"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {priceLists.map((list) => {
                        const kind = list.type === "purchase" ? "purchase" : "sales";
                        const resolved = resolveProductPrice(product, list.id, kind);

                        return (
                          <tr key={list.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">{list.name}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary" display="block">{list.code}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="text">{list.type === "purchase" ? "شراء" : list.type === "sales" ? "بيع" : "بيع وشراء"}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold" color="info">{formatPrice(resolved.unitPrice)}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftBadge
                                variant="gradient"
                                color={resolved.source === "price_list" ? "info" : "secondary"}
                                size="xs"
                                badgeContent={resolved.source === "price_list" ? "من القائمة" : "السعر الرئيسي"}
                                container
                              />
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{list.updatedAt}</SoftTypography>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </SoftBox>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ProductDetail;
