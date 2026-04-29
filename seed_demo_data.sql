-- =============================================================================
-- DEMO DATA SEEDER — نظام إدارة الطلبيات Group Allal
-- تشغيل مباشر على قاعدة البيانات (لا علاقة له بـ Flyway)
-- آمن للتشغيل أكثر من مرة
-- =============================================================================

BEGIN;

-- ─── 1. تحديث بيانات الخطط بأسعار صحيحة ──────────────────────────────────────
UPDATE platform.plans SET
    price_monthly       = 0,
    max_users           = 3,
    max_orders_monthly  = 100,
    max_products        = 50,
    is_active           = true,
    updated_at          = NOW()
WHERE code = 'trial';

UPDATE platform.plans SET
    price_monthly       = 2900,
    max_users           = 10,
    max_orders_monthly  = 500,
    max_products        = 200,
    is_active           = true,
    updated_at          = NOW()
WHERE code = 'basic';

UPDATE platform.plans SET
    price_monthly       = 6900,
    max_users           = 30,
    max_orders_monthly  = 5000,
    max_products        = 1000,
    is_active           = true,
    updated_at          = NOW()
WHERE code = 'professional';

UPDATE platform.plans SET
    price_monthly       = NULL,
    max_users           = NULL,
    max_orders_monthly  = NULL,
    max_products        = NULL,
    is_active           = true,
    updated_at          = NOW()
WHERE code = 'enterprise';

-- ─── 2. حذف البيانات التجريبية القديمة (clean slate) ─────────────────────────
DELETE FROM platform.tenant_usage_snapshots
WHERE tenant_id IN (
    SELECT id FROM platform.tenants WHERE contact_email LIKE '%@demo.allal.dz'
);

DELETE FROM platform.tenant_provisioning_events
WHERE tenant_id IN (
    SELECT id FROM platform.tenants WHERE contact_email LIKE '%@demo.allal.dz'
);

DELETE FROM platform.subscriptions
WHERE tenant_id IN (
    SELECT id FROM platform.tenants WHERE contact_email LIKE '%@demo.allal.dz'
);

DELETE FROM platform.tenants WHERE contact_email LIKE '%@demo.allal.dz';

-- ─── 3. إدراج المشتركين التجريبيين ───────────────────────────────────────────
-- (6 شركات جزائرية بحالات مختلفة)

INSERT INTO platform.tenants
    (schema_name, company_name, contact_email, contact_phone, wilaya_code,
     status, plan_id, trial_ends_at, created_at, activated_at, last_activity_at)
VALUES
    -- 1 ── نشط | احترافي | الجزائر
    ('tenant_nour_commerce_a1b2',
     'شركة نور للتجارة',
     'contact@nour.demo.allal.dz',
     '0550 12 34 56', '16', 'active',
     (SELECT id FROM platform.plans WHERE code = 'professional'),
     NULL,
     NOW() - INTERVAL '5 months',
     NOW() - INTERVAL '5 months',
     NOW() - INTERVAL '2 hours'),

    -- 2 ── نشط | أساسي | وهران
    ('tenant_amal_elec_c3d4',
     'مؤسسة الأمل للإلكترونيات',
     'info@amal-elec.demo.allal.dz',
     '0661 23 45 67', '31', 'active',
     (SELECT id FROM platform.plans WHERE code = 'basic'),
     NULL,
     NOW() - INTERVAL '4 months',
     NOW() - INTERVAL '4 months',
     NOW() - INTERVAL '1 day'),

    -- 3 ── تجريبي | تجريبي | قسنطينة
    ('tenant_chorouk_e5f6',
     'مجموعة الشروق التجارية',
     'admin@chorouk.demo.allal.dz',
     '0771 23 45 67', '25', 'trial',
     (SELECT id FROM platform.plans WHERE code = 'trial'),
     CURRENT_DATE + INTERVAL '5 days',
     NOW() - INTERVAL '9 days',
     NULL,
     NOW() - INTERVAL '3 hours'),

    -- 4 ── نشط | احترافي | بجاية
    ('tenant_djazair_food_g7h8',
     'شركة الجزائر للمواد الغذائية',
     'contact@djazair-food.demo.allal.dz',
     '0551 23 45 67', '06', 'active',
     (SELECT id FROM platform.plans WHERE code = 'professional'),
     NULL,
     NOW() - INTERVAL '3 months',
     NOW() - INTERVAL '3 months',
     NOW() - INTERVAL '30 minutes'),

    -- 5 ── موقوف | أساسي | البليدة
    ('tenant_fajr_equip_i9j0',
     'مؤسسة الفجر للتجهيز',
     'direction@fajr-equip.demo.allal.dz',
     '0660 98 76 54', '09', 'suspended',
     (SELECT id FROM platform.plans WHERE code = 'basic'),
     NULL,
     NOW() - INTERVAL '6 months',
     NOW() - INTERVAL '6 months',
     NOW() - INTERVAL '20 days'),

    -- 6 ── نشط | مؤسسي | سطيف
    ('tenant_atlas_industry_k1l2',
     'تجمع الأطلس للصناعة',
     'ceo@atlas-industry.demo.allal.dz',
     '0559 87 65 43', '19', 'active',
     (SELECT id FROM platform.plans WHERE code = 'enterprise'),
     NULL,
     NOW() - INTERVAL '8 months',
     NOW() - INTERVAL '8 months',
     NOW() - INTERVAL '10 minutes');

