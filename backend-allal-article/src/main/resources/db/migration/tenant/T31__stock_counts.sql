-- T31: Physical inventory counts (جرد المخزون).
--
-- A count is a document, not a one-off correction: opening it freezes what the system believed
-- at that moment, counters fill in what they actually found, and approval turns every difference
-- into a stock movement. Freezing matters because sales and receipts keep happening while people
-- count — without a snapshot the differences would be measured against a moving target.

create table if not exists stock_counts (
    id            bigint generated always as identity primary key,
    public_id     uuid        not null default gen_random_uuid(),
    reference     varchar(40) not null,
    warehouse_id  bigint      not null references warehouses(id),
    status        varchar(20) not null default 'open',
    -- Counters do not see the system quantity while counting; seeing it biases them toward it.
    blind         boolean     not null default true,
    scheduled_for date,
    notes         text,
    created_by    bigint      references users(id),
    created_at    timestamptz not null default now(),
    closed_by     bigint      references users(id),
    closed_at     timestamptz,
    approved_by   bigint      references users(id),
    approved_at   timestamptz,
    -- The journal entry the approval produced, so the sheet and the ledger point at each other.
    journal_number varchar(40),
    updated_at    timestamptz not null default now(),
    unique (public_id),
    unique (reference),
    check (status in ('open', 'review', 'approved', 'cancelled'))
);

create index if not exists idx_stock_counts_warehouse on stock_counts(warehouse_id, status);

create table if not exists stock_count_items (
    id             bigint generated always as identity primary key,
    stock_count_id bigint        not null references stock_counts(id) on delete cascade,
    product_id     bigint        not null references products(id),
    -- Frozen when the count is opened.
    system_qty     numeric(14,3) not null,
    unit_cost      numeric(14,4),
    -- Null until somebody counts: a blank cell and a counted zero are different facts.
    counted_qty    numeric(14,3),
    -- An independent second count, used in place of counted_qty when a difference is challenged.
    recount_qty    numeric(14,3),
    reason         varchar(120),
    notes          text,
    counted_by     bigint        references users(id),
    counted_at     timestamptz,
    unique (stock_count_id, product_id),
    check (counted_qty is null or counted_qty >= 0),
    check (recount_qty is null or recount_qty >= 0)
);

create index if not exists idx_stock_count_items_count on stock_count_items(stock_count_id);

insert into permissions (code, module, name_ar, description) values
  ('inventory.count',         'inventory', 'إجراء جرد المخزون',   null),
  ('inventory.count.approve', 'inventory', 'اعتماد جرد المخزون',  null)
on conflict (code) do nothing;

-- Owner and admin may run and approve; the warehouse keeper counts but does not approve his own work.
insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p
where r.code in ('owner', 'admin')
  and p.code in ('inventory.count', 'inventory.count.approve')
on conflict do nothing;
