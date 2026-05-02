-- T20: Seed ALLAL 4-digit accounting foundation
-- Matches ACCOUNTING_PROFESSIONAL_BLUEPRINT.md:
-- 1000 assets, 2000 liabilities, 3000 equity, 4000 revenue, 5000 expenses.

-- ─────────────────────────────────────────────────────────────────────────────
-- Template and account classes
-- ─────────────────────────────────────────────────────────────────────────────

insert into account_classes (code, name_ar, name_fr, financial_statement, normal_balance, sort_order)
values
  ('1', 'الأصول',       'Actifs',            'balance_sheet',    'debit',  10),
  ('2', 'الخصوم',       'Passifs',           'balance_sheet',    'credit', 20),
  ('3', 'حقوق الملكية', 'Capitaux propres',  'balance_sheet',    'credit', 30),
  ('4', 'الإيرادات',    'Produits',          'income_statement', 'credit', 40),
  ('5', 'المصروفات',   'Charges',           'income_statement', 'debit',  50)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  financial_statement = excluded.financial_statement,
  normal_balance = excluded.normal_balance,
  sort_order = excluded.sort_order;

insert into account_templates
  (code, name_ar, name_fr, country_code, code_scheme, code_length, code_pattern, is_default, version)
values
  ('dz_scf_trading', 'ALLAL دليل حسابات تجاري 4 خانات', 'ALLAL plan comptable commercial 4 chiffres',
   'DZ', '4_digit_grouped', 4, '^[0-9]{4}$', true, 1)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  code_scheme = excluded.code_scheme,
  code_length = excluded.code_length,
  code_pattern = excluded.code_pattern,
  is_default = true,
  version = excluded.version;

-- ─────────────────────────────────────────────────────────────────────────────
-- Template items
-- ─────────────────────────────────────────────────────────────────────────────

insert into account_template_items
  (template_id, code, name_ar, name_fr, parent_code, classification,
   financial_statement, normal_balance, is_postable, is_control,
   requires_subledger, subledger_type, report_section, statement_line_code,
   statement_sort_order, cash_flow_section, sort_order)
select t.id, v.code, v.name_ar, v.name_fr, v.parent_code, v.classification,
       v.financial_statement, v.normal_balance, v.is_postable, v.is_control,
       v.requires_subledger, v.subledger_type, v.report_section, v.statement_line_code,
       v.statement_sort_order, v.cash_flow_section, v.sort_order