-- تفاصيل الإيقاف للمشترك الموقوف
UPDATE platform.tenants SET
    suspended_at     = NOW() - INTERVAL '20 days',
    suspended_reason = 'فاتورة الاشتراك غير مسددة منذ أكثر من 30 يوم'
WHERE contact_email = 'direction@fajr-equip.demo.allal.dz';

-- ─── 4. الاشتراكات الحالية ────────────────────────────────────────────────────

-- 1: نور للتجارة — احترافي — نشط
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, renews_at, created_at)
SELECT t.id, t.plan_id, 'active', p.price_monthly,
       (NOW() - INTERVAL '5 months')::date,
       (NOW() + INTERVAL '25 days')::date,
       NOW() - INTERVAL '5 months'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email = 'contact@nour.demo.allal.dz';

-- 2: الأمل للإلكترونيات — أساسي — نشط
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, renews_at, created_at)
SELECT t.id, t.plan_id, 'active', p.price_monthly,
       (NOW() - INTERVAL '4 months')::date,
       (NOW() + INTERVAL '20 days')::date,
       NOW() - INTERVAL '4 months'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email = 'info@amal-elec.demo.allal.dz';

-- 3: الشروق — تجريبي — trial
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, renews_at, created_at)
SELECT t.id, t.plan_id, 'trial', 0,
       (NOW() - INTERVAL '9 days')::date,
       (CURRENT_DATE + INTERVAL '5 days'),
       NOW() - INTERVAL '9 days'
FROM platform.tenants t
WHERE t.contact_email = 'admin@chorouk.demo.allal.dz';

-- 4: الجزائر للمواد الغذائية — احترافي — نشط
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, renews_at, created_at)
SELECT t.id, t.plan_id, 'active', p.price_monthly,
       (NOW() - INTERVAL '3 months')::date,
       (NOW() + INTERVAL '15 days')::date,
       NOW() - INTERVAL '3 months'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email = 'contact@djazair-food.demo.allal.dz';

-- 5: الفجر للتجهيز — موقوف
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, ended_at, created_at)
SELECT t.id, t.plan_id, 'suspended', p.price_monthly,
       (NOW() - INTERVAL '6 months')::date,
       (NOW() - INTERVAL '20 days')::date,
       NOW() - INTERVAL '6 months'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email = 'direction@fajr-equip.demo.allal.dz';

-- 6: الأطلس للصناعة — مؤسسي — سعر مخصص 15000
INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, renews_at, created_at)
SELECT t.id, t.plan_id, 'active', 15000,
       (NOW() - INTERVAL '8 months')::date,
       (NOW() + INTERVAL '22 days')::date,
       NOW() - INTERVAL '8 months'
FROM platform.tenants t
WHERE t.contact_email = 'ceo@atlas-industry.demo.allal.dz';

-- ─── 5. اشتراكات تاريخية لتعبئة مخطط الإيرادات (آخر 6 أشهر) ──────────────────

INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, ended_at, created_at)
SELECT t.id, t.plan_id, 'active', p.price_monthly,
       (NOW() - INTERVAL '2 months 28 days')::date,
       (NOW() - INTERVAL '1 month 28 days')::date,
       NOW() - INTERVAL '2 months 28 days'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email = 'contact@nour.demo.allal.dz';

INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, ended_at, created_at)
SELECT t.id, t.plan_id, 'active', p.price_monthly,
       (NOW() - INTERVAL '1 month 28 days')::date,
       (NOW() - INTERVAL '28 days')::date,
       NOW() - INTERVAL '1 month 28 days'
FROM platform.tenants t
JOIN platform.plans p ON p.id = t.plan_id
WHERE t.contact_email IN (
    'contact@nour.demo.allal.dz',
    'contact@djazair-food.demo.allal.dz'
);

INSERT INTO platform.subscriptions
    (tenant_id, plan_id, status, price_monthly, started_at, ended_at, created_at)
