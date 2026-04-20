/* eslint-disable */
// ─── Partnership / Partner-Network Mock Data ──────────────────────────────────

/**
 * Permissions that a provider can grant to a requester.
 * Each permission is a boolean flag stored in JSONB on the server.
 */
export const PERMISSION_DEFS = [
  {
    key: "view_inventory",
    labelAr: "عرض المخزون والكميات",
    descAr: "يسمح للطرف الثاني برؤية الكميات المتاحة لكل صنف",
    risk: "low",
  },
  {
    key: "view_pricing",
    labelAr: "عرض الأسعار",
    descAr: "يسمح برؤية أسعار البيع لكل صنف",
    risk: "medium",
  },
  {
    key: "view_sales_data",
    labelAr: "عرض بيانات المبيعات",
    descAr: "إجمالي مبيعات الصنف وحركته الشهرية",
    risk: "high",
  },
  {
    key: "clone_products",
    labelAr: "نسخ الأصناف للمخزون",
    descAr: "يسمح بنسخ بيانات الأصناف كاملةً (صور، وصف، وحدة) إلى مخزونه",
    risk: "low",
  },
  {
    key: "create_purchase_link",
    labelAr: "ربط طلبيات الشراء/البيع",
    descAr: "كل طلبية شراء يصدرها الطرف الثاني تتحول تلقائياً لفاتورة مبيعات عندك",
    risk: "medium",
  },
];

/** My own invite codes (as provider) */
export const mockMyInviteCodes = [
  {
    id: 1,
    code: "NORTH-DIST-K7X2",
    label: "كود عام للموزعين",
    permissions: {
      view_inventory: true,
      view_pricing: true,
      view_sales_data: false,
      clone_products: true,
      create_purchase_link: false,
    },
    maxUses: null,
    usesCount: 3,
    expiresAt: null,
    isActive: true,
    createdAt: "2026-03-10",
  },
  {
    id: 2,
    code: "PREM-PART-9QZM",
    label: "كود شريك مميز",
    permissions: {
      view_inventory: true,
      view_pricing: true,
      view_sales_data: true,
      clone_products: true,
      create_purchase_link: true,
    },
    maxUses: 1,
    usesCount: 1,
    expiresAt: "2026-12-31",
    isActive: true,
    createdAt: "2026-01-15",
  },
  {
    id: 3,
    code: "VIEW-ONLY-4RTW",
    label: "عرض فقط (مراقبة)",
    permissions: {
      view_inventory: true,
      view_pricing: false,
      view_sales_data: false,
      clone_products: false,
      create_purchase_link: false,
    },
    maxUses: 5,
    usesCount: 2,
    expiresAt: null,
    isActive: false,  // deactivated
    createdAt: "2025-11-01",
  },
];

/** Active partnerships (approved links) */
export const mockActivePartnerships = [
  {
    id: 1,
    direction: "requester",          // I submitted the code (I access their inventory)
    partnerName: "شركة البيان للإلكترونيات",
    partnerUuid: "c7d8e9f0-a1b2-c3d4-e5f6-789012345678",
    partnerWilaya: "عنابة",
    partnerEmail: "contact@albayan.dz",
    inviteCode: "BAYAN-ELEC-2025",
    permissions: {
      view_inventory: true,
      view_pricing: true,
      view_sales_data: false,
      clone_products: true,
      create_purchase_link: true,
    },
    approvedAt: "2026-02-10",
    status: "active",
  },
  {
    id: 2,
    direction: "provider",           // They submitted my code (they access my inventory)
    partnerName: "مجمع النخيل التجاري",
    partnerUuid: "f0a1b2c3-d4e5-f6a7-b8c9-012345678def",
    partnerWilaya: "ورقلة",
    partnerEmail: "info@nakhil-group.dz",
    inviteCode: "PREM-PART-9QZM",
    permissions: {
      view_inventory: true,
      view_pricing: true,
      view_sales_data: true,
      clone_products: true,
      create_purchase_link: true,
    },
    approvedAt: "2026-01-20",
    status: "active",
  },
  {
    id: 3,
    direction: "requester",
    partnerName: "مؤسسة الخير للتجارة",
    partnerUuid: "d4e5f6a7-b8c9-0123-def0-123456789abc",
    partnerWilaya: "وهران",
    partnerEmail: "owner@alkhayr.dz",
    inviteCode: "ALKHAYR-GEN-001",
    permissions: {
      view_inventory: true,
      view_pricing: false,
      view_sales_data: false,
      clone_products: true,
      create_purchase_link: false,
    },
    approvedAt: "2026-04-01",
    status: "active",
  },
];

