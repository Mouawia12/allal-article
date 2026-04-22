export const manufacturingStatusOrder = [
  "draft",
  "approved",
  "queued",
  "in_production",
  "quality_check",
  "ready_to_ship",
  "in_transit",
  "received",
];

export const manufacturingStatusConfig = {
  draft: {
    label: "مسودة",
    color: "#8392ab",
    bg: "#f8f9fa",
    progress: 5,
    eventTitle: "إنشاء طلب التصنيع",
  },
  approved: {
    label: "معتمد",
    color: "#17c1e8",
    bg: "#e3f8fd",
    progress: 18,
    eventTitle: "اعتماد طلب التصنيع",
  },
  queued: {
    label: "في طابور المصنع",
    color: "#fb8c00",
    bg: "#fff4e5",
    progress: 32,
    eventTitle: "إدخال الطلب إلى طابور المصنع",
  },
  in_production: {
    label: "قيد التصنيع",
    color: "#7928ca",
    bg: "#f2e8ff",
    progress: 58,
    eventTitle: "بدء التصنيع",
  },
  quality_check: {
    label: "فحص الجودة",
    color: "#344767",
    bg: "#eef1f6",
    progress: 74,
    eventTitle: "تحويل الطلب إلى فحص الجودة",
  },
  ready_to_ship: {
    label: "جاهز للإرسال",
    color: "#82d616",
    bg: "#edfbd8",
    progress: 86,
    eventTitle: "الطلب جاهز للإرسال",
  },
  in_transit: {
    label: "في الطريق",
    color: "#1a73e8",
    bg: "#e8f0fe",
    progress: 94,
    eventTitle: "شحن الطلب إلى المقر",
  },
  received: {
    label: "مستلم",
    color: "#2dce89",
    bg: "#e7f9f0",
    progress: 100,
    eventTitle: "استلام المنتج النهائي",
  },
  cancelled: {
    label: "ملغى",
    color: "#ea0606",
    bg: "#fde8e8",
    progress: 0,
    eventTitle: "إلغاء طلب التصنيع",
  },
};

export const manufacturingNextActions = {
  draft: [
    { status: "approved", label: "اعتماد", color: "info" },
    { status: "cancelled", label: "إلغاء", color: "error" },
  ],
  approved: [
    { status: "queued", label: "إدخال للطابور", color: "warning" },
    { status: "cancelled", label: "إلغاء", color: "error" },
  ],
  queued: [
    { status: "in_production", label: "بدء التصنيع", color: "info" },
    { status: "cancelled", label: "إلغاء", color: "error" },
  ],
  in_production: [
    { status: "quality_check", label: "إرسال للفحص", color: "dark" },
  ],
  quality_check: [
    { status: "ready_to_ship", label: "اعتماد الجودة", color: "success" },
    { status: "in_production", label: "إعادة تصنيع", color: "warning" },
  ],
  ready_to_ship: [
    { status: "in_transit", label: "شحن للمقر", color: "info" },
  ],
  in_transit: [
    { status: "received", label: "تأكيد الاستلام", color: "success" },
  ],
  received: [],
  cancelled: [
    { status: "draft", label: "إعادة فتح", color: "secondary" },
  ],
};

export const manufacturingTypeConfig = {
  sold_order: {
    label: "مرتبطة ببيع",
    color: "#17c1e8",
    bg: "#e3f8fd",
    description: "تصنيع مطلوب لتلبية طلبية زبون مؤكدة أو شبه مؤكدة",
  },
  stock_replenishment: {
    label: "سد نقص مخزون",
    color: "#82d616",
    bg: "#edfbd8",
    description: "تصنيع داخلي لرفع المخزون إلى حد التشغيل المطلوب",
  },
  custom_order: {
    label: "تصنيع خاص",
    color: "#7928ca",
    bg: "#f2e8ff",
    description: "طلبية بمواصفات خاصة تحتاج متابعة منفصلة",
  },
};

