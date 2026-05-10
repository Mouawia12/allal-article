export const statusConfig = {
  draft:     { label: "مسودة",       color: "secondary" },
  pending:   { label: "مسودة شراء",  color: "warning" },
  submitted: { label: "مُرسل",        color: "warning" },
  confirmed: { label: "مؤكد للمورد", color: "info" },
  received:  { label: "مستلم",       color: "success" },
  completed: { label: "مكتمل",       color: "success" },
  cancelled: { label: "ملغى",        color: "error" },
};

export const paymentConfig = {
  paid:    { label: "مدفوع",      color: "success" },
  partial: { label: "جزئي",       color: "warning" },
  unpaid:  { label: "غير مدفوع", color: "error" },
};

const DEFAULT_STATUS  = { label: "—", color: "secondary" };
const DEFAULT_PAYMENT = { label: "—", color: "secondary" };

export function statusOf(key) {
  return statusConfig[key] ?? { ...DEFAULT_STATUS, label: key || DEFAULT_STATUS.label };
}

export function paymentOf(key) {
  return paymentConfig[key] ?? { ...DEFAULT_PAYMENT, label: key || DEFAULT_PAYMENT.label };
}

export const supplierOptions = [];

export function formatDZD(value) {
  return Number(value || 0).toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function calcLineTotal(line) {
  const subtotal = Number(line.qty || 0) * Number(line.unitPrice || 0);
  return subtotal + (subtotal * Number(line.taxRate || 0)) / 100;
}

export function calcReturnedQty(purchase) {
  return (purchase.lines || []).reduce((sum, line) => sum + Number(line.returnedQty || 0), 0);
}

export function calcReturnLineTotal(line, qty = line.returnedQty) {
  const subtotal = Number(qty || 0) * Number(line.unitPrice || 0);
  return subtotal + (subtotal * Number(line.taxRate || 0)) / 100;
}

export function calcReturnAmount(purchase) {
  return (purchase.lines || []).reduce((sum, line) => sum + calcReturnLineTotal(line), 0);
}
