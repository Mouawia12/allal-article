# مخطط قاعدة البيانات — ALLAL-ARTICLE

> آخر تحديث: 2026-04-22
> قاعدة البيانات المعتمدة: PostgreSQL
> الباك إند المستقبلي: Spring Boot 3.x + Java 21
> الميغريشن: Flyway
> قرار العزل: `platform` schema + schema منفصل لكل مشترك

---

## الفكرة العامة

النظام ليس قاعدة بيانات شركة واحدة فقط، بل منصة SaaS فيها:

- مالك منصة يدير المشتركين والخطط والإيرادات.
- مشترك مستقل يمثل شركة/مؤسسة.
- بيانات تشغيلية حساسة لكل مشترك: طلبيات، زبائن، مخزون، محاسبة، مستخدمون، إعدادات، وسجلات تدقيق.

لذلك يعتمد التصميم التالي:

```text
database
├── platform
│   ├── tenants
│   ├── plans
│   ├── feature_catalog
│   ├── subscriptions
│   ├── platform_users
│   ├── tenant_partnerships
│   ├── partner_document_links
│   ├── support_tickets
│   ├── notification_types
│   ├── platform_notifications
│   ├── platform_resource_locks
│   └── platform_audit_logs
│
├── tenant_a1b2c3d4
│   ├── users
│   ├── customers
│   ├── products
│   ├── product_favorites
│   ├── price_lists
│   ├── price_list_items
│   ├── orders
│   ├── stock_movements
│   ├── journals
│   ├── resource_locks
│   └── audit_logs
│
└── tenant_d4e5f6a7
    └── نفس جداول المشترك السابق
```

ملاحظات إلزامية:

- لا توضع بيانات المشتركين التشغيلية في `public`.
- لا يرسل الفرونت اسم schema داخل جسم الطلب.
- الباك إند يحدد المشترك من JWT أو subdomain أو header موثوق، ثم يضبط `search_path` أو datasource context داخليًا.
- كل أسماء schemas تولد من النظام فقط بصيغة آمنة مثل `tenant_` + 8 أو 12 رمزًا hex.
- الحالات تخزن كـ `varchar`، وتدار transitions في طبقة التطبيق بدل SQL ENUM الجامد.
- المفاتيح الأساسية `bigint generated always as identity`.
- كل جدول يحتاج ظهورًا خارجيًا يستخدم `public_id uuid default gen_random_uuid()`.
- المال `numeric(14,2)`.
- الكميات `numeric(14,3)`.
- الأوزان `numeric(14,3)`.

---

## 1) Platform Schema

الغرض من `platform` هو إدارة المنصة نفسها، وليس عمليات المشترك اليومية.

### `platform.platform_users`

مستخدمو مالك المنصة فقط. لا يختلطون مع مستخدمي الشركات المشتركة.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
name                varchar(150) not null,
email               varchar(200) not null unique,
password_hash       text not null,
role_code           varchar(50) not null,       -- owner, support, billing, viewer
status              varchar(30) not null default 'active',
last_login_at       timestamptz,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
deleted_at          timestamptz,
unique (public_id)
```

### `platform.plans`

خطط الاشتراك المعروضة في لوحة المالك.

```sql
id                  bigint generated always as identity primary key,
code                varchar(50) not null unique,       -- trial, basic, professional, enterprise
name_ar             varchar(100) not null,
name_en             varchar(100),
price_monthly       numeric(14,2),
duration_days       integer not null default 365,
max_users           integer,
max_orders_monthly  integer,
max_products        integer,
is_active           boolean not null default true,
sort_order          integer not null default 0,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

### `platform.feature_catalog`

كتالوج الميزات التي تظهر في الواجهة حتى لو لم تكن مفعلة في خطة المشترك. يستخدم لتوليد رسائل الترقية وشرح سبب المنع.

```sql
id                  bigint generated always as identity primary key,
code                varchar(80) not null unique,       -- ai, accounting, partner_documents, advanced_reports...
name_ar             varchar(120) not null,
name_en             varchar(120),
category            varchar(60) not null,
description         text,
default_route       varchar(180),
default_action_key  varchar(120),
recommended_plan_code varchar(50),                     -- professional, enterprise...
upgrade_title       varchar(180),
upgrade_message     text,
is_visible_to_all   boolean not null default true,
sort_order          integer not null default 0,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

### `platform.plan_features`

يفصل الميزات عن الخطة بدل تخزينها كسلسلة نصية فقط.

```sql
id                  bigint generated always as identity primary key,
plan_id             bigint not null references platform.plans(id),
feature_code        varchar(80) not null references platform.feature_catalog(code),
                                                  -- orders, inventory, accounting, ai...
is_enabled          boolean not null default true,
limit_value         integer,
denied_title        varchar(180),
denied_message      text,
upgrade_action_url  varchar(220),
created_at          timestamptz not null default now(),
unique (plan_id, feature_code)
```

### `platform.tenants`

السجل الرئيسي لكل مشترك. هذا هو مصدر الحقيقة لاختيار schema.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
schema_name         varchar(80) not null unique,
company_name        varchar(200) not null,
contact_email       varchar(200) not null,
contact_phone       varchar(30),
wilaya_code         varchar(3),
status              varchar(30) not null default 'trial',
                      -- trial, active, suspended, cancelled, provisioning_failed
plan_id             bigint references platform.plans(id),
trial_ends_at       date,
created_at          timestamptz not null default now(),
activated_at        timestamptz,
suspended_at        timestamptz,
suspended_reason    text,
cancelled_at        timestamptz,
last_activity_at    timestamptz,
unique (public_id)
```

فهارس مهمة:

```sql
create index idx_platform_tenants_status on platform.tenants(status);
create index idx_platform_tenants_plan on platform.tenants(plan_id);
create index idx_platform_tenants_contact_email on platform.tenants(contact_email);
```

### `platform.subscriptions`

يفصل تاريخ الاشتراك والتجديد عن بيانات tenant الأساسية.

```sql
id                  bigint generated always as identity primary key,
tenant_id           bigint not null references platform.tenants(id),
plan_id             bigint not null references platform.plans(id),
status              varchar(30) not null,       -- trial, active, past_due, suspended, cancelled
started_at          date not null,
renews_at           date,
ended_at            date,
price_monthly       numeric(14,2),
currency            varchar(3) not null default 'DZD',
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

### `platform.tenant_usage_snapshots`

لقراءة لوحة المالك بدون استعلام مباشر دائم على كل schema.

```sql
id                  bigint generated always as identity primary key,
tenant_id           bigint not null references platform.tenants(id),
snapshot_date       date not null,
users_count         integer not null default 0,
products_count      integer not null default 0,
orders_this_month   integer not null default 0,
total_orders        integer not null default 0,
storage_used_mb     numeric(14,2) not null default 0,
created_at          timestamptz not null default now(),
unique (tenant_id, snapshot_date)
```

### `platform.tenant_provisioning_events`

يتتبع إنشاء schema، تطبيق migrations، seed، وإنشاء أول admin.

```sql
id                  bigint generated always as identity primary key,
tenant_id           bigint references platform.tenants(id),
event_type          varchar(80) not null,
status              varchar(30) not null,       -- started, success, failed
details_json        jsonb,
error_message       text,
performed_by        bigint references platform.platform_users(id),
created_at          timestamptz not null default now()
```

### `platform.platform_audit_logs`

Audit خاص بالمنصة: إنشاء مشترك، تغيير خطة، إيقاف اشتراك، فتح وصول دعم.

```sql
id                  bigint generated always as identity primary key,
actor_user_id       bigint references platform.platform_users(id),
tenant_id           bigint references platform.tenants(id),
action              varchar(120) not null,
entity_type         varchar(80) not null,
entity_id           bigint,
old_values_json     jsonb,
new_values_json     jsonb,
meta_json           jsonb,
ip_address          varchar(50),
user_agent          text,
correlation_id      varchar(80),
created_at          timestamptz not null default now()
```

### `platform.tenant_invite_codes`

أكواد ربط المشتركين في شبكة الشركاء.

```sql
id                  bigint generated always as identity primary key,
provider_tenant_id  bigint not null references platform.tenants(id),
code_hash           text not null unique,
label               varchar(150),
permissions_json    jsonb not null,
denial_messages_json jsonb,                     -- رسائل منع اختيارية لكل صلاحية شراكة
max_uses            integer,
uses_count          integer not null default 0,
expires_at          timestamptz,
is_active           boolean not null default true,
created_by_user_id  uuid,                       -- user public_id داخل schema المشترك
created_at          timestamptz not null default now()
```

### `platform.tenant_partnerships`

الربط الفعلي بين مشتركين. أي مشاركة مخزون أو إنشاء purchase link يجب أن تمر عبر هذا الجدول.

```sql
id                  bigint generated always as identity primary key,
provider_tenant_id  bigint not null references platform.tenants(id),
requester_tenant_id bigint not null references platform.tenants(id),
invite_code_id      bigint references platform.tenant_invite_codes(id),
status              varchar(30) not null default 'pending',
                      -- pending, active, revoked, rejected
permissions_json    jsonb not null,
denial_messages_json jsonb,                     -- مثال: {"view_pricing":"تواصل مع الشريك لفتح الأسعار"}
provider_supplier_public_id  uuid,              -- public_id من جدول suppliers داخل schema الطرف provider عند تأكيد المطابقة
requester_supplier_public_id uuid,              -- public_id من جدول suppliers داخل schema الطرف requester عند تأكيد المطابقة
supplier_match_status varchar(30) not null default 'none',
                      -- none, suggested, confirmed, skipped, ambiguous
