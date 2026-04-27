# ALLAL-ARTICLE — Migration and Schema Blueprint

هذا الملف هو المرجع التقني لمرحلة قاعدة البيانات والـ migrations.
مهمته أن يترجم المتطلبات الواردة في [README.md](/Users/mw/Downloads/allal-article/README.md:1) إلى تصميم بيانات واضح ومتوافق مع الواجهات الجاهزة الموجودة في `frontend-allal-article`.

## الهدف من هذه الوثيقة

- توحيد أسماء الجداول والحقول قبل كتابة أول migration.
- توضيح ترتيب الميغريشن الصحيح.
- منع التعارض بين منطق الطلبيات ومنطق المخزون.
- تثبيت فصل بيانات المشتركين قبل بناء أول جدول تشغيلي.
- جعل Claude Code قادرًا على التنفيذ بدون تخمينات كثيرة.
- ضمان أن الباك إند الناتج يمكن وصله بالواجهات الحالية بدل إعادة بنائها من الصفر.

## افتراضات تقنية معتمدة

- الباك إند المستقبلي: `Spring Boot 3.x`.
- لغة الباك إند: `Java 21`.
- قاعدة البيانات الرسمية: `PostgreSQL`.
- أداة الميغريشن الرسمية: `Flyway`.
- لا يستخدم المشروع `spring.jpa.hibernate.ddl-auto=update` لإدارة قاعدة البيانات.
- في الإنتاج يجب ضبط Hibernate على `validate` أو تعطيل توليد schema التلقائي.
- مرجع قرار الباك إند: [BACKEND_SPRING_BOOT_ARCHITECTURE.md](/Users/mw/Downloads/allal-article/BACKEND_SPRING_BOOT_ARCHITECTURE.md:1).
- المفاتيح الرئيسية: `bigint` أو `uuid`; إن لم تكن هناك حاجة صريحة لـ UUID فـ `bigint` أبسط في أول مرحلة.
- المعرّف التجاري الخارجي: يفضل `public_id` أو `order_number` مستقل عن `id`.
- جميع الكميات: `decimal(14,3)`.
- جميع مبالغ المال: `decimal(14,2)`.
- جميع الجداول المهمة: `created_at`, `updated_at`.
- الجداول التشغيلية الحساسة: `created_by`, `updated_by` حيث يفيد ذلك.
- الحذف: `soft deletes` للجداول التي قد تحتاج أرشفة أو أثر تاريخي.
- المنصة تعمل بنمط `schema per tenant`.
- يوجد schema ثابت باسم `platform` لإدارة المشتركين والخطط والاشتراكات.
- كل مشترك يحصل على schema منفصل مثل `tenant_a1b2c3d4`.
- الجداول التشغيلية لا تنشأ في `public`.
- تحديد المشترك يتم من JWT/subdomain/header موثوق، وليس من body request.

## قواعد Flyway الإلزامية

- كل تغيير في schema يكون داخل ملف migration جديد.
- يفضّل فصل migrations إلى مسارين واضحين:
  - `src/main/resources/db/migration/platform/V{number}__description.sql`
  - `src/main/resources/db/migration/tenant/V{number}__description.sql`
- `platform` migrations تطبق مرة واحدة على schema المنصة.
- `tenant` migrations تطبق على كل schema مشترك عند الإنشاء، ثم على كل schemas المشتركين عند ترقية النظام.
- لا يتم تعديل migration قديم بعد تطبيقه على أي بيئة مشتركة.
- أسماء migrations تكون واضحة مثل:
  `V1__create_platform_tenants_and_plans.sql`
  `V2__create_platform_subscriptions.sql`
  `V1__create_tenant_identity_and_rbac.sql`
  `V2__create_tenant_customers.sql`
- migrations الكبيرة في الإنتاج تحتاج backup قبل التطبيق.
- seed الأساسي للأدوار والصلاحيات والولايات يمكن أن يكون عبر migrations منفصلة أو data seed منظم.

## تحسينات موصى بها قبل كتابة الميغريشن

### 0) ثبّت الـ multi-tenancy قبل أي جدول تشغيلي

الأفضل:
- إنشاء `platform.tenants` و `platform.plans` أولًا.
- بناء خدمة provisioning تنشئ schema المشترك وتطبق tenant migrations.
- منع أي endpoint تشغيلي من العمل بدون `TenantContext`.
- عدم استخدام `public` لتخزين بيانات الطلبيات أو الزبائن أو الأصناف.

السبب:
- يمنع خلط بيانات الشركات.
- يجعل النسخ الاحتياطي والاسترجاع لكل مشترك أسهل.
- يطابق واجهة المالك الحالية التي تعرض `schemaName` لكل مشترك.
- يسمح بشبكة شركاء آمنة مبنية على صلاحيات صريحة.

### 1) لا تستخدم SQL ENUM جامد إذا كان من المتوقع التوسع

الأفضل:
- تخزين الحالة كـ `varchar`
- تعريف enum في طبقة التطبيق
- وضع validation قوية على transitions

السبب:
- أسهل في التطوير المستقبلي
- أقل كلفة عند إضافة حالات جديدة
- ألطف مع أدوات migration المختلفة

### 2) لا تجعل `product_stocks` المصدر الوحيد للحقيقة

الأفضل:
- `stock_movements` كسجل أساسي
- `stock_reservations` للحجز
- `product_stocks` أو `product_stock_summaries` كجدول aggregate سريع للقراءة

السبب:
- الواجهة تحتاج أرقام سريعة
- النظام يحتاج traceability
- الجمع بين الاثنين يحقق الدقة والسرعة

### 3) فكر جديًا قبل إنشاء `carts` ككيان مستقل

الخيار الموصى به في Phase 1:
- استخدام `orders` بحالة `draft` بدل `carts`

الخيار البديل:
- `carts` و `cart_items` إذا كان هناك requirement صريح لـ multi-device cart resume أو session-isolated carts

السبب:
- تقليل التكرار
- تسهيل التحول من السلة إلى الطلبية
- توحيد الـ aggregate

### 4) لا تحذف `order_items` إداريًا

الأفضل:
- الإبقاء على السطر
- تغيير `line_status` إلى `cancelled`
- ضبط `cancelled_qty = requested_qty` و`approved_qty = 0`
- حفظ سبب التغيير والكمية الأصلية

السبب:
- هذا شرط أساسي في الخطة
- وهو جوهر السلوك الشبيه بـ Odoo

## توافق الجداول مع الواجهات الحالية