SELECT t.id, t.plan_id, 'active', 15000,
       (NOW() - INTERVAL '3 months 28 days')::date,
       (NOW() - INTERVAL '2 months 28 days')::date,
       NOW() - INTERVAL '3 months 28 days'
FROM platform.tenants t
WHERE t.contact_email = 'ceo@atlas-industry.demo.allal.dz';

-- ─── 6. لقطات الاستخدام (اليوم) ──────────────────────────────────────────────

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 18, 342, 127, 1847, 234.5
FROM platform.tenants t
WHERE t.contact_email = 'contact@nour.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=18, products_count=342, orders_this_month=127, total_orders=1847, storage_used_mb=234.5;

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 7, 89, 43, 312, 45.2
FROM platform.tenants t
WHERE t.contact_email = 'info@amal-elec.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=7, products_count=89, orders_this_month=43, total_orders=312, storage_used_mb=45.2;

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 2, 15, 23, 23, 8.1
FROM platform.tenants t
WHERE t.contact_email = 'admin@chorouk.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=2, products_count=15, orders_this_month=23, total_orders=23, storage_used_mb=8.1;

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 22, 567, 189, 2341, 412.8
FROM platform.tenants t
WHERE t.contact_email = 'contact@djazair-food.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=22, products_count=567, orders_this_month=189, total_orders=2341, storage_used_mb=412.8;

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 5, 78, 0, 234, 23.4
FROM platform.tenants t
WHERE t.contact_email = 'direction@fajr-equip.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=5, products_count=78, orders_this_month=0, total_orders=234, storage_used_mb=23.4;

INSERT INTO platform.tenant_usage_snapshots
    (tenant_id, snapshot_date, users_count, products_count, orders_this_month, total_orders, storage_used_mb)
SELECT t.id, CURRENT_DATE, 47, 1234, 312, 5678, 1024.0
FROM platform.tenants t
WHERE t.contact_email = 'ceo@atlas-industry.demo.allal.dz'
ON CONFLICT (tenant_id, snapshot_date) DO UPDATE SET
    users_count=47, products_count=1234, orders_this_month=312, total_orders=5678, storage_used_mb=1024.0;

-- ─── 7. أحداث تهيئة المشتركين ────────────────────────────────────────────────

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"professional","users_created":1,"schema":"tenant_nour_commerce_a1b2"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'contact@nour.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"basic","users_created":1,"schema":"tenant_amal_elec_c3d4"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'info@amal-elec.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"trial","users_created":1,"schema":"tenant_chorouk_e5f6"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'admin@chorouk.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"professional","users_created":1,"schema":"tenant_djazair_food_g7h8"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'contact@djazair-food.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"basic","users_created":1,"schema":"tenant_fajr_equip_i9j0"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'direction@fajr-equip.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'provision', 'completed',
       '{"plan":"enterprise","users_created":1,"schema":"tenant_atlas_industry_k1l2"}'::jsonb,
       t.created_at
FROM platform.tenants t WHERE t.contact_email = 'ceo@atlas-industry.demo.allal.dz';

-- أحداث تغيير الحالة
INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'tenant_suspended', 'completed',
       '{"reason":"فاتورة الاشتراك غير مسددة منذ أكثر من 30 يوم"}'::jsonb,
       NOW() - INTERVAL '20 days'
FROM platform.tenants t WHERE t.contact_email = 'direction@fajr-equip.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'plan_upgraded', 'completed',
       '{"from":"basic","to":"professional","note":"طلب ترقية بعد انتهاء التجربة"}'::jsonb,
       NOW() - INTERVAL '4 months 15 days'
FROM platform.tenants t WHERE t.contact_email = 'contact@nour.demo.allal.dz';

INSERT INTO platform.tenant_provisioning_events
    (tenant_id, event_type, status, details_json, created_at)
SELECT t.id, 'plan_upgraded', 'completed',
       '{"from":"professional","to":"enterprise","note":"توسع في الطاقة الإنتاجية"}'::jsonb,
       NOW() - INTERVAL '6 months'
FROM platform.tenants t WHERE t.contact_email = 'ceo@atlas-industry.demo.allal.dz';

COMMIT;

-- ─── ملخص نهائي ───────────────────────────────────────────────────────────────
SELECT
    'تم بنجاح' AS النتيجة,
    (SELECT count(*) FROM platform.tenants)                AS المشتركون,
    (SELECT count(*) FROM platform.subscriptions)           AS الاشتراكات,
    (SELECT count(*) FROM platform.tenant_usage_snapshots)  AS لقطات_الاستخدام,
    (SELECT count(*) FROM platform.tenant_provisioning_events) AS الأحداث,
    (SELECT coalesce(sum(price_monthly),0)
     FROM platform.subscriptions WHERE status='active')     AS MRR_دج;
