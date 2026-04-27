/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const BOOK_TYPES = [
  { type: "sales",     label: "مبيعات",   color: "#17c1e8", isSystem: true },
  { type: "purchases", label: "مشتريات",  color: "#fb8c00", isSystem: true },
  { type: "cash",      label: "صندوق",    color: "#82d616", isSystem: true },
  { type: "bank",      label: "بنك",      color: "#344767", isSystem: true },
  { type: "stock",     label: "مخزون",    color: "#7928ca", isSystem: true },
  { type: "manual",    label: "يدوي",     color: "#ea0606", isSystem: false },
  { type: "opening",   label: "افتتاح",   color: "#627594", isSystem: true },
  { type: "closing",   label: "إقفال",    color: "#627594", isSystem: true },
];

const initialBooks = [
  { id: 1, type: "sales",     name: "دفتر المبيعات",    prefix: "SAL", nextSeq: 42, yearFormat: "YYYY", requireApproval: false,  allowManual: false, active: true  },
  { id: 2, type: "purchases", name: "دفتر المشتريات",   prefix: "PUR", nextSeq: 17, yearFormat: "YYYY", requireApproval: false,  allowManual: false, active: true  },
  { id: 3, type: "cash",      name: "دفتر الصندوق",     prefix: "CSH", nextSeq: 88, yearFormat: "YYYY", requireApproval: false,  allowManual: true,  active: true  },
  { id: 4, type: "bank",      name: "دفتر البنك",       prefix: "BNK", nextSeq: 23, yearFormat: "YYYY", requireApproval: true,   allowManual: true,  active: true  },
  { id: 5, type: "stock",     name: "دفتر المخزون",     prefix: "STK", nextSeq: 56, yearFormat: "YYYY", requireApproval: false,  allowManual: false, active: true  },
  { id: 6, type: "manual",    name: "دفتر اليومية العام", prefix: "JRN", nextSeq: 12, yearFormat: "YYYY", requireApproval: true, allowManual: true,  active: true  },
  { id: 7, type: "opening",   name: "دفتر الافتتاح",   prefix: "OPN", nextSeq: 2,  yearFormat: "YYYY", requireApproval: false,  allowManual: false, active: true  },
  { id: 8, type: "closing",   name: "دفتر الإقفال",    prefix: "CLO", nextSeq: 1,  yearFormat: "YYYY", requireApproval: false,  allowManual: false, active: true  },
];

function getTypeInfo(type) {
  return BOOK_TYPES.find((t) => t.type === type) ?? {};
}

