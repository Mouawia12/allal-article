/* eslint-disable react/prop-types */
import { useMemo, useRef, useState } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { buildTree, classificationLabels, fmt, mockAccounts, mockFiscalYears } from "./mockData";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CLASSIFICATIONS = ["الكل", "asset", "liability", "equity", "revenue", "expense"];

function suggestChildCode(parent, siblings) {
  if (!parent) return "";
  if (siblings.length === 0) return parent.code + "1";
  const nums = siblings.map((s) => {
    const rest = s.code.slice(parent.code.length);
    return parseInt(rest, 10) || 0;
  });
  return parent.code + (Math.max(...nums) + 1);
}

function flattenTree(nodes, result = []) {
  nodes.forEach((n) => {
    result.push(n);
    if (n.children?.length) flattenTree(n.children, result);
  });
  return result;
}

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, expanded, selected, onToggle, onSelect, onAddChild, onEdit }) {
  const hasChildren = node.children?.length > 0;
  const isExpanded = expanded[node.id] ?? depth < 1;
  const isSelected = selected?.id === node.id;
  const cls = classificationLabels[node.classification];

  return (
    <SoftBox>
      <SoftBox
        display="flex"
        alignItems="center"
        onClick={() => onSelect(node)}
        sx={{
          pl: `${8 + depth * 20}px`,
          pr: 1,
          py: 0.6,
          cursor: "pointer",
          borderRadius: 1,
          borderRight: isSelected ? "3px solid #17c1e8" : "3px solid transparent",
          background: isSelected ? "#e3f8fd" : "transparent",
          "&:hover": { background: isSelected ? "#e3f8fd" : "#f4f6f8" },
          transition: "all .15s",
        }}
      >
        {/* Toggle */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          sx={{ p: 0.2, mr: 0.3, visibility: hasChildren ? "visible" : "hidden" }}
        >
          {isExpanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
        </IconButton>

        {/* Code */}
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          sx={{ minWidth: 36, color: cls?.color ?? "#344767", letterSpacing: 0.3, mr: 0.8 }}
        >
          {node.code}
        </SoftTypography>

        {/* Name */}
        <SoftTypography
          variant="caption"
          fontWeight={!node.isPostable ? "bold" : "regular"}
          sx={{ flex: 1, color: node.isActive ? "#344767" : "#adb5bd", textDecoration: node.isActive ? "none" : "line-through" }}
        >
          {node.nameAr}
          {node.isControl && (
            <Chip label="رقابي" size="small" sx={{ ml: 0.8, fontSize: 9, height: 16, background: "#fff3e0", color: "#fb8c00" }} />
          )}
        </SoftTypography>

        {/* Balance */}
        {node.totalBalance > 0 && (
          <SoftTypography variant="caption" fontWeight="medium" sx={{ color: "#344767", mr: 1, fontSize: 11 }}>
            {fmt(node.totalBalance)}
          </SoftTypography>
        )}

        {/* Actions */}
        <SoftBox display="flex" gap={0} onClick={(e) => e.stopPropagation()} sx={{ opacity: 0, ".MuiBox-root:hover > &": { opacity: 1 } }}>
          <Tooltip title="إضافة حساب فرعي">
            <IconButton size="small" onClick={() => onAddChild(node)} sx={{ p: 0.3 }}>
              <AddIcon sx={{ fontSize: 14, color: "#17c1e8" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="تعديل">
            <IconButton size="small" onClick={() => onEdit(node)} sx={{ p: 0.3 }}>
              <EditIcon sx={{ fontSize: 14, color: "#8392ab" }} />
            </IconButton>
          </Tooltip>
        </SoftBox>
      </SoftBox>

      {/* Children */}
      {hasChildren && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
            />
          ))}
        </Collapse>
      )}
    </SoftBox>
  );
}