supplier_match_method varchar(50),              -- tax_number, commercial_register, email, phone, manual
supplier_match_score  numeric(5,2),
supplier_match_snapshot jsonb,                  -- لقطة بيانات المطابقة بدون FK عابر بين schemas
supplier_match_reviewed_by uuid,                -- user public_id داخل schema الطرف الذي راجع المطابقة
supplier_match_reviewed_at timestamptz,
requested_message   text,
requested_at        timestamptz not null default now(),
approved_at         timestamptz,
revoked_at          timestamptz,
unique (provider_tenant_id, requester_tenant_id)
```

### `platform.partner_document_links`

وسيط منصة يربط مستندين داخل schema مختلفين. يستخدم عندما تتحول فاتورة/أمر شراء عند مشترك إلى فاتورة/طلبية بيع عند مشترك آخر، أو العكس.

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
partnership_id          bigint not null references platform.tenant_partnerships(id),
direction               varchar(40) not null,
                          -- purchase_to_sale, sale_to_purchase
source_tenant_id        bigint not null references platform.tenants(id),
source_document_type    varchar(40) not null,
                          -- purchase_order, sales_order
source_document_public_id uuid not null,
target_tenant_id        bigint not null references platform.tenants(id),
target_document_type    varchar(40) not null,
target_document_public_id uuid,
status                  varchar(40) not null default 'pending_target_confirmation',
                          -- pending_target_confirmation, accepted, partially_accepted, rejected, cancelled,
                          -- seller_reserved, shipped, in_transit, received, return_requested,
                          -- returned, claim_open, claim_resolved, fulfilled, failed
idempotency_key         varchar(160) not null unique,
source_snapshot_json    jsonb not null,
target_snapshot_json    jsonb,
last_event_type         varchar(80),
last_error              text,
created_by_user_public_id uuid,
accepted_by_user_public_id uuid,
rejected_by_user_public_id uuid,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
accepted_at             timestamptz,
rejected_at             timestamptz,
unique (public_id)

create index idx_partner_document_links_partnership on platform.partner_document_links(partnership_id, status);
create index idx_partner_document_links_source on platform.partner_document_links(source_tenant_id, source_document_type, source_document_public_id);
create index idx_partner_document_links_target on platform.partner_document_links(target_tenant_id, target_document_type, target_document_public_id);

partner_document_claims:
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
document_link_id        bigint not null references platform.partner_document_links(id),
claim_type              varchar(40) not null,
                          -- cancel_after_ship, return, shortage, lost_in_transit, damaged, over_delivery
claim_status            varchar(40) not null default 'open',
                          -- open, accepted, rejected, awaiting_partner, resolved, cancelled
resolution_type         varchar(40),
                          -- replacement, credit_note, refund, write_off, receive_return, price_adjustment
reported_by_tenant_id   bigint not null references platform.tenants(id),
responsible_tenant_id   bigint references platform.tenants(id),
reported_by_user_public_id uuid,
resolved_by_user_public_id uuid,
reason                  text,
resolution_notes        text,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
resolved_at             timestamptz,
unique (public_id)

partner_document_claim_items:
id                      bigint generated always as identity primary key,
claim_id                bigint not null references platform.partner_document_claims(id),
source_line_public_id   uuid,
target_line_public_id   uuid,
product_snapshot_json   jsonb not null,
claimed_qty             numeric(14,3) not null,
accepted_qty            numeric(14,3) not null default 0,
resolved_qty            numeric(14,3) not null default 0,
condition_status        varchar(40),
                          -- missing, damaged, usable, quarantine, returned
notes                   text

create index idx_partner_document_claims_link on platform.partner_document_claims(document_link_id, claim_status);
create index idx_partner_document_claims_type on platform.partner_document_claims(claim_type, claim_status);

partner_document_events:
id                      bigint generated always as identity primary key,
document_link_id        bigint not null references platform.partner_document_links(id),
event_type              varchar(80) not null,
actor_tenant_id         bigint references platform.tenants(id),
actor_user_public_id    uuid,
payload_json            jsonb,
created_at              timestamptz not null default now()
```

### Platform Notifications

إشعارات المنصة موجهة لمالك المنصة وفريق الدعم/الفوترة، وتغطي أمورًا مثل قرب انتهاء الاشتراك، فشل provisioning، طلبات الربط بين مشتركين، ارتفاع الاستهلاك، أو إيقاف مشترك. كما تستعمل كطبقة تنسيق للإشعارات العابرة بين مشتركين بدون فتح وصول مباشر بين schemas.

#### `platform.notification_types`

كتالوج مركزي لأنواع الإشعارات. يستخدم للمنصة وللإشعارات العابرة بين المشتركين، ويمكن نسخ جزء منه إلى tenant seed عند إنشاء المشترك.

```sql
id                  bigint generated always as identity primary key,
code                varchar(120) not null unique,
scope               varchar(30) not null,       -- platform, tenant, inter_tenant
category            varchar(60) not null,       -- subscription, partnership, partner_document, support, inventory, product, security...
severity            varchar(20) not null,       -- info, success, warning, critical, action_required
default_channels    jsonb not null,             -- ["in_app"], ["in_app","email"]
title_template      text not null,
body_template       text,
short_template      text,                         -- نسخة مختصرة للـ navbar/mobile
reason_template     text,                         -- لماذا وصلني هذا الإشعار؟
action_type         varchar(60),                -- open_tenant, approve_partnership, open_order...
default_actions_json jsonb,                      -- open, approve, reject, snooze, renew...
privacy_policy      varchar(40) not null default 'internal',
                      -- internal, partner_safe, owner_only, security_sensitive
can_user_mute       boolean not null default true,
retention_policy_code varchar(60),
escalation_policy_json jsonb,
is_actionable       boolean not null default false,
is_digestible       boolean not null default true,
dedupe_window_minutes integer not null default 0,
is_active           boolean not null default true,
created_at          timestamptz not null default now()
```

#### `platform.platform_notifications`

الإشعار نفسه، قبل تفصيل حالته لكل مستلم.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
notification_type_id bigint not null references platform.notification_types(id),
scope               varchar(30) not null,       -- platform, inter_tenant
tenant_id           bigint references platform.tenants(id),
source_tenant_id    bigint references platform.tenants(id),
target_tenant_id    bigint references platform.tenants(id),
severity            varchar(20) not null,
title               varchar(250) not null,
body                text,
entity_type         varchar(80),
entity_id           bigint,
source_event_code   varchar(120),                -- subscription.expiring_soon...
source_event_id     varchar(120),
action_url          text,
summary_text        varchar(300),
reason_text         text,                         -- سبب وصوله بعد حل المستلمين
payload_json        jsonb,
dedupe_key          varchar(200),
group_key           varchar(200),
correlation_id      varchar(80),
status              varchar(30) not null default 'active',
                      -- active, expired, resolved, cancelled
created_at          timestamptz not null default now(),
retention_until     timestamptz,
expires_at          timestamptz,
unique (public_id)
```

#### `platform.platform_notification_recipients`

حالة الإشعار لكل مستلم. يدعم مستلمي المنصة (`platform_user`) ومستلمي مشترك محدد (`tenant_user`) حتى تصل طلبات الربط والتنبيهات العابرة للطرفين، مع بقاء بيانات المستخدم التشغيلية داخل schema المشترك.

```sql
id                  bigint generated always as identity primary key,
notification_id     bigint not null references platform.platform_notifications(id),
recipient_type      varchar(30) not null,       -- platform_user, tenant_user
platform_user_id    bigint references platform.platform_users(id),
recipient_tenant_id bigint references platform.tenants(id),
tenant_user_public_id uuid,                     -- users.public_id داخل schema المشترك
delivery_status     varchar(30) not null default 'pending',
                      -- pending, delivered, failed, muted
state               varchar(30) not null default 'new',
                      -- new, delivered, read, archived, snoozed, actioned, expired
recipient_reason    text,                         -- لأنك مدير المخزون/مالك/طرف في الربط...
is_read             boolean not null default false,
read_at             timestamptz,
is_archived         boolean not null default false,
archived_at         timestamptz,
snoozed_until       timestamptz,
actioned_at         timestamptz,
last_seen_at        timestamptz,
escalation_level    integer not null default 0,
escalated_at        timestamptz,
created_at          timestamptz not null default now(),
unique (notification_id, recipient_type, platform_user_id, recipient_tenant_id, tenant_user_public_id)
```

#### `platform.platform_notification_templates`

قوالب نصوص حسب اللغة والقناة. تستخدم عند الحاجة لعنوان قصير في Navbar ونص أطول في صفحة الإشعار أو البريد.

```sql
id                  bigint generated always as identity primary key,
notification_type_id bigint not null references platform.notification_types(id),
locale              varchar(10) not null default 'ar',
channel             varchar(30) not null default 'in_app',
title_template      text not null,
short_template      text,
body_template       text,
reason_template     text,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (notification_type_id, locale, channel)
```

#### `platform.platform_notification_actions`

يسجل الأفعال المتاحة والمنفذة على إشعار المنصة أو إشعار بين مشتركين.

```sql
id                  bigint generated always as identity primary key,
notification_id     bigint not null references platform.platform_notifications(id),
recipient_id        bigint references platform.platform_notification_recipients(id),
action_code         varchar(60) not null,         -- open, approve, reject, snooze, renew, dismiss
action_label        varchar(120) not null,
action_url          text,
status              varchar(30) not null default 'available',
                      -- available, executed, disabled, expired
performed_at        timestamptz,
performed_by_type   varchar(30),                  -- platform_user, tenant_user
performed_by_id     uuid,
result_json         jsonb,
created_at          timestamptz not null default now()
```

#### `platform.platform_notification_escalations`

يسجل التصعيد إذا لم يقرأ أو يعالج الإشعار المهم خلال مدة محددة.

```sql
id                  bigint generated always as identity primary key,
notification_id     bigint not null references platform.platform_notifications(id),
recipient_id        bigint references platform.platform_notification_recipients(id),
from_recipient_id   bigint,
to_recipient_type   varchar(30) not null,         -- platform_user, tenant_user, role
to_recipient_ref    varchar(120) not null,
level               integer not null default 1,
reason              text not null,
status              varchar(30) not null default 'pending',
                      -- pending, sent, cancelled, resolved
scheduled_at        timestamptz not null,
sent_at             timestamptz,
created_at          timestamptz not null default now()
```

#### `platform.platform_notification_retention_policies`

سياسات الاحتفاظ والتنظيف حتى لا تكبر جداول المنصة بلا حدود.

```sql
id                  bigint generated always as identity primary key,
code                varchar(60) not null unique,
category            varchar(60) not null,
severity            varchar(20),
keep_days           integer not null,
archive_after_days  integer,
delete_outbox_after_days integer,
is_legal_hold       boolean not null default false,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

#### `platform.platform_notification_preferences`

تفضيلات مستخدمي المنصة حسب نوع الإشعار والقناة.

```sql
id                  bigint generated always as identity primary key,
platform_user_id    bigint not null references platform.platform_users(id),
notification_type_id bigint not null references platform.notification_types(id),
channel             varchar(30) not null,       -- in_app, email, whatsapp, push
is_enabled          boolean not null default true,
minimum_severity    varchar(20) default 'info',
digest_mode         varchar(20) not null default 'instant', -- instant, hourly, daily, muted
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (platform_user_id, notification_type_id, channel)
```

#### `platform.platform_notification_outbox`

Outbox للتسليم غير المتزامن عبر email/WhatsApp/push/websocket.

```sql
id                  bigint generated always as identity primary key,
notification_id     bigint not null references platform.platform_notifications(id),
recipient_id        bigint references platform.platform_notification_recipients(id),
channel             varchar(30) not null,
status              varchar(30) not null default 'pending',
attempt_count       integer not null default 0,
next_attempt_at     timestamptz not null default now(),
last_error          text,
created_at          timestamptz not null default now(),
delivered_at        timestamptz
```

فهارس مهمة:

```sql
create index idx_platform_notifications_created on platform.platform_notifications(created_at);
create index idx_platform_notifications_tenant on platform.platform_notifications(tenant_id);
create index idx_platform_notifications_dedupe on platform.platform_notifications(dedupe_key);
create index idx_platform_notifications_group on platform.platform_notifications(group_key);
create index idx_platform_notification_recipients_platform_user on platform.platform_notification_recipients(platform_user_id, is_read);
create index idx_platform_notification_recipients_tenant_user on platform.platform_notification_recipients(recipient_tenant_id, tenant_user_public_id, is_read);
create index idx_platform_notification_recipients_state on platform.platform_notification_recipients(state, snoozed_until);
create index idx_platform_notification_outbox_pending on platform.platform_notification_outbox(status, next_attempt_at);
```

### Platform Support Tickets

تذاكر دعم بين المشترك ومالك المنصة/فريق الدعم. تحفظ في `platform` لأنها تعبر حدود tenant، لكن محتوى التذكرة لا يفتح وصولاً عاماً إلى schema المشترك.

#### `platform.support_tickets`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
ticket_number           varchar(50) not null unique,
tenant_id               bigint not null references platform.tenants(id),
subject                 varchar(220) not null,
category                varchar(60) not null,
priority                varchar(30) not null default 'normal',
                          -- low, normal, high, urgent
status                  varchar(30) not null default 'open',
                          -- open, waiting_owner, waiting_tenant, resolved, closed
