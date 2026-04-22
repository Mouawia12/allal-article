export const mockWarehouses = [
  {
    id: "WH-MAIN",
    name: "المخزن الرئيسي",
    type: "مركزي",
    city: "الجزائر",
    manager: "أمين المخزن",
    status: "active",
    capacity: 10000,
    isDefault: true,
  },
  {
    id: "WH-TOOLS",
    name: "مخزن الأدوات",
    type: "تشغيلي",
    city: "سطيف",
    manager: "خالد عمر",
    status: "active",
    capacity: 2800,
    isDefault: false,
  },
  {
    id: "WH-PLUMB",
    name: "مخزن السباكة",
    type: "تشغيلي",
    city: "وهران",
    manager: "يوسف علي",
    status: "active",
    capacity: 4200,
    isDefault: false,
  },
  {
    id: "WH-RETURN",
    name: "مخزن المرتجعات والحجر",
    type: "حجر/مرتجع",
    city: "الجزائر",
    manager: "الإدارة",
    status: "active",
    capacity: 900,
    isDefault: false,
  },
];

export const priceLists = [
  {
    id: "MAIN",
    code: "MAIN",
    name: "السعر الرئيسي",
    type: "both",
    description: "يعتمد السعر الموجود في بطاقة الصنف، ويستخدم كمرجع fallback لكل القوائم.",
    isDefault: true,
    isActive: true,
    updatedAt: "2026-04-22",
    items: [],
  },
  {
    id: "AHMED",
    code: "PL-AHMED",
    name: "أسعار أحمد",
    type: "sales",
    description: "تسعيرة خاصة لزبون أو مندوب محدد، وبعض الأصناف تعود للسعر الرئيسي.",
    isDefault: false,
    isActive: true,
    updatedAt: "2026-04-20",
    items: [
      { productKey: "BRG-010-50", unitPrice: 11 },
      { productKey: "BRG-008-30", unitPrice: 7 },
      { productKey: "MFT-017", unitPrice: 430 },
      { productKey: "KBL-25", unitPrice: 0 },
      { productKey: "ANB-PVC-2", unitPrice: 260 },
    ],
  },
  {
    id: "WHOLESALE",
    code: "PL-WHOLESALE",
    name: "أسعار الجملة",
    type: "sales",
    description: "قائمة أسعار مخفضة للطلبات الكبيرة.",
    isDefault: false,
    isActive: true,
    updatedAt: "2026-04-18",
    items: [
      { productKey: "BRG-010-50", unitPrice: 10 },
      { productKey: "BRG-008-30", unitPrice: 6 },
      { productKey: "SAM-010", unitPrice: 4 },
      { productKey: "KBL-25", unitPrice: 88 },
      { productKey: "KBL-15", unitPrice: 60 },
      { productKey: "DHN-WHT-4", unitPrice: 1750 },
    ],
  },
  {
    id: "SEMI_WHOLESALE",
    code: "PL-SEMI",
    name: "أسعار نصف جملة",
    type: "sales",
    description: "بين السعر الرئيسي والجملة، مناسبة للزبائن المتكررين.",
    isDefault: false,
    isActive: true,
    updatedAt: "2026-04-19",
    items: [
      { productKey: "BRG-010-50", unitPrice: 11 },
      { productKey: "SAM-010", unitPrice: 4.5 },
      { productKey: "MFT-022", unitPrice: 590 },
      { productKey: "SHR-EL", unitPrice: 32 },
      { productKey: "ANB-PVC-1", unitPrice: 165 },
    ],
  },
  {
    id: "PURCHASE_MAIN",
    code: "PUR-MAIN",
    name: "أسعار شراء الموردين",
    type: "purchase",
    description: "قائمة شراء عامة، وتترك الأصناف غير المحددة على السعر الرئيسي.",
    isDefault: false,
    isActive: true,
    updatedAt: "2026-04-16",
    items: [
      { productKey: "RAW-STL-001", unitPrice: 83500 },
      { productKey: "RAW-STL-002", unitPrice: 11800 },
      { productKey: "ELC-CBL-025", unitPrice: 18100 },
      { productKey: "TLS-DRL-001", unitPrice: 0 },
    ],
  },
];

export const priceSourceLabels = {
  price_list: "قائمة أسعار",
  product_default: "السعر الرئيسي",
  manual_override: "تعديل يدوي",
};

export function getDefaultWarehouse(warehouses = mockWarehouses) {
  return warehouses.find((warehouse) => warehouse.isDefault) || warehouses[0];
}

export function getPriceListsFor(kind) {
  return priceLists.filter((list) => list.isActive && (list.type === kind || list.type === "both"));
}

export function getProductPriceKey(product) {
  return product?.code || product?.productCode || product?.id;
}

export function getBaseProductPrice(product) {
  return Number(product?.price ?? product?.unitPrice ?? product?.currentPrice ?? 0);
}

export function resolveProductPrice(product, priceListId = "MAIN", kind = "sales") {
  const basePrice = getBaseProductPrice(product);
  const selectedList =
    priceLists.find((list) => list.id === priceListId && (list.type === kind || list.type === "both")) ||
    priceLists.find((list) => list.id === "MAIN");
  const productKey = getProductPriceKey(product);
  const listItem = selectedList?.items?.find((item) => String(item.productKey) === String(productKey));
  const listPrice = Number(listItem?.unitPrice || 0);
  const usesListPrice = Boolean(listItem && listPrice > 0);

  return {
    priceList: selectedList,
    priceListItem: listItem,
    unitPrice: usesListPrice ? listPrice : basePrice,
    basePrice,
    source: usesListPrice ? "price_list" : "product_default",
    sourceLabel: usesListPrice ? selectedList.name : "السعر الرئيسي",
  };
}

export function formatDZD(value) {
  return Number(value || 0).toLocaleString("fr-DZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
