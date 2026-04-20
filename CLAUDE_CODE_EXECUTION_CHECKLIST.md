# ALLAL-ARTICLE — Claude Code Execution Checklist

هذا الملف يحول [README.md](/Users/mw/Downloads/allal-article/README.md:1) من وصف وظيفي إلى خطة تنفيذ تقنية قابلة للتتبع.  
الهدف منه أن يعمل كمرجع عملي لـ Claude Code أو أي وكيل تنفيذ تقني أثناء بناء الباك إند وربطه مع الواجهات الجاهزة الموجودة في `frontend-allal-article`.

## قواعد العمل الإلزامية

- لا يتم تحويل أي بند من `[ ]` إلى `[x]` إلا بعد اكتمال: الكود + الميغريشن + الربط + التوثيق المختصر + التحقق الأساسي.
- الباك إند المعتمد مستقبلًا هو Spring Boot 3.x + Java 21 + PostgreSQL + Flyway كما هو موثق في [BACKEND_SPRING_BOOT_ARCHITECTURE.md](/Users/mw/Downloads/allal-article/BACKEND_SPRING_BOOT_ARCHITECTURE.md:1).
- لا يتم استعمال `spring.jpa.hibernate.ddl-auto=update` كآلية migrations. كل تعديل قاعدة بيانات يجب أن يكون Flyway migration.
- لا يبدأ العمل على `Realtime` أو `AI` قبل تثبيت النواة: الحالات + المخزون + الطلبيات + السطور + الصلاحيات.
- أي قرار بنيوي يخالف [README.md](/Users/mw/Downloads/allal-article/README.md:1) يجب توثيقه صراحة داخل commit أو داخل ملاحظة تحت نفس البند.
- لا يتم حذف `order_items` أو فقدان أثر تعديلها نهائيًا. التغيير يجب أن يبقى قابلًا للتتبع.
- الواجهات الحالية لا يعاد بناؤها من الصفر في أول مرحلة؛ بل يعاد توظيفها وربطها تدريجيًا مع الدومين الفعلي.
- العربية وواجهة `RTL` ليست مشروعًا منفصلًا؛ هي نفس النظام مع ترجمة وتهيئة عرض مختلفة.

## قرار الباك إند

| البند | القرار |
|---|---|
| Framework | Spring Boot 3.x |
| Language | Java 21 |
| Architecture | Modular Monolith |
| Database | PostgreSQL |
| Migrations | Flyway |
| Security | Spring Security |
| API Docs | OpenAPI / Swagger |
| Deployment مبدئي | Docker Compose |

مبدأ التنفيذ:
- لا تبدأ بـ microservices.
- لا تبني CRUD عشوائي قبل تثبيت الحالات والـ transactions.
- أي عملية مخزون أو مدفوعات أو تأكيد طلبية يجب أن تمر عبر Service داخل `@Transactional`.
- لا تعرض JPA Entities مباشرة للفرونت؛ استخدم DTOs و Resources.

## خريطة توافق الواجهات الحالية

| المسار الحالي | الاستخدام المستهدف | ما الذي يجب أن يخدمه الباك إند |
|---|---|---|
| `/dashboard` | لوحة الإدارة الرئيسية | KPIs، آخر الطلبيات، مؤشرات المخزون، التنبيهات، نشاط النظام |
| `/tables` | قوائم تشغيلية | قائمة الطلبيات + قائمة الأصناف أو الزبائن حسب التنفيذ |
| `/billing` | الفوترة والحسابات | فواتير، مدفوعات، كشف عميل، حركات مالية مرتبطة بالطلبات |
| `/virtual-reality` | واجهة البائع السريعة | إنشاء طلبية سريعة، سلة، بحث سريع، وصول ميداني |
| `/profile` | بروفايل المستخدم | بيانات الحساب، الدور، الصلاحيات، النشاط المختصر |
| `/authentication/sign-in` | تسجيل الدخول | Auth + Session / Token bootstrap |
| `/authentication/sign-up` | إنشاء مستخدم أو دعوة | يربط بسياسة الصلاحيات الفعلية وليس بإنشاء عشوائي |
| `/rtl` | واجهة عربية/RTL | نفس بيانات `/dashboard` مع نفس العقود API |