export const depositStatusConfig = {
  none: { label: "بدون عربون", color: "#8392ab", bg: "#f8f9fa" },
  pending: { label: "عربون منتظر", color: "#fb8c00", bg: "#fff4e5" },
  partial: { label: "عربون جزئي", color: "#17c1e8", bg: "#e3f8fd" },
  paid: { label: "العربون مدفوع", color: "#82d616", bg: "#edfbd8" },
};

export const mockManufacturingRequests = [
  {
    id: "MFG-2025-001",
    publicId: "65edc724-4665-442f-8d11-2ce268ef1001",
    productName: "رف معدني M10 × 50",
    productCode: "RACK-M10-50",
    qty: 120,
    unit: "قطعة",
    sourceType: "sold_order",
    sourceLabel: "طلبية بيع مؤكدة",
    salesOrderNumber: "ORD-2025-014",
    customerName: "شركة الرياض للمقاولات",
    destinationWarehouse: "مخزن المقر الرئيسي",
    destinationBranch: "وهران - المقر",
    factory: "مصنع الحديد 01",
    productionLine: "خط قص وثني A",
    requester: "أحمد محمد",
    responsible: "سفيان بن عيسى",
    priority: "high",
    status: "in_production",
    progress: 58,
    requestedAt: "2025-01-12",
    dueDate: "2025-01-24",
    updatedAt: "2025-01-18",
    producedQty: 64,
    receivedQty: 0,
    depositRequired: true,
    depositAmount: 180000,
    depositPaid: 120000,
    depositStatus: "partial",
    notes: "الزبون دفع عربون جزئي ويحتاج التسليم قبل نهاية الأسبوع.",
    materials: [
      { name: "حديد مسطح 4mm", plannedQty: 460, reservedQty: 460, consumedQty: 310, unit: "كغ" },
      { name: "طلاء حراري أسود", plannedQty: 32, reservedQty: 28, consumedQty: 16, unit: "لتر" },
      { name: "علب تغليف", plannedQty: 120, reservedQty: 120, consumedQty: 64, unit: "قطعة" },
    ],
    quality: { passed: 58, rework: 6, rejected: 0, lastCheck: "2025-01-18" },
  },
  {
    id: "MFG-2025-002",
    publicId: "65edc724-4665-442f-8d11-2ce268ef1002",
    productName: "برغي M8 × 30mm",
    productCode: "BRG-008-30",
    qty: 3500,
    unit: "قطعة",
    sourceType: "stock_replenishment",
    sourceLabel: "نقص مخزون",
    salesOrderNumber: null,
    customerName: null,
    destinationWarehouse: "مخزن المواد السريعة",
    destinationBranch: "الجزائر - المخزن المركزي",
    factory: "مصنع التثبيت",
    productionLine: "خط براغي B",
    requester: "مدير المخزون",
    responsible: "ليلى منصوري",
    priority: "normal",
    status: "quality_check",
    progress: 74,
    requestedAt: "2025-01-09",
    dueDate: "2025-01-21",
    updatedAt: "2025-01-19",
    producedQty: 3500,
    receivedQty: 0,
    depositRequired: false,
    depositAmount: 0,
    depositPaid: 0,
    depositStatus: "none",
    notes: "تم فتح الطلب بعد نزول المتاح تحت حد التنبيه.",
    materials: [
      { name: "سلك فولاذي 8mm", plannedQty: 920, reservedQty: 920, consumedQty: 920, unit: "كغ" },
      { name: "زيت تبريد", plannedQty: 45, reservedQty: 45, consumedQty: 39, unit: "لتر" },
    ],
    quality: { passed: 3200, rework: 210, rejected: 90, lastCheck: "2025-01-19" },
  },
  {
    id: "MFG-2025-003",
    publicId: "65edc724-4665-442f-8d11-2ce268ef1003",
    productName: "صندوق أدوات مخصص",
    productCode: "BOX-CUSTOM-22",
    qty: 35,
    unit: "قطعة",
    sourceType: "custom_order",
    sourceLabel: "تصنيع خاص",
    salesOrderNumber: "ORD-2025-021",
    customerName: "مؤسسة البناء الحديث",
    destinationWarehouse: "مخزن التسليم السريع",
    destinationBranch: "الجزائر - باب الزوار",
    factory: "مصنع التجميع",
    productionLine: "خلية تجميع C",
    requester: "خالد عمر",
    responsible: "مراد عمار",
    priority: "urgent",
    status: "approved",
    progress: 18,
    requestedAt: "2025-01-18",
    dueDate: "2025-01-26",
    updatedAt: "2025-01-18",
    producedQty: 0,
    receivedQty: 0,
    depositRequired: true,
    depositAmount: 90000,
    depositPaid: 0,
    depositStatus: "pending",
    notes: "مقاسات خاصة حسب الرسم المرفق. لا يبدأ الإنتاج قبل اعتماد المقاسات النهائية.",
    materials: [
      { name: "صفائح حديد 2mm", plannedQty: 180, reservedQty: 120, consumedQty: 0, unit: "كغ" },
      { name: "مقابض بلاستيك", plannedQty: 70, reservedQty: 70, consumedQty: 0, unit: "قطعة" },
      { name: "مفصلات صغيرة", plannedQty: 140, reservedQty: 100, consumedQty: 0, unit: "قطعة" },
    ],
    quality: { passed: 0, rework: 0, rejected: 0, lastCheck: null },
  },
  {
    id: "MFG-2025-004",
    publicId: "65edc724-4665-442f-8d11-2ce268ef1004",
    productName: "رف مخازن ثقيل",
    productCode: "RACK-HV-200",
    qty: 18,
    unit: "قطعة",
    sourceType: "stock_replenishment",
    sourceLabel: "تموين داخلي",
    salesOrderNumber: null,
    customerName: null,
    destinationWarehouse: "مخزن المعدات الثقيلة",
    destinationBranch: "سطيف - الفرع الشرقي",
    factory: "مصنع الحديد 01",
    productionLine: "خط لحام D",
    requester: "فريق المخزون",
    responsible: "سفيان بن عيسى",
    priority: "low",
    status: "ready_to_ship",
    progress: 86,
    requestedAt: "2025-01-05",
    dueDate: "2025-01-22",
    updatedAt: "2025-01-20",
    producedQty: 18,
    receivedQty: 0,
    depositRequired: false,
    depositAmount: 0,
    depositPaid: 0,
    depositStatus: "none",
    notes: "يرسل إلى الفرع الشرقي مع شحنة نهاية الأسبوع.",
    materials: [
      { name: "حديد زاوية 40mm", plannedQty: 540, reservedQty: 540, consumedQty: 530, unit: "كغ" },
      { name: "براغي تثبيت", plannedQty: 360, reservedQty: 360, consumedQty: 360, unit: "قطعة" },
    ],
    quality: { passed: 18, rework: 0, rejected: 0, lastCheck: "2025-01-20" },
  },
];

