-- V2: Platform users, plans, and feature catalog

create table platform.platform_users (
    id              bigint generated always as identity primary key,
    public_id       uuid        not null default gen_random_uuid(),
    name            varchar(150) not null,
    email           varchar(200) not null unique,
    password_hash   text        not null,
    role_code       varchar(50) not null,   -- owner, support, billing, viewer
    status          varchar(30) not null default 'active',
    last_login_at   timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz,
    unique (public_id)
);

create table platform.plans (
    id                  bigint generated always as identity primary key,
    code                varchar(50) not null unique,
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
);

create table platform.feature_catalog (
    id                      bigint generated always as identity primary key,
    code                    varchar(80) not null unique,
    name_ar                 varchar(120) not null,
    name_en                 varchar(120),
    category                varchar(60) not null,
    description             text,
    default_route           varchar(180),
    default_action_key      varchar(120),
    recommended_plan_code   varchar(50),
    upgrade_title           varchar(180),
    upgrade_message         text,
    is_visible_to_all       boolean not null default true,
    sort_order              integer not null default 0,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

create table platform.plan_features (
    id                  bigint generated always as identity primary key,
    plan_id             bigint not null references platform.plans(id),
    feature_code        varchar(80) not null references platform.feature_catalog(code),
    is_enabled          boolean not null default true,
    limit_value         integer,
    denied_title        varchar(180),
    denied_message      text,
    upgrade_action_url  varchar(220),
    created_at          timestamptz not null default now(),
    unique (plan_id, feature_code)
);