status_source           varchar(30) not null default 'system',
                          -- system, close_action, reopen_action
opened_by_tenant_user_public_id uuid,
assigned_platform_user_id bigint references platform.platform_users(id),
last_message_at         timestamptz,
last_message_by         varchar(30),
                          -- tenant_user, platform_user, system
closed_by_type          varchar(30),
closed_by_user_public_id uuid,
closed_at               timestamptz,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
unique (public_id)
```

#### `platform.support_ticket_participants`

```sql
id                      bigint generated always as identity primary key,
ticket_id               bigint not null references platform.support_tickets(id),
participant_type        varchar(30) not null,
                          -- tenant_user, platform_user, support_team
tenant_user_public_id   uuid,
platform_user_id        bigint references platform.platform_users(id),
role                    varchar(30) not null default 'participant',
last_read_message_id    bigint,
joined_at               timestamptz not null default now(),
unique (ticket_id, participant_type, tenant_user_public_id, platform_user_id)
```

#### `platform.support_messages`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
ticket_id               bigint not null references platform.support_tickets(id),
sender_type             varchar(30) not null,
                          -- tenant_user, platform_user, system
tenant_user_public_id   uuid,
platform_user_id        bigint references platform.platform_users(id),
message_type            varchar(30) not null default 'text',
                          -- text, image, audio, file, system
body                    text,
metadata_json           jsonb,
created_at              timestamptz not null default now(),
deleted_at              timestamptz,
unique (public_id)
```

#### `platform.support_attachments`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
message_id              bigint not null references platform.support_messages(id),
attachment_type         varchar(30) not null,
                          -- image, audio, file
file_name               varchar(240) not null,
mime_type               varchar(120),
storage_key             text not null,
size_bytes              bigint,
duration_seconds        integer,
thumbnail_storage_key   text,
created_at              timestamptz not null default now(),
unique (public_id)
```

فهارس مهمة:

```sql
create index idx_support_tickets_tenant_status on platform.support_tickets(tenant_id, status, last_message_at desc);
create index idx_support_tickets_assignee on platform.support_tickets(assigned_platform_user_id, status, priority);
create index idx_support_messages_ticket_created on platform.support_messages(ticket_id, created_at);
create index idx_support_attachments_message on platform.support_attachments(message_id);
```

### Platform Resource Locks

قفل تحرير سجلات المنصة مثل المشترك، الخطة، الاشتراك، أو provisioning. هذا قفل تطبيقي قصير العمر وليس transaction مفتوحة في قاعدة البيانات.

#### `platform.platform_resource_lock_policies`

```sql
id                  bigint generated always as identity primary key,
resource_type       varchar(80) not null,       -- tenant, plan, subscription, provisioning
lock_scope          varchar(40) not null,       -- edit, approve, provision, suspend
ttl_seconds         integer not null default 300,
heartbeat_interval_seconds integer not null default 30,
stale_after_seconds integer not null default 90,
allow_force_takeover boolean not null default false,
force_takeover_permission varchar(100),
show_locker_identity boolean not null default true,
blocked_actions_json jsonb not null,            -- ["save", "approve", "suspend"]
is_active           boolean not null default true,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (resource_type, lock_scope)
```

#### `platform.platform_resource_locks`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
resource_type       varchar(80) not null,
resource_id         bigint,
resource_public_id  uuid,
resource_key        varchar(160),               -- fallback مثل tenant schema أو plan code
lock_scope          varchar(40) not null,
status              varchar(30) not null default 'active',
                      -- active, released, expired, force_released, taken_over
locked_by_platform_user_id bigint references platform.platform_users(id),
locked_by_session_id varchar(120) not null,
lock_token          uuid not null default gen_random_uuid(),
device_label        varchar(160),
acquired_at         timestamptz not null default now(),
heartbeat_at        timestamptz not null default now(),
expires_at          timestamptz not null,
released_at         timestamptz,
release_reason      varchar(80),
taken_over_by_platform_user_id bigint references platform.platform_users(id),
taken_over_at       timestamptz,
metadata_json       jsonb,
unique (public_id),
unique (lock_token)
```

#### `platform.platform_resource_lock_events`

```sql
id                  bigint generated always as identity primary key,
lock_id             bigint not null references platform.platform_resource_locks(id),
event_type          varchar(40) not null,       -- acquired, heartbeat, released, expired, takeover_denied, taken_over
actor_platform_user_id bigint references platform.platform_users(id),
details_json        jsonb,
created_at          timestamptz not null default now()
```

فهارس مهمة:

```sql
create index idx_platform_resource_locks_resource on platform.platform_resource_locks(resource_type, resource_id, lock_scope, status);
create index idx_platform_resource_locks_expiry on platform.platform_resource_locks(status, expires_at);
create index idx_platform_resource_lock_events_lock on platform.platform_resource_lock_events(lock_id, created_at);
```

---

## 2) Tenant Schema Template

كل مشترك يحصل على نفس الجداول التالية داخل schema الخاص به. الأمثلة التالية تكتب بدون prefix لأن Flyway يطبقها داخل `tenant_xxxxxxxx`.

### Identity and RBAC

#### `roles`

```sql
id              bigint generated always as identity primary key,
code            varchar(50) not null unique,       -- owner, admin, salesperson, view_only, driver
name_ar         varchar(100) not null,
description     text,
is_system       boolean not null default false,
created_at      timestamptz not null default now(),
updated_at      timestamptz not null default now()
```

#### `permissions`

```sql
id              bigint generated always as identity primary key,
code            varchar(100) not null unique,      -- orders.create, orders.confirm
module          varchar(50) not null,
name_ar         varchar(150) not null,
description     text,
required_plan_feature_code varchar(80),            -- ai, accounting, advanced_reports...
ui_route        varchar(180),
ui_action_key   varchar(120),
is_visible_to_all boolean not null default true,
denied_title    varchar(180),
denied_message  text,
denied_action_type varchar(40) default 'contact_admin',
                  -- contact_admin, request_permission, upgrade_plan, contact_partner
ui_metadata_json jsonb,
created_at      timestamptz not null default now()
```

#### `role_permissions`

```sql
role_id         bigint not null references roles(id),
permission_id   bigint not null references permissions(id),
primary key (role_id, permission_id)
```

#### `users`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
name                varchar(150) not null,
email               varchar(200) not null,
phone               varchar(30),
password_hash       text not null,
primary_role_id     bigint references roles(id),
user_type           varchar(30) not null default 'seller',
                      -- admin_user, seller
status              varchar(30) not null default 'active',
avatar_url          text,
last_login_at       timestamptz,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
deleted_at          timestamptz,
unique (public_id),
unique (email)
```

#### `user_profiles`

تفاصيل غير أمنية قابلة للتوسع بدون تضخيم جدول الدخول.

```sql
id                  bigint generated always as identity primary key,
user_id             bigint not null unique references users(id),
job_title           varchar(120),
bio                 text,
address             text,
city                varchar(120),
country             varchar(120) default 'DZ',
preferences_json    jsonb,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

#### `user_permissions`

```sql
user_id         bigint not null references users(id),
permission_id   bigint not null references permissions(id),
effect          varchar(10) not null,             -- allow, deny
primary key (user_id, permission_id)
```

#### `access_denial_events`

سجل خفيف لمحاولات استخدام ميزة ظاهرة لكن ممنوعة. يفيد في إظهار أكثر الصلاحيات المطلوبة للمدير، وأكثر ميزات الترقية طلبًا لمالك المنصة.

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
user_id                 bigint references users(id),
permission_code         varchar(120),
feature_code            varchar(80),
partner_uuid            uuid,
route                   varchar(180),
action_key              varchar(120),
denial_reason           varchar(40) not null,
                          -- plan_required, user_permission_required, partner_permission_required, scope_denied, tenant_suspended
message_shown           text,
metadata_json           jsonb,
created_at              timestamptz not null default now(),
unique (public_id)

create index idx_access_denial_events_user on access_denial_events(user_id, created_at desc);
create index idx_access_denial_events_reason on access_denial_events(denial_reason, feature_code, created_at desc);
```

---

### Reference Data

#### `wilayas`

```sql
id              bigint generated always as identity primary key,
code            varchar(3) not null unique,
name_ar         varchar(100) not null,
name_fr         varchar(100),
is_active       boolean not null default true,
updated_by      bigint references users(id),
updated_at      timestamptz not null default now()
```

#### `settings`

إعدادات المشترك فقط: معلومات الشركة، الطباعة، AI، فواتير الطريق.

```sql
id              bigint generated always as identity primary key,
key             varchar(150) not null unique,
group_name      varchar(80) not null,
value_json      jsonb,
is_encrypted    boolean not null default false,
updated_by      bigint references users(id),
created_at      timestamptz not null default now(),
updated_at      timestamptz not null default now()
```

---

### Customers and Payments

#### `customers`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
name                varchar(200) not null,
phone               varchar(30),
phone2              varchar(30),
email               varchar(200),
wilaya_id           bigint references wilayas(id),
address             text,
shipping_route      varchar(200),
opening_balance     numeric(14,2) not null default 0,
salesperson_id      bigint references users(id),
status              varchar(30) not null default 'active',
notes               text,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
deleted_at          timestamptz,
unique (public_id)
```

فهارس:

```sql
create index idx_customers_name on customers(name);
create index idx_customers_phone on customers(phone);
create index idx_customers_wilaya on customers(wilaya_id);
create index idx_customers_salesperson on customers(salesperson_id);
```

#### `customer_payments`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
customer_id         bigint not null references customers(id),
amount              numeric(14,2) not null,
direction           varchar(10) not null,          -- in, out
payment_method      varchar(30) not null,          -- cash, bank, cheque
reference_number    varchar(100),
received_by         bigint references users(id),
counterparty_name   varchar(200),
payment_date        date not null,
notes               text,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
unique (public_id)
```

---

### Products and Inventory

#### `categories`

```sql
id              bigint generated always as identity primary key,
public_id       uuid not null default gen_random_uuid(),
parent_id       bigint references categories(id),
name            varchar(150) not null,
slug            varchar(180),
description     text,
sort_order      integer not null default 0,
is_active       boolean not null default true,
created_at      timestamptz not null default now(),
updated_at      timestamptz not null default now(),
unique (public_id),
unique (slug)
```

#### `products`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
sku                     varchar(100) not null,
name                    varchar(200) not null,
category_id             bigint references categories(id),
unit_name               varchar(50),
barcode                 varchar(100),
weight_per_unit         numeric(14,3),
units_per_package       numeric(14,3) not null default 1,
package_unit            varchar(50) default 'علبة',
current_price_amount    numeric(14,2),
price_currency          varchar(3) not null default 'DZD',
min_stock_qty           numeric(14,3) not null default 0,
description             text,
status                  varchar(30) not null default 'active',
ai_metadata_json        jsonb,
created_by              bigint references users(id),
updated_by              bigint references users(id),
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
deleted_at              timestamptz,
unique (public_id),
unique (sku)
```

#### `product_favorites`