## Phase 0 — Freeze Domain and Contracts

- [ ] 0.0 إنشاء أو استلام مشروع Spring Boot الأساسي.
  المطلوب:
  - Java 21
  - Spring Boot 3.x
  - PostgreSQL Driver
  - Flyway
  - Spring Web
  - Spring Data JPA
  - Spring Security
  - Validation
  - Actuator
  - OpenAPI
  منجز عندما:
  - يعمل تطبيق الباك إند محليًا.
  - يتصل بـ PostgreSQL.
  - يطبق أول Flyway migration.
  - `ddl-auto=update` غير مستخدم.
  - بنية modular monolith واضحة.

- [ ] 0.1 مراجعة `README.md` واستخراج glossary نهائي للمصطلحات.
  المطلوب:
  - تثبيت معنى `Order`, `Order Item`, `Cart`, `Confirmed`, `Cancelled`, `Reserved`, `Projected`.
  - منع وجود أسماء متعددة لنفس المفهوم في الكود.
  - إضافة ملف constants / enums مركزي في الباك إند.
  منجز عندما:
  - توجد enums أو constants واضحة للحالات.
  - توجد ملاحظة توضح الفرق بين حالة الطلبية وحالة السطر.

- [ ] 0.2 تثبيت خريطة الوحدات Modules.
  المطلوب:
  - Auth
  - Users / Roles / Permissions
  - Customers
  - Categories / Products / Media
  - Inventory
  - Orders
  - Realtime
  - Audit Logs
  - Settings
  - AI Jobs
  منجز عندما:
  - توجد بنية مجلدات أو modules واضحة بدون خلط بين الدومين والـ UI helpers.

- [ ] 0.3 تثبيت عقود API الأساسية قبل التنفيذ.
  المطلوب:
  - شكل موحد للنجاح والفشل
  - pagination موحدة
  - filters موحدة
  - status codes منطقية
  - resource serialization ثابتة
  منجز عندما:
  - يستطيع أي endpoint جديد إعادة نفس envelope القياسي.

- [ ] 0.4 تثبيت معايير البيانات المشتركة.
  المطلوب:
  - timezone موحدة
  - quantity decimal precision موحدة
  - money precision موحدة
  - soft delete policy
  - created_by / updated_by strategy
  منجز عندما:
  - توجد سياسة ثابتة في الكود وفي وثيقة الميغريشن.

## Phase 1 — Identity, Ownership, and Access Control

- [ ] 1.1 إنشاء بنية المستخدمين والحسابات الرئيسية.
  المطلوب:
  - owner account مستقل منطقيًا
  - admin users
  - sales users
  - viewer users
  - profile data منفصلة أو منسقة بوضوح
  منجز عندما:
  - يمكن إنشاء مستخدم مع دور واضح.
  - يمكن التمييز برمجيًا بين owner والإدارة والبائع والمشاهد.

- [ ] 1.2 بناء RBAC دقيق وليس مجرد role واحد.
  المطلوب:
  - roles
  - permissions
  - role_permissions
  - user direct overrides إن لزم
  - middleware / guards للصلاحيات
  منجز عندما:
  - يمكن منح صلاحية `confirm_order` بدون منح `manage_users`.

- [ ] 1.3 ربط صفحات الدخول والبروفايل بالعقود الفعلية.
  المطلوب:
  - `sign-in`
  - `sign-up` أو invite flow
  - `profile`
  - إظهار role / permissions summary
  منجز عندما:
  - صفحات الواجهة الحالية لا تعتمد على mock data.

## Phase 2 — Master Data: Customers, Categories, Products

- [ ] 2.1 بناء CRUD الزبائن.
  المطلوب:
  - create / update / archive / search
  - quick-create من داخل الطلبية
  - customer details page
  - customer order history
  منجز عندما:
  - يمكن إنشاء زبون من شاشة الطلبية ويعود مباشرة في selector.

