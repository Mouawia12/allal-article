export const manufacturingStatusOrder = [
  "draft","approved","queued","in_production","quality_check","ready_to_ship","in_transit","received",
];

export const manufacturingStatusConfig = {
  draft:         { label: "مسودة",              color: "#8392ab", bg: "#f8f9fa",  progress: 5 },
  approved:      { label: "معتمد",              color: "#17c1e8", bg: "#e3f8fd",  progress: 18 },
  queued:        { label: "في طابور المصنع",   color: "#fb8c00", bg: "#fff4e5",  progress: 32 },
  in_production: { label: "قيد التصنيع",        color: "#7928ca", bg: "#f2e8ff",  progress: 58 },
  quality_check: { label: "فحص الجودة",         color: "#344767", bg: "#eef1f6",  progress: 74 },
  ready_to_ship: { label: "جاهز للإرسال",       color: "#82d616", bg: "#edfbd8",  progress: 86 },
  in_transit:    { label: "في الطريق",           color: "#1a73e8", bg: "#e8f0fe",  progress: 94 },
  received:      { label: "مستلم",              color: "#2dce89", bg: "#e7f9f0",  progress: 100 },
  cancelled:     { label: "ملغى",               color: "#ea0606", bg: "#fde8e8",  progress: 0 },
};

export const manufacturingNextActions = {
  draft:         [{ status: "approved",     label: "اعتماد",        color: "info" },    { status: "cancelled",  label: "إلغاء",          color: "error" }],
  approved:      [{ status: "queued",       label: "إدخال للطابور", color: "warning" }, { status: "cancelled",  label: "إلغاء",          color: "error" }],
  queued:        [{ status: "in_production",label: "بدء التصنيع",   color: "info" },    { status: "cancelled",  label: "إلغاء",          color: "error" }],
  in_production: [{ status: "quality_check",label: "إرسال للفحص",   color: "dark" }],
  quality_check: [{ status: "ready_to_ship",label: "اعتماد الجودة", color: "success" }, { status: "in_production", label: "إعادة تصنيع", color: "warning" }],
  ready_to_ship: [{ status: "in_transit",   label: "شحن للمقر",     color: "info" }],
  in_transit:    [{ status: "received",     label: "تأكيد الاستلام",color: "success" }],
  received:      [],
  cancelled:     [{ status: "draft",        label: "إعادة فتح",     color: "secondary" }],
};

export const manufacturingTypeConfig = {
  sold_order:          { label: "مرتبطة ببيع",    color: "#17c1e8", bg: "#e3f8fd" },
  stock_replenishment: { label: "سد نقص مخزون",   color: "#82d616", bg: "#edfbd8" },
  custom_order:        { label: "تصنيع خاص",       color: "#7928ca", bg: "#f2e8ff" },
};

export const depositStatusConfig = {
  none:    { label: "بدون عربون",    color: "#8392ab", bg: "#f8f9fa" },
  pending: { label: "عربون منتظر",  color: "#fb8c00", bg: "#fff4e5" },
  partial: { label: "عربون جزئي",   color: "#17c1e8", bg: "#e3f8fd" },
  paid:    { label: "العربون مدفوع", color: "#82d616", bg: "#edfbd8" },
};

export const formatDZD = (amount) =>
  new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(amount);

export function getManufacturingStats(requests) {
  const activeStatuses = ["draft","approved","queued","in_production","quality_check","ready_to_ship","in_transit"];
  return {
    active:           requests.filter((r) => activeStatuses.includes(r.status)).length,
    inProduction:     requests.filter((r) => r.status === "in_production").length,
    awaitingDelivery: requests.filter((r) => ["ready_to_ship","in_transit"].includes(r.status)).length,
    depositOpen:      requests.reduce((s, r) => s + Math.max((r.depositAmount || 0) - (r.depositPaid || 0), 0), 0),
  };
}
