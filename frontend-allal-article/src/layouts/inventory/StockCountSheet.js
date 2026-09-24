/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
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

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(value)} دج`;
}

/** Red for stock that is missing, green for stock that turned up. */
function differenceColor(value) {
  if (value === null || value === undefined || Number(value) === 0) return "#67748e";
  return Number(value) > 0 ? "#66BB6A" : "#ea0606";
}

function StockCountSheet({ countId, onBack, onChanged }) {
  const [count, setCount] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    inventoryApi
      .getCount(countId)
      .then((res) => {
        setCount(res.data);
        setDrafts({});
        setError("");
      })
      .catch((err) => setError(getApiErrorMessage(err, "تعذر تحميل الجرد")))
      .finally(() => setLoading(false));
  }, [countId]);

  useEffect(() => { load(); }, [load]);

  const isOpen = count?.status === "open";
  const isReview = count?.status === "review";
  const editable = isOpen || isReview;
  // While an open count is blind the backend withholds the system quantity, so there is
  // nothing to compare against yet and the variance columns stay out of the way.
  const showVariance = !!count && !(count.blind && isOpen);

  const dirtyEntries = useMemo(
    () =>
      Object.entries(drafts)
        .filter(([, value]) => value !== "" && value !== null && !Number.isNaN(Number(value)))
        .map(([itemId, value]) => ({ itemId: Number(itemId), countedQty: Number(value) })),
    [drafts]
  );

  const run = (action, label) => {
    setBusy(true);
    setError("");
    action()
      .then(() => { load(); onChanged?.(); })
      .catch((err) => setError(getApiErrorMessage(err, label)))
      .finally(() => setBusy(false));
  };

  const saveEntries = () => run(() => inventoryApi.saveCountEntries(countId, dirtyEntries), "تعذر حفظ العدّ");

  const closeForReview = () => {
    if (dirtyEntries.length > 0) {
      // Saving first avoids the close being rejected for lines the user has typed but not sent.
      run(() =>
        inventoryApi.saveCountEntries(countId, dirtyEntries).then(() => inventoryApi.closeCount(countId)),
        "تعذر إقفال الجرد");
    } else {
      run(() => inventoryApi.closeCount(countId), "تعذر إقفال الجرد");
    }
  };

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" py={6}>
        <CircularProgress color="info" />
      </SoftBox>
    );
  }

  if (!count) {
    return (
      <SoftBox p={3}>
        <Alert severity="error">{error || "الجرد غير موجود"}</Alert>
        <SoftBox mt={2}><SoftButton onClick={onBack}>رجوع</SoftButton></SoftBox>
      </SoftBox>
    );
  }

  const status = STATUS[count.status] || { label: count.status, color: "default" };
  const uncounted = count.totalItems - count.countedItems;

  return (
    <SoftBox p={2}>
      <SoftBox display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2}>
        <SoftBox display="flex" alignItems="center" gap={1}>
          <IconButton size="small" onClick={onBack}><ArrowForwardIcon /></IconButton>
          <SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1}>
              <SoftTypography variant="h6" fontWeight="bold">{count.reference}</SoftTypography>
              <Chip size="small" label={status.label} color={status.color} />
              {count.blind && isOpen && (
                <Chip size="small" icon={<VisibilityOffIcon sx={{ fontSize: 14 }} />} label="عدّ أعمى" variant="outlined" />
              )}
            </SoftBox>
            <SoftTypography variant="caption" color="secondary">
              {count.warehouseName} · {count.countedItems} من {count.totalItems} صنفاً
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        <SoftBox display="flex" gap={1} flexWrap="wrap">
          {editable && (
            <SoftButton size="small" variant="outlined" color="info" disabled={busy || dirtyEntries.length === 0} onClick={saveEntries}>
              حفظ العدّ {dirtyEntries.length > 0 ? `(${dirtyEntries.length})` : ""}
            </SoftButton>
          )}
          {isOpen && (
            <SoftButton size="small" variant="gradient" color="warning" disabled={busy} onClick={closeForReview}>
              إقفال للمراجعة
            </SoftButton>
          )}
          {isReview && (
            <SoftButton size="small" variant="gradient" color="success" disabled={busy}
              onClick={() => run(() => inventoryApi.approveCount(countId), "تعذر اعتماد الجرد")}>
              اعتماد وتطبيق الفروق
            </SoftButton>
          )}
          {editable && (
            <SoftButton size="small" variant="outlined" color="error" disabled={busy}
              onClick={() => run(() => inventoryApi.cancelCount(countId), "تعذر إلغاء الجرد")}>
              إلغاء
            </SoftButton>
          )}
        </SoftBox>
      </SoftBox>

      {error && <SoftBox mb={2}><Alert severity="error" onClose={() => setError("")}>{error}</Alert></SoftBox>}

      {isOpen && uncounted > 0 && (
        <SoftBox mb={2}>
          <Alert severity="info">
            بقي {uncounted} صنفاً بلا عدّ. أدخل صفراً لما لم تجده — الخانة الفارغة تعني «لم يُعدّ بعد».
          </Alert>
        </SoftBox>
      )}

      {showVariance && count.itemsWithoutCost > 0 && (
        <SoftBox mb={2}>
          <Alert severity="warning">
            {count.itemsWithoutCost} صنفاً بفرق بلا تكلفة — سيُصحَّح مخزونه لكن لن تدخل قيمته في القيد المحاسبي.
          </Alert>
        </SoftBox>
      )}

      {count.status === "approved" && (
        <SoftBox mb={2}>
          <Alert severity="success">
            اعتُمد الجرد وطُبِّقت الفروق.
            {count.journalNumber ? ` القيد المحاسبي: ${count.journalNumber}` : " لا فروق بقيمة تستوجب قيداً."}
          </Alert>
        </SoftBox>
      )}

      {showVariance && (
        <Card sx={{ p: 2, mb: 2 }}>
          <SoftBox display="flex" gap={4} flexWrap="wrap">
            <SoftBox>
              <SoftTypography variant="caption" color="secondary">أصناف بفروق</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold">{count.varianceItems}</SoftTypography>
            </SoftBox>
            <Divider orientation="vertical" flexItem />
            <SoftBox>
              <SoftTypography variant="caption" color="secondary">صافي الفرق بالكمية</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: differenceColor(count.netVarianceQty) }}>
                {formatQty(count.netVarianceQty)}
              </SoftTypography>
            </SoftBox>
            <Divider orientation="vertical" flexItem />
            <SoftBox>
              <SoftTypography variant="caption" color="secondary">صافي الفرق بالقيمة</SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold" sx={{ color: differenceColor(count.netVarianceValue) }}>
                {formatMoney(count.netVarianceValue)}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        </Card>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead sx={{ display: "table-header-group" }}>
            <TableRow>
              {["الصنف", "الوحدة"].concat(
                showVariance ? ["الكمية الدفترية"] : [],
                [isReview ? "إعادة العدّ" : "الكمية المعدودة"],
                showVariance ? ["الفرق", "قيمة الفرق"] : []
              ).map((header) => (
                <TableCell key={header} align={header === "الصنف" ? "right" : "center"}>
                  <SoftTypography variant="caption" fontWeight="bold">{header}</SoftTypography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(count.items || []).map((item) => (
              <TableRow key={item.id} hover>
                <TableCell>
                  <SoftTypography variant="button" fontWeight="medium">{item.productName}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" sx={{ display: "block" }}>{item.productSku}</SoftTypography>
                </TableCell>
                <TableCell align="center">
                  <SoftTypography variant="caption" color="secondary">{item.baseUnitName || "—"}</SoftTypography>
                </TableCell>
                {showVariance && (
                  <TableCell align="center">
                    <SoftTypography variant="button">{formatQty(item.systemQty)}</SoftTypography>
                  </TableCell>
                )}
                <TableCell align="center" sx={{ width: 130 }}>
                  {editable ? (
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0, step: "any", style: { textAlign: "center" } }}
                      placeholder={isReview ? "أعد العدّ" : "العدد"}
                      value={drafts[item.id] ?? (isReview ? item.recountQty ?? "" : item.countedQty ?? "")}
                      onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                      sx={{ width: 110 }}
                    />
                  ) : (
                    <SoftTypography variant="button" fontWeight="bold">{formatQty(item.finalQty)}</SoftTypography>
                  )}
                </TableCell>
                {showVariance && (
                  <>
                    <TableCell align="center">
                      <SoftTypography variant="button" fontWeight="bold" sx={{ color: differenceColor(item.difference) }}>
                        {item.difference === null || item.difference === undefined
                          ? "—"
                          : `${Number(item.difference) > 0 ? "+" : ""}${formatQty(item.difference)}`}
                      </SoftTypography>
                    </TableCell>
                    <TableCell align="center">
                      <SoftTypography variant="caption" sx={{ color: differenceColor(item.difference) }}>
                        {item.unitCost === null || item.unitCost === undefined
                          ? "بلا تكلفة"
                          : formatMoney(item.differenceValue)}
                      </SoftTypography>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SoftBox>
  );
}

export default StockCountSheet;