export const manufacturingTimeline = {
  "MFG-2025-001": [
    { id: 1, actor: "سفيان بن عيسى", title: "بدء التصنيع", body: "تم سحب المواد من المخزن وبدء القص والثني.", at: "2025-01-18 09:20" },
    { id: 2, actor: "النظام", title: "حجز المواد", body: "تم حجز 460 كغ حديد و32 لتر طلاء حراري.", at: "2025-01-17 16:45" },
    { id: 3, actor: "أحمد محمد", title: "إنشاء الطلب", body: "طلب مرتبط ببيع للزبون شركة الرياض للمقاولات.", at: "2025-01-12 10:05" },
  ],
  "MFG-2025-002": [
    { id: 1, actor: "ليلى منصوري", title: "تحويل للجودة", body: "اكتمل الإنتاج الأولي وبدأ فحص العينات.", at: "2025-01-19 14:30" },
    { id: 2, actor: "مدير المخزون", title: "فتح طلب سد نقص", body: "المتاح الحالي أقل من حد التنبيه للصنف.", at: "2025-01-09 08:15" },
  ],
  "MFG-2025-003": [
    { id: 1, actor: "خالد عمر", title: "اعتماد الطلب", body: "تم اعتماد الطلب بانتظار العربون واعتماد المقاسات.", at: "2025-01-18 15:40" },
    { id: 2, actor: "خالد عمر", title: "إنشاء طلب خاص", body: "طلب تصنيع خاص لصندوق أدوات بمقاس غير قياسي.", at: "2025-01-18 13:20" },
  ],
  "MFG-2025-004": [
    { id: 1, actor: "فريق الجودة", title: "اعتماد الجودة", body: "تم قبول كامل الكمية وتجهيزها للشحن الداخلي.", at: "2025-01-20 11:00" },
    { id: 2, actor: "سفيان بن عيسى", title: "انتهاء التصنيع", body: "اكتمل إنتاج 18 رف مخازن ثقيل.", at: "2025-01-19 17:10" },
  ],
};

