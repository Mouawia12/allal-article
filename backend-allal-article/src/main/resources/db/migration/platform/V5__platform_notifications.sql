-- V5: Platform notifications system

create table platform.notification_types (
    id                      bigint generated always as identity primary key,
    code                    varchar(120) not null unique,
    scope                   varchar(30)  not null,   -- platform, tenant, inter_tenant
    category                varchar(60)  not null,
    severity                varchar(20)  not null,   -- info, success, warning, critical, action_required
    default_channels        jsonb        not null,
    title_template          text         not null,
    body_template           text,
    short_template          text,
    reason_template         text,
    action_type             varchar(60),
    default_actions_json    jsonb,
    privacy_policy          varchar(40)  not null default 'internal',
    can_user_mute           boolean      not null default true,
    retention_policy_code   varchar(60),
    escalation_policy_json  jsonb,
    is_actionable           boolean      not null default false,
    is_digestible           boolean      not null default true,
    dedupe_window_minutes   integer      not null default 0,
    is_active               boolean      not null default true,
    created_at              timestamptz  not null default now()
);

create table platform.platform_notifications (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    notification_type_id    bigint      not null references platform.notification_types(id),
    scope                   varchar(30) not null,   -- platform, inter_tenant
    tenant_id               bigint      references platform.tenants(id),
    source_tenant_id        bigint      references platform.tenants(id),
    target_tenant_id        bigint      references platform.tenants(id),
    severity                varchar(20) not null,
    title                   varchar(250) not null,
    body                    text,
    entity_type             varchar(80),
    entity_id               bigint,
    source_event_code       varchar(120),
    source_event_id         varchar(120),
    action_url              text,
    summary_text            varchar(300),
    reason_text             text,
    payload_json            jsonb,
    dedupe_key              varchar(200),
    group_key               varchar(200),
    correlation_id          varchar(80),
    status                  varchar(30) not null default 'active',
                              -- active, expired, resolved, cancelled
    created_at              timestamptz not null default now(),
    retention_until         timestamptz,
    expires_at              timestamptz,
    unique (public_id)
);

create index idx_platform_notifications_created   on platform.platform_notifications(created_at);
create index idx_platform_notifications_tenant    on platform.platform_notifications(tenant_id);
create index idx_platform_notifications_dedupe    on platform.platform_notifications(dedupe_key);
create index idx_platform_notifications_group     on platform.platform_notifications(group_key);

create table platform.platform_notification_recipients (
    id                      bigint generated always as identity primary key,
    notification_id         bigint      not null references platform.platform_notifications(id),
    recipient_type          varchar(30) not null,   -- platform_user, tenant_user
    platform_user_id        bigint      references platform.platform_users(id),
    recipient_tenant_id     bigint      references platform.tenants(id),
    tenant_user_public_id   uuid,
    delivery_status         varchar(30) not null default 'pending',
    state                   varchar(30) not null default 'new',
    recipient_reason        text,
    is_read                 boolean     not null default false,
    read_at                 timestamptz,
    is_archived             boolean     not null default false,
    archived_at             timestamptz,
    snoozed_until           timestamptz,
    actioned_at             timestamptz,
    last_seen_at            timestamptz,
    escalation_level        integer     not null default 0,
    escalated_at            timestamptz,
    created_at              timestamptz not null default now(),
    unique (notification_id, recipient_type, platform_user_id, recipient_tenant_id, tenant_user_public_id)
);

create index idx_platform_notification_recipients_platform_user on platform.platform_notification_recipients(platform_user_id, is_read);
create index idx_platform_notification_recipients_tenant_user   on platform.platform_notification_recipients(recipient_tenant_id, tenant_user_public_id, is_read);
create index idx_platform_notification_recipients_state         on platform.platform_notification_recipients(state, snoozed_until);

create table platform.platform_notification_templates (
    id                      bigint generated always as identity primary key,
    notification_type_id    bigint      not null references platform.notification_types(id),
    locale                  varchar(10) not null default 'ar',
    channel                 varchar(30) not null default 'in_app',
    title_template          text        not null,
    short_template          text,
    body_template           text,
    reason_template         text,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (notification_type_id, locale, channel)
);

create table platform.platform_notification_actions (
    id                      bigint generated always as identity primary key,
    notification_id         bigint      not null references platform.platform_notifications(id),
    recipient_id            bigint      references platform.platform_notification_recipients(id),
    action_code             varchar(60) not null,
    action_label            varchar(120) not null,
    action_url              text,
    status                  varchar(30) not null default 'available',
    performed_at            timestamptz,
    performed_by_type       varchar(30),
    performed_by_id         uuid,
    result_json             jsonb,
    created_at              timestamptz not null default now()
);

create table platform.platform_notification_escalations (
    id                      bigint generated always as identity primary key,
    notification_id         bigint      not null references platform.platform_notifications(id),
    recipient_id            bigint      references platform.platform_notification_recipients(id),
    from_recipient_id       bigint,
    to_recipient_type       varchar(30) not null,
    to_recipient_ref        varchar(120) not null,
    level                   integer     not null default 1,
    reason                  text        not null,
    status                  varchar(30) not null default 'pending',
    scheduled_at            timestamptz not null,
    sent_at                 timestamptz,
    created_at              timestamptz not null default now()
);

create table platform.platform_notification_retention_policies (
    id                      bigint generated always as identity primary key,
    code                    varchar(60) not null unique,
    category                varchar(60) not null,
    severity                varchar(20),
    keep_days               integer     not null,
    archive_after_days      integer,
    delete_outbox_after_days integer,
    is_legal_hold           boolean     not null default false,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create table platform.platform_notification_preferences (
    id                      bigint generated always as identity primary key,
    platform_user_id        bigint      not null references platform.platform_users(id),
    notification_type_id    bigint      not null references platform.notification_types(id),
    channel                 varchar(30) not null,
    is_enabled              boolean     not null default true,
    minimum_severity        varchar(20) default 'info',
    digest_mode             varchar(20) not null default 'instant',
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (platform_user_id, notification_type_id, channel)
);

create table platform.platform_notification_outbox (
    id              bigint generated always as identity primary key,
    notification_id bigint      not null references platform.platform_notifications(id),
    recipient_id    bigint      references platform.platform_notification_recipients(id),
    channel         varchar(30) not null,
    status          varchar(30) not null default 'pending',
    attempt_count   integer     not null default 0,
    next_attempt_at timestamptz not null default now(),
    last_error      text,
    created_at      timestamptz not null default now(),
    delivered_at    timestamptz
);

create index idx_platform_notification_outbox_pending on platform.platform_notification_outbox(status, next_attempt_at);
