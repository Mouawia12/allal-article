/* eslint-disable */
/**
 * ════════════════════════════════════════════════════════════════════════════
 *  نظام الصلاحيات — هيكل قاعدة البيانات المقترح (PostgreSQL / MySQL)
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  users
 *  ├── id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
 *  ├── name              VARCHAR(100)  NOT NULL
 *  ├── email             VARCHAR(150)  NOT NULL UNIQUE
 *  ├── phone             VARCHAR(20)
 *  ├── password_hash     VARCHAR(255)  NOT NULL
 *  ├── role              ENUM('owner','admin','salesperson','accountant','viewer')
 *  ├── status            ENUM('active','inactive','suspended') DEFAULT 'active'
 *  ├── assigned_wilaya   VARCHAR(50)   -- الولاية المسندة (للبائعين)
 *  ├── max_discount_pct  TINYINT UNSIGNED DEFAULT 0   -- % الخصم الأقصى
 *  ├── can_view_all_orders BOOLEAN DEFAULT FALSE
 *  ├── lang              ENUM('ar','fr','en') DEFAULT 'ar'
 *  ├── avatar_url        TEXT
 *  ├── notes             TEXT                          -- ملاحظات داخلية
 *  ├── last_login        TIMESTAMP
 *  ├── created_at        TIMESTAMP DEFAULT now()
 *  └── created_by        UUID REFERENCES users(id)
 *
 *  permissions
 *  ├── code              VARCHAR(60) PRIMARY KEY  -- e.g. "orders.create"
 *  ├── label             VARCHAR(100) NOT NULL
 *  ├── module            VARCHAR(40)  NOT NULL     -- e.g. "orders"
 *  ├── description       TEXT
 *  └── sort_order        SMALLINT DEFAULT 0
 *
 *  role_permissions   (الصلاحيات الافتراضية لكل دور)
 *  ├── role              VARCHAR(20) NOT NULL
 *  ├── permission_code   VARCHAR(60) REFERENCES permissions(code)
 *  └── PRIMARY KEY (role, permission_code)
 *
 *  user_permissions   (تخصيص / إلغاء صلاحية لمستخدم بعينه — يتجاوز role_permissions)
 *  ├── user_id           UUID REFERENCES users(id)
 *  ├── permission_code   VARCHAR(60) REFERENCES permissions(code)
 *  ├── granted           BOOLEAN DEFAULT TRUE    -- FALSE = سحب صريح
 *  ├── granted_by        UUID REFERENCES users(id)
 *  ├── granted_at        TIMESTAMP DEFAULT now()
 *  └── PRIMARY KEY (user_id, permission_code)
 *
 *  INDEX: user_permissions(user_id)
 *  INDEX: role_permissions(role)
 *
 *  ── منطق التحقق في الباكند ──────────────────────────────────────────────
 *  function hasPermission(userId, code):
 *    1. ابحث في user_permissions عن (userId, code)
 *       - موجود → أرجع user_permissions.granted
 *    2. ابحث في role_permissions عن (user.role, code)
 *       - موجود → أرجع TRUE
 *    3. أرجع FALSE
 * ════════════════════════════════════════════════════════════════════════════
 */

