/* eslint-disable react/prop-types */
import { useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import CloseIcon from "@mui/icons-material/Close";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import { normalizeStockLine } from "utils/productStockMetrics";

function formatQty(value) {
  return new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 3 }).format(value ?? 0);
}

function QtyCell({ value, unit, color, bold }) {
  return (
    <TableCell align="center">
      <SoftTypography variant="button" fontWeight={bold ? "bold" : "medium"} sx={color ? { color } : undefined}>
        {formatQty(value)}
      </SoftTypography>
      {unit && (
        <SoftTypography variant="caption" color="secondary" sx={{ display: "block" }}>
          {unit}
        </SoftTypography>
      )}
    </TableCell>
  );
}

/**
 * Where this product physically sits: one row per warehouse holding it.
 *
 * Only the three quantities the API reports per warehouse are broken down here. "غير مؤكد"
 * and "المتوقع" come from orders, which are not tied to a warehouse, so they stay on the
 * product-level card rather than being split across rows they cannot be attributed to.
 */
function StockByWarehouseDialog({ open, onClose, product, stockLines }) {
  const unit = product?.unit || "وحدة";

  const rows = useMemo(
    () =>
      (stockLines || [])
        .map((line) => ({
          key: line.id ?? line.warehouseId,
          warehouse: line.warehouseName || "—",
          ...normalizeStockLine(line),
        }))
        .sort((a, b) => b.onHand - a.onHand),
    [stockLines]
  );

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          onHand: acc.onHand + row.onHand,
          reserved: acc.reserved + row.reserved,
          available: acc.available + row.available,
        }),
        { onHand: 0, reserved: 0, available: 0 }
      ),
    [rows]
  );

  const share = (value) => (totals.onHand > 0 ? (value / totals.onHand) * 100 : 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftBox display="flex" alignItems="center" gap={1.5}>
            <WarehouseIcon sx={{ color: "#17c1e8" }} />
            <SoftBox>
              <SoftTypography variant="h5" fontWeight="bold">
                التوزيع على المستودعات
              </SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                {product?.name} · {product?.code}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </SoftBox>
      </DialogTitle>

      <DialogContent dividers>
        {rows.length === 0 ? (
          <SoftBox py={6} textAlign="center">
            <WarehouseIcon sx={{ fontSize: 48, color: "#c7ccd1", mb: 1 }} />
            <SoftTypography variant="body2" color="secondary">
              لا يوجد هذا الصنف في أي مستودع بعد
            </SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              أضف كمية ابتدائية من شاشة المخزون ليظهر توزيعه هنا
            </SoftTypography>
          </SoftBox>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ display: "table-header-group" }}>
                <TableRow>
                  <TableCell>
                    <SoftTypography variant="caption" fontWeight="bold">المستودع</SoftTypography>
                  </TableCell>
                  <TableCell align="center">
                    <SoftTypography variant="caption" fontWeight="bold">الكمية الفعلية</SoftTypography>
                  </TableCell>
                  <TableCell align="center">
                    <SoftTypography variant="caption" fontWeight="bold">محجوز</SoftTypography>
                  </TableCell>
                  <TableCell align="center">
                    <SoftTypography variant="caption" fontWeight="bold">متاح الآن</SoftTypography>
                  </TableCell>
                  <TableCell sx={{ width: "22%" }}>
                    <SoftTypography variant="caption" fontWeight="bold">الحصة</SoftTypography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key} hover>
                    <TableCell>
                      <SoftTypography variant="button" fontWeight="medium">{row.warehouse}</SoftTypography>
                    </TableCell>
                    <QtyCell value={row.onHand} unit={unit} color="#17c1e8" bold />
                    <QtyCell value={row.reserved} color="#fb8c00" />
                    <QtyCell value={row.available} color="#66BB6A" />
                    <TableCell>
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, share(row.onHand))}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: "#e9ecef",
                            "& .MuiLinearProgress-bar": { background: "#17c1e8" },
                          }}
                        />
                        <SoftTypography variant="caption" color="secondary" sx={{ minWidth: 34 }}>
                          {Math.round(share(row.onHand))}%
                        </SoftTypography>
                      </SoftBox>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                  <TableCell>
                    <SoftTypography variant="button" fontWeight="bold">
                      الإجمالي · {rows.length} مستودع
                    </SoftTypography>
                  </TableCell>
                  <QtyCell value={totals.onHand} unit={unit} bold />
                  <QtyCell value={totals.reserved} bold />
                  <QtyCell value={totals.available} bold />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <SoftButton variant="gradient" color="info" onClick={onClose}>إغلاق</SoftButton>
      </DialogActions>
    </Dialog>
  );
}

export default StockByWarehouseDialog;
