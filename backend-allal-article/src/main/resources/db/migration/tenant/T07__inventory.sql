-- T07: Warehouses, stock levels, movements, transfers, and reservations

create table warehouses (
    id              bigint generated always as identity primary key,
    code            varchar(50) not null unique,
    name            varchar(150) not null,
    warehouse_type  varchar(40) not null default 'operational',
                      -- central, operational, returns, quarantine, virtual
    city            varchar(120),
    address         text,
    manager_id      bigint      references users(id),
    capacity_qty    numeric(14,3),
    is_default      boolean     not null default false,
    is_active       boolean     not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table product_stocks (
    id                  bigint generated always as identity primary key,
    product_id          bigint        not null references products(id),
    warehouse_id        bigint        not null references warehouses(id),
    on_hand_qty         numeric(14,3) not null default 0,
    reserved_qty        numeric(14,3) not null default 0,
    pending_qty         numeric(14,3) not null default 0,
    available_qty       numeric(14,3) not null default 0,
    projected_qty       numeric(14,3) not null default 0,
    last_recomputed_at  timestamptz,
    created_at          timestamptz   not null default now(),
    updated_at          timestamptz   not null default now(),
    unique (product_id, warehouse_id)
);

create table stock_movements (
    id              bigint generated always as identity primary key,
    public_id       uuid          not null default gen_random_uuid(),
    product_id      bigint        not null references products(id),
    warehouse_id    bigint        not null references warehouses(id),
    movement_type   varchar(50)   not null,
    qty             numeric(14,3) not null,
    balance_before  numeric(14,3),
    balance_after   numeric(14,3),
    source_type     varchar(50),
    source_id       bigint,
    notes           text,
    performed_by    bigint        references users(id),
    created_at      timestamptz   not null default now(),
    unique (public_id)
);

create index idx_stock_movements_product   on stock_movements(product_id, warehouse_id);
create index idx_stock_movements_source    on stock_movements(source_type, source_id);

create table stock_transfers (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    transfer_number     varchar(50) not null unique,
    transfer_type       varchar(30) not null default 'product',
                          -- product, warehouse_full
    from_warehouse_id   bigint      not null references warehouses(id),
    to_warehouse_id     bigint      not null references warehouses(id),
    status              varchar(30) not null default 'posted',
                          -- draft, posted, cancelled
    reason              text,
    created_by          bigint      references users(id),
    posted_by           bigint      references users(id),
    posted_at           timestamptz,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (public_id),
    check (from_warehouse_id <> to_warehouse_id)
);

create index idx_stock_transfers_warehouses on stock_transfers(from_warehouse_id, to_warehouse_id, created_at desc);

create table stock_transfer_items (
    id                  bigint generated always as identity primary key,
    stock_transfer_id   bigint        not null references stock_transfers(id),
    product_id          bigint        not null references products(id),
    qty                 numeric(14,3) not null,
    out_movement_id     bigint        references stock_movements(id),
    in_movement_id      bigint        references stock_movements(id),
    notes               text,
    created_at          timestamptz   not null default now(),
    check (qty > 0)
);

create index idx_stock_transfer_items_transfer on stock_transfer_items(stock_transfer_id);
create index idx_stock_transfer_items_product  on stock_transfer_items(product_id);

create table stock_reservations (
    id              bigint generated always as identity primary key,
    product_id      bigint        not null references products(id),
    warehouse_id    bigint        not null references warehouses(id),
    order_id        bigint,
    order_item_id   bigint,
    reserved_qty    numeric(14,3) not null,
    status          varchar(30)   not null default 'active',
                      -- active, released, fulfilled, cancelled
    created_at      timestamptz   not null default now(),
    updated_at      timestamptz   not null default now()
);
