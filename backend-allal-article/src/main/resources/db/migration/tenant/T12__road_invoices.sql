-- T12: Road invoices (فواتير الطريق)

create table road_invoices (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    invoice_number      varchar(50) not null unique,
    invoice_date        date        not null,
    wilaya_id           bigint      references wilayas(id),
    customer_id         bigint      references customers(id),
    driver_id           bigint      references users(id),
    status              varchar(30) not null default 'draft',
    total_weight        numeric(14,3) not null default 0,
    notes               text,
    print_count         integer     not null default 0,
    last_printed_at     timestamptz,
    last_printed_by     bigint      references users(id),
    whatsapp_sent_at    timestamptz,
    created_by          bigint      references users(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (public_id)
);

create table road_invoice_items (
    id              bigint generated always as identity primary key,
    road_invoice_id bigint        not null references road_invoices(id),
    product_id      bigint        not null references products(id),
    quantity        numeric(14,3) not null,
    unit_price      numeric(14,2),
    line_weight     numeric(14,3),
    source_json     jsonb,
    notes           text
);

create table road_invoice_orders (
    road_invoice_id bigint not null references road_invoices(id),
    order_id        bigint not null references orders(id),
    primary key (road_invoice_id, order_id)
);

create table road_invoice_wilaya_defaults (
    wilaya_id   bigint primary key references wilayas(id),
    customer_id bigint not null references customers(id),
    updated_by  bigint references users(id),
    updated_at  timestamptz not null default now()
);