| الواجهة الحالية | البيانات المطلوبة | الجداول الدنيا المطلوبة |
|---|---|---|
| Dashboard | KPIs، آخر الطلبيات، مؤشرات مخزون، نشاط حديث | `orders`, `order_items`, `product_stocks`, `audit_logs`, `users` |
| Tables | قائمة طلبيات + قائمة أصناف/عملاء | `orders`, `customers`, `products`, `categories`, `product_favorites`, `product_price_histories`, `price_lists`, `price_list_items` |
| Billing | فواتير، وسائل دفع، حركات، كشف عميل | `orders`, `customers`, `payments` أو `transactions`, `order_items` |
| Virtual Reality | إنشاء طلبية سريعة وسلة وبحث | `products`, `categories`, `orders(draft)` أو `carts`, `customers` |
| Profile | بيانات المستخدم وصلاحياته ونشاطه | `users`, `roles`, `permissions`, `audit_logs` |
| Auth | تسجيل الدخول وإنشاء الحساب أو الدعوات | `users`, `user_profiles`, `roles` |
| RTL | نفس البيانات بالعربية | نفس الجداول أعلاه بدون جداول إضافية |

## ترتيب الميغريشن المقترح

### A) Platform migrations

تطبق مرة واحدة على schema `platform`.

| الترتيب | مجموعة الجداول | السبب |
|---|---|---|
| P1 | platform_users | مستخدمو مالك المنصة |
| P2 | plans, feature_catalog, plan_features | كتالوج الميزات والخطط والحدود قبل إنشاء المشتركين |
| P3 | tenants | مصدر الحقيقة لكل مشترك واسم schema |
| P4 | subscriptions | تاريخ الاشتراك والتجديد والإيقاف |
| P5 | tenant_provisioning_events | تتبع إنشاء schema وتطبيق migrations |
| P6 | tenant_usage_snapshots | KPIs لوحة المالك بدون استعلام مباشر دائم على كل schema |
| P7 | tenant_invite_codes, tenant_partnerships, partner_document_links, partner_document_claims, partner_document_events | شبكة الشركاء والصلاحيات ومزامنة فواتير البيع/الشراء والمرتجعات/المطالبات بين المشتركين |
| P8 | support_tickets, support_ticket_participants, support_messages, support_attachments | تذاكر دعم وشات بين المالك والمشتركين مع صور وتسجيلات صوتية |
| P9 | notification_types, platform_notifications, platform_notification_recipients, platform_notification_templates, platform_notification_actions, platform_notification_escalations, platform_notification_preferences, platform_notification_retention_policies, platform_notification_outbox | إشعارات المالك وبين المشتركين |
| P10 | platform_resource_lock_policies, platform_resource_locks, platform_resource_lock_events | منع تعديل موارد المنصة من أكثر من مستخدم في نفس اللحظة |
| P11 | platform_audit_logs | تدقيق عمليات المنصة |

ملاحظة كتالوج الميزات:

- `feature_catalog` هو مرجع الواجهة لمعرفة الميزات الظاهرة للجميع ورسائل الترقية.
- `plan_features` يحدد هل الميزة مفعلة في خطة معينة وحدودها.
- منع استخدام ميزة بسبب الخطة لا يعني إخفاءها من القائمة؛ يعني عرض Modal ترقية عند محاولة الاستخدام.

ملاحظة حالات الدعم:

- `waiting_owner` و `waiting_tenant` حالات آلية من آخر مرسل في `support_messages`.
- المستخدم لا يختار هذه الحالات من الواجهة.
- الأفعال اليدوية الوحيدة على الحالة هي: فتح، إغلاق، إعادة فتح.

### B) Tenant schema migrations

تطبق داخل كل schema مشترك مثل `tenant_a1b2c3d4`.

| الترتيب | مجموعة الجداول | السبب |
|---|---|---|
| T1 | roles, permissions, role_permissions, users, user_profiles, user_permissions, access_denial_events | هوية وصلاحيات المشترك مع سجل محاولات الوصول الممنوعة |
| T2 | wilayas, settings | بيانات مرجعية وإعدادات الشركة |
| T3 | customers, customer_payments | الزبائن والرصيد قبل الطلبيات |
| T4 | categories, products, product_favorites, product_images, product_price_histories, price_lists, price_list_items | الأصناف وقوائم الأسعار قبل المخزون والطلبات |
| T5 | warehouses | حتى لو كان هناك مخزن واحد حاليًا |
| T6 | product_stocks, stock_movements, stock_transfers, stock_transfer_items, stock_reservations | تثبيت منطق المخزون والتحويل بين المستودعات |
| T7 | orders | الكيان الرئيسي للطلبات |
| T8 | order_items | يعتمد على orders و products |
| T9 | order_events, order_item_events | التتبع والتايملاين |
| T10 | returns, return_items | المرتجعات بعد الطلبات |
| T11 | manufacturing_requests, manufacturing_request_materials, manufacturing_quality_checks, manufacturing_events, manufacturing_receipts | إدارة التصنيع بعد المنتجات والمخزون والطلبيات لأنها قد ترتبط ببيع أو بسد نقص مخزون |
| T12 | suppliers, purchase_orders, purchase_order_items, purchase_returns, purchase_return_items | الموردين والمشتريات ومرتجعات الشراء وربط المورد بالشريك |
| T13 | road_invoices, road_invoice_items, road_invoice_orders | فواتير الطريق |
| T14 | accounting core: fiscal_years, accounting_periods, account_classes, account_templates, account_template_items, chart_template_deployments, accounts, subledger_entities | نواة المحاسبة وشجرة الحسابات وتتبع الزرع |
| T15 | accounting operations: journal_books (+ year_format, is_system), number_sequences, journals, journal_items, dimension_types, dimensions, journal_item_dimensions | دفاتر اليومية والقيود والأبعاد |
| T16 | accounting automation: tax_codes (+ is_price_inclusive), tax_rates, tax_code_accounts, accounting_settings, accounting_rules, accounting_rule_items, opening_balances, subledger_opening_balances, account_balances (PK→id + partial unique index), reconciliation_matches (+ subledger_entity_id + bank_account_id + fiscal_year_id), reconciliation_items, bank_accounts (+ currency + last_reconciled_at + public_id), cash_boxes (+ currency + public_id), payment_methods, category_account_mappings, product_account_mappings, inventory_valuation_layers, year_close_runs | الربط التلقائي والضرائب والمطابقة والصندوق والبنك |
| T17 | notification_types, notifications, notification_recipients, notification_templates, notification_actions, notification_escalations, notification_preferences, notification_rules, notification_retention_policies, notification_outbox | إشعارات المشترك |
| T18 | resource_lock_policies, resource_locks, resource_lock_events | قفل التحرير ومنع التعديل المتزامن |
| T19 | media_assets, ai_jobs, ai_job_items | وظائف مساندة |
| T20 | audit_logs | تدقيق عمليات المشترك |

ملاحظة ربط الموردين:

