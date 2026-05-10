/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";

import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import { productImportApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const ACCEPTED_TYPES = ".pdf,.docx,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.webp,.gif";
const STAGE_LABELS = {
  uploaded: "تم استلام الملف",
  extracting: "استخراج المحتوى",
  ai_processing: "تحليل بالذكاء الاصطناعي",
  parsed: "التحقق من النتائج",
  ready: "جاهز للمراجعة",
  irrelevant: "ملف غير ذي صلة",
  failed: "فشل المعالجة",
  done: "تم الحفظ",
};
const STEP_ORDER = ["uploaded", "extracting", "ai_processing", "ready"];

function StageStepper({ stage }) {
  const activeIndex = (() => {
    if (stage === "ready" || stage === "done") return STEP_ORDER.length - 1;
    if (stage === "irrelevant" || stage === "failed") return -1;
    const idx = STEP_ORDER.indexOf(stage);
    return idx >= 0 ? idx : 0;
  })();
  return (
    <Stepper activeStep={activeIndex} alternativeLabel sx={{ mb: 2 }}>
      {STEP_ORDER.map((s) => (
        <Step key={s}>
          <StepLabel>{STAGE_LABELS[s]}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

function FileDropZone({ onFile, disabled }) {
  const inputRef = useRef();
  const [over, setOver] = useState(false);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onFile(files[0]);
  };

  return (
    <SoftBox
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      sx={{
        cursor: disabled ? "not-allowed" : "pointer",
        border: "2px dashed",
        borderColor: over ? "info.main" : "#cfd8dc",
        borderRadius: 2,
        background: over ? "rgba(33,150,243,0.05)" : "#fafbfc",
        py: 5, px: 3, textAlign: "center",
        transition: "all 0.15s ease",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPTED_TYPES}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <CloudUploadIcon sx={{ fontSize: 48, color: "info.main", mb: 1 }} />
      <SoftTypography variant="h6" fontWeight="bold" color="text">
        اسحب الملف هنا أو اضغط للاختيار
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
        صيغ مقبولة: PDF · Word (.docx) · Excel · CSV · صور (PNG, JPG, WEBP)
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" display="block">
        الحد الأقصى: 15 ميجابايت
      </SoftTypography>
    </SoftBox>
  );
}

function FileBadge({ filename, fileKind }) {
  return (
    <SoftBox
      display="flex" alignItems="center" gap={1}
      sx={{ background: "#f1f6ff", border: "1px solid #d6e4ff", borderRadius: 2, px: 1.5, py: 1 }}
    >
      <DescriptionIcon sx={{ color: "info.main" }} />
      <SoftBox flex={1} sx={{ overflow: "hidden" }}>
        <SoftTypography variant="button" fontWeight="bold" noWrap>{filename}</SoftTypography>
        <SoftTypography variant="caption" color="secondary" display="block">
          {fileKind ? fileKind.toUpperCase() : "FILE"}
        </SoftTypography>
      </SoftBox>
    </SoftBox>
  );
}

function ReviewRow({ index, item, onChange, onRemove }) {
  const update = (patch) => onChange(index, { ...item, ...patch });
  const variantsCount = (item.variants || []).length;
  const extraUnitsCount = (item.extraUnits || []).length;

  return (
    <TableRow hover sx={{ "& td": { verticalAlign: "top" } }}>
      <TableCell>
        <SoftTypography variant="caption" color="secondary">{index + 1}</SoftTypography>
      </TableCell>
      <TableCell sx={{ minWidth: 180 }}>
        <TextField
          size="small" fullWidth value={item.name || ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="اسم الصنف"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 120 }}>
        <TextField
          size="small" fullWidth value={item.sku || ""}
          onChange={(e) => update({ sku: e.target.value })}
          placeholder="SKU"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 120 }}>
        <TextField
          size="small" fullWidth value={item.category || ""}
          onChange={(e) => update({ category: e.target.value })}
          placeholder="التصنيف"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 90 }}>
        <TextField
          size="small" fullWidth value={item.baseUnit || ""}
          onChange={(e) => update({ baseUnit: e.target.value })}
          placeholder="الوحدة"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 100 }}>
        <TextField
          size="small" fullWidth type="number"
          value={item.currentPriceAmount ?? ""}
          onChange={(e) => update({
            currentPriceAmount: e.target.value === "" ? null : Number(e.target.value),
          })}
          placeholder="السعر"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 80 }}>
        <TextField
          size="small" fullWidth type="number"
          value={item.unitsPerPackage ?? ""}
          onChange={(e) => update({
            unitsPerPackage: e.target.value === "" ? null : Number(e.target.value),
          })}
          placeholder="عدد/علبة"
        />
      </TableCell>
      <TableCell sx={{ minWidth: 120 }}>
        <SoftBox display="flex" gap={0.5} flexWrap="wrap">
          {variantsCount > 0 && (
            <Tooltip title="عدد المتغيرات">
              <Chip size="small" color="info" label={`${variantsCount} متغير`} />
            </Tooltip>
          )}
          {extraUnitsCount > 0 && (
            <Tooltip title="وحدات إضافية">
              <Chip size="small" color="secondary" label={`${extraUnitsCount} وحدة`} />
            </Tooltip>
          )}
          {variantsCount === 0 && extraUnitsCount === 0 && (
            <SoftTypography variant="caption" color="secondary">—</SoftTypography>
          )}
        </SoftBox>
      </TableCell>
      <TableCell>
        <Tooltip title="حذف من القائمة">
          <IconButton size="small" color="error" onClick={() => onRemove(index)}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

