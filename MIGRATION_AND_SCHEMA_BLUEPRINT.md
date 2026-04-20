# ALLAL-ARTICLE — Migration and Schema Blueprint

هذا الملف هو المرجع التقني لمرحلة قاعدة البيانات والـ migrations.  
مهمته أن يترجم المتطلبات الواردة في [README.md](/Users/mw/Downloads/allal-article/README.md:1) إلى تصميم بيانات واضح ومتوافق مع الواجهات الجاهزة الموجودة في `frontend-allal-article`.

## الهدف من هذه الوثيقة

- توحيد أسماء الجداول والحقول قبل كتابة أول migration.
- توضيح ترتيب الميغريشن الصحيح.
- منع التعارض بين منطق الطلبيات ومنطق المخزون.
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

## قواعد Flyway الإلزامية

- كل تغيير في schema يكون داخل ملف جديد:
  `src/main/resources/db/migration/V{number}__description.sql`
- لا يتم تعديل migration قديم بعد تطبيقه على أي بيئة مشتركة.
- أسماء migrations تكون واضحة مثل:
  `V1__create_users_and_roles.sql`
  `V2__create_customers.sql`
  `V3__create_products.sql`
- migrations الكبيرة في الإنتاج تحتاج backup قبل التطبيق.
- seed الأساسي للأدوار والصلاحيات والولايات يمكن أن يكون عبر migrations منفصلة أو data seed منظم.

## تحسينات موصى بها قبل كتابة الميغريشن

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
- تغيير `line_status` إلى `deleted_by_admin` أو `cancelled`
- حفظ سبب التغيير والكمية الأصلية

السبب:
- هذا شرط أساسي في الخطة
- وهو جوهر السلوك الشبيه بـ Odoo

## توافق الجداول مع الواجهات الحالية

| الواجهة الحالية | البيانات المطلوبة | الجداول الدنيا المطلوبة |
|---|---|---|
| Dashboard | KPIs، آخر الطلبيات، مؤشرات مخزون، نشاط حديث | `orders`, `order_items`, `product_stocks`, `audit_logs`, `users` |
| Tables | قائمة طلبيات + قائمة أصناف/عملاء | `orders`, `customers`, `products`, `categories`, `product_price_histories` |
| Billing | فواتير، وسائل دفع، حركات، كشف عميل | `orders`, `customers`, `payments` أو `transactions`, `order_items` |
| Virtual Reality | إنشاء طلبية سريعة وسلة وبحث | `products`, `categories`, `orders(draft)` أو `carts`, `customers` |
| Profile | بيانات المستخدم وصلاحياته ونشاطه | `users`, `roles`, `permissions`, `audit_logs` |
| Auth | تسجيل الدخول وإنشاء الحساب أو الدعوات | `users`, `user_profiles`, `roles` |
| RTL | نفس البيانات بالعربية | نفس الجداول أعلاه بدون جداول إضافية |

## ترتيب الميغريشن المقترح

| الترتيب | مجموعة الجداول | السبب |
|---|---|---|
| 1 | users, user_profiles | أساس النظام |
| 2 | roles, permissions, role_permissions, user_permissions | الصلاحيات مبكرًا |
| 3 | customers, categories | master data مبكرًا |
| 4 | products, product_images, product_price_histories | الأصناف قبل المخزون والطلبات |
| 5 | warehouses | حتى لو كان هناك مخزن واحد حاليًا |
| 6 | product_stocks, stock_movements, stock_reservations | تثبيت منطق المخزون |
| 7 | orders | الكيان الرئيسي للطلبات |
| 8 | order_items | يعتمد على orders و products |
| 9 | order_events, order_item_events | التتبع والتايملاين |
| 10 | carts, cart_items أو اعتماد draft orders فقط | حسب القرار النهائي |
| 11 | notifications | التنبيهات والـ realtime |
| 12 | audit_logs | تتبع العمليات الحرجة |
| 13 | settings | إعدادات المالك والـ AI |
| 14 | ai_jobs, ai_job_items | المعالجة الذكية |
| 15 | media_assets / imports (اختياري لكن مستحسن) | دعم الملفات والرفع |