- Migration جدول `suppliers` يسبق `purchase_orders` حتى تعتمد أوامر الشراء على `supplier_id` مع إبقاء `supplier_name` كلقطة تاريخية.
- جداول `purchase_returns` و`purchase_return_items` تأتي بعد أوامر الشراء وأسطرها، وتعتمد على `stock_movements` لتسجيل خروج مخزون المرتجع. الربط المحاسبي يحفظ `journal_public_id` منطقياً ثم يثبت FK لاحقاً بعد إنشاء نواة المحاسبة.
- عند قبول ربط مشترك آخر، خدمة الشراكات تفحص `suppliers` داخل schema المشترك بالقيم الثابتة: `tax_number`, `commercial_register`, `email`, `phone`.
- إذا كان التطابق فريداً، تحفظ المنصة حالة `supplier_match_status = suggested` وتعرض الواجهة سؤال التأكيد. عند الموافقة تحدث بطاقة المورد إلى `confirmed` وتحفظ `linked_partner_uuid`.
- إذا كان التطابق مكرراً، تحفظ الحالة `ambiguous` وتمنع الربط التلقائي إلى أن يختار المستخدم بطاقة مورد محددة.

ملاحظة مزامنة مستندات الشركاء:

- جدول `platform.partner_document_links` هو سجل الربط الوحيد بين مستندين في schema مختلفين.
- عند إنشاء أمر شراء لمورد مربوط، ينشأ رابط باتجاه `purchase_to_sale` ويولد عند الطرف الآخر أمر بيع وارد من شريك.
- عند إنشاء أمر بيع لزبون مربوط، ينشأ رابط باتجاه `sale_to_purchase` ويولد عند الطرف الآخر أمر شراء وارد من شريك.
- جداول `orders` و`purchase_orders` داخل tenant تحتفظ فقط بـ `partner_document_link_public_id` و`partner_sync_status` ولقطة الربط، ولا تحتوي FK مباشر إلى schema مشترك آخر.
- يجب استخدام `idempotency_key` في منصة الربط حتى لا تتكرر الفاتورة المقابلة عند إعادة المحاولة.
- حركة المخزون تتم داخل tenant نفسه فقط: البائع يحجز عند القبول ويخرج الكمية عند الشحن، والمشتري يسجل الكمية كمنتظرة ثم يدخلها للمخزون عند تأكيد الاستلام.
- حالات مزامنة المستند يجب أن تغطي: `seller_reserved`, `shipped`, `in_transit`, `received` إضافة إلى القبول والرفض والإلغاء.
- الإلغاء بعد الشحن، والمرتجع، والنقص، والضياع، والتلف لا تعالج بتغيير status فقط؛ تنشأ لها `partner_document_claims` مع سطور كميات وحل واضح.
- المرتجع ينشئ حركة خروج عند المشتري وحركة دخول/حجر عند البائع عند وصوله، أما الضياع في الطريق فيبقى claim حتى يحسم بتعويض أو إشعار دائن أو إعادة شحن.

ملاحظة التصنيع:

- Migration التصنيع يأتي بعد `orders/order_items` لأن طلب التصنيع قد يشير إلى طلبية بيع، وبعد `product_stocks/stock_movements` لأنه يحجز المواد ويدخل المنتج النهائي.
- إنشاء طلب تصنيع لا ينشئ حركة مخزون للمنتج النهائي.
- الاعتماد يمكن أن ينشئ `stock_reservations` للمواد الخام، والبدء ينشئ `stock_movements` صرف مواد أو تحويل إلى WIP حسب إعداد المحاسبة.
- الاستلام فقط ينشئ `stock_movement` دخول للمنتج النهائي في `destination_warehouse_id`.
- إذا كان `source_type = sold_order` يحجز المنتج النهائي للطلبية المرتبطة بعد الاستلام، أما `stock_replenishment` فيدخل كمخزون عام.
- كل انتقال حالة يكتب في `manufacturing_events` ويطلق إشعارًا من فئة `manufacturing`.

## الحالات الرسمية المقترحة

### order_status

- `draft`
- `submitted`
- `under_review`
- `confirmed`
- `shipped`
- `completed`
- `cancelled`
- `rejected`

### order_item_status

- `pending`
- `approved`
- `modified`
- `shipped`
- `cancelled`

قواعد الحالات:
- `confirmed` آخر حالة يمكن فيها إلغاء الطلبية قبل خروجها من المخزن.
- بعد `shipped` يختفي الإلغاء والتعديل، ويظهر المرتجع واكتمال الطلبية.
- `completed` يمكن أن تتم يدوياً بزر "اكتمال طلبية" أو تلقائياً بعد 3 أيام من `shipped_at`.
- `deleted_by_admin` غير معتمدة؛ أي حذف إداري يتحول إلى `cancelled` فقط.

### manufacturing_request_status

- `draft`
- `approved`
- `queued`
- `in_production`
- `quality_check`
- `ready_to_ship`
- `in_transit`
- `received`
- `cancelled`

### manufacturing_source_type

- `sold_order`
- `stock_replenishment`
- `custom_order`
- `manual`

### stock_movement_type

- `opening_balance`
- `manual_adjustment`
- `purchase_in`
- `order_reserve`
- `order_release`
- `shipment_out`
- `return_in`
- `correction`

### ai_job_type

- `product_import`
- `product_image_processing`
- `pdf_parse`
- `excel_parse`

### ai_job_status

- `queued`
- `processing`
- `completed`
- `failed`
- `partially_completed`
- `cancelled`

### notification_type

هذه ليست SQL ENUM؛ تحفظ كـ seed في `notification_types.code` حتى يمكن إضافة أنواع جديدة بدون كسر migration قديم.

- `product.created`
- `product.updated`
- `product.price_changed`
- `inventory.low_stock`
- `inventory.out_of_stock`
- `order.submitted`
- `order.confirmed`
- `order.rejected`
- `order.line_cancelled`
- `return.created`
- `payment.received`
- `user.permission_changed`
- `user.disabled`
- `security.failed_login`
- `ai.job_completed`
- `accounting.auto_journal_failed`
- `accounting.period_closed`
- `partnership.requested`
- `partnership.approved`
- `partnership.rejected`
- `partnership.permissions_changed`
- `partnership.supplier_match_found`
- `partnership.supplier_auto_linked`
- `partner_document.purchase_to_sale_created`
- `partner_document.sale_to_purchase_created`
- `partner_document.status_changed`
- `partner_document.shipped`
- `partner_document.received`
- `partner_document.cancel_requested`
- `partner_document.return_requested`
- `partner_document.loss_reported`
- `partner_document.shortage_reported`
- `partner_document.damage_reported`
- `partner_document.claim_resolved`
- `manufacturing.request_created`
- `manufacturing.approved`
- `manufacturing.queued`
- `manufacturing.started`
- `manufacturing.quality_check_required`
- `manufacturing.quality_failed`
- `manufacturing.ready_to_ship`
- `manufacturing.shipped`
- `manufacturing.received`
- `manufacturing.delayed`
- `manufacturing.deposit_pending`
- `support.ticket_opened`
- `support.message_sent`
- `support.ticket_status_changed`
- `support.ticket_closed`
- `subscription.expiring_soon`
- `subscription.expired`
- `tenant.provisioning_failed`

