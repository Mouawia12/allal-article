/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import SendIcon from "@mui/icons-material/Send";
import SaveIcon from "@mui/icons-material/Save";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import GridViewIcon from "@mui/icons-material/GridView";
import ListIcon from "@mui/icons-material/List";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import TuneIcon from "@mui/icons-material/Tune";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";
import useProductFavorites from "hooks/useProductFavorites";
import { CustomerDetailDialog } from "layouts/customers";
const formatDZD = (v) => Number(v || 0).toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const getPriceListsFor = () => [];
const resolveProductPrice = (product) => ({ finalPrice: product?.price || product?.sellingPrice || 0, listName: "—" });
import { ordersApi, customersApi, productsApi, usersApi } from "services";
import demoBoltsImage from "assets/images/products/demo-bolts.jpg";
import demoToolsImage from "assets/images/products/demo-tools.jpg";
import demoCablesImage from "assets/images/products/demo-cables.jpg";
import demoBuildingSuppliesImage from "assets/images/products/demo-building-supplies.jpg";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const categories = ["الكل", "مسامير وبراغي", "أدوات", "كهرباء", "سباكة", "دهانات", "مواد عزل", "معدات"];
const favoriteCategory = "المفضلة";
const categoryFilters = ["الكل", favoriteCategory, ...categories.filter((cat) => cat !== "الكل")];


// حساب عدد الكراطين/العلب من الكمية
function calcPackages(qty, product) {
  if (!product.unitsPerPackage || product.unitsPerPackage <= 0) return null;
  return Math.ceil(qty / product.unitsPerPackage);
}

export const mockCustomers = [];

export const emptyNewCustomerForm = {
  name: "",
  phone: "",
  phone2: "",
  wilaya: "",
  address: "",
  email: "",
  shippingRoute: "",
  openingBalance: "",
  salesperson: "",
};

export function CustomerInfoDialog({ customer, onClose, onUpdate = () => {}, onEdit = () => {}, users: providedUsers }) {
  const [users, setUsers] = useState(providedUsers || []);

  useEffect(() => {
    if (providedUsers) {
      setUsers(providedUsers);
      return;
    }

    if (!customer) {
      setUsers([]);
      return;
    }

    usersApi.list({ size: 200 })
      .then((r) => setUsers(r.data?.content ?? r.data ?? []))
      .catch(() => setUsers([]));
  }, [customer?.id, providedUsers]);

  return (
    <CustomerDetailDialog
      customer={customer}
      onClose={onClose}
      onUpdate={onUpdate}
      onEdit={onEdit}
      users={users}
    />
  );
}

function getProductGridColumns() {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth < 600) {
    return 2;
  }

  if (window.innerWidth < 900) {
    return 3;
  }

  return 4;
}

function isTypingContext(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, button, a, [contenteditable='true'], [role='button'], [role='textbox'], [role='combobox'], [role='listbox']"
    )
  );
}