- [ ] 2.2 بناء categories بهيكل قابل للتوسع.
  المطلوب:
  - parent-child hierarchy
  - sort order
  - active flag
  - filtering support
  منجز عندما:
  - واجهة البائع تستطيع تصفية الأصناف حسب القسم بسرعة.

- [ ] 2.3 بناء products بشكل متوافق مع صفحة الصنف.
  المطلوب:
  - sku / code
  - name
  - description
  - category
  - unit
  - active flag
  - current price
  - last price updated timestamp
  - searchable fields
  منجز عندما:
  - صفحة الصنف يمكنها عرض بياناته الأساسية بدون حقول مؤقتة.
  - كرت الصنف يستطيع إظهار آخر تعديل سعر مباشرة للبائع.

- [ ] 2.4 بناء product media pipeline.
  المطلوب:
  - صور متعددة
  - ترتيب الصور
  - صورة رئيسية
  - مصدر الصورة
  - حالة المعالجة الذكية
  منجز عندما:
  - المنتج يستطيع عرض الصور الأصلية والمعالجة إن وجدت.

- [ ] 2.5 بناء tracking رسمي لأسعار الأصناف.
  المطلوب:
  - current price snapshot على مستوى `products`
  - `last_price_updated_at` و `last_price_updated_by`
  - price history log لا يفقد أي تعديل
  - product cards تعرض آخر تعديل سعر
  - product detail يحتوي tab مستقل باسم `سجل الأسعار`
  منجز عندما:
  - البائع يرى آخر تعديل سعر من قائمة الأصناف.
  - صفحة الصنف تعرض timeline واضح لتغيرات السعر بدون منطق mock مخفي.

## Phase 3 — Inventory Core

- [ ] 3.1 تثبيت النموذج الرسمي للمخزون.
  المطلوب:
  - on_hand
  - reserved
  - pending
  - available
  - projected
  - timestamp لآخر إعادة احتساب
  منجز عندما:
  - يوجد منطق واحد فقط لحساب هذه القيم.

- [ ] 3.2 بناء stock movements كسجل لا يقبل الغموض.
  المطلوب:
  - inbound
  - outbound
  - reserve
  - release
  - shipment
  - manual adjustment
  - source_type / source_id
  منجز عندما:
  - أي رقم مخزون يمكن إرجاعه إلى حركات واضحة.

- [ ] 3.3 بناء stock reservation logic المرتبط بالطلبات.
  المطلوب:
  - حجز عند التأكيد
  - فك الحجز عند الإلغاء
  - partial reserve عند التخصيص الجزئي
  - منع التضارب في التوازي
  منجز عندما:
  - تأكيد الطلبية يغيّر `reserved` بشكل متسق.

- [ ] 3.4 بناء صفحة الصنف كمركز تشخيص.
  المطلوب:
  - stock summary
  - recent movements
  - orders containing product
  - price history timeline
  - last updated
  - quick KPIs
  منجز عندما:
  - صفحة المنتج تغني الإدارة عن قراءة عدة جداول منفصلة.

## Phase 4 — Cart and Sales Capture Flow

- [ ] 4.1 تحديد استراتيجية السلة رسميًا.
  القرار المطلوب:
  - إما `carts/cart_items`
  - أو اعتماد `orders` بحالة `draft` كسلة رسمية
  منجز عندما:
  - يوجد قرار موثق.
  - لا يبقى المنطق موزعًا بين نموذجين متداخلين بلا حاجة.

- [ ] 4.2 بناء تدفق إضافة الصنف السريع.
  المطلوب:
  - product search
  - category filter
  - add/edit/remove item
  - quantity popup / drawer flow
  - optimistic UI updates
  منجز عندما:
  - واجهة البائع السريعة يمكنها العمل بدون form بطيء.

- [ ] 4.3 بناء quick customer attach داخل التدفق.
  المطلوب:
  - اختيار زبون
  - إضافة زبون جديد
  - ربط الطلبية بالزبون فورًا
  منجز عندما:
  - البائع لا يخرج من تدفق إنشاء الطلبية لإضافة زبون.