## الجداول الأساسية

> ملاحظة مهمة: الجداول التالية تمثل template داخل schema كل مشترك. جداول المنصة نفسها موثقة في [DATABASE_SCHEMA.md](/Users/mw/Downloads/allal-article/DATABASE_SCHEMA.md:1) تحت قسم `platform`. لا تنشأ جداول تشغيل المشتركين في `public`.

## 1) users

الغرض:
- المستخدمون داخل شركة مشتركة واحدة: owner/admin/sales/viewer/driver.
- مالك المنصة يستخدم `platform.platform_users` وليس هذا الجدول.

الحقول المقترحة:
- `id`
- `public_id`
- `name`
- `email`
- `phone`
- `password_hash`
- `status` (`active`, `inactive`, `suspended`)
- `primary_role_code`
- `last_login_at`
- `avatar_url`
- `locale`
- `timezone`
- `created_at`
- `updated_at`
- `deleted_at`

فهارس مهمة:
- unique على `email`
- index على `phone`
- index على `status`

ملاحظات:
- لا تربط الصلاحيات فقط بـ `primary_role_code`; استخدم جداول RBAC فعلية.
- `primary_role_code` مفيد فقط لتسهيل العرض في الواجهة.

## 2) user_profiles

الغرض:
- فصل معلومات البروفايل غير الأمنية عن حساب الدخول

الحقول المقترحة:
- `id`
- `user_id`
- `job_title`
- `bio`
- `address`
- `city`
- `country`
- `preferences_json`
- `created_at`
- `updated_at`

فائدة للواجهة:
- يربط مباشرة مع صفحة `/profile`

## 3) roles

الحقول المقترحة:
- `id`
- `code`
- `name`
- `description`
- `is_system`
- `created_at`
- `updated_at`

قيم seed أولية:
- `owner`
- `admin`
- `sales`
- `viewer`

## 4) permissions

الحقول المقترحة:
- `id`
- `code`
- `name`
- `module`
- `description`
- `required_plan_feature_code`
- `ui_route`
- `ui_action_key`
- `is_visible_to_all`
- `denied_title`
- `denied_message`
- `denied_action_type` (`contact_admin`, `request_permission`, `upgrade_plan`, `contact_partner`)
- `ui_metadata_json`
- `created_at`
- `updated_at`

قاعدة واجهة مهمة:
- الصلاحية لا تتحكم في ظهور الزر أو الصفحة فقط، بل في تنفيذ الفعل.
- كل الصلاحيات والميزات الأساسية تبقى ظاهرة للمستخدم، وعند الفعل يرجع النظام سبب المنع ورسالة مناسبة.

أمثلة `code`:
- `view_products`
- `create_product`
- `edit_product`
- `view_orders`
- `create_order`
- `confirm_order`
- `reject_order`
- `view_all_orders`
- `view_own_orders`
- `manage_customers`
- `manage_users`
- `manage_ai_settings`
- `view_audit_logs`

## 5) role_permissions

الحقول:
- `role_id`
- `permission_id`

قيد:
- unique composite على `role_id + permission_id`

## 6) user_permissions

الغرض:
- direct overrides على المستخدم فوق دوره

الحقول:
- `user_id`
- `permission_id`
- `effect` (`allow`, `deny`)

ملاحظة:
- هذا الجدول اختياري لكنه مفيد جدًا للأنظمة الإدارية المرنة.

## 6.1) access_denial_events

الغرض:
- تسجيل محاولات استخدام ميزة ظاهرة لكن ممنوعة بسبب الخطة أو صلاحية المستخدم أو صلاحية الشريك.

الحقول:
- `id`
- `public_id`
- `user_id`
- `permission_code`
- `feature_code`
- `partner_uuid`
- `route`
- `action_key`
- `denial_reason` (`plan_required`, `user_permission_required`, `partner_permission_required`, `scope_denied`, `tenant_suspended`)
- `message_shown`
- `metadata_json`
- `created_at`

## 7) customers

الغرض:
- الزبائن الذين ترتبط بهم الطلبيات

الحقول المقترحة:
- `id`
- `public_id`
- `name`
- `phone`
- `email`
- `address_line_1`
- `address_line_2`
- `city`
- `notes`
- `default_sales_user_id`
- `status` (`active`, `archived`)
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

فهارس:
- index على `phone`
- index على `name`
- index على `default_sales_user_id`

التوافق مع الواجهة:
- يستخدم في order checkout
- يستخدم في صفحة إدارة الزبائن
- يستخدم في تقارير الطلبيات حسب العميل

## 8) categories

الحقول المقترحة:
- `id`
- `public_id`
- `parent_id`
- `name`
- `slug`
- `description`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

فهارس:
- index على `parent_id`
- unique على `slug`

ملاحظات:
- دعم hierarchy مطلوب لتصفية البائع السريعة.

## 9) products

الغرض:
- الكيان الرئيسي للأصناف

الحقول المقترحة:
- `id`
- `public_id`
- `sku`
- `name`
- `category_id`
- `description`
- `unit_name`
- `barcode`
- `current_price_amount`
- `price_currency`
- `is_favorite_for_current_user` في read model/API فقط، ويُحسب من `product_favorites` ولا يخزن داخل `products`
- `last_price_updated_at`
- `last_price_updated_by`
- `status` (`active`, `inactive`, `archived`)
- `default_image_id` (nullable)
- `ai_generated_metadata_json`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

فهارس:
- unique على `sku` إن كان business rule ثابتًا
- index على `name`
- index على `category_id`
- full-text search إن كان مدعومًا

التوافق مع الواجهة:
- صفحة إضافة الطلبية
- صفحة الصنف
- كرت الصنف مع إظهار آخر تعديل سعر
- كرت الصنف وواجهة الطلبية السريعة يستطيعان عرض النجمة وفلتر `المفضلة`
- تبويب `سجل الأسعار` داخل صفحة الصنف
- قوائم الأسعار تستخدم `current_price_amount` كسعر fallback عندما لا يوجد سعر للصنف داخل القائمة أو كان سعر القائمة `0`
- dashboard widgets

## 10) product_favorites

الغرض:
- حفظ الأصناف المفضلة لكل مستخدم داخل schema المشترك لتسريع البيع والبحث اليومي

الحقول المقترحة:
- `id`
- `public_id`
- `user_id`
- `product_id`
- `source_context` (`manual`, `order_entry`, `product_page`)
- `note`
- `sort_order`
- `created_at`
- `updated_at`

فهارس:
- unique على `user_id, product_id`
- index على `user_id, sort_order, created_at`
- index على `product_id`

