/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from "@mui/icons-material/Factory";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaidIcon from "@mui/icons-material/Paid";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import SearchIcon from "@mui/icons-material/Search";
import TimelineIcon from "@mui/icons-material/Timeline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import {
  buildManufacturingRequest,
  depositStatusConfig,
  formatDZD,
  getManufacturingStats,
  manufacturingNextActions,
  manufacturingStatusConfig,
  manufacturingStatusOrder,
  manufacturingTimeline,
  manufacturingTypeConfig,
  mockManufacturingRequests,
} from "data/mock/manufacturingMock";

const priorityConfig = {
  low: { label: "منخفضة", color: "#8392ab", bg: "#f8f9fa" },
  normal: { label: "عادية", color: "#17c1e8", bg: "#e3f8fd" },
  high: { label: "عالية", color: "#fb8c00", bg: "#fff4e5" },
  urgent: { label: "عاجلة", color: "#ea0606", bg: "#fde8e8" },
};

const defaultForm = {
  productName: "رف معدني خاص",
  productCode: "MFG-ITEM",
  qty: 50,
  unit: "قطعة",
  sourceType: "stock_replenishment",
  salesOrderNumber: "",
  customerName: "",
  destinationWarehouse: "مخزن المقر الرئيسي",
  destinationBranch: "وهران - المقر",
  factory: "مصنع الحديد 01",
  productionLine: "خط إنتاج A",
  responsible: "سفيان بن عيسى",
  priority: "normal",
  dueDate: "2025-01-28",
  depositRequired: false,
  depositAmount: 0,
  notes: "",
};

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <Card sx={{ p: 2.2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: `linear-gradient(195deg, ${color}99, ${color})`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 23 }} />
        </Box>
        <Box>
          <Box sx={{ fontSize: 20, fontWeight: 800, color: "#344767", lineHeight: 1.1 }}>{value}</Box>
          <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 700 }}>{label}</Box>
          {sub && <Box sx={{ fontSize: 11, color: "#8392ab", mt: 0.2 }}>{sub}</Box>}
        </Box>
      </Box>
    </Card>
  );
}

function StatusChip({ status }) {
  const cfg = manufacturingStatusConfig[status] || manufacturingStatusConfig.draft;
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ height: 23, fontSize: 10.5, background: cfg.bg, color: cfg.color, fontWeight: 800 }}
    />
  );
}

function TypeChip({ type }) {
  const cfg = manufacturingTypeConfig[type] || manufacturingTypeConfig.stock_replenishment;
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ height: 23, fontSize: 10.5, background: cfg.bg, color: cfg.color, fontWeight: 800 }}
    />
  );
}

function DepositChip({ request }) {
  const cfg = depositStatusConfig[request.depositStatus] || depositStatusConfig.none;
  const openAmount = Math.max(request.depositAmount - request.depositPaid, 0);

  return (
    <Tooltip title={request.depositRequired ? `المتبقي: ${formatDZD(openAmount)} دج` : "هذا الطلب لا يحتاج عربون"}>
      <Chip
        label={cfg.label}
        size="small"
        sx={{ height: 23, fontSize: 10.5, background: cfg.bg, color: cfg.color, fontWeight: 800 }}
      />
    </Tooltip>
  );
}

