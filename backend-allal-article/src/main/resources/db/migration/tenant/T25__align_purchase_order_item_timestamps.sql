-- Align purchase order item table with the JPA entity timestamp mapping.

alter table purchase_order_items
    add column if not exists created_at timestamptz not null default now();
