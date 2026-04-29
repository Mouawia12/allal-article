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

