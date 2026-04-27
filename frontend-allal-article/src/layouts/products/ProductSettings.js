/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
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
import Tooltip from "@mui/material/Tooltip";

import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { productSettings, updateProductSettings } from "./mockProductData";

// ─── Units Tab ────────────────────────────────────────────────────────────────
function UnitsTab() {
  const [units, setUnits] = useState(productSettings.units);
  const [dialog, setDialog] = useState(null); // null | { mode, item }
  const [form, setForm] = useState({ name: "", symbol: "" });

  const openAdd  = () => { setForm({ name: "", symbol: "" }); setDialog({ mode: "add" }); };
  const openEdit = (u) => { setForm({ name: u.name, symbol: u.symbol }); setDialog({ mode: "edit", item: u }); };

  const save = () => {
    if (!form.name.trim()) return;
    let next;
    if (dialog.mode === "add") {
      const newU = { id: Date.now(), name: form.name.trim(), symbol: form.symbol.trim(), isSystem: false };
      next = [...units, newU];
    } else {
      next = units.map((u) => u.id === dialog.item.id ? { ...u, ...form } : u);
    }
    setUnits(next);
    updateProductSettings({ units: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = units.filter((u) => u.id !== id);
    setUnits(next);
    updateProductSettings({ units: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">وحدات القياس</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          وحدة جديدة
        </SoftButton>
      </SoftBox>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: "#f8f9fa" }}>
              {["الاسم", "الرمز", "النوع", ""].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: "#8392ab" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {units.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontSize: 13 }}>{u.name}</TableCell>
                <TableCell sx={{ fontSize: 12, fontFamily: "monospace" }}>{u.symbol}</TableCell>
                <TableCell>
                  {u.isSystem
                    ? <Chip label="نظام" size="small" color="default" sx={{ fontSize: 11 }} />
                    : <Chip label="مخصص" size="small" color="info" sx={{ fontSize: 11 }} />
                  }
                </TableCell>
                <TableCell>
                  <SoftBox display="flex" gap={0.5}>
                    <Tooltip title={u.isSystem ? "وحدة النظام لا يمكن تعديلها" : "تعديل"}>
                      <span>
                        <IconButton size="small" disabled={u.isSystem} onClick={() => openEdit(u)}>
                          {u.isSystem ? <LockIcon sx={{ fontSize: 14, color: "#ccc" }} /> : <EditIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={u.isSystem ? "لا يمكن حذف وحدات النظام" : "حذف"}>
                      <span>
                        <IconButton size="small" disabled={u.isSystem} onClick={() => remove(u.id)}>
                          <DeleteOutlineIcon sx={{ fontSize: 14, color: u.isSystem ? "#ccc" : "#ea0606" }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </SoftBox>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "وحدة جديدة" : "تعديل الوحدة"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="اسم الوحدة *" size="small" fullWidth value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="مثال: دزينة، كيس..." />
            <TextField label="الرمز" size="small" fullWidth value={form.symbol}
              onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value }))} placeholder="مثال: DZ, KG..." />
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const [cats, setCats] = useState(productSettings.categories);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: "", color: "#17c1e8" });

  const openAdd  = () => { setForm({ name: "", color: "#17c1e8" }); setDialog({ mode: "add" }); };
  const openEdit = (c) => { setForm({ name: c.name, color: c.color }); setDialog({ mode: "edit", item: c }); };

  const save = () => {
    if (!form.name.trim()) return;
    let next;
    if (dialog.mode === "add") {
      next = [...cats, { id: Date.now(), name: form.name.trim(), color: form.color }];
    } else {
      next = cats.map((c) => c.id === dialog.item.id ? { ...c, ...form } : c);
    }
    setCats(next);
    updateProductSettings({ categories: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = cats.filter((c) => c.id !== id);
    setCats(next);
    updateProductSettings({ categories: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">تصنيفات الأصناف</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          تصنيف جديد
        </SoftButton>
      </SoftBox>
      <SoftBox display="flex" flexWrap="wrap" gap={1.5}>
        {cats.map((c) => (
          <SoftBox key={c.id} display="flex" alignItems="center" gap={0.5}
            sx={{ border: "1px solid #e9ecef", borderRadius: 2, px: 1.5, py: 0.8, background: "#fff" }}>
            <SoftBox sx={{ width: 12, height: 12, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
            <SoftTypography variant="caption" fontWeight="medium">{c.name}</SoftTypography>
            <IconButton size="small" onClick={() => openEdit(c)} sx={{ p: 0.2 }}>
              <EditIcon sx={{ fontSize: 12, color: "#8392ab" }} />
            </IconButton>
            <IconButton size="small" onClick={() => remove(c.id)} sx={{ p: 0.2 }}>
              <DeleteOutlineIcon sx={{ fontSize: 12, color: "#ea0606" }} />
            </IconButton>
          </SoftBox>
        ))}
      </SoftBox>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "تصنيف جديد" : "تعديل التصنيف"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="اسم التصنيف *" size="small" fullWidth value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <SoftBox display="flex" alignItems="center" gap={1}>
              <SoftTypography variant="caption" color="secondary">اللون:</SoftTypography>
              <input type="color" value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                style={{ width: 40, height: 32, border: "none", borderRadius: 4, cursor: "pointer" }} />
              <SoftTypography variant="caption" color="secondary" sx={{ fontFamily: "monospace" }}>{form.color}</SoftTypography>
            </SoftBox>
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Variant Attributes Tab ───────────────────────────────────────────────────
function VariantAttrsTab() {
  const [attrs, setAttrs] = useState(productSettings.variantAttributes);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: "", valuesStr: "" });

  const openAdd  = () => { setForm({ name: "", valuesStr: "" }); setDialog({ mode: "add" }); };
  const openEdit = (a) => { setForm({ name: a.name, valuesStr: a.values.join(", ") }); setDialog({ mode: "edit", item: a }); };

  const save = () => {
    if (!form.name.trim()) return;
    const values = form.valuesStr.split(",").map((v) => v.trim()).filter(Boolean);
    let next;
    if (dialog.mode === "add") {
      next = [...attrs, { id: Date.now(), name: form.name.trim(), values }];
    } else {
      next = attrs.map((a) => a.id === dialog.item.id ? { ...a, name: form.name.trim(), values } : a);
    }
    setAttrs(next);
    updateProductSettings({ variantAttributes: next });
    setDialog(null);
  };

  const remove = (id) => {
    const next = attrs.filter((a) => a.id !== id);
    setAttrs(next);
    updateProductSettings({ variantAttributes: next });
  };

  return (
    <>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">خصائص المتغيرات</SoftTypography>
        <SoftButton variant="gradient" color="info" size="small" startIcon={<AddIcon />} onClick={openAdd}>
          خاصية جديدة
        </SoftButton>
      </SoftBox>
      <SoftBox display="flex" flexDirection="column" gap={1.5}>
        {attrs.map((a) => (
          <SoftBox key={a.id} p={1.5} sx={{ border: "1px solid #e9ecef", borderRadius: 2 }}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <SoftTypography variant="button" fontWeight="bold">{a.name}</SoftTypography>
              <SoftBox display="flex" gap={0.5}>
                <IconButton size="small" onClick={() => openEdit(a)}><EditIcon sx={{ fontSize: 14 }} /></IconButton>
                <IconButton size="small" onClick={() => remove(a.id)}><DeleteOutlineIcon sx={{ fontSize: 14, color: "#ea0606" }} /></IconButton>
              </SoftBox>
            </SoftBox>
            <SoftBox display="flex" flexWrap="wrap" gap={0.5}>
              {a.values.map((v) => (
                <Chip key={v} label={v} size="small" sx={{ fontSize: 11 }} />
              ))}
            </SoftBox>
          </SoftBox>
        ))}
      </SoftBox>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog?.mode === "add" ? "خاصية جديدة" : "تعديل الخاصية"}</DialogTitle>
        <DialogContent>
          <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="اسم الخاصية *" size="small" fullWidth value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="مثال: اللون، المقاس..." />
            <TextField label="القيم (افصل بفواصل)" size="small" fullWidth value={form.valuesStr}
              onChange={(e) => setForm((p) => ({ ...p, valuesStr: e.target.value }))}
              placeholder="مثال: أحمر, أزرق, أخضر" multiline rows={2}
              helperText="اكتب القيم مفصولة بفاصلة ثم حفظ" />
          </SoftBox>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setDialog(null)}>إلغاء</SoftButton>
          <SoftButton variant="gradient" color="info" size="small" onClick={save}>حفظ</SoftButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductSettings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton size="small" onClick={() => navigate("/products")}><ArrowBackIcon fontSize="small" /></IconButton>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">إعدادات الأصناف</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              إدارة الوحدات والتصنيفات وخصائص المتغيرات
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        <Card>
          <SoftBox sx={{ borderBottom: "1px solid #e9ecef" }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              <Tab label="وحدات القياس" sx={{ fontSize: "0.8rem" }} />
              <Tab label="التصنيفات" sx={{ fontSize: "0.8rem" }} />
              <Tab label="خصائص المتغيرات" sx={{ fontSize: "0.8rem" }} />
            </Tabs>
          </SoftBox>
          <SoftBox p={3}>
            {tab === 0 && <UnitsTab />}
            {tab === 1 && <CategoriesTab />}
            {tab === 2 && <VariantAttrsTab />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
