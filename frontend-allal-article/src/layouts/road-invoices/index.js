/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ReceiptIcon from "@mui/icons-material/Receipt";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { WILAYAS } from "data/wilayas";
import { roadInvoicesApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const statusConfig = {
  draft:     { label: "مسودة",  color: "secondary" },
  sent:      { label: "مرسلة",  color: "info" },
  delivered: { label: "مسلّمة", color: "success" },
  cancelled: { label: "ملغاة",  color: "error" },
};

function normalize(inv) {
  return {
    ...inv,
    displayId:    inv.invoiceNumber  ?? inv.id,
    date:         inv.invoiceDate    ?? inv.date ?? "—",
    wilaya:       inv.wilayaName     ?? inv.wilaya ?? "—",
    customer:     inv.customerName   ?? inv.customer ?? "—",
    driver:       inv.driverName     ?? inv.driver ?? "—",
    ordersCount:  inv.linkedOrderIds?.length ?? inv.ordersCount ?? 0,
    itemsCount:   inv.items?.length  ?? inv.itemsCount ?? 0,
    totalWeight:  inv.totalWeight != null ? `${inv.totalWeight} كغ` : "—",
    printCount:   inv.printCount     ?? 0,
    status:       inv.status         ?? "draft",
  };
}

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftBox display="flex" alignItems="center" gap={2}>
        <SoftBox sx={{
          width: 44, height: 44, borderRadius: 2,
          background: `linear-gradient(195deg, ${color}99, ${color})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon sx={{ color: "#fff", fontSize: 22 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="h5" fontWeight="bold">{value}</SoftTypography>
          <SoftTypography variant="caption" color="text">{label}</SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

function RoadInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState(0);
  const [wilayaFilter, setWilayaFilter] = useState("all");
  const [actionBusy, setActionBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const [loadError, setLoadError] = useState("");

  const tabStatus = ["all", "draft", "sent", "delivered"][tab];

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    const params = {};
    if (tabStatus !== "all") params.status = tabStatus;
    roadInvoicesApi.list(params)
      .then((r) => {
        const raw = Array.isArray(r.data?.content) ? r.data.content
                  : Array.isArray(r.data)           ? r.data
                  : [];
        setInvoices(raw.map(normalize));
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل فواتير الطريق"));
        setInvoices([]);
      })
      .finally(() => setLoading(false));
  }, [tabStatus]);

  const filtered = invoices.filter((inv) => {
    const matchWilaya = wilayaFilter === "all" || inv.wilaya === wilayaFilter;
    const q = search.toLowerCase();
    const matchSearch =
      String(inv.displayId || "").toLowerCase().includes(q) ||
      (inv.customer || "").includes(search) ||
      (inv.driver   || "").includes(search) ||
      (inv.wilaya   || "").includes(search);
    return matchWilaya && matchSearch;
  });

  const draftCount     = invoices.filter((i) => i.status === "draft").length;
  const sentCount      = invoices.filter((i) => i.status === "sent").length;
  const deliveredCount = invoices.filter((i) => i.status === "delivered").length;

  const handlePrint = async (inv) => {
    setActionBusy(`print-${inv.id}`);
    setActionError("");
    try {
      await roadInvoicesApi.recordPrint(inv.id);
      setInvoices((current) =>
        current.map((item) =>
          item.id === inv.id ? { ...item, printCount: Number(item.printCount || 0) + 1 } : item
        )
      );
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر تسجيل طباعة فاتورة الطريق"));
    } finally {
      setActionBusy("");
    }
  };

  const handleWhatsapp = async (inv) => {
    setActionBusy(`whatsapp-${inv.id}`);
    setActionError("");
    try {
      await roadInvoicesApi.sendWhatsapp(inv.id);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "تعذر إرسال فاتورة الطريق عبر واتساب"));
    } finally {
      setActionBusy("");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">فواتير الطريق</SoftTypography>
            <SoftTypography variant="body2" color="text">إدارة فواتير الشحن وتتبعها حسب الولاية والسائق</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            <SoftButton variant="outlined" color="secondary" size="small"
              onClick={() => navigate("/road-invoices/from-orders")}>
              تحويل من طلبيات
            </SoftButton>
            <SoftButton variant="gradient" color="info" startIcon={<AddIcon />}
              onClick={() => navigate("/road-invoices/new")}>
              فاتورة جديدة
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="إجمالي الفواتير" value={invoices.length} color="#344767" icon={ReceiptIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="في الطريق"  value={sentCount}      color="#17c1e8" icon={LocalShippingIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مسلّمة"      value={deliveredCount} color="#66BB6A" icon={ReceiptIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="مسودات"     value={draftCount}     color="#fb8c00" icon={ReceiptIcon} />
          </Grid>
        </Grid>

        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError("")}>
            {actionError}
          </Alert>
        )}

        <Card>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {[
                { label: "الكل",       count: invoices.length },
                { label: "مسودات",    count: draftCount },
                { label: "في الطريق", count: sentCount },
                { label: "مسلّمة",    count: deliveredCount },
              ].map((t, i) => (
                <Tab key={i} label={
                  <SoftTypography variant="caption" fontWeight="medium">
                    {t.label}
                    <Chip size="small" label={t.count} sx={{ ml: 0.5, height: 18, fontSize: 10 }} />
                  </SoftTypography>
                } />
              ))}
            </Tabs>
          </SoftBox>

          <SoftBox p={2}>
            <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
              <TextField
                size="small"
                placeholder="بحث برقم الفاتورة أو الزبون..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }}
                sx={{ width: 280 }}
              />
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={wilayaFilter}
                  onChange={(e) => setWilayaFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">كل الولايات</MenuItem>
                  {WILAYAS.map((w) => (
                    <MenuItem key={w.code} value={w.name}>{w.code} - {w.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SoftBox>

            {loading ? (
              <SoftBox display="flex" justifyContent="center" py={5}><CircularProgress /></SoftBox>
            ) : filtered.length === 0 ? (
              <SoftBox textAlign="center" py={5}>
                <SoftTypography variant="body2" color="text">
                  {invoices.length === 0 ? "لا توجد فواتير طريق بعد" : "لا توجد نتائج مطابقة"}
                </SoftTypography>
              </SoftBox>
            ) : (
              <SoftBox sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["رقم الفاتورة","التاريخ","الولاية","الزبون","السائق","الطلبيات","الأصناف","الوزن","الطباعة","الحالة","إجراء"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv, i) => {
                      const sc = statusConfig[inv.status] || statusConfig.draft;
                      return (
                        <tr key={inv.id || i} style={{ borderBottom: "1px solid #f0f2f5", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold" color="info"
                              sx={{ cursor: "pointer" }} onClick={() => navigate(`/road-invoices/${inv.id}`)}>
                              {inv.displayId}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="text">{inv.date}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{inv.wilaya}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="text">{inv.customer}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="text">{inv.driver}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" fontWeight="bold">{inv.ordersCount}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption">{inv.itemsCount}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftTypography variant="caption" color="text">{inv.totalWeight}</SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <SoftTypography variant="caption" color={inv.printCount > 0 ? "success" : "secondary"}>
                              {inv.printCount > 0 ? `×${inv.printCount}` : "لم تُطبع"}
                            </SoftTypography>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBadge variant="gradient" color={sc.color} size="xs" badgeContent={sc.label} container />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <SoftBox display="flex" gap={0.5}>
                              <Tooltip title="عرض">
                                <IconButton size="small" onClick={() => navigate(`/road-invoices/${inv.id}`)}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="طباعة">
                                <IconButton
                                  size="small"
                                  sx={{ color: "#344767" }}
                                  disabled={Boolean(actionBusy)}
                                  onClick={() => handlePrint(inv)}
                                >
                                  <PrintIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="إرسال عبر واتساب">
                                <IconButton
                                  size="small"
                                  sx={{ color: "#25D366" }}
                                  disabled={Boolean(actionBusy)}
                                  onClick={() => handleWhatsapp(inv)}
                                >
                                  <WhatsAppIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </SoftBox>
                          </td>
                        </tr>
                      );
                    })}
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

export default RoadInvoices;
