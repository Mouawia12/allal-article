-- T10: Sales returns and return items

create table returns (
    id                              bigint generated always as identity primary key,
    public_id                       uuid        not null default gen_random_uuid(),
    return_number                   varchar(50) not null unique,
    origin_channel                  varchar(40) not null default 'manual',
                                      -- manual, partner_return, partner_claim
    linked_partner_uuid             uuid,
    partner_document_link_public_id uuid,
    partner_claim_public_id         uuid,
    partner_sync_status             varchar(40) not null default 'none',
    order_id                        bigint      references orders(id),
    customer_id                     bigint      references customers(id),
    driver_id                       bigint      references users(id),
    received_by                     bigint      references users(id),
    return_date                     date        not null,
    status                          varchar(30) not null default 'pending',
    notes                           text,
    created_by                      bigint      references users(id),
    created_at                      timestamptz not null default now(),
    unique (public_id)
);

create index idx_returns_partner_document_link on returns(partner_document_link_public_id);
create index idx_returns_partner_claim         on returns(partner_claim_public_id);
create index idx_returns_order                 on returns(order_id);

create table return_items (
    id                              bigint generated always as identity primary key,
    return_id                       bigint        not null references returns(id),
    order_item_id                   bigint        references order_items(id),
    product_id                      bigint        not null references products(id),
    partner_source_line_public_id   uuid,
    returned_qty                    numeric(14,3) not null,
    accepted_qty                    numeric(14,3) not null default 0,
    condition_status                varchar(40),
                                      -- usable, damaged, missing, quarantine, written_off
    notes                           text
);