ملاحظات:
- لا تضف عمود `is_favorite` داخل `products` لأن المفضلة شخصية لكل مستخدم.
- endpoint قائمة الأصناف يرجع `isFavorite` للمستخدم الحالي من join أو projection.
- حذف صنف أو أرشفته لا يحذف سجل المفضلة قسريًا إلا إذا كان هناك soft-delete policy واضحة؛ الواجهة تخفي المفضلة غير النشطة افتراضيًا.

## 11) product_images

الحقول المقترحة:
- `id`
- `product_id`
- `file_path`
- `public_url`
- `source_type` (`manual`, `ai_processed`, `imported`)
- `original_image_id` (nullable)
- `sort_order`
- `is_primary`
- `processing_status`
- `metadata_json`
- `created_at`
- `updated_at`

ملاحظات:
- دعم الصورة الأصلية والمعالجة مهم جدًا لوحدة الـ AI.

### product_price_histories

الغرض:
- تتبع كل تعديل سعر على مستوى الصنف بحيث يعرف البائع والإدارة متى تغير السعر ومن قام بذلك

الحقول المقترحة:
- `id`
- `public_id`
- `product_id`
- `previous_price_amount`
- `new_price_amount`
- `price_currency`
- `changed_by`
- `change_reason`
- `source_type`
- `source_id`
- `effective_at`
- `created_at`

فهارس:
- index على `product_id, effective_at`
- index على `changed_by`
- index على `source_type, source_id`

ملاحظات:
- عند كل تعديل سعر، يتم تحديث snapshot داخل `products` ثم إضافة row جديد هنا.
- هذا الجدول هو مصدر tab `سجل الأسعار` في صفحة الصنف.
- يمكن لاحقًا استخدامه في تقارير التسعير أو تنبيهات تغيّر السعر.

### price_lists

الغرض:
- إنشاء قوائم أسعار متعددة باسم واضح مثل "أسعار أحمد"، "أسعار الجملة"، "أسعار نصف جملة"
- السماح باختيار قائمة أسعار عند إنشاء طلبية بيع أو أمر شراء

الحقول المقترحة:
- `id`
- `public_id`
- `code`
- `name`
- `price_list_type` (`sales`, `purchase`, `both`)
- `currency`
- `description`
- `is_default`
- `is_active`
- `starts_at`
- `ends_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`
- `deleted_at`

فهارس:
- unique على `code`
- index على `price_list_type, is_active, name`

### price_list_items

الغرض:
- تسعير أصناف محددة داخل قائمة أسعار محددة بدون إلزام القائمة بتسعير كل الأصناف

الحقول المقترحة:
- `id`
- `public_id`
- `price_list_id`
- `product_id`
- `unit_price_amount`
- `min_qty`
- `is_active`
- `note`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

قواعد:
- unique على `price_list_id + product_id + min_qty`.
- إذا لم يوجد سطر للصنف داخل القائمة، أو كان `unit_price_amount` فارغاً أو `0`، يستخدم النظام `products.current_price_amount`.
- `0` لا يستخدم كبيع مجاني؛ الهدايا أو الخصومات الكاملة تنفذ كخصم مستقل حتى لا يختلط fallback مع العروض.
- الطلبية أو أمر الشراء يخزن snapshot للسعر واسم القائمة على السطر حتى لا تتغير الفواتير القديمة عند تعديل القائمة لاحقاً.

## 12) warehouses

الغرض:
- طبقة توسع مستقبلية

الحقول:
- `id`
- `code`
- `name`
- `warehouse_type`
- `city`
- `address`
- `manager_id`
- `capacity_qty`
- `is_default`
- `is_active`
- `created_at`
- `updated_at`

ملاحظة:
- كل رصيد يجب أن يرتبط بمستودع. حتى لو كان هناك مخزن واحد الآن، وجود هذا الجدول من البداية يوفر إعادة هيكلة مؤلمة لاحقًا.
- الأنواع المقترحة: `central`, `operational`, `returns`, `quarantine`, `virtual`.

## 13) product_stocks

الغرض:
- read model سريع للمخزون لكل منتج ولكل مخزن

الحقول المقترحة:
- `id`
- `product_id`
- `warehouse_id`
- `on_hand_qty`
- `reserved_qty`
- `pending_qty`
- `available_qty`
- `projected_qty`
- `last_recomputed_at`
- `created_at`
- `updated_at`

فهارس:
- unique على `product_id + warehouse_id`
- index على `available_qty`
- index على `projected_qty`

ملاحظة مهمة:
- `available_qty` و `projected_qty` يفضل تحديثهما عبر service موحدة وليس كتابة عشوائية من عدة أماكن.
- المفتاح الفعلي للرصيد هو `product_id + warehouse_id`.
- لا يسمح بتحويل كمية أكبر من `available_qty`.

## 14) stock_movements

الغرض:
- المصدر التاريخي لحركة المخزون

الحقول المقترحة:
- `id`
- `public_id`
- `product_id`
- `warehouse_id`
- `movement_type`
- `qty`
- `balance_before`
- `balance_after`
- `source_type`
- `source_id`
- `notes`
- `performed_by`
- `created_at`

فهارس:
- index على `product_id, warehouse_id`
- index على `source_type, source_id`

## 14.1) stock_transfers

الغرض:
- رأس عملية تحويل مخزون بين مستودعين، سواء صنف محدد أو تحويل كل المتاح من مستودع كامل.

الحقول المقترحة:
- `id`
- `public_id`
- `transfer_number`
- `transfer_type` (`product`, `warehouse_full`)
- `from_warehouse_id`
- `to_warehouse_id`
- `status` (`draft`, `posted`, `cancelled`)
- `reason`
- `created_by`
- `posted_by`
- `posted_at`
- `created_at`
- `updated_at`

قواعد:
- `from_warehouse_id <> to_warehouse_id`.
- عند الترحيل، لا يعدل الرصيد مباشرة من الواجهة؛ service واحدة تنشئ حركات خروج/دخول وتعيد حساب `product_stocks`.
- تحويل مستودع كامل ينقل فقط الكميات المتاحة، ويترك المحجوز في المصدر.

## 14.2) stock_transfer_items

الغرض:
- سطور التحويل لكل صنف.

الحقول المقترحة:
- `id`
- `stock_transfer_id`
- `product_id`
- `qty`
- `out_movement_id`
- `in_movement_id`
- `notes`
- `created_at`

قواعد:
- `qty > 0`.
- كل سطر ينتج حركتين: خروج من المصدر ودخول للوجهة.
- index على `movement_type`

## 15) stock_reservations

الغرض:
- تتبع الحجز الناتج عن الطلبيات المؤكدة أو المخصصة جزئيًا

الحقول المقترحة:
- `id`
- `product_id`
- `warehouse_id`
- `order_id`
- `order_item_id`
- `reserved_qty`
- `status` (`active`, `released`, `fulfilled`, `cancelled`)
- `created_at`
- `updated_at`

