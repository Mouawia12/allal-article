-- T03: Wilayas and settings

create table wilayas (
    id          bigint generated always as identity primary key,
    code        varchar(3)  not null unique,
    name_ar     varchar(100) not null,
    name_fr     varchar(100),
    is_active   boolean not null default true,
    updated_by  bigint references users(id),
    updated_at  timestamptz not null default now()
);

create table settings (
    id          bigint generated always as identity primary key,
    key         varchar(150) not null unique,
    group_name  varchar(80)  not null,
    value_json  jsonb,
    is_encrypted boolean not null default false,
    updated_by  bigint references users(id),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
