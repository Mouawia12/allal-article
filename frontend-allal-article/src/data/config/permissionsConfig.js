// Permission system configuration — mirrors the backend roles & permissions tables.

export const allPermissions = [
  { code: "orders.view_own",        label: "عرض طلبياته الشخصية",        module: "الطلبيات" },
  { code: "orders.view_all",        label: "عرض كل الطلبيات",             module: "الطلبيات" },
  { code: "orders.create",          label: "إنشاء طلبية",                 module: "الطلبيات" },
  { code: "orders.edit",            label: "تعديل طلبية",                 module: "الطلبيات" },
  { code: "orders.confirm",         label: "تأكيد طلبية",                 module: "الطلبيات" },
  { code: "orders.reject",          label: "رفض / إلغاء طلبية",          module: "الطلبيات" },
  { code: "orders.delete",          label: "حذف طلبية",                   module: "الطلبيات" },
  { code: "orders.apply_discount",  label: "تطبيق خصم على الطلبية",      module: "الطلبيات" },
  { code: "products.view",          label: "عرض الأصناف",                 module: "الأصناف" },
  { code: "products.create",        label: "إضافة صنف جديد",              module: "الأصناف" },
  { code: "products.edit",          label: "تعديل صنف",                   module: "الأصناف" },
  { code: "products.delete",        label: "حذف صنف",                     module: "الأصناف" },
  { code: "products.price_lists",   label: "إدارة قوائم الأسعار",         module: "الأصناف" },
  { code: "products.favorites",     label: "إدارة المفضلة",               module: "الأصناف" },
  { code: "stock.view",             label: "عرض المخزون",                 module: "المخزون" },
  { code: "stock.edit",             label: "تعديل الكميات",               module: "المخزون" },
  { code: "stock.transfer",         label: "تحويل بين المستودعات",        module: "المخزون" },
  { code: "customers.view",         label: "عرض الزبائن",                 module: "الزبائن والموردين" },
  { code: "customers.manage",       label: "إضافة / تعديل الزبائن",      module: "الزبائن والموردين" },
  { code: "customers.payments",     label: "تسجيل دفعات الزبائن",        module: "الزبائن والموردين" },
  { code: "suppliers.view",         label: "عرض الموردين",                module: "الزبائن والموردين" },
  { code: "suppliers.manage",       label: "إضافة / تعديل الموردين",     module: "الزبائن والموردين" },
  { code: "purchases.view",         label: "عرض المشتريات",               module: "المشتريات" },
  { code: "purchases.create",       label: "إنشاء أمر شراء",              module: "المشتريات" },
  { code: "purchases.approve",      label: "اعتماد / رفض أمر شراء",      module: "المشتريات" },
  { code: "road_invoices.view",     label: "عرض فواتير الطريق",           module: "فواتير الطريق" },
  { code: "road_invoices.create",   label: "إنشاء فاتورة طريق",           module: "فواتير الطريق" },
  { code: "road_invoices.edit",     label: "تعديل فاتورة طريق",           module: "فواتير الطريق" },
  { code: "manufacturing.view",     label: "عرض أوامر التصنيع",           module: "التصنيع" },
  { code: "manufacturing.manage",   label: "إدارة أوامر التصنيع",         module: "التصنيع" },
  { code: "accounting.view",        label: "عرض الحسابات",                module: "المحاسبة" },
  { code: "accounting.manage",      label: "إدارة المحاسبة",              module: "المحاسبة" },
  { code: "accounting.journals.create", label: "إنشاء قيود يومية",        module: "المحاسبة" },
  { code: "accounting.journals.post",   label: "ترحيل قيود يومية",        module: "المحاسبة" },
  { code: "accounting.reports",     label: "تقارير المحاسبة",             module: "المحاسبة" },
  { code: "accounting.settings",    label: "إعدادات المحاسبة",            module: "المحاسبة" },
  { code: "reports.view",           label: "عرض التقارير",                module: "التقارير والسجلات" },
  { code: "logs.view",              label: "عرض سجل العمليات",            module: "التقارير والسجلات" },
  { code: "partners.view",          label: "عرض شبكة الشركاء",            module: "الشركاء" },
  { code: "partners.manage",        label: "إدارة طلبات الشراكة",         module: "الشركاء" },
  { code: "users.manage",           label: "إدارة المستخدمين",            module: "إدارة النظام" },
  { code: "settings.general",       label: "الإعدادات العامة",            module: "إدارة النظام" },
  { code: "settings.ai",            label: "إعدادات الذكاء الاصطناعي",   module: "إدارة النظام" },
  { code: "settings.road_invoices", label: "إعدادات فواتير الطريق",       module: "إدارة النظام" },
  { code: "company.profile",        label: "ملف الشركة",                  module: "إدارة النظام" },
];

export const permissionsByModule = allPermissions.reduce((acc, p) => {
  if (!acc[p.module]) acc[p.module] = [];
  acc[p.module].push(p);
  return acc;
}, {});

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

export const roleConfig = {
  owner:       { label: "مالك",            color: "#7928ca", bg: "#f5ecff" },
  admin:       { label: "إدارة",           color: "#17c1e8", bg: "#e3f8fd" },
  accountant:  { label: "محاسب",           color: "#fb8c00", bg: "#fff3e0" },
  salesperson: { label: "بائع",            color: "#82d616", bg: "#f0fde4" },
  viewer:      { label: "مشاهدة فقط",     color: "#8392ab", bg: "#f1f5f9" },
};

export function getUserPermissions(user) {
  if (!user) return new Set();
  const role = user.role || user.roleCode;
  const base = new Set(roleDefaultPermissions[role] || []);
  (user.customPermissions || []).forEach((code) => base.add(code));
  return base;
}

export function hasPermission(user, code) {
  return getUserPermissions(user).has(code);
}
