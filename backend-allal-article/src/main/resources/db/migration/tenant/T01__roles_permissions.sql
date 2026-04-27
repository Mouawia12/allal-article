-- T01: Roles, permissions, and RBAC tables (run inside tenant schema)

create table roles (
    id          bigint generated always as identity primary key,
    code        varchar(50) not null unique,
    name_ar     varchar(100) not null,
    description text,
    is_system   boolean not null default false,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table permissions (
    id                          bigint generated always as identity primary key,
    code                        varchar(100) not null unique,
    module                      varchar(50) not null,
    name_ar                     varchar(150) not null,
    description                 text,
    required_plan_feature_code  varchar(80),
    ui_route                    varchar(180),
    ui_action_key               varchar(120),
    is_visible_to_all           boolean not null default true,
    denied_title                varchar(180),
    denied_message              text,
    denied_action_type          varchar(40) default 'contact_admin',
    ui_metadata_json            jsonb,
    created_at                  timestamptz not null default now()
);

create table role_permissions (
    role_id         bigint not null references roles(id),
    permission_id   bigint not null references permissions(id),
    primary key (role_id, permission_id)
);
