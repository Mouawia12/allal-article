// ─── Product Settings (mutable in-session via ProductSettings page) ────────────
export let productSettings = {
  units: [
    { id: 1, name: "قطعة",      symbol: "PCS", isSystem: true  },
    { id: 2, name: "متر",       symbol: "M",   isSystem: true  },
    { id: 3, name: "كيلوغرام",  symbol: "KG",  isSystem: true  },
    { id: 4, name: "لتر",       symbol: "L",   isSystem: true  },
    { id: 5, name: "علبة",      symbol: "BX",  isSystem: false },
    { id: 6, name: "لفة",       symbol: "RL",  isSystem: false },
    { id: 7, name: "كرطون",     symbol: "CTN", isSystem: false },
    { id: 8, name: "طقم",       symbol: "SET", isSystem: false },
    { id: 9, name: "دزينة",     symbol: "DZ",  isSystem: false },
    { id: 10, name: "صندوق",    symbol: "BOX", isSystem: false },
    { id: 11, name: "رزمة",     symbol: "BND", isSystem: false },
    { id: 12, name: "طرد",      symbol: "PKG", isSystem: false },
  ],
  categories: [
    { id: 1, name: "مسامير وبراغي", color: "#FF6B6B" },
    { id: 2, name: "أدوات",         color: "#4ECDC4" },
    { id: 3, name: "كهرباء",        color: "#FFE66D" },
    { id: 4, name: "سباكة",         color: "#A8E6CF" },
    { id: 5, name: "دهانات",        color: "#DDA0DD" },
    { id: 6, name: "مواد عزل",      color: "#B0C4DE" },
    { id: 7, name: "معدات",         color: "#F4A460" },
    { id: 8, name: "ملابس",         color: "#98D8C8" },
    { id: 9, name: "مواد غذائية",   color: "#FFDAB9" },
  ],
  variantAttributes: [
    { id: 1, name: "اللون",  values: ["أحمر", "أزرق", "أخضر", "أسود", "أبيض", "رمادي", "أصفر"] },
    { id: 2, name: "المقاس", values: ["XS", "S", "M", "L", "XL", "XXL"] },
    { id: 3, name: "الحجم",  values: ["صغير", "وسط", "كبير"] },
    { id: 4, name: "القطر",  values: ["M6", "M8", "M10", "M12", "M16"] },
    { id: 5, name: "الطول",  values: ["25mm", "30mm", "50mm", "75mm", "100mm"] },
    { id: 6, name: "النكهة", values: ["فانيليا", "شوكولاتة", "فراولة", "برتقال"] },
  ],
};

export function updateProductSettings(patch) {
  productSettings = { ...productSettings, ...patch };
}

// ─── Barcode generator (EAN-13 prefix 619 = Algeria) ──────────────────────────
let _seq = 1;
export function generateBarcode() {
  const ts = String(Date.now()).slice(-6);
  const sq = String(_seq++).padStart(4, "0");
  return `619${ts}${sq}`.slice(0, 13);
}

// ─── Variant combination generator ────────────────────────────────────────────
export function generateVariantCombinations(attributes) {
  if (!attributes || !attributes.length) return [];
  const [first, ...rest] = attributes;
  if (!first.values || !first.values.length) return generateVariantCombinations(rest);
  if (!rest.length) return first.values.map((v) => ({ [first.name]: v }));
  const subCombos = generateVariantCombinations(rest);
  return first.values.flatMap((v) => subCombos.map((c) => ({ [first.name]: v, ...c })));
}

// ─── Extended product list (with variants + multi-unit) ───────────────────────
export const mockProductsExtended = [
  {
    id: 1,
    name: "برغي M10 × 50mm",
    code: "BRG-010-50",
    category: "مسامير وبراغي",
    description: "برغي فولاذي عالي الجودة مقاس M10 طول 50mm.",
    baseUnit: "قطعة",
    barcode: "6190000000001",
    hasVariants: false,
    variantAttributes: [],
    variants: [],
    units: [
      { id: 1, unit: "قطعة",   conversionFactor: 1,   price: 650,   barcode: "6190000000001", isBase: true  },
      { id: 2, unit: "كرطون",  conversionFactor: 100, price: 60000, barcode: "6190000000010", isBase: false },
    ],
    stock: 850, weightPerUnit: 0.05, unitsPerPackage: 100, packageUnit: "كرطون", color: "#FF6B6B",
  },
  {
    id: 2,
    name: "قميص كوتون كلاسيك",
    code: "QMS-COT-001",
    category: "ملابس",
    description: "قميص قطني عالي الجودة متوفر بألوان ومقاسات متعددة.",
    baseUnit: "قطعة",
    barcode: null,
    hasVariants: true,
    variantAttributes: [
      { name: "اللون",  values: ["أبيض", "أسود", "أزرق"] },
      { name: "المقاس", values: ["S", "M", "L", "XL"] },
    ],
    variants: [
      { id: "V-001", sku: "QMS-WHT-S",  attrs: { اللون: "أبيض", المقاس: "S"  }, barcode: "6191234000001", price: 2500, stock: 20 },
      { id: "V-002", sku: "QMS-WHT-M",  attrs: { اللون: "أبيض", المقاس: "M"  }, barcode: "6191234000002", price: 2500, stock: 35 },
      { id: "V-003", sku: "QMS-WHT-L",  attrs: { اللون: "أبيض", المقاس: "L"  }, barcode: "6191234000003", price: 2500, stock: 18 },
      { id: "V-004", sku: "QMS-WHT-XL", attrs: { اللون: "أبيض", المقاس: "XL" }, barcode: "6191234000004", price: 2500, stock: 10 },
      { id: "V-005", sku: "QMS-BLK-M",  attrs: { اللون: "أسود", المقاس: "M"  }, barcode: "6191234000005", price: 2800, stock: 40 },
      { id: "V-006", sku: "QMS-BLK-L",  attrs: { اللون: "أسود", المقاس: "L"  }, barcode: "6191234000006", price: 2800, stock: 25 },
      { id: "V-007", sku: "QMS-BLU-M",  attrs: { اللون: "أزرق", المقاس: "M"  }, barcode: "6191234000007", price: 2700, stock: 30 },
      { id: "V-008", sku: "QMS-BLU-L",  attrs: { اللون: "أزرق", المقاس: "L"  }, barcode: "6191234000008", price: 2700, stock: 22 },
    ],
    units: [
      { id: 1, unit: "قطعة",  conversionFactor: 1,  price: 2500,  barcode: null, isBase: true  },
      { id: 2, unit: "دزينة", conversionFactor: 12, price: 27000, barcode: null, isBase: false },
    ],
    stock: 200, weightPerUnit: 0.3, unitsPerPackage: 12, packageUnit: "دزينة", color: "#DDA0DD",
  },
  {
    id: 3,
    name: "كابل كهربائي 2.5mm",
    code: "KBL-25",
    category: "كهرباء",
    description: "كابل كهربائي ثلاثي الأقطاب نحاس خالص 2.5mm.",
    baseUnit: "متر",
    barcode: "6190000000025",
    hasVariants: false,
    variantAttributes: [],
    variants: [],
    units: [
      { id: 1, unit: "متر",        conversionFactor: 1,   price: 400,   barcode: "6190000000025", isBase: true  },
      { id: 2, unit: "رزمة (100م)", conversionFactor: 100, price: 36000, barcode: "6190000000026", isBase: false },
    ],
    stock: 500, weightPerUnit: 0.3, unitsPerPackage: 100, packageUnit: "رزمة", color: "#FFE66D",
  },
];
