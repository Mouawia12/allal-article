/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { accountingApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";

// ─── Close Year Dialog ────────────────────────────────────────────────────────
const CLOSE_STEPS = ["التحقق من القيود", "قفل الفترات", "توليد قيود الإقفال", "إنشاء أرصدة سنة جديدة", "تأكيد القفل"];

function CloseYearDialog({ year, onClose }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [reason, setReason] = useState("");
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const checks = [
    { label: "لا توجد قيود مسودة", ok: true },
    { label: "كل القيود متوازنة",   ok: true },
    { label: "سيتم قفل فترات السنة مع القفل", ok: true },
  ];

  const handleNext = () => {
    if (step === 0) {
      setChecking(true);
      setTimeout(() => { setChecking(false); setStep(1); }, 800);
    } else {
      setStep((p) => Math.min(p + 1, CLOSE_STEPS.length - 1));
    }
  };

  const canClose = checks.every((c) => c.ok);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">قفل السنة المالية — {year.name}</SoftTypography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
          {CLOSE_STEPS.map((label) => (
            <Step key={label}><StepLabel><SoftTypography variant="caption">{label}</SoftTypography></StepLabel></Step>
          ))}
        </Stepper>

        {step === 0 && (
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold" display="block" mb={1.5}>فحص الشروط المطلوبة</SoftTypography>
            {checks.map((c, i) => (
              <SoftBox key={i} display="flex" alignItems="center" gap={1} mb={1}
                sx={{ p: 1, borderRadius: 1, background: c.ok ? "#f0fde4" : "#ffeaea" }}>
                <SoftTypography variant="button" sx={{ color: c.ok ? "#82d616" : "#ea0606" }}>
                  {c.ok ? "✅" : "❌"}
                </SoftTypography>
                <SoftBox>
                  <SoftTypography variant="caption" fontWeight="medium">{c.label}</SoftTypography>
                  {c.warn && <SoftTypography variant="caption" sx={{ color: "#ea0606", display: "block" }}>{c.warn}</SoftTypography>}
                </SoftBox>
              </SoftBox>
            ))}
            {!canClose && (
              <SoftBox mt={1.5} p={1} sx={{ background: "#fff3e0", borderRadius: 1 }}>
                <SoftTypography variant="caption" sx={{ color: "#fb8c00" }}>
                  يجب إصلاح المشاكل المذكورة قبل المتابعة
                </SoftTypography>
              </SoftBox>
            )}
          </SoftBox>
        )}

        {step === 1 && (
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold" display="block" mb={1}>قفل الفترات المحاسبية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">سيتم إغلاق جميع فترات السنة تلقائياً.</SoftTypography>
          </SoftBox>
        )}

        {step === 2 && (
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold" display="block" mb={1}>توليد قيود الإقفال</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              سيتم تحويل أرصدة الإيرادات والمصروفات إلى حساب الأرباح المرحلة (321).
            </SoftTypography>
          </SoftBox>
        )}

        {step === 3 && (
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold" display="block" mb={1}>إنشاء أرصدة افتتاحية للسنة التالية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              ستُنقل أرصدة الميزانية (أصول، خصوم، حقوق ملكية) كأرصدة افتتاحية لسنة 2026.
            </SoftTypography>
          </SoftBox>
        )}

        {step === 4 && (
          <SoftBox>
            {errors._global && <Alert severity="error" sx={{ mb: 2 }}>{errors._global}</Alert>}
            <SoftTypography variant="button" fontWeight="bold" display="block" mb={1.5}>تأكيد القفل</SoftTypography>
            <TextField
              fullWidth multiline rows={2} size="small"
              label="سبب القفل (إلزامي)"
              value={reason} onChange={(e) => { setReason(e.target.value); if (errors.reason || errors._global) setErrors({}); }}
              placeholder="مثال: انتهاء السنة المالية 2025 — تمت المراجعة والمطابقة"
              error={!!errors.reason}
              helperText={errors.reason || ""}
            />
            <SoftBox mt={1.5} p={1} sx={{ background: "#fff3e0", borderRadius: 1 }}>
              <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontWeight: 600 }}>
                ⚠ تحذير: بعد القفل لن يمكن إضافة أو تعديل قيود في هذه السنة.
                إعادة الفتح تتطلب صلاحية خاصة وسيتم تسجيلها في سجل التدقيق.
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="text" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        {step < CLOSE_STEPS.length - 1 ? (
          <SoftButton variant="gradient" color="warning" onClick={handleNext}
            disabled={(step === 0 && !canClose) || checking}>
            {checking ? "جاري الفحص..." : "التالي"}
          </SoftButton>
        ) : (
          <SoftButton variant="gradient" color="error" disabled={saving}
            onClick={async () => {
              if (isBlank(reason)) { setErrors({ reason: t("سبب القفل مطلوب") }); return; }
              setSaving(true);
              setErrors({});
              try {
                await accountingApi.closeFiscalYear(year.id);
                onClose();
              } catch (error) {
                applyApiErrors(error, setErrors, "تعذر قفل السنة المالية");
              } finally {
                setSaving(false);
              }
            }}>
            <LockIcon sx={{ fontSize: 14, mr: 0.5 }} /> {saving ? "جارٍ القفل..." : "تأكيد القفل"}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Add Fiscal Year Dialog ───────────────────────────────────────────────────
function AddFYDialog({ onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k] || errors._global) setErrors((current) => ({ ...current, [k]: "", _global: "" }));
  };

  const save = () => {
    const nextErrors = {};
    if (isBlank(form.name)) nextErrors.name = t("اسم السنة المالية مطلوب");
    if (isBlank(form.startDate)) nextErrors.startDate = t("تاريخ البداية مطلوب");
    if (isBlank(form.endDate)) nextErrors.endDate = t("تاريخ النهاية مطلوب");
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      nextErrors.endDate = t("تاريخ النهاية يجب أن يكون بعد تاريخ البداية");
    }
    if (hasErrors(nextErrors)) { setErrors(nextErrors); return; }
    setSaving(true);
    setErrors({});
    accountingApi.createFiscalYear({ name: form.name.trim(), startDate: form.startDate, endDate: form.endDate })
      .then((r) => { onSaved(r.data); onClose(); })
      .catch((error) => applyApiErrors(error, setErrors, "تعذر حفظ السنة المالية"))
      .finally(() => setSaving(false));
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">إضافة سنة مالية</SoftTypography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <SoftBox display="flex" flexDirection="column" gap={2} mt={0.5}>
          {errors._global && <Alert severity="error">{errors._global}</Alert>}
          <TextField size="small" label="اسم السنة المالية" value={form.name} onChange={(e) => set("name", e.target.value)}
            placeholder="مثال: السنة المالية 2026" error={!!errors.name} helperText={errors.name || ""} />
          <TextField size="small" type="date" label="تاريخ البداية" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
            InputLabelProps={{ shrink: true }} error={!!errors.startDate} helperText={errors.startDate || ""} />
          <TextField size="small" type="date" label="تاريخ النهاية" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
            InputLabelProps={{ shrink: true }} error={!!errors.endDate} helperText={errors.endDate || ""} />
        </SoftBox>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="text" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" disabled={saving} onClick={save}>
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FiscalYears() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [lockDialog, setLockDialog] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [pageError, setPageError] = useState("");

  const reload = () => {
    setPageError("");
    return accountingApi.listFiscalYears()
      .then((r) => setFiscalYears(r.data?.content ?? r.data ?? []))
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل السنوات المالية"));
        setFiscalYears([]);
      });
  };

  useEffect(() => { reload(); }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">السنوات المالية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">إدارة وقفل السنوات المحاسبية</SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => setAddDialog(true)}>
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> سنة مالية جديدة
          </SoftButton>
        </SoftBox>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["السنة المالية", "من", "إلى", "الحالة", "القفل", "بواسطة", ""].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {fiscalYears.map((fy) => (
                  <TableRow key={fy.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                    <TableCell>
                      <SoftTypography variant="button" fontWeight="bold">{fy.name}</SoftTypography>
                    </TableCell>
                    <TableCell><SoftTypography variant="caption">{fy.startDate}</SoftTypography></TableCell>
                    <TableCell><SoftTypography variant="caption">{fy.endDate}</SoftTypography></TableCell>
                    <TableCell>
                      {fy.closed
                        ? <Chip icon={<LockIcon sx={{ fontSize: 12 }} />} label="مغلقة" size="small" color="error" />
                        : <Chip icon={<LockOpenIcon sx={{ fontSize: 12 }} />} label="مفتوحة" size="small" color="success" />}
                    </TableCell>
                    <TableCell><SoftTypography variant="caption">{fy.closedAt ?? "—"}</SoftTypography></TableCell>
                    <TableCell><SoftTypography variant="caption">{fy.closedBy ?? "—"}</SoftTypography></TableCell>
                    <TableCell>
                      {!fy.closed ? (
                        <Tooltip title="قفل السنة المالية">
                          <SoftButton size="small" variant="outlined" color="warning" onClick={() => setLockDialog(fy)}>
                            <LockIcon sx={{ fontSize: 14, mr: 0.3 }} /> قفل
                          </SoftButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="إعادة الفتح — يتطلب صلاحية خاصة">
                          <SoftButton size="small" variant="outlined" color="error">
                            <LockOpenIcon sx={{ fontSize: 14, mr: 0.3 }} /> إعادة فتح
                          </SoftButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Info card */}
        <SoftBox mt={2} p={2} sx={{ background: "#f8f9fa", borderRadius: 2, border: "1px solid #eee" }}>
          <SoftTypography variant="button" fontWeight="bold" display="block" mb={1}>قواعد قفل السنة المالية</SoftTypography>
          {[
            "يتم التأكد من عدم وجود قيود مسودة",
            "يتم إغلاق جميع الفترات الشهرية",
            "يتم توليد قيود إقفال الإيرادات والمصروفات إلى حساب الأرباح المرحلة",
            "يتم إنشاء أرصدة افتتاحية للسنة التالية (أصول، خصوم، حقوق ملكية فقط)",
            "السنة المغلقة تصبح Read-only بالكامل",
            "إعادة الفتح تتطلب صلاحية مدير النظام وسبب إلزامي",
          ].map((r, i) => (
            <SoftTypography key={i} variant="caption" color="secondary" sx={{ display: "block", mb: 0.5 }}>
              {i + 1}. {r}
            </SoftTypography>
          ))}
        </SoftBox>
      </SoftBox>

      {lockDialog && <CloseYearDialog year={lockDialog} onClose={() => { setLockDialog(null); reload(); }} />}
      {addDialog  && <AddFYDialog onClose={() => setAddDialog(false)} onSaved={(fy) => setFiscalYears((prev) => [...prev, fy])} />}
      <Footer />
    </DashboardLayout>
  );
}