## الحالات الرسمية المقترحة

### order_status

- `draft`
- `submitted`
- `under_review`
- `confirmed`
- `partially_fulfilled`
- `fulfilled`
- `cancelled`
- `rejected`

### order_item_status

- `pending`
- `approved`
- `modified`
- `partially_allocated`
- `allocated`
- `fulfilled`
- `cancelled`
- `deleted_by_admin`

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

- `order_created`
- `order_updated`
- `order_confirmed`
- `order_rejected`
- `order_line_cancelled`
- `stock_warning`
- `ai_job_completed`
- `customer_created`

## الجداول الأساسية

## 1) users

الغرض:
- المستخدمون الأساسيون للنظام: owner, admin, sales, viewer

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
- `created_at`
- `updated_at`

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
- تبويب `سجل الأسعار` داخل صفحة الصنف
- dashboard widgets

## 10) product_images

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

## 11) warehouses

الغرض:
- طبقة توسع مستقبلية

الحقول:
- `id`
- `code`
- `name`
- `is_default`
- `created_at`
- `updated_at`

ملاحظة:
- حتى لو كان هناك مخزن واحد الآن، وجود هذا الجدول من البداية يوفر إعادة هيكلة مؤلمة لاحقًا.

## 12) product_stocks

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

## 13) stock_movements

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
- index على `movement_type`

## 14) stock_reservations

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

## 15) orders

الغرض:
- رأس الطلبية

الحقول المقترحة:
- `id`
- `public_id`
- `order_number`
- `customer_id`
- `sales_user_id`
- `order_status`
- `review_started_at`
- `confirmed_at`
- `fulfilled_at`
- `cancelled_at`
- `rejected_at`
- `shipping_status` (`not_required`, `pending`, `partial`, `completed`)
- `notes`
- `internal_notes`
- `created_by`
- `updated_by`
- `confirmed_by`
- `reviewed_by`
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

## 16) order_items

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
- `allocated_qty`
- `shipped_qty`
- `cancelled_qty`
- `original_requested_qty`
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

## 17) order_events

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

## 18) order_item_events

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

## 19) carts

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

## 20) cart_items

الحقول المقترحة:
- `id`
- `cart_id`
- `product_id`
- `qty`
- `is_shipping_required`
- `note`
- `created_at`
- `updated_at`

## 21) notifications

الحقول المقترحة:
- `id`
- `user_id`
- `type`
- `title`
- `body`
- `entity_type`
- `entity_id`
- `is_read`
- `read_at`
- `payload_json`
- `created_at`

فهارس:
- index على `user_id, is_read`
- index على `type`

## 22) audit_logs

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

## 23) settings

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

## 24) ai_jobs

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

## 25) ai_job_items

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

## قواعد منطقية يجب أن تنعكس في الميغريشن والخدمات

- الطلبية المؤكدة فقط هي التي تحجز المخزون رسميًا.
- الطلبية `submitted` قد تؤثر على `pending_qty` لكنها لا تخصم من `reserved_qty`.
- `available_qty = on_hand_qty - reserved_qty`
- `projected_qty = on_hand_qty - reserved_qty - pending_qty`
- السطر الملغى أو المحذوف إداريًا يبقى موجودًا.
- أي تعديل سعر يجب أن يحدّث `products.current_price_amount` ويكتب سطرًا في `product_price_histories`.
- أي تغيير مهم على الطلب أو السطر يجب أن يكتب event + audit log.
- تحديث المخزون لا يتم من الواجهة مباشرة؛ يتم عبر service domain واحدة.

## اقتراح مهم لتسهيل Claude Code

إذا كان المطلوب الآن فقط تثبيت النواة بسرعة وبجودة:

### Minimum Viable Schema Phase 1

- `users`
- `user_profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_permissions`
- `customers`
- `categories`
- `products`
- `product_images`
- `product_price_histories`
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

- `notifications`
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
