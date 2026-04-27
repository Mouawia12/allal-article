-- T20: Seed full Algerian SCF chart of accounts (النظام المحاسبي المالي)
-- Level 1 (4-digit): headers, non-postable
-- Level 2 (5-digit): sub-headers or postable detail accounts
-- Level 3 (6-digit): detail postable accounts
-- Constraint: is_postable = true requires level >= 2

-- ─────────────────────────────────────────────────────────────────────────────
-- Insert template items for dz_scf_trading
-- ─────────────────────────────────────────────────────────────────────────────

insert into account_template_items
  (template_id, code, name_ar, name_fr, parent_code, classification,
   financial_statement, normal_balance, is_postable, is_control,
   requires_subledger, subledger_type, report_section, sort_order)
select t.id, v.code, v.name_ar, v.name_fr, v.parent_code, v.classification,
       v.financial_statement, v.normal_balance, v.is_postable, v.is_control,
       v.requires_subledger, v.subledger_type, v.report_section, v.sort_order
from account_templates t
cross join (values

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 1 — رأس المال والاحتياطيات
-- ═══════════════════════════════════════════════════════════════════════════
('1000', 'رأس المال والاحتياطيات',         'Capitaux propres et assimilés',  null,    'equity',     'balance_sheet','credit',false,false,false,null,'equity',           10),
-- رأس المال
('1010', 'رأس المال',                      'Capital',                        '1000',  'equity',     'balance_sheet','credit',false,false,false,null,'equity',           11),
('10101','رأس المال الاجتماعي',            'Capital social',                 '1010',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           12),
('10102','علاوات الإصدار والاندماج',       'Primes d''émission',             '1010',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           13),
-- الاحتياطيات
('1060', 'الاحتياطيات',                    'Réserves',                       '1000',  'equity',     'balance_sheet','credit',false,false,false,null,'equity',           20),
('10601','الاحتياطي القانوني',             'Réserve légale',                 '1060',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           21),
('10602','الاحتياطيات الاختيارية',         'Réserves facultatives',          '1060',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           22),
('10609','احتياطيات أخرى',                 'Autres réserves',                '1060',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           23),
-- الأرباح المرحلة
('1100', 'الأرباح والخسائر المرحلة',       'Report à nouveau',               '1000',  'equity',     'balance_sheet','credit',false,false,false,null,'equity',           30),
('11001','الأرباح المرحلة',                'Report à nouveau bénéficiaire',  '1100',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           31),
('11002','الخسائر المرحلة',                'Report à nouveau déficitaire',   '1100',  'equity',     'balance_sheet','debit', true, false,false,null,'equity',           32),
-- نتيجة السنة
('1200', 'نتيجة السنة',                    'Résultat de l''exercice',        '1000',  'equity',     'balance_sheet','credit',false,false,false,null,'equity',           40),
('12001','ربح السنة المالية',              'Bénéfice de l''exercice',        '1200',  'equity',     'balance_sheet','credit',true, false,false,null,'equity',           41),
('12002','خسارة السنة المالية',            'Perte de l''exercice',           '1200',  'equity',     'balance_sheet','debit', true, false,false,null,'equity',           42),
-- القروض والديون طويلة الأجل
('1640', 'القروض والديون المماثلة',        'Emprunts et dettes assimilées',  '1000',  'liability',  'balance_sheet','credit',false,false,false,null,'long_term_liab',   50),
('16401','قروض بنكية',                     'Emprunts bancaires',             '1640',  'liability',  'balance_sheet','credit',true, false,false,null,'long_term_liab',   51),
('16402','قروض المساهمين',                 'Emprunts des associés',          '1640',  'liability',  'balance_sheet','credit',true, false,false,null,'long_term_liab',   52),
-- الديون المالية قصيرة الأجل
('1690', 'ديون مالية قصيرة الأجل',        'Dettes financières court terme', '1000',  'liability',  'balance_sheet','credit',false,false,false,null,'current_liab',     60),
('16901','ديون بنكية جارية',               'Concours bancaires courants',    '1690',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     61),

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 2 — الأصول الثابتة
-- ═══════════════════════════════════════════════════════════════════════════
('2000', 'الأصول الثابتة',                 'Immobilisations',                null,    'asset',      'balance_sheet','debit', false,false,false,null,'fixed_assets',     100),
-- أصول معنوية
('2100', 'الأصول الثابتة المعنوية',        'Immobilisations incorporelles',  '2000',  'asset',      'balance_sheet','debit', false,false,false,null,'fixed_assets',     101),
('21001','قيمة الشهرة والمحل التجاري',     'Fonds commercial',               '2100',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     102),
('21002','برامج الكمبيوتر',                'Logiciels informatiques',        '2100',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     103),
-- أصول عينية
('2130', 'الأصول الثابتة العينية',         'Immobilisations corporelles',    '2000',  'asset',      'balance_sheet','debit', false,false,false,null,'fixed_assets',     110),
('21301','الأراضي',                         'Terrains',                       '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     111),
('21302','المباني والإنشاءات',             'Constructions',                  '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     112),
('21303','المعدات والآلات الصناعية',       'Équipements industriels',        '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     113),
('21304','وسائل النقل',                    'Matériel de transport',          '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     114),
('21305','الأثاث والتجهيزات المكتبية',    'Mobilier et matériel de bureau', '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     115),
('21309','أصول ثابتة عينية أخرى',         'Autres immobilisations corp.',   '2130',  'asset',      'balance_sheet','debit', true, false,false,null,'fixed_assets',     116),
-- الاهتلاكات والمؤونات
('2800', 'اهتلاكات الأصول الثابتة',        'Amortissements des immob.',      '2000',  'asset',      'balance_sheet','credit',false,false,false,null,'fixed_assets',     120),
('28001','اهتلاك الأصول المعنوية',         'Amort. immob. incorporelles',    '2800',  'asset',      'balance_sheet','credit',true, false,false,null,'fixed_assets',     121),
('28002','اهتلاك المباني',                 'Amort. constructions',           '2800',  'asset',      'balance_sheet','credit',true, false,false,null,'fixed_assets',     122),
('28003','اهتلاك المعدات',                 'Amort. équipements',             '2800',  'asset',      'balance_sheet','credit',true, false,false,null,'fixed_assets',     123),
('28004','اهتلاك وسائل النقل',            'Amort. matériel de transport',   '2800',  'asset',      'balance_sheet','credit',true, false,false,null,'fixed_assets',     124),

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 3 — المخزونات
-- ═══════════════════════════════════════════════════════════════════════════
('3000', 'المخزونات والمنتجات قيد التنفيذ','Stocks et en-cours',            null,    'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   200),
-- بضاعة
('3001', 'مخزون البضاعة',                  'Stocks de marchandises',         '3000',  'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   201),
('30011','بضاعة للبيع',                    'Marchandises destinées à la vte','3001',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   202),
('30012','بضاعة في الطريق',               'Marchandises en transit',        '3001',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   203),
-- مواد أولية ولوازم
('3100', 'المواد الأولية واللوازم',        'Matières premières et fournitures','3000','asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   210),
('31001','مواد أولية',                     'Matières premières',             '3100',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   211),
('31002','مواد مساعدة ولوازم',             'Matières consommables',          '3100',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   212),
-- منتجات نهائية
('3550', 'المنتجات النهائية',              'Produits finis',                 '3000',  'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   220),
('35501','منتجات نهائية جاهزة',           'Produits finis disponibles',     '3550',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   221),
-- مؤونات تخفيض قيمة المخزون
('3900', 'مؤونات تخفيض قيمة المخزون',     'Dépréciations des stocks',       '3000',  'asset',      'balance_sheet','credit',false,false,false,null,'current_assets',   230),
('39001','مؤونة تخفيض قيمة البضاعة',      'Dépréc. stocks de marchandises', '3900',  'asset',      'balance_sheet','credit',true, false,false,null,'current_assets',   231),

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 4 — الأطراف الثالثة (الذمم)
-- ═══════════════════════════════════════════════════════════════════════════
('4000', 'الأطراف الثالثة',                'Comptes de tiers',               null,    'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   300),
-- الموردون
('4010', 'الموردون والحسابات الملحقة',     'Fournisseurs et comptes rattachés','4000','liability',  'balance_sheet','credit',false,true, true, 'supplier','current_liab',310),
('40101','موردون',                          'Fournisseurs',                   '4010',  'liability',  'balance_sheet','credit',true, true, true, 'supplier','current_liab',311),
('40102','أوراق الدفع لموردين',            'Effets à payer fournisseurs',    '4010',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     312),
('40109','موردون — حسابات أخرى',           'Fournisseurs — autres comptes',  '4010',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     313),
-- الزبائن
('4110', 'الزبائن والحسابات الملحقة',      'Clients et comptes rattachés',   '4000',  'asset',      'balance_sheet','debit', false,true, true, 'customer','current_assets',320),
('41101','ذمم الزبائن',                    'Créances clients',               '4110',  'asset',      'balance_sheet','debit', true, true, true, 'customer','current_assets',321),
('41102','أوراق القبض من زبائن',           'Effets à recevoir clients',      '4110',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   322),
('41109','زبائن — حسابات أخرى',            'Clients — autres comptes',       '4110',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   323),
-- مؤونات الزبائن المشكوك فيهم
('4910', 'مؤونات ذمم الزبائن',             'Dépréciations créances clients', '4000',  'asset',      'balance_sheet','credit',false,false,false,null,'current_assets',   330),
('49101','مؤونة زبائن مشكوك فيهم',        'Clients douteux dépréciations',  '4910',  'asset',      'balance_sheet','credit',true, false,false,null,'current_assets',   331),
-- الدولة والجماعات
('4410', 'الضرائب والرسوم',                'Impôts et taxes',                '4000',  'liability',  'balance_sheet','credit',false,false,false,null,'current_liab',     340),
('44101','ضريبة القيمة المضافة المحصلة',   'TVA collectée',                  '4410',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     341),
('44102','ضريبة القيمة المضافة القابلة للخصم','TVA déductible',              '4410',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   342),
('44103','ضرائب أخرى مستحقة',              'Autres impôts dus',              '4410',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     343),
-- المستخدمون
('4210', 'المستخدمون والحسابات الملحقة',   'Personnel et comptes rattachés', '4000',  'liability',  'balance_sheet','credit',false,false,false,null,'current_liab',     350),
('42101','رواتب وأجور مستحقة',             'Rémunérations dues',             '4210',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     351),
-- مدينون ودائنون متنوعون
('4670', 'مدينون ودائنون متنوعون',          'Débiteurs et créditeurs divers', '4000',  'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   360),
('46701','مدينون متنوعون',                  'Débiteurs divers',               '4670',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   361),
('46702','دائنون متنوعون',                  'Créditeurs divers',              '4670',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     362),
-- حسابات الأمانات
('4870', 'إيرادات مؤجلة وأمانات',          'Produits constatés d''avance',   '4000',  'liability',  'balance_sheet','credit',false,false,false,null,'current_liab',     370),
('48701','دفعات مقدمة من زبائن',           'Avances reçues clients',         '4870',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     371),
('48702','إيرادات مؤجلة',                  'Produits constatés d''avance',   '4870',  'liability',  'balance_sheet','credit',true, false,false,null,'current_liab',     372),

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 5 — الحسابات المالية
-- ═══════════════════════════════════════════════════════════════════════════
('5000', 'الحسابات المالية',               'Comptes financiers',             null,    'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   400),
-- البنوك
('5120', 'حسابات بنكية',                   'Comptes bancaires',              '5000',  'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   401),
('51201','البنك الرئيسي',                  'Banque principale',              '5120',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   402),
('51202','بنك ثانوي',                      'Banque secondaire',              '5120',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   403),
('51203','بريد الجزائر CCP',               'CCP Algérie Poste',             '5120',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   404),
-- الصندوق النقدي
('5300', 'الصندوق النقدي',                 'Caisse',                         '5000',  'asset',      'balance_sheet','debit', false,false,false,null,'current_assets',   410),
('53001','صندوق رئيسي',                    'Caisse principale',              '5300',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   411),
('53002','صندوق فرعي',                     'Caisse auxiliaire',              '5300',  'asset',      'balance_sheet','debit', true, false,false,null,'current_assets',   412),
-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 6 — الأعباء (حساب النتائج)
-- ═══════════════════════════════════════════════════════════════════════════
('6000', 'الأعباء',                        'Charges',                        null,    'expense',    'income_statement','debit',false,false,false,null,'expenses',        500),
-- تكلفة البضاعة المباعة
('6010', 'مشتريات البضاعة',                'Achats de marchandises',         '6000',  'expense',    'income_statement','debit',false,false,false,null,'cogs',            510),
('60101','مشتريات البضاعة للبيع',          'Achats de marchandises',         '6010',  'expense',    'income_statement','debit',true, false,false,null,'cogs',            511),
('60102','مردودات المشتريات',              'Retours sur achats',             '6010',  'expense',    'income_statement','credit',true,false,false,null,'cogs',            512),
-- مواد أولية
('6011', 'مشتريات المواد الأولية',          'Achats de matières premières',   '6000',  'expense',    'income_statement','debit',false,false,false,null,'cogs',            515),
('60111','مواد أولية مستهلكة',             'Matières premières consommées',  '6011',  'expense',    'income_statement','debit',true, false,false,null,'cogs',            516),
-- مصاريف النقل
('6040', 'أعباء النقل',                    'Charges de transport',           '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        520),
('60401','نقل البضاعة',                    'Transport sur achats',           '6040',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        521),
('60402','نقل المنتجات للزبائن',           'Transport sur ventes',           '6040',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        522),
-- الخدمات الخارجية
('6060', 'الخدمات الخارجية',               'Services extérieurs',            '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        530),
('60601','إيجارات',                        'Loyers',                         '6060',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        531),
('60602','صيانة وإصلاح',                   'Entretien et réparations',       '6060',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        532),
('60603','مصاريف الاتصالات',               'Télécommunications',             '6060',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        533),
('60604','أتعاب ومكافآت',                  'Honoraires et commissions',      '6060',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        534),
('60605','تأمينات',                        'Assurances',                     '6060',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        535),
-- مصاريف متنوعة
('6070', 'مصاريف متنوعة',                  'Frais divers',                   '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        540),
('60701','أدوات مكتبية ومستلزمات',         'Fournitures de bureau',          '6070',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        541),
('60702','مصاريف إعلان وتسويق',            'Publicité et marketing',         '6070',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        542),
('60709','مصاريف متنوعة أخرى',             'Autres charges diverses',        '6070',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        543),
-- أعباء المستخدمين
('6210', 'أعباء المستخدمين',               'Charges de personnel',           '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        550),
('62101','الرواتب والأجور',                'Salaires et traitements',        '6210',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        551),
('62102','اشتراكات الضمان الاجتماعي',      'Cotisations CNAS/CASNOS',        '6210',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        552),
-- الضرائب والرسوم
('6310', 'الضرائب والرسوم',                'Impôts et taxes',                '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        560),
('63101','الرسم على النشاط المهني TAP',    'Taxe sur activité professionnelle','6310','expense',   'income_statement','debit',true, false,false,null,'expenses',        561),
('63102','الرسم العقاري',                  'Taxe foncière',                  '6310',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        562),
('63109','ضرائب ورسوم أخرى',               'Autres impôts et taxes',         '6310',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        563),
-- أعباء مالية
('6600', 'الأعباء المالية',                'Charges financières',            '6000',  'expense',    'income_statement','debit',false,false,false,null,'financial_exp',   570),
('66001','فوائد القروض البنكية',            'Intérêts des emprunts',          '6600',  'expense',    'income_statement','debit',true, false,false,null,'financial_exp',   571),
('66002','أعباء الصرف',                    'Pertes de change',               '6600',  'expense',    'income_statement','debit',true, false,false,null,'financial_exp',   572),
-- مخصصات الاهتلاك والمؤونات
('6860', 'مخصصات الاهتلاك',               'Dotations aux amortissements',   '6000',  'expense',    'income_statement','debit',false,false,false,null,'expenses',        580),
('68601','مخصص اهتلاك الأصول الثابتة',    'Dotations amort. immobilisations','6860', 'expense',   'income_statement','debit',true, false,false,null,'expenses',        581),
('68602','مخصص مؤونات الأصول',            'Dotations provisions actifs',    '6860',  'expense',    'income_statement','debit',true, false,false,null,'expenses',        582),
-- ضريبة على الأرباح
('6950', 'الضريبة على أرباح الشركات',      'Impôts sur bénéfices',           '6000',  'expense',    'income_statement','debit',false,false,false,null,'tax_expense',     590),
('69501','ضريبة على أرباح الشركات IBS',    'IBS — Impôt sur bénéfices',      '6950',  'expense',    'income_statement','debit',true, false,false,null,'tax_expense',     591),

-- ═══════════════════════════════════════════════════════════════════════════
-- CLASS 7 — النواتج (حساب النتائج)
-- ═══════════════════════════════════════════════════════════════════════════
('7000', 'النواتج',                        'Produits',                       null,    'revenue',    'income_statement','credit',false,false,false,null,'revenue',         600),
-- مبيعات البضاعة
('7001', 'مبيعات البضاعة',                 'Ventes de marchandises',         '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         601),
('70011','مبيعات البضاعة المحلية',         'Ventes de marchandises locales', '7001',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         602),
('70012','تصدير البضاعة',                  'Ventes à l''exportation',        '7001',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         603),
-- مردودات ورسوم البيع
('7009', 'مردودات المبيعات والتخفيضات',    'Retours et réductions accordés', '7000',  'revenue',    'income_statement','debit', false,false,false,null,'revenue',         604),
('70091','مردودات البضاعة المباعة',        'Retours sur ventes',             '7009',  'revenue',    'income_statement','debit', true, false,false,null,'revenue',         605),
('70092','تخفيضات وحسومات ممنوحة',        'Remises et rabais accordés',     '7009',  'revenue',    'income_statement','debit', true, false,false,null,'revenue',         606),
-- إيرادات الخدمات
('7060', 'إيرادات الخدمات',                'Produits des services',          '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         610),
('70601','إيرادات خدمات متنوعة',           'Prestations de services',        '7060',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         611),
('70602','عمولات ومكافآت',                 'Commissions et honoraires',      '7060',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         612),
-- الإنتاج المخزون
('7130', 'الإنتاج المخزون',                'Production stockée',             '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         620),
('71301','تغير مخزون المنتجات النهائية',   'Variation stocks produits finis','7130',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         621),
-- الإعانات الاستغلالية
('7400', 'إعانات الاستغلال',               'Subventions d''exploitation',    '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         630),
('74001','إعانات استغلال من الدولة',       'Subventions publiques',          '7400',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         631),
-- النواتج المالية
('7600', 'النواتج المالية',                'Produits financiers',            '7000',  'revenue',    'income_statement','credit',false,false,false,null,'financial_rev',   640),
('76001','فوائد مكتسبة',                   'Intérêts courus',                '7600',  'revenue',    'income_statement','credit',true, false,false,null,'financial_rev',   641),
('76002','أرباح الصرف',                    'Gains de change',                '7600',  'revenue',    'income_statement','credit',true, false,false,null,'financial_rev',   642),
-- استرداد المؤونات وتحويل الأعباء
('7860', 'استرداد المؤونات',               'Reprises sur provisions',        '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         650),
('78601','استرداد مؤونات الأصول',         'Reprises prov. sur actifs',      '7860',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         651),
('78602','استرداد مؤونات الأعباء',        'Reprises prov. sur charges',     '7860',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         652),
('7890', 'تحويل الأعباء',                  'Transfert de charges',           '7000',  'revenue',    'income_statement','credit',false,false,false,null,'revenue',         660),
('78901','تحويل أعباء الاستغلال',          'Transfert charges exploitation', '7890',  'revenue',    'income_statement','credit',true, false,false,null,'revenue',         661)

) as v(code,name_ar,name_fr,parent_code,classification,financial_statement,
        normal_balance,is_postable,is_control,requires_subledger,subledger_type,
        report_section,sort_order)
where t.code = 'dz_scf_trading'
  -- skip duplicate/placeholder row
  and v.name_ar <> ''
on conflict (template_id, code) do nothing;


-- ─────────────────────────────────────────────────────────────────────────────
-- Deploy accounts directly from template items
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Insert all accounts (without parent_id yet)
insert into accounts (
  code, name_ar, name_fr,
  level, classification, financial_statement, normal_balance,
  is_postable, is_control, requires_subledger, subledger_type,
  report_section, sort_order, is_template_locked,
  template_item_id, template_version, account_class_id, status
)
select
  ti.code,
  ti.name_ar,
  ti.name_fr,
  case
    when length(ti.code) = 4 then 1
    when length(ti.code) = 5 then 2
    else 3
  end                           as level,
  ti.classification,
  ti.financial_statement,
  ti.normal_balance,
  ti.is_postable,
  ti.is_control,
  ti.requires_subledger,
  ti.subledger_type,
  ti.report_section,
  ti.sort_order,
  true                          as is_template_locked,
  ti.id                         as template_item_id,
  1                             as template_version,
  ac.id                         as account_class_id,
  'active'
from account_template_items ti
join account_templates t    on t.id = ti.template_id and t.code = 'dz_scf_trading'
left join account_classes ac on ac.code = left(ti.code, 1)
where ti.name_ar <> ''
on conflict (code) do nothing;

-- Step 2: Set parent_id based on parent_code
update accounts a
set parent_id = p.id
from account_template_items ti
join account_templates t on t.id = ti.template_id and t.code = 'dz_scf_trading'
join accounts p          on p.code = ti.parent_code
where a.template_item_id = ti.id
  and ti.parent_code is not null;

-- Step 3: Build path column (e.g. /1000/1010/10101)
update accounts a
set path = case
  when p.path is null then '/' || a.code
  else p.path || '/' || a.code
end
from accounts p
where a.parent_id = p.id;

-- Handle root accounts (no parent)
update accounts set path = '/' || code where path is null;

-- Step 4: Record deployment
insert into chart_template_deployments
  (template_id, template_version, status, deployed_at, accounts_created)
select t.id, 1, 'completed', now(),
       (select count(*) from accounts where template_version = 1)
from account_templates t
where t.code = 'dz_scf_trading'
on conflict do nothing;
