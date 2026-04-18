/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2Icon from "@mui/icons-material/Inventory2";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const categories = ["الكل", "مسامير وبراغي", "أدوات", "كهرباء", "سباكة", "دهانات", "مواد عزل", "معدات"];

const mockProducts = [
  { id: 1, name: "برغي M10 × 50mm",       code: "BRG-010-50", category: "مسامير وبراغي", stock: 850,  unit: "قطعة", color: "#FF6B6B" },
  { id: 2, name: "برغي M8 × 30mm",        code: "BRG-008-30", category: "مسامير وبراغي", stock: 1200, unit: "قطعة", color: "#FF6B6B" },
  { id: 3, name: "صامولة M10",             code: "SAM-010",    category: "مسامير وبراغي", stock: 600,  unit: "قطعة", color: "#FF6B6B" },
  { id: 4, name: "مفتاح ربط 17mm",        code: "MFT-017",    category: "أدوات",          stock: 45,   unit: "قطعة", color: "#4ECDC4" },
  { id: 5, name: "مفتاح ربط 22mm",        code: "MFT-022",    category: "أدوات",          stock: 30,   unit: "قطعة", color: "#4ECDC4" },
  { id: 6, name: "كماشة عالمية",           code: "KMA-UNI",    category: "أدوات",          stock: 0,    unit: "قطعة", color: "#4ECDC4" },
  { id: 7, name: "كابل كهربائي 2.5mm",    code: "KBL-25",     category: "كهرباء",         stock: 500,  unit: "متر",  color: "#FFE66D" },
  { id: 8, name: "كابل كهربائي 1.5mm",    code: "KBL-15",     category: "كهرباء",         stock: 800,  unit: "متر",  color: "#FFE66D" },
  { id: 9, name: "شريط عازل كهربائي",     code: "SHR-EL",     category: "كهرباء",         stock: 200,  unit: "لفة",  color: "#FFE66D" },
  { id: 10, name: "أنبوب PVC 2 بوصة",    code: "ANB-PVC-2",  category: "سباكة",          stock: 100,  unit: "متر",  color: "#A8E6CF" },
  { id: 11, name: "أنبوب PVC 1 بوصة",    code: "ANB-PVC-1",  category: "سباكة",          stock: 150,  unit: "متر",  color: "#A8E6CF" },
  { id: 12, name: "صنبور مياه",            code: "SNB-MYA",    category: "سباكة",          stock: 25,   unit: "قطعة", color: "#A8E6CF" },
  { id: 13, name: "دهان أبيض 4L",         code: "DHN-WHT-4",  category: "دهانات",         stock: 80,   unit: "علبة", color: "#DDA0DD" },
  { id: 14, name: "دهان رمادي 4L",        code: "DHN-GRY-4",  category: "دهانات",         stock: 60,   unit: "علبة", color: "#DDA0DD" },
  { id: 15, name: "شريط عازل حراري",      code: "SHR-HRR",    category: "مواد عزل",       stock: 120,  unit: "لفة",  color: "#B0C4DE" },
  { id: 16, name: "لوح خشبي 2×4",        code: "LWH-2X4",    category: "معدات",          stock: 200,  unit: "قطعة", color: "#F4A460" },
];

