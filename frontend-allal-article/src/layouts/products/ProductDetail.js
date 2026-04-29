/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { productsApi, inventoryApi, ordersApi, priceListsApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

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
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [stockLines, setStockLines] = useState([]);
  const [movements, setMovements] = useState([]);
  const [relatedOrders, setRelatedOrders] = useState([]);
  const [priceListRows, setPriceListRows] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [relatedOrdersError, setRelatedOrdersError] = useState("");
  const [priceListError, setPriceListError] = useState("");
  const { isFavorite, toggleFavorite } = useProductFavorites();

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    setPriceListError("");
    Promise.all([
      productsApi.getById(id),
      inventoryApi.getProductStock(id),
      inventoryApi.listMovements({ productId: id, size: 50 }),
      priceListsApi.list().catch((error) => {
        setPriceListError(getApiErrorMessage(error, "تعذر تحميل قوائم الأسعار"));
        return { data: [] };
      }),
    ])
      .then(([pRes, sRes, mRes, plRes]) => {
        const p = pRes.data;
        setProduct({
          id: p.id,
          name: p.name,
          code: p.sku ?? "—",
          category: p.categoryName ?? "—",
          unit: p.baseUnitName ?? p.baseUnitSymbol ?? "وحدة",
          description: p.description ?? "",
          color: "#17c1e8",
          image: null,
          price: Number(p.currentPriceAmount ?? 0),
          lastPriceUpdatedAt: p.createdAt ? p.createdAt.slice(0, 10) : "—",
          lastPriceUpdatedBy: "—",
          lastUpdated: p.createdAt ? p.createdAt.slice(0, 10) : "—",
          status: p.status,
        });
        const lines = sRes.data ?? [];
        setStockLines(lines);
        const mov = (mRes.data?.content ?? mRes.data ?? []);
        setMovements(mov.map((m) => ({
          date: m.createdAt ? m.createdAt.slice(0, 10) : "—",
          type: (m.movementType ?? "").toLowerCase().startsWith("out") ? "out" : "in",
          qty: Number(m.qty ?? 0),
          reference: m.sourceType && m.sourceId ? `${m.sourceType}-${m.sourceId}` : "—",
          note: m.notes ?? "",
        })));
        const lists = Array.isArray(plRes.data) ? plRes.data
          : (plRes.data?.content ?? []);
        Promise.all(lists.map((list) =>
          priceListsApi.getItems(list.id)
            .then((r) => {
              const items = Array.isArray(r.data) ? r.data : (r.data?.content ?? []);
              const entry = items.find((it) => String(it.productId) === String(id));
              return {
                id: list.id,
                name: list.name,
                code: list.code,
                type: list.type ?? list.priceListType ?? "—",
                updatedAt: list.updatedAt ? list.updatedAt.slice(0, 10) : "—",
                unitPrice: entry ? Number(entry.unitPriceAmount ?? entry.unitPrice ?? 0) : null,
                source: entry ? "price_list" : "base_price",
              };
            })
            .catch((error) => {
              setPriceListError(getApiErrorMessage(error, "تعذر تحميل بعض أسعار القوائم"));
              return null;
            })
        )).then((rows) => setPriceListRows(rows.filter(Boolean)));
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل تفاصيل الصنف"));
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab === 1) {
      setRelatedOrdersError("");
      ordersApi.list({ size: 100 })
        .then((r) => {
          const all = Array.isArray(r.data?.content) ? r.data.content
            : Array.isArray(r.data) ? r.data : [];
          const related = all.filter((o) =>
            (o.items || []).some((item) => String(item.productId) === String(id))
          );
          setRelatedOrders(related.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber || String(o.id),
            customer: o.customerName || "—",
            date: o.createdAt ? o.createdAt.slice(0, 10) : "—",
            qty: (o.items || []).filter((item) => String(item.productId) === String(id))
              .reduce((s, item) => s + Number(item.orderedQty ?? item.qty ?? 0), 0),
            status: o.orderStatus || o.status || "draft",
          })));
        })
        .catch((error) => {
          setRelatedOrdersError(getApiErrorMessage(error, "تعذر تحميل الطلبيات المرتبطة"));
          setRelatedOrders([]);
        });
    }
  }, [tab, id]);

  useEffect(() => { load(); }, [load]);

  const statusColors = {
    confirmed: "success", completed: "success", shipped: "success",
    under_review: "warning", submitted: "info",
    draft: "secondary", cancelled: "error", rejected: "error",
  };
  const statusLabels = {
    confirmed: "مؤكدة", completed: "مكتملة", shipped: "مشحونة",
    under_review: "قيد المراجعة", submitted: "مرسلة",
    draft: "مسودة", cancelled: "ملغاة", rejected: "مرفوضة",
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" py={10}>
          <CircularProgress />
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (loadError || !product) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox py={3}>
          <SoftBox mb={2}>
            <IconButton onClick={() => navigate("/products")} size="small">
              <ArrowBackIcon />
            </IconButton>
          </SoftBox>
          <Alert severity="error">{loadError || "تعذر تحميل تفاصيل الصنف"}</Alert>
        </SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  const favorite = isFavorite(product.id);
  const onHand    = stockLines.reduce((s, l) => s + Number(l.onHandQty ?? 0), 0);
  const reserved  = stockLines.reduce((s, l) => s + Number(l.reservedQty ?? 0), 0);
  const available = stockLines.reduce((s, l) => s + Number(l.availableQty ?? 0), 0);
  const stock = { onHand, reserved, available, pending: 0, projected: available };
  const usedPercent = onHand > 0 ? Math.round((reserved / onHand) * 100) : 0;

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
                  <StockMetric label="الكمية الفعلية"  value={stock.onHand}     unit={product.unit} color="#17c1e8" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="محجوز"            value={stock.reserved}   unit={product.unit} color="#fb8c00" subtext="طلبيات مؤكدة" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="متاح الآن"        value={stock.available}  unit={product.unit} color="#66BB6A" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="في طلبيات غير مؤكدة" value={stock.pending} unit={product.unit} color="#344767" />
                </Grid>
                <Grid item xs={6} sm={4} md={4}>
                  <StockMetric label="المتوقع"          value={stock.projected}  unit={product.unit} color="#7b809a" subtext="بعد طرح غير المؤكد" />
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
                  <SoftTypography variant="caption" color="secondary">{stock.onHand} {product.unit}</SoftTypography>
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
                  {movements.length === 0 && (
                    <SoftTypography variant="body2" color="text" sx={{ textAlign: "center", py: 3 }}>
                      لا توجد حركات مخزون لهذا الصنف
                    </SoftTypography>
                  )}
                  {movements.map((m, i) => (
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
                  {relatedOrdersError && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRelatedOrdersError("")}>
                      {relatedOrdersError}
                    </Alert>
                  )}
                  {relatedOrders.length === 0 ? (
                    <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                      لا توجد طلبيات مرتبطة بهذا الصنف
                    </SoftTypography>
                  ) : (
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
                        {relatedOrders.map((o) => (
                          <tr key={o.id}
                            style={{ borderBottom: "1px solid #f0f2f5", cursor: "pointer" }}
                            onClick={() => navigate(`/orders/${o.id}`)}>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="info" fontWeight="bold">{o.orderNumber}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption">{o.customer}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{o.date}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">{o.qty} {product.unit}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftBadge variant="gradient"
                                color={statusColors[o.status] || "secondary"}
                                size="xs"
                                badgeContent={statusLabels[o.status] || o.status}
                                container />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </SoftBox>
              )}

              {/* Price History Tab */}
              {tab === 2 && (
                <SoftBox p={3}>
                  <SoftBox mb={2} px={1.5} py={1.25} borderRadius={2}
                    sx={{ background: "#f8fbff", border: "1px solid #d7ebff" }}>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      هذا السجل مخصص للبائعين والإدارة لمراجعة آخر تغيرات سعر الصنف ومصدرها.
                    </SoftTypography>
                  </SoftBox>
                  <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                    لا يوجد سجل تغييرات سعر مسجّل لهذا الصنف
                  </SoftTypography>
                </SoftBox>
              )}

              {/* Price Lists Tab */}
              {tab === 3 && (
                <SoftBox p={3}>
                  <SoftBox mb={2} px={1.5} py={1.25} borderRadius={2}
                    sx={{ background: "#fffaf0", border: "1px solid #fde68a" }}>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      إذا كانت قيمة الصنف داخل القائمة غير موجودة أو 0، يظهر السعر الرئيسي تلقائياً في الطلبية.
                    </SoftTypography>
                  </SoftBox>
                  {priceListError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {priceListError}
                    </Alert>
                  )}
                  {priceListRows.length === 0 ? (
                    <SoftTypography variant="body2" color="secondary" textAlign="center" py={4}>
                      لا توجد قوائم أسعار مسجّلة
                    </SoftTypography>
                  ) : (
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
                        {priceListRows.map((list) => (
                          <tr key={list.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold">{list.name}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary" display="block">{list.code}</SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="text">
                                {list.type === "purchase" ? "شراء" : list.type === "sales" ? "بيع" : list.type}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" fontWeight="bold" color="info">
                                {list.unitPrice != null ? formatPrice(list.unitPrice) : formatPrice(product.price)}
                              </SoftTypography>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftBadge variant="gradient"
                                color={list.source === "price_list" ? "info" : "secondary"}
                                size="xs"
                                badgeContent={list.source === "price_list" ? "من القائمة" : "السعر الرئيسي"}
                                container />
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              <SoftTypography variant="caption" color="secondary">{list.updatedAt}</SoftTypography>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
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