ملاحظة:
- هذا الجدول يجعل `reserved_qty` قابلة للتفسير وليس مجرد aggregate غامض.

## 16) orders

الغرض:
- رأس الطلبية

الحقول المقترحة:
- `id`
- `public_id`
- `order_number`
- `customer_id`
- `sales_user_id`
- `price_list_id`
- `price_list_name_snapshot`
- `price_currency`
- `total_amount`
- `order_status`
- `review_started_at`
- `confirmed_at`
- `shipped_at`
- `completion_due_at`
- `completed_at`
- `auto_completed_at`
- `cancelled_at`
- `rejected_at`
- `shipping_status` (`none`, `pending`, `shipped`)
- `notes`
- `internal_notes`
- `created_by`
- `updated_by`
- `confirmed_by`
- `reviewed_by`
- `shipped_by`
- `completed_by`
- `cancelled_by`
- `rejected_by`
- `created_at`
- `updated_at`
- `deleted_at`

فهارس:
- unique على `order_number`
- index على `customer_id`
- index على `sales_user_id`
- index على `order_status`
- index على `shipping_status`
- index على `created_at`

تحسين مهم:
- استخدم `order_number` كسلسلة business-facing.
- لا تعتمد على `id` في العرض للمستخدم.
- اختيار قائمة الأسعار في رأس الطلبية يحدد أسعار السطور، لكن كل سطر يحفظ snapshot مستقل للسعر حتى تبقى الطلبية التاريخية ثابتة.
- ملخص الطلبية يعرض إجمالي المبلغ من `sum(order_items.line_subtotal)` للأسطر غير الملغاة.

## 17) order_items

الغرض:
- سطور الطلبية

الحقول المقترحة:
- `id`
- `public_id`
- `order_id`
- `product_id`
- `line_number`
- `line_status`
- `requested_qty`
- `approved_qty`
- `shipped_qty`
- `returned_qty`
- `cancelled_qty`
- `original_requested_qty`
- `price_list_id`
- `price_list_item_id`
- `price_list_name_snapshot`
- `pricing_source` (`price_list`, `product_default`, `manual_override`)
- `base_unit_price`
- `unit_price`
- `line_subtotal`
- `is_shipping_required`
- `customer_note`
- `internal_note`
- `changed_by_admin`
- `change_reason`
- `created_at`
- `updated_at`
- `deleted_at` (اختياري، لكن يفضل الاعتماد على status بدل الحذف)

فهارس:
- index على `order_id`
- index على `product_id`
- index على `line_status`
- unique على `order_id + line_number`

ملاحظة أساسية:
- `original_requested_qty` مهم لإظهار الفرق بعد تعديل الإدارة.
- السطر لا يحذف نهائيًا؛ يتغير `line_status`.
- لا توجد حالة `deleted_by_admin`؛ الحذف الإداري يعني `line_status = cancelled`.
- يجب أن يحافظ الباك إند على `approved_qty + cancelled_qty = requested_qty`.
- الشحن الحالي كامل: `shipped_qty = approved_qty` لكل سطر غير ملغى.
- المرتجع يحدث `returned_qty` ولا يخفض `shipped_qty`.
- عمود السعر في جدول سطور البيع يعرض `unit_price`، ومصدر السعر يوضح هل جاء من القائمة أو من السعر الرئيسي.

## 18) order_events

الغرض:
- timeline على مستوى الطلبية

الحقول المقترحة:
- `id`
- `order_id`
- `event_type`
- `payload_json`
- `performed_by`
- `created_at`

أمثلة:
- `submitted`
- `review_started`
- `confirmed`
- `rejected`
- `shipping_status_changed`
- `note_added`

## 19) order_item_events

الغرض:
- timeline على مستوى السطر

الحقول المقترحة:
- `id`
- `order_item_id`
- `event_type`
- `old_qty`
- `new_qty`
- `old_status`
- `new_status`
- `reason`
- `performed_by`
- `created_at`

الفائدة:
- ضروري جدًا لفلسفة “لا نخفي السطر المحذوف”.

## 20) carts

هذا الجدول اختياري إذا لم يتم اعتماد `orders(draft)` بدلًا منه.

الحقول المقترحة:
- `id`
- `public_id`
- `user_id`
- `customer_id` (nullable)
- `status` (`active`, `converted`, `abandoned`)
- `notes`
- `created_at`
- `updated_at`

## 21) cart_items

الحقول المقترحة:
- `id`
- `cart_id`
- `product_id`
- `qty`
- `is_shipping_required`
- `note`
- `created_at`
- `updated_at`

## 22) notifications

هذا القسم خاص بجداول الإشعارات داخل schema المشترك. إشعارات مالك المنصة والإشعارات العابرة بين المشتركين وتذاكر الدعم لها جداول `platform.notification_types` و `platform.platform_notifications` و `platform.platform_notification_recipients`.

الجداول المقترحة داخل كل tenant schema:

### notification_types

- `id`
- `code` مثل `product.price_changed`
- `category` (`orders`, `products`, `inventory`, `users`, `accounting`, `partnerships`, `partner_documents`, `support`)
- `severity` (`info`, `success`, `warning`, `critical`, `action_required`)
- `default_channels` jsonb
- `title_template`
- `body_template`
- `short_template`
- `reason_template`
- `target_audience`
- `target_role_code`
- `target_permission_code`
- `action_type`
- `default_actions_json`
- `privacy_policy`
- `can_user_mute`
- `retention_policy_code`
- `escalation_policy_json`
- `is_actionable`
- `is_digestible`
- `dedupe_window_minutes`
- `is_active`
- `created_at`

### notifications

- `id`
- `public_id`
- `notification_type_id`
- `platform_notification_id` nullable، للإشعار القادم من علاقة بين مشتركين
- `category`
- `severity`
- `title`
- `body`
- `entity_type`
- `entity_id`
- `source_type`
- `source_id`
- `actor_user_id`
- `source_event_code`
- `source_event_id`
- `action_url`
- `summary_text`
- `reason_text`
- `payload_json`
- `dedupe_key`
- `group_key`
- `correlation_id`
- `status`
- `created_at`
- `retention_until`
- `expires_at`

### notification_recipients

- `id`
- `notification_id`
- `recipient_user_id`
- `delivery_status`
- `state`
- `recipient_reason`
- `is_read`
- `read_at`
- `is_archived`
- `archived_at`
- `snoozed_until`
- `actioned_at`
- `last_seen_at`
- `escalation_level`
- `escalated_at`
- `created_at`

### notification_preferences

- `id`
- `user_id`
- `notification_type_id`
- `channel`
- `is_enabled`
- `minimum_severity`
- `digest_mode`
- `quiet_hours_json`
- `created_at`
- `updated_at`

### notification_rules