function ImportProductsDialog({ open, onClose, onCompleted }) {
  const [job, setJob] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const pollTimer = useRef(null);

  const cleanupPolling = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  useEffect(() => () => cleanupPolling(), []);

  useEffect(() => {
    if (!open) {
      cleanupPolling();
      setJob(null);
      setItems([]);
      setError("");
      setConfirming(false);
      setConfirmResult(null);
    }
  }, [open]);

  const stage = job?.stage || "idle";
  const isTerminal = stage === "ready" || stage === "irrelevant" || stage === "failed" || stage === "done";

  const startPolling = (jobId) => {
    const tick = async () => {
      try {
        const res = await productImportApi.getJob(jobId);
        const next = res.data;
        setJob(next);
        if (next.stage === "ready") {
          setItems(Array.isArray(next.items) ? next.items.map((it) => ({ ...it })) : []);
        }
        const finished = ["ready", "irrelevant", "failed", "done"].includes(next.stage);
        if (!finished) {
          pollTimer.current = setTimeout(tick, 1100);
        }
      } catch (e) {
        setError(getApiErrorMessage(e, "فشل قراءة حالة المعالجة"));
      }
    };
    cleanupPolling();
    pollTimer.current = setTimeout(tick, 600);
  };

  const handleFile = async (file) => {
    setError("");
    setConfirmResult(null);
    try {
      const res = await productImportApi.parse(file);
      const next = res.data;
      setJob(next);
      setItems([]);
      if (next.jobId) startPolling(next.jobId);
    } catch (e) {
      setError(getApiErrorMessage(e, "تعذر بدء المعالجة"));
    }
  };

  const handleReset = async () => {
    if (job?.jobId) {
      try { await productImportApi.cancel(job.jobId); } catch { /* ignore */ }
    }
    cleanupPolling();
    setJob(null);
    setItems([]);
    setError("");
    setConfirmResult(null);
  };

  const handleClose = async () => {
    if (job?.jobId && stage !== "done") {
      try { await productImportApi.cancel(job.jobId); } catch { /* ignore */ }
    }
    cleanupPolling();
    onClose();
  };

  const handleItemChange = (index, next) => {
    setItems((prev) => prev.map((it, i) => (i === index ? next : it)));
  };
  const handleItemRemove = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (!job?.jobId || items.length === 0) return;
    setConfirming(true);
    setError("");
    try {
      const res = await productImportApi.confirm(job.jobId, items);
      const next = res.data;
      setJob(next);
      setConfirmResult(next.summary || { created: items.length, failed: 0, total: items.length });
      if (typeof onCompleted === "function") onCompleted(next.summary);
    } catch (e) {
      setError(getApiErrorMessage(e, "تعذر حفظ الأصناف"));
    } finally {
      setConfirming(false);
    }
  };

  const validItemsCount = useMemo(
    () => items.filter((it) => it.name && it.name.trim() !== "").length,
    [items]
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">
              استيراد أصناف بالذكاء الاصطناعي
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              ارفع ملف وسيقوم النظام باستخراج الأصناف وتنظيمها تلقائياً
            </SoftTypography>
          </SoftBox>
          <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {!job && (
          <FileDropZone onFile={handleFile} disabled={false} />
        )}

        {job && (
          <SoftBox>
            <SoftBox mb={2}>
              <FileBadge filename={job.filename} fileKind={job.fileKind} />
            </SoftBox>

            <StageStepper stage={stage} />

            <SoftBox display="flex" alignItems="center" gap={1.5} mb={1}>
              {!isTerminal && <CircularProgress size={18} />}
              <SoftTypography variant="button" fontWeight="medium" color="text">
                {job.message || STAGE_LABELS[stage] || ""}
              </SoftTypography>
              <SoftBox flex={1} />
              <SoftTypography variant="caption" color="secondary">
                {job.progress || 0}%
              </SoftTypography>
            </SoftBox>
            <LinearProgress
              variant={isTerminal ? "determinate" : "determinate"}
              value={job.progress || 0}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
              color={stage === "failed" ? "error" : stage === "irrelevant" ? "warning" : "info"}
            />

            {stage === "irrelevant" && (
              <Alert
                severity="warning" icon={<WarningAmberIcon />}
                action={
                  <SoftButton size="small" startIcon={<RestartAltIcon />} onClick={handleReset}>
                    اختيار ملف آخر
                  </SoftButton>
                }
              >
                <SoftTypography variant="button" fontWeight="bold" display="block">
                  لا يبدو أن هذا الملف يحتوي على بيانات أصناف
                </SoftTypography>
                <SoftTypography variant="caption">
                  {job.reason || "حاول رفع قائمة أصناف، فاتورة تفصيلية، أو صورة كتالوج."}
                </SoftTypography>
              </Alert>
            )}

            {stage === "failed" && (
              <Alert
                severity="error" icon={<ErrorOutlineIcon />}
                action={
                  <SoftButton size="small" startIcon={<RestartAltIcon />} onClick={handleReset}>
                    إعادة المحاولة
                  </SoftButton>
                }
              >
                {job.reason || "حدث خطأ أثناء المعالجة"}
              </Alert>
            )}

            {stage === "ready" && items.length > 0 && (
              <SoftBox>
                <Divider sx={{ mb: 2 }} />
                <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                  <SoftTypography variant="h6" fontWeight="bold">
                    مراجعة الأصناف المستخرجة
                  </SoftTypography>
                  <Chip
                    color="info" size="small"
                    label={`${validItemsCount} / ${items.length} صنف صالح`}
                  />
                </SoftBox>
                <Alert severity="info" sx={{ mb: 1.5 }}>
                  يمكنك تعديل أي صف، حذف ما لا تريد، ثم الضغط على «تأكيد ورفع». الصور تُترك فارغة وتُضاف لاحقاً من شاشة الصنف.
                </Alert>
                <TableContainer sx={{ maxHeight: 380, border: "1px solid #eef0f3", borderRadius: 1 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width={40}>#</TableCell>
                        <TableCell>الاسم</TableCell>
                        <TableCell>SKU</TableCell>
                        <TableCell>التصنيف</TableCell>
                        <TableCell>الوحدة</TableCell>
                        <TableCell>السعر</TableCell>
                        <TableCell>عدد/علبة</TableCell>
                        <TableCell>تفاصيل</TableCell>
                        <TableCell width={50}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((it, i) => (
                        <ReviewRow
                          key={i}
                          index={i}
                          item={it}
                          onChange={handleItemChange}
                          onRemove={handleItemRemove}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </SoftBox>
            )}

            {stage === "done" && confirmResult && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                <SoftTypography variant="button" fontWeight="bold" display="block">
                  تم حفظ الأصناف بنجاح
                </SoftTypography>
                <SoftTypography variant="caption">
                  {`أُنشئ ${confirmResult.created || 0} صنف`}
                  {confirmResult.failed ? ` · فشل ${confirmResult.failed}` : ""}
                  {confirmResult.total ? ` من أصل ${confirmResult.total}` : ""}
                </SoftTypography>
              </Alert>
            )}
          </SoftBox>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {stage !== "ready" && stage !== "done" && (
          <SoftButton variant="outlined" color="secondary" onClick={handleClose}>إغلاق</SoftButton>
        )}
        {stage === "ready" && (
          <>
            <SoftButton variant="outlined" color="secondary" onClick={handleReset}>
              إلغاء واختيار ملف آخر
            </SoftButton>
            <SoftButton
              variant="gradient" color="info"
              disabled={confirming || validItemsCount === 0}
              onClick={handleConfirm}
            >
              {confirming ? "جاري الحفظ…" : `تأكيد ورفع ${validItemsCount} صنف`}
            </SoftButton>
          </>
        )}
        {stage === "done" && (
          <SoftButton variant="gradient" color="success" onClick={handleClose}>تم</SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default ImportProductsDialog;
