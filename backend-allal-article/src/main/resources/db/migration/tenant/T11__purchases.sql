-- T11: Suppliers, purchase orders, purchase returns

create table suppliers (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    name                    varchar(200) not null,
    legal_name              varchar(200),
    phone                   varchar(50),
    email                   varchar(150),
    tax_number              varchar(80),
    commercial_register     varchar(80),
    nis_number              varchar(80),
    wilaya_id               bigint      references wilayas(id),
    address                 text,
    category                varchar(80),
    status                  varchar(30) not null default 'active',
    payment_terms           varchar(120),
    opening_balance         numeric(14,2) not null default 0,
    linked_partner_uuid     uuid,
    linked_partnership_public_id uuid,
    link_match_method       varchar(50),
    link_match_status       varchar(30) not null default 'none',
                              -- none, suggested, confirmed, skipped, ambiguous
    link_confirmed_by       bigint      references users(id),
    link_confirmed_at       timestamptz,
    notes                   text,
    created_by              bigint      references users(id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (public_id)
);

create unique index idx_suppliers_tax_number_unique          on suppliers(tax_number) where tax_number is not null and tax_number <> '';
create unique index idx_suppliers_commercial_register_unique on suppliers(commercial_register) where commercial_register is not null and commercial_register <> '';
create unique index idx_suppliers_email_unique               on suppliers(lower(email)) where email is not null and email <> '';
create unique index idx_suppliers_phone_unique               on suppliers(phone) where phone is not null and phone <> '';
create index idx_suppliers_linked_partner on suppliers(linked_partner_uuid);

create table purchase_orders (
    id                              bigint generated always as identity primary key,
    public_id                       uuid        not null default gen_random_uuid(),
    po_number                       varchar(50) not null unique,
    supplier_id                     bigint      references suppliers(id),
    supplier_name                   varchar(200) not null,
    origin_channel                  varchar(40) not null default 'manual',
    linked_partner_uuid             uuid,
    linked_partnership_public_id    uuid,
    partner_document_link_public_id uuid,
    partner_source_document_public_id uuid,
    partner_sync_status             varchar(40) not null default 'none',
    status                          varchar(30) not null default 'draft',
                                      -- draft, confirmed, received, cancelled
    payment_status                  varchar(30) not null default 'unpaid',
    price_list_id                   bigint      references price_lists(id),
    price_list_name_snapshot        varchar(160),
    price_currency                  varchar(3)  not null default 'DZD',
    expected_date                   date,
    received_date                   date,
    received_by                     bigint      references users(id),
    sent_to_supplier_by             bigint      references users(id),
    sent_to_supplier_at             timestamptz,
    cancelled_by                    bigint      references users(id),
    cancelled_at                    timestamptz,
    total_amount                    numeric(14,2) not null default 0,
    notes                           text,
    created_by                      bigint      references users(id),
    updated_by                      bigint      references users(id),
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now(),
    unique (public_id)
);

create index idx_purchase_orders_partner_document_link on purchase_orders(partner_document_link_public_id);
create index idx_purchase_orders_linked_partner        on purchase_orders(linked_partner_uuid, partner_sync_status);
create index idx_purchase_orders_price_list            on purchase_orders(price_list_id, created_at desc);

create table purchase_order_items (
    id                          bigint generated always as identity primary key,
    purchase_order_id           bigint        not null references purchase_orders(id),
    product_id                  bigint        not null references products(id),
    partner_source_line_public_id uuid,
    ordered_qty                 numeric(14,3) not null,
    received_qty                numeric(14,3) not null default 0,
    returned_qty                numeric(14,3) not null default 0,
    price_list_id               bigint        references price_lists(id),
    price_list_item_id          bigint        references price_list_items(id),
    price_list_name_snapshot    varchar(160),
    pricing_source              varchar(40)   not null default 'product_default',
    base_unit_price             numeric(14,2),
    unit_price                  numeric(14,2),
    line_subtotal               numeric(14,2) not null default 0,
    notes                       text,
    check (ordered_qty >= 0),
    check (received_qty >= 0),
    check (returned_qty >= 0),
    check (received_qty <= ordered_qty),
    check (returned_qty <= received_qty)
);

create index idx_purchase_order_items_order on purchase_order_items(purchase_order_id);

create table purchase_returns (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    return_number           varchar(50) not null unique,
    purchase_order_id       bigint      not null references purchase_orders(id),
    supplier_id             bigint      references suppliers(id),
    supplier_name           varchar(200) not null,
    supplier_invoice_no     varchar(80),
    return_date             date        not null,
    status                  varchar(30) not null default 'draft',
                              -- draft, posted, cancelled
    warehouse_id            bigint      references warehouses(id),
    reason                  text,
    total_amount            numeric(14,2) not null default 0,
    tax_amount              numeric(14,2) not null default 0,
    net_amount              numeric(14,2) not null default 0,
    accounting_status       varchar(30) not null default 'pending',
    journal_public_id       uuid,
    stock_posting_status    varchar(30) not null default 'pending',
    returned_by             bigint      references users(id),
    received_by_supplier    varchar(160),
    created_by              bigint      references users(id),
    posted_by               bigint      references users(id),
    posted_at               timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    unique (public_id)
);

create index idx_purchase_returns_order       on purchase_returns(purchase_order_id);
create index idx_purchase_returns_supplier    on purchase_returns(supplier_id, return_date);
create index idx_purchase_returns_accounting  on purchase_returns(accounting_status, journal_public_id);

create table purchase_return_items (
    id                          bigint generated always as identity primary key,
    purchase_return_id          bigint        not null references purchase_returns(id),
    purchase_order_item_id      bigint        references purchase_order_items(id),
    product_id                  bigint        not null references products(id),
    returned_qty                numeric(14,3) not null,
    unit_cost_amount            numeric(14,2) not null default 0,
    tax_rate                    numeric(5,2)  not null default 0,
    tax_amount                  numeric(14,2) not null default 0,
    line_total_amount           numeric(14,2) not null default 0,
    stock_movement_id           bigint        references stock_movements(id),
    condition_status            varchar(40)   not null default 'return_to_supplier',
    notes                       text,
    created_at                  timestamptz   not null default now(),
    unique (purchase_return_id, purchase_order_item_id)
);

create index idx_purchase_return_items_product on purchase_return_items(product_id);
