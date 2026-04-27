export const statusConfig = {
  pending:   { label: "مسودة شراء", color: "warning" },
  confirmed: { label: "مؤكد للمورد", color: "info" },
  received:  { label: "مستلم",       color: "success" },
  cancelled: { label: "ملغى",        color: "error" },
};

export const paymentConfig = {
  paid:    { label: "مدفوع",      color: "success" },
  partial: { label: "جزئي",       color: "warning" },
  unpaid:  { label: "غير مدفوع", color: "error" },
};

export const supplierOptions = [];

export const purchaseProducts = [
  { id: "RAW-STL-001", name: "حديد تسليح 12mm", unit: "قنطار", price: 85000, taxRate: 19 },
  { id: "RAW-STL-002", name: "صفائح حديد 2mm", unit: "لوح", price: 12000, taxRate: 19 },
  { id: "ELC-CBL-025", name: "كابل كهربائي 2.5mm", unit: "لفة", price: 18500, taxRate: 19 },
  { id: "PLB-PVC-050", name: "أنبوب PVC 50mm", unit: "قطعة", price: 720, taxRate: 19 },
  { id: "PNT-WHT-020", name: "دهان أبيض 20L", unit: "دلو", price: 6400, taxRate: 19 },
  { id: "TLS-DRL-001", name: "مثقاب كهربائي", unit: "قطعة", price: 14500, taxRate: 19 },
];