function BookDialog({ book, onClose, onSave }) {
  const [form, setForm] = useState(book ?? { type: "manual", name: "", prefix: "", nextSeq: 1, requireApproval: false, allowManual: true, active: true });
  const typeInfo = getTypeInfo(form.type);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">
          {book ? "تعديل دفتر" : "إضافة دفتر يومية"}
        </SoftTypography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="اسم الدفتر" value={form.name} size="small" fullWidth
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <TextField
            label="البادئة (Prefix)" value={form.prefix} size="small" fullWidth
            helperText={`مثال: JRN → JRN-2025-0001`}
            onChange={(e) => setForm((p) => ({ ...p, prefix: e.target.value.toUpperCase() }))}
          />
          <TextField
            label="الترقيم التالي" type="number" value={form.nextSeq} size="small" fullWidth
            onChange={(e) => setForm((p) => ({ ...p, nextSeq: parseInt(e.target.value) || 1 }))}
          />
          <SoftBox sx={{ background: "#f8f9fa", p: 1.5, borderRadius: 2 }}>
            <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>معاينة الترقيم:</SoftTypography>
            <SoftTypography variant="caption" fontWeight="bold" sx={{ fontFamily: "monospace" }}>
              {form.prefix || "XXX"}-2025-{String(form.nextSeq || 1).padStart(4, "0")}
            </SoftTypography>
          </SoftBox>
          <Divider />
          <FormControlLabel
            control={<Switch checked={form.requireApproval} onChange={(e) => setForm((p) => ({ ...p, requireApproval: e.target.checked }))} />}
            label={<SoftTypography variant="caption">يتطلب موافقة قبل الترحيل</SoftTypography>}
          />
          <FormControlLabel
            control={<Switch checked={form.allowManual} onChange={(e) => setForm((p) => ({ ...p, allowManual: e.target.checked }))} />}
            label={<SoftTypography variant="caption">يسمح بالقيود اليدوية</SoftTypography>}
          />
          {typeInfo.isSystem && (
            <SoftBox p={1} sx={{ background: "#e3f8fd", borderRadius: 1 }}>
              <SoftTypography variant="caption" sx={{ color: "#17c1e8" }}>
                <LockIcon sx={{ fontSize: 12, mr: 0.5 }} />
                دفتر النظام — النوع لا يمكن تغييره
              </SoftTypography>
            </SoftBox>
          )}
          <SoftBox display="flex" gap={1} justifyContent="flex-end" mt={1}>
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

export default function JournalBooks() {
  const [books, setBooks] = useState(initialBooks);
  const [dialog, setDialog] = useState(null); // null | "new" | bookObj

  const handleSave = (form) => {
    if (dialog === "new") {
      setBooks((p) => [...p, { ...form, id: Date.now() }]);
    } else {
      setBooks((p) => p.map((b) => b.id === dialog.id ? { ...b, ...form } : b));
    }
    setDialog(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">دفاتر اليومية والترقيم</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              إدارة دفاتر اليومية وتحديد البادئة والترقيم وإعدادات الموافقة
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => setDialog("new")}>
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> دفتر جديد
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          {BOOK_TYPES.map((t) => {
            const count = books.filter((b) => b.type === t.type && b.active).length;
            return (
              <Grid item xs={6} sm={3} key={t.type}>
                <Card sx={{ p: 1.5, textAlign: "center" }}>
                  <SoftTypography variant="caption" color="secondary">{t.label}</SoftTypography>
                  <SoftTypography variant="h6" fontWeight="bold" sx={{ color: t.color }}>{count}</SoftTypography>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الدفتر</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>النوع</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>البادئة</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>التالي</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>موافقة</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>قيود يدوية</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الحالة</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => {
                  const typeInfo = getTypeInfo(book.type);
                  return (
                    <TableRow key={book.id} hover>
                      <TableCell>
                        <SoftTypography variant="caption" fontWeight="bold">{book.name}</SoftTypography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeInfo.label ?? book.type}
                          size="small"
                          sx={{ background: typeInfo.color + "22", color: typeInfo.color, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption" sx={{ fontFamily: "monospace", background: "#f8f9fa", px: 0.8, py: 0.3, borderRadius: 1 }}>
                          {book.prefix}
                        </SoftTypography>
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {book.prefix}-2025-{String(book.nextSeq).padStart(4, "0")}
                        </SoftTypography>
                      </TableCell>
                      <TableCell>
                        {book.requireApproval
                          ? <Chip label="مطلوب" size="small" color="warning" sx={{ fontSize: "0.7rem" }} />
                          : <Chip label="تلقائي" size="small" sx={{ fontSize: "0.7rem" }} />
                        }
                      </TableCell>
                      <TableCell>
                        {book.allowManual
                          ? <Chip label="مسموح" size="small" color="success" sx={{ fontSize: "0.7rem" }} />
                          : <Chip label="ممنوع" size="small" color="default" sx={{ fontSize: "0.7rem" }} />
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={book.active ? "نشط" : "معطل"}
                          size="small"
                          color={book.active ? "success" : "default"}
                          sx={{ fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => setDialog(book)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {dialog && (
          <BookDialog
            book={dialog === "new" ? null : dialog}
            onClose={() => setDialog(null)}
            onSave={handleSave}
          />
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
