-- T04: Customers and customer payments

create table customers (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    name                varchar(200) not null,
    phone               varchar(30),
    phone2              varchar(30),
    email               varchar(200),
    wilaya_id           bigint      references wilayas(id),
    address             text,
    shipping_route      varchar(200),
    opening_balance     numeric(14,2) not null default 0,
    salesperson_id      bigint      references users(id),
    status              varchar(30) not null default 'active',
    notes               text,
    created_by          bigint      references users(id),
    updated_by          bigint      references users(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    deleted_at          timestamptz,
    unique (public_id)
);

create index idx_customers_name        on customers(name);
create index idx_customers_phone       on customers(phone);
create index idx_customers_wilaya      on customers(wilaya_id);
create index idx_customers_salesperson on customers(salesperson_id);

create table customer_payments (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    customer_id         bigint      not null references customers(id),
    amount              numeric(14,2) not null,
    direction           varchar(10) not null,          -- in, out
    payment_method      varchar(30) not null,          -- cash, bank, cheque
    reference_number    varchar(100),
    received_by         bigint      references users(id),
    counterparty_name   varchar(200),
    payment_date        date        not null,
    notes               text,
    created_by          bigint      references users(id),
    created_at          timestamptz not null default now(),
    unique (public_id)
);