// ─── Account Detail Panel ─────────────────────────────────────────────────────
function AccountDetail({ account, onEdit, onAddChild }) {
  if (!account) {
    return (
      <SoftBox display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" minHeight={300} color="#8392ab">
        <AccountTreeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
        <SoftTypography variant="caption" color="secondary">اختر حساباً من الشجرة لعرض تفاصيله</SoftTypography>
      </SoftBox>
    );
  }

  const cls = classificationLabels[account.classification];
  const rows = [
    { label: "الكود",         value: account.code },
    { label: "الاسم",         value: account.nameAr },
    { label: "المستوى",       value: account.level },
    { label: "التصنيف",       value: <Chip label={cls?.label} size="small" sx={{ background: cls?.bg, color: cls?.color, fontWeight: 600 }} /> },
    { label: "الطبيعة",       value: account.normalBalance === "debit" ? "مدين" : "دائن" },
    { label: "ترحيل مسموح",  value: account.isPostable ? "✅ نعم" : "❌ لا (حساب أب)" },
    { label: "رقابي",         value: account.isControl ? "نعم (sub-ledger)" : "لا" },
    { label: "الحالة",        value: account.isActive ? <Chip label="نشط" size="small" color="success" /> : <Chip label="غير نشط" size="small" color="error" /> },
  ];

  return (
    <SoftBox p={2}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="bold">{account.code} — {account.nameAr}</SoftTypography>
        <SoftBox display="flex" gap={1}>
          <SoftButton size="small" variant="outlined" color="info" onClick={() => onAddChild(account)}>
            <AddIcon sx={{ fontSize: 14, mr: 0.3 }} /> حساب فرعي
          </SoftButton>
          <SoftButton size="small" variant="outlined" color="secondary" onClick={() => onEdit(account)}>
            <EditIcon sx={{ fontSize: 14, mr: 0.3 }} /> تعديل
          </SoftButton>
        </SoftBox>
      </SoftBox>

      <Divider sx={{ mb: 2 }} />

      {rows.map(({ label, value }) => (
        <SoftBox key={label} display="flex" alignItems="center" mb={1.2}>
          <SoftTypography variant="caption" color="secondary" sx={{ minWidth: 110 }}>{label}</SoftTypography>
          <SoftTypography variant="caption" fontWeight="medium">{value}</SoftTypography>
        </SoftBox>
      ))}

      {/* Balance card */}
      {account.isPostable && (
        <SoftBox mt={2} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2, border: "1px solid #eee" }}>
          <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>الرصيد — السنة المالية 2025</SoftTypography>
          <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#344767" }}>{fmt(account.balance)} دج</SoftTypography>
        </SoftBox>
      )}

      {account.children?.length > 0 && (
        <SoftBox mt={2} p={1.5} sx={{ background: "#f8f9fa", borderRadius: 2, border: "1px solid #eee" }}>
          <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>الرصيد المجمع من الأبناء</SoftTypography>
          <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#344767" }}>{fmt(account.totalBalance)} دج</SoftTypography>
          <SoftTypography variant="caption" color="secondary">{account.children.length} حساب فرعي مباشر</SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

// ─── Account Form Dialog ──────────────────────────────────────────────────────
function AccountFormDialog({ open, onClose, editAccount, parentAccount, allAccounts }) {
  const isEdit = !!editAccount;
  const siblings = useMemo(() => {
    if (isEdit) return [];
    return allAccounts.filter((a) => a.parentId === parentAccount?.id);
  }, [isEdit, parentAccount, allAccounts]);

  const [form, setForm] = useState({
    code: isEdit ? editAccount?.code : suggestChildCode(parentAccount, siblings),
    nameAr: isEdit ? editAccount?.nameAr : "",
    classification: isEdit ? editAccount?.classification : (parentAccount?.classification ?? "asset"),
    normalBalance: isEdit ? editAccount?.normalBalance : (parentAccount?.normalBalance ?? "debit"),
    isPostable: isEdit ? editAccount?.isPostable : true,
    isActive: isEdit ? editAccount?.isActive : true,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SoftTypography variant="h6" fontWeight="bold">
          {isEdit ? "تعديل الحساب" : parentAccount ? `حساب فرعي تحت: ${parentAccount.nameAr}` : "حساب رئيسي جديد"}
        </SoftTypography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={4}>
            <TextField fullWidth size="small" label="الكود *" value={form.code} onChange={(e) => set("code", e.target.value)} />
          </Grid>
          <Grid item xs={8}>
            <TextField fullWidth size="small" label="اسم الحساب *" value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">التصنيف</SoftTypography>
              <Select value={form.classification} onChange={(e) => set("classification", e.target.value)}>
                {["asset","liability","equity","revenue","expense"].map((c) => (
                  <MenuItem key={c} value={c}>{classificationLabels[c]?.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <SoftTypography variant="caption" color="secondary" mb={0.3} display="block">الطبيعة</SoftTypography>
              <Select value={form.normalBalance} onChange={(e) => set("normalBalance", e.target.value)}>
                <MenuItem value="debit">مدين</MenuItem>
                <MenuItem value="credit">دائن</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch checked={form.isPostable} onChange={(e) => set("isPostable", e.target.checked)} />}
              label={<SoftTypography variant="caption">يسمح بالترحيل (leaf)</SoftTypography>}
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} color="success" />}
              label={<SoftTypography variant="caption">نشط</SoftTypography>}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="text" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton variant="gradient" color="info" onClick={onClose}>
          {isEdit ? "حفظ التعديلات" : "إضافة الحساب"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountsTree() {
  const [search, setSearch] = useState("");
  const [clsFilter, setClsFilter] = useState("الكل");
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null); // { mode: 'add'|'edit', parent?, account? }
  const [activeFY] = useState(mockFiscalYears[0]);

  const allAccounts = mockAccounts;

  // Filter flat list then build tree
  const filtered = useMemo(() => {
    let list = allAccounts;
    if (clsFilter !== "الكل") list = list.filter((a) => a.classification === clsFilter);
    if (!showInactive) list = list.filter((a) => a.isActive);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matched = new Set();
      const addParents = (id) => {
        if (!id || matched.has(id)) return;
        matched.add(id);
        const p = allAccounts.find((a) => a.id === id);
        if (p) addParents(p.parentId);
      };
      list.forEach((a) => {
        if (a.nameAr.includes(q) || a.code.includes(q)) addParents(a.id);
      });
      list = allAccounts.filter((a) => matched.has(a.id));
    }
    return list;
  }, [allAccounts, clsFilter, showInactive, search]);

  const tree = useMemo(() => buildTree(filtered), [filtered]);
  const flatAll = useMemo(() => flattenTree(buildTree(allAccounts)), [allAccounts]);

  const toggleNode = (id) => setExpanded((p) => ({ ...p, [id]: !((p[id] ?? true)) }));
  const expandAll = () => {
    const m = {};
    flatAll.forEach((n) => { m[n.id] = true; });
    setExpanded(m);
  };
  const collapseAll = () => setExpanded({});

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Header ── */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">شجرة الحسابات</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {activeFY.name} · {allAccounts.filter((a) => a.isActive).length} حساب نشط
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small" onClick={() => setDialog({ mode: "add", parent: null })}>
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> حساب رئيسي
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2}>
          {/* ── Left: Tree ── */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: "100%", minHeight: 600 }}>
              {/* Search + filters */}
              <SoftBox p={2} borderBottom="1px solid #eee">
                <TextField
                  fullWidth size="small" placeholder="بحث بالكود أو الاسم..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#8392ab" }} /></InputAdornment> }}
                  sx={{ mb: 1.5 }}
                />
                <SoftBox display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <Select value={clsFilter} onChange={(e) => setClsFilter(e.target.value)}>
                      {CLASSIFICATIONS.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c === "الكل" ? "كل التصنيفات" : classificationLabels[c]?.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={<Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
                    label={<SoftTypography variant="caption">غير نشط</SoftTypography>}
                    sx={{ m: 0 }}
                  />
                  <SoftBox ml="auto" display="flex" gap={0.5}>
                    <Tooltip title="توسيع الكل"><IconButton size="small" onClick={expandAll}><UnfoldMoreIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="طي الكل"><IconButton size="small" onClick={collapseAll}><UnfoldLessIcon fontSize="small" /></IconButton></Tooltip>
                  </SoftBox>
                </SoftBox>
              </SoftBox>

              {/* Tree */}
              <SoftBox p={1} sx={{ overflowY: "auto", maxHeight: 520 }}>
                {tree.length === 0 ? (
                  <SoftTypography variant="caption" color="secondary" sx={{ display: "block", textAlign: "center", py: 4 }}>
                    لا توجد حسابات
                  </SoftTypography>
                ) : tree.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    selected={selected}
                    onToggle={toggleNode}
                    onSelect={setSelected}
                    onAddChild={(n) => setDialog({ mode: "add", parent: n })}
                    onEdit={(n) => setDialog({ mode: "edit", account: n })}
                  />
                ))}
              </SoftBox>

              {/* Legend */}
              <SoftBox p={1.5} borderTop="1px solid #eee" display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(classificationLabels).map(([k, v]) => (
                  <Chip key={k} label={v.label} size="small" sx={{ background: v.bg, color: v.color, fontSize: 10, height: 20 }} />
                ))}
              </SoftBox>
            </Card>
          </Grid>

          {/* ── Right: Detail ── */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: "100%", minHeight: 600 }}>
              <AccountDetail
                account={selected}
                onEdit={(n) => setDialog({ mode: "edit", account: n })}
                onAddChild={(n) => setDialog({ mode: "add", parent: n })}
              />
            </Card>
          </Grid>
        </Grid>
      </SoftBox>

      {/* Form Dialog */}
      {dialog && (
        <AccountFormDialog
          open={!!dialog}
          onClose={() => setDialog(null)}
          editAccount={dialog.mode === "edit" ? dialog.account : null}
          parentAccount={dialog.parent ?? null}
          allAccounts={flatAll}
        />
      )}

      <Footer />
    </DashboardLayout>
  );
}
