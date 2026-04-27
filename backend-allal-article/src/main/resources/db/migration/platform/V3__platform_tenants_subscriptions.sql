-- V3: Tenants, subscriptions, usage snapshots, provisioning events, invite codes

create table platform.tenants (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
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
);

create index idx_platform_tenants_status        on platform.tenants(status);
create index idx_platform_tenants_plan          on platform.tenants(plan_id);
create index idx_platform_tenants_contact_email on platform.tenants(contact_email);

create table platform.subscriptions (
    id              bigint generated always as identity primary key,
    tenant_id       bigint not null references platform.tenants(id),
    plan_id         bigint not null references platform.plans(id),
    status          varchar(30) not null,  -- trial, active, past_due, suspended, cancelled
    started_at      date not null,
    renews_at       date,
    ended_at        date,
    price_monthly   numeric(14,2),
    currency        varchar(3) not null default 'DZD',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table platform.tenant_usage_snapshots (
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
);

create table platform.tenant_provisioning_events (
    id              bigint generated always as identity primary key,
    tenant_id       bigint references platform.tenants(id),
    event_type      varchar(80) not null,
    status          varchar(30) not null,  -- started, success, failed
    details_json    jsonb,
    error_message   text,
    performed_by    bigint references platform.platform_users(id),
    created_at      timestamptz not null default now()
);

create table platform.tenant_invite_codes (
    id                  bigint generated always as identity primary key,
    provider_tenant_id  bigint not null references platform.tenants(id),
    code_hash           text not null unique,
    label               varchar(150),
    permissions_json    jsonb not null,
    denial_messages_json jsonb,
    max_uses            integer,
    uses_count          integer not null default 0,
    expires_at          timestamptz,
    is_active           boolean not null default true,
    created_by_user_id  uuid,
    created_at          timestamptz not null default now()
);

create table platform.platform_audit_logs (
    id              bigint generated always as identity primary key,
    actor_user_id   bigint references platform.platform_users(id),
    tenant_id       bigint references platform.tenants(id),
    action          varchar(120) not null,
    entity_type     varchar(80) not null,
    entity_id       bigint,
    old_values_json jsonb,
    new_values_json jsonb,
    meta_json       jsonb,
    ip_address      varchar(50),
    user_agent      text,
    correlation_id  varchar(80),
    created_at      timestamptz not null default now()
);

create index idx_platform_audit_entity   on platform.platform_audit_logs(entity_type, entity_id);
create index idx_platform_audit_actor    on platform.platform_audit_logs(actor_user_id);
create index idx_platform_audit_tenant   on platform.platform_audit_logs(tenant_id);
create index idx_platform_audit_created  on platform.platform_audit_logs(created_at);