from account_templates t
cross join (values
  ('1000', 'الأصول',                       'Actifs',                         null,   'asset',     'balance_sheet',    'debit',  false, false, false, null,       'assets',         'assets',              10, 'operating', 10),
  ('1010', 'الأصول الثابتة',               'Immobilisations',                '1000', 'asset',     'balance_sheet',    'debit',  false, false, false, null,       'fixed_assets',   'fixed_assets',        20, 'investing', 20),
  ('1011', 'مباني ومنشآت',                 'Constructions',                  '1010', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'fixed_assets',   'buildings',           21, 'investing', 21),
  ('1012', 'معدات وآلات',                  'Equipements',                    '1010', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'fixed_assets',   'equipment',           22, 'investing', 22),
  ('1100', 'المخزون',                      'Stocks',                         '1000', 'asset',     'balance_sheet',    'debit',  false, false, false, null,       'current_assets', 'inventory',           30, 'operating', 30),
  ('1101', 'مخزون البضاعة',                'Stock de marchandises',          '1100', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'inventory_goods',     31, 'operating', 31),
  ('1102', 'بضاعة في الطريق',              'Marchandises en transit',        '1100', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'inventory_transit',   32, 'operating', 32),
  ('1200', 'الذمم المدينة',                'Créances',                       '1000', 'asset',     'balance_sheet',    'debit',  false, true,  true,  'customer', 'current_assets', 'receivables',         40, 'operating', 40),
  ('1201', 'ذمم العملاء',                  'Créances clients',               '1200', 'asset',     'balance_sheet',    'debit',  true,  true,  true,  'customer', 'current_assets', 'customer_receivables',41, 'operating', 41),
  ('1202', 'ضريبة قابلة للخصم',            'TVA déductible',                 '1200', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'tax_deductible',      42, 'operating', 42),
  ('1300', 'الصندوق والبنك',               'Trésorerie',                     '1000', 'asset',     'balance_sheet',    'debit',  false, false, false, null,       'current_assets', 'cash_bank',           50, 'operating', 50),
  ('1301', 'الصندوق',                      'Caisse',                         '1300', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'cash',                51, 'operating', 51),
  ('1302', 'البنك',                        'Banque',                         '1300', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'bank',                52, 'operating', 52),
  ('1303', 'شيكات قيد التحصيل',            'Chèques à encaisser',            '1300', 'asset',     'balance_sheet',    'debit',  true,  false, false, null,       'current_assets', 'checks',              53, 'operating', 53),

  ('2000', 'الخصوم',                       'Passifs',                        null,   'liability', 'balance_sheet',    'credit', false, false, false, null,       'liabilities',    'liabilities',         100,'financing', 100),
  ('2100', 'الذمم الدائنة',                'Dettes fournisseurs',            '2000', 'liability', 'balance_sheet',    'credit', false, true,  true,  'supplier', 'current_liab',   'payables',            110,'operating', 110),
  ('2101', 'ذمم الموردين',                 'Dettes fournisseurs',            '2100', 'liability', 'balance_sheet',    'credit', true,  true,  true,  'supplier', 'current_liab',   'supplier_payables',   111,'operating', 111),
  ('2200', 'القروض والديون المالية',       'Emprunts et dettes financières', '2000', 'liability', 'balance_sheet',    'credit', false, false, false, null,       'current_liab',   'loans',               120,'financing', 120),
  ('2201', 'قروض بنكية',                   'Emprunts bancaires',             '2200', 'liability', 'balance_sheet',    'credit', true,  false, false, null,       'current_liab',   'bank_loans',          121,'financing', 121),
  ('2300', 'ضرائب ورسوم مستحقة',           'Impôts et taxes à payer',        '2000', 'liability', 'balance_sheet',    'credit', false, false, false, null,       'current_liab',   'tax_payables',        130,'operating', 130),
  ('2301', 'ضريبة محصلة',                  'TVA collectée',                  '2300', 'liability', 'balance_sheet',    'credit', true,  false, false, null,       'current_liab',   'tax_collected',       131,'operating', 131),
  ('2302', 'ضرائب أخرى مستحقة',            'Autres impôts dus',              '2300', 'liability', 'balance_sheet',    'credit', true,  false, false, null,       'current_liab',   'other_taxes_payable', 132,'operating', 132),

  ('3000', 'حقوق الملكية',                 'Capitaux propres',               null,   'equity',    'balance_sheet',    'credit', false, false, false, null,       'equity',         'equity',              200,'financing', 200),
  ('3001', 'رأس المال',                    'Capital',                        '3000', 'equity',    'balance_sheet',    'credit', true,  false, false, null,       'equity',         'capital',             201,'financing', 201),
  ('3002', 'أرباح مرحلة',                  'Report à nouveau',               '3000', 'equity',    'balance_sheet',    'credit', true,  false, false, null,       'equity',         'retained_earnings',   202,'financing', 202),
  ('3003', 'نتيجة السنة',                  'Résultat de l''exercice',        '3000', 'equity',    'balance_sheet',    'credit', true,  false, false, null,       'equity',         'current_result',      203,'financing', 203),

  ('4000', 'الإيرادات',                    'Produits',                       null,   'revenue',   'income_statement', 'credit', false, false, false, null,       'revenue',        'revenue',             300,'operating', 300),
  ('4001', 'مبيعات البضاعة',               'Ventes de marchandises',         '4000', 'revenue',   'income_statement', 'credit', true,  false, false, null,       'revenue',        'sales_revenue',       301,'operating', 301),
  ('4002', 'مردودات وحسومات المبيعات',     'Retours et rabais sur ventes',   '4000', 'revenue',   'income_statement', 'debit',  true,  false, false, null,       'revenue',        'sales_returns',       302,'operating', 302),

  ('5000', 'المصروفات',                    'Charges',                        null,   'expense',   'income_statement', 'debit',  false, false, false, null,       'expenses',       'expenses',            400,'operating', 400),
  ('5001', 'تكلفة البضاعة المباعة',        'Coût des marchandises vendues',  '5000', 'expense',   'income_statement', 'debit',  true,  false, false, null,       'cogs',           'cogs',                401,'operating', 401),
  ('5002', 'مردودات المشتريات',            'Retours sur achats',             '5000', 'expense',   'income_statement', 'credit', true,  false, false, null,       'cogs',           'purchase_returns',    402,'operating', 402),
  ('5003', 'مصاريف النقل',                 'Frais de transport',             '5000', 'expense',   'income_statement', 'debit',  true,  false, false, null,       'expenses',       'transport_expense',   403,'operating', 403),
  ('5004', 'مصاريف عامة',                  'Frais généraux',                 '5000', 'expense',   'income_statement', 'debit',  true,  false, false, null,       'expenses',       'general_expense',     404,'operating', 404),
  ('5005', 'أجور ورواتب',                  'Salaires',                       '5000', 'expense',   'income_statement', 'debit',  true,  false, false, null,       'expenses',       'payroll_expense',     405,'operating', 405),
  ('5006', 'فروقات جرد ومخزون',            'Ecarts d''inventaire',           '5000', 'expense',   'income_statement', 'debit',  true,  false, false, null,       'expenses',       'inventory_variance',  406,'operating', 406)
) as v(code,name_ar,name_fr,parent_code,classification,financial_statement,
        normal_balance,is_postable,is_control,requires_subledger,subledger_type,
        report_section,statement_line_code,statement_sort_order,cash_flow_section,sort_order)