export function formatDZD(amount) {
  return new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount);
}

export function getManufacturingStats(requests) {
  const activeStatuses = ["draft", "approved", "queued", "in_production", "quality_check", "ready_to_ship", "in_transit"];
  const active = requests.filter((request) => activeStatuses.includes(request.status)).length;
  const inProduction = requests.filter((request) => request.status === "in_production").length;
  const awaitingDelivery = requests.filter((request) => ["ready_to_ship", "in_transit"].includes(request.status)).length;
  const depositOpen = requests.reduce((sum, request) => sum + Math.max(request.depositAmount - request.depositPaid, 0), 0);
  const referenceDate = new Date("2025-01-21");
  const late = requests.filter((request) => {
    if (!activeStatuses.includes(request.status)) return false;
    return new Date(request.dueDate) < referenceDate;
  }).length;

  return {
    active,
    inProduction,
    awaitingDelivery,
    depositOpen,
    late,
  };
}

export function buildManufacturingRequest(form, nextIndex) {
  const id = `MFG-2025-${String(nextIndex).padStart(3, "0")}`;
  const status = form.depositRequired ? "draft" : "approved";
  const cfg = manufacturingStatusConfig[status];

  return {
    id,
    publicId: `65edc724-4665-442f-8d11-2ce268ef1${String(nextIndex).padStart(3, "0")}`,
    productName: form.productName,
    productCode: form.productCode,
    qty: Number(form.qty || 0),
    unit: form.unit,
    sourceType: form.sourceType,
    sourceLabel: manufacturingTypeConfig[form.sourceType]?.label || "طلب تصنيع",
    salesOrderNumber: form.salesOrderNumber || null,
    customerName: form.customerName || null,
    destinationWarehouse: form.destinationWarehouse,
    destinationBranch: form.destinationBranch,
    factory: form.factory,
    productionLine: form.productionLine,
    requester: "المستخدم الحالي",
    responsible: form.responsible,
    priority: form.priority,
    status,
    progress: cfg.progress,
    requestedAt: "2025-01-21",
    dueDate: form.dueDate,
    updatedAt: "الآن",
    producedQty: 0,
    receivedQty: 0,
    depositRequired: form.depositRequired,
    depositAmount: Number(form.depositAmount || 0),
    depositPaid: 0,
    depositStatus: form.depositRequired ? "pending" : "none",
    notes: form.notes,
    materials: [
      { name: "مادة خام رئيسية", plannedQty: Math.max(Number(form.qty || 0) * 2, 1), reservedQty: 0, consumedQty: 0, unit: "وحدة" },
      { name: "تغليف وتجهيز", plannedQty: Number(form.qty || 0), reservedQty: 0, consumedQty: 0, unit: form.unit },
    ],
    quality: { passed: 0, rework: 0, rejected: 0, lastCheck: null },
  };
}