export const mockPurchases = [
  {
    id: "PUR-2024-001",
    supplier: "مصنع الصلب الجزائري",
    supplierPhone: "0550-110-220",
    supplierAddress: "الجزائر العاصمة، المنطقة الصناعية",
    date: "2024-01-22",
    expectedDate: "2024-01-30",
    totalAmount: 2450000,
    itemsCount: 5,
    status: "pending",
    paymentStatus: "unpaid",
    receivedBy: null,
    requestedBy: "إدارة المشتريات",
    warehouse: "المخزن الرئيسي",
    invoiceNo: null,
    notes: "تأكيد الكميات قبل الاستلام النهائي.",
    lines: [
      { id: 1, productCode: "RAW-STL-001", product: "حديد تسليح 12mm", qty: 18, receivedQty: 0, returnedQty: 0, unit: "قنطار", unitPrice: 85000, taxRate: 19 },
      { id: 2, productCode: "RAW-STL-002", product: "صفائح حديد 2mm", qty: 35, receivedQty: 0, returnedQty: 0, unit: "لوح", unitPrice: 12000, taxRate: 19 },
      { id: 3, productCode: "TLS-DRL-001", product: "مثقاب كهربائي", qty: 8, receivedQty: 0, returnedQty: 0, unit: "قطعة", unitPrice: 14500, taxRate: 19 },
    ],
  },
  {
    id: "PUR-2024-002",
    supplier: "شركة المعدن والأدوات",
    supplierPhone: "0551-880-330",
    supplierAddress: "سطيف، المنطقة التجارية",
    date: "2024-01-20",
    expectedDate: "2024-01-28",
    totalAmount: 850000,
    itemsCount: 3,
    status: "confirmed",
    paymentStatus: "partial",
    receivedBy: "أحمد محمد",
    requestedBy: "خالد عمر",
    warehouse: "مخزن الأدوات",
    invoiceNo: "BILL-2024-014",
    notes: "تم دفع تسبيق 300,000 دج.",
    lines: [
      { id: 1, productCode: "TLS-DRL-001", product: "مثقاب كهربائي", qty: 20, receivedQty: 8, returnedQty: 0, unit: "قطعة", unitPrice: 14500, taxRate: 19 },
      { id: 2, productCode: "RAW-STL-002", product: "صفائح حديد 2mm", qty: 30, receivedQty: 12, returnedQty: 0, unit: "لوح", unitPrice: 12000, taxRate: 19 },
      { id: 3, productCode: "PLB-PVC-050", product: "أنبوب PVC 50mm", qty: 160, receivedQty: 80, returnedQty: 0, unit: "قطعة", unitPrice: 720, taxRate: 19 },
    ],
  },
  {
    id: "PUR-2024-003",
    supplier: "موردون الكهرباء الوطنية",
    supplierPhone: "0552-120-440",
    supplierAddress: "البليدة، طريق الصناعة",
    date: "2024-01-18",
    expectedDate: "2024-01-25",
    totalAmount: 1120000,
    itemsCount: 7,
    status: "received",
    paymentStatus: "paid",
    receivedBy: "خالد عمر",
    requestedBy: "إدارة المخزون",
    warehouse: "المخزن الرئيسي",
    invoiceNo: "BILL-2024-011",
    notes: "تمت المطابقة مع فاتورة المورد.",
    lines: [
      { id: 1, productCode: "ELC-CBL-025", product: "كابل كهربائي 2.5mm", qty: 45, receivedQty: 45, returnedQty: 5, unit: "لفة", unitPrice: 18500, taxRate: 19 },
      { id: 2, productCode: "TLS-DRL-001", product: "مثقاب كهربائي", qty: 12, receivedQty: 12, returnedQty: 12, unit: "قطعة", unitPrice: 14500, taxRate: 19 },
    ],
  },
  {
    id: "PUR-2024-004",
    supplier: "شركة السباكة والري",
    supplierPhone: "0553-620-715",
    supplierAddress: "وهران، حي الأعمال",
    date: "2024-01-15",
    expectedDate: "2024-01-22",
    totalAmount: 340000,
    itemsCount: 4,
    status: "received",
    paymentStatus: "unpaid",
    receivedBy: "يوسف علي",
    requestedBy: "إدارة المخزون",
    warehouse: "مخزن السباكة",
    invoiceNo: "BILL-2024-009",
    notes: "ينتظر تسجيل الدفع للمورد.",
    lines: [
      { id: 1, productCode: "PLB-PVC-050", product: "أنبوب PVC 50mm", qty: 300, receivedQty: 300, returnedQty: 60, unit: "قطعة", unitPrice: 720, taxRate: 19 },
      { id: 2, productCode: "PNT-WHT-020", product: "دهان أبيض 20L", qty: 16, receivedQty: 16, returnedQty: 0, unit: "دلو", unitPrice: 6400, taxRate: 19 },
    ],
  },
  {
    id: "PUR-2024-005",
    supplier: "مصنع الصلب الجزائري",
    supplierPhone: "0550-110-220",
    supplierAddress: "الجزائر العاصمة، المنطقة الصناعية",
    date: "2024-01-10",
    expectedDate: "2024-01-17",
    totalAmount: 3200000,
    itemsCount: 9,
    status: "cancelled",
    paymentStatus: "unpaid",
    receivedBy: null,
    requestedBy: "إدارة المشتريات",
    warehouse: "المخزن الرئيسي",
    invoiceNo: null,
    notes: "ألغي بسبب اختلاف السعر النهائي.",
    lines: [
      { id: 1, productCode: "RAW-STL-001", product: "حديد تسليح 12mm", qty: 30, receivedQty: 0, returnedQty: 0, unit: "قنطار", unitPrice: 85000, taxRate: 19 },
      { id: 2, productCode: "RAW-STL-002", product: "صفائح حديد 2mm", qty: 55, receivedQty: 0, returnedQty: 0, unit: "لوح", unitPrice: 12000, taxRate: 19 },
    ],
  },
  {
    id: "PUR-2024-006",
    supplier: "مستلزمات الدهانات الفاخرة",
    supplierPhone: "0554-740-210",
    supplierAddress: "قسنطينة، طريق الخروب",
    date: "2024-01-08",
    expectedDate: "2024-01-15",
    totalAmount: 560000,
    itemsCount: 2,
    status: "confirmed",
    paymentStatus: "paid",
    receivedBy: null,
    requestedBy: "يوسف علي",
    warehouse: "مخزن الدهانات",
    invoiceNo: "BILL-2024-007",
    notes: "",
    lines: [
      { id: 1, productCode: "PNT-WHT-020", product: "دهان أبيض 20L", qty: 70, receivedQty: 0, returnedQty: 0, unit: "دلو", unitPrice: 6400, taxRate: 19 },
    ],
  },
];

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
