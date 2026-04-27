/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

import { buildTree, fmt, mockAccounts, mockFiscalYears } from "./mockData";

const JOURNAL_BOOKS = [
  { id: "manual",  label: "يومية عامة (يدوي)",   prefix: "MAN" },
  { id: "opening", label: "يومية الأرصدة الافتتاحية", prefix: "OPN" },
  { id: "adjust",  label: "يومية التسويات",        prefix: "ADJ" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function flattenTree(nodes, result = []) {
  nodes.forEach((n) => { result.push(n); if (n.children?.length) flattenTree(n.children, result); });
  return result;
}

const postableAccounts = flattenTree(buildTree(mockAccounts)).filter((a) => a.isPostable && a.isActive);

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
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate]     = useState(today);
  const [notes, setNotes]   = useState("");
  const [bookId, setBookId] = useState("manual");
  const [fyId] = useState(mockFiscalYears.find((y) => !y.isClosed)?.id ?? mockFiscalYears[0].id);
  const [lines, setLines] = useState([
    { id: 1, account: null, debit: "", credit: "", description: "" },
    { id: 2, account: null, debit: "", credit: "", description: "" },
  ]);
  const [touched, setTouched] = useState(false);

  const activeFY = mockFiscalYears.find((y) => y.id === fyId);

  const totalDebit  = useMemo(() => lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0), [lines]);
  const totalCredit = useMemo(() => lines.reduce((s, l) => s + (Number(l.credit) || 0), 0), [lines]);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.001;
  const hasLines    = lines.some((l) => l.account && (l.debit || l.credit));

  const changeLine = (id, k, v) => setLines((prev) => prev.map((l) => l.id === id ? { ...l, [k]: v } : l));
  const deleteLine = (id) => setLines((prev) => prev.filter((l) => l.id !== id));
  const addLine    = ()    => setLines((prev) => [...prev, emptyLine()]);

  const validate = () => {
    setTouched(true);
    if (!isBalanced) { alert("القيد غير متوازن — مجموع المدين يجب أن يساوي مجموع الدائن"); return false; }
    if (!hasLines)   { alert("أضف أسطراً للقيد أولاً"); return false; }
    const bad = lines.find((l) => (l.debit || l.credit) && !l.account);
    if (bad)         { alert("كل سطر يحتوي مبلغ يجب أن يحدد حساباً"); return false; }
    return true;
  };

  const handleSave = (post) => {
    if (!validate()) return;
    console.log("Saving journal:", { date, notes, bookId, fyId, post, lines });
    navigate("/accounting/journals");
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
            <SoftButton variant="outlined" color="secondary" size="small" onClick={() => handleSave(false)}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> حفظ كمسودة
            </SoftButton>
            <SoftButton variant="gradient" color="success" size="small" onClick={() => handleSave(true)} disabled={!isBalanced}>
              <DoneAllIcon sx={{ mr: 0.5, fontSize: 16 }} /> ترحيل
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {/* Header Card */}
        <Card sx={{ mb: 2, p: 2.5 }}>
          <SoftBox display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>دفتر اليومية</InputLabel>
              <Select value={bookId} label="دفتر اليومية" onChange={(e) => setBookId(e.target.value)}>
                {JOURNAL_BOOKS.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label="تاريخ القيد" value={date}
              onChange={(e) => setDate(e.target.value)} sx={{ minWidth: 180 }} InputLabelProps={{ shrink: true }} />
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
