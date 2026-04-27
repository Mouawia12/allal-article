/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const DIM_TYPES = [
  { type: "cost_center",   label: "مركز التكلفة",    color: "#17c1e8" },
  { type: "wilaya",        label: "الولاية",          color: "#82d616" },
  { type: "salesperson",   label: "البائع",           color: "#fb8c00" },
  { type: "warehouse",     label: "المخزن",           color: "#7928ca" },
  { type: "delivery_route", label: "مسار التوزيع",   color: "#344767" },
];

const initialDimensions = {
  cost_center: [
    { id: 1, code: "CC-ADM", name: "الإدارة",         active: true },
    { id: 2, code: "CC-SAL", name: "المبيعات",        active: true },
    { id: 3, code: "CC-LOG", name: "اللوجستيك",       active: true },
    { id: 4, code: "CC-MFG", name: "التصنيع",         active: false },
  ],
  wilaya: [
    { id: 1, code: "16", name: "الجزائر",   active: true },
    { id: 2, code: "31", name: "وهران",     active: true },
    { id: 3, code: "25", name: "قسنطينة",   active: true },
    { id: 4, code: "06", name: "بجاية",     active: true },
  ],
  salesperson: [
    { id: 1, code: "SP-01", name: "كريم منصور",    active: true },
    { id: 2, code: "SP-02", name: "نادية بوعزيز",  active: true },
    { id: 3, code: "SP-03", name: "يوسف عمراني",   active: false },
  ],
  warehouse: [
    { id: 1, code: "WH-01", name: "المستودع الرئيسي",   active: true },
    { id: 2, code: "WH-02", name: "مستودع الجنوب",      active: true },
  ],
  delivery_route: [
    { id: 1, code: "RT-01", name: "مسار الشمال",    active: true },
    { id: 2, code: "RT-02", name: "مسار الوسط",     active: true },
    { id: 3, code: "RT-03", name: "مسار الجنوب",    active: true },
  ],
};

const mockProfitByDim = [
  { dim: "الجزائر",   revenue: 18500000, cogs: 12000000, gross: 6500000 },
  { dim: "وهران",     revenue: 12000000, cogs: 7800000,  gross: 4200000 },
  { dim: "قسنطينة",   revenue: 9800000,  cogs: 6400000,  gross: 3400000 },
  { dim: "بجاية",     revenue: 5300000,  cogs: 3200000,  gross: 2100000 },
];

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(n ?? 0) + " دج";

function DimDialog({ item, onClose, onSave }) {
  const [form, setForm] = useState(item ?? { code: "", name: "", active: true });
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">{item ? "تعديل بُعد" : "إضافة بُعد"}</SoftTypography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="الكود" size="small" fullWidth value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
          <TextField label="الاسم" size="small" fullWidth value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          <SoftBox display="flex" gap={1} justifyContent="flex-end">
            <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
            <SoftButton variant="gradient" color="info" size="small" onClick={() => onSave(form)}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> حفظ
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </DialogContent>
    </Dialog>
  );
}

function DimTable({ items, onEdit, onAdd }) {
  return (
    <>
      <SoftBox display="flex" justifyContent="flex-end" mb={1}>
        <SoftButton variant="outlined" color="info" size="small" onClick={onAdd}>
          <AddIcon sx={{ mr: 0.5, fontSize: 14 }} /> إضافة
        </SoftButton>
      </SoftBox>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الكود</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الاسم</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الحالة</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} hover sx={{ opacity: item.active ? 1 : 0.5 }}>
                <TableCell><SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>{item.code}</SoftTypography></TableCell>
                <TableCell><SoftTypography variant="caption" fontWeight="bold">{item.name}</SoftTypography></TableCell>
                <TableCell>
                  <Chip label={item.active ? "نشط" : "معطل"} size="small" color={item.active ? "success" : "default"} sx={{ fontSize: "0.7rem" }} />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => onEdit(item)}><EditIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default function Dimensions() {
  const [tab, setTab] = useState(0);
  const [dims, setDims] = useState(initialDimensions);
  const [dialog, setDialog] = useState(null); // null | "new" | item

  const currentType = DIM_TYPES[tab];
  const currentItems = dims[currentType.type] ?? [];

  const handleSave = (form) => {
    const type = currentType.type;
    if (dialog === "new") {
      setDims((p) => ({ ...p, [type]: [...(p[type] ?? []), { ...form, id: Date.now() }] }));
    } else {
      setDims((p) => ({ ...p, [type]: p[type].map((d) => d.id === dialog.id ? { ...d, ...form } : d) }));
    }
    setDialog(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h5" fontWeight="bold">الأبعاد ومراكز التكلفة</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            تعريف الأبعاد التحليلية المستخدمة في القيود وتقارير الربحية
          </SoftTypography>
        </SoftBox>

        {/* Stats */}
        <Grid container spacing={2} mb={3}>
          {DIM_TYPES.map((dt) => {
            const count = (dims[dt.type] ?? []).filter((d) => d.active).length;
            return (
              <Grid item xs={6} sm={4} md={2.4} key={dt.type}>
                <Card sx={{ p: 1.5, textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">{dt.label}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: dt.color }}>{count}</SoftTypography>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Grid container spacing={2}>
          {/* Dimensions list */}
          <Grid item xs={12} md={7}>
            <Card>
              <SoftBox px={2} pt={2}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: "1px solid #e9ecef", mb: 2 }}>
                  {DIM_TYPES.map((dt, i) => (
                    <Tab key={dt.type} label={dt.label} sx={{ fontSize: "0.75rem", minWidth: "unset", px: 1.5 }} />
                  ))}
                </Tabs>
              </SoftBox>
              <SoftBox px={2} pb={2}>
                <DimTable
                  items={currentItems}
                  onEdit={(item) => setDialog(item)}
                  onAdd={() => setDialog("new")}
                />
              </SoftBox>
            </Card>
          </Grid>

          {/* Profitability report */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>تقرير الربحية حسب الولاية</SoftTypography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الولاية</TableCell>
                      <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>إيرادات</TableCell>
                      <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>تكلفة</TableCell>
                      <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>هامش</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockProfitByDim.map((r) => {
                      const pct = r.revenue > 0 ? Math.round((r.gross / r.revenue) * 100) : 0;
                      return (
                        <TableRow key={r.dim} hover>
                          <TableCell><SoftTypography variant="caption" fontWeight="bold">{r.dim}</SoftTypography></TableCell>
                          <TableCell><SoftTypography variant="caption">{fmt(r.revenue)}</SoftTypography></TableCell>
                          <TableCell><SoftTypography variant="caption">{fmt(r.cogs)}</SoftTypography></TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#82d616" }}>
                              {fmt(r.gross)} <small>({pct}%)</small>
                            </SoftTypography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <SoftBox mt={2} p={1} sx={{ background: "#f8f9fa", borderRadius: 1 }}>
                <SoftTypography variant="caption" color="secondary">
                  الأبعاد تُربط تلقائياً بالقيود من مصدر العملية (طلبية → ولاية الزبون، بائع، مخزن).
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>

        {dialog && (
          <DimDialog
            item={dialog === "new" ? null : dialog}
            onClose={() => setDialog(null)}
            onSave={handleSave}
          />
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
