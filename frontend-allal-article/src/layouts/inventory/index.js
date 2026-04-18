/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockInventory = [
  { id: 1,  code: "BRG-010-50", name: "برغي M10 × 50mm",    category: "مسامير وبراغي", unit: "قطعة", onHand: 850,  reserved: 200, pending: 100, minStock: 100, color: "#FF6B6B" },
  { id: 2,  code: "BRG-008-30", name: "برغي M8 × 30mm",     category: "مسامير وبراغي", unit: "قطعة", onHand: 1200, reserved: 300, pending: 200, minStock: 200, color: "#FF6B6B" },
  { id: 3,  code: "SAM-010",    name: "صامولة M10",          category: "مسامير وبراغي", unit: "قطعة", onHand: 600,  reserved: 150, pending: 80,  minStock: 100, color: "#FF8E53" },
  { id: 4,  code: "MFT-017",    name: "مفتاح ربط 17mm",     category: "أدوات",          unit: "قطعة", onHand: 45,   reserved: 10,  pending: 5,   minStock: 20,  color: "#4ECDC4" },
  { id: 5,  code: "MFT-022",    name: "مفتاح ربط 22mm",     category: "أدوات",          unit: "قطعة", onHand: 30,   reserved: 5,   pending: 10,  minStock: 15,  color: "#4ECDC4" },
  { id: 6,  code: "KMA-UNI",    name: "كماشة عالمية",        category: "أدوات",          unit: "قطعة", onHand: 0,    reserved: 0,   pending: 5,   minStock: 10,  color: "#4ECDC4" },
  { id: 7,  code: "KBL-25",     name: "كابل كهربائي 2.5mm", category: "كهرباء",         unit: "متر",  onHand: 500,  reserved: 100, pending: 200, minStock: 100, color: "#FFE66D" },
  { id: 8,  code: "KBL-15",     name: "كابل كهربائي 1.5mm", category: "كهرباء",         unit: "متر",  onHand: 800,  reserved: 150, pending: 100, minStock: 100, color: "#FFE66D" },
  { id: 9,  code: "SHR-EL",     name: "شريط عازل كهربائي",  category: "كهرباء",         unit: "لفة",  onHand: 200,  reserved: 30,  pending: 20,  minStock: 50,  color: "#F7DC6F" },
  { id: 10, code: "ANB-PVC-2",  name: "أنبوب PVC 2 بوصة",  category: "سباكة",          unit: "متر",  onHand: 100,  reserved: 40,  pending: 30,  minStock: 30,  color: "#A8E6CF" },
  { id: 11, code: "ANB-PVC-1",  name: "أنبوب PVC 1 بوصة",  category: "سباكة",          unit: "متر",  onHand: 15,   reserved: 10,  pending: 5,   minStock: 20,  color: "#A8E6CF" },
  { id: 12, code: "DHN-WHT-4",  name: "دهان أبيض 4L",       category: "دهانات",         unit: "علبة", onHand: 80,   reserved: 20,  pending: 10,  minStock: 20,  color: "#DDA0DD" },
];

function getStatus(item) {
  const available = item.onHand - item.reserved;
  if (item.onHand === 0) return { label: "نفذ", color: "error",   icon: "error" };
  if (available <= item.minStock) return { label: "منخفض", color: "warning", icon: "warning" };
  return { label: "متوفر", color: "success", icon: "check" };
}