- `id`
- `code`
- `notification_type_id`
- `trigger_event`
- `condition_json`
- `target_json`
- `action_policy_json`
- `escalation_policy_json`
- `is_active`
- `created_at`
- `updated_at`

### notification_templates

- `id`
- `notification_type_id`
- `locale`
- `channel`
- `title_template`
- `short_template`
- `body_template`
- `reason_template`
- `created_at`
- `updated_at`

### notification_actions

- `id`
- `notification_id`
- `recipient_id`
- `action_code`
- `action_label`
- `action_url`
- `status`
- `performed_at`
- `performed_by_user_id`
- `result_json`
- `created_at`

### notification_escalations

- `id`
- `notification_id`
- `recipient_id`
- `from_user_id`
- `to_user_id`
- `to_role_code`
- `level`
- `reason`
- `status`
- `scheduled_at`
- `sent_at`
- `created_at`

### notification_retention_policies

- `id`
- `code`
- `category`
- `severity`
- `keep_days`
- `archive_after_days`
- `delete_outbox_after_days`
- `is_legal_hold`
- `created_at`
- `updated_at`

### notification_outbox

- `id`
- `notification_id`
- `recipient_id`
- `channel`
- `status`
- `attempt_count`
- `next_attempt_at`
- `last_error`
- `created_at`
- `delivered_at`

فهارس:
- index على `notifications.created_at`
- index على `notifications.category`
- index على `notifications.dedupe_key`
- index على `notifications.group_key`
- index على `notification_recipients(recipient_user_id, is_read)`
- index على `notification_recipients(state, snoozed_until)`
- index على `notification_outbox(status, next_attempt_at)`

## 23) resource_locks

هذا القسم خاص بقفل التحرير داخل schema المشترك. جداول المنصة المقابلة هي `platform.platform_resource_locks`.

### resource_lock_policies

- `id`
- `resource_type`
- `lock_scope`
- `ttl_seconds`
- `heartbeat_interval_seconds`
- `stale_after_seconds`
- `allow_force_takeover`
- `force_takeover_permission`
- `show_locker_identity`
- `blocked_actions_json`
- `is_active`
- `created_at`
- `updated_at`

### resource_locks

- `id`
- `public_id`
- `resource_type`
- `resource_id`
- `resource_public_id`
- `resource_key`
- `lock_scope`
- `status`
- `locked_by_user_id`
- `locked_by_session_id`
- `lock_token`
- `device_label`
- `acquired_at`
- `heartbeat_at`
- `expires_at`
- `released_at`
- `release_reason`
- `taken_over_by_user_id`
- `taken_over_at`
- `metadata_json`

### resource_lock_events

- `id`
- `lock_id`
- `event_type`
- `actor_user_id`
- `details_json`
- `created_at`

فهارس:
- index على `resource_locks(resource_type, resource_id, lock_scope, status)`
- index على `resource_locks(resource_type, resource_key, lock_scope, status)`
- index على `resource_locks(status, expires_at)`
- index على `resource_lock_events(lock_id, created_at)`

السياسات الأولية التي يجب زرعها:

- `sales_order/edit`
- `sales_order/approve`
- `purchase_order/edit`
- `purchase_order/receive`
- `purchase_order/invoice`
- `inventory_adjustment/post`
- `stock_count/edit`
- `product/edit`
- `product/price_update`
- `journal/edit`
- `journal/post`
- `fiscal_period/close`
- `accounting_settings/edit`
- `user_permissions/edit`
- `supplier/edit`
- `supplier/link_partner`
- `partnership/approve`
- `partnership/permissions_update`
- `partner_document/sync`
- `partner_document/confirm`

## 24) audit_logs

الحقول المقترحة:
- `id`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `action`
- `old_values_json`
- `new_values_json`
- `meta_json`
- `ip_address`
- `user_agent`
- `created_at`

فهارس:
- index على `entity_type, entity_id`
- index على `actor_user_id`
- index على `action`
- index على `created_at`

## 25) settings

الغرض:
- إعدادات النظام العامة وإعدادات الـ AI

الحقول المقترحة:
- `id`
- `key`
- `group_name`
- `value_json`
- `is_encrypted`
- `updated_by`
- `created_at`
- `updated_at`

أمثلة `key`:
- `ai.default_provider`
- `ai.default_model`
- `ai.image_processing_prompt`
- `system.default_locale`
- `system.company_name`

## 26) ai_jobs

الحقول المقترحة:
- `id`
- `public_id`
- `job_type`
- `job_status`
- `provider`
- `model`
- `initiated_by`
- `source_file_path`
- `options_json`
- `summary_json`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

## 27) ai_job_items

الحقول المقترحة:
- `id`
- `ai_job_id`
- `source_reference`
- `item_status`
- `raw_input_json`
- `parsed_output_json`
- `review_decision` (`pending`, `accepted`, `rejected`, `edited`)
- `error_message`
- `created_at`
- `updated_at`

الفائدة:
- يسمح بمراجعة كل عنصر داخل الدفعة قبل الحفظ.

## جداول إضافية موصى بها إذا أردت نظامًا أقوى من البداية

### payments أو transactions

إذا كانت صفحة `billing` ستتحول فعليًا إلى كشف حساب وفواتير ومدفوعات، أضف:
- `payments`
- أو `financial_transactions`

الحد الأدنى المقترح:
- `id`
- `customer_id`
- `order_id` (nullable)
- `transaction_type` (`invoice`, `payment`, `adjustment`, `refund`)
- `amount`
- `currency`
- `reference_number`
- `transaction_date`
- `notes`
- `created_by`

### media_assets

إذا كان رفع الملفات سيستخدم بشكل كبير:
- اجعل هناك جدولًا عامًا لكل الملفات بدل حصرها في `product_images`

### import_batches

إذا كانت واردات Excel / PDF ستصبح وحدة تشغيلية كبيرة:
- فصل batch metadata عن `ai_jobs` قد يكون مفيدًا

## بيانات seed الدنيا المطلوبة

### أدوار النظام

- owner
- admin
- sales
- viewer

### صلاحيات دنيا

- products.view
- products.create
- products.update
- stock.view
- stock.adjust
- orders.view
- orders.create
- orders.update
- orders.confirm
- orders.reject
- orders.view_all
- orders.view_own
- customers.manage
- users.manage
- logs.view
- reports.view
- settings.manage
- ai.manage

### إعدادات أولية

- default locale = `ar`
- default timezone = `Africa/Algiers`
- default AI provider = `openai`
- order number prefix = `ORD`

### Seed محاسبي إلزامي لكل مشترك