مفضلة الأصناف تخص المستخدم داخل نفس شركة المشترك، وليست خاصية عامة على الصنف. هذا يمنع أن يؤثر تفضيل بائع على باقي المستخدمين، ويسمح لواجهة البيع بعرض فلتر سريع للأصناف الأكثر استعمالًا لكل مستخدم.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
user_id             bigint not null references users(id),
product_id          bigint not null references products(id),
source_context      varchar(40) not null default 'manual',
note                varchar(240),
sort_order          integer not null default 0,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id),
unique (user_id, product_id)
```

فهارس مهمة:

```sql
create index idx_product_favorites_user on product_favorites(user_id, sort_order, created_at desc);
create index idx_product_favorites_product on product_favorites(product_id);
```

#### `product_images`

```sql
id                  bigint generated always as identity primary key,
product_id          bigint not null references products(id),
file_path           text,
public_url          text,
source_type         varchar(30),                 -- manual, ai_processed, imported
is_primary          boolean not null default false,
sort_order          integer not null default 0,
metadata_json       jsonb,
created_at          timestamptz not null default now()
```

#### `product_price_histories`

```sql
id                      bigint generated always as identity primary key,
product_id              bigint not null references products(id),
previous_price_amount   numeric(14,2),
new_price_amount        numeric(14,2) not null,
price_currency          varchar(3) not null default 'DZD',
changed_by              bigint references users(id),
change_reason           text,
source_type             varchar(50),
source_id               bigint,
effective_at            timestamptz not null default now(),
created_at              timestamptz not null default now()
```

#### `price_lists`

قوائم الأسعار تسمح بإنشاء تسعيرات متعددة حسب نوع العميل أو قناة البيع أو نوع الشراء، مثل: "أسعار أحمد"، "أسعار الجملة"، "أسعار نصف جملة". القائمة اختيارية في الطلبية، ولا يلزم أن تحتوي كل الأصناف.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
code                varchar(60) not null,
name                varchar(160) not null,
price_list_type     varchar(30) not null default 'sales',
                      -- sales, purchase, both
currency            varchar(3) not null default 'DZD',
description         text,
is_default          boolean not null default false,
is_active           boolean not null default true,
starts_at           timestamptz,
ends_at             timestamptz,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
deleted_at          timestamptz,
unique (public_id),
unique (code),
check (price_list_type in ('sales', 'purchase', 'both'))
```

#### `price_list_items`

سطر التسعير يخص صنفاً واحداً داخل قائمة واحدة. إذا لم يوجد سطر للصنف، أو كان `unit_price_amount` فارغاً أو `0`، يستخدم النظام السعر الرئيسي من `products.current_price_amount`.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
price_list_id       bigint not null references price_lists(id),
product_id          bigint not null references products(id),
unit_price_amount   numeric(14,2),
min_qty             numeric(14,3) not null default 1,
is_active           boolean not null default true,
note                text,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id),
unique (price_list_id, product_id, min_qty),
check (unit_price_amount is null or unit_price_amount >= 0),
check (min_qty > 0)
```

فهارس وقواعد مهمة:

```sql
create index idx_price_lists_type_active on price_lists(price_list_type, is_active, name);
create index idx_price_list_items_lookup on price_list_items(price_list_id, product_id, min_qty);
create index idx_price_list_items_product on price_list_items(product_id);
```

- اختيار قائمة أسعار في البيع أو الشراء يحفظ snapshot على رأس المستند وعلى كل سطر؛ لا يعاد تسعير الفواتير القديمة إذا تغيرت القائمة لاحقاً.
- `0` داخل قائمة الأسعار لا يعني بيعاً مجانياً؛ يعني fallback للسعر الرئيسي. إذا احتاج النظام لاحقاً إلى هدية أو خصم 100%، تنفذ كسطر خصم/عرض مستقل وليس كسعر قائمة `0`.
- في البيع يسمح باختيار قوائم `sales` أو `both`. في الشراء يسمح باختيار قوائم `purchase` أو `both`.

#### `warehouses`

```sql
id              bigint generated always as identity primary key,
code            varchar(50) not null unique,
name            varchar(150) not null,
warehouse_type  varchar(40) not null default 'operational',
                  -- central, operational, returns, quarantine, virtual
city            varchar(120),
address         text,
manager_id      bigint references users(id),
capacity_qty    numeric(14,3),
is_default      boolean not null default false,
is_active       boolean not null default true,
created_at      timestamptz not null default now(),
updated_at      timestamptz not null default now()
```

قواعد المستودعات:
- كل رصيد مخزون يجب أن يكون على مستوى `product_id + warehouse_id` وليس على مستوى الصنف فقط.
- يمكن وجود مستودع مركزي، مستودعات تشغيلية، ومستودع مرتجعات/حجر.
- التحويل بين المستودعات لا يغير إجمالي مخزون الشركة، لكنه يغير توزيع الكميات بين المستودعات.

#### `product_stocks`

Read model سريع للمخزون، وليس مصدر الحقيقة الوحيد.

```sql
id                  bigint generated always as identity primary key,
product_id          bigint not null references products(id),
warehouse_id        bigint not null references warehouses(id),
on_hand_qty         numeric(14,3) not null default 0,
reserved_qty        numeric(14,3) not null default 0,
pending_qty         numeric(14,3) not null default 0,
available_qty       numeric(14,3) not null default 0,
projected_qty       numeric(14,3) not null default 0,
last_recomputed_at  timestamptz,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (product_id, warehouse_id)
```

قواعد `product_stocks`:
- هذا الجدول read model سريع، والمصدر التاريخي هو `stock_movements`.
- `available_qty = on_hand_qty - reserved_qty`.
- `projected_qty = available_qty - pending_qty`.
- التحويل بين المستودعات ينقص `on_hand_qty` من المصدر ويزيده في الوجهة.
- لا يسمح بنقل الكمية المحجوزة؛ الحد الأعلى للتحويل هو `available_qty`.

#### `stock_movements`

السجل التاريخي الحقيقي لحركة المخزون.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
product_id          bigint not null references products(id),
warehouse_id        bigint not null references warehouses(id),
movement_type       varchar(50) not null,
qty                 numeric(14,3) not null,
balance_before      numeric(14,3),
balance_after       numeric(14,3),
source_type         varchar(50),
source_id           bigint,
notes               text,
performed_by        bigint references users(id),
created_at          timestamptz not null default now(),
unique (public_id)
```

#### `stock_transfers` و `stock_transfer_items`

```sql
stock_transfers:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
transfer_number     varchar(50) not null unique,
transfer_type       varchar(30) not null default 'product',
                      -- product, warehouse_full
from_warehouse_id   bigint not null references warehouses(id),
to_warehouse_id     bigint not null references warehouses(id),
status              varchar(30) not null default 'posted',
                      -- draft, posted, cancelled
reason              text,
created_by          bigint references users(id),
posted_by           bigint references users(id),
posted_at           timestamptz,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id),
check (from_warehouse_id <> to_warehouse_id)

create index idx_stock_transfers_warehouses on stock_transfers(from_warehouse_id, to_warehouse_id, created_at desc);

stock_transfer_items:
id                  bigint generated always as identity primary key,
stock_transfer_id   bigint not null references stock_transfers(id),
product_id          bigint not null references products(id),
qty                 numeric(14,3) not null,
out_movement_id     bigint references stock_movements(id),
in_movement_id      bigint references stock_movements(id),
notes               text,
created_at          timestamptz not null default now(),
check (qty > 0)

create index idx_stock_transfer_items_transfer on stock_transfer_items(stock_transfer_id);
create index idx_stock_transfer_items_product on stock_transfer_items(product_id);
```

قواعد تحويلات المستودعات:
- تحويل صنف واحد ينشئ رأس `stock_transfers.transfer_type = product` وسطر واحد أو أكثر في `stock_transfer_items`.
- تحويل مستودع كامل ينشئ `transfer_type = warehouse_full` وسطوراً لكل صنف له كمية متاحة في المستودع المصدر.
- كل سطر تحويل ينشئ حركتين في `stock_movements`: حركة خروج من مستودع المصدر، وحركة دخول إلى مستودع الوجهة.
- الكميات المحجوزة لا تنقل في تحويل المستودع الكامل؛ تبقى في المصدر حتى تنتهي الطلبية أو يحرر الحجز.
- لا يسمح بنقل كمية أكبر من `product_stocks.available_qty`.

#### `stock_reservations`

```sql
id                  bigint generated always as identity primary key,
product_id          bigint not null references products(id),
warehouse_id        bigint not null references warehouses(id),
order_id            bigint,
order_item_id       bigint,
reserved_qty        numeric(14,3) not null,
status              varchar(30) not null default 'active',
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()
```

---

### Manufacturing

يدعم طلبات التصنيع الداخلية للمشتركين الذين يملكون مصنعًا أو ورشة. طلب التصنيع قد يكون مرتبطًا ببيع، أو بسد نقص مخزون، أو بتصنيع خاص بمواصفات زبون.

#### `manufacturing_requests`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
request_number          varchar(50) not null unique,
source_type             varchar(40) not null,
                          -- sold_order, stock_replenishment, custom_order, manual
source_order_id         bigint references orders(id),
source_order_item_id    bigint references order_items(id),
product_id              bigint not null references products(id),
requested_qty           numeric(14,3) not null,
approved_qty            numeric(14,3),
produced_qty            numeric(14,3) not null default 0,
received_qty            numeric(14,3) not null default 0,
unit_name               varchar(50),
status                  varchar(40) not null default 'draft',
                          -- draft, approved, queued, in_production, quality_check,
                          -- ready_to_ship, in_transit, received, cancelled
priority                varchar(30) not null default 'normal',
factory_name            varchar(180),
production_line         varchar(180),
requested_by            bigint references users(id),
approved_by             bigint references users(id),
responsible_user_id     bigint references users(id),
quality_user_id         bigint references users(id),
destination_warehouse_id bigint references warehouses(id),
destination_label       varchar(200),
linked_customer_id      bigint references customers(id),
customer_snapshot       varchar(220),
deposit_required        boolean not null default false,
deposit_amount          numeric(14,2) not null default 0,
deposit_paid_amount     numeric(14,2) not null default 0,
deposit_status          varchar(30) not null default 'none',
                          -- none, pending, partial, paid
due_date                date,
started_at              timestamptz,
completed_at            timestamptz,
shipped_at              timestamptz,
received_at             timestamptz,
notes                   text,
metadata_json           jsonb,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
cancelled_at            timestamptz,
cancel_reason           text,
unique (public_id)
```

#### `manufacturing_request_materials`

```sql
id                      bigint generated always as identity primary key,
manufacturing_request_id bigint not null references manufacturing_requests(id) on delete cascade,
material_product_id     bigint not null references products(id),
planned_qty             numeric(14,3) not null,
reserved_qty            numeric(14,3) not null default 0,
consumed_qty            numeric(14,3) not null default 0,
waste_qty               numeric(14,3) not null default 0,
warehouse_id            bigint references warehouses(id),
unit_cost_amount        numeric(14,4),
notes                   text,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now()
```

#### `manufacturing_quality_checks`

```sql
id                      bigint generated always as identity primary key,
manufacturing_request_id bigint not null references manufacturing_requests(id) on delete cascade,
checked_by              bigint references users(id),
result                  varchar(30) not null,
                          -- passed, failed, rework_required, partial_pass
