-- T05: Categories, product units, products, variants, favorites, images, price history

create table categories (
    id          bigint generated always as identity primary key,
    public_id   uuid        not null default gen_random_uuid(),
    parent_id   bigint      references categories(id),
    name        varchar(150) not null,
    slug        varchar(180),
    description text,
    sort_order  integer     not null default 0,
    is_active   boolean     not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (public_id),
    unique (slug)
);

create index idx_categories_parent on categories(parent_id);

create table product_units_catalog (
    id          bigint generated always as identity primary key,
    name        varchar(80) not null,
    symbol      varchar(20),
    is_system   boolean     not null default false,
    created_at  timestamptz not null default now(),
    unique (name)
);

create table products (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    sku                     varchar(100) not null,
    name                    varchar(200) not null,
    category_id             bigint      references categories(id),
    base_unit_id            bigint      references product_units_catalog(id),
    barcode                 varchar(100),
    has_variants            boolean     not null default false,
    weight_per_unit         numeric(14,3),
    units_per_package       numeric(14,3) not null default 1,
    package_unit            varchar(50) default 'علبة',
    current_price_amount    numeric(14,2),
    price_currency          varchar(3)  not null default 'DZD',
    min_stock_qty           numeric(14,3) not null default 0,
    description             text,
    status                  varchar(30) not null default 'active',
    ai_metadata_json        jsonb,
    created_by              bigint      references users(id),
    updated_by              bigint      references users(id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    deleted_at              timestamptz,
    unique (public_id),
    unique (sku)
);

create index idx_products_name      on products(name);
create index idx_products_category  on products(category_id);
create index idx_products_barcode   on products(barcode) where barcode is not null;

create table product_extra_units (
    id                  bigint generated always as identity primary key,
    product_id          bigint        not null references products(id) on delete cascade,
    unit_id             bigint        not null references product_units_catalog(id),
    conversion_factor   numeric(14,6) not null default 1,
    price_amount        numeric(14,2),
    barcode             varchar(100),
    is_base             boolean       not null default false,
    sort_order          integer       not null default 0,
    created_at          timestamptz   not null default now(),
    unique (product_id, unit_id)
);

create table product_attribute_types (
    id          bigint generated always as identity primary key,
    name        varchar(80) not null,
    values_json jsonb       not null default '[]',
    created_at  timestamptz not null default now(),
    unique (name)
);

create table product_variants (
    id          bigint generated always as identity primary key,
    public_id   uuid        not null default gen_random_uuid(),
    product_id  bigint      not null references products(id) on delete cascade,
    sku         varchar(120) not null,
    barcode     varchar(100),
    attrs_json  jsonb       not null default '{}',
    price_amount numeric(14,2),
    stock_qty   numeric(14,3) not null default 0,
    status      varchar(30) not null default 'active',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (public_id),
    unique (product_id, sku)
);

create index idx_product_variants_product on product_variants(product_id);
create index idx_product_variants_barcode on product_variants(barcode) where barcode is not null;
create index idx_product_variants_attrs   on product_variants using gin(attrs_json);

create table product_favorites (
    id              bigint generated always as identity primary key,
    public_id       uuid        not null default gen_random_uuid(),
    user_id         bigint      not null references users(id),
    product_id      bigint      not null references products(id),
    source_context  varchar(40) not null default 'manual',
    note            varchar(240),
    sort_order      integer     not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (public_id),
    unique (user_id, product_id)
);

create index idx_product_favorites_user    on product_favorites(user_id, sort_order, created_at desc);
create index idx_product_favorites_product on product_favorites(product_id);

create table media_assets (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    owner_type          varchar(80),
    owner_id            bigint,
    storage_provider    varchar(40) not null default 'cloudflare_r2',
    bucket_name         varchar(120) not null,
    object_key          text        not null,
    public_url          text,
    original_filename   varchar(240),
    mime_type           varchar(120),
    size_bytes          bigint,
    extension           varchar(20),
    title               varchar(180),
    alt_text            varchar(240),
    checksum_sha256     varchar(64),
    metadata_json       jsonb,
    created_by          bigint      references users(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz,
    unique (public_id)
);

create table product_images (
    id                  bigint generated always as identity primary key,
    product_id          bigint      not null references products(id),
    media_asset_id      bigint      not null references media_assets(id),
    source_type         varchar(30),
    original_image_id   bigint      references product_images(id),
    is_primary          boolean     not null default false,
    sort_order          integer     not null default 0,
    processing_status   varchar(30),
    metadata_json       jsonb,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table product_price_histories (
    id                      bigint generated always as identity primary key,
    product_id              bigint      not null references products(id),
    previous_price_amount   numeric(14,2),
    new_price_amount        numeric(14,2) not null,
    price_currency          varchar(3)  not null default 'DZD',
    changed_by              bigint      references users(id),
    change_reason           text,
    source_type             varchar(50),
    source_id               bigint,
    effective_at            timestamptz not null default now(),
    created_at              timestamptz not null default now()
);

create index idx_product_price_histories_product on product_price_histories(product_id, effective_at);
