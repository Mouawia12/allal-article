-- T19: Seed reference data: product units, payment methods, dimension types,
--      account classes, journal books, resource lock policies

-- System product units
insert into product_units_catalog (name, symbol, is_system) values
  ('قطعة',  'قطعة', true),
  ('كيلوغرام', 'كغ', true),
  ('غرام',  'غ',   true),
  ('لتر',   'ل',   true),
  ('متر',   'م',   true),
  ('كرطون', 'كرت', true),
  ('علبة',  'علبة',true),
  ('حزمة',  'حزمة',true),
  ('دزينة', 'دز',  true)
on conflict (name) do nothing;

-- Payment methods
insert into payment_methods (code, name_ar, requires_reference, is_active) values
  ('cash',          'نقدي',            false, true),
  ('bank_transfer', 'تحويل بنكي',      true,  true),
  ('cheque',        'شيك',             true,  true),
  ('ccp',           'بريد الجزائر CCP', true,  true)
on conflict (code) do nothing;

-- Analytical dimension types
insert into dimension_types (code, name_ar, is_required, is_active) values
  ('cost_center', 'مركز التكلفة', false, true),
  ('wilaya',      'الولاية',      false, true),
  ('salesperson', 'البائع',       false, true),
  ('warehouse',   'المستودع',     false, true),
  ('route',       'المسار',       false, true)
on conflict (code) do nothing;

-- Account classes (SCF Algerian standard)
insert into account_classes (code, name_ar, name_fr, financial_statement, normal_balance, sort_order) values
  ('1', 'حسابات رأس المال',         'Comptes de capitaux',            'balance_sheet',     'credit', 1),
  ('2', 'حسابات الأصول الثابتة',    'Comptes d''immobilisations',     'balance_sheet',     'debit',  2),
  ('3', 'حسابات المخزونات',         'Comptes de stocks',              'balance_sheet',     'debit',  3),
  ('4', 'حسابات الأطراف الثالثة',   'Comptes de tiers',               'balance_sheet',     'debit',  4),
  ('5', 'الحسابات المالية',         'Comptes financiers',             'balance_sheet',     'debit',  5),
  ('6', 'حسابات الأعباء',           'Comptes de charges',             'income_statement',  'debit',  6),
  ('7', 'حسابات النواتج',           'Comptes de produits',            'income_statement',  'credit', 7)
on conflict (code) do nothing;

-- Default account template
insert into account_templates (code, name_ar, name_fr, country_code, code_scheme, code_length, code_pattern, is_default, version)
values ('dz_scf_trading', 'النظام المحاسبي المالي - تجاري', 'SCF Algérien - Commerce', 'DZ', '4_digit_grouped', 4, '^[0-9]{4,6}$', true, 1)
on conflict (code) do nothing;

-- System journal books
insert into journal_books (code, name_ar, book_type, default_prefix, year_format, allows_manual, requires_approval, is_system, is_active) values
  ('sales',     'دفتر المبيعات',     'sales',     'FAC',  'YYYY', false, false, true, true),
  ('purchases', 'دفتر المشتريات',    'purchases', 'ACH',  'YYYY', false, false, true, true),
  ('cash',      'دفتر النقدية',      'cash',      'ESC',  'YYYY', true,  false, true, true),
  ('bank',      'دفتر البنك',        'bank',      'BNQ',  'YYYY', true,  false, true, true),
  ('inventory', 'دفتر المخزون',      'inventory', 'STK',  'YYYY', false, false, true, true),
  ('manual',    'دفتر العمليات المتنوعة', 'manual','OD',   'YYYY', true,  true,  true, true),
  ('opening',   'دفتر أرصدة الافتتاح',  'opening', 'OUV', 'YYYY', false, false, true, true),
  ('closing',   'دفتر أرصدة الإقفال',   'closing', 'CLO', 'YYYY', false, false, true, true)
on conflict (code) do nothing;

-- Resource lock policies for key resources
insert into resource_lock_policies (resource_type, lock_scope, ttl_seconds, heartbeat_interval_seconds, stale_after_seconds, allow_force_takeover, blocked_actions_json, is_active) values
  ('sales_order',     'edit',     300, 30, 90, true,  '["save","confirm","ship","cancel"]',   true),
  ('purchase_order',  'edit',     300, 30, 90, true,  '["save","confirm","receive","cancel"]', true),
  ('journal',         'edit',     300, 30, 90, false, '["save","post"]',                      true),
  ('journal',         'post',     120, 20, 60, false, '["post"]',                             true),
  ('product',         'edit',     300, 30, 90, true,  '["save","delete"]',                    true)
on conflict (resource_type, lock_scope) do nothing;

-- Default settings
insert into settings (key, group_name, value_json) values
  ('company.name',          'company',  null),
  ('company.address',       'company',  null),
  ('company.phone',         'company',  null),
  ('company.tax_number',    'company',  null),
  ('company.nif',           'company',  null),
  ('company.nis',           'company',  null),
  ('company.rc',            'company',  null),
  ('company.logo_url',      'company',  null),
  ('print.paper_size',      'print',    '"A4"'),
  ('print.show_logo',       'print',    'true'),
  ('print.footer_text',     'print',    null),
  ('order.auto_complete_days', 'orders', '3'),
  ('currency.default',      'finance',  '"DZD"')
on conflict (key) do nothing;