checked_qty             numeric(14,3) not null default 0,
passed_qty              numeric(14,3) not null default 0,
rework_qty              numeric(14,3) not null default 0,
rejected_qty            numeric(14,3) not null default 0,
notes                   text,
attachments_json        jsonb,
checked_at              timestamptz not null default now()
```

#### `manufacturing_events`

```sql
id                      bigint generated always as identity primary key,
manufacturing_request_id bigint not null references manufacturing_requests(id) on delete cascade,
event_type              varchar(60) not null,
old_status              varchar(40),
new_status              varchar(40),
payload_json            jsonb,
performed_by            bigint references users(id),
created_at              timestamptz not null default now()
```

#### `manufacturing_receipts`

```sql
id                      bigint generated always as identity primary key,
manufacturing_request_id bigint not null references manufacturing_requests(id),
warehouse_id            bigint not null references warehouses(id),
received_qty            numeric(14,3) not null,
accepted_qty            numeric(14,3) not null default 0,
quarantine_qty          numeric(14,3) not null default 0,
stock_movement_id       bigint references stock_movements(id),
received_by             bigint references users(id),
received_at             timestamptz not null default now(),
notes                   text
```

```sql
create index idx_manufacturing_requests_status on manufacturing_requests(status, due_date);
create index idx_manufacturing_requests_source on manufacturing_requests(source_type, source_order_id);
create index idx_manufacturing_requests_product on manufacturing_requests(product_id, destination_warehouse_id);
create index idx_manufacturing_materials_request on manufacturing_request_materials(manufacturing_request_id);
create index idx_manufacturing_events_request_created on manufacturing_events(manufacturing_request_id, created_at desc);
```

---

### Orders and Returns

#### `orders`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
order_number        varchar(50) not null unique,
customer_id         bigint references customers(id),
sales_user_id       bigint references users(id),
origin_channel      varchar(40) not null default 'manual',
                      -- manual, partner_purchase, partner_sale
linked_partner_uuid uuid,
linked_partnership_public_id uuid,
partner_document_link_public_id uuid,
partner_source_document_public_id uuid,
partner_sync_status varchar(40) not null default 'none',
                      -- none, pending_target_confirmation, accepted, partially_accepted, rejected, cancelled,
                      -- seller_reserved, shipped, in_transit, received, completed, failed
order_status        varchar(40) not null default 'draft',
                      -- draft, submitted, under_review, confirmed, shipped, completed, cancelled, rejected
shipping_status     varchar(40) not null default 'pending',
                      -- none, pending, shipped
payment_status      varchar(30) not null default 'unpaid',
price_list_id       bigint references price_lists(id),
price_list_name_snapshot varchar(160),
price_currency      varchar(3) not null default 'DZD',
notes               text,
internal_notes      text,
total_amount        numeric(14,2) not null default 0,
total_weight        numeric(14,3) not null default 0,
created_by          bigint references users(id),
updated_by          bigint references users(id),
reviewed_by         bigint references users(id),
confirmed_by        bigint references users(id),
shipped_by          bigint references users(id),
completed_by        bigint references users(id),
cancelled_by        bigint references users(id),
rejected_by         bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
submitted_at        timestamptz,
review_started_at   timestamptz,
confirmed_at        timestamptz,
shipped_at          timestamptz,
completion_due_at   timestamptz,
completed_at        timestamptz,
auto_completed_at   timestamptz,
cancelled_at        timestamptz,
rejected_at         timestamptz,
deleted_at          timestamptz,
unique (public_id)

create index idx_orders_partner_document_link on orders(partner_document_link_public_id);
create index idx_orders_linked_partner on orders(linked_partner_uuid, partner_sync_status);
create index idx_orders_status on orders(order_status, created_at desc);
create index idx_orders_price_list on orders(price_list_id, created_at desc);
create index idx_orders_shipping_completion_due on orders(order_status, completion_due_at)
  where order_status = 'shipped';
```

قواعد حالة الطلبية:
- الانتقال الرسمي: `draft -> submitted -> under_review -> confirmed -> shipped -> completed`.
- `cancelled` مسموحة قبل الشحن فقط، بما في ذلك حالة `confirmed`.
- بعد `shipped` لا يسمح بتعديل السطور أو إلغاء الطلبية؛ المعالجة تكون عبر `returns`.
- عند الشحن يضبط النظام `shipped_at` و`completion_due_at = shipped_at + interval '3 days'`.
- Job دوري يحول `order_status = shipped` إلى `completed` عند تجاوز `completion_due_at` ويملأ `auto_completed_at`.
- زر فاتورة الطريق يعتمد على الحالة: يظهر من `confirmed` فما فوق.
- زر المرتجع يعتمد على وجود `shipped_qty > returned_qty` في الأسطر ولا يظهر قبل الشحن.
- عند اختيار `price_list_id`، ينسخ النظام اسم القائمة إلى `price_list_name_snapshot` ويحتسب أسعار السطور وقت الإنشاء أو التعديل المسموح.
- إذا لم يجد النظام سعراً للصنف داخل القائمة، أو وجد السعر `0`، تكون `pricing_source = product_default` ويستخدم `products.current_price_amount`.
- جدول أسطر البيع يجب أن يعرض عمود السعر لكل صنف، والملخص يحسب `total_amount = sum(line_subtotal)` للأسطر غير الملغاة.

#### `order_items`

```sql
id                      bigint generated always as identity primary key,
public_id               uuid not null default gen_random_uuid(),
order_id                bigint not null references orders(id),
product_id              bigint not null references products(id),
line_number             integer not null,
line_status             varchar(40) not null default 'pending',
partner_source_line_public_id uuid,
requested_qty           numeric(14,3) not null,
approved_qty            numeric(14,3) not null default 0,
shipped_qty             numeric(14,3) not null default 0,
returned_qty            numeric(14,3) not null default 0,
cancelled_qty           numeric(14,3) not null default 0,
original_requested_qty  numeric(14,3),
price_list_id           bigint references price_lists(id),
price_list_item_id      bigint references price_list_items(id),
price_list_name_snapshot varchar(160),
pricing_source          varchar(40) not null default 'product_default',
                          -- price_list, product_default, manual_override
base_unit_price         numeric(14,2),
unit_price              numeric(14,2),
line_subtotal           numeric(14,2) not null default 0,
line_weight             numeric(14,3),
is_shipping_required    boolean not null default true,
customer_note           text,
internal_note           text,
changed_by_admin        bigint references users(id),
change_reason           text,
created_at              timestamptz not null default now(),
updated_at              timestamptz not null default now(),
deleted_at              timestamptz,
unique (public_id),
unique (order_id, line_number),
check (approved_qty >= 0),
check (shipped_qty >= 0),
check (returned_qty >= 0),
check (cancelled_qty >= 0),
check (approved_qty + cancelled_qty = requested_qty),
check (shipped_qty <= approved_qty),
check (returned_qty <= shipped_qty)
```

قواعد سطور الطلبية:
- الحالات الرسمية: `pending`, `approved`, `modified`, `shipped`, `cancelled`.
- لا توجد حالة `deleted_by_admin`؛ حذف السطر الإداري يحول السطر إلى `cancelled`.
- السطر الملغى يبقى في `order_items` وواجهة الفاتورة، لكنه يستبعد من الطباعة بفلاتر `line_status <> 'cancelled'`.
- تعديل `approved_qty` أو `cancelled_qty` يجب أن يحافظ على المعادلة: `approved_qty + cancelled_qty = requested_qty`.
- عند حفظ تعديل الإدارة: السطر غير الملموس يصبح `approved`، والسطر الذي تغيرت كمياته يصبح `modified`.
- عند الشحن: كل سطر غير ملغى يصبح `line_status = shipped` و`shipped_qty = approved_qty`.
- المرتجع لا يعدل الشحن مباشرة؛ يضيف `return_items` ويحدث `order_items.returned_qty`.
- `unit_price` و`line_subtotal` هما snapshot تاريخي ولا يتغيران عند تعديل قائمة الأسعار لاحقاً.

#### `order_events`

```sql
id              bigint generated always as identity primary key,
order_id        bigint not null references orders(id),
event_type      varchar(80) not null,
payload_json    jsonb,
performed_by    bigint references users(id),
created_at      timestamptz not null default now()
```

#### `order_item_events`

```sql
id              bigint generated always as identity primary key,
order_item_id   bigint not null references order_items(id),
event_type      varchar(80) not null,
old_values_json jsonb,
new_values_json jsonb,
reason          text,
performed_by    bigint references users(id),
created_at      timestamptz not null default now()
```

أحداث إلزامية في الطلبية:
- `order.submitted`, `order.review_started`, `order.confirmed`, `order.shipped`, `order.completed`, `order.auto_completed`, `order.cancelled`, `order.rejected`.
- `order_item.modified`, `order_item.cancelled`, `order_item.shipped`, `order_item.returned`.
- يجب أن يحفظ `old_values_json` و`new_values_json` فروقات الكميات، خصوصاً `approved_qty`, `cancelled_qty`, `shipped_qty`, `returned_qty`.

#### `returns` و `return_items`

```sql
returns:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
return_number       varchar(50) not null unique,
origin_channel      varchar(40) not null default 'manual',
                      -- manual, partner_return, partner_claim
linked_partner_uuid uuid,
partner_document_link_public_id uuid,
partner_claim_public_id uuid,
partner_sync_status varchar(40) not null default 'none',
                      -- none, return_requested, return_approved, return_shipped, return_received, rejected, claim_resolved
order_id            bigint references orders(id),
customer_id         bigint references customers(id),
driver_id           bigint references users(id),
received_by         bigint references users(id),
return_date         date not null,
status              varchar(30) not null default 'pending',
notes               text,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
unique (public_id)

create index idx_returns_partner_document_link on returns(partner_document_link_public_id);
create index idx_returns_partner_claim on returns(partner_claim_public_id);

return_items:
id                  bigint generated always as identity primary key,
return_id           bigint not null references returns(id),
order_item_id       bigint references order_items(id),
product_id          bigint not null references products(id),
partner_source_line_public_id uuid,
returned_qty        numeric(14,3) not null,
accepted_qty        numeric(14,3) not null default 0,
condition_status    varchar(40),
                      -- usable, damaged, missing, quarantine, written_off
notes               text
```

---

### Purchases

```sql
suppliers:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
name                varchar(200) not null,
legal_name          varchar(200),
phone               varchar(50),
email               varchar(150),
tax_number          varchar(80),
commercial_register varchar(80),
nis_number          varchar(80),
wilaya_id           bigint references wilayas(id),
address             text,
category            varchar(80),
status              varchar(30) not null default 'active',
payment_terms       varchar(120),
opening_balance     numeric(14,2) not null default 0,
linked_partner_uuid uuid,                       -- UUID ثابت للشريك بعد قبول الربط
linked_partnership_public_id uuid,              -- مرجع منطقي للربط في platform.tenant_partnerships
link_match_method   varchar(50),                -- tax_number, commercial_register, email, phone, manual
link_match_status   varchar(30) not null default 'none',
                      -- none, suggested, confirmed, skipped, ambiguous
link_confirmed_by   bigint references users(id),
link_confirmed_at   timestamptz,
notes               text,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id)

create unique index idx_suppliers_tax_number_unique on suppliers(tax_number)
  where tax_number is not null and tax_number <> '';
create unique index idx_suppliers_commercial_register_unique on suppliers(commercial_register)
  where commercial_register is not null and commercial_register <> '';
create unique index idx_suppliers_email_unique on suppliers(lower(email))
  where email is not null and email <> '';
create unique index idx_suppliers_phone_unique on suppliers(phone)
  where phone is not null and phone <> '';
create index idx_suppliers_linked_partner on suppliers(linked_partner_uuid);

purchase_orders:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
po_number           varchar(50) not null unique,
supplier_id         bigint references suppliers(id),
supplier_name       varchar(200) not null,
origin_channel      varchar(40) not null default 'manual',
                      -- manual, partner_purchase, partner_sale
linked_partner_uuid uuid,
linked_partnership_public_id uuid,
partner_document_link_public_id uuid,
partner_source_document_public_id uuid,
partner_sync_status varchar(40) not null default 'none',
                      -- none, pending_target_confirmation, accepted, partially_accepted, rejected, cancelled,
                      -- seller_reserved, shipped, in_transit, received, completed, failed
status              varchar(30) not null default 'draft',
                      -- draft, confirmed, received, cancelled
payment_status      varchar(30) not null default 'unpaid',
price_list_id       bigint references price_lists(id),
price_list_name_snapshot varchar(160),
price_currency      varchar(3) not null default 'DZD',
expected_date       date,
received_date       date,
received_by         bigint references users(id),
sent_to_supplier_by bigint references users(id),
sent_to_supplier_at timestamptz,
cancelled_by        bigint references users(id),
cancelled_at        timestamptz,
total_amount        numeric(14,2) not null default 0,
notes               text,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id)

create index idx_purchase_orders_partner_document_link on purchase_orders(partner_document_link_public_id);
create index idx_purchase_orders_linked_partner on purchase_orders(linked_partner_uuid, partner_sync_status);
create index idx_purchase_orders_price_list on purchase_orders(price_list_id, created_at desc);
```