where t.code = 'dz_scf_trading'
on conflict (template_id, code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  parent_code = excluded.parent_code,
  classification = excluded.classification,
  financial_statement = excluded.financial_statement,
  normal_balance = excluded.normal_balance,
  is_postable = excluded.is_postable,
  is_control = excluded.is_control,
  requires_subledger = excluded.requires_subledger,
  subledger_type = excluded.subledger_type,
  report_section = excluded.report_section,
  statement_line_code = excluded.statement_line_code,
  statement_sort_order = excluded.statement_sort_order,
  cash_flow_section = excluded.cash_flow_section,
  sort_order = excluded.sort_order;

-- ─────────────────────────────────────────────────────────────────────────────
-- Deploy accounts directly from template items
-- ─────────────────────────────────────────────────────────────────────────────

insert into accounts (
  code, name_ar, name_fr, level, classification, financial_statement, normal_balance,
  is_postable, is_control, requires_subledger, subledger_type, report_section,
  statement_line_code, statement_sort_order, cash_flow_section, sort_order,
  is_template_locked, template_item_id, template_version, account_class_id, status
)
select
  ti.code,
  ti.name_ar,
  ti.name_fr,
  case when ti.parent_code is null then 1 else 2 end,
  ti.classification,
  ti.financial_statement,
  ti.normal_balance,
  ti.is_postable,
  ti.is_control,
  ti.requires_subledger,
  ti.subledger_type,
  ti.report_section,
  ti.statement_line_code,
  ti.statement_sort_order,
  ti.cash_flow_section,
  ti.sort_order,
  true,
  ti.id,
  t.version,
  ac.id,
  'active'
from account_template_items ti
join account_templates t    on t.id = ti.template_id and t.code = 'dz_scf_trading'
left join account_classes ac on ac.code = left(ti.code, 1)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  classification = excluded.classification,
  financial_statement = excluded.financial_statement,
  normal_balance = excluded.normal_balance,
  is_postable = excluded.is_postable,
  is_control = excluded.is_control,
  requires_subledger = excluded.requires_subledger,
  subledger_type = excluded.subledger_type,
  report_section = excluded.report_section,
  statement_line_code = excluded.statement_line_code,
  statement_sort_order = excluded.statement_sort_order,
  cash_flow_section = excluded.cash_flow_section,
  sort_order = excluded.sort_order,
  template_item_id = excluded.template_item_id,
  template_version = excluded.template_version,
  account_class_id = excluded.account_class_id,
  is_template_locked = true;

update accounts a
set parent_id = p.id,
    level = p.level + 1,
    updated_at = now()
from account_template_items ti
join account_templates t on t.id = ti.template_id and t.code = 'dz_scf_trading'
join accounts p          on p.code = ti.parent_code
where a.template_item_id = ti.id
  and ti.parent_code is not null;

update accounts
set parent_id = null, level = 1, updated_at = now()
where code in ('1000', '2000', '3000', '4000', '5000');

update accounts
set path = '/' || code, updated_at = now()
where parent_id is null;

update accounts a
set path = p.path || '/' || a.code,
    updated_at = now()
from accounts p
where a.parent_id = p.id;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fiscal year, periods, journals, settings
-- ─────────────────────────────────────────────────────────────────────────────

insert into fiscal_years (name, start_date, end_date, status)
values (
  'السنة المالية ' || extract(year from current_date)::int,
  date_trunc('year', current_date)::date,
  (date_trunc('year', current_date) + interval '1 year' - interval '1 day')::date,
  'open'
)
on conflict (start_date, end_date) do nothing;

insert into accounting_periods (fiscal_year_id, period_number, name, start_date, end_date, status)
select fy.id,
       gs.n,
       'الفترة ' || lpad(gs.n::text, 2, '0'),
       (fy.start_date + ((gs.n - 1) || ' months')::interval)::date,
       (fy.start_date + (gs.n || ' months')::interval - interval '1 day')::date,
       'open'
from fiscal_years fy
cross join generate_series(1, 12) as gs(n)
where fy.start_date = date_trunc('year', current_date)::date
on conflict (fiscal_year_id, period_number) do nothing;

insert into journal_books (code, name_ar, book_type, default_prefix, allows_manual, is_system)
values
  ('sales',     'دفتر المبيعات',        'sales',     'SAL', false, true),
  ('purchases', 'دفتر المشتريات',       'purchases', 'PUR', false, true),
  ('cash',      'دفتر الصندوق',         'cash',      'CSH', true,  true),
  ('bank',      'دفتر البنك',           'bank',      'BNK', true,  true),
  ('inventory', 'دفتر المخزون',         'inventory', 'INV', false, true),
  ('manual',    'دفتر القيود اليدوية',  'manual',    'MAN', true,  true),
  ('opening',   'دفتر الافتتاح',        'opening',   'OPN', true,  true)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  book_type = excluded.book_type,
  default_prefix = excluded.default_prefix,
  allows_manual = excluded.allows_manual,
  is_system = excluded.is_system,
  is_active = true;

insert into number_sequences (sequence_key, prefix, next_number, padding, fiscal_year_id)
select jb.code || '.' || extract(year from fy.start_date)::int,
       jb.default_prefix || '-' || extract(year from fy.start_date)::int || '-',
       1,
       5,
       fy.id
from journal_books jb
join fiscal_years fy on fy.start_date = date_trunc('year', current_date)::date
on conflict (sequence_key) do nothing;

insert into accounting_settings (key, account_id, label, group_name, is_required, allowed_classification, requires_control)
select v.key, a.id, v.label, v.group_name, true, v.allowed_classification, v.requires_control
from (values
  ('sales_revenue',       '4001', 'إيرادات المبيعات',        'sales',     'revenue',   false),
  ('sales_return',        '4002', 'مردودات المبيعات',        'sales',     'revenue',   false),
  ('customers_control',   '1201', 'ذمم العملاء',             'sales',     'asset',     true),
  ('suppliers_control',   '2101', 'ذمم الموردين',            'purchases', 'liability', true),
  ('inventory',           '1101', 'مخزون البضاعة',           'inventory', 'asset',     false),
  ('cogs',                '5001', 'تكلفة البضاعة المباعة',   'inventory', 'expense',   false),
  ('purchase_return',     '5002', 'مردودات المشتريات',       'purchases', 'expense',   false),
  ('cash',                '1301', 'الصندوق',                 'cash_bank', 'asset',     false),
  ('bank',                '1302', 'البنك',                   'cash_bank', 'asset',     false),
  ('tax_collected',       '2301', 'ضريبة محصلة',             'tax',       'liability', false),
  ('tax_deductible',      '1202', 'ضريبة قابلة للخصم',       'tax',       'asset',     false),
  ('inventory_variance',  '5006', 'فروقات جرد ومخزون',       'inventory', 'expense',   false)
) as v(key, code, label, group_name, allowed_classification, requires_control)
join accounts a on a.code = v.code
on conflict (key) do update set
  account_id = excluded.account_id,
  label = excluded.label,
  group_name = excluded.group_name,
  is_required = true,
  allowed_classification = excluded.allowed_classification,
  requires_control = excluded.requires_control,
  updated_at = now();

insert into payment_methods (code, name_ar, default_account_id, requires_reference, is_active)
select v.code, v.name_ar, a.id, v.requires_reference, true
from (values
  ('cash',   'نقدي',       '1301', false),
  ('bank',   'تحويل بنكي', '1302', true),
  ('cheque', 'شيك',        '1303', true)
) as v(code, name_ar, account_code, requires_reference)
join accounts a on a.code = v.account_code
on conflict (code) do update set
  name_ar = excluded.name_ar,
  default_account_id = excluded.default_account_id,
  requires_reference = excluded.requires_reference,
  is_active = true;

insert into chart_template_deployments
  (template_id, template_version, status, deployed_at, accounts_created, notes)
select t.id, t.version, 'completed', now(),
       (select count(*) from accounts where template_version = t.version),
       'زرع تلقائي لدليل الحسابات الافتراضي'
from account_templates t
where t.code = 'dz_scf_trading'
  and not exists (
    select 1
    from chart_template_deployments d
    where d.template_id = t.id and d.template_version = t.version and d.status = 'completed'
  );