- [ ] 4.4 بناء submit flow من السلة إلى الطلبية.
  المطلوب:
  - draft save
  - submit
  - validation
  - snapshot أساسي للزبون والبائع
  منجز عندما:
  - الطلبية تنتقل من draft إلى submitted بعقد بيانات ثابت.

## Phase 5 — Orders and Odoo-like Review Flow

- [ ] 5.1 تثبيت order statuses و transition rules.
  المطلوب:
  - draft
  - submitted
  - under_review
  - confirmed
  - partially_fulfilled
  - fulfilled
  - cancelled
  - rejected
  منجز عندما:
  - لا يمكن تنفيذ transition غير منطقي برمجيًا.

- [ ] 5.2 تثبيت line statuses و line lifecycle.
  المطلوب:
  - pending
  - approved
  - modified
  - partially_allocated
  - allocated
  - fulfilled
  - cancelled
  - deleted_by_admin
  منجز عندما:
  - حذف السطر إداريًا لا يزيله من السجل.

- [ ] 5.3 بناء order detail aggregate بشكل Odoo-like.
  المطلوب:
  - header
  - line grid
  - item status badges
  - original qty / final qty / shipped qty / cancelled qty
  - internal notes
  منجز عندما:
  - الإدارة تستطيع فهم ما الذي طلب وما الذي تغير وما الذي شحن من شاشة واحدة.

- [ ] 5.4 بناء admin actions على الطلبية.
  المطلوب:
  - approve
  - reject
  - reduce qty
  - cancel line
  - partial ship
  - add internal note
  - re-open review if needed
  منجز عندما:
  - كل action يغيّر الطلبية + السطور + المخزون + audit logs.

- [ ] 5.5 بناء order list page للإدارة.
  المطلوب:
  - filters
  - search
  - status tabs
  - row actions
  - pagination
  - live updates
  منجز عندما:
  - صفحة `tables` أو الصفحة البديلة تعكس منطق البونات المذكور في `README`.

## Phase 6 — Realtime and Notifications

- [ ] 6.1 تحديد event vocabulary للنظام.
  المطلوب:
  - order.created
  - order.submitted
  - order.review_started
  - order.confirmed
  - order.rejected
  - order.line_updated
  - stock.changed
  - customer.created
  - ai_job.updated
  منجز عندما:
  - يوجد قاموس أحداث واحد تستخدمه الـ websocket والnotifications.

- [ ] 6.2 بناء notification center.
  المطلوب:
  - in-app notifications
  - read/unread
  - target user(s)
  - context link
  - severity / type
  منجز عندما:
  - الإدارة تتلقى الطلبية الجديدة فورًا.
  - البائع يتلقى تغيير الحالة فورًا.

- [ ] 6.3 ربط الواجهات الحية.
  المطلوب:
  - dashboard refresh
  - order list refresh
  - order detail refresh
  - stock badge refresh
  - cart state refresh if multi-device enabled
  منجز عندما:
  - لا يعتمد المستخدم على refresh اليدوي في التدفقات الحرجة.

## Phase 7 — Auditability

- [ ] 7.1 بناء audit log policy.
  المطلوب:
  - actor
  - entity_type
  - entity_id
  - action
  - old_values
  - new_values
  - metadata
  - request correlation
  منجز عندما:
  - يمكن تفسير أي تعديل جوهري على الطلب أو المخزون.

- [ ] 7.2 بناء order history timeline.
  المطلوب:
  - status changes
  - line changes
  - quantity deltas
  - confirmations
  - shipment events
  - customer changes
  منجز عندما:
  - صفحة التفاصيل تعرض timeline مفهومة للإدارة.

- [ ] 7.3 ربط audit logs مع الصلاحيات.
  المطلوب:
  - logs لا تظهر للجميع
  - viewer لا يرى تفاصيل حساسة
  - owner/admin لهم وصول مناسب
  منجز عندما:
  - السجل مفيد وآمن في نفس الوقت.

## Phase 8 — AI Ingestion and Image Processing

- [ ] 8.1 بناء settings للـ AI provider/model.
  المطلوب:
  - provider selection
  - model selection
  - api keys
  - image prompt settings
  - import parsing settings
  منجز عندما:
  - owner يمكنه التبديل بين OpenAI و DeepSeek دون تعديل الكود.