// ─── Permissions catalogue ────────────────────────────────────────────────────
export const allPermissions = [
  // الطلبيات
  { code: "orders.view_own",        label: "عرض طلبياته الشخصية",        module: "الطلبيات",              description: "يرى فقط الطلبيات التي أنشأها" },
  { code: "orders.view_all",        label: "عرض كل الطلبيات",             module: "الطلبيات",              description: "يرى طلبيات جميع البائعين" },
  { code: "orders.create",          label: "إنشاء طلبية",                 module: "الطلبيات" },
  { code: "orders.edit",            label: "تعديل طلبية",                 module: "الطلبيات" },
  { code: "orders.confirm",         label: "تأكيد طلبية",                 module: "الطلبيات" },
  { code: "orders.reject",          label: "رفض / إلغاء طلبية",          module: "الطلبيات" },
  { code: "orders.delete",          label: "حذف طلبية",                   module: "الطلبيات" },
  { code: "orders.apply_discount",  label: "تطبيق خصم على الطلبية",      module: "الطلبيات",              description: "محدود بـ max_discount_pct" },
  // الأصناف
  { code: "products.view",          label: "عرض الأصناف",                 module: "الأصناف" },
  { code: "products.create",        label: "إضافة صنف جديد",              module: "الأصناف" },
  { code: "products.edit",          label: "تعديل صنف",                   module: "الأصناف" },
  { code: "products.delete",        label: "حذف صنف",                     module: "الأصناف" },
  { code: "products.price_lists",   label: "إدارة قوائم الأسعار",         module: "الأصناف" },
  { code: "products.favorites",     label: "إدارة المفضلة",               module: "الأصناف" },
  // المخزون
  { code: "stock.view",             label: "عرض المخزون",                 module: "المخزون" },
  { code: "stock.edit",             label: "تعديل الكميات",               module: "المخزون" },
  { code: "stock.transfer",         label: "تحويل بين المستودعات",        module: "المخزون" },
  // الزبائن والموردين
  { code: "customers.view",         label: "عرض الزبائن",                 module: "الزبائن والموردين" },
  { code: "customers.manage",       label: "إضافة / تعديل الزبائن",      module: "الزبائن والموردين" },
  { code: "customers.payments",     label: "تسجيل دفعات الزبائن",        module: "الزبائن والموردين" },
  { code: "suppliers.view",         label: "عرض الموردين",                module: "الزبائن والموردين" },
  { code: "suppliers.manage",       label: "إضافة / تعديل الموردين",     module: "الزبائن والموردين" },
  // المشتريات
  { code: "purchases.view",         label: "عرض المشتريات",               module: "المشتريات" },
  { code: "purchases.create",       label: "إنشاء أمر شراء",              module: "المشتريات" },
  { code: "purchases.approve",      label: "اعتماد / رفض أمر شراء",      module: "المشتريات" },
  // فواتير الطريق
  { code: "road_invoices.view",     label: "عرض فواتير الطريق",           module: "فواتير الطريق" },
  { code: "road_invoices.create",   label: "إنشاء فاتورة طريق",           module: "فواتير الطريق" },
  { code: "road_invoices.edit",     label: "تعديل فاتورة طريق",           module: "فواتير الطريق" },
  // التصنيع
  { code: "manufacturing.view",     label: "عرض أوامر التصنيع",           module: "التصنيع" },
  { code: "manufacturing.manage",   label: "إدارة أوامر التصنيع",         module: "التصنيع" },
  // المحاسبة
  { code: "accounting.view",        label: "عرض الحسابات",                module: "المحاسبة" },
  { code: "accounting.manage",      label: "إدارة المحاسبة",              module: "المحاسبة" },
  { code: "accounting.journals.create", label: "إنشاء قيود يومية",        module: "المحاسبة" },
  { code: "accounting.journals.post",   label: "ترحيل قيود يومية",        module: "المحاسبة" },
  { code: "accounting.reports",     label: "تقارير المحاسبة",             module: "المحاسبة" },
  { code: "accounting.settings",    label: "إعدادات المحاسبة",            module: "المحاسبة" },
  // التقارير والسجلات
  { code: "reports.view",           label: "عرض التقارير",                module: "التقارير والسجلات" },
  { code: "logs.view",              label: "عرض سجل العمليات",            module: "التقارير والسجلات" },
  // الشركاء
  { code: "partners.view",          label: "عرض شبكة الشركاء",            module: "الشركاء" },
  { code: "partners.manage",        label: "إدارة طلبات الشراكة",         module: "الشركاء" },
  // إدارة النظام
  { code: "users.manage",           label: "إدارة المستخدمين",            module: "إدارة النظام" },
  { code: "settings.general",       label: "الإعدادات العامة",            module: "إدارة النظام" },
  { code: "settings.ai",            label: "إعدادات الذكاء الاصطناعي",   module: "إدارة النظام" },
  { code: "settings.road_invoices", label: "إعدادات فواتير الطريق",       module: "إدارة النظام" },
  { code: "company.profile",        label: "ملف الشركة",                  module: "إدارة النظام" },
];

// ─── Grouped by module ────────────────────────────────────────────────────────
export const permissionsByModule = allPermissions.reduce((acc, p) => {
  if (!acc[p.module]) acc[p.module] = [];
  acc[p.module].push(p);
  return acc;
}, {});

// ─── Default permissions per role ────────────────────────────────────────────
export const roleDefaultPermissions = {
  owner: allPermissions.map((p) => p.code),

  admin: [
    "orders.view_own", "orders.view_all", "orders.create", "orders.edit",
    "orders.confirm", "orders.reject", "orders.apply_discount",
    "products.view", "products.create", "products.edit", "products.price_lists", "products.favorites",
    "stock.view", "stock.edit", "stock.transfer",
    "customers.view", "customers.manage", "customers.payments",
    "suppliers.view", "suppliers.manage",
    "purchases.view", "purchases.create", "purchases.approve",
    "road_invoices.view", "road_invoices.create", "road_invoices.edit",
    "manufacturing.view", "manufacturing.manage",
    "accounting.view", "accounting.manage", "accounting.journals.create", "accounting.journals.post", "accounting.reports",
    "reports.view", "logs.view",
    "partners.view", "partners.manage",
    "settings.general", "settings.road_invoices",
    "company.profile",
  ],

  accountant: [
    "orders.view_all",
    "products.view",
    "stock.view",
    "customers.view", "customers.payments",
    "suppliers.view",
    "purchases.view", "purchases.create",
    "road_invoices.view",
    "accounting.view", "accounting.manage", "accounting.journals.create", "accounting.journals.post", "accounting.reports", "accounting.settings",
    "reports.view", "logs.view",
  ],

  salesperson: [
    "orders.view_own", "orders.create", "orders.apply_discount",
    "products.view", "products.favorites",
    "customers.view",
    "road_invoices.view", "road_invoices.create",
    "reports.view",
  ],

  viewer: [
    "orders.view_all",
    "products.view",
    "stock.view",
    "customers.view",
    "suppliers.view",
    "purchases.view",
    "reports.view",
  ],
};

