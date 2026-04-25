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
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";

import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import FactoryIcon from "@mui/icons-material/Factory";
import GradingIcon from "@mui/icons-material/Grading";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaidIcon from "@mui/icons-material/Paid";
import PersonIcon from "@mui/icons-material/Person";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import SearchIcon from "@mui/icons-material/Search";
import TimelineIcon from "@mui/icons-material/Timeline";
import WarehouseIcon from "@mui/icons-material/Warehouse";
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
  low:    { label: "منخفضة", color: "#8392ab", bg: "#f8f9fa" },
  normal: { label: "عادية",  color: "#17c1e8", bg: "#e3f8fd" },
  high:   { label: "عالية",  color: "#fb8c00", bg: "#fff4e5" },
  urgent: { label: "عاجلة",  color: "#ea0606", bg: "#fde8e8" },
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

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <Card sx={{ p: 2.2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${color}bb, ${color})`,
            boxShadow: `0 4px 14px ${color}44`,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Box sx={{ fontSize: 22, fontWeight: 900, color: "#344767", lineHeight: 1.1 }}>{value}</Box>
          <Box sx={{ fontSize: 12.5, color: "#344767", fontWeight: 700, mt: 0.3 }}>{label}</Box>
          {sub && <Box sx={{ fontSize: 11, color: "#8392ab", mt: 0.2 }}>{sub}</Box>}
        </Box>
      </Box>
    </Card>
  );
}

// ─── Request Card (replaces plain table row) ──────────────────────────────────
function RequestCard({ request, selected, onClick }) {
  const cfg = manufacturingStatusConfig[request.status] || manufacturingStatusConfig.draft;
  const type = manufacturingTypeConfig[request.sourceType] || manufacturingTypeConfig.stock_replenishment;
  const priority = priorityConfig[request.priority] || priorityConfig.normal;
  const isLate =
    new Date(request.dueDate) < new Date("2025-01-21") &&
    !["received", "cancelled"].includes(request.status);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "stretch",
        borderRadius: 2,
        border: selected ? `1.5px solid ${cfg.color}` : "1.5px solid #f0f2f5",
        background: selected ? `${cfg.color}0a` : "#fff",
        mb: 1,
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.15s",
        "&:hover": { boxShadow: "0 2px 14px rgba(0,0,0,0.07)", borderColor: `${cfg.color}88` },
      }}
    >
      {/* Priority stripe on the right (RTL) */}
      <Box sx={{ width: 4, flexShrink: 0, background: priority.color }} />

      <Box sx={{ flex: 1, p: 1.4, pl: 1.6, display: "flex", flexDirection: "column", gap: 0.65, minWidth: 0 }}>
        {/* Row 1: ID + status chip + due date */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <Box sx={{ fontSize: 10.5, fontWeight: 900, color: "#17c1e8", fontFamily: "monospace" }}>{request.id}</Box>
            <Chip label={cfg.label} size="small" sx={{ height: 19, fontSize: 9.5, background: cfg.bg, color: cfg.color, fontWeight: 800 }} />
          </Box>
          <Box sx={{ fontSize: 10.5, color: isLate ? "#ea0606" : "#adb5bd", fontWeight: isLate ? 800 : 400, display: "flex", alignItems: "center", gap: 0.3, flexShrink: 0 }}>
            {isLate && <WarningAmberIcon sx={{ fontSize: 12 }} />}
            {request.dueDate}
          </Box>
        </Box>

        {/* Row 2: Product name */}
        <Box sx={{ fontSize: 13.5, fontWeight: 800, color: "#344767", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>
          {request.productName}
        </Box>

        {/* Row 3: Factory + qty + type chip */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Box sx={{ fontSize: 11, color: "#8392ab", display: "flex", alignItems: "center", gap: 0.3 }}>
            <FactoryIcon sx={{ fontSize: 12 }} />
            {request.factory}
          </Box>
          <Box sx={{ width: 3, height: 3, borderRadius: "50%", background: "#d1d5db" }} />
          <Box sx={{ fontSize: 11, color: "#67748e", fontWeight: 700 }}>{request.qty} {request.unit}</Box>
          <Chip label={type.label} size="small" sx={{ height: 17, fontSize: 9, background: type.bg, color: type.color, fontWeight: 800 }} />
        </Box>

        {/* Row 4: Progress bar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LinearProgress
            variant="determinate"
            value={request.progress}
            sx={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              background: "#eef1f6",
              "& .MuiLinearProgress-bar": { background: cfg.color, borderRadius: 3 },
            }}
          />
          <Box sx={{ fontSize: 10, color: cfg.color, fontWeight: 900, minWidth: 30, textAlign: "left" }}>{request.progress}%</Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── 8-Stage Status Pipeline Stepper ─────────────────────────────────────────
function StatusStepper({ currentStatus }) {
  const currentIdx = manufacturingStatusOrder.indexOf(currentStatus);

  return (
    <Box sx={{ overflowX: "auto", pb: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", minWidth: "max-content", gap: 0 }}>
        {manufacturingStatusOrder.map((status, idx) => {
          const cfg = manufacturingStatusConfig[status];
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isLast = idx === manufacturingStatusOrder.length - 1;

          return (
            <Box key={status} sx={{ display: "flex", alignItems: "flex-start" }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 68 }}>
                {/* Step circle */}
                <Box
                  sx={{
                    width: isCurrent ? 30 : 22,
                    height: isCurrent ? 30 : 22,
                    borderRadius: "50%",
                    background: isDone || isCurrent ? cfg.color : "#e9ecef",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isCurrent ? `0 0 0 5px ${cfg.color}28` : "none",
                    transition: "all 0.2s",
                    zIndex: 1,
                  }}
                >
                  {isDone ? (
                    <CheckCircleIcon sx={{ fontSize: 14, color: "#fff" }} />
                  ) : (
                    <Box sx={{ fontSize: 9, fontWeight: 900, color: isCurrent ? "#fff" : "#adb5bd" }}>{idx + 1}</Box>
                  )}
                </Box>
                {/* Label */}
                <Box
                  sx={{
                    fontSize: 9,
                    textAlign: "center",
                    mt: 0.6,
                    color: isCurrent ? cfg.color : isDone ? "#344767" : "#adb5bd",
                    fontWeight: isCurrent ? 900 : isDone ? 700 : 400,
                    maxWidth: 63,
                    lineHeight: 1.3,
                  }}
                >
                  {cfg.label}
                </Box>
              </Box>
              {/* Connector */}
              {!isLast && (
                <Box
                  sx={{
                    height: 3,
                    width: 16,
                    mt: "9px",
                    background: idx < currentIdx ? cfg.color : "#e9ecef",
                    borderRadius: 2,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, iconColor = "#17c1e8", right }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1.5,
            background: `${iconColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ fontSize: 15, color: iconColor }} />
        </Box>
        <Box sx={{ fontSize: 13, fontWeight: 900, color: "#344767" }}>{label}</Box>
      </Box>
      {right}
    </Box>
  );
}