- `account_classes` وفق القالب المختار، ويفضل قالب `dz_scf_trading`.
- `account_templates` و `account_template_items` لشجرة الحسابات الافتراضية.
- قالب `dz_scf_trading` يجب أن يعتمد نظام كود رقمي واضح:
  - `code_scheme = 4_digit_grouped`
  - `code_length = 4`
  - `code_pattern = ^[0-9]{4}$`
  - أمثلة الجذور: `1000` أصول، `2000` خصوم، `3000` حقوق ملكية، `4000` إيرادات، `5000` مصروفات/أعباء.
  - أمثلة الفروع: `1010` أصول ثابتة، `1011` مباني، `1100` مخزون، `1201` ذمم العملاء، `1301` صندوق.
- عند زرع الشجرة في `accounts` يجب حفظ أصل الحساب:
  - `template_item_id`
  - `template_version`
  - `is_template_locked`
  - `is_custom = false`
- كل `account_template_items` و`accounts` يجب أن تحتوي حقول التقارير:
  - `financial_statement`
  - `report_section`
  - `statement_line_code`
  - `statement_sort_order`
  - `cash_flow_section`
- `journal_books`: مبيعات، مشتريات، صندوق، بنك، مخزون، يدوي، افتتاح، إقفال.
- `number_sequences` لكل دفتر حسب السنة.
- `dimension_types`: مركز تكلفة، ولاية، بائع، مخزن، مسار شحن.
- `tax_codes` و `tax_rates` الأساسية إذا كانت الضرائب مفعلة.
- `payment_methods`: نقدي، تحويل بنكي، شيك.
- `cash_boxes` للصندوق الافتراضي.
- `bank_accounts` للحساب البنكي الافتراضي إذا أدخله المستخدم.
- `accounting_settings` لكل المفاتيح الإجبارية:
  - `sales_revenue`
  - `sales_returns`
  - `purchase_returns`
  - `discount_given`
  - `cogs`
  - `inventory`
  - `inventory_adjustment_gain`
  - `inventory_adjustment_loss`
  - `customers_control`
  - `suppliers_control`
  - `cash`
  - `bank`
  - `cheques_receivable`
  - `cheques_payable`
  - `tax_collected`
  - `tax_deductible`
  - `tax_payable`
  - `shipping_income`
  - `shipping_expense`
  - `retained_earnings`
  - `current_year_profit`
- `accounting_rules` الأساسية:
  - `sale_confirmed`
  - `sale_cogs_posted`
  - `sale_return`
  - `customer_payment`
  - `purchase_received`
  - `purchase_return`
  - `supplier_payment`
  - `stock_adjustment`
  - `opening_balance_posted`

## قواعد منطقية يجب أن تنعكس في الميغريشن والخدمات

- أي endpoint تشغيلي يجب أن يعمل داخل `TenantContext` مضبوط.
- لا تقبل `schema_name` أو `tenant_id` من body request في عمليات المشترك.
- إنشاء مشترك جديد يجب أن ينشئ سجل `platform.tenants` ثم schema منفصل ثم يطبق tenant migrations.
- لوحة المالك تقرأ من `platform` و snapshots، ولا تخلط مستخدم platform مع مستخدم tenant.
- الطلبية المؤكدة فقط هي التي تحجز المخزون رسميًا.
- الطلبية `submitted` قد تؤثر على `pending_qty` لكنها لا تخصم من `reserved_qty`.
- `available_qty = on_hand_qty - reserved_qty`
- `projected_qty = on_hand_qty - reserved_qty - pending_qty`
- السطر الملغى أو المحذوف إداريًا يبقى موجودًا.
- أي تعديل سعر يجب أن يحدّث `products.current_price_amount` ويكتب سطرًا في `product_price_histories`.
- قوائم الأسعار لا تعدل السعر الرئيسي للصنف؛ هي طبقة تسعير اختيارية، وإذا غاب سعر الصنف داخل القائمة أو كان `0` يعود النظام إلى `products.current_price_amount`.
- طلبات البيع وأوامر الشراء تحفظ `price_list_id` واسم القائمة كسجل تاريخي، وكل سطر يحفظ `unit_price`, `pricing_source`, `line_subtotal`.
- إجمالي البيع أو الشراء لا يعتمد على إعادة احتساب حي من قائمة الأسعار، بل على snapshots السطور حتى لا تتأثر المستندات القديمة بتعديل القائمة.
- مرتجع المشتريات لا يعدل أمر الشراء بصمت؛ ينشئ `purchase_returns` و`purchase_return_items` ويحدث `purchase_order_items.returned_qty` عبر خدمة واحدة.
- أثر مرتجع المشتريات يجب أن يشمل خروج المخزون، تخفيض ذمة المورد أو إشعار دائن، وعكس TVA القابل للخصم داخل نفس transaction.
- أي تغيير مهم على الطلب أو السطر يجب أن يكتب event + audit log.
- تحديث المخزون لا يتم من الواجهة مباشرة؛ يتم عبر service domain واحدة.

## اقتراح مهم لتسهيل Claude Code

إذا كان المطلوب الآن فقط تثبيت النواة بسرعة وبجودة:

### Minimum Viable Schema Phase 1

#### Platform

- `platform_users`
- `plans`
- `plan_features`
- `tenants`
- `subscriptions`
- `tenant_provisioning_events`
- `tenant_usage_snapshots`
- `platform_audit_logs`

#### Tenant template

- `roles`
- `permissions`
- `role_permissions`
- `users`
- `user_profiles`
- `user_permissions`
- `customers`
- `categories`
- `products`
- `product_favorites`
- `product_images`
- `product_price_histories`
- `price_lists`
- `price_list_items`
- `warehouses`
- `product_stocks`
- `stock_movements`
- `stock_reservations`
- `orders`
- `order_items`
- `order_events`
- `order_item_events`
- `audit_logs`
- `settings`

### Phase 2

- `notification_types`
- `notifications`
- `notification_recipients`
- `notification_templates`
- `notification_actions`
- `notification_escalations`
- `notification_preferences`
- `notification_rules`
- `notification_retention_policies`
- `notification_outbox`
- `resource_lock_policies`
- `resource_locks`
- `resource_lock_events`
- `ai_jobs`
- `ai_job_items`
- `payments` / `transactions`
- `carts` / `cart_items` إذا لم يتم اعتماد draft orders

هذا التقسيم أفضل لأنه:
- يثبت المنطق الحرج أولًا
- يمنع تضخم المرحلة الأولى
- يبقي الواجهات قابلة للربط تدريجيًا

## الخلاصة التنفيذية

إذا احتاج Claude Code قرارًا سريعًا أثناء البناء:

1. اعتمد `orders` و `order_items` كنواة النظام.
2. اجعل حالات الطلب والسطور واضحة من اليوم الأول.
3. اجعل المخزون مبنيًا على `movements + reservations + summary`.
4. لا تجعل الواجهات تتحكم بالمنطق؛ هي فقط تستهلك read models وعقود API واضحة.
5. حافظ على التوافق مع الواجهات الجاهزة عبر تزويد:
   - dashboard aggregates
   - order list resources
   - order detail aggregate
   - product detail summary
   - customer quick-create flow
