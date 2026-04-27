-- V4: Tenant partnerships, partner document links, claims, and events

create table platform.tenant_partnerships (
    id                          bigint generated always as identity primary key,
    provider_tenant_id          bigint not null references platform.tenants(id),
    requester_tenant_id         bigint not null references platform.tenants(id),
    invite_code_id              bigint references platform.tenant_invite_codes(id),
    status                      varchar(30) not null default 'pending',
                                  -- pending, active, revoked, rejected
    permissions_json            jsonb not null,
    denial_messages_json        jsonb,
    provider_supplier_public_id  uuid,
    requester_supplier_public_id uuid,
    supplier_match_status       varchar(30) not null default 'none',
                                  -- none, suggested, confirmed, skipped, ambiguous
    supplier_match_method       varchar(50),
    supplier_match_score        numeric(5,2),
    supplier_match_snapshot     jsonb,
    supplier_match_reviewed_by  uuid,
    supplier_match_reviewed_at  timestamptz,
    requested_message           text,
    requested_at                timestamptz not null default now(),
    approved_at                 timestamptz,
    revoked_at                  timestamptz,
    unique (provider_tenant_id, requester_tenant_id)
);

create table platform.partner_document_links (
    id                              bigint generated always as identity primary key,
    public_id                       uuid not null default gen_random_uuid(),
    partnership_id                  bigint not null references platform.tenant_partnerships(id),
    direction                       varchar(40) not null,
                                      -- purchase_to_sale, sale_to_purchase
    source_tenant_id                bigint not null references platform.tenants(id),
    source_document_type            varchar(40) not null,
    source_document_public_id       uuid not null,
    target_tenant_id                bigint not null references platform.tenants(id),
    target_document_type            varchar(40) not null,
    target_document_public_id       uuid,
    status                          varchar(40) not null default 'pending_target_confirmation',
                                      -- pending_target_confirmation, accepted, partially_accepted, rejected,
                                      -- cancelled, seller_reserved, shipped, in_transit, received,
                                      -- return_requested, returned, claim_open, claim_resolved, fulfilled, failed
    idempotency_key                 varchar(160) not null unique,
    source_snapshot_json            jsonb not null,
    target_snapshot_json            jsonb,
    last_event_type                 varchar(80),
    last_error                      text,
    created_by_user_public_id       uuid,
    accepted_by_user_public_id      uuid,
    rejected_by_user_public_id      uuid,
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now(),
    accepted_at                     timestamptz,
    rejected_at                     timestamptz,
    unique (public_id)
);

create index idx_partner_document_links_partnership on platform.partner_document_links(partnership_id, status);
create index idx_partner_document_links_source      on platform.partner_document_links(source_tenant_id, source_document_type, source_document_public_id);
create index idx_partner_document_links_target      on platform.partner_document_links(target_tenant_id, target_document_type, target_document_public_id);

create table platform.partner_document_claims (
    id                          bigint generated always as identity primary key,
    public_id                   uuid not null default gen_random_uuid(),
    document_link_id            bigint not null references platform.partner_document_links(id),
    claim_type                  varchar(40) not null,
                                  -- cancel_after_ship, return, shortage, lost_in_transit, damaged, over_delivery
    claim_status                varchar(40) not null default 'open',
                                  -- open, accepted, rejected, awaiting_partner, resolved, cancelled
    resolution_type             varchar(40),
                                  -- replacement, credit_note, refund, write_off, receive_return, price_adjustment
    reported_by_tenant_id       bigint not null references platform.tenants(id),
    responsible_tenant_id       bigint references platform.tenants(id),
    reported_by_user_public_id  uuid,
    resolved_by_user_public_id  uuid,
    reason                      text,
    resolution_notes            text,
    created_at                  timestamptz not null default now(),
    updated_at                  timestamptz not null default now(),
    resolved_at                 timestamptz,
    unique (public_id)
);

create index idx_partner_document_claims_link on platform.partner_document_claims(document_link_id, claim_status);
create index idx_partner_document_claims_type on platform.partner_document_claims(claim_type, claim_status);

create table platform.partner_document_claim_items (
    id                      bigint generated always as identity primary key,
    claim_id                bigint not null references platform.partner_document_claims(id),
    source_line_public_id   uuid,
    target_line_public_id   uuid,
    product_snapshot_json   jsonb not null,
    claimed_qty             numeric(14,3) not null,
    accepted_qty            numeric(14,3) not null default 0,
    resolved_qty            numeric(14,3) not null default 0,
    condition_status        varchar(40),
                              -- missing, damaged, usable, quarantine, returned
    notes                   text
);

create table platform.partner_document_events (
    id                      bigint generated always as identity primary key,
    document_link_id        bigint not null references platform.partner_document_links(id),
    event_type              varchar(80) not null,
    actor_tenant_id         bigint references platform.tenants(id),
    actor_user_public_id    uuid,
    payload_json            jsonb,
    created_at              timestamptz not null default now()
);