// ─── Materials Section ────────────────────────────────────────────────────────
function MaterialsSection({ materials }) {
  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      {materials.map((mat) => {
        const reservedPct = mat.plannedQty
          ? Math.min(Math.round((mat.reservedQty / mat.plannedQty) * 100), 100)
          : 0;
        const consumedPct = mat.plannedQty
          ? Math.min(Math.round((mat.consumedQty / mat.plannedQty) * 100), 100)
          : 0;
        const fullyReserved = mat.reservedQty >= mat.plannedQty;

        return (
          <Box key={mat.name} sx={{ p: 1.3, borderRadius: 2, background: "#f8f9fb", border: "1px solid #edf0f5" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
              <Box sx={{ fontSize: 12, fontWeight: 800, color: "#344767" }}>{mat.name}</Box>
              <Chip
                label={`محجوز ${mat.reservedQty}/${mat.plannedQty}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 9,
                  background: fullyReserved ? "#e7f9f0" : "#fff4e5",
                  color: fullyReserved ? "#2dce89" : "#fb8c00",
                  fontWeight: 800,
                }}
              />
            </Box>
            {/* Stacked progress: reserved (light) + consumed (solid) */}
            <Box sx={{ position: "relative", height: 8, borderRadius: 4, background: "#e9ecef", overflow: "hidden" }}>
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  height: "100%",
                  width: `${reservedPct}%`,
                  background: "#17c1e830",
                  borderRadius: 4,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  height: "100%",
                  width: `${consumedPct}%`,
                  background: "#17c1e8",
                  borderRadius: 4,
                }}
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Box sx={{ fontSize: 9.5, color: "#8392ab" }}>مستهلك: {mat.consumedQty} {mat.unit}</Box>
              <Box sx={{ fontSize: 9.5, color: "#8392ab" }}>مخطط: {mat.plannedQty} {mat.unit}</Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Quality Section ──────────────────────────────────────────────────────────
function QualitySection({ quality }) {
  const total = quality.passed + quality.rework + quality.rejected;
  const passRate = total > 0 ? Math.round((quality.passed / total) * 100) : 0;
  const passColor = passRate >= 90 ? "#2dce89" : passRate >= 70 ? "#fb8c00" : "#ea0606";

  return (
    <Box>
      {total > 0 && (
        <Box sx={{ mb: 1.4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Box sx={{ fontSize: 11.5, color: "#67748e" }}>معدل النجاح</Box>
            <Box sx={{ fontSize: 13, fontWeight: 900, color: passColor }}>{passRate}%</Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={passRate}
            sx={{
              height: 7,
              borderRadius: 4,
              background: "#fde8e8",
              "& .MuiLinearProgress-bar": { background: passColor, borderRadius: 4 },
            }}
          />
        </Box>
      )}
      <Grid container spacing={1}>
        {[
          { label: "مقبول",       value: quality.passed,   color: "#2dce89", bg: "#e7f9f0" },
          { label: "إعادة عمل",   value: quality.rework,   color: "#fb8c00", bg: "#fff4e5" },
          { label: "مرفوض",       value: quality.rejected, color: "#ea0606", bg: "#fde8e8" },
        ].map((item) => (
          <Grid key={item.label} item xs={4}>
            <Box
              sx={{
                p: 1.3,
                borderRadius: 2,
                background: item.bg,
                border: `1.5px solid ${item.color}22`,
                textAlign: "center",
              }}
            >
              <Box sx={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.value}</Box>
              <Box sx={{ fontSize: 10, color: item.color, fontWeight: 700, mt: 0.3, opacity: 0.85 }}>{item.label}</Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function ManufacturingTimeline({ events }) {
  const dotPalette = ["#17c1e8", "#7928ca", "#82d616", "#fb8c00", "#2dce89"];

  return (
    <Box sx={{ display: "grid", gap: 0 }}>
      {events.map((event, index) => {
        const dotColor = dotPalette[index % dotPalette.length];
        const nextDot = dotPalette[(index + 1) % dotPalette.length];
        return (
          <Box key={event.id} sx={{ display: "flex", gap: 1.2, alignItems: "flex-start" }}>
            {/* Dot + connector */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: dotColor,
                  boxShadow: `0 0 0 3px ${dotColor}28`,
                  mt: "3px",
                  flexShrink: 0,
                }}
              />
              {index < events.length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 32,
                    background: `linear-gradient(${dotColor}55, ${nextDot}55)`,
                    my: 0.4,
                    borderRadius: 2,
                  }}
                />
              )}
            </Box>
            {/* Content */}
            <Box sx={{ pb: index < events.length - 1 ? 1.5 : 0, flex: 1 }}>
              <Box sx={{ fontSize: 12, fontWeight: 800, color: "#344767" }}>{event.title}</Box>
              <Box sx={{ fontSize: 10.5, color: "#8392ab", mt: 0.2, mb: 0.5, display: "flex", alignItems: "center", gap: 0.4 }}>
                <PersonIcon sx={{ fontSize: 11 }} />
                {event.actor} · {event.at}
              </Box>
              <Box
                sx={{
                  fontSize: 11.5,
                  color: "#67748e",
                  lineHeight: 1.7,
                  background: "#f8f9fb",
                  p: 1,
                  borderRadius: 1.5,
                  borderRight: `2px solid ${dotColor}`,
                }}
              >
                {event.body}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── New Request Dialog ───────────────────────────────────────────────────────
function NewManufacturingDialog({ open, form, onChange, onClose, onSubmit }) {
  const setField = (field) => (event) => {
    const value = field === "depositRequired" ? event.target.value === "yes" : event.target.value;
    onChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: "linear-gradient(135deg, #17c1e8, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PrecisionManufacturingIcon sx={{ fontSize: 20, color: "#fff" }} />
          </Box>
          <Box sx={{ fontWeight: 800, color: "#344767", fontSize: 16 }}>طلب تصنيع جديد</Box>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "20px !important" }}>
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
            <TextField fullWidth size="small" label="وحدة" value={form.unit} onChange={setField("unit")} />
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
            <TextField fullWidth size="small" label="اسم الزبون" value={form.customerName} onChange={setField("customerName")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="المخزن المستلم" value={form.destinationWarehouse} onChange={setField("destinationWarehouse")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="الفرع / المقر" value={form.destinationBranch} onChange={setField("destinationBranch")} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="تاريخ التسليم" type="date" value={form.dueDate} onChange={setField("dueDate")} InputLabelProps={{ shrink: true }} />
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
              label="قيمة العربون (دج)"
              type="number"
              value={form.depositAmount}
              onChange={setField("depositAmount")}
              disabled={!form.depositRequired}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size="small" label="ملاحظات التصنيع" value={form.notes} onChange={setField("notes")} multiline rows={2} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: "1px solid #eee" }}>
        <SoftButton variant="outlined" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" onClick={onSubmit} startIcon={<AddIcon />}>إنشاء الطلب</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Manufacturing() {
  const [requests, setRequests] = useState(mockManufacturingRequests);
  const [selectedId, setSelectedId] = useState(mockManufacturingRequests[0].id);
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");
  const [timelineByRequest, setTimelineByRequest] = useState(manufacturingTimeline);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const selectedRequest = requests.find((r) => r.id === selectedId) || requests[0];
  const selectedStatus = manufacturingStatusConfig[selectedRequest.status] || manufacturingStatusConfig.draft;
  const selectedType = manufacturingTypeConfig[selectedRequest.sourceType] || manufacturingTypeConfig.stock_replenishment;
  const selectedPriority = priorityConfig[selectedRequest.priority] || priorityConfig.normal;
  const selectedTimeline = timelineByRequest[selectedRequest.id] || [];
  const stats = useMemo(() => getManufacturingStats(requests), [requests]);

  const tabs = [
    { key: "all",          label: "الكل",              count: requests.length },
    { key: "active",       label: "نشطة",              count: stats.active },
    { key: "in_production",label: "قيد التصنيع",      count: stats.inProduction },
    { key: "ready",        label: "جاهزة/في الطريق",  count: stats.awaitingDelivery },
    { key: "received",     label: "مستلمة",            count: requests.filter((r) => r.status === "received").length },
  ];

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.includes(search) ||
      r.productCode.toLowerCase().includes(search.toLowerCase()) ||
      r.factory.includes(search) ||
      r.destinationBranch.includes(search);
    const matchTab =
      statusTab === "all" ||
      (statusTab === "active" && !["received", "cancelled"].includes(r.status)) ||
      (statusTab === "ready" && ["ready_to_ship", "in_transit"].includes(r.status)) ||
      r.status === statusTab;
    return matchSearch && matchTab;
  });

  const appendTimeline = (reqId, title, body, actor = "النظام") => {
    setTimelineByRequest((prev) => ({
      ...prev,
      [reqId]: [{ id: `ev-${Date.now()}`, actor, title, body, at: "الآن" }, ...(prev[reqId] || [])],
    }));
  };

  const changeStatus = (nextStatus) => {
    const cfg = manufacturingStatusConfig[nextStatus] || manufacturingStatusConfig.draft;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== selectedRequest.id) return r;
        const producedQty =
          ["quality_check", "ready_to_ship", "in_transit", "received"].includes(nextStatus)
            ? Math.max(r.producedQty, r.qty)
            : nextStatus === "in_production"
            ? Math.max(r.producedQty, Math.round(r.qty * 0.35))
            : r.producedQty;
        return {
          ...r,
          status: nextStatus,
          progress: cfg.progress,
          producedQty,
          receivedQty: nextStatus === "received" ? r.qty : r.receivedQty,
          updatedAt: "الآن",
        };
      })
    );
    appendTimeline(selectedRequest.id, cfg.eventTitle, `تم تحديث حالة الطلب إلى "${cfg.label}".`);
  };

  const createRequest = () => {
    const newReq = buildManufacturingRequest(form, requests.length + 1);
    setRequests((prev) => [newReq, ...prev]);
    setSelectedId(newReq.id);
    setTimelineByRequest((prev) => ({
      ...prev,
      [newReq.id]: [{
        id: "created",
        actor: "المستخدم الحالي",
        title: "فتح طلب تصنيع جديد",
        body: `${newReq.sourceLabel} لصنف ${newReq.productName} بكمية ${newReq.qty} ${newReq.unit}.`,
        at: "الآن",
      }],
    }));
    setForm(defaultForm);
    setNewOpen(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* ── Page Header ── */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", mb: 3 }}>
          <Box>
            <SoftTypography variant="h4" fontWeight="bold">إدارة التصنيع</SoftTypography>
            <SoftTypography variant="body2" color="text">
              متابعة طلبات التصنيع من الإنشاء حتى الاستلام — جودة، مواد، شحن.
            </SoftTypography>
          </Box>
          <SoftButton variant="gradient" color="info" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
            طلب تصنيع جديد
          </SoftButton>
        </Box>

        {/* ── KPI Cards ── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard label="طلبات نشطة"    value={stats.active}                           color="#17c1e8" icon={FactoryIcon}               sub="قيد المتابعة" />
          <StatCard label="قيد التصنيع"   value={stats.inProduction}                     color="#7928ca" icon={PrecisionManufacturingIcon} sub="داخل خطوط الإنتاج" />
          <StatCard label="جاهزة للتسليم" value={stats.awaitingDelivery}                 color="#82d616" icon={LocalShippingIcon}          sub="جاهزة أو في الطريق" />
          <StatCard label="عربون متبقٍ"   value={`${formatDZD(stats.depositOpen)} دج`}  color="#fb8c00" icon={PaidIcon}                  sub="يحتاج متابعة مالية" />
          <StatCard label="متأخرة"        value={stats.late}                             color="#ea0606" icon={WarningAmberIcon}           sub="تجاوزت تاريخ التسليم" />
        </Box>

        {/* ── Main split layout ── */}
        <Grid container spacing={2.5}>
          {/* Left: Request list */}
          <Grid item xs={12} xl={5}>
            <Card sx={{ overflow: "hidden" }}>
              {/* Tabs */}
              <Box sx={{ borderBottom: "1px solid #f0f2f5" }}>
                <Tabs
                  value={statusTab}
                  onChange={(_, v) => setStatusTab(v)}
                  textColor="inherit"
                  variant="scrollable"
                  scrollButtons="auto"
                  TabIndicatorProps={{ style: { background: "#17c1e8", height: 3 } }}
                  sx={{ minHeight: 44, px: 1 }}
                >
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.key}
                      value={tab.key}
                      sx={{ minHeight: 44, py: 0 }}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                          <Box sx={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</Box>
                          <Chip
                            label={tab.count}
                            size="small"
                            sx={{ height: 17, fontSize: 9.5, "& .MuiChip-label": { px: 0.8 } }}
                          />
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Box>

              {/* Search */}
              <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="بحث برقم الطلب، الصنف، المصنع..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "#8392ab" }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Cards list */}
              <Box sx={{ p: 1.5, pt: 0.5, overflowY: "auto", maxHeight: 600 }}>
                {filteredRequests.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6, color: "#8392ab", fontSize: 13 }}>
                    لا توجد طلبات تطابق البحث
                  </Box>
                ) : (
                  filteredRequests.map((r) => (
                    <RequestCard
                      key={r.id}
                      request={r}
                      selected={r.id === selectedId}
                      onClick={() => setSelectedId(r.id)}
                    />
                  ))
                )}
              </Box>
            </Card>
          </Grid>

          {/* Right: Detail panel */}
          <Grid item xs={12} xl={7}>
            <Card sx={{ overflow: "hidden" }}>
              {/* ── Detail Header (status-colored gradient) ── */}
              <Box
                sx={{
                  p: 2.5,
                  background: `linear-gradient(135deg, ${selectedStatus.color}ee 0%, ${selectedStatus.color}99 100%)`,
                  color: "#fff",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1.5 }}>
                  <Box>
                    <Box sx={{ fontSize: 18, fontWeight: 900, lineHeight: 1.3 }}>{selectedRequest.productName}</Box>
                    <Box sx={{ fontSize: 11.5, opacity: 0.8, mt: 0.3, fontFamily: "monospace" }}>
                      {selectedRequest.id} · {selectedRequest.productCode}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0 }}>
                    <Chip
                      label={selectedPriority.label}
                      size="small"
                      sx={{ height: 22, fontSize: 10.5, background: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 800 }}
                    />
                    {selectedRequest.depositRequired && (
                      <Chip
                        label={depositStatusConfig[selectedRequest.depositStatus]?.label}
                        size="small"
                        sx={{ height: 22, fontSize: 10.5, background: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 800 }}
                      />
                    )}
                  </Box>
                </Box>

                {/* Overall progress bar */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.6 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedRequest.progress}
                    sx={{
                      flex: 1,
                      height: 8,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.3)",
                      "& .MuiLinearProgress-bar": { background: "#fff", borderRadius: 4 },
                    }}
                  />
                  <Box sx={{ fontSize: 16, fontWeight: 900, minWidth: 36 }}>{selectedRequest.progress}%</Box>
                </Box>
                <Box sx={{ fontSize: 11, opacity: 0.8 }}>
                  أنتج {selectedRequest.producedQty} من {selectedRequest.qty} {selectedRequest.unit} · موعد التسليم: {selectedRequest.dueDate}
                </Box>
              </Box>

              {/* ── Status Pipeline Stepper ── */}
              <Box sx={{ px: 2, py: 1.5, background: "#f8f9fb", borderBottom: "1px solid #edf0f5" }}>
                <StatusStepper currentStatus={selectedRequest.status} />
              </Box>

              {/* ── Scrollable body ── */}
              <Box sx={{ overflowY: "auto", maxHeight: 580 }}>
                {/* Details grid */}
                <Box sx={{ p: 2, borderBottom: "1px solid #f0f2f5" }}>
                  <SectionHeader icon={FactoryIcon} label="تفاصيل الطلب" iconColor="#7928ca" />
                  <Grid container spacing={1.2}>
                    {[
                      { label: "المصنع",         value: selectedRequest.factory,              icon: FactoryIcon },
                      { label: "خط الإنتاج",      value: selectedRequest.productionLine,       icon: PrecisionManufacturingIcon },
                      { label: "الفرع المستلم",   value: selectedRequest.destinationBranch,    icon: LocalShippingIcon },
                      { label: "المخزن",          value: selectedRequest.destinationWarehouse, icon: WarehouseIcon },
                      { label: "طالب التصنيع",    value: selectedRequest.requester,            icon: PersonIcon },
                      { label: "المسؤول",         value: selectedRequest.responsible,          icon: PersonIcon },
                    ].map((item) => (
                      <Grid key={item.label} item xs={6} md={4}>
                        <Box sx={{ p: 1.2, borderRadius: 1.5, background: "#f8f9fb", border: "1px solid #edf0f5", height: "100%" }}>
                          <Box sx={{ fontSize: 10, color: "#8392ab", mb: 0.4, display: "flex", alignItems: "center", gap: 0.4 }}>
                            <item.icon sx={{ fontSize: 10 }} />
                            {item.label}
                          </Box>
                          <Box sx={{ fontSize: 12, color: "#344767", fontWeight: 800, lineHeight: 1.4 }}>{item.value}</Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Source type info */}
                  <Box sx={{ mt: 1.3, p: 1.3, borderRadius: 2, background: selectedType.bg, border: `1px solid ${selectedType.color}22` }}>
                    <Box sx={{ fontSize: 11, color: selectedType.color, fontWeight: 900, mb: 0.3 }}>{selectedType.label}</Box>
                    <Box sx={{ fontSize: 11.5, color: "#67748e" }}>
                      {selectedRequest.salesOrderNumber
                        ? `${selectedRequest.salesOrderNumber} — ${selectedRequest.customerName}`
                        : selectedType.description}
                    </Box>
                  </Box>

                  {/* Notes */}
                  {selectedRequest.notes && (
                    <Box
                      sx={{
                        mt: 1.2,
                        p: 1.2,
                        borderRadius: 1.5,
                        background: "#fffbea",
                        border: "1px solid #fce38a",
                        fontSize: 12,
                        color: "#67748e",
                        lineHeight: 1.8,
                      }}
                    >
                      {selectedRequest.notes}
                    </Box>
                  )}
                </Box>

                {/* Materials */}
                <Box sx={{ p: 2, borderBottom: "1px solid #f0f2f5" }}>
                  <SectionHeader icon={Inventory2Icon} label="المواد والحجز" iconColor="#17c1e8" />
                  <MaterialsSection materials={selectedRequest.materials} />
                </Box>

                {/* Quality + Deposit */}
                <Box sx={{ p: 2, borderBottom: "1px solid #f0f2f5" }}>
                  <SectionHeader
                    icon={GradingIcon}
                    label="فحص الجودة"
                    iconColor="#82d616"
                    right={
                      selectedRequest.quality.lastCheck
                        ? <Box sx={{ fontSize: 10.5, color: "#8392ab" }}>آخر فحص: {selectedRequest.quality.lastCheck}</Box>
                        : null
                    }
                  />
                  <QualitySection quality={selectedRequest.quality} />

                  {selectedRequest.depositRequired && (
                    <Box sx={{ mt: 1.6, p: 1.4, borderRadius: 2, background: "#fff4e5", border: "1px solid #fb8c0022" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.7 }}>
                        <Box sx={{ fontSize: 12, fontWeight: 900, color: "#fb8c00" }}>العربون</Box>
                        <Box sx={{ fontSize: 11, color: "#8392ab" }}>{depositStatusConfig[selectedRequest.depositStatus]?.label}</Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={selectedRequest.depositAmount > 0 ? (selectedRequest.depositPaid / selectedRequest.depositAmount) * 100 : 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          background: "#ffe0b2",
                          "& .MuiLinearProgress-bar": { background: "#fb8c00" },
                        }}
                      />
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.6 }}>
                        <Box sx={{ fontSize: 10.5, color: "#8392ab" }}>مدفوع: {formatDZD(selectedRequest.depositPaid)} دج</Box>
                        <Box sx={{ fontSize: 10.5, color: "#8392ab" }}>الإجمالي: {formatDZD(selectedRequest.depositAmount)} دج</Box>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Timeline */}
                <Box sx={{ p: 2, borderBottom: "1px solid #f0f2f5" }}>
                  <SectionHeader icon={TimelineIcon} label="سجل الأحداث" iconColor="#344767" />
                  <ManufacturingTimeline events={selectedTimeline} />
                </Box>

                {/* Action buttons */}
                <Box sx={{ p: 2 }}>
                  <SectionHeader icon={AssignmentTurnedInIcon} label="الإجراءات المتاحة" iconColor="#2dce89" />
                  {(manufacturingNextActions[selectedRequest.status] || []).length === 0 ? (
                    <Box sx={{ py: 2.5, textAlign: "center", fontSize: 13, color: "#8392ab", background: "#f8f9fb", borderRadius: 2 }}>
                      لا توجد إجراءات متاحة لهذه الحالة
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {(manufacturingNextActions[selectedRequest.status] || []).map((action) => (
                        <SoftButton
                          key={action.status}
                          variant={action.color === "secondary" ? "outlined" : "gradient"}
                          color={action.color}
                          onClick={() => changeStatus(action.status)}
                          sx={{ flex: "1 1 auto", minWidth: 130 }}
                        >
                          {action.label}
                        </SoftButton>
                      ))}
                    </Box>
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
