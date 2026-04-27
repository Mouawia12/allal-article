-- V7: Platform resource locks

create table platform.platform_resource_lock_policies (
    id                          bigint generated always as identity primary key,
    resource_type               varchar(80) not null,
    lock_scope                  varchar(40) not null,
    ttl_seconds                 integer     not null default 300,
    heartbeat_interval_seconds  integer     not null default 30,
    stale_after_seconds         integer     not null default 90,
    allow_force_takeover        boolean     not null default false,
    force_takeover_permission   varchar(100),
    show_locker_identity        boolean     not null default true,
    blocked_actions_json        jsonb       not null,
    is_active                   boolean     not null default true,
    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now(),
    unique (resource_type, lock_scope)
);

create table platform.platform_resource_locks (
    id                              bigint generated always as identity primary key,
    public_id                       uuid        not null default gen_random_uuid(),
    resource_type                   varchar(80) not null,
    resource_id                     bigint,
    resource_public_id              uuid,
    resource_key                    varchar(160),
    lock_scope                      varchar(40) not null,
    status                          varchar(30) not null default 'active',
                                      -- active, released, expired, force_released, taken_over
    locked_by_platform_user_id      bigint      references platform.platform_users(id),
    locked_by_session_id            varchar(120) not null,
    lock_token                      uuid        not null default gen_random_uuid(),
    device_label                    varchar(160),
    acquired_at                     timestamptz not null default now(),
    heartbeat_at                    timestamptz not null default now(),
    expires_at                      timestamptz not null,
    released_at                     timestamptz,
    release_reason                  varchar(80),
    taken_over_by_platform_user_id  bigint      references platform.platform_users(id),
    taken_over_at                   timestamptz,
    metadata_json                   jsonb,
    unique (public_id),
    unique (lock_token)
);

create index idx_platform_resource_locks_resource on platform.platform_resource_locks(resource_type, resource_id, lock_scope, status);
create index idx_platform_resource_locks_expiry   on platform.platform_resource_locks(status, expires_at);

create table platform.platform_resource_lock_events (
    id                          bigint generated always as identity primary key,
    lock_id                     bigint      not null references platform.platform_resource_locks(id),
    event_type                  varchar(40) not null,
    actor_platform_user_id      bigint      references platform.platform_users(id),
    details_json                jsonb,
    created_at                  timestamptz not null default now()
);

create index idx_platform_resource_lock_events_lock on platform.platform_resource_lock_events(lock_id, created_at);