function getOrderProductStatus(product) {
  if (product.stock === 0) {
    return { label: "نفذ المخزون", color: "error" };
  }

  if (product.stock < 50) {
    return { label: "مخزون منخفض", color: "warning" };
  }

  return { label: "متوفر", color: "success" };
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  product,
  cartItem,
  priceInfo,
  isFavorite,
  onToggleFavorite,
  onAdd,
  onEdit,
  onRemove,
  selected,
  onSelect,
  cardRef,
}) {
  const inCart = !!cartItem;
  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock < 50;

  return (
    <Card
      ref={cardRef}
      onClick={onSelect}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: inCart ? "2px solid #17c1e8" : "1px solid #e9ecef",
        outline: selected ? "3px solid rgba(23, 193, 232, 0.25)" : "none",
        outlineOffset: 0,
        boxShadow: selected
          ? "0 0 0 1px #17c1e8, 0 12px 28px rgba(23, 193, 232, 0.18)"
          : "none",
        transform: selected ? "translateY(-2px)" : "none",
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.1)", transform: "translateY(-2px)" },
      }}
    >
      {/* Product Color Block (placeholder for image) */}
      <SoftBox
        sx={{
          width: "100%",
          aspectRatio: "1 / 1",
          minHeight: 0,
          borderRadius: 2,
          background: outOfStock
            ? "#e0e0e0"
            : `linear-gradient(135deg, ${product.color}88, ${product.color})`,
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
          <Inventory2Icon sx={{ color: "#fff", fontSize: 28, opacity: 0.8 }} />
        )}
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
        <Tooltip title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(product.id);
            }}
            sx={{
              position: "absolute",
              top: 4,
              left: 4,
              width: 26,
              height: 26,
              background: "#fff",
              color: isFavorite ? "#fb8c00" : "#8392ab",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              "&:hover": { background: "#fff7e6", color: "#fb8c00" },
            }}
            aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            {isFavorite ? <StarIcon sx={{ fontSize: 17 }} /> : <StarBorderIcon sx={{ fontSize: 17 }} />}
          </IconButton>
        </Tooltip>
      </SoftBox>

      {/* Info */}
      <SoftTypography variant="button" fontWeight="bold" lineHeight={1.3} mb={0.5}>
        {product.name}
      </SoftTypography>
      <SoftBox display="flex" alignItems="center" gap={0.5} mb={1} flexWrap="wrap">
        <SoftTypography variant="caption" color="secondary">
          {product.code}
        </SoftTypography>
        {isFavorite && (
          <Chip label="مفضل" size="small" color="warning" sx={{ height: 18, fontSize: 10 }} />
        )}
      </SoftBox>

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

      <SoftBox mb={1.5} p={1} sx={{ background: "#f8fbff", border: "1px solid #d7ebff", borderRadius: 1.5 }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" gap={1}>
          <SoftTypography variant="caption" color="secondary">السعر</SoftTypography>
          <SoftTypography variant="caption" fontWeight="bold" color="info">
            {formatDZD(priceInfo.unitPrice)} دج
          </SoftTypography>
        </SoftBox>
        <SoftTypography variant="caption" color="secondary" display="block">
          {priceInfo.sourceLabel}
        </SoftTypography>
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

function ProductListRow({
  product,
  cartItem,
  priceInfo,
  isFavorite,
  selected,
  rowRef,
  onSelect,
  onToggleFavorite,
  onAdd,
  onEdit,
  onRemove,
}) {
  const inCart = !!cartItem;
  const outOfStock = product.stock === 0;
  const status = getOrderProductStatus(product);

  return (
    <tr
      ref={rowRef}
      style={{
        borderBottom: "1px solid #eef2f7",
        background: selected ? "#eef9ff" : "#fff",
        cursor: "pointer",
        outline: selected ? "2px solid rgba(23, 193, 232, 0.35)" : "none",
        outlineOffset: -2,
      }}
      onClick={onSelect}
      onMouseEnter={(event) => {
        if (!selected) {
          event.currentTarget.style.background = "#f8fbff";
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = selected ? "#eef9ff" : "#fff";
      }}
    >
      <td style={{ padding: "12px 14px" }}>
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <SoftBox
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1.5,
              background: outOfStock
                ? "#d7dbe3"
                : `linear-gradient(135deg, ${product.color}88, ${product.color})`,
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
              <Inventory2Icon sx={{ color: "#fff", fontSize: 18, opacity: 0.9 }} />
            )}
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold">
              {product.name}
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              {product.code} · {product.category}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" fontWeight="bold" color={outOfStock ? "error" : "success"}>
          {product.stock}
        </SoftTypography>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" color="secondary">
          {product.unit}
        </SoftTypography>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
        <SoftTypography variant="caption" fontWeight="bold" color="info">
          {formatDZD(priceInfo.unitPrice)} دج
        </SoftTypography>
        <SoftTypography variant="caption" color="secondary" display="block">
          {priceInfo.sourceLabel}
        </SoftTypography>
      </td>
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        <SoftBadge variant="gradient" color={status.color} size="xs" badgeContent={status.label} container />
      </td>
      <td style={{ padding: "12px 14px", textAlign: "center", whiteSpace: "nowrap" }}>
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
      <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
        {inCart ? (
          <SoftBox display="flex" gap={1} justifyContent="flex-end">
            <SoftButton
              variant="outlined"
              color="info"
              size="small"
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
            startIcon={<AddIcon />}
            onClick={() => !outOfStock && onAdd(product)}
            disabled={outOfStock}
          >
            {outOfStock ? "غير متوفر" : "إضافة"}
          </SoftButton>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const productCardRefs = useRef({});
  const searchInputRef = useRef(null);

  const [view, setView] = useState("grid");
  const [category, setCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const salesPriceLists = getPriceListsFor("sales");
  const [selectedPriceListId, setSelectedPriceListId] = useState("MAIN");
  const [cart, setCart] = useState({}); // { productId: { product, qty, willShip } }
  const [apiProducts, setApiProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [qtyDialog, setQtyDialog] = useState(null); // { product, qty }
  const [qtyInput, setQtyInput] = useState("1");
  const [replaceQtyOnNextDigit, setReplaceQtyOnNextDigit] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState(emptyNewCustomerForm);
  const [customers, setCustomers] = useState([]);
  const [successDialog, setSuccessDialog] = useState(false);
  const [customerInfoOpen, setCustomerInfoOpen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const { favoriteCount, isFavorite, toggleFavorite } = useProductFavorites();

  useEffect(() => {
    productsApi.list().then((r) => {
      const all = r.data?.content ?? r.data ?? [];
      const mapped = all.map((p) => ({
        id: p.id,
        name: p.name ?? p.nameAr,
        code: p.code ?? p.id,
        category: p.category ?? "عام",
        stock: p.stock ?? 0,
        unit: p.unit ?? "وحدة",
        color: "#17c1e8",
        weightPerUnit: p.weightPerUnit ?? 0,
        unitsPerPackage: p.unitsPerPackage ?? 1,
        packageUnit: p.packageUnit ?? "وحدة",
      }));
      setApiProducts(mapped);
      if (mapped.length) setSelectedProductId(mapped[0].id);
    }).catch(console.error);
    customersApi.list().then((r) => {
      const list = (r.data?.content ?? r.data ?? []).map((c) => ({
        totalAmount: 0, paidAmount: 0, ordersCount: 0, lastOrder: "—",
        salesperson: c.salespersonName || "—",
        wilaya: c.wilayaNameAr || "—",
        shippingRoute: c.shippingRoute || "—",
        orders: [], payments: [], ...c,
      }));
      setCustomers(list);
      const preselected = location.state?.customer;
      if (preselected) {
        const match = list.find((c) => c.id === preselected.id) ?? preselected;
        setCustomer(match);
      }
    }).catch(console.error);
  }, []);

  const normalizeQty = (value) => {
    const digitsOnly = String(value ?? "").replace(/[^\d]/g, "");

    if (!digitsOnly) return "1";

    const normalized = String(Math.max(1, Number(digitsOnly)));

    return normalized;
  };

  const parsedQty = Math.max(1, Number(normalizeQty(qtyInput)));

  const keypadButtons = [
    ["7", "8", "9"],
    ["4", "5", "6"],
    ["1", "2", "3"],
    ["clear", "0", "backspace"],
  ];

  const filteredProducts = apiProducts.filter((p) => {
    const matchCat =
      category === "الكل" ||
      (category === favoriteCategory && isFavorite(p.id)) ||
      p.category === category;
    const matchSearch = p.name.includes(search) || p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartItems = Object.values(cart);
  const cartCount = cartItems.length;
  const selectedPriceList = salesPriceLists.find((list) => list.id === selectedPriceListId) || salesPriceLists[0];
  const cartAmount = cartItems.reduce((sum, item) => {
    const priceInfo = resolveProductPrice(item.product, selectedPriceListId, "sales");
    return sum + Number(item.qty || 0) * priceInfo.unitPrice;
  }, 0);

  useEffect(() => {
    if (filteredProducts.length === 0) {
      setSelectedProductId(null);
      return;
    }

    const selectionStillVisible = filteredProducts.some((product) => product.id === selectedProductId);

    if (!selectionStillVisible) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  useEffect(() => {
    if (!selectedProductId || qtyDialog || newCustomerDialog || successDialog) {
      return;
    }

    productCardRefs.current[selectedProductId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [newCustomerDialog, qtyDialog, selectedProductId, successDialog]);

  const openAddDialog = (product) => {
    const step = product.hasVariants && product.variants?.length ? "variant" : "quantity";
    setQtyDialog({ product, isEdit: false, step, selectedVariant: null });
    setQtyInput("1");
    setReplaceQtyOnNextDigit(true);
  };

  const openEditDialog = (product) => {
    setQtyDialog({ product, isEdit: true, step: "quantity", selectedVariant: cart[product.id]?.variant ?? null });
    setQtyInput(String(cart[product.id]?.qty || 1));
    setReplaceQtyOnNextDigit(true);
  };

  const confirmQty = (rawQty = qtyInput) => {
    if (!qtyDialog) return;
    if (qtyDialog.step === "variant") return; // should not be called before variant is picked
    if (qtyDialog.product.hasVariants && !qtyDialog.selectedVariant) return;
    const nextQty = Math.max(1, Number(normalizeQty(rawQty)));
    const cartKey = qtyDialog.product.hasVariants
      ? `${qtyDialog.product.id}__${qtyDialog.selectedVariant.id}`
      : qtyDialog.product.id;
    setCart((prev) => ({
      ...prev,
      [cartKey]: { product: qtyDialog.product, qty: nextQty, willShip: true, variant: qtyDialog.selectedVariant },
    }));
    setQtyInput(String(nextQty));
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

  const handleQtyKeyDown = (event) => {
    if (/^\d$/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (replaceQtyOnNextDigit) {
        event.preventDefault();
        setQtyInput(event.key);
        setReplaceQtyOnNextDigit(false);
      }
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    confirmQty(event.currentTarget.value);
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
    const payload = {
      customerId: customer?.id ?? null,
      notes: notes || null,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        qty: Number(item.qty),
        customerNote: item.notes || null,
      })),
    };
    ordersApi.create(payload)
      .then((r) => {
        const newId = r.data?.id;
        if (!isDraft && newId) {
          return ordersApi.submit(newId).then(() => newId);
        }
        return newId;
      })
      .then(() => setSuccessDialog(isDraft ? "draft" : "submitted"))
      .catch(console.error);
  };

  const updateNewCustomerField = (field, value) => {
    setNewCustomerForm((current) => ({ ...current, [field]: value }));
  };

  const addNewCustomer = () => {
    const name = newCustomerForm.name.trim();
    const phone = newCustomerForm.phone.trim();
    const wilaya = newCustomerForm.wilaya.trim();

    if (!name || !phone || !wilaya) return;

    const apiData = {
      name,
      phone,
      phone2: newCustomerForm.phone2.trim(),
      email: newCustomerForm.email.trim(),
      wilaya,
      address: newCustomerForm.address.trim(),
      salesperson: newCustomerForm.salesperson.trim() || "غير محدد",
      shippingRoute: newCustomerForm.shippingRoute.trim() || `${wilaya} - عام`,
      openingBalance: Math.max(0, Number(newCustomerForm.openingBalance) || 0),
    };
    customersApi.create(apiData)
      .then((r) => {
        const newCust = { orders: [], payments: [], totalAmount: 0, paidAmount: 0, ordersCount: 0, lastOrder: "—", ...r.data };
        setCustomers((prev) => [...prev, newCust]);
        setCustomer(newCust);
        setNewCustomerForm(emptyNewCustomerForm);
        setNewCustomerDialog(false);
      })
      .catch(console.error);
  };

  const focusSearchInput = () => {
    const searchInputElement =
      searchInputRef.current?.querySelector?.("input") ?? searchInputRef.current;

    searchInputElement?.focus();
    searchInputElement?.select?.();
  };

  useEffect(() => {
    const handleProductGridKeyboard = (event) => {
      const typingContext = isTypingContext(event.target);
      const isSlashSearchShortcut =
        event.code === "Slash" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey;
      const isSearchShortcut =
        (event.code === "F2" && (event.ctrlKey || event.metaKey)) ||
        (event.code === "KeyK" && (event.ctrlKey || event.metaKey)) ||
        (event.code === "KeyS" && event.altKey && !event.ctrlKey && !event.metaKey) ||
        (event.code === "KeyF" && event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) ||
        isSlashSearchShortcut;

      if (isSearchShortcut && !typingContext) {
        event.preventDefault();
        focusSearchInput();
        return;
      }

      if (
        qtyDialog ||
        newCustomerDialog ||
        successDialog ||
        filteredProducts.length === 0 ||
        typingContext
      ) {
        return;
      }

      const currentIndex = Math.max(
        0,
        filteredProducts.findIndex((product) => product.id === selectedProductId)
      );
      const columns = view === "grid" ? getProductGridColumns() : 1;
      const isRtl = document.documentElement.dir === "rtl";
      let nextIndex = currentIndex;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          nextIndex = isRtl
            ? Math.min(filteredProducts.length - 1, currentIndex + 1)
            : Math.max(0, currentIndex - 1);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowRight":
          event.preventDefault();
          nextIndex = isRtl
            ? Math.max(0, currentIndex - 1)
            : Math.min(filteredProducts.length - 1, currentIndex + 1);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowUp":
          event.preventDefault();
          nextIndex = Math.max(0, currentIndex - columns);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "ArrowDown":
          event.preventDefault();
          nextIndex = Math.min(filteredProducts.length - 1, currentIndex + columns);
          setSelectedProductId(filteredProducts[nextIndex].id);
          return;
        case "Enter": {
          event.preventDefault();
          const selectedProduct = filteredProducts[currentIndex];

          if (!selectedProduct || selectedProduct.stock === 0) {
            return;
          }

          if (cart[selectedProduct.id]) {
            openEditDialog(selectedProduct);
            return;
          }

          openAddDialog(selectedProduct);
          return;
        }
        default:
      }
    };

    document.addEventListener("keydown", handleProductGridKeyboard, true);

    return () => {
      document.removeEventListener("keydown", handleProductGridKeyboard, true);
    };
  }, [cart, filteredProducts, newCustomerDialog, qtyDialog, selectedProductId, successDialog, view]);

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
                inputRef={searchInputRef}
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
                {categoryFilters.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat === favoriteCategory ? `${cat} (${favoriteCount})` : cat}
                    size="small"
                    onClick={() => setCategory(cat)}
                    color={category === cat ? "info" : "default"}
                    variant={category === cat ? "filled" : "outlined"}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </SoftBox>
              <SoftBox mt={2} display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                <SoftTypography variant="caption" color="text">
                  {filteredProducts.length} صنف
                </SoftTypography>
                <ToggleButtonGroup value={view} exclusive onChange={(_, nextView) => nextView && setView(nextView)} size="small">
                  <ToggleButton value="grid">
                    <GridViewIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="list">
                    <ListIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </SoftBox>
            </Card>

            {/* Product Grid */}
            <SoftBox
              mb={1.5}
              px={0.5}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={2}
            >
              <SoftTypography variant="caption" color="info" fontWeight="medium">
                استخدم الأسهم للتنقل بين الأصناف و Enter لفتح إضافة الكمية و / أو Option+Shift+F للبحث
              </SoftTypography>
              {selectedProductId && (
                <SoftTypography variant="caption" color="secondary">
                  الصنف المحدد: {filteredProducts.find((product) => product.id === selectedProductId)?.name}
                </SoftTypography>
              )}
            </SoftBox>
            {view === "grid" ? (
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
                        priceInfo={resolveProductPrice(product, selectedPriceListId, "sales")}
                        isFavorite={isFavorite(product.id)}
                        selected={selectedProductId === product.id}
                        onSelect={() => setSelectedProductId(product.id)}
                        cardRef={(node) => {
                          if (node) {
                            productCardRefs.current[product.id] = node;
                            return;
                          }

                          delete productCardRefs.current[product.id];
                        }}
                        onToggleFavorite={toggleFavorite}
                        onAdd={openAddDialog}
                        onEdit={openEditDialog}
                        onRemove={removeFromCart}
                      />
                    </Grid>
                  ))
                )}
              </Grid>
            ) : (
              <Card>
                <SoftBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fbff" }}>
                        {["الصنف", "المخزون", "الوحدة", "السعر", "الحالة", "مفضلة", "الإجراء"].map((header) => (
                          <th
                            key={header}
                            style={{
                              padding: "12px 14px",
                              textAlign: header === "الإجراء" ? "left" : "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <SoftTypography variant="caption" fontWeight="bold" color="secondary">
                              {header}
                            </SoftTypography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: 32 }}>
                            <SoftTypography variant="body2" color="text">
                              لا توجد أصناف مطابقة
                            </SoftTypography>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <ProductListRow
                            key={product.id}
                            product={product}
                            cartItem={cart[product.id]}
                            priceInfo={resolveProductPrice(product, selectedPriceListId, "sales")}
                            isFavorite={isFavorite(product.id)}
                            selected={selectedProductId === product.id}
                            onSelect={() => setSelectedProductId(product.id)}
                            rowRef={(node) => {
                              if (node) {
                                productCardRefs.current[product.id] = node;
                                return;
                              }

                              delete productCardRefs.current[product.id];
                            }}
                            onToggleFavorite={toggleFavorite}
                            onAdd={openAddDialog}
                            onEdit={openEditDialog}
                            onRemove={removeFromCart}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </SoftBox>
              </Card>
            )}
          </Grid>

          {/* ──────────────────────────────── RIGHT: Cart Panel ── */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ position: "sticky", top: 20, overflow: "hidden" }}>

              {/* ── Header ── */}
              <SoftBox
                display="flex" alignItems="center" justifyContent="space-between"
                px={2.5} py={1.75}
                sx={{ borderBottom: "1px solid #f0f2f5" }}
              >
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <ShoppingCartIcon sx={{ color: "#17c1e8", fontSize: 20 }} />
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ fontSize: "1rem" }}>
                    السلة
                  </SoftTypography>
                  {cartCount > 0 && (
                    <SoftBox
                      sx={{
                        background: "#17c1e8",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 20, height: 20,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: "bold",
                      }}
                    >
                      {cartCount}
                    </SoftBox>
                  )}
                </SoftBox>
                {cartCount > 0 && (
                  <SoftTypography variant="caption" fontWeight="bold" color="info">
                    {formatDZD(cartAmount)} دج
                  </SoftTypography>
                )}
              </SoftBox>

              <SoftBox px={2.5} pt={2} pb={1.5}>
                {/* ── Customer + actions ── */}
                <SoftBox display="flex" gap={1} mb={1}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(o) => o.name}
                    value={customer}
                    onChange={(_, v) => {
                      setCustomer(v);
                      // auto-apply customer's linked price list, fallback to MAIN
                      setSelectedPriceListId(v?.defaultPriceListId || "MAIN");
                    }}
                    renderInput={(params) => (
                      <TextField {...params} size="small" label="الزبون *" placeholder="اختر الزبون..." />
                    )}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <Tooltip title={customer ? "عرض بيانات الزبون" : "إضافة زبون جديد"}>
                    <IconButton
                      size="small"
                      onClick={() => customer ? setCustomerInfoOpen(true) : setNewCustomerDialog(true)}
                      sx={{
                        border: `1px solid ${customer ? "#17c1e8" : "#e9ecef"}`,
                        borderRadius: 1,
                        color: customer ? "#17c1e8" : "inherit",
                        transition: "all 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      {customer ? <VisibilityIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="الإعدادات المتقدمة">
                    <IconButton
                      size="small"
                      onClick={(e) => setSettingsAnchor(e.currentTarget)}
                      sx={{
                        border: "1px solid #e9ecef",
                        borderRadius: 1,
                        flexShrink: 0,
                        color: selectedPriceListId !== "MAIN" ? "#17c1e8" : "inherit",
                      }}
                    >
                      <TuneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </SoftBox>

                {/* Active price list indicator */}
                <SoftBox display="flex" alignItems="center" gap={0.5}>
                  <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 10 }}>
                    قائمة الأسعار:
                  </SoftTypography>
                  <Chip
                    label={selectedPriceList?.name || "السعر الرئيسي"}
                    size="small"
                    color={selectedPriceListId !== "MAIN" ? "info" : "default"}
                    variant={selectedPriceListId !== "MAIN" ? "filled" : "outlined"}
                    sx={{ height: 18, fontSize: 9, "& .MuiChip-label": { px: 0.75 } }}
                  />
                  {customer?.defaultPriceListId && customer.defaultPriceListId === selectedPriceListId && (
                    <SoftTypography variant="caption" color="success" sx={{ fontSize: 9 }}>
                      · تلقائي
                    </SoftTypography>
                  )}
                </SoftBox>

                {/* Settings menu */}
                <Menu
                  anchorEl={settingsAnchor}
                  open={Boolean(settingsAnchor)}
                  onClose={() => setSettingsAnchor(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                  PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
                >
                  <MenuItem
                    onClick={() => { setSettingsAnchor(null); setAdvancedSettingsOpen(true); }}
                    sx={{ gap: 1 }}
                  >
                    <ListItemIcon sx={{ minWidth: "auto" }}>
                      <TuneIcon fontSize="small" sx={{ color: "#17c1e8" }} />
                    </ListItemIcon>
                    <SoftTypography variant="caption" fontWeight="medium">
                      الإعدادات المتقدمة
                    </SoftTypography>
                  </MenuItem>
                </Menu>

                {/* Advanced Settings Dialog */}
                <Dialog
                  open={advancedSettingsOpen}
                  onClose={() => setAdvancedSettingsOpen(false)}
                  maxWidth="xs"
                  fullWidth
                >
                  <DialogTitle>
                    <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        <TuneIcon sx={{ color: "#17c1e8", fontSize: 20 }} />
                        <SoftTypography variant="h6" fontWeight="bold">الإعدادات المتقدمة</SoftTypography>
                      </SoftBox>
                      <IconButton size="small" onClick={() => setAdvancedSettingsOpen(false)}>
                        <CloseIcon />
                      </IconButton>
                    </SoftBox>
                  </DialogTitle>
                  <DialogContent dividers>
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary" display="block" mb={1}>
                      قائمة الأسعار
                    </SoftTypography>
                    <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
                      <InputLabel>قائمة الأسعار</InputLabel>
                      <Select
                        value={selectedPriceListId}
                        label="قائمة الأسعار"
                        onChange={(e) => setSelectedPriceListId(e.target.value)}
                      >
                        {salesPriceLists.map((list) => (
                          <MenuItem key={list.id} value={list.id}>
                            <SoftBox>
                              <SoftTypography variant="caption" fontWeight="medium" display="block">
                                {list.name}
                              </SoftTypography>
                            </SoftBox>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedPriceList?.description && (
                      <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                        {selectedPriceList.description}
                      </SoftTypography>
                    )}

                    {/* Customer link info */}
                    {customer && (
                      <SoftBox
                        p={1.5}
                        sx={{
                          background: customer.defaultPriceListId ? "#f0fff4" : "#f8f9fa",
                          borderRadius: 1.5,
                          border: `1px solid ${customer.defaultPriceListId ? "#66BB6A33" : "#e9ecef"}`,
                        }}
                      >
                        <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                          {customer.name}
                        </SoftTypography>
                        {customer.defaultPriceListId ? (
                          <SoftTypography variant="caption" color="success">
                            مربوط تلقائياً بـ «{salesPriceLists.find(l => l.id === customer.defaultPriceListId)?.name}»
                          </SoftTypography>
                        ) : (
                          <SoftTypography variant="caption" color="secondary">
                            لا توجد قائمة أسعار مرتبطة — يخضع للأسعار الرئيسية
                          </SoftTypography>
                        )}
                      </SoftBox>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ p: 2 }}>
                    <SoftButton
                      variant="gradient"
                      color="info"
                      size="small"
                      onClick={() => setAdvancedSettingsOpen(false)}
                    >
                      تأكيد
                    </SoftButton>
                  </DialogActions>
                </Dialog>
              </SoftBox>

              {/* ── Cart Items ── */}
              <SoftBox
                sx={{
                  borderTop: "1px solid #f0f2f5",
                  borderBottom: "1px solid #f0f2f5",
                  minHeight: 80,
                  maxHeight: 340,
                  overflowY: "auto",
                }}
              >
                {cartItems.length === 0 ? (
                  <SoftBox textAlign="center" py={4}>
                    <ShoppingCartIcon sx={{ color: "#e9ecef", fontSize: 40 }} />
                    <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
                      السلة فارغة — اختر أصنافاً من اليمين
                    </SoftTypography>
                  </SoftBox>
                ) : (
                  <SoftBox px={2.5} py={1}>
                    {cartItems.map(({ product, qty, willShip }, index) => {
                      const priceInfo = resolveProductPrice(product, selectedPriceListId, "sales");
                      const lineTotal = Number(qty || 0) * priceInfo.unitPrice;

                      return (
                        <SoftBox
                          key={product.id}
                          py={1.25}
                          sx={{
                            borderBottom: index < cartItems.length - 1 ? "1px solid #f4f6f8" : "none",
                            "&:hover .cart-delete-btn": { opacity: 1 },
                          }}
                        >
                          {/* Row 1: name · total · delete */}
                          <SoftBox display="flex" alignItems="center" justifyContent="space-between" gap={1}>
                            <SoftTypography
                              variant="caption"
                              fontWeight="bold"
                              sx={{ flex: 1, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              {product.name}
                            </SoftTypography>
                            <SoftBox display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                              <SoftTypography variant="caption" fontWeight="bold" color="info" sx={{ whiteSpace: "nowrap" }}>
                                {formatDZD(lineTotal)} دج
                              </SoftTypography>
                              <IconButton
                                size="small"
                                className="cart-delete-btn"
                                onClick={() => removeFromCart(product.id)}
                                sx={{
                                  p: 0.25,
                                  opacity: 0.3,
                                  transition: "opacity 0.15s",
                                  color: "#ea0606",
                                  "&:hover": { opacity: 1, background: "#fff5f5" },
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </SoftBox>
                          </SoftBox>

                          {/* Row 2: code · price · qty controls · ship */}
                          <SoftBox display="flex" alignItems="center" gap={0.75} mt={0.5} flexWrap="wrap">
                            <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 10, whiteSpace: "nowrap" }}>
                              {product.code} · {formatDZD(priceInfo.unitPrice)} دج
                            </SoftTypography>
                            <SoftBox display="flex" alignItems="center" gap={0.25} ml="auto">
                              <IconButton
                                size="small"
                                onClick={() => setCart(prev => ({
                                  ...prev,
                                  [product.id]: { ...prev[product.id], qty: Math.max(1, qty - 1) }
                                }))}
                                sx={{ border: "1px solid #e0e0e0", p: "2px", borderRadius: 0.75, minWidth: 20 }}
                              >
                                <RemoveIcon sx={{ fontSize: 11 }} />
                              </IconButton>
                              <SoftTypography
                                variant="caption"
                                fontWeight="bold"
                                sx={{ minWidth: 28, textAlign: "center", fontSize: 12, lineHeight: 1 }}
                              >
                                {qty}
                              </SoftTypography>
                              <IconButton
                                size="small"
                                onClick={() => setCart(prev => ({
                                  ...prev,
                                  [product.id]: { ...prev[product.id], qty: qty + 1 }
                                }))}
                                sx={{ border: "1px solid #e0e0e0", p: "2px", borderRadius: 0.75, minWidth: 20 }}
                              >
                                <AddIcon sx={{ fontSize: 11 }} />
                              </IconButton>
                              <SoftTypography variant="caption" color="secondary" sx={{ fontSize: 10, mx: 0.25 }}>
                                {product.unit}
                              </SoftTypography>
                              <Tooltip title={willShip ? "سيتم الشحن" : "استلام مباشر"}>
                                <Chip
                                  size="small"
                                  icon={<LocalShippingIcon sx={{ fontSize: "11px !important" }} />}
                                  label={willShip ? "شحن" : "مباشر"}
                                  color={willShip ? "info" : "default"}
                                  onClick={() => toggleWillShip(product.id)}
                                  sx={{ cursor: "pointer", height: 18, fontSize: 9, "& .MuiChip-label": { px: 0.5 } }}
                                />
                              </Tooltip>
                            </SoftBox>
                          </SoftBox>

                          {/* Row 3 (optional): package count */}
                          {product.unitsPerPackage > 0 && (
                            <SoftTypography variant="caption" sx={{ color: "#7928ca", fontSize: 9, display: "block", mt: 0.25 }}>
                              = {calcPackages(qty, product)} {product.packageUnit}
                            </SoftTypography>
                          )}
                        </SoftBox>
                      );
                    })}
                  </SoftBox>
                )}
              </SoftBox>

              <SoftBox px={2.5} pt={1.5} pb={2}>
                {/* ── Notes ── */}
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={1}
                  label="ملاحظات"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                {/* ── Summary + Actions ── */}
                {cartItems.length > 0 && (
                  <SoftBox
                    display="flex" justifyContent="space-between" alignItems="center"
                    mb={1.5} px={1.5} py={1}
                    sx={{ background: "#f0f7ff", borderRadius: 1.5 }}
                  >
                    <SoftTypography variant="caption" color="secondary">
                      {cartItems.length} صنف · {cartItems.reduce((s, i) => s + i.qty, 0)} وحدة
                    </SoftTypography>
                    <SoftTypography variant="button" fontWeight="bold" color="info">
                      {formatDZD(cartAmount)} دج
                    </SoftTypography>
                  </SoftBox>
                )}

                <SoftBox display="flex" flexDirection="column" gap={1}>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    fullWidth
                    startIcon={<SendIcon />}
                    disabled={cartItems.length === 0 || !customer}
                    onClick={() => handleSubmit(false)}
                  >
                    إرسال للإدارة
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
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* ── Qty Dialog ── */}
      <Dialog open={!!qtyDialog} onClose={() => setQtyDialog(null)} maxWidth="xs" fullWidth>
        {qtyDialog && (
          <>
            <DialogTitle>
              {qtyDialog.step === "variant" ? "اختر المتغير" : (qtyDialog.isEdit ? "تعديل الكمية" : "إضافة للسلة")}
            </DialogTitle>
            <DialogContent>
              {/* ── Variant Step ── */}
              {qtyDialog.step === "variant" && (
                <>
                  <SoftTypography variant="button" fontWeight="bold" display="block" mb={2}>
                    {qtyDialog.product.name}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block" mb={1.5}>
                    اختر المتغير المطلوب للمتابعة
                  </SoftTypography>
                  <SoftBox display="flex" flexDirection="column" gap={1}>
                    {qtyDialog.product.variants.map((v) => {
                      const isSelected = qtyDialog.selectedVariant?.id === v.id;
                      const attrStr = Object.entries(v.attrs).map(([k, val]) => `${k}: ${val}`).join(" | ");
                      return (
                        <SoftBox
                          key={v.id}
                          onClick={() => setQtyDialog((p) => ({ ...p, selectedVariant: v, step: "quantity" }))}
                          sx={{
                            border: `2px solid ${isSelected ? "#17c1e8" : "#e9ecef"}`,
                            borderRadius: 2, p: 1.5, cursor: "pointer",
                            background: isSelected ? "#f0f7ff" : "#fff",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            "&:hover": { borderColor: "#17c1e8", background: "#f0f7ff" },
                          }}
                        >
                          <SoftBox>
                            <SoftTypography variant="caption" fontWeight="bold" display="block">{attrStr}</SoftTypography>
                            <SoftTypography variant="caption" color="secondary" sx={{ fontFamily: "monospace" }}>{v.sku}</SoftTypography>
                          </SoftBox>
                          <SoftBox textAlign="right">
                            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>
                              {new Intl.NumberFormat("ar-DZ").format(v.price)} دج
                            </SoftTypography>
                            <SoftTypography variant="caption" color="secondary" display="block">
                              مخزون: {v.stock}
                            </SoftTypography>
                          </SoftBox>
                        </SoftBox>
                      );
                    })}
                  </SoftBox>
                </>
              )}

              {/* ── Quantity Step ── */}
              {qtyDialog.step === "quantity" && (
              <SoftBox>
              <SoftTypography variant="button" fontWeight="bold" display="block" mb={2}>
                {qtyDialog.product.name}
                {qtyDialog.selectedVariant && (
                  <SoftTypography variant="caption" color="info" display="block" mt={0.3}>
                    {Object.entries(qtyDialog.selectedVariant.attrs).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                  </SoftTypography>
                )}
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
                  onKeyDown={handleQtyKeyDown}
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
              <SoftBox mt={1.5} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftTypography variant="caption" color="secondary">
                    الوحدة: <strong>{qtyDialog.product.unit}</strong>
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    المخزون المتاح: <strong>{qtyDialog.product.stock}</strong>
                  </SoftTypography>
                </SoftBox>
                {qtyDialog.product.unitsPerPackage > 0 && (
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                    <SoftTypography variant="caption" color="secondary">
                      التعليب: <strong>{qtyDialog.product.unitsPerPackage} {qtyDialog.product.unit} / {qtyDialog.product.packageUnit}</strong>
                    </SoftTypography>
                    <SoftTypography variant="caption" sx={{ color: "#7928ca", fontWeight: "bold" }}>
                      {parsedQty > 0 ? `= ${calcPackages(parsedQty, qtyDialog.product)} ${qtyDialog.product.packageUnit}` : ""}
                    </SoftTypography>
                  </SoftBox>
                )}
                {qtyDialog.product.weightPerUnit > 0 && parsedQty > 0 && (
                  <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontWeight: "bold", display: "block", mt: 0.5 }}>
                    الوزن الإجمالي: {(parsedQty * qtyDialog.product.weightPerUnit).toFixed(2)} كغ
                  </SoftTypography>
                )}
                <SoftTypography variant="caption" sx={{ color: "#17c1e8", fontWeight: "bold", display: "block", mt: 0.5 }}>
                  السعر: {formatDZD(resolveProductPrice(qtyDialog.product, selectedPriceListId, "sales").unitPrice)} دج ·{" "}
                  {resolveProductPrice(qtyDialog.product, selectedPriceListId, "sales").sourceLabel}
                </SoftTypography>
              </SoftBox>
              </SoftBox>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setQtyDialog(null)}>
                إلغاء
              </SoftButton>
              <SoftButton variant="gradient" color="info" size="small" onClick={() => confirmQty()}>
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
              <TextField
                fullWidth
                autoFocus
                label="اسم الزبون / الشركة *"
                value={newCustomerForm.name}
                onChange={(event) => updateNewCustomerField("name", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
                value={newCustomerForm.phone}
                onChange={(event) => updateNewCustomerField("phone", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الهاتف الثاني"
                value={newCustomerForm.phone2}
                onChange={(event) => updateNewCustomerField("phone2", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel>الولاية *</InputLabel>
                <Select
                  value={newCustomerForm.wilaya}
                  label="الولاية *"
                  onChange={(event) => updateNewCustomerField("wilaya", event.target.value)}
                >
                  {WILAYAS.map((wilaya) => (
                    <MenuItem key={wilaya.code} value={wilaya.name}>
                      {wilaya.code} - {wilaya.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="العنوان التفصيلي"
                value={newCustomerForm.address}
                onChange={(event) => updateNewCustomerField("address", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="مسار الشحن"
                placeholder="مثال: وهران - الساحل"
                value={newCustomerForm.shippingRoute}
                onChange={(event) => updateNewCustomerField("shippingRoute", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                value={newCustomerForm.email}
                onChange={(event) => updateNewCustomerField("email", event.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الرصيد الافتتاحي (دج)"
                type="number"
                value={newCustomerForm.openingBalance}
                onChange={(event) => updateNewCustomerField("openingBalance", event.target.value)}
                helperText="رصيد سابق قبل بدء التسجيل في البرنامج"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البائع المسؤول"
                value={newCustomerForm.salesperson}
                onChange={(event) => updateNewCustomerField("salesperson", event.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setNewCustomerDialog(false)}>
            إلغاء
          </SoftButton>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            disabled={!newCustomerForm.name.trim() || !newCustomerForm.phone.trim() || !newCustomerForm.wilaya.trim()}
            onClick={addNewCustomer}
          >
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

      <CustomerInfoDialog
        customer={customerInfoOpen ? customer : null}
        onClose={() => setCustomerInfoOpen(false)}
      />
      <Footer />
    </DashboardLayout>
  );
}

export default NewOrder;
