/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
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
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { accountingApi } from "services";
import { getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(n ?? 0) + " دج";

const initialTaxes = [
  {
    id: 1, code: "TVA-19", label: "TVA 19%", rate: 19, type: "vat",
    payableAccountId: 212, recoverableAccountId: null, priceIncludesTax: false,
    validFrom: "2017-01-01", validTo: null, active: true,
    collected: 620000, recoverable: 0,
  },
  {
    id: 2, code: "TVA-9", label: "TVA 9% (إعفاء جزئي)", rate: 9, type: "vat",
    payableAccountId: 212, recoverableAccountId: 212, priceIncludesTax: false,
    validFrom: "2017-01-01", validTo: null, active: true,
    collected: 85000, recoverable: 320000,
  },
  {
    id: 3, code: "TAP", label: "TAP 2%", rate: 2, type: "tap",
    payableAccountId: 212, recoverableAccountId: null, priceIncludesTax: false,
    validFrom: "2017-01-01", validTo: null, active: true,
    collected: 45000, recoverable: 0,
  },
  {
    id: 4, code: "IBS", label: "IBS 26% (ضريبة الدخل)", rate: 26, type: "ibs",
    payableAccountId: 212, recoverableAccountId: null, priceIncludesTax: false,
    validFrom: "2023-01-01", validTo: null, active: false,
    collected: 0, recoverable: 0,
  },
];

const typeLabels = { vat: "TVA", tap: "TAP", ibs: "IBS", other: "أخرى" };

function TaxDialog({ tax, onClose, onSave, postableAccounts = [] }) {
  const { t } = useI18n();
  const [form, setForm] = useState(tax ?? {
    code: "", label: "", rate: "", type: "vat",
    payableAccountId: "", recoverableAccountId: "",
    priceIncludesTax: false, validFrom: "", validTo: "", active: true,
  });
  const [errors, setErrors] = useState({});
  const set = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (errors[field] || errors._global) setErrors((current) => ({ ...current, [field]: "", _global: "" }));
  };
  const save = () => {
    const nextErrors = {};
    if (isBlank(form.code)) nextErrors.code = t("كود الضريبة مطلوب");
    if (isBlank(form.label)) nextErrors.label = t("وصف الضريبة مطلوب");
    if (!Number.isFinite(Number(form.rate)) || Number(form.rate) < 0) {
      nextErrors.rate = t("النسبة يجب أن تكون رقماً موجباً");
    }
    if (isBlank(form.validFrom)) nextErrors.validFrom = t("تاريخ البداية مطلوب");
    if (form.validTo && form.validFrom && form.validTo < form.validFrom) {
      nextErrors.validTo = t("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
    }
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    onSave({ ...form, rate: Number(form.rate) });
    onClose();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">{tax ? "تعديل ضريبة" : "إضافة ضريبة"}</SoftTypography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <SoftBox display="flex" flexDirection="column" gap={2} mt={1}>
          {errors._global && <Alert severity="error">{errors._global}</Alert>}
          <SoftBox display="flex" gap={1.5}>
            <TextField label="الكود" size="small" value={form.code}
              onChange={(e) => set("code", e.target.value)} sx={{ flex: 1 }}
              error={!!errors.code} helperText={errors.code || ""} />
            <TextField label="الوصف" size="small" value={form.label}
              onChange={(e) => set("label", e.target.value)} sx={{ flex: 2 }}
              error={!!errors.label} helperText={errors.label || ""} />
          </SoftBox>
          <SoftBox display="flex" gap={1.5}>
            <TextField label="النسبة %" type="number" size="small" value={form.rate}
              onChange={(e) => set("rate", e.target.value)} sx={{ flex: 1 }}
              error={!!errors.rate} helperText={errors.rate || ""} />
            <Select size="small" value={form.type} onChange={(e) => set("type", e.target.value)} sx={{ flex: 1 }}>
              {Object.entries(typeLabels).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </SoftBox>
          <Select size="small" value={form.payableAccountId}
            onChange={(e) => set("payableAccountId", e.target.value)}
            displayEmpty
          >
            <MenuItem value="">-- حساب الضريبة المحصلة --</MenuItem>
            {postableAccounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.code} — {a.nameAr}</MenuItem>
            ))}
          </Select>
          <Select size="small" value={form.recoverableAccountId ?? ""}
            onChange={(e) => set("recoverableAccountId", e.target.value || null)}
            displayEmpty
          >
            <MenuItem value="">-- حساب الضريبة القابلة للخصم (اختياري) --</MenuItem>
            {postableAccounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>{a.code} — {a.nameAr}</MenuItem>
            ))}
          </Select>
          <SoftBox display="flex" gap={1.5}>
            <TextField label="ساري من" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} sx={{ flex: 1 }}
              error={!!errors.validFrom} helperText={errors.validFrom || ""} />
            <TextField label="ساري حتى (فارغ = دائم)" type="date" size="small" InputLabelProps={{ shrink: true }}
              value={form.validTo ?? ""} onChange={(e) => set("validTo", e.target.value || null)} sx={{ flex: 1 }}
              error={!!errors.validTo} helperText={errors.validTo || ""} />
          </SoftBox>
          <FormControlLabel
            control={<Switch checked={form.priceIncludesTax} onChange={(e) => set("priceIncludesTax", e.target.checked)} />}
            label={<SoftTypography variant="caption">السعر شامل الضريبة</SoftTypography>}
          />
          <FormControlLabel
            control={<Switch checked={form.active} onChange={(e) => set("active", e.target.checked)} />}
            label={<SoftTypography variant="caption">نشط</SoftTypography>}
          />
          <SoftBox display="flex" gap={1} justifyContent="flex-end">
            <SoftButton variant="outlined" color="secondary" size="small" onClick={onClose}>إلغاء</SoftButton>
            <SoftButton variant="gradient" color="info" size="small" onClick={save}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> حفظ
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </DialogContent>
    </Dialog>
  );
}