function NewManufacturingDialog({ open, form, onChange, onClose, onSubmit }) {
  const setField = (field) => (event) => {
    const value = field === "depositRequired" ? event.target.value === "yes" : event.target.value;
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 800, color: "#344767" }}>فتح طلب تصنيع</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.6}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="الصنف المطلوب" value={form.productName} onChange={setField("productName")} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth size="small" label="كود الصنف" value={form.productCode} onChange={setField("productCode")} />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth size="small" label="الكمية" type="number" value={form.qty} onChange={setField("qty")} />
          </Grid>
          <Grid item xs={6} md={1}>
            <TextField fullWidth size="small" label="الوحدة" value={form.unit} onChange={setField("unit")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>سبب التصنيع</InputLabel>
              <Select label="سبب التصنيع" value={form.sourceType} onChange={setField("sourceType")}>
                {Object.entries(manufacturingTypeConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="رقم طلبية البيع" value={form.salesOrderNumber} onChange={setField("salesOrderNumber")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="الزبون" value={form.customerName} onChange={setField("customerName")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="المخزن المستلم" value={form.destinationWarehouse} onChange={setField("destinationWarehouse")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="الفرع / المقر" value={form.destinationBranch} onChange={setField("destinationBranch")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="تاريخ التسليم المطلوب" type="date" value={form.dueDate} onChange={setField("dueDate")} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="المصنع" value={form.factory} onChange={setField("factory")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="خط الإنتاج" value={form.productionLine} onChange={setField("productionLine")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="مسؤول التصنيع" value={form.responsible} onChange={setField("responsible")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>الأولوية</InputLabel>
              <Select label="الأولوية" value={form.priority} onChange={setField("priority")}>
                {Object.entries(priorityConfig).map(([key, cfg]) => (
                  <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>العربون</InputLabel>
              <Select label="العربون" value={form.depositRequired ? "yes" : "no"} onChange={setField("depositRequired")}>
                <MenuItem value="no">بدون عربون</MenuItem>
                <MenuItem value="yes">يحتاج عربون</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="قيمة العربون"
              type="number"
              value={form.depositAmount}
              onChange={setField("depositAmount")}
              disabled={!form.depositRequired}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="ملاحظات التصنيع" value={form.notes} onChange={setField("notes")} multiline rows={3} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <SoftButton variant="outlined" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" onClick={onSubmit} startIcon={<AddIcon />}>إنشاء الطلب</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

function RequestList({ requests, selectedId, onSelect }) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8f9fa" }}>
            {["الطلب", "الصنف", "السبب", "الكمية", "الحالة", "المصنع", "التسليم", "العربون"].map((header) => (
              <th key={header} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                <SoftTypography variant="caption" fontWeight="bold" color="secondary">{header}</SoftTypography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.map((request, index) => {
            const selected = request.id === selectedId;
            const priority = priorityConfig[request.priority] || priorityConfig.normal;

            return (
              <tr
                key={request.id}
                onClick={() => onSelect(request.id)}
                style={{
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f2f5",
                  background: selected ? "#f0f7ff" : index % 2 === 0 ? "#fff" : "#fafbfc",
                }}
              >
                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                  <SoftTypography variant="caption" fontWeight="bold" color="info">{request.id}</SoftTypography>
                  <Box sx={{ fontSize: 10.5, color: priority.color, fontWeight: 800 }}>{priority.label}</Box>
                </td>
                <td style={{ padding: "11px 12px", minWidth: 190 }}>
                  <SoftTypography variant="caption" fontWeight="bold" display="block">{request.productName}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">{request.productCode}</SoftTypography>
                </td>
                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                  <TypeChip type={request.sourceType} />
                </td>
                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                  <SoftTypography variant="caption" fontWeight="bold">{request.qty} {request.unit}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block">أنتج {request.producedQty}</SoftTypography>
                </td>
                <td style={{ padding: "11px 12px", minWidth: 140 }}>
                  <StatusChip status={request.status} />
                  <LinearProgress
                    variant="determinate"
                    value={request.progress}
                    sx={{
                      height: 4,
                      width: 92,
                      borderRadius: 2,
                      mt: 0.8,
                      background: "#eef1f6",
                      "& .MuiLinearProgress-bar": { background: manufacturingStatusConfig[request.status]?.color || "#17c1e8" },
                    }}
                  />
                </td>
                <td style={{ padding: "11px 12px", minWidth: 150 }}>
                  <SoftTypography variant="caption" color="text" display="block">{request.factory}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">{request.productionLine}</SoftTypography>
                </td>
                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                  <SoftTypography variant="caption" color="text">{request.dueDate}</SoftTypography>
                </td>
                <td style={{ padding: "11px 12px", whiteSpace: "nowrap" }}>
                  <DepositChip request={request} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}

function ManufacturingTimeline({ events }) {
  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      {events.map((event, index) => (
        <Box key={event.id} sx={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 1.2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: index === 0 ? "#17c1e8" : "#ced4da", mt: 0.5 }} />
            {index < events.length - 1 && <Box sx={{ width: 1, minHeight: 42, background: "#e9ecef", mt: 0.5 }} />}
          </Box>
          <Box sx={{ pb: index < events.length - 1 ? 1 : 0 }}>
            <Box sx={{ fontSize: 12, fontWeight: 800, color: "#344767" }}>{event.title}</Box>
            <Box sx={{ fontSize: 11, color: "#8392ab", mb: 0.4 }}>{event.actor} · {event.at}</Box>
            <Box sx={{ fontSize: 11.5, color: "#67748e", lineHeight: 1.7 }}>{event.body}</Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export default function Manufacturing() {
  const [requests, setRequests] = useState(mockManufacturingRequests);
  const [selectedId, setSelectedId] = useState(mockManufacturingRequests[0].id);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [timelineByRequest, setTimelineByRequest] = useState(manufacturingTimeline);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const selectedRequest = requests.find((request) => request.id === selectedId) || requests[0];
  const selectedStatus = manufacturingStatusConfig[selectedRequest.status] || manufacturingStatusConfig.draft;
  const selectedType = manufacturingTypeConfig[selectedRequest.sourceType] || manufacturingTypeConfig.stock_replenishment;
  const selectedPriority = priorityConfig[selectedRequest.priority] || priorityConfig.normal;
  const selectedTimeline = timelineByRequest[selectedRequest.id] || [];
  const stats = useMemo(() => getManufacturingStats(requests), [requests]);

  const tabs = [
    { key: "all", label: "الكل", count: requests.length },
    { key: "active", label: "نشطة", count: stats.active },
    { key: "in_production", label: "قيد التصنيع", count: stats.inProduction },
    { key: "ready", label: "جاهزة/في الطريق", count: stats.awaitingDelivery },
    { key: "received", label: "مستلمة", count: requests.filter((request) => request.status === "received").length },
  ];

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.id.toLowerCase().includes(search.toLowerCase()) ||
      request.productName.includes(search) ||
      request.productCode.toLowerCase().includes(search.toLowerCase()) ||
      request.factory.includes(search) ||
      request.destinationBranch.includes(search);

    const matchesTab =
      statusTab === "all" ||
      (statusTab === "active" && !["received", "cancelled"].includes(request.status)) ||
      (statusTab === "ready" && ["ready_to_ship", "in_transit"].includes(request.status)) ||
      request.status === statusTab;

    return matchesSearch && matchesTab;
  });

  const appendTimeline = (requestId, title, body, actor = "مسؤول التصنيع") => {
    setTimelineByRequest((current) => ({
      ...current,
      [requestId]: [
        {
          id: `event-${Date.now()}`,
          actor,
          title,
          body,
          at: "الآن",
        },
        ...(current[requestId] || []),
      ],
    }));
  };

  const changeStatus = (nextStatus) => {
    const cfg = manufacturingStatusConfig[nextStatus] || manufacturingStatusConfig.draft;

    setRequests((current) => current.map((request) => {
      if (request.id !== selectedRequest.id) return request;

      const producedQty = ["quality_check", "ready_to_ship", "in_transit", "received"].includes(nextStatus)
        ? Math.max(request.producedQty, request.qty)
        : nextStatus === "in_production"
          ? Math.max(request.producedQty, Math.round(request.qty * 0.35))
          : request.producedQty;

      return {
        ...request,
        status: nextStatus,
        progress: cfg.progress,
        producedQty,
        receivedQty: nextStatus === "received" ? request.qty : request.receivedQty,
        updatedAt: "الآن",
      };
    }));

    appendTimeline(
      selectedRequest.id,
      cfg.eventTitle,
      `تم تحديث حالة الطلب إلى "${cfg.label}".`,
      "النظام"
    );
  };

  const createRequest = () => {
    const nextRequest = buildManufacturingRequest(form, requests.length + 1);

    setRequests((current) => [nextRequest, ...current]);
    setSelectedId(nextRequest.id);
    setTimelineByRequest((current) => ({
      ...current,
      [nextRequest.id]: [
        {
          id: "created",
          actor: "المستخدم الحالي",
          title: "فتح طلب تصنيع جديد",
          body: `${nextRequest.sourceLabel} لصنف ${nextRequest.productName} بكمية ${nextRequest.qty} ${nextRequest.unit}.`,
          at: "الآن",
        },
      ],
    }));
    setForm(defaultForm);
    setNewOpen(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap" mb={3}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">إدارة التصنيع</SoftTypography>
            <SoftTypography variant="body2" color="text">
              طلبات التصنيع من البيع أو نقص المخزون، مع متابعة المصنع والجودة والشحن للمقر.
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
            طلب تصنيع جديد
          </SoftButton>
        </SoftBox>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <StatCard label="طلبات نشطة" value={stats.active} color="#17c1e8" icon={FactoryIcon} sub="قيد المتابعة" />
          </Box>
          <Box>
            <StatCard label="قيد التصنيع" value={stats.inProduction} color="#7928ca" icon={PrecisionManufacturingIcon} sub="داخل خطوط الإنتاج" />
          </Box>
          <Box>
            <StatCard label="جاهزة للتسليم" value={stats.awaitingDelivery} color="#82d616" icon={LocalShippingIcon} sub="جاهزة أو في الطريق" />
          </Box>
          <Box>
            <StatCard label="عربون متبقٍ" value={`${formatDZD(stats.depositOpen)} دج`} color="#fb8c00" icon={PaidIcon} sub="طلبات تحتاج متابعة مالية" />
          </Box>
          <Box>
            <StatCard label="متأخرة" value={stats.late} color="#ea0606" icon={WarningAmberIcon} sub="تجاوزت تاريخ التسليم" />
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} xl={8}>
            <Card sx={{ overflow: "hidden" }}>
              <Box sx={{ px: 2, pt: 2, borderBottom: "1px solid #eee" }}>
                <Tabs value={statusTab} onChange={(_, value) => setStatusTab(value)} textColor="inherit" TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.key}
                      value={tab.key}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                          <SoftTypography variant="caption" fontWeight="medium">{tab.label}</SoftTypography>
                          <Chip label={tab.count} size="small" sx={{ height: 18, fontSize: 10 }} />
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Box>
              <Box sx={{ p: 2 }}>
                <TextField
                  size="small"
                  placeholder="بحث برقم الطلب، الصنف، المصنع، أو الفرع..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                  }}
                  sx={{ width: { xs: "100%", md: 360 }, mb: 2 }}
                />
                <RequestList requests={filteredRequests} selectedId={selectedId} onSelect={setSelectedId} />
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} xl={4}>
            <Card sx={{ overflow: "hidden" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: 1 }}>
                  <Box>
                    <Box sx={{ fontSize: 15, fontWeight: 900, color: "#344767" }}>{selectedRequest.productName}</Box>
                    <Box sx={{ fontSize: 11, color: "#8392ab" }}>{selectedRequest.id} · {selectedRequest.productCode}</Box>
                  </Box>
                  <StatusChip status={selectedRequest.status} />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedRequest.progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    background: "#eef1f6",
                    "& .MuiLinearProgress-bar": { background: selectedStatus.color },
                  }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.8 }}>
                  <Box sx={{ fontSize: 11, color: "#8392ab" }}>التقدم العام</Box>
                  <Box sx={{ fontSize: 11, color: "#344767", fontWeight: 800 }}>{selectedRequest.progress}%</Box>
                </Box>
              </Box>

              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 1.5 }}>
                  <TypeChip type={selectedRequest.sourceType} />
                  <Chip label={selectedPriority.label} size="small" sx={{ height: 23, fontSize: 10.5, background: selectedPriority.bg, color: selectedPriority.color, fontWeight: 800 }} />
                  <DepositChip request={selectedRequest} />
                </Box>
                <Grid container spacing={1.4}>
                  {[
                    { label: "الكمية المطلوبة", value: `${selectedRequest.qty} ${selectedRequest.unit}` },
                    { label: "الكمية المنتجة", value: `${selectedRequest.producedQty} ${selectedRequest.unit}` },
                    { label: "المقر المستلم", value: selectedRequest.destinationBranch },
                    { label: "المخزن", value: selectedRequest.destinationWarehouse },
                    { label: "المصنع", value: selectedRequest.factory },
                    { label: "خط الإنتاج", value: selectedRequest.productionLine },
                    { label: "طالب التصنيع", value: selectedRequest.requester },
                    { label: "المسؤول", value: selectedRequest.responsible },
                  ].map((item) => (
                    <Grid key={item.label} item xs={6}>
                      <Box sx={{ fontSize: 10.5, color: "#8392ab" }}>{item.label}</Box>
                      <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 800, lineHeight: 1.5 }}>{item.value}</Box>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 1.6, p: 1.3, borderRadius: 1.5, background: selectedType.bg }}>
                  <Box sx={{ fontSize: 11, color: selectedType.color, fontWeight: 900, mb: 0.4 }}>{selectedType.label}</Box>
                  <Box sx={{ fontSize: 11, color: "#67748e", lineHeight: 1.7 }}>
                    {selectedRequest.salesOrderNumber ? `${selectedRequest.salesOrderNumber} · ${selectedRequest.customerName}` : selectedType.description}
                  </Box>
                </Box>
                {selectedRequest.notes && (
                  <Box sx={{ mt: 1.4, fontSize: 11.5, color: "#67748e", lineHeight: 1.8 }}>{selectedRequest.notes}</Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 1.4 }}>
                  <Inventory2Icon sx={{ fontSize: 17, color: "#17c1e8" }} />
                  <Box sx={{ fontSize: 13, fontWeight: 900, color: "#344767" }}>المواد والحجز</Box>
                </Box>
                <Box sx={{ display: "grid", gap: 1 }}>
                  {selectedRequest.materials.map((material) => {
                    const pct = material.plannedQty ? Math.min(Math.round((material.consumedQty / material.plannedQty) * 100), 100) : 0;
                    return (
                      <Box key={material.name}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Box sx={{ fontSize: 11.5, color: "#344767", fontWeight: 800 }}>{material.name}</Box>
                          <Box sx={{ fontSize: 10.5, color: "#8392ab" }}>
                            {material.consumedQty}/{material.plannedQty} {material.unit}
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 5,
                            borderRadius: 4,
                            mt: 0.5,
                            background: "#eef1f6",
                            "& .MuiLinearProgress-bar": { background: material.reservedQty < material.plannedQty ? "#fb8c00" : "#17c1e8" },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                    <AssignmentTurnedInIcon sx={{ fontSize: 17, color: "#82d616" }} />
                    <Box sx={{ fontSize: 13, fontWeight: 900, color: "#344767" }}>الجودة والعربون</Box>
                  </Box>
                  <Box sx={{ fontSize: 11, color: "#8392ab" }}>آخر تحديث: {selectedRequest.updatedAt}</Box>
                </Box>
                <Grid container spacing={1.2}>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1, border: "1px solid #edf0f5", borderRadius: 1.5, textAlign: "center" }}>
                      <Box sx={{ fontSize: 15, fontWeight: 900, color: "#82d616" }}>{selectedRequest.quality.passed}</Box>
                      <Box sx={{ fontSize: 10, color: "#8392ab" }}>مقبول</Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1, border: "1px solid #edf0f5", borderRadius: 1.5, textAlign: "center" }}>
                      <Box sx={{ fontSize: 15, fontWeight: 900, color: "#fb8c00" }}>{selectedRequest.quality.rework}</Box>
                      <Box sx={{ fontSize: 10, color: "#8392ab" }}>إعادة عمل</Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1, border: "1px solid #edf0f5", borderRadius: 1.5, textAlign: "center" }}>
                      <Box sx={{ fontSize: 15, fontWeight: 900, color: "#ea0606" }}>{selectedRequest.quality.rejected}</Box>
                      <Box sx={{ fontSize: 10, color: "#8392ab" }}>مرفوض</Box>
                    </Box>
                  </Grid>
                </Grid>
                {selectedRequest.depositRequired && (
                  <Box sx={{ mt: 1.4, p: 1.2, borderRadius: 1.5, background: "#fff4e5" }}>
                    <Box sx={{ fontSize: 11, color: "#fb8c00", fontWeight: 900 }}>العربون</Box>
                    <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 800 }}>
                      مدفوع {formatDZD(selectedRequest.depositPaid)} من {formatDZD(selectedRequest.depositAmount)} دج
                    </Box>
                  </Box>
                )}
              </Box>

              <Box sx={{ p: 2, borderBottom: "1px solid #eee" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mb: 1.3 }}>
                  <TimelineIcon sx={{ fontSize: 17, color: "#17c1e8" }} />
                  <Box sx={{ fontSize: 13, fontWeight: 900, color: "#344767" }}>خط المتابعة</Box>
                </Box>
                <ManufacturingTimeline events={selectedTimeline} />
              </Box>

              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.5, mb: 1.5 }}>
                  {manufacturingStatusOrder.map((status) => (
                    <Tooltip key={status} title={manufacturingStatusConfig[status].label}>
                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          background:
                            selectedRequest.progress >= manufacturingStatusConfig[status].progress
                              ? manufacturingStatusConfig[status].color
                              : "#e9ecef",
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {(manufacturingNextActions[selectedRequest.status] || []).map((action) => (
                    <SoftButton
                      key={action.status}
                      variant={action.color === "secondary" ? "outlined" : "gradient"}
                      color={action.color}
                      size="small"
                      onClick={() => changeStatus(action.status)}
                    >
                      {action.label}
                    </SoftButton>
                  ))}
                  {(manufacturingNextActions[selectedRequest.status] || []).length === 0 && (
                    <Box sx={{ fontSize: 12, color: "#8392ab", fontWeight: 700 }}>لا توجد إجراءات متاحة لهذه الحالة</Box>
                  )}
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />

      <NewManufacturingDialog
        open={newOpen}
        form={form}
        onChange={setForm}
        onClose={() => setNewOpen(false)}
        onSubmit={createRequest}
      />
    </DashboardLayout>
  );
}
