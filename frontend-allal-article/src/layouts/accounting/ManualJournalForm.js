/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { fmt } from "./mockData";
import { accountingApi } from "services";
import { applyApiErrors, getApiErrorMessage, hasErrors, isBlank } from "utils/formErrors";
import { useI18n } from "i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenTree(nodes, result = []) {
  nodes.forEach((n) => { result.push(n); if (n.children?.length) flattenTree(n.children, result); });
  return result;
}

// populated via API in the main component — passed down as prop
let postableAccounts = [];

let lineCounter = 3;
const emptyLine = () => ({ id: lineCounter++, account: null, debit: "", credit: "", description: "" });

// ─── Journal Line Row ─────────────────────────────────────────────────────────
function JournalLine({ line, isLast, onChange, onDelete, canDelete }) {
  const set = (k, v) => onChange(line.id, k, v);
  return (
    <TableRow sx={{ "&:hover": { background: "#fafafa" } }}>
      {/* Account */}
      <TableCell sx={{ py: 0.5, minWidth: 260 }}>
        <Autocomplete
          size="small"
          options={postableAccounts}
          value={line.account}
          onChange={(_, v) => set("account", v)}
          getOptionLabel={(o) => `${o.code} - ${o.nameAr}`}
          filterOptions={(opts, { inputValue: q }) =>
            opts.filter((o) => o.nameAr.includes(q) || o.code.includes(q))
          }
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <SoftTypography variant="caption" fontWeight="medium">{option.code}</SoftTypography>
              <SoftTypography variant="caption" color="secondary" sx={{ ml: 1 }}>{option.nameAr}</SoftTypography>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} placeholder="اختر الحساب..." variant="outlined"
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, borderRadius: 1 } }} />
          )}
          noOptionsText="لا نتائج"
        />
        {line.account?.isControl && (
          <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontSize: 10, display: "block", mt: 0.3 }}>
            ⚠ حساب رقابي — يحتاج sub-ledger
          </SoftTypography>
        )}
      </TableCell>

      {/* Description */}
      <TableCell sx={{ py: 0.5 }}>
        <TextField size="small" fullWidth value={line.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="بيان السطر..."
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, borderRadius: 1 } }} />
      </TableCell>

      {/* Debit */}
      <TableCell sx={{ py: 0.5, width: 130 }}>
        <TextField size="small" type="number" value={line.debit}
          onChange={(e) => { set("debit", e.target.value); if (e.target.value) set("credit", ""); }}
          placeholder="0.00" inputProps={{ min: 0, style: { textAlign: "right" } }}
          disabled={!!line.credit}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, borderRadius: 1, color: "#17c1e8" } }} />
      </TableCell>

      {/* Credit */}
      <TableCell sx={{ py: 0.5, width: 130 }}>
        <TextField size="small" type="number" value={line.credit}
          onChange={(e) => { set("credit", e.target.value); if (e.target.value) set("debit", ""); }}
          placeholder="0.00" inputProps={{ min: 0, style: { textAlign: "right" } }}
          disabled={!!line.debit}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, borderRadius: 1, color: "#82d616" } }} />
      </TableCell>

      {/* Delete */}
      <TableCell sx={{ py: 0.5, width: 48, textAlign: "center" }}>
        <Tooltip title="حذف السطر">
          <span>
            <IconButton size="small" disabled={!canDelete} onClick={() => onDelete(line.id)}
              sx={{ color: "#ea0606", opacity: canDelete ? 1 : 0.3 }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function ManualJournalForm() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate]     = useState(today);
  const [notes, setNotes]   = useState("");
  const [bookId, setBookId] = useState(null);
  const [fyId, setFyId]     = useState(null);
  const [activeFY, setActiveFY] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [journalBooks, setJournalBooks] = useState([]);
  const [lines, setLines] = useState([
    { id: 1, account: null, debit: "", credit: "", description: "" },
    { id: 2, account: null, debit: "", credit: "", description: "" },
  ]);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoadError("");
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) { setFyId(active.id); setActiveFY(active); }
      })
      .catch((error) => setLoadError(getApiErrorMessage(error, "تعذر تحميل السنوات المالية")));
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        const postable = all.filter((a) => a.isPostable !== false && a.isActive !== false);
        setAccounts(postable);
        postableAccounts = postable;
      })
      .catch((error) => {
        setLoadError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل الحسابات");
          return current ? `${current}؛ ${message}` : message;
        });
        setAccounts([]);
        postableAccounts = [];
      });
    accountingApi.listJournalBooks()
      .then((r) => {
        const books = (r.data?.content ?? r.data ?? []).filter((b) => b.active !== false && b.allowManual !== false);
        setJournalBooks(books);
        const preferred = books.find((b) => b.code === "manual") ?? books[0];
        if (preferred) setBookId(preferred.id);
      })
      .catch((error) => {
        setLoadError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل دفاتر اليومية");
          return current ? `${current}؛ ${message}` : message;
        });
        setJournalBooks([]);
      });
  }, []);

  const totalDebit  = useMemo(() => lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + (Number(l.credit) || 0), 0), [lines]);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.001;
  const hasLines    = lines.some((l) => l.account && (l.debit || l.credit));

  const changeLine = (id, k, v) => {
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, [k]: v } : l));
    if (errors.items || errors._global) setErrors((current) => ({ ...current, items: "", _global: "" }));
  };
  const deleteLine = (id) => setLines((prev) => prev.filter((l) => l.id !== id));
  const addLine    = ()    => setLines((prev) => [...prev, emptyLine()]);

  const validate = () => {
    setTouched(true);
    const nextErrors = {};
    if (isBlank(date)) nextErrors.date = t("تاريخ القيد مطلوب");
    if (!fyId) nextErrors.fiscalYearId = t("السنة المالية مطلوبة");
    if (!bookId) nextErrors.journalBookId = t("دفتر اليومية مطلوب");
    if (!isBalanced) nextErrors.items = t("القيد غير متوازن، مجموع المدين يجب أن يساوي مجموع الدائن");
    if (!hasLines) nextErrors.items = t("أضف أسطراً للقيد أولاً");
    const bad = lines.find((l) => (l.debit || l.credit) && !l.account);
    if (bad) nextErrors.items = t("كل سطر يحتوي مبلغ يجب أن يحدد حساباً");
    const badAmount = lines.find((l) => Number(l.debit || 0) < 0 || Number(l.credit || 0) < 0);
    if (badAmount) nextErrors.items = t("المبالغ لا يمكن أن تكون سالبة");
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSave = async (post) => {
    if (!validate()) return;
    const payload = {
      journalDate: date,
      description: notes,
      journalBookId: Number(bookId),
      items: lines
        .filter((l) => l.account && (Number(l.debit) > 0 || Number(l.credit) > 0))
        .map((l) => ({
          accountId: l.account.id,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || null,
        })),
    };
    setSaving(true);
    try {
      const journal = await accountingApi.createJournal(payload);
      if (post) await accountingApi.postJournal(journal.data.id);
      navigate("/accounting/journals");
    } catch (error) {
      applyApiErrors(error, setErrors, "حدث خطأ أثناء حفظ القيد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <IconButton size="small" onClick={() => navigate("/accounting/journals")}><ArrowBackIcon /></IconButton>
            <SoftBox>
              <SoftTypography variant="h5" fontWeight="bold">قيد يدوي جديد</SoftTypography>
              <SoftTypography variant="caption" color="secondary">{activeFY?.name}</SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox display="flex" gap={1.5}>
            <SoftButton variant="outlined" color="secondary" size="small" disabled={saving} onClick={() => handleSave(false)}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" onClick={() => handleSave(true)} disabled={!isBalanced || saving}>
              <DoneAllIcon sx={{ mr: 0.5, fontSize: 16 }} /> {saving ? "جارٍ الحفظ..." : "ترحيل"}
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        {(errors._global || errors.items || errors.date || errors.fiscalYearId || errors.journalBookId) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global || errors.items || errors.date || errors.fiscalYearId || errors.journalBookId}
          </Alert>
        )}

        {/* Header Card */}
        <Card sx={{ mb: 2, p: 2.5 }}>
          <SoftBox display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>دفتر اليومية</InputLabel>
              <Select value={bookId ?? ""} label="دفتر اليومية" onChange={(e) => setBookId(e.target.value)}>
                {journalBooks.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name ?? b.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="تاريخ القيد" value={date}
              onChange={(e) => { setDate(e.target.value); if (errors.date) setErrors((current) => ({ ...current, date: "" })); }}
              sx={{ minWidth: 180 }} InputLabelProps={{ shrink: true }}
              error={!!errors.date} helperText={errors.date || ""} />
            <TextField label="السنة المالية" value={activeFY?.name ?? "—"}
              sx={{ minWidth: 180 }} InputProps={{ readOnly: true }} size="small" />
            <TextField size="small" label="البيان / الوصف" value={notes}
              onChange={(e) => setNotes(e.target.value)} sx={{ flex: 1, minWidth: 240 }} placeholder="ملاحظة اختيارية..." />
          </SoftBox>
        </Card>

        {/* Balance indicator */}
        {touched && (
          <SoftBox mb={2} p={1.5} sx={{
            background: isBalanced ? "#f0fde4" : "#ffeaea",
            border: `1px solid ${isBalanced ? "#82d61644" : "#ea060644"}`,
            borderRadius: 2,
          }}>
            <SoftTypography variant="caption" fontWeight="bold" sx={{ color: isBalanced ? "#82d616" : "#ea0606" }}>
              {isBalanced ? "✅ القيد متوازن" : `❌ القيد غير متوازن — الفرق: ${fmt(diff)} دج`}
            </SoftTypography>
          </SoftBox>
        )}

        {/* Lines Table */}
        <Card>
          <SoftBox p={2} display="flex" justifyContent="space-between" alignItems="center">
            <SoftTypography variant="h6" fontWeight="bold">أسطر القيد</SoftTypography>
            <SoftButton size="small" variant="outlined" color="info" onClick={addLine}>
              <AddIcon sx={{ fontSize: 15, mr: 0.3 }} /> سطر
            </SoftButton>
          </SoftBox>

          <TableContainer>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {[["الحساب", null], ["البيان", null], ["مدين (دج)", 130], ["دائن (دج)", 130], ["", 48]].map(([h, w], i) => (
                    <TableCell key={i} sx={{ py: 1, fontWeight: 700, fontSize: 11, color: "#8392ab", ...(w ? { width: w } : {}) }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((line, idx) => (
                  <JournalLine
                    key={line.id}
                    line={line}
                    isLast={idx === lines.length - 1}
                    onChange={changeLine}
                    onDelete={deleteLine}
                    canDelete={lines.length > 2}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals */}
          <Divider />
          <SoftBox px={3} py={2} display="flex" justifyContent="flex-end" gap={4}>
            <SoftBox textAlign="right">
              <SoftTypography variant="caption" color="secondary" display="block">إجمالي المدين</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(totalDebit)}</SoftTypography>
            </SoftBox>
            <SoftBox textAlign="right">
              <SoftTypography variant="caption" color="secondary" display="block">إجمالي الدائن</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(totalCredit)}</SoftTypography>
            </SoftBox>
            <SoftBox textAlign="right">
              <SoftTypography variant="caption" color="secondary" display="block">الفرق</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: isBalanced ? "#82d616" : "#ea0606" }}>{fmt(diff)}</SoftTypography>
            </SoftBox>
          </SoftBox>
        </Card>

        {/* Rules reminder */}
        <SoftBox mt={2} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
          <SoftTypography variant="caption" color="secondary">
            قواعد الترحيل: • مجموع المدين = مجموع الدائن &nbsp;•&nbsp; لا يجمع مدين ودائن في نفس السطر &nbsp;•&nbsp;
            لا ترحيل على حساب أب (غير postable) &nbsp;•&nbsp; بعد الترحيل يصبح القيد للقراءة فقط
          </SoftTypography>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