export default function Taxes() {
  const [taxes, setTaxes] = useState(initialTaxes);
  const [dialog, setDialog] = useState(null);
  const [postableAccounts, setPostableAccounts] = useState([]);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    setPageError("");
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        setPostableAccounts(all.filter((a) => a.isPostable !== false && a.isActive !== false));
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل الحسابات"));
        setPostableAccounts([]);
      });
  }, []);

  const handleSave = (form) => {
    if (dialog === "new") {
      setTaxes((p) => [...p, { ...form, id: Date.now(), collected: 0, recoverable: 0 }]);
    } else {
      setTaxes((p) => p.map((t) => t.id === dialog.id ? { ...t, ...form } : t));
    }
  };

  const totalPayable = taxes.reduce((s, t) => s + t.collected, 0);
  const totalRecoverable = taxes.reduce((s, t) => s + t.recoverable, 0);
  const netTax = totalPayable - totalRecoverable;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">الضرائب والرسوم</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              تعريف أكواد الضرائب ونسبها وربطها بالحسابات المحاسبية
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => setDialog("new")}>
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> ضريبة جديدة
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2} mb={3}>
          {[
            { label: "ضرائب محصلة", value: totalPayable, color: "#ea0606" },
            { label: "ضرائب قابلة للخصم", value: totalRecoverable, color: "#82d616" },
            { label: "الصافي المستحق", value: netTax, color: "#fb8c00" },
            { label: "عدد أكواد الضريبة", value: taxes.filter((t) => t.active).length, color: "#17c1e8", isCnt: true },
          ].map((m) => (
            <Grid item xs={6} sm={3} key={m.label}>
              <Card sx={{ p: 1.5 }}>
                <SoftTypography variant="caption" color="secondary">{m.label}</SoftTypography>
                <SoftTypography variant="h6" fontWeight="bold" sx={{ color: m.color }}>
                  {m.isCnt ? m.value : fmt(m.value)}
                </SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الكود</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الوصف</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>النسبة</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>النوع</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>محصل</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>قابل للخصم</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>السعر شامل؟</TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الحالة</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {taxes.map((t) => (
                  <TableRow key={t.id} hover sx={{ opacity: t.active ? 1 : 0.5 }}>
                    <TableCell>
                      <SoftTypography variant="caption" fontWeight="bold" sx={{ fontFamily: "monospace" }}>{t.code}</SoftTypography>
                    </TableCell>
                    <TableCell><SoftTypography variant="caption">{t.label}</SoftTypography></TableCell>
                    <TableCell>
                      <Chip label={`${t.rate}%`} size="small" color="info" sx={{ fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={typeLabels[t.type]} size="small" sx={{ fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell><SoftTypography variant="caption">{fmt(t.collected)}</SoftTypography></TableCell>
                    <TableCell><SoftTypography variant="caption" sx={{ color: "#82d616" }}>{fmt(t.recoverable)}</SoftTypography></TableCell>
                    <TableCell>
                      <Chip label={t.priceIncludesTax ? "نعم" : "لا"} size="small" sx={{ fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.active ? "نشط" : "معطل"} size="small" color={t.active ? "success" : "default"} sx={{ fontSize: "0.7rem" }} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => setDialog(t)}><EditIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {dialog && (
          <TaxDialog
            tax={dialog === "new" ? null : dialog}
            onClose={() => setDialog(null)}
            onSave={handleSave}
            postableAccounts={postableAccounts}
          />
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
