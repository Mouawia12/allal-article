-- T28: Default price list per customer/supplier

alter table customers
    add column if not exists price_list_id bigint references price_lists(id);

alter table suppliers
    add column if not exists price_list_id bigint references price_lists(id);

create index if not exists idx_customers_price_list on customers(price_list_id);
create index if not exists idx_suppliers_price_list on suppliers(price_list_id);