قواعد أوامر الشراء:
- الرحلة الرسمية: `draft -> confirmed -> received`.
- `draft` تظهر كمسودة شراء في الواجهة، وزرها الأساسي "إرسال للمورد".
- `confirmed` تعني أن الأمر أرسل/اعتمد للمورد وينتظر الاستلام.
- `received` تقفل تعديل أمر الشراء؛ أي تصحيح بعد الاستلام يتم عبر `purchase_returns` أو قيد تسوية.
- `cancelled` مسموحة قبل الاستلام فقط.
- عند الاستلام الكامل: `received_qty = ordered_qty` لكل سطر، وتكتب حركة دخول مخزون.
- مرتجع المشتريات لا ينقص `received_qty`، بل يحدث `returned_qty` وينشئ حركة خروج مخزون وإشعاراً دائنًا/تخفيض ذمة المورد.
- أوامر الشراء يمكن أن تختار قائمة أسعار نوعها `purchase` أو `both`، ويتم حفظ اسمها كسجل تاريخي.
- إذا لم يكن للصنف سعر داخل قائمة الشراء المختارة أو كان السعر `0`، يستخدم النظام السعر الرئيسي من بطاقة الصنف حتى لا يتوقف إدخال أمر الشراء.
- جدول أسطر الشراء يعرض عمود السعر لكل صنف، والملخص يحسب إجمالي أمر الشراء من `line_subtotal`.

```sql
purchase_order_items:
id                  bigint generated always as identity primary key,
purchase_order_id   bigint not null references purchase_orders(id),
product_id          bigint not null references products(id),
partner_source_line_public_id uuid,
ordered_qty         numeric(14,3) not null,
received_qty        numeric(14,3) not null default 0,
returned_qty        numeric(14,3) not null default 0,
price_list_id       bigint references price_lists(id),
price_list_item_id  bigint references price_list_items(id),
price_list_name_snapshot varchar(160),
pricing_source      varchar(40) not null default 'product_default',
                      -- price_list, product_default, manual_override
base_unit_price     numeric(14,2),
unit_price          numeric(14,2),
line_subtotal       numeric(14,2) not null default 0,
notes               text,
check (ordered_qty >= 0),
check (received_qty >= 0),
check (returned_qty >= 0),
check (received_qty <= ordered_qty),
check (returned_qty <= received_qty)

create index idx_purchase_order_items_order on purchase_order_items(purchase_order_id);

purchase_returns:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
return_number       varchar(50) not null unique,
purchase_order_id   bigint not null references purchase_orders(id),
supplier_id         bigint references suppliers(id),
supplier_name       varchar(200) not null,
supplier_invoice_no varchar(80),
return_date         date not null,
status              varchar(30) not null default 'draft',
                      -- draft, posted, cancelled
warehouse_id        bigint references warehouses(id),
reason              text,
total_amount        numeric(14,2) not null default 0,
tax_amount          numeric(14,2) not null default 0,
net_amount          numeric(14,2) not null default 0,
accounting_status   varchar(30) not null default 'pending',
                      -- pending, posted, reversed
journal_public_id   uuid,
stock_posting_status varchar(30) not null default 'pending',
                      -- pending, posted, reversed
returned_by         bigint references users(id),
received_by_supplier varchar(160),
created_by          bigint references users(id),
posted_by           bigint references users(id),
posted_at           timestamptz,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id)

create index idx_purchase_returns_order on purchase_returns(purchase_order_id);
create index idx_purchase_returns_supplier on purchase_returns(supplier_id, return_date);
create index idx_purchase_returns_accounting on purchase_returns(accounting_status, journal_public_id);

purchase_return_items:
id                  bigint generated always as identity primary key,
purchase_return_id  bigint not null references purchase_returns(id),
purchase_order_item_id bigint references purchase_order_items(id),
product_id          bigint not null references products(id),
returned_qty        numeric(14,3) not null,
unit_cost_amount    numeric(14,2) not null default 0,
tax_rate            numeric(5,2) not null default 0,
tax_amount          numeric(14,2) not null default 0,
line_total_amount   numeric(14,2) not null default 0,
stock_movement_id   bigint references stock_movements(id),
condition_status    varchar(40) not null default 'return_to_supplier',
                      -- return_to_supplier, damaged, quarantine, price_adjustment
notes               text,
created_at          timestamptz not null default now(),
unique (purchase_return_id, purchase_order_item_id)

create index idx_purchase_return_items_product on purchase_return_items(product_id);
```

---

### Road Invoices

```sql
road_invoices:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
invoice_number      varchar(50) not null unique,
invoice_date        date not null,
wilaya_id           bigint references wilayas(id),
customer_id         bigint references customers(id),
driver_id           bigint references users(id),
status              varchar(30) not null default 'draft',
total_weight        numeric(14,3) not null default 0,
notes               text,
print_count         integer not null default 0,
last_printed_at     timestamptz,
last_printed_by     bigint references users(id),
whatsapp_sent_at    timestamptz,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id)

road_invoice_items:
id                  bigint generated always as identity primary key,
road_invoice_id     bigint not null references road_invoices(id),
product_id          bigint not null references products(id),
quantity            numeric(14,3) not null,
unit_price          numeric(14,2),
line_weight         numeric(14,3),
source_json         jsonb,
notes               text

road_invoice_orders:
road_invoice_id     bigint not null references road_invoices(id),
order_id            bigint not null references orders(id),
primary key (road_invoice_id, order_id)

road_invoice_wilaya_defaults:
wilaya_id           bigint primary key references wilayas(id),
customer_id         bigint not null references customers(id),
updated_by          bigint references users(id),
updated_at          timestamptz not null default now()
```

---

### Accounting

تصميم المحاسبة هنا مبني ليعمل مثل برامج ERP الجدية:

- شجرة حسابات قابلة للزرع من template، وليست mock ثابت.
- حسابات رقابية مرتبطة بـ sub-ledgers للزبائن والموردين.
- دفاتر يومية وترقيم مستقل لكل دفتر.
- قواعد ربط تلقائي للعمليات: بيع، شراء، دفع، مرتجع، مخزون، ضرائب.
- أبعاد تحليلية مثل مركز تكلفة، ولاية، بائع، مخزن.
- تقارير مالية تعتمد على تصنيف الحسابات ومكانها في القوائم.

#### `fiscal_years` و `accounting_periods`

```sql
fiscal_years:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
name                varchar(100) not null,
start_date          date not null,
end_date            date not null,
status              varchar(30) not null default 'open', -- open, closing, closed
closed_at           timestamptz,
closed_by           bigint references users(id),
close_reason        text,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
unique (public_id),
unique (start_date, end_date)

accounting_periods:
id                  bigint generated always as identity primary key,
fiscal_year_id      bigint not null references fiscal_years(id),
period_number       smallint not null,
name                varchar(80) not null,
start_date          date not null,
end_date            date not null,
status              varchar(30) not null default 'open', -- open, closed, locked
closed_at           timestamptz,
closed_by           bigint references users(id),
unique (fiscal_year_id, period_number)
```

#### `account_classes`

طبقة مرجعية لزرع شجرة SCF الجزائرية أو أي قالب محاسبي آخر.

```sql
id                  bigint generated always as identity primary key,
code                varchar(10) not null unique,       -- 1..7 في SCF
name_ar             varchar(150) not null,
name_fr             varchar(150),
financial_statement varchar(40) not null,              -- balance_sheet, income_statement
normal_balance      varchar(10) not null,              -- debit, credit
sort_order          integer not null default 0
```

#### `account_templates` و `account_template_items`

تستخدم عند إنشاء مشترك جديد لزرع شجرة حسابات جاهزة.

```sql
account_templates:
id                  bigint generated always as identity primary key,
code                varchar(60) not null unique,       -- dz_scf_trading
name_ar             varchar(160) not null,
name_fr             varchar(160),
country_code        varchar(2) not null default 'DZ',
is_default          boolean not null default false,
version             integer not null default 1,
created_at          timestamptz not null default now()

account_template_items:
id                  bigint generated always as identity primary key,
template_id          bigint not null references account_templates(id),
code                varchar(30) not null,
name_ar             varchar(200) not null,
name_fr             varchar(200),
parent_code         varchar(30),
classification      varchar(30) not null,
normal_balance      varchar(10) not null,
is_postable         boolean not null default true,
is_control          boolean not null default false,
requires_subledger  boolean not null default false,
subledger_type      varchar(30),                       -- customer, supplier, employee, tax, bank
report_section      varchar(60),                       -- current_assets, revenue, cogs...
cash_flow_section   varchar(60),                       -- operating, investing, financing
sort_order          integer not null default 0,
unique (template_id, code)
```

#### `accounts`

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
code                varchar(30) not null unique,
name_ar             varchar(200) not null,
name_fr             varchar(200),
parent_id           bigint references accounts(id),
account_class_id    bigint references account_classes(id),
level               smallint not null default 1,
path                varchar(500),
classification      varchar(30) not null,              -- asset, liability, equity, revenue, expense
normal_balance      varchar(10) not null,              -- debit, credit
report_section      varchar(60),
cash_flow_section   varchar(60),
is_postable         boolean not null default true,
is_control          boolean not null default false,
requires_subledger  boolean not null default false,
subledger_type      varchar(30),                       -- customer, supplier, employee, tax, bank
is_reconcilable     boolean not null default false,
allow_manual_posting boolean not null default true,
currency            varchar(3) not null default 'DZD',
status              varchar(30) not null default 'active',
sort_order          integer not null default 0,
created_by          bigint references users(id),
updated_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
deleted_at          timestamptz,
unique (public_id),
check (not is_postable or level >= 2),
check (not requires_subledger or subledger_type is not null)
```

فهارس أساسية:

```sql
create index idx_accounts_parent on accounts(parent_id);
create index idx_accounts_classification on accounts(classification);
create index idx_accounts_path on accounts(path);
create index idx_accounts_report_section on accounts(report_section);
```

#### `subledger_entities`

يربط الحسابات الرقابية بأطراف تفصيلية بدون خلط جدول الزبائن/الموردين مع الحسابات.

```sql
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
subledger_type      varchar(30) not null,              -- customer, supplier, employee, tax, bank
entity_type         varchar(50) not null,              -- customers, suppliers, users, tax_rates, bank_accounts
entity_id           bigint not null,
display_name        varchar(200) not null,
control_account_id  bigint not null references accounts(id),
status              varchar(30) not null default 'active',
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id),
unique (subledger_type, entity_type, entity_id)
```

#### `journal_books` و `number_sequences`

```sql
journal_books:
id                  bigint generated always as identity primary key,
code                varchar(40) not null unique,       -- sales, purchase, cash, bank, inventory, manual
name_ar             varchar(120) not null,
book_type           varchar(40) not null,
default_prefix      varchar(20) not null,
allows_manual       boolean not null default true,
requires_approval   boolean not null default false,
is_active           boolean not null default true,
created_at          timestamptz not null default now()

