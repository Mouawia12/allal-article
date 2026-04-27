-- T06: Price lists and price list items

create table price_lists (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    code                varchar(60) not null,
    name                varchar(160) not null,
    price_list_type     varchar(30) not null default 'sales',
                          -- sales, purchase, both
    currency            varchar(3)  not null default 'DZD',
    description         text,
    is_default          boolean     not null default false,
    is_active           boolean     not null default true,
    starts_at           timestamptz,
    ends_at             timestamptz,
    created_by          bigint      references users(id),
    updated_by          bigint      references users(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz,
    unique (public_id),
    unique (code),
    check (price_list_type in ('sales', 'purchase', 'both'))
);

create index idx_price_lists_type_active on price_lists(price_list_type, is_active, name);

create table price_list_items (
    id                  bigint generated always as identity primary key,
    public_id           uuid          not null default gen_random_uuid(),
    price_list_id       bigint        not null references price_lists(id),
    product_id          bigint        not null references products(id),
    unit_price_amount   numeric(14,2),
    min_qty             numeric(14,3) not null default 1,
    is_active           boolean       not null default true,
    note                text,
    created_by          bigint        references users(id),
    updated_by          bigint        references users(id),
    created_at          timestamptz   not null default now(),
    updated_at          timestamptz   not null default now(),
    unique (public_id),
    unique (price_list_id, product_id, min_qty),
    check (unit_price_amount is null or unit_price_amount >= 0),
    check (min_qty > 0)
);

create index idx_price_list_items_lookup  on price_list_items(price_list_id, product_id, min_qty);
create index idx_price_list_items_product on price_list_items(product_id);
