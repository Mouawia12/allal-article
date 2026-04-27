-- T17: Seed system roles and permissions

insert into roles (code, name_ar, description, is_system) values
  ('owner',       'مالك النظام',     'صلاحيات كاملة غير قابلة للتعديل',        true),
  ('admin',       'مدير',            'إدارة المستخدمين والإعدادات',             true),
  ('salesperson', 'بائع',            'إنشاء وإدارة الطلبيات',                   true),
  ('driver',      'سائق',            'عرض الطلبيات وفواتير الطريق',             true),
  ('view_only',   'مشاهد فقط',       'عرض البيانات بدون تعديل',                 true)
on conflict (code) do nothing;

insert into permissions (code, module, name_ar, description) values
  -- Orders
  ('orders.view',           'orders',       'عرض الطلبيات',               null),
  ('orders.create',         'orders',       'إنشاء طلبية',                null),
  ('orders.edit',           'orders',       'تعديل طلبية',                null),
  ('orders.confirm',        'orders',       'تأكيد طلبية',                null),
  ('orders.ship',           'orders',       'شحن طلبية',                  null),
  ('orders.cancel',         'orders',       'إلغاء طلبية',                null),
  ('orders.delete',         'orders',       'حذف طلبية',                  null),
  -- Products
  ('products.view',         'products',     'عرض الأصناف',                null),
  ('products.create',       'products',     'إضافة صنف',                  null),
  ('products.edit',         'products',     'تعديل صنف',                  null),
  ('products.delete',       'products',     'حذف صنف',                    null),
  ('products.price_change', 'products',     'تغيير سعر الصنف',            null),
  -- Inventory
  ('inventory.view',        'inventory',    'عرض المخزون',                null),
  ('inventory.adjust',      'inventory',    'تسوية المخزون',              null),
  ('inventory.transfer',    'inventory',    'تحويل مخزون',                null),
  -- Purchases
  ('purchases.view',        'purchases',    'عرض أوامر الشراء',           null),
  ('purchases.create',      'purchases',    'إنشاء أمر شراء',             null),
  ('purchases.edit',        'purchases',    'تعديل أمر شراء',             null),
  ('purchases.receive',     'purchases',    'استلام مشتريات',             null),
  -- Manufacturing
  ('manufacturing.view',    'manufacturing','عرض طلبات التصنيع',          null),
  ('manufacturing.create',  'manufacturing','إنشاء طلب تصنيع',            null),
  ('manufacturing.manage',  'manufacturing','إدارة التصنيع',               null),
  -- Customers
  ('customers.view',        'customers',    'عرض الزبائن',                null),
  ('customers.create',      'customers',    'إضافة زبون',                 null),
  ('customers.edit',        'customers',    'تعديل زبون',                 null),
  ('customers.delete',      'customers',    'حذف زبون',                   null),
  -- Accounting
  ('accounting.view',       'accounting',   'عرض المحاسبة',               null),
  ('accounting.post',       'accounting',   'ترحيل قيود',                 null),
  ('accounting.reports',    'accounting',   'تقارير مالية',               null),
  ('accounting.settings',   'accounting',   'إعدادات المحاسبة',           null),
  -- Users & Settings
  ('users.view',            'users',        'عرض المستخدمين',             null),
  ('users.manage',          'users',        'إدارة المستخدمين',           null),
  ('settings.view',         'settings',     'عرض الإعدادات',              null),
  ('settings.manage',       'settings',     'تعديل الإعدادات',            null),
  -- Road invoices
  ('road_invoices.view',    'road_invoices','عرض فواتير الطريق',          null),
  ('road_invoices.create',  'road_invoices','إنشاء فاتورة طريق',          null),
  ('road_invoices.print',   'road_invoices','طباعة فاتورة طريق',          null),
  -- Reports
  ('reports.sales',         'reports',      'تقارير المبيعات',            null),
  ('reports.inventory',     'reports',      'تقارير المخزون',             null),
  ('reports.financial',     'reports',      'التقارير المالية',           null),
  -- Partners
  ('partners.view',         'partners',     'عرض الشركاء',                null),
  ('partners.manage',       'partners',     'إدارة الشركاء',               null)
on conflict (code) do nothing;

-- Assign all permissions to owner role
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.code = 'owner'
on conflict do nothing;

-- Admin: everything except sensitive settings
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on true
where r.code = 'admin'
  and p.code not in ('accounting.settings')
on conflict do nothing;

-- Salesperson
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on true
where r.code = 'salesperson'
  and p.code in ('orders.view','orders.create','orders.edit','orders.confirm','orders.ship','orders.cancel',
                 'products.view','inventory.view','customers.view','customers.create','customers.edit',
                 'road_invoices.view','road_invoices.create','road_invoices.print','reports.sales')
on conflict do nothing;

-- Driver
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on true
where r.code = 'driver'
  and p.code in ('orders.view','road_invoices.view','road_invoices.print')
on conflict do nothing;

-- View only
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on true
where r.code = 'view_only'
  and p.code in ('orders.view','products.view','inventory.view','customers.view',
                 'purchases.view','reports.sales','reports.inventory')
on conflict do nothing;
