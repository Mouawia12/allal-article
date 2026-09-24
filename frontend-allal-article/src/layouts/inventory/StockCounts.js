/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
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
import FactCheckIcon from "@mui/icons-material/FactCheck";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import StockCountSheet from "layouts/inventory/StockCountSheet";
import { inventoryApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const STATUS = {
  open: { label: "قيد العدّ", color: "info" },
  review: { label: "قيد المراجعة", color: "warning" },
  approved: { label: "معتمد", color: "success" },
  cancelled: { label: "ملغى", color: "default" },
};

function formatQty(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 3 }).format(value);
}

function StockCounts({ warehouses = [] }) {
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ warehouseId: "", blind: true, notes: "" });

  const load = useCallback(() => {
    setLoading(true);
    inventoryApi
      .listCounts({ page: 0, size: 50 })
      .then((res) => { setRows(res.data?.content ?? []); setError(""); })
      .catch((err) => setError(getApiErrorMessage(err, "تعذر تحميل عمليات الجرد")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = () => {
    setSaving(true);
    setError("");
    inventoryApi
      .openCount({
        warehouseId: Number(form.warehouseId),
        blind: form.blind,
        notes: form.notes || null,
      })
      .then((res) => {
        setDialogOpen(false);
        setForm({ warehouseId: "", blind: true, notes: "" });
        load();
        // Drop straight into the sheet: opening a count is only ever a prelude to counting.
        setOpenId(res.data.id);
      })
      .catch((err) => setError(getApiErrorMessage(err, "تعذر فتح الجرد")))
      .finally(() => setSaving(false));
  };

  if (openId) {
    return <StockCountSheet countId={openId} onBack={() => { setOpenId(null); load(); }} onChanged={load} />;
  }

  return (
    <SoftBox p={2}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <SoftBox>
          <SoftTypography variant="h6" fontWeight="bold">جرد المخزون</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            عدّ فعلي للمستودع، مقارنة بالأرصدة الدفترية، ثم تسوية معتمدة
          </SoftTypography>
        </SoftBox>
        <SoftButton variant="gradient" color="info" onClick={() => setDialogOpen(true)}>
          <AddIcon sx={{ fontSize: 18, mr: 0.5 }} /> فتح جرد جديد
        </SoftButton>
      </SoftBox>

      {error && <SoftBox mb={2}><Alert severity="error" onClose={() => setError("")}>{error}</Alert></SoftBox>}

      {loading ? (
        <SoftBox display="flex" justifyContent="center" py={6}><CircularProgress color="info" /></SoftBox>
      ) : rows.length === 0 ? (
        <SoftBox py={6} textAlign="center">
          <FactCheckIcon sx={{ fontSize: 48, color: "#c7ccd1", mb: 1 }} />
          <SoftTypography variant="body2" color="secondary">لا توجد عمليات جرد بعد</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            افتح جرداً لتجميد أرصدة مستودع والبدء في العدّ
          </SoftTypography>
        </SoftBox>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ display: "table-header-group" }}>
              <TableRow>
                {["المرجع", "المستودع", "الحالة", "التقدّم", "أصناف بفروق", "صافي الكمية", "القيد المحاسبي"].map((header) => (
                  <TableCell key={header} align={header === "المرجع" ? "right" : "center"}>
                    <SoftTypography variant="caption" fontWeight="bold">{header}</SoftTypography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const status = STATUS[row.status] || { label: row.status, color: "default" };
                return (
                  <TableRow key={row.id} hover sx={{ cursor: "pointer" }} onClick={() => setOpenId(row.id)}>
                    <TableCell>
                      <SoftTypography variant="button" fontWeight="medium">{row.reference}</SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography variant="caption">{row.warehouseName}</SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={status.label} color={status.color} />
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography variant="caption">{row.countedItems} / {row.totalItems}</SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography variant="button" fontWeight="bold">{row.varianceItems}</SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography
                        variant="button"
                        sx={{ color: Number(row.netVarianceQty) === 0 ? "#67748e" : Number(row.netVarianceQty) > 0 ? "#66BB6A" : "#ea0606" }}
                      >
                        {formatQty(row.netVarianceQty)}
                      </SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography variant="caption" color="secondary">{row.journalNumber || "—"}</SoftTypography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <SoftTypography variant="h5" fontWeight="bold">فتح جرد جديد</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            تُجمَّد أرصدة المستودع لحظة الفتح، فلا تؤثر الحركات اللاحقة على الفروق
          </SoftTypography>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
            <InputLabel>المستودع</InputLabel>
            <Select
              value={form.warehouseId}
              label="المستودع"
              onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
            >
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={<Switch checked={form.blind} onChange={(e) => setForm((f) => ({ ...f, blind: e.target.checked }))} />}
            label={
              <SoftBox>
                <SoftTypography variant="button" fontWeight="medium">عدّ أعمى</SoftTypography>
                <SoftTypography variant="caption" color="secondary" sx={{ display: "block" }}>
                  إخفاء الكمية الدفترية عن العادّ حتى لا ينحاز إليها
                </SoftTypography>
              </SoftBox>
            }
            sx={{ mb: 2, alignItems: "flex-start" }}
          />

          <TextField
            fullWidth size="small" multiline rows={2} label="ملاحظات"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <SoftButton variant="outlined" color="secondary" onClick={() => setDialogOpen(false)}>إلغاء</SoftButton>
          <SoftButton
            variant="gradient" color="info"
            disabled={!form.warehouseId || saving}
            onClick={submit}
          >
            {saving ? "جارٍ الفتح..." : "فتح وبدء العدّ"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </SoftBox>
  );
}

export default StockCounts;
