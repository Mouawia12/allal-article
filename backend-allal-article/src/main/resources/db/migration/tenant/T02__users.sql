-- T02: Users, profiles, permissions, and access denial events

create table users (
    id              bigint generated always as identity primary key,
    public_id       uuid        not null default gen_random_uuid(),
    name            varchar(150) not null,
    email           varchar(200) not null,
    phone           varchar(30),
    password_hash   text        not null,
    primary_role_id bigint      references roles(id),
    user_type       varchar(30) not null default 'seller',
                      -- admin_user, seller
    status          varchar(30) not null default 'active',
    avatar_url      text,
    last_login_at   timestamptz,
    created_by      bigint      references users(id),
    updated_by      bigint      references users(id),
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    deleted_at      timestamptz,
    unique (public_id),
    unique (email)
);

create table user_profiles (
    id              bigint generated always as identity primary key,
    user_id         bigint      not null unique references users(id),
    job_title       varchar(120),
    bio             text,
    address         text,
    city            varchar(120),
    country         varchar(120) default 'DZ',
    preferences_json jsonb,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table user_permissions (
    user_id         bigint not null references users(id),
    permission_id   bigint not null references permissions(id),
    effect          varchar(10) not null,   -- allow, deny
    primary key (user_id, permission_id)
);

create table access_denial_events (
    id              bigint generated always as identity primary key,
    public_id       uuid        not null default gen_random_uuid(),
    user_id         bigint      references users(id),
    permission_code varchar(120),
    feature_code    varchar(80),
    partner_uuid    uuid,
    route           varchar(180),
    action_key      varchar(120),
    denial_reason   varchar(40) not null,
                      -- plan_required, user_permission_required, partner_permission_required, scope_denied, tenant_suspended
    message_shown   text,
    metadata_json   jsonb,
    created_at      timestamptz not null default now(),
    unique (public_id)
);

create index idx_access_denial_events_user   on access_denial_events(user_id, created_at desc);
create index idx_access_denial_events_reason on access_denial_events(denial_reason, feature_code, created_at desc);
