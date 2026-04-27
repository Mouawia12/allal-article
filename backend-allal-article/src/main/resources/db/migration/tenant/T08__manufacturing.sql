-- T08: Manufacturing requests, materials, quality checks, events, receipts

create table manufacturing_requests (
    id                          bigint generated always as identity primary key,
    public_id                   uuid          not null default gen_random_uuid(),
    request_number              varchar(50)   not null unique,
    source_type                 varchar(40)   not null,
                                  -- sold_order, stock_replenishment, custom_order, manual
    source_order_id             bigint,
    source_order_item_id        bigint,
    product_id                  bigint        not null references products(id),
    requested_qty               numeric(14,3) not null,
    approved_qty                numeric(14,3),
    produced_qty                numeric(14,3) not null default 0,
    received_qty                numeric(14,3) not null default 0,
    unit_name                   varchar(50),
    status                      varchar(40)   not null default 'draft',
                                  -- draft, approved, queued, in_production, quality_check,
                                  -- ready_to_ship, in_transit, received, cancelled
    priority                    varchar(30)   not null default 'normal',
    factory_name                varchar(180),
    production_line             varchar(180),
    requested_by                bigint        references users(id),
    approved_by                 bigint        references users(id),
    responsible_user_id         bigint        references users(id),
    quality_user_id             bigint        references users(id),
    destination_warehouse_id    bigint        references warehouses(id),
    destination_label           varchar(200),
    linked_customer_id          bigint        references customers(id),
    customer_snapshot           varchar(220),
    deposit_required            boolean       not null default false,
    deposit_amount              numeric(14,2) not null default 0,
    deposit_paid_amount         numeric(14,2) not null default 0,
    deposit_status              varchar(30)   not null default 'none',
                                  -- none, pending, partial, paid
    due_date                    date,
    started_at                  timestamptz,
    completed_at                timestamptz,
    shipped_at                  timestamptz,
    received_at                 timestamptz,
    notes                       text,
    metadata_json               jsonb,
    created_at                  timestamptz   not null default now(),
    updated_at                  timestamptz   not null default now(),
    cancelled_at                timestamptz,
    cancel_reason               text,
    unique (public_id)
);

create index idx_manufacturing_requests_status  on manufacturing_requests(status, due_date);
create index idx_manufacturing_requests_source  on manufacturing_requests(source_type, source_order_id);
create index idx_manufacturing_requests_product on manufacturing_requests(product_id, destination_warehouse_id);

create table manufacturing_request_materials (
    id                          bigint generated always as identity primary key,
    manufacturing_request_id    bigint        not null references manufacturing_requests(id) on delete cascade,
    material_product_id         bigint        not null references products(id),
    planned_qty                 numeric(14,3) not null,
    reserved_qty                numeric(14,3) not null default 0,
    consumed_qty                numeric(14,3) not null default 0,
    waste_qty                   numeric(14,3) not null default 0,
    warehouse_id                bigint        references warehouses(id),
    unit_cost_amount            numeric(14,4),
    notes                       text,
    created_at                  timestamptz   not null default now(),
    updated_at                  timestamptz   not null default now()
);

create index idx_manufacturing_materials_request on manufacturing_request_materials(manufacturing_request_id);

create table manufacturing_quality_checks (
    id                          bigint generated always as identity primary key,
    manufacturing_request_id    bigint        not null references manufacturing_requests(id) on delete cascade,
    checked_by                  bigint        references users(id),
    result                      varchar(30)   not null,
                                  -- passed, failed, rework_required, partial_pass
    checked_qty                 numeric(14,3) not null default 0,
    passed_qty                  numeric(14,3) not null default 0,
    rework_qty                  numeric(14,3) not null default 0,
    rejected_qty                numeric(14,3) not null default 0,
    notes                       text,
    attachments_json            jsonb,
    checked_at                  timestamptz   not null default now()
);

create table manufacturing_events (
    id                          bigint generated always as identity primary key,
    manufacturing_request_id    bigint      not null references manufacturing_requests(id) on delete cascade,
    event_type                  varchar(60) not null,
    old_status                  varchar(40),
    new_status                  varchar(40),
    payload_json                jsonb,
    performed_by                bigint      references users(id),
    created_at                  timestamptz not null default now()
);

create index idx_manufacturing_events_request_created on manufacturing_events(manufacturing_request_id, created_at desc);

create table manufacturing_receipts (
    id                          bigint generated always as identity primary key,
    manufacturing_request_id    bigint        not null references manufacturing_requests(id),
    warehouse_id                bigint        not null references warehouses(id),
    received_qty                numeric(14,3) not null,
    accepted_qty                numeric(14,3) not null default 0,
    quarantine_qty              numeric(14,3) not null default 0,
    stock_movement_id           bigint        references stock_movements(id),
    received_by                 bigint        references users(id),
    received_at                 timestamptz   not null default now(),
    notes                       text
);
