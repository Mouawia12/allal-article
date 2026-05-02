/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityIcon from "@mui/icons-material/Visibility";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { fmt, journalSourceLabels, journalStatusLabels, journalTypeLabels } from "./mockData";
import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const STATUS_TABS = ["الكل", "draft", "posted", "reversed"];
const STATUS_LABELS = { الكل: "الكل", draft: "مسودة", posted: "مرحّلة", reversed: "معكوسة" };

// ─── Preview Dialog ───────────────────────────────────────────────────────────
function JournalPreviewDialog({ journal, onClose }) {
  if (!journal) return null;
  const st = journalStatusLabels[journal.status];
  const typeLabel = journal.journalBookName ?? journalTypeLabels[journal.type]?.label ?? journal.type ?? "—";
  const sourceLabel = journalSourceLabels[journal.source] ?? journal.source ?? "—";
  return (
    <Dialog open={!!journal} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftBox>
          <SoftTypography variant="h6" fontWeight="bold">{journal.number}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">{journal.description}</SoftTypography>
        </SoftBox>
        <SoftBox display="flex" alignItems="center" gap={1}>
          <Chip label={st?.label} size="small" sx={{ background: st?.bg, color: st?.color, fontWeight: 600 }} />
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </SoftBox>
      </DialogTitle>

      <DialogContent dividers>
        <SoftBox display="flex" gap={3} mb={2} flexWrap="wrap">
          {[
            { label: "التاريخ",  value: journal.date },
            { label: "النوع",    value: typeLabel },
            { label: "المصدر",   value: sourceLabel },
          ].map(({ label, value }) => (
            <SoftBox key={label}>
              <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
              <SoftTypography variant="button" fontWeight="medium">{value}</SoftTypography>
            </SoftBox>
          ))}
        </SoftBox>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: "#f8f9fa" }}>
                {["الحساب", "الوصف", "مدين", "دائن"].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {journal.lines.map((line, i) => (
                <TableRow key={i} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                  <TableCell>
                    <SoftTypography variant="caption" fontWeight="medium">{line.accountCode}</SoftTypography>
                    <SoftTypography variant="caption" color="secondary" sx={{ ml: 1 }}>{line.accountName}</SoftTypography>
                  </TableCell>
                  <TableCell><SoftTypography variant="caption">{line.description || "—"}</SoftTypography></TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    {line.debit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(line.debit)}</SoftTypography> : "—"}
                  </TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    {line.credit > 0 ? <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(line.credit)}</SoftTypography> : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 1.5 }} />
        <SoftBox display="flex" justifyContent="flex-end" gap={4}>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">إجمالي المدين</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(journal.totalDebit)}</SoftTypography>
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">إجمالي الدائن</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(journal.totalCredit)}</SoftTypography>
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">الفرق</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: Math.abs(journal.totalDebit - journal.totalCredit) < 0.01 ? "#82d616" : "#ea0606" }}>
              {fmt(Math.abs(journal.totalDebit - journal.totalCredit))}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {journal.status === "posted" && (
          <SoftButton variant="outlined" color="warning" size="small">
            <ReplayIcon sx={{ fontSize: 14, mr: 0.5 }} /> عكس القيد
          </SoftButton>
        )}
        <SoftButton variant="text" color="secondary" onClick={onClose}>إغلاق</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Journals() {
  const navigate = useNavigate();
  const [fiscalYears, setFiscalYears] = useState([]);
  const [allJournals, setAllJournals] = useState([]);
  const [tab, setTab] = useState(0);
  const [fyFilter, setFyFilter] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pageError, setPageError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageError("");
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) setFyFilter(active.id);
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل السنوات المالية"));
        setFiscalYears([]);
      });
  }, []);

  useEffect(() => {
    if (!fyFilter) return;
    setLoading(true);
    setPageError("");
    accountingApi.listJournals({ fiscalYearId: fyFilter, page: 0, size: 200 })
      .then((r) => setAllJournals(r.data?.content ?? r.data ?? []))
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل القيود اليومية"));
        setAllJournals([]);
      })
      .finally(() => setLoading(false));
  }, [fyFilter]);

  const activeFY = fiscalYears.find((y) => y.id === fyFilter);
  const isLocked = activeFY?.closed;

  const journals = allJournals.filter((j) => {
    if (fyFilter && j.fiscalYearId !== fyFilter) return false;
    const s = STATUS_TABS[tab];
    return s === "الكل" || j.status === s;
  });

  const stats = allJournals.filter((j) => !fyFilter || j.fiscalYearId === fyFilter);
  const totalPosted = stats.filter((j) => j.status === "posted").length;
  const totalDraft  = stats.filter((j) => j.status === "draft").length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">دفتر اليومية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">{activeFY?.name}</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={fyFilter ?? ""} onChange={(e) => setFyFilter(Number(e.target.value))}>
                {fiscalYears.map((y) => (
                  <MenuItem key={y.id} value={y.id}>{y.name} {y.closed && "🔒"}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isLocked && (
              <SoftButton variant="gradient" color="info" size="small" onClick={() => navigate("/accounting/journals/new")}>
                <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> قيد يدوي
              </SoftButton>
            )}
          </SoftBox>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        {loading && (
          <SoftTypography variant="caption" color="secondary">جارٍ تحميل القيود...</SoftTypography>
        )}

        {/* Stats */}
        <SoftBox display="flex" gap={2} mb={2} flexWrap="wrap">
          {[
            { label: "إجمالي القيود", value: stats.length, color: "#344767" },
            { label: "مرحّلة",         value: totalPosted,   color: "#82d616" },
            { label: "مسودة",          value: totalDraft,    color: "#fb8c00" },
          ].map(({ label, value, color }) => (
            <SoftBox key={label} sx={{ background: "#fff", border: "1px solid #eee", borderRadius: 2, px: 2, py: 1.5, minWidth: 120 }}>
              <SoftTypography variant="caption" color="secondary" display="block">{label}</SoftTypography>
              <SoftTypography variant="h5" fontWeight="bold" sx={{ color }}>{value}</SoftTypography>
            </SoftBox>
          ))}
        </SoftBox>

        {isLocked && (
          <SoftBox mb={2} p={1.5} sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2 }}>
            <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontWeight: 600 }}>
              🔒 السنة المالية مغلقة — القيود معروضة للقراءة فقط
            </SoftTypography>
          </SoftBox>
        )}

        <Card>
          <SoftBox p={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {STATUS_TABS.map((s, i) => (
                <Tab key={s} label={<SoftTypography variant="caption" fontWeight="medium">{STATUS_LABELS[s]}</SoftTypography>} />
              ))}
            </Tabs>
          </SoftBox>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["رقم القيد", "التاريخ", "النوع", "المصدر", "البيان", "مجموع مدين", "مجموع دائن", "الحالة", ""].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {journals.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا توجد قيود</TableCell></TableRow>
                ) : journals.map((j) => {
                  const st = journalStatusLabels[j.status];
                  return (
                    <TableRow key={j.id} sx={{ "&:hover": { background: "#f8f9fa" }, cursor: "pointer" }} onClick={() => setPreview(j)}>
                      <TableCell><SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#17c1e8" }}>{j.number}</SoftTypography></TableCell>
                      <TableCell><SoftTypography variant="caption">{j.date}</SoftTypography></TableCell>
                      <TableCell><Chip label={j.journalBookName ?? journalTypeLabels[j.type]?.label ?? j.type ?? "—"} size="small" /></TableCell>
                      <TableCell><SoftTypography variant="caption">{journalSourceLabels[j.source] ?? j.source ?? "—"}</SoftTypography></TableCell>
                      <TableCell><SoftTypography variant="caption">{j.description}</SoftTypography></TableCell>
                      <TableCell style={{ textAlign: "right" }}><SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#17c1e8" }}>{fmt(j.totalDebit)}</SoftTypography></TableCell>
                      <TableCell style={{ textAlign: "right" }}><SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#82d616" }}>{fmt(j.totalCredit)}</SoftTypography></TableCell>
                      <TableCell><Chip label={st?.label} size="small" sx={{ background: st?.bg, color: st?.color, fontWeight: 600 }} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="عرض">
                          <IconButton size="small" onClick={() => setPreview(j)}><VisibilityIcon sx={{ fontSize: 15 }} /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </SoftBox>

      <JournalPreviewDialog journal={preview} onClose={() => setPreview(null)} />
      <Footer />
    </DashboardLayout>
  );
}
