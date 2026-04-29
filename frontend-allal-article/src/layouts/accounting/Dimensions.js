/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
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
import { accountingApi } from "services";

const DIM_TYPE_META = {
  cost_center:   { color: "#17c1e8" },
  wilaya:        { color: "#82d616" },
  salesperson:   { color: "#fb8c00" },
  warehouse:     { color: "#7928ca" },
  route:         { color: "#344767" },
};

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
  const [tab, setTab]               = useState(0);
  const [dimTypes, setDimTypes]     = useState([]);
  const [grouped, setGrouped]       = useState({});
  const [profitByWilaya, setProfit] = useState([]);
  const [dialog, setDialog]         = useState(null);

  const reload = () => {
    accountingApi.listDimensions()
      .then((r) => {
        setDimTypes(r.data?.types ?? []);
        setGrouped(r.data?.grouped ?? {});
        setProfit(r.data?.profitByWilaya ?? []);
      })
      .catch(console.error);
  };

  useEffect(() => { reload(); }, []);

  const currentType = dimTypes[tab] ?? {};
  const currentItems = grouped[currentType.code] ?? [];

  const handleSave = (form) => {
    if (dialog === "new") {
      accountingApi.addDimensionItem(currentType.code, form)
        .then(reload).catch(console.error);
    } else {
      accountingApi.updateDimensionItem(dialog.id, form)
        .then(reload).catch(console.error);
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
          {dimTypes.map((dt) => {
            const meta = DIM_TYPE_META[dt.code] ?? {};
            const count = (grouped[dt.code] ?? []).filter((d) => d.active).length;
            return (
              <Grid item xs={6} sm={4} md={2.4} key={dt.code}>
                <Card sx={{ p: 1.5, textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">{dt.label}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: meta.color ?? "#344767" }}>{count}</SoftTypography>
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
                  {dimTypes.map((dt) => (
                    <Tab key={dt.code} label={dt.label} sx={{ fontSize: "0.75rem", minWidth: "unset", px: 1.5 }} />
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
                    {profitByWilaya.map((r) => {
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