// ─── Summary Stats ────────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, color, icon: Icon }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <SoftBox display="flex" alignItems="center" gap={2}>
        <SoftBox
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: `linear-gradient(195deg, ${color}99, ${color})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: "#fff", fontSize: 24 }} />
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="h4" fontWeight="bold">{value}</SoftTypography>
          <SoftTypography variant="caption" color="text">{label}</SoftTypography>
          {sub && <SoftTypography variant="caption" color="secondary" display="block">{sub}</SoftTypography>}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Inventory() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  const filterStatus = ["all", "out", "low", "ok"][tab];

  const filtered = mockInventory.filter((item) => {
    const status = getStatus(item);
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "out" && item.onHand === 0) ||
      (filterStatus === "low" && item.onHand > 0 && item.onHand - item.reserved <= item.minStock) ||
      (filterStatus === "ok"  && item.onHand > 0 && item.onHand - item.reserved > item.minStock);

    const matchSearch =
      item.name.includes(search) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.category.includes(search);

    return matchStatus && matchSearch;
  });

  const outCount = mockInventory.filter(i => i.onHand === 0).length;
  const lowCount = mockInventory.filter(i => i.onHand > 0 && i.onHand - i.reserved <= i.minStock).length;
  const okCount  = mockInventory.filter(i => i.onHand > 0 && i.onHand - i.reserved > i.minStock).length;
  const totalReserved = mockInventory.reduce((s, i) => s + i.reserved, 0);
  const totalPending  = mockInventory.reduce((s, i) => s + i.pending, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">المخزون</SoftTypography>
            <SoftTypography variant="body2" color="text">متابعة مستويات المخزون لجميع الأصناف</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color="secondary" size="small">
              تحديث المخزون
            </SoftButton>
            <SoftButton variant="gradient" color="info" size="small" startIcon={<TrendingUpIcon />}>
              تقرير المخزون
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="نفذت من المخزون" value={outCount}       color="#ea0606" icon={ErrorIcon} sub="تحتاج تموين فوري" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="مخزون منخفض"    value={lowCount}       color="#fb8c00" icon={WarningIcon} sub="دون حد التنبيه" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="متوفرة بشكل جيد" value={okCount}       color="#66BB6A" icon={CheckCircleIcon} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <SummaryCard label="محجوز حالياً"    value={totalReserved} color="#17c1e8" icon={TrendingUpIcon} sub={`${totalPending} في انتظار`} />
          </Grid>
        </Grid>

        {/* Table Card */}
        <Card>
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {[
                { label: "الكل",           count: mockInventory.length },
                { label: "نفذ",            count: outCount },
                { label: "منخفض",          count: lowCount },
                { label: "متوفر",          count: okCount },
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
            <TextField
              size="small"
              placeholder="بحث بالصنف، الكود، أو الفئة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              }}
              sx={{ width: 320, mb: 2 }}
            />

            <SoftBox sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {[
                      "الصنف", "الفئة",
                      "الكمية الفعلية", "المحجوز", "الطلبيات غير المؤكدة",
                      "المتاح", "المتوقع", "حد التنبيه",
                      "الحالة", "إجراء",
                    ].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const status = getStatus(item);
                    const available = item.onHand - item.reserved;
                    const projected = available - item.pending;
                    const usedPct = item.onHand > 0 ? Math.round((item.reserved / item.onHand) * 100) : 0;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: "1px solid #f0f2f5",
                          background: item.onHand === 0 ? "#fff5f5" : available <= item.minStock ? "#fffbeb" : (i % 2 === 0 ? "#fff" : "#fafbfc"),
                        }}
                      >
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBox display="flex" alignItems="center" gap={1.5}>
                            <SoftBox
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                background: `linear-gradient(135deg, ${item.color}66, ${item.color})`,
                                flexShrink: 0,
                              }}
                            />
                            <SoftBox>
                              <SoftTypography variant="caption" fontWeight="bold" display="block">{item.name}</SoftTypography>
                              <SoftTypography variant="caption" color="secondary">{item.code}</SoftTypography>
                            </SoftBox>
                          </SoftBox>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftTypography variant="caption" color="text">{item.category}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBox>
                            <SoftTypography variant="caption" fontWeight="bold">{item.onHand} {item.unit}</SoftTypography>
                            <LinearProgress
                              variant="determinate"
                              value={usedPct}
                              sx={{
                                height: 4, borderRadius: 2, bgcolor: "#e9ecef", mt: 0.5, width: 70,
                                "& .MuiLinearProgress-bar": { background: usedPct > 80 ? "#ea0606" : usedPct > 50 ? "#fb8c00" : "#66BB6A" },
                              }}
                            />
                          </SoftBox>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="warning" fontWeight="bold">{item.reserved}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="text">{item.pending}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography
                            variant="caption"
                            fontWeight="bold"
                            color={available <= 0 ? "error" : available <= item.minStock ? "warning" : "success"}
                          >
                            {available}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color={projected < 0 ? "error" : "text"}>
                            {projected}
                          </SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <SoftTypography variant="caption" color="secondary">{item.minStock}</SoftTypography>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBadge
                            variant="gradient"
                            color={status.color}
                            size="xs"
                            badgeContent={status.label}
                            container
                          />
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <SoftBox display="flex" gap={0.5}>
                            <Tooltip title="إضافة مخزون">
                              <IconButton size="small" color="success" sx={{ border: "1px solid #e0e0e0", p: 0.4 }}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="تعديل">
                              <IconButton size="small" sx={{ border: "1px solid #e0e0e0", p: 0.4 }}>
                                <EditIcon fontSize="small" />
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
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Inventory;