/** Pending requests waiting for my approval (others submitted my code) */
export const mockPendingApprovals = [
  {
    id: 10,
    partnerName: "شركة سريع للتوزيع",
    partnerEmail: "contact@sari3-dist.dz",
    partnerWilaya: "البليدة",
    inviteCode: "NORTH-DIST-K7X2",
    requestedAt: "2026-04-19 14:22",
    message: "نرغب في الاطلاع على مخزونكم لتنسيق التوريد",
  },
  {
    id: 11,
    partnerName: "مؤسسة الفجر التجارية",
    partnerEmail: "info@fajr-trade.dz",
    partnerWilaya: "تيزي وزو",
    inviteCode: "NORTH-DIST-K7X2",
    requestedAt: "2026-04-18 09:05",
    message: "",
  },
];

/** My submitted requests waiting for partner approval */
export const mockMyPendingRequests = [
  {
    id: 20,
    partnerName: "مصنع البناء الحديث",
    partnerEmail: "sales@modern-build.dz",
    partnerWilaya: "وهران",
    inviteCode: "MBUILD-2026-Z9P1",
    submittedAt: "2026-04-15 11:00",
    status: "pending",
  },
];

/** Sample products from a linked partner (for LinkedInventory view) */
export const mockPartnerProducts = {
  "c7d8e9f0-a1b2-c3d4-e5f6-789012345678": [  // البيان للإلكترونيات
    { id: "BP-001", code: "TV-SAM-55",   nameAr: "تلفاز سامسونج 55 بوصة", category: "تلفازات", unit: "قطعة", stock: 12,  price: 125000, monthlySales: 4,  imageUrl: null },
    { id: "BP-002", code: "TV-LG-43",    nameAr: "تلفاز LG 43 بوصة",      category: "تلفازات", unit: "قطعة", stock: 8,   price: 89000,  monthlySales: 7,  imageUrl: null },
    { id: "BP-003", code: "AC-MIT-18",   nameAr: "مكيف ميتسوبيشي 18000", category: "تكييف",   unit: "وحدة", stock: 5,   price: 210000, monthlySales: 3,  imageUrl: null },
    { id: "BP-004", code: "AC-MIT-24",   nameAr: "مكيف ميتسوبيشي 24000", category: "تكييف",   unit: "وحدة", stock: 0,   price: 285000, monthlySales: 2,  imageUrl: null },
    { id: "BP-005", code: "WM-SAM-7KG",  nameAr: "غسالة سامسونج 7كغ",    category: "غسالات",  unit: "قطعة", stock: 3,   price: 95000,  monthlySales: 5,  imageUrl: null },
    { id: "BP-006", code: "FRG-LG-350",  nameAr: "ثلاجة LG 350L",         category: "ثلاجات",  unit: "قطعة", stock: 6,   price: 145000, monthlySales: 4,  imageUrl: null },
    { id: "BP-007", code: "LAP-HP-15",   nameAr: "لابتوب HP 15 بوصة",     category: "حواسيب", unit: "قطعة", stock: 0,   price: 88000,  monthlySales: 8,  imageUrl: null },
    { id: "BP-008", code: "PHN-SAM-A54", nameAr: "هاتف سامسونج A54",      category: "هواتف",  unit: "قطعة", stock: 25,  price: 62000,  monthlySales: 15, imageUrl: null },
  ],
  "d4e5f6a7-b8c9-0123-def0-123456789abc": [  // مؤسسة الخير
    { id: "KH-001", code: "FLR-CER-60",  nameAr: "بلاط سيراميك 60×60",    category: "بناء",   unit: "م²",   stock: 450, price: 1200,   monthlySales: 120, imageUrl: null },
    { id: "KH-002", code: "CEM-SCF-50",  nameAr: "سمنت سكيكدة 50كغ",      category: "بناء",   unit: "كيس",  stock: 800, price: 950,    monthlySales: 300, imageUrl: null },
    { id: "KH-003", code: "STL-BAR-12",  nameAr: "حديد تسليح 12mm",        category: "بناء",   unit: "قنطار", stock: 200, price: 85000,  monthlySales: 45,  imageUrl: null },
    { id: "KH-004", code: "PNT-WHT-20L", nameAr: "دهان أبيض 20L",          category: "دهانات", unit: "دلو",  stock: 0,  price: 6400,   monthlySales: 60,  imageUrl: null },
  ],
};

/** Linked-partner suppliers (for PurchaseForm integration) */
export const linkedSuppliers = mockActivePartnerships
  .filter((p) => p.permissions.create_purchase_link || p.permissions.view_inventory)
  .map((p) => ({
    uuid: p.partnerUuid,
    name: p.partnerName,
    isLinked: true,
    permissions: p.permissions,
  }));
