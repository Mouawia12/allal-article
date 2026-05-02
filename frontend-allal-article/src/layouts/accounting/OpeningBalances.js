/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { classificationLabels, fmt } from "./mockData";
import { accountingApi } from "services";
import { applyApiErrors, getApiErrorMessage } from "utils/formErrors";

export default function OpeningBalances() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [postable, setPostable] = useState([]);
  const [fyId, setFyId] = useState(null);
  const [balances, setBalances] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoadError("");
    accountingApi.listFiscalYears()
      .then((r) => {
        const fys = r.data?.content ?? r.data ?? [];
        setFiscalYears(fys);
        const active = fys.find((f) => !f.closed) ?? fys[0];
        if (active) setFyId(active.id);
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل السنوات المالية"));
        setFiscalYears([]);
      });
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        const pts = all.filter((a) => a.isPostable !== false && a.isActive !== false);
        setPostable(pts);
        const m = {};
        pts.forEach((a) => {
          m[a.id] = {
            debit: a.balance > 0 && a.normalBalance === "debit" ? a.balance : 0,
            credit: a.balance > 0 && a.normalBalance === "credit" ? a.balance : 0,
          };
        });
        setBalances(m);
      })
      .catch((error) => {
        setLoadError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل الحسابات");
          return current ? `${current}؛ ${message}` : message;
        });
        setPostable([]);
      });
  }, []);

  const isLocked = fiscalYears.find((y) => y.id === fyId)?.closed;

  const setVal = (id, side, val) => {
    setBalances((p) => ({ ...p, [id]: { ...p[id], [side]: Number(val) || 0 } }));
    if (errors._global || errors.items) setErrors({});
  };

  const totalDebit  = useMemo(() => postable.reduce((s, a) => s + (balances[a.id]?.debit  || 0), 0), [balances]);
  const totalCredit = useMemo(() => postable.reduce((s, a) => s + (balances[a.id]?.credit || 0), 0), [balances]);
  const diff        = Math.abs(totalDebit - totalCredit);
  const isBalanced  = diff < 0.01;

  const handleSave = async () => {
    if (!fyId) { setErrors({ _global: "اختر السنة المالية أولاً" }); return; }
    if (!isBalanced) { setErrors({ items: "الأرصدة الافتتاحية غير متوازنة، يجب تساوي المدين والدائن" }); return; }
    const items = postable
      .filter((a) => (balances[a.id]?.debit || 0) + (balances[a.id]?.credit || 0) > 0)
      .map((a) => ({
        accountId: a.id,
        debitBalance: balances[a.id]?.debit || 0,
        creditBalance: balances[a.id]?.credit || 0,
      }));
    setSaving(true);
    setErrors({});
    try {
      await accountingApi.saveOpeningBalances({ fiscalYearId: fyId, lines: items });
    } catch (error) {
      applyApiErrors(error, setErrors, "تعذر حفظ الأرصدة الافتتاحية");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">الأرصدة الافتتاحية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">إدخال أرصدة الحسابات في بداية السنة المالية</SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1.5} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select value={fyId ?? ""} onChange={(e) => setFyId(e.target.value)}>
                {fiscalYears.map((y) => (
                  <MenuItem key={y.id} value={y.id}>{y.name} {y.closed && "🔒"}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isLocked && (
              <SoftButton variant="gradient" color="info" size="small" disabled={saving} onClick={handleSave}>
                <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> {saving ? "جارٍ الحفظ..." : "حفظ الأرصدة"}
              </SoftButton>
            )}
          </SoftBox>
        </SoftBox>

        {isLocked && (
          <SoftBox mb={2} p={1.5} sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2 }}>
            <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontWeight: 600 }}>
              🔒 السنة مغلقة — الأرصدة للقراءة فقط
            </SoftTypography>
          </SoftBox>
        )}

        {(errors._global || errors.items) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors._global || errors.items}
          </Alert>
        )}

        {/* Balance indicator */}
        <SoftBox mb={2} p={1.5} sx={{
          background: isBalanced ? "#f0fde4" : "#ffeaea",
          border: `1px solid ${isBalanced ? "#82d61644" : "#ea060644"}`,
          borderRadius: 2, display: "flex", gap: 4, flexWrap: "wrap",
        }}>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">إجمالي المدين</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#17c1e8" }}>{fmt(totalDebit)}</SoftTypography>
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">إجمالي الدائن</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: "#82d616" }}>{fmt(totalCredit)}</SoftTypography>
          </SoftBox>
          <SoftBox>
            <SoftTypography variant="caption" color="secondary">الفرق</SoftTypography>
            <SoftTypography variant="h6" fontWeight="bold" sx={{ color: isBalanced ? "#82d616" : "#ea0606" }}>
              {isBalanced ? "✅ متوازن" : fmt(diff)}
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  {["الكود", "اسم الحساب", "التصنيف", "الطبيعة", "مدين (دج)", "دائن (دج)"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {postable.map((account) => {
                  const cls = classificationLabels[account.classification];
                  const bal = balances[account.id] || { debit: 0, credit: 0 };
                  return (
                    <TableRow key={account.id} sx={{ "&:hover": { background: "#fafafa" } }}>
                      <TableCell>
                        <SoftTypography variant="caption" fontWeight="bold" sx={{ color: cls?.color }}>{account.code}</SoftTypography>
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption">{account.nameAr}</SoftTypography>
                        {account.isControl && (
                          <SoftTypography variant="caption" sx={{ color: "#fb8c00", fontSize: 10, ml: 1 }}>(رقابي)</SoftTypography>
                        )}
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption" sx={{ color: cls?.color }}>{cls?.label}</SoftTypography>
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption">{account.normalBalance === "debit" ? "مدين" : "دائن"}</SoftTypography>
                      </TableCell>
                      <TableCell sx={{ width: 140 }}>
                        <TextField
                          size="small" type="number" value={bal.debit || ""}
                          disabled={isLocked || account.normalBalance !== "debit"}
                          onChange={(e) => setVal(account.id, "debit", e.target.value)}
                          placeholder="0.00"
                          inputProps={{ min: 0, style: { textAlign: "right" } }}
                          sx={{ width: 120, "& .MuiOutlinedInput-root": { fontSize: 12, color: "#17c1e8" } }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 140 }}>
                        <TextField
                          size="small" type="number" value={bal.credit || ""}
                          disabled={isLocked || account.normalBalance !== "credit"}
                          onChange={(e) => setVal(account.id, "credit", e.target.value)}
                          placeholder="0.00"
                          inputProps={{ min: 0, style: { textAlign: "right" } }}
                          sx={{ width: 120, "& .MuiOutlinedInput-root": { fontSize: 12, color: "#82d616" } }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