const mockCustomers = [
  { id: 1, name: "شركة الرياض للمقاولات" },
  { id: 2, name: "مؤسسة البناء الحديث" },
  { id: 3, name: "شركة الإنشاءات المتحدة" },
  { id: 4, name: "مجموعة الخليج للتطوير" },
  { id: 5, name: "شركة الأفق للتجارة" },
];

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, cartItem, onAdd, onEdit, onRemove }) {
  const inCart = !!cartItem;
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 50;

  return (
    <Card
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: inCart ? "2px solid #17c1e8" : "1px solid #e9ecef",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      {/* Product Color Block (placeholder for image) */}
      <SoftBox
        sx={{
          width: "100%",
          height: 70,
          borderRadius: 2,
          background: outOfStock
            ? "#e0e0e0"
            : `linear-gradient(135deg, ${product.color}88, ${product.color})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
          position: "relative",
        }}
      >
        <Inventory2Icon sx={{ color: "#fff", fontSize: 28, opacity: 0.8 }} />
        {inCart && (
          <SoftBox
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              background: "#17c1e8",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckIcon sx={{ color: "#fff", fontSize: 14 }} />
          </SoftBox>
        )}
      </SoftBox>

      {/* Info */}
      <SoftTypography variant="button" fontWeight="bold" lineHeight={1.3} mb={0.5}>
        {product.name}
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" mb={1}>
        {product.code}
      </SoftTypography>

      {/* Stock Badge */}
      <SoftBox mb={1.5}>
        {outOfStock ? (
          <Chip label="نفذ المخزون" size="small" color="error" sx={{ height: 20, fontSize: 11 }} />
        ) : lowStock ? (
          <Chip label={`مخزون منخفض: ${product.stock}`} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
        ) : (
          <Chip label={`${product.stock} ${product.unit}`} size="small" color="success" sx={{ height: 20, fontSize: 11 }} />
        )}
      </SoftBox>

      {/* Cart Actions */}
      {inCart ? (
        <SoftBox display="flex" gap={1} mt="auto">
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            fullWidth
            startIcon={<EditIcon />}
            onClick={() => onEdit(product)}
          >
            {cartItem.qty} {product.unit}
          </SoftButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onRemove(product.id)}
            sx={{ border: "1px solid #ea0606", borderRadius: 1 }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </SoftBox>
      ) : (
        <SoftButton
          variant="gradient"
          color={outOfStock ? "secondary" : "info"}
          size="small"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => !outOfStock && onAdd(product)}
          disabled={outOfStock}
          sx={{ mt: "auto" }}
        >
          {outOfStock ? "غير متوفر" : "إضافة"}
        </SoftButton>
      )}
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function NewOrder() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState({}); // { productId: { product, qty, willShip } }
  const [qtyDialog, setQtyDialog] = useState(null); // { product, qty }
  const [qtyInput, setQtyInput] = useState("1");
  const [replaceQtyOnNextDigit, setReplaceQtyOnNextDigit] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [customers, setCustomers] = useState(mockCustomers);
  const [successDialog, setSuccessDialog] = useState(false);

  const normalizeQty = (value) => {
    const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");

    if (!digitsOnly) return "1";

    const normalized = String(Math.max(1, Number(digitsOnly)));

    return normalized;
  };

  const parsedQty = Math.max(1, Number(qtyInput || "1"));

  const keypadButtons = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["clear", "0", "backspace"],
  ];

  const filteredProducts = mockProducts.filter((p) => {
    const matchCat = category === "الكل" || p.category === category;
    const matchSearch = p.name.includes(search) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartItems = Object.values(cart);
  const cartCount = cartItems.length;

  const openAddDialog = (product) => {
    setQtyDialog({ product, isEdit: false });
    setQtyInput("1");
    setReplaceQtyOnNextDigit(true);
  };

  const openEditDialog = (product) => {
    setQtyDialog({ product, isEdit: true });
    setQtyInput(String(cart[product.id]?.qty || 1));
    setReplaceQtyOnNextDigit(true);
  };

  const confirmQty = () => {
    if (!qtyDialog) return;
    setCart((prev) => ({
      ...prev,
      [qtyDialog.product.id]: { product: qtyDialog.product, qty: parsedQty, willShip: true },
    }));
    setQtyDialog(null);
    setReplaceQtyOnNextDigit(true);
  };

  const handleQtyChange = (value) => {
    const digitsOnly = value.replace(/[^\d]/g, "");
    setQtyInput(digitsOnly);
    setReplaceQtyOnNextDigit(false);
  };

  const handleQtyBlur = () => {
    setQtyInput(normalizeQty(qtyInput));
  };

  const handleKeypadPress = (key) => {
    if (key === "clear") {
      setQtyInput("1");
      setReplaceQtyOnNextDigit(true);
      return;
    }

    if (key === "backspace") {
      if (replaceQtyOnNextDigit) {
        setQtyInput("1");
        setReplaceQtyOnNextDigit(true);
        return;
      }

      setQtyInput((prev) => {
        const current = prev || "1";

        if (current.length <= 1) {
          return "1";
        }

        return current.slice(0, -1);
      });
      setReplaceQtyOnNextDigit(false);
      return;
    }

    setQtyInput((prev) => {
      const current = prev || "1";

      if (replaceQtyOnNextDigit || current === "0") {
        return key;
      }

      if (current.length >= 6) {
        return current;
      }

      return `${current}${key}`;
    });
    setReplaceQtyOnNextDigit(false);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const toggleWillShip = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], willShip: !prev[productId].willShip },
    }));
  };

  const handleSubmit = (isDraft) => {
    setSuccessDialog(isDraft ? "draft" : "submitted");
  };

  const addNewCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCust = { id: customers.length + 1, name: newCustomerName.trim() };
    setCustomers((prev) => [...prev, newCust]);
    setCustomer(newCust);
    setNewCustomerName("");
    setNewCustomerDialog(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── Page Header ── */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/orders")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">
              إنشاء طلبية جديدة
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              اختر الأصناف وأضفها للسلة
            </SoftTypography>
          </SoftBox>
          <Badge badgeContent={cartCount} color="info">
            <ShoppingCartIcon />
          </Badge>
        </SoftBox>

        <Grid container spacing={3}>
          {/* ─────────────────────────────── LEFT: Products Panel ── */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ mb: 2, p: 2 }}>
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="بحث سريع عن الصنف باسمه أو كوده..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              {/* Category Tabs */}
              <SoftBox display="flex" gap={1} flexWrap="wrap">
                {categories.map((cat) => (
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
            </Card>

            {/* Product Grid */}
            <Grid container spacing={2}>
              {filteredProducts.length === 0 ? (
                <Grid item xs={12}>
                  <SoftBox textAlign="center" py={6}>
                    <SoftTypography variant="body2" color="text">
                      لا توجد أصناف مطابقة
                    </SoftTypography>
                  </SoftBox>
                </Grid>
              ) : (
                filteredProducts.map((product) => (
                  <Grid item xs={6} sm={4} md={3} key={product.id}>
                    <ProductCard
                      product={product}
                      cartItem={cart[product.id]}
                      onAdd={openAddDialog}
                      onEdit={openEditDialog}
                      onRemove={removeFromCart}
                    />
                  </Grid>
                ))
              )}
            </Grid>
          </Grid>

          {/* ──────────────────────────────── RIGHT: Cart Panel ── */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 3, position: "sticky", top: 20 }}>
              <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <ShoppingCartIcon sx={{ color: "#17c1e8" }} />
                  <SoftTypography variant="h6" fontWeight="bold">
                    السلة
                  </SoftTypography>
                </SoftBox>
                <SoftBadge
                  variant="gradient"
                  color="info"
                  size="sm"
                  badgeContent={`${cartCount} صنف`}
                  container
                />
              </SoftBox>

              {/* Customer */}
              <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
                الزبون *
              </SoftTypography>
              <SoftBox display="flex" gap={1} mb={2}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(o) => o.name}
                  value={customer}
                  onChange={(_, v) => setCustomer(v)}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="اختر الزبون..." />
                  )}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Tooltip title="إضافة زبون جديد">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setNewCustomerDialog(true)}
                    sx={{ border: "1px solid #e9ecef", borderRadius: 1 }}
                  >
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </SoftBox>

              <Divider sx={{ my: 2 }} />

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <SoftBox textAlign="center" py={4}>
                  <ShoppingCartIcon sx={{ color: "#e0e0e0", fontSize: 48 }} />
                  <SoftTypography variant="body2" color="secondary" mt={1}>
                    السلة فارغة
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    اختر أصنافاً من القائمة
                  </SoftTypography>
                </SoftBox>
              ) : (
                <SoftBox maxHeight={350} sx={{ overflowY: "auto" }}>
                  {cartItems.map(({ product, qty, willShip }) => (
                    <SoftBox key={product.id} mb={1.5}>
                      <SoftBox
                        p={1.5}
                        sx={{
                          background: "#f8f9fa",
                          borderRadius: 2,
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                          <SoftBox flex={1}>
                            <SoftTypography variant="caption" fontWeight="bold" lineHeight={1.3}>
                              {product.name}
                            </SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">
                              {product.code}
                            </SoftTypography>
                          </SoftBox>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCart(product.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </SoftBox>

                        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                          {/* Qty Controls */}
                          <SoftBox display="flex" alignItems="center" gap={0.5}>
                            <IconButton
                              size="small"
                              onClick={() => setCart(prev => ({
                                ...prev,
                                [product.id]: { ...prev[product.id], qty: Math.max(1, qty - 1) }
                              }))}
                              sx={{ border: "1px solid #e0e0e0", p: 0.3 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <SoftTypography variant="button" fontWeight="bold" minWidth={40} textAlign="center">
                              {qty}
                            </SoftTypography>
                            <IconButton
                              size="small"
                              onClick={() => setCart(prev => ({
                                ...prev,
                                [product.id]: { ...prev[product.id], qty: qty + 1 }
                              }))}
                              sx={{ border: "1px solid #e0e0e0", p: 0.3 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <SoftTypography variant="caption" color="secondary" ml={0.5}>
                              {product.unit}
                            </SoftTypography>
                          </SoftBox>

                          {/* Ship Toggle */}
                          <Tooltip title={willShip ? "سيتم الشحن" : "استلام مباشر"}>
                            <Chip
                              size="small"
                              icon={<LocalShippingIcon fontSize="small" />}
                              label={willShip ? "شحن" : "مباشر"}
                              color={willShip ? "info" : "default"}
                              onClick={() => toggleWillShip(product.id)}
                              sx={{ cursor: "pointer", height: 22, fontSize: 10 }}
                            />
                          </Tooltip>
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>
                  ))}
                </SoftBox>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Notes */}
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                label="ملاحظات"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* Summary */}
              {cartItems.length > 0 && (
                <SoftBox mb={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftTypography variant="caption" color="text">إجمالي الأصناف:</SoftTypography>
                    <SoftTypography variant="caption" fontWeight="bold">{cartItems.length}</SoftTypography>
                  </SoftBox>
                  <SoftBox display="flex" justifyContent="space-between">
                    <SoftTypography variant="caption" color="text">إجمالي الوحدات:</SoftTypography>
                    <SoftTypography variant="caption" fontWeight="bold">
                      {cartItems.reduce((s, i) => s + i.qty, 0)}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              )}

              {/* Action Buttons */}
              <SoftBox display="flex" flexDirection="column" gap={1}>
                <SoftButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  startIcon={<SendIcon />}
                  disabled={cartItems.length === 0 || !customer}
                  onClick={() => handleSubmit(false)}
                >
                  إرسال الطلبية للإدارة
                </SoftButton>
                <SoftButton
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<SaveIcon />}
                  disabled={cartItems.length === 0}
                  onClick={() => handleSubmit(true)}
                >
                  حفظ كمسودة
                </SoftButton>
              </SoftBox>

              {!customer && cartItems.length > 0 && (
                <SoftTypography variant="caption" color="error" textAlign="center" display="block" mt={1}>
                  * يجب اختيار الزبون أولاً
                </SoftTypography>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* ── Qty Dialog ── */}
      <Dialog open={!!qtyDialog} onClose={() => setQtyDialog(null)} maxWidth="xs" fullWidth>
        {qtyDialog && (
          <>
            <DialogTitle>
              {qtyDialog.isEdit ? "تعديل الكمية" : "إضافة للسلة"}
            </DialogTitle>
            <DialogContent>
              <SoftTypography variant="button" fontWeight="bold" display="block" mb={2}>
                {qtyDialog.product.name}
              </SoftTypography>
              <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2} my={2}>
                <IconButton
                  onClick={() => {
                    setQtyInput(String(Math.max(1, parsedQty - 1)));
                    setReplaceQtyOnNextDigit(false);
                  }}
                  sx={{ border: "2px solid #17c1e8", p: 1 }}
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={qtyInput}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  onBlur={handleQtyBlur}
                  autoFocus
                  variant="outlined"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    style: {
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: "bold",
                      width: 120,
                      padding: "10px 0",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: "#fff",
                    },
                  }}
                />
                <IconButton
                  onClick={() => {
                    setQtyInput(String(parsedQty + 1));
                    setReplaceQtyOnNextDigit(false);
                  }}
                  sx={{ border: "2px solid #17c1e8", p: 1 }}
                >
                  <AddIcon />
                </IconButton>
              </SoftBox>
              <SoftBox
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 1.2,
                }}
              >
                {keypadButtons.flat().map((key) => {
                  const isAction = key === "clear" || key === "backspace";
                  const isClear = key === "clear";
                  const label = key === "clear" ? "مسح" : key;

                  return (
                    <SoftButton
                      key={key}
                      variant={isAction ? "outlined" : "gradient"}
                      color={isClear ? "secondary" : "info"}
                      onClick={() => handleKeypadPress(key)}
                      sx={{
                        minHeight: 52,
                        borderRadius: 2,
                        fontSize: key.length === 1 ? "1rem" : "0.8rem",
                        fontWeight: "bold",
                        boxShadow: isAction ? "none" : "0 8px 18px rgba(23, 193, 232, 0.18)",
                      }}
                    >
                      {key === "backspace" ? <BackspaceOutlinedIcon fontSize="small" /> : label}
                    </SoftButton>
                  );
                })}
              </SoftBox>
              <SoftTypography variant="caption" color="secondary" textAlign="center" display="block">
                الوحدة: {qtyDialog.product.unit} | المخزون المتاح: {qtyDialog.product.stock}
              </SoftTypography>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setQtyDialog(null)}>
                إلغاء
              </SoftButton>
              <SoftButton variant="gradient" color="info" size="small" onClick={confirmQty}>
                {qtyDialog.isEdit ? "تحديث" : "إضافة للسلة"}
              </SoftButton>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── New Customer Dialog ── */}
      <Dialog open={newCustomerDialog} onClose={() => setNewCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة زبون جديد</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="اسم الزبون *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="رقم الهاتف" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="العنوان" size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setNewCustomerDialog(false)}>
            إلغاء
          </SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={addNewCustomer}>
            إضافة وتحديد
          </SoftButton>
        </DialogActions>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={!!successDialog} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: "center", py: 5 }}>
          <SoftBox
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: successDialog === "submitted" ? "linear-gradient(195deg,#66BB6A,#43A047)" : "linear-gradient(195deg,#42424a,#191919)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            {successDialog === "submitted" ? (
              <SendIcon sx={{ color: "#fff", fontSize: 32 }} />
            ) : (
              <SaveIcon sx={{ color: "#fff", fontSize: 32 }} />
            )}
          </SoftBox>
          <SoftTypography variant="h5" fontWeight="bold" mb={1}>
            {successDialog === "submitted" ? "تم إرسال الطلبية!" : "تم حفظ المسودة!"}
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {successDialog === "submitted"
              ? "تم إرسال الطلبية للإدارة وستتلقى إشعاراً عند مراجعتها."
              : "تم حفظ الطلبية كمسودة، يمكنك إكمالها لاحقاً."}
          </SoftTypography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 2 }}>
          <SoftButton variant="gradient" color="info" onClick={() => navigate("/orders")}>
            العودة للطلبيات
          </SoftButton>
          <SoftButton variant="outlined" color="secondary" onClick={() => { setSuccessDialog(false); setCart({}); setCustomer(null); }}>
            إنشاء طلبية جديدة
          </SoftButton>
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default NewOrder;
