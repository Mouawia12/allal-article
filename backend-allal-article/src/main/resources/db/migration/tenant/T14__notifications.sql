-- T14: Tenant notification system

create table notification_types (
    id                      bigint generated always as identity primary key,
    code                    varchar(120) not null unique,
    category                varchar(60)  not null,
    severity                varchar(20)  not null,
    default_channels        jsonb        not null,
    title_template          text         not null,
    body_template           text,
    short_template          text,
    reason_template         text,
    target_audience         varchar(80)  not null,
    target_role_code        varchar(50),
    target_permission_code  varchar(100),
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

create table notifications (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    notification_type_id    bigint      references notification_types(id),
    platform_notification_id bigint,   -- references platform.platform_notifications(id) — no FK across schemas
    category                varchar(60) not null,
    severity                varchar(20) not null,
    title                   varchar(250) not null,
    body                    text,
    entity_type             varchar(80),
    entity_id               bigint,
    source_type             varchar(80),
    source_id               bigint,
    actor_user_id           bigint      references users(id),
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
    created_at              timestamptz not null default now(),
    retention_until         timestamptz,
    expires_at              timestamptz,
    unique (public_id)
);

create index idx_notifications_created  on notifications(created_at);
create index idx_notifications_category on notifications(category);
create index idx_notifications_dedupe   on notifications(dedupe_key);
create index idx_notifications_group    on notifications(group_key);

create table notification_recipients (
    id                  bigint generated always as identity primary key,
    notification_id     bigint      not null references notifications(id),
    recipient_user_id   bigint      not null references users(id),
    delivery_status     varchar(30) not null default 'pending',
    state               varchar(30) not null default 'new',
    recipient_reason    text,
    is_read             boolean     not null default false,
    read_at             timestamptz,
    is_archived         boolean     not null default false,
    archived_at         timestamptz,
    snoozed_until       timestamptz,
    actioned_at         timestamptz,
    last_seen_at        timestamptz,
    escalation_level    integer     not null default 0,
    escalated_at        timestamptz,
    created_at          timestamptz not null default now(),
    unique (notification_id, recipient_user_id)
);

create index idx_notification_recipients_user  on notification_recipients(recipient_user_id, is_read);
create index idx_notification_recipients_state on notification_recipients(state, snoozed_until);

create table notification_preferences (
    id                      bigint generated always as identity primary key,
    user_id                 bigint      not null references users(id),
    notification_type_id    bigint      not null references notification_types(id),
    channel                 varchar(30) not null,
    is_enabled              boolean     not null default true,
    minimum_severity        varchar(20) default 'info',
    digest_mode             varchar(20) not null default 'instant',
    quiet_hours_json        jsonb,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (user_id, notification_type_id, channel)
);

create table notification_rules (
    id                      bigint generated always as identity primary key,
    code                    varchar(120) not null unique,
    notification_type_id    bigint       not null references notification_types(id),
    trigger_event           varchar(120) not null,
    condition_json          jsonb,
    target_json             jsonb        not null,
    action_policy_json      jsonb,
    escalation_policy_json  jsonb,
    is_active               boolean      not null default true,
    created_at              timestamptz  not null default now(),
    updated_at              timestamptz  not null default now()
);

create table notification_templates (
    id                      bigint generated always as identity primary key,
    notification_type_id    bigint      not null references notification_types(id),
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

create table notification_actions (
    id                      bigint generated always as identity primary key,
    notification_id         bigint      not null references notifications(id),
    recipient_id            bigint      references notification_recipients(id),
    action_code             varchar(60) not null,
    action_label            varchar(120) not null,
    action_url              text,
    status                  varchar(30) not null default 'available',
    performed_at            timestamptz,
    performed_by_user_id    bigint      references users(id),
    result_json             jsonb,
    created_at              timestamptz not null default now()
);

create table notification_escalations (
    id              bigint generated always as identity primary key,
    notification_id bigint      not null references notifications(id),
    recipient_id    bigint      references notification_recipients(id),
    from_user_id    bigint      references users(id),
    to_user_id      bigint      references users(id),
    to_role_code    varchar(50),
    level           integer     not null default 1,
    reason          text        not null,
    status          varchar(30) not null default 'pending',
    scheduled_at    timestamptz not null,
    sent_at         timestamptz,
    created_at      timestamptz not null default now()
);

create table notification_retention_policies (
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

create table notification_outbox (
    id              bigint generated always as identity primary key,
    notification_id bigint      not null references notifications(id),
    recipient_id    bigint      references notification_recipients(id),
    channel         varchar(30) not null,
    status          varchar(30) not null default 'pending',
    attempt_count   integer     not null default 0,
    next_attempt_at timestamptz not null default now(),
    last_error      text,
    created_at      timestamptz not null default now(),
    delivered_at    timestamptz
);

create index idx_notification_outbox_pending on notification_outbox(status, next_attempt_at);
