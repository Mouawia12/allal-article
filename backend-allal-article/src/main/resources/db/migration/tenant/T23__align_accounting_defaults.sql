-- Align default accounting links for both the simplified ALLAL chart and older
-- SCF tenant charts that were provisioned before the chart template was updated.

with setting_candidates(setting_key, account_code, label, group_name, allowed_classification, requires_control, priority) as (
  values
    ('sales_revenue',      '4001',  'إيرادات المبيعات',      'sales',      'revenue',   false, 1),
    ('sales_revenue',      '70011', 'إيرادات المبيعات',      'sales',      'revenue',   false, 2),
    ('sales_revenue',      '7001',  'إيرادات المبيعات',      'sales',      'revenue',   false, 3),
    ('sales_return',       '4002',  'مردودات المبيعات',      'sales',      'revenue',   false, 1),
    ('sales_return',       '70091', 'مردودات المبيعات',      'sales',      'revenue',   false, 2),
    ('sales_return',       '7009',  'مردودات المبيعات',      'sales',      'revenue',   false, 3),
    ('customers_control',  '1201',  'ذمم العملاء',           'sales',      'asset',     true,  1),
    ('customers_control',  '41101', 'ذمم العملاء',           'sales',      'asset',     true,  2),
    ('customers_control',  '4110',  'ذمم العملاء',           'sales',      'asset',     true,  3),
    ('suppliers_control',  '2101',  'ذمم الموردين',          'purchases',  'liability', true,  1),
    ('suppliers_control',  '40101', 'ذمم الموردين',          'purchases',  'liability', true,  2),
    ('suppliers_control',  '4010',  'ذمم الموردين',          'purchases',  'liability', true,  3),
    ('inventory',          '1101',  'مخزون البضاعة',         'inventory',  'asset',     false, 1),
    ('inventory',          '3001',  'مخزون البضاعة',         'inventory',  'asset',     false, 2),
    ('inventory',          '30011', 'مخزون البضاعة',         'inventory',  'asset',     false, 3),
    ('cogs',               '5001',  'تكلفة البضاعة المباعة', 'inventory',  'expense',   false, 1),
    ('cogs',               '60101', 'تكلفة البضاعة المباعة', 'inventory',  'expense',   false, 2),
    ('cogs',               '6010',  'تكلفة البضاعة المباعة', 'inventory',  'expense',   false, 3),
    ('purchase_return',    '5002',  'مردودات المشتريات',     'purchases',  'expense',   false, 1),
    ('purchase_return',    '60102', 'مردودات المشتريات',     'purchases',  'expense',   false, 2),
    ('cash',               '1301',  'الصندوق',               'cash_bank',  'asset',     false, 1),
    ('cash',               '53001', 'الصندوق',               'cash_bank',  'asset',     false, 2),
    ('bank',               '1302',  'البنك',                 'cash_bank',  'asset',     false, 1),
    ('bank',               '51201', 'البنك',                 'cash_bank',  'asset',     false, 2),
    ('tax_collected',      '2301',  'ضريبة محصلة',           'tax',        'liability', false, 1),
    ('tax_collected',      '44101', 'ضريبة محصلة',           'tax',        'liability', false, 2),
    ('tax_deductible',     '1202',  'ضريبة قابلة للخصم',     'tax',        'asset',     false, 1),
    ('tax_deductible',     '44102', 'ضريبة قابلة للخصم',     'tax',        'asset',     false, 2),
    ('inventory_variance', '5006',  'فروقات جرد ومخزون',     'inventory',  'expense',   false, 1),
    ('inventory_variance', '60709', 'فروقات جرد ومخزون',     'inventory',  'expense',   false, 2)
),
ranked_settings as (
  select distinct on (sc.setting_key)
         sc.setting_key, a.id as account_id, sc.label, sc.group_name,
         sc.allowed_classification, sc.requires_control
  from setting_candidates sc
  join accounts a on a.code = sc.account_code and a.deleted_at is null
  order by sc.setting_key, sc.priority
)
insert into accounting_settings
  (key, account_id, label, group_name, is_required, allowed_classification, requires_control)
select setting_key, account_id, label, group_name, true, allowed_classification, requires_control
from ranked_settings
on conflict (key) do update set
  account_id = excluded.account_id,
  label = excluded.label,
  group_name = excluded.group_name,
  is_required = true,
  allowed_classification = excluded.allowed_classification,
  requires_control = excluded.requires_control,
  updated_at = now();

with payment_candidates(method_code, name_ar, account_code, requires_reference, priority) as (
  values
    ('cash',          'نقدي',           '1301',  false, 1),
    ('cash',          'نقدي',           '53001', false, 2),
    ('bank',          'تحويل بنكي',     '1302',  true,  1),
    ('bank',          'تحويل بنكي',     '51201', true,  2),
    ('bank_transfer', 'تحويل بنكي',     '1302',  true,  1),
    ('bank_transfer', 'تحويل بنكي',     '51201', true,  2),
    ('ccp',           'بريد الجزائر CCP','1302', true,  1),
    ('ccp',           'بريد الجزائر CCP','51203',true,  2),
    ('cheque',        'شيك',            '1303',  true,  1),
    ('cheque',        'شيك',            '51201', true,  2)
),
ranked_payments as (
  select distinct on (pc.method_code)
         pc.method_code, pc.name_ar, a.id as account_id, pc.requires_reference
  from payment_candidates pc
  join accounts a on a.code = pc.account_code and a.deleted_at is null
  order by pc.method_code, pc.priority
)
insert into payment_methods (code, name_ar, default_account_id, requires_reference, is_active)
select method_code, name_ar, account_id, requires_reference, true
from ranked_payments
on conflict (code) do update set
  name_ar = excluded.name_ar,
  default_account_id = excluded.default_account_id,
  requires_reference = excluded.requires_reference,
  is_active = true;