- [ ] 8.2 بناء AI jobs pipeline.
  المطلوب:
  - queued
  - processing
  - completed
  - failed
  - partial results
  - retriable items
  منجز عندما:
  - رفع ملفات/صور لا ينفذ بشكل blocking داخل request واحدة.

- [ ] 8.3 بناء product import review flow.
  المطلوب:
  - upload file
  - parse
  - preview rows
  - select all / deselect
  - manual edit before import
  - import selected only
  منجز عندما:
  - Claude يستطيع ربط شاشة معاينة حقيقية بالباك إند بدون افتراضات.

- [ ] 8.4 بناء image processing lifecycle.
  المطلوب:
  - original image
  - processed image
  - per-image retry
  - per-image cancel
  - prompt override
  - job progress
  منجز عندما:
  - صورة واحدة يمكن إعادة معالجتها دون إعادة كل الدفعة.

## Phase 9 — Reporting and Operational Read Models

- [ ] 9.1 بناء dashboard read models.
  المطلوب:
  - today orders
  - orders by status
  - low stock
  - top products
  - sales reps leaderboard
  - recent events
  منجز عندما:
  - صفحة `/dashboard` تعتمد على بيانات حقيقية لا mock cards.

- [ ] 9.2 بناء تقارير الطلبيات.
  المطلوب:
  - by status
  - by date range
  - by seller
  - by customer
  - shipped vs unshipped
  منجز عندما:
  - أي تقرير يمكن تصفيته وتصديره أو قراءته بوضوح.

- [ ] 9.3 بناء تقارير المخزون.
  المطلوب:
  - on_hand
  - reserved
  - pending
  - available
  - projected
  - low stock / dead stock
  منجز عندما:
  - الإدارة تستطيع اتخاذ قرار دون فتح كل صنف يدويًا.

- [ ] 9.4 بناء تقارير الأصناف والبائعين.
  المطلوب:
  - product performance
  - seller performance
  - cancellation ratio
  - fulfilment ratio
  منجز عندما:
  - النتائج قابلة للعرض على dashboard أو tables أو export.

## Phase 10 — QA, Seeds, and Delivery Discipline

- [ ] 10.1 بناء seed data عملية.
  المطلوب:
  - owner
  - admin
  - sales
  - viewer
  - demo categories
  - demo products
  - demo customers
  - demo orders in multiple statuses
  منجز عندما:
  - الواجهات الحالية تعمل ببيانات شبيهة بالحقيقة.

- [ ] 10.2 بناء test matrix للدومين.
  المطلوب:
  - permissions
  - order transitions
  - line item mutations
  - stock reservation / release
  - audit logs
  - realtime event emission
  - AI job state transitions
  منجز عندما:
  - المنطق الحرج مغطى باختبارات وليس فقط بتجارب يدوية.

- [ ] 10.3 تحديث التوثيق بعد كل Phase.
  المطلوب:
  - تحديث هذا الملف
  - تحديث وثيقة الميغريشن
  - تحديث `README` عند الحاجة
  منجز عندما:
  - لا تصبح الوثائق أقدم من التنفيذ الفعلي.

## ملاحظات تنفيذية مهمة لـ Claude Code

- إذا كانت الواجهة الحالية تحتوي placeholder data، يتم استبدال الـ data source أولًا قبل إعادة التصميم البصري.
- إذا تعارضت `carts` مع `orders(draft)`، فالقرار الموصى به في البداية هو تبسيط النواة وعدم تكرار الـ aggregate بدون داع.
- `order_number` يجب أن يكون business identifier مستقلًا عن `id`.
- كميات الطلب والمخزون يجب أن تكون `DECIMAL` لا `INT`.
- لا تستخدم hard delete في الطلبات أو السطور أو الحركات أو السجلات.
- `RTL` يستهلك نفس endpoints؛ لا تنشئ API عربية منفصلة.
- أي تحسين بنيوي يجب أن يشرح: ما الذي حلّه؟ وما الذي حافظ عليه من متطلبات Odoo-like behavior؟