// ─── Role config ──────────────────────────────────────────────────────────────
export const roleConfig = {
  owner:       { label: "مالك",             color: "#7928ca", bg: "#f5ecff" },
  admin:       { label: "إدارة",            color: "#17c1e8", bg: "#e3f8fd" },
  accountant:  { label: "محاسب",            color: "#fb8c00", bg: "#fff3e0" },
  salesperson: { label: "بائع",             color: "#82d616", bg: "#f0fde4" },
  viewer:      { label: "مشاهدة فقط",      color: "#8392ab", bg: "#f1f5f9" },
};

// ─── Mock users ───────────────────────────────────────────────────────────────
export const mockUsers = [
  {
    id: 1, name: "أحمد محمد",    email: "ahmed@company.com",   phone: "0555-111111",
    role: "salesperson", status: "active",
    assignedWilaya: "وهران", maxDiscountPct: 5, canViewAllOrders: false, lang: "ar",
    lastLogin: "2024-01-22 15:30", ordersCount: 8,
    notes: "",
    customPermissions: [], // overrides above role defaults
  },
  {
    id: 2, name: "خالد عمر",     email: "khaled@company.com",  phone: "0561-222222",
    role: "salesperson", status: "active",
    assignedWilaya: "الجزائر", maxDiscountPct: 5, canViewAllOrders: false, lang: "ar",
    lastLogin: "2024-01-22 14:00", ordersCount: 10,
    notes: "",
    customPermissions: [],
  },
  {
    id: 3, name: "محمد سعيد",    email: "msaeed@company.com",  phone: "0536-333333",
    role: "salesperson", status: "active",
    assignedWilaya: "سطيف", maxDiscountPct: 10, canViewAllOrders: false, lang: "ar",
    lastLogin: "2024-01-22 09:15", ordersCount: 18,
    notes: "بائع متمرس - يُمنح صلاحية خصم إضافية",
    customPermissions: ["orders.view_all"], // additional perm beyond role default
  },
  {
    id: 4, name: "يوسف علي",     email: "yousef@company.com",  phone: "0502-444444",
    role: "salesperson", status: "active",
    assignedWilaya: "قسنطينة", maxDiscountPct: 5, canViewAllOrders: false, lang: "ar",
    lastLogin: "2024-01-21 16:45", ordersCount: 11,
    notes: "",
    customPermissions: [],
  },
  {
    id: 5, name: "سارة الإدارة", email: "sara@company.com",    phone: "0518-555555",
    role: "admin", status: "active",
    assignedWilaya: "", maxDiscountPct: 20, canViewAllOrders: true, lang: "ar",
    lastLogin: "2024-01-22 16:00", ordersCount: 0,
    notes: "",
    customPermissions: [],
  },
  {
    id: 6, name: "كريم المحاسب", email: "karim@company.com",   phone: "0550-666666",
    role: "accountant", status: "active",
    assignedWilaya: "", maxDiscountPct: 0, canViewAllOrders: true, lang: "ar",
    lastLogin: "2024-01-22 10:30", ordersCount: 0,
    notes: "",
    customPermissions: [],
  },
  {
    id: 7, name: "المالك",       email: "owner@company.com",   phone: "0544-000000",
    role: "owner", status: "active",
    assignedWilaya: "", maxDiscountPct: 100, canViewAllOrders: true, lang: "ar",
    lastLogin: "2024-01-22 08:00", ordersCount: 0,
    notes: "",
    customPermissions: [],
  },
  {
    id: 8, name: "مستخدم معطل", email: "old@company.com",     phone: "0557-777777",
    role: "salesperson", status: "inactive",
    assignedWilaya: "وهران", maxDiscountPct: 0, canViewAllOrders: false, lang: "ar",
    lastLogin: "2023-12-01 10:00", ordersCount: 3,
    notes: "تم تعطيله بعد انتهاء العقد",
    customPermissions: [],
  },
];

// ─── Current logged-in user (mock — will come from auth context in real app) ─
export const currentUser = mockUsers.find((u) => u.id === 5); // سارة الإدارة

// ─── Get effective permissions for a user ────────────────────────────────────
export function getUserPermissions(user) {
  if (!user) return new Set();
  const base = new Set(roleDefaultPermissions[user.role] || []);
  (user.customPermissions || []).forEach((code) => base.add(code));
  return base;
}

export function hasPermission(user, code) {
  return getUserPermissions(user).has(code);
}
