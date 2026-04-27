-- V8: Seed plans and feature catalog

insert into platform.plans (code, name_ar, name_en, price_monthly, duration_days, max_users, max_orders_monthly, max_products, is_active, sort_order)
values
  ('trial',        'تجريبي',        'Trial',        0,       14,   3,   100,   50,  true, 1),
  ('basic',        'أساسي',         'Basic',        2900,   365,  10,   500,  200,  true, 2),
  ('professional', 'احترافي',       'Professional', 6900,   365,  30,  5000, 1000,  true, 3),
  ('enterprise',   'مؤسسي',         'Enterprise',   null,   365,  null, null, null,  true, 4)
on conflict (code) do nothing;

insert into platform.feature_catalog (code, name_ar, name_en, category, description, is_visible_to_all, sort_order)
values
  ('orders',            'إدارة الطلبيات',       'Orders',              'sales',       'إنشاء وإدارة طلبيات البيع',                 true,  1),
  ('inventory',         'إدارة المخزون',         'Inventory',           'operations',  'تتبع المخزون والحركات بين المستودعات',      true,  2),
  ('purchases',         'أوامر الشراء',          'Purchases',           'operations',  'إنشاء وإدارة أوامر الشراء',                 true,  3),
  ('manufacturing',     'طلبات التصنيع',          'Manufacturing',       'operations',  'إدارة طلبات الإنتاج والتصنيع',              true,  4),
  ('price_lists',       'قوائم الأسعار',          'Price Lists',         'sales',       'تسعير متعدد للزبائن وقنوات البيع',          true,  5),
  ('accounting',        'المحاسبة',              'Accounting',          'finance',     'نظام محاسبة كامل مع قيود يومية وتقارير',    true,  6),
  ('partners',          'شبكة الشركاء',           'Partner Network',     'network',     'الربط والتجارة بين المشتركين',               true,  7),
  ('road_invoices',     'فواتير الطريق',          'Road Invoices',       'logistics',   'إنشاء وطباعة فواتير الطريق',                true,  8),
  ('ai',                'مساعد الذكاء الاصطناعي', 'AI Assistant',        'ai',          'معالجة الصور وتحليل البيانات بالذكاء الاصطناعي', true, 9),
  ('advanced_reports',  'التقارير المتقدمة',       'Advanced Reports',    'analytics',   'تقارير مالية وتشغيلية مفصلة',               true, 10),
  ('multi_warehouse',   'تعدد المستودعات',         'Multi-Warehouse',     'operations',  'إدارة أكثر من مستودع',                     true, 11),
  ('custom_permissions','صلاحيات مخصصة',          'Custom Permissions',  'admin',       'تخصيص صلاحيات المستخدمين بالتفصيل',         true, 12)
on conflict (code) do nothing;

-- Basic plan features
insert into platform.plan_features (plan_id, feature_code, is_enabled, limit_value)
select p.id, f.code, true, null
from platform.plans p, platform.feature_catalog f
where p.code = 'basic'
  and f.code in ('orders','inventory','purchases','price_lists','road_invoices')
on conflict (plan_id, feature_code) do nothing;

-- Professional plan features
insert into platform.plan_features (plan_id, feature_code, is_enabled, limit_value)
select p.id, f.code, true, null
from platform.plans p, platform.feature_catalog f
where p.code = 'professional'
  and f.code in ('orders','inventory','purchases','manufacturing','price_lists',
                 'accounting','road_invoices','ai','advanced_reports','multi_warehouse','partners')
on conflict (plan_id, feature_code) do nothing;

-- Enterprise plan: all features
insert into platform.plan_features (plan_id, feature_code, is_enabled, limit_value)
select p.id, f.code, true, null
from platform.plans p, platform.feature_catalog f
where p.code = 'enterprise'
on conflict (plan_id, feature_code) do nothing;

-- Trial plan: core features only
insert into platform.plan_features (plan_id, feature_code, is_enabled, limit_value)
select p.id, f.code, true, null
from platform.plans p, platform.feature_catalog f
where p.code = 'trial'
  and f.code in ('orders','inventory','purchases','price_lists')
on conflict (plan_id, feature_code) do nothing;
