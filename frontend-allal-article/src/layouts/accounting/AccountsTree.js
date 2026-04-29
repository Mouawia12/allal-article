/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import SearchIcon from "@mui/icons-material/Search";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  ACCOUNT_DEPARTMENTS,
  ACCOUNT_LISTS,
  ACCOUNT_SIDES,
  ACCOUNT_TYPES,
  buildAccountTreeV2,
  flattenV2,
  fmt,
  isDuplicateCode,
  suggestChildCode,
} from "./mockData";
import { accountingApi } from "services";
import { applyApiErrors } from "utils/formErrors";

// ─── Helpers ──────────────────────────────────────────────────────────────────
let nextId = 1000;
const newId = () => ++nextId;

// "1101 # عقارات ومباني"
const displayCode = (a) => `${a.code} # ${a.nameAr}`;

const isPostable = (a) => a.type === 3;

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TreeNode({ node, depth, expanded, selected, onToggle, onSelect, onAddChild, onEdit }) {
  const hasChildren = node.children?.length > 0;
  const isOpen      = expanded[node.id] ?? depth < 1;
  const isSel       = selected?.id === node.id;
  const listMeta    = ACCOUNT_LISTS[node.list];
  const typeMeta    = ACCOUNT_TYPES[node.type];

  return (
    <SoftBox>
      <SoftBox
        className="tree-row"
        display="flex"
        alignItems="center"
        onClick={() => onSelect(node)}
        sx={{
          pl: `${6 + depth * 20}px`,
          pr: 0.5,
          py: 0.55,
          cursor: "pointer",
          borderRadius: "6px",
          borderRight: `3px solid ${isSel ? listMeta.color : "transparent"}`,
          background: isSel ? `${listMeta.color}14` : "transparent",
          "&:hover": { background: isSel ? `${listMeta.color}14` : "#f4f6f8" },
          "&:hover .row-actions": { opacity: 1 },
          transition: "background 0.12s",
        }}
      >
        {/* Expand toggle */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          sx={{ p: 0.2, mr: 0.2, flexShrink: 0, visibility: hasChildren ? "visible" : "hidden" }}
        >
          {isOpen
            ? <ExpandMoreIcon sx={{ fontSize: 15, color: "#8392ab" }} />
            : <ChevronRightIcon sx={{ fontSize: 15, color: "#8392ab" }} />}
        </IconButton>

        {/* Type dot */}
        <SoftBox
          sx={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: typeMeta.color, mr: 0.8,
            opacity: node.is_active ? 1 : 0.35,
          }}
        />

        {/* Code */}
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          sx={{
            minWidth: 42, mr: 0.5, flexShrink: 0,
            fontFamily: "monospace", fontSize: "12px",
            color: node.is_active ? listMeta.color : "#adb5bd",
            opacity: node.is_active ? 1 : 0.6,
          }}
        >
          {node.code}
        </SoftTypography>

        {/* Separator # */}
        <SoftTypography variant="caption" sx={{ color: "#ced4da", mr: 0.5, flexShrink: 0, fontSize: "11px" }}>
          #
        </SoftTypography>

        {/* Name */}
        <SoftTypography
          variant="caption"
          fontWeight={node.type <= 1 ? "bold" : "regular"}
          sx={{
            flex: 1, color: node.is_active ? "#344767" : "#adb5bd",
            textDecoration: node.is_active ? "none" : "line-through",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          {node.nameAr}
        </SoftTypography>

        {/* Balance (leaf only) */}
        {isPostable(node) && node.totalBalance > 0 && (
          <SoftTypography
            variant="caption"
            sx={{ color: "#67748e", fontSize: "10px", mr: 1, flexShrink: 0, fontFamily: "monospace" }}
          >
            {fmt(node.totalBalance)}
          </SoftTypography>
        )}

        {/* Row actions — visible on hover */}
        <SoftBox
          className="row-actions"
          display="flex"
          gap={0}
          onClick={(e) => e.stopPropagation()}
          sx={{ opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}
        >
          <Tooltip title="إضافة حساب فرعي">
            <IconButton size="small" onClick={() => onAddChild(node)}
              sx={{ p: 0.3, color: listMeta.color }}>
              <AddIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="تعديل">
            <IconButton size="small" onClick={() => onEdit(node)}
              sx={{ p: 0.3, color: "#8392ab" }}>
              <EditIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </SoftBox>
      </SoftBox>

      {/* Children */}
      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <SoftBox sx={{ borderRight: `1px solid ${listMeta.color}28`, ml: `${14 + depth * 20}px` }}>
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
          </SoftBox>
        </Collapse>
      )}
    </SoftBox>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function AccountDetail({ account, allAccounts, onEdit, onAddChild }) {
  if (!account) {
    return (
      <SoftBox
        display="flex" flexDirection="column"
        alignItems="center" justifyContent="center"
        height="100%" minHeight={300} gap={1.5}
      >
        <AccountTreeIcon sx={{ fontSize: 52, color: "#d2d6da" }} />
        <SoftTypography variant="caption" color="secondary">
          اختر حساباً من الشجرة لعرض تفاصيله
        </SoftTypography>
      </SoftBox>
    );
  }

  const listMeta  = ACCOUNT_LISTS[account.list];
  const typeMeta  = ACCOUNT_TYPES[account.type];
  const parent    = account.parent_id ? allAccounts.find((a) => a.id === account.parent_id) : null;

  const fields = [
    { label: "الكود",        value: <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 14 }}>{account.code}</span> },
    { label: "الاسم",        value: account.nameAr },
    { label: "النوع",        value: <Chip label={typeMeta.label} size="small" sx={{ background: typeMeta.bg, color: typeMeta.color, fontWeight: 600, fontSize: 11 }} /> },
    { label: "القائمة",      value: <Chip label={listMeta.label} size="small" sx={{ background: listMeta.bg, color: listMeta.color, fontWeight: 600, fontSize: 11 }} /> },
    { label: "الجهة",        value: ACCOUNT_DEPARTMENTS[account.department]?.label },
    { label: "الطبيعة",      value: ACCOUNT_SIDES[account.side]?.label },
    { label: "المستوى",      value: `المستوى ${account.level}` },
    { label: "الحساب الأب",  value: parent ? <span style={{ fontFamily: "monospace", fontSize: 12 }}>{displayCode(parent)}</span> : "—" },
    { label: "الحالة",       value: account.is_active
        ? <Chip label="نشط" size="small" color="success" sx={{ fontSize: 11 }} />
        : <Chip label="غير نشط" size="small" color="error" sx={{ fontSize: 11 }} /> },
  ];

  return (
    <SoftBox p={2.5}>
      {/* Header */}
      <SoftBox
        display="flex" justifyContent="space-between" alignItems="flex-start"
        mb={2} pb={2} sx={{ borderBottom: `2px solid ${listMeta.color}33` }}
      >
        <SoftBox>
          <SoftBox display="flex" alignItems="center" gap={1} mb={0.5}>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ fontFamily: "monospace", color: listMeta.color }}>
              {account.code}
            </SoftTypography>
            <SoftTypography variant="caption" sx={{ color: "#adb5bd" }}>#</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#344767" }}>
              {account.nameAr}
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={0.8}>
            <Chip label={typeMeta.label} size="small" sx={{ background: typeMeta.bg, color: typeMeta.color, fontSize: 10, height: 18 }} />
            <Chip label={listMeta.label} size="small" sx={{ background: listMeta.bg, color: listMeta.color, fontSize: 10, height: 18 }} />
            {!account.is_active && <Chip label="غير نشط" size="small" color="error" sx={{ fontSize: 10, height: 18 }} />}
          </SoftBox>
        </SoftBox>
        <SoftBox display="flex" gap={1}>
          <SoftButton size="small" variant="outlined" color="info" onClick={() => onAddChild(account)}>
            <AddIcon sx={{ fontSize: 13, mr: 0.3 }} /> فرعي
          </SoftButton>
          <SoftButton size="small" variant="outlined" color="secondary" onClick={() => onEdit(account)}>
            <EditIcon sx={{ fontSize: 13, mr: 0.3 }} /> تعديل
          </SoftButton>
        </SoftBox>
      </SoftBox>

      {/* Fields */}
      <Grid container spacing={0}>
        {fields.map(({ label, value }) => (
          <Grid item xs={6} key={label}>
            <SoftBox display="flex" alignItems="center" mb={1.4} gap={1}>
              <SoftTypography variant="caption" color="secondary" sx={{ minWidth: 80, flexShrink: 0 }}>
                {label}
              </SoftTypography>
              <SoftTypography variant="caption" fontWeight="medium" component="div">
                {value}
              </SoftTypography>
            </SoftBox>
          </Grid>
        ))}
      </Grid>

      {/* Balance */}
      {isPostable(account) && (
        <SoftBox mt={2} p={2}
          sx={{ background: `${listMeta.color}0d`, borderRadius: 2, border: `1px solid ${listMeta.color}33` }}>
          <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>
            الرصيد
          </SoftTypography>
          <SoftTypography variant="h5" fontWeight="bold" sx={{ color: listMeta.color }}>
            {fmt(account.balance ?? 0)} دج
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            {ACCOUNT_SIDES[account.side]?.label}
          </SoftTypography>
        </SoftBox>
      )}

      {/* Group total */}
      {!isPostable(account) && account.totalBalance > 0 && (
        <SoftBox mt={2} p={2}
          sx={{ background: "#f8f9fa", borderRadius: 2, border: "1px solid #e9ecef" }}>
          <SoftTypography variant="caption" color="secondary" display="block" mb={0.5}>
            الرصيد المجمع ({account.children?.length ?? 0} حساب فرعي مباشر)
          </SoftTypography>
          <SoftTypography variant="h5" fontWeight="bold" sx={{ color: "#344767" }}>
            {fmt(account.totalBalance)} دج
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

// ─── Account Form Dialog ──────────────────────────────────────────────────────
function AccountFormDialog({ open, onClose, onSave, editAccount, parentAccount, allAccounts }) {
  const isEdit    = !!editAccount;
  const siblings  = useMemo(
    () => !isEdit ? allAccounts.filter((a) => a.parent_id === (parentAccount?.id ?? null)) : [],
    [isEdit, parentAccount, allAccounts]
  );
  const suggested = useMemo(
    () => !isEdit ? suggestChildCode(parentAccount ?? null, siblings) : "",
    [isEdit, parentAccount, siblings]
  );

  const initForm = () => ({
    code:       isEdit ? editAccount.code       : suggested,
    nameAr:     isEdit ? editAccount.nameAr     : "",
    type:       isEdit ? editAccount.type        : (parentAccount ? Math.min(parentAccount.type + 1, 3) : 0),
    list:       isEdit ? editAccount.list        : (parentAccount?.list       ?? 1),
    department: isEdit ? editAccount.department  : (parentAccount?.department ?? 1),
    side:       isEdit ? editAccount.side        : (parentAccount?.side       ?? 1),
    is_active:  isEdit ? editAccount.is_active   : true,
  });

  const [form, setForm]       = useState(initForm);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  // Reset when dialog reopens
  useMemo(() => { if (open) { setForm(initForm()); setTouched(false); setErrors({}); setSaving(false); } }, [open]); // eslint-disable-line

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k] || errors._global || (k === "nameAr" && errors.name)) {
      setErrors((current) => ({ ...current, [k]: "", ...(k === "nameAr" ? { name: "" } : {}), _global: "" }));
    }
  };

  // Validation
  const codeEmpty     = !form.code.trim();
  const codeDuplicate = isDuplicateCode(form.code.trim(), allAccounts, isEdit ? editAccount.id : null);
  const nameEmpty     = !form.nameAr.trim();
  const codeError     = errors.code || (touched && (codeEmpty ? "الكود مطلوب" : codeDuplicate ? "الكود موجود مسبقاً" : ""));
  const nameError     = errors.nameAr || errors.name || (touched && nameEmpty ? "الاسم مطلوب" : "");
  const hasError      = codeEmpty || codeDuplicate || nameEmpty;

  const handleSave = async () => {
    setTouched(true);
    if (hasError) return;

    const parentId = isEdit ? editAccount.parent_id : (parentAccount?.id ?? null);
    const level    = isEdit ? editAccount.level : ((parentAccount?.level ?? 0) + 1);

    setSaving(true);
    setErrors({});
    try {
      await onSave({
        ...(isEdit ? editAccount : {}),
        id:          isEdit ? editAccount.id : newId(),
        code:        form.code.trim(),
        nameAr:      form.nameAr.trim(),
        parent_id:   parentId,
        parent_code: isEdit ? editAccount.parent_code : (parentAccount?.code ?? null),
        level,
        type:        form.type,
        list:        form.list,
        department:  form.department,
        side:        form.side,
        is_active:   form.is_active,
        balance:     isEdit ? (editAccount.balance ?? 0) : 0,
      });
      onClose();
    } catch (error) {
      applyApiErrors(error, setErrors, "تعذر حفظ الحساب");
    } finally {
      setSaving(false);
    }
  };

  // Fields inherited from parent (shown with indicator)
  const inherited = !isEdit && parentAccount
    ? { list: true, department: true, side: true }
    : {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <SoftBox>
          <SoftTypography variant="h6" fontWeight="bold">
            {isEdit ? "تعديل الحساب" : parentAccount ? "حساب فرعي جديد" : "حساب رئيسي جديد"}
          </SoftTypography>
          {parentAccount && !isEdit && (
            <SoftTypography variant="caption" color="secondary">
              تحت: <strong style={{ fontFamily: "monospace" }}>{displayCode(parentAccount)}</strong>
            </SoftTypography>
          )}
        </SoftBox>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} mt={0}>
          {errors._global && (
            <Grid item xs={12}>
              <Alert severity="error">{errors._global}</Alert>
            </Grid>
          )}

          {/* Code */}
          <Grid item xs={4}>
            <TextField
              fullWidth size="small" label="الكود *"
              value={form.code}
              onChange={(e) => set("code", e.target.value)}
              error={!!codeError}
              helperText={codeError || " "}
              InputProps={{
                endAdornment: !isEdit && form.code === suggested && (
                  <InputAdornment position="end">
                    <Tooltip title="كود مُقترح تلقائياً">
                      <LightbulbOutlinedIcon sx={{ fontSize: 14, color: "#fb8c00" }} />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              sx={{ "& input": { fontFamily: "monospace", fontWeight: 700 } }}
            />
          </Grid>

          {/* Name */}
          <Grid item xs={8}>
            <TextField
              fullWidth size="small" label="اسم الحساب *"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
              error={!!nameError}
              helperText={nameError || " "}
            />
          </Grid>

          {/* Type */}
          <Grid item xs={6}>
            <TextField
              fullWidth select size="small" label="النوع"
              value={form.type}
              onChange={(e) => set("type", Number(e.target.value))}
            >
              {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                <MenuItem key={k} value={Number(k)}>{v.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* List */}
          <Grid item xs={6}>
            <TextField
              fullWidth select size="small"
              label={<SoftBox component="span" display="flex" alignItems="center" gap={0.5}>
                القائمة {inherited.list && <Chip label="موروث" size="small" sx={{ height: 14, fontSize: 9, background: "#fff3e0", color: "#fb8c00" }} />}
              </SoftBox>}
              value={form.list}
              onChange={(e) => set("list", Number(e.target.value))}
            >
              {Object.entries(ACCOUNT_LISTS).map(([k, v]) => (
                <MenuItem key={k} value={Number(k)}>{v.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Department */}
          <Grid item xs={6}>
            <TextField
              fullWidth select size="small"
              label={<SoftBox component="span" display="flex" alignItems="center" gap={0.5}>
                الجهة {inherited.department && <Chip label="موروث" size="small" sx={{ height: 14, fontSize: 9, background: "#fff3e0", color: "#fb8c00" }} />}
              </SoftBox>}
              value={form.department}
              onChange={(e) => set("department", Number(e.target.value))}
            >
              {Object.entries(ACCOUNT_DEPARTMENTS).map(([k, v]) => (
                <MenuItem key={k} value={Number(k)}>{v.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Side */}
          <Grid item xs={6}>
            <TextField
              fullWidth select size="small"
              label={<SoftBox component="span" display="flex" alignItems="center" gap={0.5}>
                الطبيعة {inherited.side && <Chip label="موروث" size="small" sx={{ height: 14, fontSize: 9, background: "#fff3e0", color: "#fb8c00" }} />}
              </SoftBox>}
              value={form.side}
              onChange={(e) => set("side", Number(e.target.value))}
            >
              {Object.entries(ACCOUNT_SIDES).map(([k, v]) => (
                <MenuItem key={k} value={Number(k)}>{v.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Level (read-only info) */}
          <Grid item xs={6}>
            <SoftBox px={1.5} py={1}
              sx={{ background: "#f8f9fa", borderRadius: 1.5, border: "1px solid #e9ecef" }}>
              <SoftTypography variant="caption" color="secondary" display="block" sx={{ fontSize: 10, mb: 0.2 }}>
                المستوى (محسوب تلقائياً)
              </SoftTypography>
              <SoftTypography variant="caption" fontWeight="bold">
                المستوى {isEdit ? editAccount.level : ((parentAccount?.level ?? 0) + 1)}
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Active switch */}
          <Grid item xs={6}>
            <SoftBox display="flex" alignItems="center" height="100%" pt={0.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => set("is_active", e.target.checked)}
                    color="success" size="small"
                  />
                }
                label={
                  <SoftTypography variant="caption" fontWeight="medium">
                    {form.is_active ? "نشط" : "غير نشط"}
                  </SoftTypography>
                }
                sx={{ m: 0, gap: 0.8 }}
              />
            </SoftBox>
          </Grid>

          {/* Duplicate warning */}
          {touched && codeDuplicate && (
            <Grid item xs={12}>
              <SoftBox display="flex" alignItems="center" gap={1} p={1}
                sx={{ background: "#ffeaea", borderRadius: 1.5, border: "1px solid #ea060622" }}>
                <ErrorOutlineIcon sx={{ fontSize: 16, color: "#ea0606" }} />
                <SoftTypography variant="caption" sx={{ color: "#ea0606" }}>
                  الكود <strong>{form.code}</strong> مستخدم مسبقاً — يجب أن يكون فريداً داخل الدليل
                </SoftTypography>
              </SoftBox>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <SoftButton variant="text" color="secondary" onClick={onClose}>إلغاء</SoftButton>
        <SoftButton
          variant="gradient" color="info"
          disabled={saving}
          onClick={handleSave}
          startIcon={<CheckCircleOutlineIcon />}
        >
          {saving ? "جارٍ الحفظ..." : isEdit ? "حفظ التعديلات" : "إضافة الحساب"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountsTree() {
  const [accounts, setAccounts]   = useState([]);
  const [search, setSearch]       = useState("");
  const [listFilter, setListFilter] = useState(0);
  const [showInactive, setShowInactive] = useState(false);
  const [expanded, setExpanded]   = useState({});
  const [selected, setSelected]   = useState(null);
  const [dialog, setDialog]       = useState(null);
  const [activeFY, setActiveFY]   = useState(null);

  useEffect(() => {
    accountingApi.listAccounts()
      .then((r) => setAccounts(r.data?.content ?? r.data ?? []))
      .catch(console.error);
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setActiveFY(fys.find((f) => !f.closed) ?? fys[0] ?? null);
      })
      .catch(console.error);
  }, []);

  // ── Save handler ──────────────────────────────────────────────────────────
  const handleSave = (formData) => {
    const isEdit = Boolean(formData.id && accounts.some((a) => a.id === formData.id));
    const apiData = {
      code: formData.code,
      nameAr: formData.nameAr,
      parentId: formData.parent_id ?? null,
      classification: formData.list ?? formData.classification ?? null,
      normalBalance: formData.side ?? formData.normalBalance ?? null,
      isPostable: !formData.children?.length,
      isActive: formData.is_active ?? true,
    };
    const apiCall = isEdit
      ? accountingApi.updateAccount(formData.id, apiData).then((r) => r.data)
      : accountingApi.createAccount(apiData).then((r) => r.data);
    return apiCall
      .then((saved) => {
        setAccounts((prev) => {
          const exists = prev.some((a) => a.id === saved.id);
          return exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved];
        });
        setSelected(saved);
        setDialog(null);
      });
  };

  // ── Filtered flat list ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = accounts;
    if (!showInactive) list = list.filter((a) => a.is_active);
    if (listFilter)    list = list.filter((a) => a.list === listFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matched = new Set();
      const addAncestors = (id) => {
        if (!id || matched.has(id)) return;
        matched.add(id);
        const p = accounts.find((a) => a.id === id);
        if (p) addAncestors(p.parent_id);
      };
      accounts.forEach((a) => {
        if (a.nameAr.includes(q) || a.code.includes(q)) addAncestors(a.id);
      });
      list = list.filter((a) => matched.has(a.id));
    }
    return list;
  }, [accounts, search, listFilter, showInactive]);

  const tree    = useMemo(() => buildAccountTreeV2(filtered),  [filtered]);
  const flatAll = useMemo(() => flattenV2(buildAccountTreeV2(accounts)), [accounts]);

  // ── Expand / collapse ─────────────────────────────────────────────────────
  const toggleNode  = (id) => setExpanded((p) => ({ ...p, [id]: !(p[id] ?? true) }));
  const expandAll   = () => { const m = {}; flatAll.forEach((n) => { m[n.id] = true; }); setExpanded(m); };
  const collapseAll = () => setExpanded({});

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalActive = accounts.filter((a) => a.is_active).length;
  const totalLeaf   = accounts.filter((a) => a.is_active && isPostable(a)).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* ── Header ── */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">شجرة الحسابات</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              {activeFY?.name} · {totalActive} حساب نشط · {totalLeaf} حساب ترحيل
            </SoftTypography>
          </SoftBox>
          <SoftButton
            variant="gradient" color="info" size="small"
            onClick={() => setDialog({ mode: "add", parent: null })}
          >
            <AddIcon sx={{ mr: 0.5, fontSize: 16 }} /> حساب رئيسي
          </SoftButton>
        </SoftBox>

        <Grid container spacing={2.5}>
          {/* ── Left: Tree panel ── */}
          <Grid item xs={12} md={5} lg={4}>
            <Card sx={{ height: "100%", minHeight: 620, display: "flex", flexDirection: "column" }}>

              {/* Search & filters */}
              <SoftBox p={2} sx={{ borderBottom: "1px solid #f0f2f5" }}>
                <TextField
                  fullWidth size="small"
                  placeholder="بحث بالكود أو الاسم..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: "#8392ab" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* List filter chips */}
                <SoftBox display="flex" gap={0.6} flexWrap="wrap" alignItems="center">
                  <Chip
                    label="الكل"
                    size="small"
                    onClick={() => setListFilter(0)}
                    sx={{
                      cursor: "pointer", height: 22, fontSize: "10px",
                      background: listFilter === 0 ? "#344767" : "#e9ecef",
                      color: listFilter === 0 ? "#fff" : "#67748e",
                    }}
                  />
                  {Object.entries(ACCOUNT_LISTS).map(([k, v]) => (
                    <Chip
                      key={k}
                      label={v.label}
                      size="small"
                      onClick={() => setListFilter(listFilter === Number(k) ? 0 : Number(k))}
                      sx={{
                        cursor: "pointer", height: 22, fontSize: "10px",
                        background: listFilter === Number(k) ? v.color : v.bg,
                        color: listFilter === Number(k) ? "#fff" : v.color,
                        transition: "all 0.15s",
                      }}
                    />
                  ))}

                  <SoftBox ml="auto" display="flex" gap={0.3} alignItems="center">
                    <FormControlLabel
                      control={<Switch size="small" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
                      label={<SoftTypography variant="caption" sx={{ fontSize: "10px" }}>غير نشط</SoftTypography>}
                      sx={{ m: 0, gap: 0.3 }}
                    />
                    <Tooltip title="توسيع الكل">
                      <IconButton size="small" onClick={expandAll} sx={{ p: 0.3 }}>
                        <UnfoldMoreIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="طي الكل">
                      <IconButton size="small" onClick={collapseAll} sx={{ p: 0.3 }}>
                        <UnfoldLessIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </SoftBox>
                </SoftBox>
              </SoftBox>

              {/* Tree list */}
              <SoftBox flex={1} p={1} sx={{ overflowY: "auto" }}>
                {tree.length === 0 ? (
                  <SoftTypography variant="caption" color="secondary"
                    sx={{ display: "block", textAlign: "center", py: 5 }}>
                    لا توجد حسابات تطابق البحث
                  </SoftTypography>
                ) : (
                  tree.map((node) => (
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
                  ))
                )}
              </SoftBox>

              {/* Type legend */}
              <SoftBox
                px={2} py={1.2}
                display="flex" flexWrap="wrap" gap={0.8}
                sx={{ borderTop: "1px solid #f0f2f5" }}
              >
                {Object.entries(ACCOUNT_TYPES).map(([k, v]) => (
                  <SoftBox key={k} display="flex" alignItems="center" gap={0.4}>
                    <SoftBox sx={{ width: 7, height: 7, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
                    <SoftTypography variant="caption" sx={{ fontSize: "10px", color: "#8392ab" }}>{v.label}</SoftTypography>
                  </SoftBox>
                ))}
              </SoftBox>
            </Card>
          </Grid>

          {/* ── Right: Detail panel ── */}
          <Grid item xs={12} md={7} lg={8}>
            <Card sx={{ height: "100%", minHeight: 620 }}>
              <AccountDetail
                account={selected}
                allAccounts={flatAll}
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
          onSave={handleSave}
          editAccount={dialog.mode === "edit" ? dialog.account : null}
          parentAccount={dialog.parent ?? null}
          allAccounts={flatAll}
        />
      )}

      <Footer />
    </DashboardLayout>
  );
}