number_sequences:
id                  bigint generated always as identity primary key,
sequence_key        varchar(80) not null unique,       -- journal.sales.2026
prefix              varchar(30) not null,
next_number         bigint not null default 1,
padding             smallint not null default 5,
fiscal_year_id      bigint references fiscal_years(id),
updated_at          timestamptz not null default now()
```

#### `journals` و `journal_items`

```sql
journals:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
journal_number      varchar(50) not null unique,
journal_book_id     bigint not null references journal_books(id),
fiscal_year_id      bigint not null references fiscal_years(id),
period_id           bigint references accounting_periods(id),
journal_date        date not null,
journal_type        varchar(30) not null,              -- manual, auto, opening, closing, reversal
source_type         varchar(50),                       -- order, payment, purchase, return, stock
source_id           bigint,
status              varchar(30) not null default 'draft',
description         text,
currency            varchar(3) not null default 'DZD',
exchange_rate       numeric(18,8) not null default 1,
total_debit         numeric(18,4) not null default 0,
total_credit        numeric(18,4) not null default 0,
reversed_journal_id bigint references journals(id),
reversal_journal_id bigint references journals(id),
created_by          bigint references users(id),
approved_by         bigint references users(id),
posted_at           timestamptz,
posted_by           bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (public_id)

journal_items:
id                  bigint generated always as identity primary key,
journal_id          bigint not null references journals(id),
line_number         integer not null,
account_id          bigint not null references accounts(id),
debit               numeric(18,4) not null default 0,
credit              numeric(18,4) not null default 0,
description         text,
subledger_entity_id bigint references subledger_entities(id),
source_line_type    varchar(50),
source_line_id      bigint,
currency            varchar(3) not null default 'DZD',
exchange_rate       numeric(18,8) not null default 1,
amount_currency     numeric(18,4),
sort_order          smallint not null default 0,
check (debit >= 0 and credit >= 0),
check (debit = 0 or credit = 0),
unique (journal_id, line_number)
```

#### `dimension_types`, `dimensions`, `journal_item_dimensions`

تدعم تقارير ربحية حسب بائع، ولاية، مخزن، مسار شحن، أو مركز تكلفة.

```sql
dimension_types:
id                  bigint generated always as identity primary key,
code                varchar(50) not null unique,       -- cost_center, wilaya, salesperson, warehouse, route
name_ar             varchar(120) not null,
is_required         boolean not null default false,
is_active           boolean not null default true

dimensions:
id                  bigint generated always as identity primary key,
dimension_type_id   bigint not null references dimension_types(id),
code                varchar(60) not null,
name_ar             varchar(160) not null,
linked_entity_type  varchar(50),
linked_entity_id    bigint,
is_active           boolean not null default true,
unique (dimension_type_id, code)

journal_item_dimensions:
journal_item_id     bigint not null references journal_items(id),
dimension_id        bigint not null references dimensions(id),
primary key (journal_item_id, dimension_id)
```

#### `tax_codes`, `tax_rates`, `tax_code_accounts`

```sql
tax_codes:
id                  bigint generated always as identity primary key,
code                varchar(40) not null unique,       -- vat_19_sales
name_ar             varchar(120) not null,
tax_type            varchar(30) not null,              -- vat, stamp, withholding
direction           varchar(20) not null,              -- sale, purchase, both
is_active           boolean not null default true

tax_rates:
id                  bigint generated always as identity primary key,
tax_code_id          bigint not null references tax_codes(id),
rate_percent        numeric(8,4) not null,
valid_from          date not null,
valid_to            date,
is_inclusive        boolean not null default false

tax_code_accounts:
tax_code_id          bigint not null references tax_codes(id),
direction           varchar(20) not null,              -- collected, deductible, payable
account_id          bigint not null references accounts(id),
primary key (tax_code_id, direction)
```

#### `accounting_settings`, `accounting_rules`, `accounting_rule_items`

`accounting_settings` يحفظ الحسابات الافتراضية، و`accounting_rules` تصف كيف يولد النظام القيود تلقائيًا.

```sql
accounting_settings:
key                 varchar(100) primary key,
account_id          bigint references accounts(id),
label               varchar(200) not null,
group_name          varchar(80) not null,
is_required         boolean not null default true,
allowed_classification varchar(30),
requires_control    boolean not null default false,
updated_by          bigint references users(id),
updated_at          timestamptz not null default now()

accounting_rules:
id                  bigint generated always as identity primary key,
code                varchar(80) not null unique,       -- sale_confirmed, customer_payment, purchase_received
name_ar             varchar(160) not null,
source_type         varchar(50) not null,
journal_book_id     bigint references journal_books(id),
is_active           boolean not null default true,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()

accounting_rule_items:
id                  bigint generated always as identity primary key,
rule_id             bigint not null references accounting_rules(id),
line_number         integer not null,
side                varchar(10) not null,              -- debit, credit
account_source      varchar(30) not null,              -- setting, product_category, fixed, tax_code, payment_method
setting_key         varchar(100),
fixed_account_id    bigint references accounts(id),
amount_source       varchar(60) not null,              -- total, net, tax, cogs, paid_amount, discount
subledger_source    varchar(60),                       -- customer, supplier, tax, none
description_template text,
unique (rule_id, line_number)
```

#### `opening_balances`, `subledger_opening_balances`, `account_balances`

```sql
opening_balances:
id                  bigint generated always as identity primary key,
fiscal_year_id      bigint not null references fiscal_years(id),
account_id          bigint not null references accounts(id),
debit_balance       numeric(18,4) not null default 0,
credit_balance      numeric(18,4) not null default 0,
notes               text,
created_by          bigint references users(id),
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (fiscal_year_id, account_id)

subledger_opening_balances:
id                  bigint generated always as identity primary key,
fiscal_year_id      bigint not null references fiscal_years(id),
control_account_id  bigint not null references accounts(id),
subledger_entity_id bigint not null references subledger_entities(id),
debit_balance       numeric(18,4) not null default 0,
credit_balance      numeric(18,4) not null default 0,
notes               text,
created_at          timestamptz not null default now(),
unique (fiscal_year_id, control_account_id, subledger_entity_id)

account_balances:
account_id          bigint not null references accounts(id),
fiscal_year_id      bigint not null references fiscal_years(id),
period_id           bigint references accounting_periods(id),
opening_debit       numeric(18,4) not null default 0,
opening_credit      numeric(18,4) not null default 0,
period_debit        numeric(18,4) not null default 0,
period_credit       numeric(18,4) not null default 0,
closing_debit       numeric(18,4) not null default 0,
closing_credit      numeric(18,4) not null default 0,
last_recomputed_at  timestamptz,
primary key (account_id, fiscal_year_id, period_id)
```

#### `reconciliation_matches` و `reconciliation_items`

```sql
reconciliation_matches:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
reconciliation_type varchar(30) not null,              -- customer, supplier, bank
status              varchar(30) not null default 'matched',
matched_at          timestamptz not null default now(),
matched_by          bigint references users(id),
notes               text,
unique (public_id)

reconciliation_items:
id                  bigint generated always as identity primary key,
match_id            bigint not null references reconciliation_matches(id),
journal_item_id     bigint not null references journal_items(id),
amount              numeric(18,4) not null,
side                varchar(10) not null               -- debit, credit
```

#### `bank_accounts`, `cash_boxes`, `payment_methods`

```sql
bank_accounts:
id                  bigint generated always as identity primary key,
name                varchar(160) not null,
bank_name           varchar(160),
account_number      varchar(80),
iban                varchar(80),
ledger_account_id   bigint not null references accounts(id),
is_active           boolean not null default true

cash_boxes:
id                  bigint generated always as identity primary key,
name                varchar(120) not null,
ledger_account_id   bigint not null references accounts(id),
responsible_user_id bigint references users(id),
is_active           boolean not null default true

payment_methods:
id                  bigint generated always as identity primary key,
code                varchar(40) not null unique,       -- cash, bank_transfer, cheque
name_ar             varchar(120) not null,
default_account_id  bigint references accounts(id),
requires_reference  boolean not null default false,
is_active           boolean not null default true
```

#### `product_account_mappings`, `category_account_mappings`, `inventory_valuation_layers`

تربط المخزون والمبيعات بالمحاسبة باحترافية.

```sql
category_account_mappings:
category_id         bigint not null references categories(id),
sales_revenue_account_id bigint references accounts(id),
sales_return_account_id  bigint references accounts(id),
inventory_account_id     bigint references accounts(id),
cogs_account_id          bigint references accounts(id),
purchase_return_account_id bigint references accounts(id),
primary key (category_id)

product_account_mappings:
product_id          bigint primary key references products(id),
sales_revenue_account_id bigint references accounts(id),
sales_return_account_id  bigint references accounts(id),
inventory_account_id     bigint references accounts(id),
cogs_account_id          bigint references accounts(id)

inventory_valuation_layers:
id                  bigint generated always as identity primary key,
product_id          bigint not null references products(id),
warehouse_id        bigint not null references warehouses(id),
source_type         varchar(50) not null,
source_id           bigint not null,
qty                 numeric(14,3) not null,
unit_cost           numeric(18,4) not null,
remaining_qty       numeric(14,3) not null,
created_at          timestamptz not null default now()
```

#### `year_close_runs`

```sql
id                  bigint generated always as identity primary key,
fiscal_year_id      bigint not null references fiscal_years(id),
run_at              timestamptz not null default now(),
run_by              bigint references users(id),
status              varchar(30) not null,              -- success, failed, partial
closing_journal_id  bigint references journals(id),
opening_journal_id  bigint references journals(id),
checks_json         jsonb,
notes               text
```

---

### Notifications

إشعارات المشترك تخص مستخدمي شركة واحدة داخل schema المشترك. أمثلة: تغير سعر صنف، إضافة صنف، تعديل صلاحيات، طلبية جديدة، انخفاض مخزون، قيد محاسبي يحتاج مراجعة.

```sql
notification_types:
id                  bigint generated always as identity primary key,
code                varchar(120) not null unique,
category            varchar(60) not null,       -- orders, products, inventory, manufacturing, users, accounting, partnerships, partner_documents, support
severity            varchar(20) not null,       -- info, success, warning, critical, action_required
default_channels    jsonb not null,             -- ["in_app"], ["in_app","email"]
title_template      text not null,
body_template       text,
short_template      text,                         -- نسخة مختصرة للـ navbar/mobile
reason_template     text,                         -- لماذا وصلني هذا الإشعار؟
target_audience     varchar(80) not null,       -- actor, admins, sales_owner, role, permission, explicit
target_role_code    varchar(50),
target_permission_code varchar(100),
action_type         varchar(60),
default_actions_json jsonb,                      -- open, approve, reject, snooze, reorder...
privacy_policy      varchar(40) not null default 'internal',
                      -- internal, partner_safe, admin_only, security_sensitive
