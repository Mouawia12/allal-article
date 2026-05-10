/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { ordersApi, roadInvoicesApi, customersApi, productsApi, referenceApi } from "services";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import MergeIcon from "@mui/icons-material/CallMerge";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank, isPositiveNumber } from "utils/formErrors";
import { useI18n } from "i18n";

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

// Statuses eligible for road-invoice conversion. Excludes draft/submitted/cancelled/rejected.
const SHIPPABLE_STATUSES = ["confirmed", "shipped", "completed"];
const STATUS_LABELS = {
  draft:        { label: "مسودة",      color: "#94a3b8" },
  submitted:    { label: "مُرسلة",      color: "#3b82f6" },
  under_review: { label: "قيد المراجعة", color: "#a855f7" },
  confirmed:    { label: "مؤكدة",      color: "#10b981" },
  shipped:      { label: "مشحونة",     color: "#0ea5e9" },
  completed:    { label: "مكتملة",     color: "#16a34a" },
  cancelled:    { label: "ملغاة",      color: "#ef4444" },
  rejected:     { label: "مرفوضة",     color: "#ef4444" },
};

// ─── Orders Selection Dialog ──────────────────────────────────────────────────
function SelectOrdersDialog({ open, onClose, onConfirm }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | confirmed | shipped | completed
  const [selected, setSelected] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!open) return;
    setOrdersLoading(true);
    setOrdersError("");
    // Pull a wider window with no status filter — we filter to shippable statuses on the client
    // so the user sees confirmed/shipped/completed orders together.
    ordersApi.list({ size: 200 })
      .then((r) => setOrders(extractList(r.data)))
      .catch((error) => {
        setOrdersError(getApiErrorMessage(error, "تعذر تحميل الطلبيات"));
        setOrders([]);
      })
      .finally(() => setOrdersLoading(false));
  }, [open]);

  const eligible = orders.filter((o) => SHIPPABLE_STATUSES.includes(o.orderStatus));
  const filtered = eligible.filter((o) => {
    const matchStatus = statusFilter === "all" || o.orderStatus === statusFilter;
    const matchSearch = !search
      || (o.orderNumber ?? "").includes(search)
      || (o.customerName ?? "").includes(search);
    return matchStatus && matchSearch;
  });

  const counts = SHIPPABLE_STATUSES.reduce((acc, s) => {
    acc[s] = eligible.filter((o) => o.orderStatus === s).length;
    return acc;
  }, {});

  const toggle = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleConfirm = () => {
    const selectedOrders = orders.filter((o) => selected.includes(o.id));
    const lines = selectedOrders.flatMap((o) =>
      (o.items ?? [])
        .filter((item) => item.lineStatus !== "cancelled")
        .map((item) => {
          const qty = Number(item.shippedQty ?? 0) > 0
            ? Number(item.shippedQty)
            : Number(item.approvedQty ?? item.requestedQty ?? 0);
          return {
            id: `order-${o.id}-${item.id}`,
            product: item.productName ?? "—",
            category: "—",
            code: item.productSku ?? "—",
            qty,
            productId: item.productId,
            orderId: o.id,
            price: Number(item.unitPrice ?? 0),
            weight: 0,
          };
        })
        .filter((line) => line.qty > 0)
    );
    onConfirm(lines);
    setSelected([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>اختر الطلبيات للتحويل لفاتورة طريق</DialogTitle>
      <DialogContent dividers>
        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="بحث برقم الطلبية أو الزبون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ width: 280 }}
          />
          <SoftBox display="flex" gap={0.5} flexWrap="wrap">
            {[
              { key: "all",       label: `الكل (${eligible.length})` },
              { key: "confirmed", label: `${STATUS_LABELS.confirmed.label} (${counts.confirmed ?? 0})` },
              { key: "shipped",   label: `${STATUS_LABELS.shipped.label} (${counts.shipped ?? 0})` },
              { key: "completed", label: `${STATUS_LABELS.completed.label} (${counts.completed ?? 0})` },
            ].map((opt) => (
              <SoftButton
                key={opt.key}
                variant={statusFilter === opt.key ? "gradient" : "outlined"}
                color={statusFilter === opt.key ? "info" : "secondary"}
                size="small"
                onClick={() => setStatusFilter(opt.key)}
              >
                {opt.label}
              </SoftButton>
            ))}
          </SoftBox>
        </SoftBox>
        {ordersError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOrdersError("")}>
            {ordersError}
          </Alert>
        )}
        {ordersLoading ? (
          <SoftBox display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </SoftBox>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "8px 12px", width: 40 }}></th>
                {["رقم الطلبية", "الزبون", "التاريخ", "الحالة", "أصناف"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const sl = STATUS_LABELS[o.orderStatus] ?? { label: o.orderStatus, color: "#94a3b8" };
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f0f2f5", background: selected.includes(o.id) ? "#f0f7ff" : "#fff" }}>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <Checkbox size="small" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" fontWeight="bold" color="info">{o.orderNumber}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption">{o.customerName}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" color="text">{o.createdAt ? o.createdAt.slice(0, 10) : "—"}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 12,
                        background: `${sl.color}1a`,
                        color: sl.color,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>{sl.label}</span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <SoftTypography variant="caption">{(o.items ?? []).length}</SoftTypography>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !ordersLoading && (
                <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">
                    {eligible.length === 0
                      ? "لا توجد طلبيات قابلة للتحويل (مؤكدة، مشحونة أو مكتملة). أكّد طلبية أولاً من شاشة الطلبيات."
                      : "لا توجد نتائج مطابقة للبحث/الفلتر"}
                  </SoftTypography>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
        {selected.length > 0 && (
          <SoftBox mt={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
            <SoftTypography variant="caption" fontWeight="bold" color="info">
              تم اختيار {selected.length} طلبية
            </SoftTypography>
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          onClick={handleConfirm}
          disabled={selected.length === 0}>
          تحويل {selected.length > 0 ? `(${selected.length})` : ""}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Product Picker Dialog ────────────────────────────────────────────────────
function ProductPickerDialog({ open, onClose, onConfirm, products, loading }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({}); // { productId: qty }

  useEffect(() => {
    if (!open) setSelected({});
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.sku || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const toggle = (id) =>
    setSelected((prev) => {
      if (prev[id] != null) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });

  const setQty = (id, qty) =>
    setSelected((prev) => ({ ...prev, [id]: Number(qty) || 0 }));

  const handleConfirm = () => {
    const lines = Object.entries(selected)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([id, qty]) => {
        const p = products.find((x) => String(x.id) === String(id));
        return {
          id: `manual-${id}-${Date.now()}`,
          product: p?.name ?? "—",
          category: p?.categoryName ?? "—",
          code: p?.sku ?? "—",
          qty: Number(qty),
          productId: Number(id),
          orderId: null,
          price: Number(p?.currentPriceAmount ?? 0),
          weight: 0,
        };
      });
    onConfirm(lines);
  };

  const selectedCount = Object.values(selected).filter((q) => Number(q) > 0).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>اختر الأصناف</DialogTitle>
      <DialogContent dividers>
        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="بحث بالاسم أو الرمز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ width: 280 }}
          />
        </SoftBox>
        {loading ? (
          <SoftBox display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </SoftBox>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fa" }}>
                <th style={{ padding: "8px 12px", width: 40 }}></th>
                {["الصنف", "الرمز", "الفئة", "السعر", "الكمية"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right" }}>
                    <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isSel = selected[p.id] != null;
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #f0f2f5", background: isSel ? "#f0f7ff" : "#fff" }}>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <Checkbox size="small" checked={isSel} onChange={() => toggle(p.id)} />
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" fontWeight="bold">{p.name}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" color="secondary">{p.sku ?? "—"}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption" color="text">{p.categoryName ?? "—"}</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <SoftTypography variant="caption">{Number(p.currentPriceAmount ?? 0).toLocaleString()} دج</SoftTypography>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {isSel && (
                        <TextField
                          size="small"
                          type="number"
                          value={selected[p.id]}
                          onChange={(e) => setQty(p.id, e.target.value)}
                          inputProps={{ min: 1, style: { padding: "4px 8px", width: 70 } }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: "20px", textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">لا توجد أصناف</SoftTypography>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
        {selectedCount > 0 && (
          <SoftBox mt={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2 }}>
            <SoftTypography variant="caption" fontWeight="bold" color="info">
              تم اختيار {selectedCount} صنف
            </SoftTypography>
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" size="small"
          onClick={handleConfirm}
          disabled={selectedCount === 0}>
          إضافة {selectedCount > 0 ? `(${selectedCount})` : ""}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
function RoadInvoiceForm() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const location = useLocation();
  const { id: routeId } = useParams();
  const isFromOrders = location.pathname.includes("from-orders");
  const isDetail = Boolean(routeId);

  const [wilayas, setWilayas] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [wilayaId, setWilayaId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [driver, setDriver] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([]);

  const [selectOrdersOpen, setSelectOrdersOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);

  const [detailLoading, setDetailLoading] = useState(isDetail);
  const [detailError, setDetailError] = useState("");
  const [invoice, setInvoice] = useState(null); // loaded RoadInvoiceResponse for detail view
  const [actionBusy, setActionBusy] = useState("");
  const [actionError, setActionError] = useState("");

  // Load reference data (wilayas, customers, products)
  useEffect(() => {
    referenceApi.wilayas()
      .then((r) => setWilayas(extractList(r.data)))
      .catch(() => setWilayas([]));

    customersApi.list({ size: 500 })
      .then((r) => setCustomers(extractList(r.data)))
      .catch(() => setCustomers([]));

    setProductsLoading(true);
    productsApi.list({ size: 500 })
      .then((r) => setProducts(extractList(r.data)))
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  // Default wilaya + customer once reference data loads (Oran 31, fallback first).
  // Only runs while the form is empty so we don't override user picks.
  useEffect(() => {
    if (isDetail) return;
    if (wilayaId != null || wilayas.length === 0) return;
    const oran = wilayas.find((w) => w.code === "31");
    const defaultWilayaId = (oran ?? wilayas[0]).id;
    setWilayaId(defaultWilayaId);
    if (!selectedCustomer) {
      const match = customers.find((c) => c.wilayaId === defaultWilayaId);
      if (match) setSelectedCustomer(match);
    }
  }, [wilayas, customers, wilayaId, selectedCustomer, isDetail]);

  // Auto-open SelectOrdersDialog only on /from-orders path
  useEffect(() => {
    if (isFromOrders && !isDetail) setSelectOrdersOpen(true);
  }, [isFromOrders, isDetail]);

  // Load existing invoice for /:id route (read-only view)
  useEffect(() => {
    if (!isDetail) return;
    setDetailLoading(true);
    setDetailError("");
    roadInvoicesApi.getById(routeId)
      .then((r) => {
        const inv = r.data ?? null;
        setInvoice(inv);
        if (inv) {
          setWilayaId(inv.wilayaId ?? null);
          setSelectedCustomer(inv.customerId ? { id: inv.customerId, name: inv.customerName, wilayaId: inv.wilayaId } : null);
          setInvoiceDate(inv.invoiceDate ?? new Date().toISOString().split("T")[0]);
          setNotes(inv.notes ?? "");
          setLines((inv.items ?? []).map((it) => ({
            id: `loaded-${it.id}`,
            product: it.productName ?? "—",
            category: "—",
            code: "",
            qty: Number(it.quantity ?? 0),
            productId: it.productId,
            orderId: null,
            price: Number(it.unitPrice ?? 0),
            weight: Number(it.quantity) > 0 ? Number(it.lineWeight ?? 0) / Number(it.quantity) : 0,
          })));
        }
      })
      .catch((error) => setDetailError(getApiErrorMessage(error, "تعذر تحميل فاتورة الطريق")))
      .finally(() => setDetailLoading(false));
  }, [isDetail, routeId]);

  const wilayaCustomers = useMemo(() => {
    if (!wilayaId) return customers;
    const inWilaya = customers.filter((c) => c.wilayaId === wilayaId);
    return inWilaya.length > 0 ? inWilaya : customers;
  }, [customers, wilayaId]);

  const handleWilayaChange = (newId) => {
    setWilayaId(newId);
    setErrors((current) => ({ ...current, wilayaId: "", _global: "" }));
    const match = customers.find((c) => c.wilayaId === newId);
    setSelectedCustomer(match ?? null);
  };

  const handleDeleteLine = (id) => {
    setErrors((current) => {
      const next = { ...current, items: "", _global: "" };
      delete next[`line-${id}-productId`];
      delete next[`line-${id}-qty`];
      delete next[`line-${id}-price`];
      return next;
    });
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleQtyChange = (id, qty) => {
    setErrors((current) => ({ ...current, [`line-${id}-qty`]: "", items: "", _global: "" }));
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, qty: Number(qty) } : l));
  };

  const handlePriceChange = (id, price) => {
    setErrors((current) => ({ ...current, [`line-${id}-price`]: "", items: "", _global: "" }));
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, price: Number(price) } : l));
  };

  // Merge duplicate products — sum qty for lines pointing at the same productId.
  const handleMergeItems = () => {
    const grouped = new Map();
    lines.forEach((l) => {
      const key = l.productId ?? `name:${l.product}`;
      if (!grouped.has(key)) {
        grouped.set(key, { ...l });
      } else {
        const acc = grouped.get(key);
        acc.qty = Number(acc.qty || 0) + Number(l.qty || 0);
      }
    });
    setLines(Array.from(grouped.values()));
  };

  const totalWeight = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.weight || 0), 0).toFixed(1);
  const totalAmount = lines.reduce((s, l) => s + Number(l.qty || 0) * Number(l.price || 0), 0).toLocaleString();

  const handleSave = () => {
    const validationErrors = {};
    if (isBlank(invoiceDate)) validationErrors.invoiceDate = t("تاريخ الفاتورة مطلوب");
    if (!wilayaId) validationErrors.wilayaId = t("الولاية مطلوبة");
    if (lines.length === 0) validationErrors.items = t("أضف طلبية أو صنفاً واحداً على الأقل");
    lines.forEach((line) => {
      if (!line.productId) validationErrors[`line-${line.id}-productId`] = t("الصنف غير مرتبط بمنتج صالح");
      if (!isPositiveNumber(line.qty)) validationErrors[`line-${line.id}-qty`] = t("الكمية يجب أن تكون أكبر من صفر");
      if (Number(line.price) < 0) validationErrors[`line-${line.id}-price`] = t("السعر لا يمكن أن يكون سالباً");
    });

    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    const payload = {
      invoiceDate,
      wilayaId,
      customerId: selectedCustomer?.id ?? null,
      notes: notes || null,
      orderIds: [...new Set(lines.map((line) => line.orderId).filter(Boolean))],
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.qty),
        unitPrice: Number(line.price) || 0,
        lineWeight: Number(line.qty || 0) * Number(line.weight || 0),
      })),
    };

    setSaving(true);
    roadInvoicesApi.create(payload)
      .then((r) => setSavedId(r.data?.id ?? true))
      .catch((error) => applyApiErrors(error, setErrors, "فشل حفظ فاتورة الطريق"))
      .finally(() => setSaving(false));
  };

  const handlePrint = async () => {
    if (!invoice?.id) {
      window.print();
      return;
    }
    setActionBusy("print");
    setActionError("");
    try {
      await roadInvoicesApi.recordPrint(invoice.id);
      setInvoice((prev) => prev ? { ...prev, printCount: Number(prev.printCount || 0) + 1 } : prev);
      window.print();
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر تسجيل طباعة فاتورة الطريق"));
    } finally {
      setActionBusy("");
    }
  };

  const handleWhatsapp = async () => {
    if (!invoice?.id) return;
    setActionBusy("whatsapp");
    setActionError("");
    try {
      await roadInvoicesApi.sendWhatsapp(invoice.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر إرسال فاتورة الطريق عبر واتساب"));
    } finally {
      setActionBusy("");
    }
  };

  const headerTitle = isDetail
    ? (invoice?.invoiceNumber ? `فاتورة طريق ${invoice.invoiceNumber}` : "فاتورة طريق")
    : (isFromOrders ? "تحويل طلبيات إلى فاتورة طريق" : "فاتورة طريق جديدة");

  if (isDetail && detailLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox py={6} display="flex" justifyContent="center"><CircularProgress /></SoftBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate("/road-invoices")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">{headerTitle}</SoftTypography>
            <SoftTypography variant="body2" color="text">
              {isDetail ? "عرض الفاتورة" : "قم بمراجعة الأصناف وتعديلها قبل الطباعة"}
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            {!isDetail && (
              <>
                <SoftButton variant="outlined" color="secondary" size="small" startIcon={<AddIcon />}
                  onClick={() => setSelectOrdersOpen(true)}>
                  إضافة طلبيات
                </SoftButton>
                <SoftButton variant="outlined" color="info" size="small" startIcon={<AddIcon />}
                  onClick={() => setProductPickerOpen(true)}>
                  إضافة صنف
                </SoftButton>
              </>
            )}
            <SoftButton variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />}
              onClick={handlePrint} disabled={actionBusy === "print"}>
              طباعة
            </SoftButton>
            {isDetail && (
              <SoftButton variant="outlined" color="success" size="small" startIcon={<WhatsAppIcon />}
                onClick={handleWhatsapp} disabled={actionBusy === "whatsapp"}
                sx={{ color: "#25D366", borderColor: "#25D366" }}>
                واتساب PDF
              </SoftButton>
            )}
            {!isDetail && (
              <SoftButton variant="gradient" color="info" size="small" disabled={saving} onClick={handleSave}>
                {saving ? "جارٍ الحفظ..." : "حفظ الفاتورة"}
              </SoftButton>
            )}
          </SoftBox>
        </SoftBox>

        {detailError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError("")}>{detailError}</Alert>
        )}
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError("")}>{actionError}</Alert>
        )}
        {(errors._global || errors.items) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global || errors.items}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Left: Header Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5, height: "100%" }}>
              <SoftTypography variant="button" fontWeight="bold" mb={2} display="block">
                معلومات الفاتورة
              </SoftTypography>
              <SoftBox display="flex" flexDirection="column" gap={2}>
                <FormControl size="small" fullWidth error={!!errors.wilayaId} disabled={isDetail}>
                  <InputLabel>الولاية</InputLabel>
                  <Select
                    value={wilayaId ?? ""}
                    onChange={(e) => handleWilayaChange(Number(e.target.value))}
                    label="الولاية"
                  >
                    {wilayas.map((w) => (
                      <MenuItem key={w.id} value={w.id}>{w.code} - {w.nameAr}</MenuItem>
                    ))}
                  </Select>
                  {errors.wilayaId && (
                    <SoftTypography variant="caption" color="error" mt={0.5}>{errors.wilayaId}</SoftTypography>
                  )}
                </FormControl>
                <Autocomplete
                  size="small"
                  options={wilayaCustomers}
                  value={selectedCustomer}
                  onChange={(_, v) => {
                    setSelectedCustomer(v);
                    setErrors((c) => ({ ...c, customerId: "", _global: "" }));
                  }}
                  getOptionLabel={(o) => o?.name ?? ""}
                  isOptionEqualToValue={(o, v) => o?.id === v?.id}
                  disabled={isDetail}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="الزبون"
                      error={!!errors.customerId}
                      helperText={errors.customerId}
                    />
                  )}
                />
                <TextField
                  size="small"
                  label="السائق"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  fullWidth
                  disabled={isDetail}
                  helperText={isDetail ? "" : "اسم السائق (اختياري)"}
                />
                <TextField size="small" label="تاريخ الفاتورة" type="date" fullWidth
                  value={invoiceDate}
                  onChange={(e) => {
                    setInvoiceDate(e.target.value);
                    setErrors((current) => ({ ...current, invoiceDate: "", _global: "" }));
                  }}
                  error={!!errors.invoiceDate}
                  helperText={errors.invoiceDate}
                  InputLabelProps={{ shrink: true }}
                  disabled={isDetail}
                />
                <TextField size="small" label="ملاحظات" multiline rows={3} fullWidth value={notes}
                  onChange={(e) => setNotes(e.target.value)} disabled={isDetail} />
                {isDetail && invoice && (
                  <SoftBox mt={1}>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      الحالة: <strong>{invoice.status}</strong>
                    </SoftTypography>
                    <SoftTypography variant="caption" color="secondary" display="block">
                      عدد مرات الطباعة: <strong>{invoice.printCount ?? 0}</strong>
                    </SoftTypography>
                  </SoftBox>
                )}
              </SoftBox>
            </Card>
          </Grid>

          {/* Right: Items Table */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <SoftTypography variant="button" fontWeight="bold">
                  الأصناف ({lines.length})
                </SoftTypography>
                <SoftBox display="flex" gap={1} alignItems="center">
                  <SoftTypography variant="caption" color="secondary">
                    الوزن الإجمالي: <strong>{totalWeight} كغ</strong>
                  </SoftTypography>
                  <SoftTypography variant="caption" color="secondary" mx={1}>|</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    الإجمالي: <strong>{totalAmount} دج</strong>
                  </SoftTypography>
                  {!isDetail && (
                    <Tooltip title="دمج الأصناف المتشابهة لتوفير المساحة عند الطباعة">
                      <SoftButton variant="outlined" color="warning" size="small" startIcon={<MergeIcon />}
                        onClick={handleMergeItems}
                        disabled={lines.length < 2}>
                        دمج الأصناف
                      </SoftButton>
                    </Tooltip>
                  )}
                </SoftBox>
              </SoftBox>

              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {(isDetail
                        ? ["الصنف", "الكمية", "السعر (دج)", "الوزن (كغ)", "الإجمالي"]
                        : ["الصنف", "الفئة", "الكمية", "السعر (دج)", "الوزن (كغ)", "الإجمالي", "حذف"]
                      ).map((h) => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                        <td style={{ padding: "8px 10px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">{l.product}</SoftTypography>
                          {l.code && (
                            <SoftTypography variant="caption" color="secondary" display="block">{l.code}</SoftTypography>
                          )}
                          {errors[`line-${l.id}-productId`] && (
                            <SoftTypography variant="caption" color="error" display="block">
                              {errors[`line-${l.id}-productId`]}
                            </SoftTypography>
                          )}
                        </td>
                        {!isDetail && (
                          <td style={{ padding: "8px 10px" }}>
                            <SoftTypography variant="caption" color="text">{l.category}</SoftTypography>
                          </td>
                        )}
                        <td style={{ padding: "8px 10px", minWidth: 80 }}>
                          {isDetail ? (
                            <SoftTypography variant="caption">{l.qty}</SoftTypography>
                          ) : (
                            <TextField
                              size="small"
                              type="number"
                              value={l.qty}
                              onChange={(e) => handleQtyChange(l.id, e.target.value)}
                              error={!!errors[`line-${l.id}-qty`]}
                              helperText={errors[`line-${l.id}-qty`]}
                              inputProps={{ min: 1, style: { padding: "4px 8px", width: 70 } }}
                            />
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", minWidth: 90 }}>
                          {isDetail ? (
                            <SoftTypography variant="caption">{Number(l.price).toLocaleString()}</SoftTypography>
                          ) : (
                            <TextField
                              size="small"
                              type="number"
                              value={l.price}
                              onChange={(e) => handlePriceChange(l.id, e.target.value)}
                              error={!!errors[`line-${l.id}-price`]}
                              helperText={errors[`line-${l.id}-price`]}
                              inputProps={{ min: 0, style: { padding: "4px 8px", width: 80 } }}
                            />
                          )}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="text">
                            {(Number(l.qty || 0) * Number(l.weight || 0)).toFixed(2)}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <SoftTypography variant="caption" fontWeight="bold">
                            {(Number(l.qty || 0) * Number(l.price || 0)).toLocaleString()}
                          </SoftTypography>
                        </td>
                        {!isDetail && (
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <Tooltip title="حذف الصنف">
                              <IconButton size="small" color="error" onClick={() => handleDeleteLine(l.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </td>
                        )}
                      </tr>
                    ))}
                    {lines.length === 0 && (
                      <tr>
                        <td colSpan={isDetail ? 5 : 7} style={{ padding: "24px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="secondary">
                            {isDetail ? "لا توجد أصناف" : "لا توجد أصناف بعد. أضف طلبية أو صنفاً للبدء."}
                          </SoftTypography>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </SoftBox>

              <Divider sx={{ my: 2 }} />
              <SoftBox display="flex" justifyContent="flex-end" gap={3}>
                <SoftBox textAlign="right">
                  <SoftTypography variant="caption" color="secondary">الوزن الكلي</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold">{totalWeight} كغ</SoftTypography>
                </SoftBox>
                <SoftBox textAlign="right">
                  <SoftTypography variant="caption" color="secondary">إجمالي الفاتورة</SoftTypography>
                  <SoftTypography variant="h5" fontWeight="bold" color="info">{totalAmount} دج</SoftTypography>
                </SoftBox>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      <SelectOrdersDialog
        open={selectOrdersOpen}
        onClose={() => setSelectOrdersOpen(false)}
        onConfirm={(newLines) => setLines((prev) => {
          const existingKeys = new Set(prev.map((l) => `${l.productId ?? l.code}-${l.orderId ?? ""}`));
          const toAdd = newLines.filter((l) => !existingKeys.has(`${l.productId ?? l.code}-${l.orderId ?? ""}`));
          return [...prev, ...toAdd];
        })}
      />

      <ProductPickerDialog
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        loading={productsLoading}
        products={products}
        onConfirm={(newLines) => {
          setLines((prev) => [...prev, ...newLines]);
          setProductPickerOpen(false);
        }}
      />

      <Dialog open={!!savedId} onClose={() => setSavedId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>تم الحفظ</DialogTitle>
        <DialogContent dividers>
          <SoftTypography variant="body2" color="text">تم حفظ فاتورة الطريق بنجاح.</SoftTypography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <SoftButton variant="text" color="secondary" onClick={() => navigate("/road-invoices")}>العودة للقائمة</SoftButton>
          {savedId !== true && (
            <SoftButton variant="gradient" color="info" onClick={() => navigate(`/road-invoices/${savedId}`)}>عرض الفاتورة</SoftButton>
          )}
        </DialogActions>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default RoadInvoiceForm;
