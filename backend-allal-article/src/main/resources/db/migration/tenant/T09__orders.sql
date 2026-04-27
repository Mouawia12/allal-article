-- T09: Orders, order items, and order events

create table orders (
    id                              bigint generated always as identity primary key,
    public_id                       uuid        not null default gen_random_uuid(),
    order_number                    varchar(50) not null unique,
    customer_id                     bigint      references customers(id),
    sales_user_id                   bigint      references users(id),
    origin_channel                  varchar(40) not null default 'manual',
                                      -- manual, partner_purchase, partner_sale
    linked_partner_uuid             uuid,
    linked_partnership_public_id    uuid,
    partner_document_link_public_id uuid,
    partner_source_document_public_id uuid,
    partner_sync_status             varchar(40) not null default 'none',
    order_status                    varchar(40) not null default 'draft',
                                      -- draft, submitted, under_review, confirmed, shipped, completed, cancelled, rejected
    shipping_status                 varchar(40) not null default 'pending',
                                      -- none, pending, shipped
    payment_status                  varchar(30) not null default 'unpaid',
    price_list_id                   bigint      references price_lists(id),
    price_list_name_snapshot        varchar(160),
    price_currency                  varchar(3)  not null default 'DZD',
    notes                           text,
    internal_notes                  text,
    total_amount                    numeric(14,2) not null default 0,
    total_weight                    numeric(14,3) not null default 0,
    created_by                      bigint      references users(id),
    updated_by                      bigint      references users(id),
    reviewed_by                     bigint      references users(id),
    confirmed_by                    bigint      references users(id),
    shipped_by                      bigint      references users(id),
    completed_by                    bigint      references users(id),
    cancelled_by                    bigint      references users(id),
    rejected_by                     bigint      references users(id),
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now(),
    submitted_at                    timestamptz,
    review_started_at               timestamptz,
    confirmed_at                    timestamptz,
    shipped_at                      timestamptz,
    completion_due_at               timestamptz,
    completed_at                    timestamptz,
    auto_completed_at               timestamptz,
    cancelled_at                    timestamptz,
    rejected_at                     timestamptz,
    deleted_at                      timestamptz,
    unique (public_id)
);

create index idx_orders_partner_document_link  on orders(partner_document_link_public_id);
create index idx_orders_linked_partner         on orders(linked_partner_uuid, partner_sync_status);
create index idx_orders_status                 on orders(order_status, created_at desc);
create index idx_orders_price_list             on orders(price_list_id, created_at desc);
create index idx_orders_shipping_completion_due on orders(order_status, completion_due_at) where order_status = 'shipped';

create table order_items (
    id                              bigint generated always as identity primary key,
    public_id                       uuid          not null default gen_random_uuid(),
    order_id                        bigint        not null references orders(id),
    product_id                      bigint        not null references products(id),
    line_number                     integer       not null,
    line_status                     varchar(40)   not null default 'pending',
    partner_source_line_public_id   uuid,
    requested_qty                   numeric(14,3) not null,
    approved_qty                    numeric(14,3) not null default 0,
    shipped_qty                     numeric(14,3) not null default 0,
    returned_qty                    numeric(14,3) not null default 0,
    cancelled_qty                   numeric(14,3) not null default 0,
    original_requested_qty          numeric(14,3),
    price_list_id                   bigint        references price_lists(id),
    price_list_item_id              bigint        references price_list_items(id),
    price_list_name_snapshot        varchar(160),
    pricing_source                  varchar(40)   not null default 'product_default',
                                      -- price_list, product_default, manual_override
    base_unit_price                 numeric(14,2),
    unit_price                      numeric(14,2),
    line_subtotal                   numeric(14,2) not null default 0,
    line_weight                     numeric(14,3),
    is_shipping_required            boolean       not null default true,
    customer_note                   text,
    internal_note                   text,
    changed_by_admin                bigint        references users(id),
    change_reason                   text,
    created_at                      timestamptz   not null default now(),
    updated_at                      timestamptz   not null default now(),
    deleted_at                      timestamptz,
    unique (public_id),
    unique (order_id, line_number),
    check (approved_qty >= 0),
    check (shipped_qty >= 0),
    check (returned_qty >= 0),
    check (cancelled_qty >= 0),
    check (approved_qty + cancelled_qty = requested_qty),
    check (shipped_qty <= approved_qty),
    check (returned_qty <= shipped_qty)
);

create table order_events (
    id              bigint generated always as identity primary key,
    order_id        bigint      not null references orders(id),
    event_type      varchar(80) not null,
    payload_json    jsonb,
    performed_by    bigint      references users(id),
    created_at      timestamptz not null default now()
);

create index idx_order_events_order on order_events(order_id, created_at desc);

create table order_item_events (
    id              bigint generated always as identity primary key,
    order_item_id   bigint      not null references order_items(id),
    event_type      varchar(80) not null,
    old_values_json jsonb,
    new_values_json jsonb,
    reason          text,
    performed_by    bigint      references users(id),
    created_at      timestamptz not null default now()
);

create index idx_order_item_events_item on order_item_events(order_item_id, created_at desc);
