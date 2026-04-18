/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
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

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockProduct = {
  id: 1,
  name: "برغي M10 × 50mm",
  code: "BRG-010-50",
  category: "مسامير وبراغي",
  unit: "قطعة",
  description: "برغي فولاذي عالي الجودة مقاس M10 طول 50mm، مناسب للإنشاءات والتركيبات الثقيلة.",
  color: "#FF6B6B",
  price: 650,
  lastPriceUpdatedAt: "2024-01-22 14:30",
  lastPriceUpdatedBy: "الإدارة التجارية",
  stock: {
    onHand: 850,
    reserved: 200,
    pending: 100,
    available: 650,
    projected: 550,
  },
  lastUpdated: "2024-01-22 14:30",
  movements: [
    { date: "2024-01-22", type: "out", qty: 50,  reference: "ORD-2024-007", note: "شحن للزبون" },
    { date: "2024-01-20", type: "in",  qty: 200, reference: "RECV-2024-012", note: "استلام من المورد" },
    { date: "2024-01-18", type: "out", qty: 100, reference: "ORD-2024-005", note: "شحن للزبون" },
    { date: "2024-01-15", type: "out", qty: 75,  reference: "ORD-2024-003", note: "شحن للزبون" },
    { date: "2024-01-10", type: "in",  qty: 500, reference: "RECV-2024-008", note: "استلام من المورد" },
  ],
  relatedOrders: [
    { id: "ORD-2024-007", customer: "شركة المستقبل للصناعة", date: "2024-01-20", qty: 200, status: "confirmed" },
    { id: "ORD-2024-005", customer: "شركة الأفق للتجارة",    date: "2024-01-18", qty: 150, status: "fulfilled" },
    { id: "ORD-2024-003", customer: "شركة الإنشاءات المتحدة",date: "2024-01-17", qty: 500, status: "under_review" },
  ],
  priceHistory: [
    {
      id: "PRC-2024-004",
      changedAt: "2024-01-22 14:30",
      previousPrice: 620,
      newPrice: 650,
      changedBy: "الإدارة التجارية",
      note: "تعديل بعد تحديث سعر التوريد",
    },
    {
      id: "PRC-2024-003",
      changedAt: "2024-01-16 09:10",
      previousPrice: 590,
      newPrice: 620,
      changedBy: "مدير المبيعات",
      note: "رفع هامش البيع للصنف السريع",
    },
    {
      id: "PRC-2024-002",
      changedAt: "2024-01-08 16:45",
      previousPrice: 560,
      newPrice: 590,
      changedBy: "الإدارة التجارية",
      note: "تحديث حسب لائحة الأسعار الشهرية",
    },
    {
      id: "PRC-2023-019",
      changedAt: "2023-12-21 11:00",
      previousPrice: 540,
      newPrice: 560,
      changedBy: "المحاسبة",
      note: "مواءمة مع تكلفة الشحن الجديدة",
    },
  ],
};

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
  const product = mockProduct;
  const [tab, setTab] = useState(0);

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
                  height: 160,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${product.color}55, ${product.color})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Inventory2Icon sx={{ color: "#fff", fontSize: 64, opacity: 0.8 }} />
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
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ProductDetail;