can_user_mute       boolean not null default true,
retention_policy_code varchar(60),
escalation_policy_json jsonb,
is_actionable       boolean not null default false,
is_digestible       boolean not null default true,
dedupe_window_minutes integer not null default 0,
is_active           boolean not null default true,
created_at          timestamptz not null default now()

notifications:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
notification_type_id bigint references notification_types(id),
platform_notification_id bigint references platform.platform_notifications(id),
category            varchar(60) not null,
severity            varchar(20) not null,
title               varchar(250) not null,
body                text,
entity_type         varchar(80),
entity_id           bigint,
source_type         varchar(80),                -- product, order, stock, user, partnership, accounting
source_id           bigint,
actor_user_id       bigint references users(id),
source_event_code   varchar(120),               -- product.price_changed...
source_event_id     varchar(120),
action_url          text,
summary_text        varchar(300),
reason_text         text,                        -- لأنك تملك صلاحية/دور/علاقة محددة
payload_json        jsonb,
dedupe_key          varchar(200),
group_key           varchar(200),
correlation_id      varchar(80),
status              varchar(30) not null default 'active',
                      -- active, expired, resolved, cancelled
created_at          timestamptz not null default now(),
retention_until     timestamptz,
expires_at          timestamptz,
unique (public_id)

notification_recipients:
id                  bigint generated always as identity primary key,
notification_id     bigint not null references notifications(id),
recipient_user_id   bigint not null references users(id),
delivery_status     varchar(30) not null default 'pending',
                      -- pending, delivered, failed, muted
state               varchar(30) not null default 'new',
                      -- new, delivered, read, archived, snoozed, actioned, expired
recipient_reason    text,
is_read             boolean not null default false,
read_at             timestamptz,
is_archived         boolean not null default false,
archived_at         timestamptz,
snoozed_until       timestamptz,
actioned_at         timestamptz,
last_seen_at        timestamptz,
escalation_level    integer not null default 0,
escalated_at        timestamptz,
created_at          timestamptz not null default now(),
unique (notification_id, recipient_user_id)

notification_preferences:
id                  bigint generated always as identity primary key,
user_id             bigint not null references users(id),
notification_type_id bigint not null references notification_types(id),
channel             varchar(30) not null,       -- in_app, email, whatsapp, push
is_enabled          boolean not null default true,
minimum_severity    varchar(20) default 'info',
digest_mode         varchar(20) not null default 'instant', -- instant, hourly, daily, muted
quiet_hours_json    jsonb,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (user_id, notification_type_id, channel)

notification_rules:
id                  bigint generated always as identity primary key,
code                varchar(120) not null unique,
notification_type_id bigint not null references notification_types(id),
trigger_event       varchar(120) not null,      -- product.price_changed, inventory.low_stock...
condition_json      jsonb,                      -- threshold/min severity/field filters
target_json         jsonb not null,             -- roles/users/permissions/dynamic owner
action_policy_json  jsonb,
escalation_policy_json jsonb,
is_active           boolean not null default true,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()

notification_templates:
id                  bigint generated always as identity primary key,
notification_type_id bigint not null references notification_types(id),
locale              varchar(10) not null default 'ar',
channel             varchar(30) not null default 'in_app',
title_template      text not null,
short_template      text,
body_template       text,
reason_template     text,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (notification_type_id, locale, channel)

notification_actions:
id                  bigint generated always as identity primary key,
notification_id     bigint not null references notifications(id),
recipient_id        bigint references notification_recipients(id),
action_code         varchar(60) not null,       -- open, approve, reject, snooze, reorder, review
action_label        varchar(120) not null,
action_url          text,
status              varchar(30) not null default 'available',
                      -- available, executed, disabled, expired
performed_at        timestamptz,
performed_by_user_id bigint references users(id),
result_json         jsonb,
created_at          timestamptz not null default now()

notification_escalations:
id                  bigint generated always as identity primary key,
notification_id     bigint not null references notifications(id),
recipient_id        bigint references notification_recipients(id),
from_user_id        bigint references users(id),
to_user_id          bigint references users(id),
to_role_code        varchar(50),
level               integer not null default 1,
reason              text not null,
status              varchar(30) not null default 'pending',
                      -- pending, sent, cancelled, resolved
scheduled_at        timestamptz not null,
sent_at             timestamptz,
created_at          timestamptz not null default now()

notification_retention_policies:
id                  bigint generated always as identity primary key,
code                varchar(60) not null unique,
category            varchar(60) not null,
severity            varchar(20),
keep_days           integer not null,
archive_after_days  integer,
delete_outbox_after_days integer,
is_legal_hold       boolean not null default false,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now()

notification_outbox:
id                  bigint generated always as identity primary key,
notification_id     bigint not null references notifications(id),
recipient_id        bigint references notification_recipients(id),
channel             varchar(30) not null,
status              varchar(30) not null default 'pending',
attempt_count       integer not null default 0,
next_attempt_at     timestamptz not null default now(),
last_error          text,
created_at          timestamptz not null default now(),
delivered_at        timestamptz
```

فهارس مهمة:

```sql
create index idx_notifications_created on notifications(created_at);
create index idx_notifications_category on notifications(category);
create index idx_notifications_dedupe on notifications(dedupe_key);
create index idx_notifications_group on notifications(group_key);
create index idx_notification_recipients_user on notification_recipients(recipient_user_id, is_read);
create index idx_notification_recipients_state on notification_recipients(state, snoozed_until);
create index idx_notification_outbox_pending on notification_outbox(status, next_attempt_at);
```

### Resource Edit Locks

قفل تحرير سجلات المشترك. يمنع تعديل نفس الطلبية أو أمر الشراء أو القيد من مستخدمين في نفس اللحظة، مع السماح للآخرين بالعرض فقط.

```sql
resource_lock_policies:
id                  bigint generated always as identity primary key,
resource_type       varchar(80) not null,       -- sales_order, purchase_order, product, journal...
lock_scope          varchar(40) not null,       -- edit, approve, post, close, reconcile
ttl_seconds         integer not null default 300,
heartbeat_interval_seconds integer not null default 30,
stale_after_seconds integer not null default 90,
allow_force_takeover boolean not null default false,
force_takeover_permission varchar(100),
show_locker_identity boolean not null default true,
blocked_actions_json jsonb not null,            -- ["save", "confirm", "post"]
is_active           boolean not null default true,
created_at          timestamptz not null default now(),
updated_at          timestamptz not null default now(),
unique (resource_type, lock_scope)

resource_locks:
id                  bigint generated always as identity primary key,
public_id           uuid not null default gen_random_uuid(),
resource_type       varchar(80) not null,
resource_id         bigint,
resource_public_id  uuid,
resource_key        varchar(160),               -- fallback مثل رقم الطلبية
lock_scope          varchar(40) not null,
status              varchar(30) not null default 'active',
                      -- active, released, expired, force_released, taken_over
locked_by_user_id   bigint not null references users(id),
locked_by_session_id varchar(120) not null,
lock_token          uuid not null default gen_random_uuid(),
device_label        varchar(160),
acquired_at         timestamptz not null default now(),
heartbeat_at        timestamptz not null default now(),
expires_at          timestamptz not null,
released_at         timestamptz,
release_reason      varchar(80),
taken_over_by_user_id bigint references users(id),
taken_over_at       timestamptz,
metadata_json       jsonb,
unique (public_id),
unique (lock_token)

resource_lock_events:
id                  bigint generated always as identity primary key,
lock_id             bigint not null references resource_locks(id),
event_type          varchar(40) not null,       -- acquired, heartbeat, released, expired, takeover_denied, taken_over
actor_user_id       bigint references users(id),
details_json        jsonb,
created_at          timestamptz not null default now()
```

فهارس مهمة:

```sql
create index idx_resource_locks_resource on resource_locks(resource_type, resource_id, lock_scope, status);
create index idx_resource_locks_key on resource_locks(resource_type, resource_key, lock_scope, status);
create index idx_resource_locks_expiry on resource_locks(status, expires_at);
create index idx_resource_lock_events_lock on resource_lock_events(lock_id, created_at);
```

### Media, AI, Audit

```sql
media_assets:
id              bigint generated always as identity primary key,
public_id       uuid not null default gen_random_uuid(),
owner_type      varchar(80),
owner_id        bigint,
file_path       text not null,
public_url      text,
mime_type       varchar(120),
size_bytes      bigint,
metadata_json   jsonb,
created_by      bigint references users(id),
created_at      timestamptz not null default now(),
unique (public_id)

ai_jobs:
id              bigint generated always as identity primary key,
public_id       uuid not null default gen_random_uuid(),
job_type        varchar(80) not null,
job_status      varchar(40) not null default 'queued',
provider        varchar(50),
model           varchar(80),
initiated_by    bigint references users(id),
source_file_id  bigint references media_assets(id),
options_json    jsonb,
summary_json    jsonb,
started_at      timestamptz,
finished_at     timestamptz,
created_at      timestamptz not null default now(),
updated_at      timestamptz not null default now(),
unique (public_id)

ai_job_items:
id                  bigint generated always as identity primary key,
ai_job_id            bigint not null references ai_jobs(id),
item_status          varchar(40) not null default 'pending',
raw_input_json       jsonb,
parsed_output_json   jsonb,
review_decision      varchar(30) not null default 'pending',
error_message        text,
created_at           timestamptz not null default now(),
updated_at           timestamptz not null default now()

audit_logs:
id                  bigint generated always as identity primary key,
actor_user_id       bigint references users(id),
entity_type         varchar(80) not null,
entity_id           bigint,
action              varchar(120) not null,
old_values_json     jsonb,
new_values_json     jsonb,
meta_json           jsonb,
ip_address          varchar(50),
user_agent          text,
correlation_id      varchar(80),
created_at          timestamptz not null default now()
```

فهارس إلزامية في `audit_logs`:

```sql
create index idx_audit_entity on audit_logs(entity_type, entity_id);
create index idx_audit_actor on audit_logs(actor_user_id);
create index idx_audit_created_at on audit_logs(created_at);
```

---

## 3) قواعد عزل البيانات

1. مستخدم tenant لا يرى إلا schema شركته.
2. مستخدم platform لا يدخل بيانات tenant إلا عبر مسار دعم واضح ومسجل في `platform_audit_logs`.
3. لا توجد علاقات foreign key مباشرة من جداول tenant إلى `platform.tenants` لأن الجداول داخل schema منفصل. الربط يتم في التطبيق عبر tenant context.
4. لا يتم تنفيذ query على schema مشترك إلا بعد التحقق من أن `TenantContext` مضبوط.
5. كل عمليات الشراكة بين مشتركين تمر عبر `platform.tenant_partnerships`، وكل مستند بيع/شراء متزامن بين مشتركين يمر عبر `platform.partner_document_links`.
6. إعدادات AI ومفاتيح API الخاصة بشركة معينة تخزن في `settings` داخل schema المشترك، وتشفّر عند الحاجة.
7. backup/restore يجب أن يدعم schema واحد لمشترك محدد، وليس قاعدة البيانات كاملة فقط.

---

## 4) بديل غير معتمد حاليًا

إذا تقرر لاحقًا ترك `schema per tenant` والانتقال إلى `shared schema`، يجب إضافة `tenant_id` إلى كل الجداول التشغيلية وتفعيل Row Level Security. هذا ليس القرار الحالي لأن الواجهة والخطة يعتمدان مفهوم schema منفصل لكل مشترك.
