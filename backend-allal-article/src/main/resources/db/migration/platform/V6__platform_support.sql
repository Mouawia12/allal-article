-- V6: Platform support ticket system

create table platform.support_tickets (
    id                              bigint generated always as identity primary key,
    public_id                       uuid        not null default gen_random_uuid(),
    ticket_number                   varchar(50) not null unique,
    tenant_id                       bigint      not null references platform.tenants(id),
    subject                         varchar(220) not null,
    category                        varchar(60) not null,
    priority                        varchar(30) not null default 'normal',
                                      -- low, normal, high, urgent
    status                          varchar(30) not null default 'open',
                                      -- open, waiting_owner, waiting_tenant, resolved, closed
    status_source                   varchar(30) not null default 'system',
    opened_by_tenant_user_public_id uuid,
    assigned_platform_user_id       bigint      references platform.platform_users(id),
    last_message_at                 timestamptz,
    last_message_by                 varchar(30),
    closed_by_type                  varchar(30),
    closed_by_user_public_id        uuid,
    closed_at                       timestamptz,
    created_at                      timestamptz not null default now(),
    updated_at                      timestamptz not null default now(),
    unique (public_id)
);

create index idx_support_tickets_tenant_status on platform.support_tickets(tenant_id, status, last_message_at desc);
create index idx_support_tickets_assignee      on platform.support_tickets(assigned_platform_user_id, status, priority);

create table platform.support_ticket_participants (
    id                      bigint generated always as identity primary key,
    ticket_id               bigint      not null references platform.support_tickets(id),
    participant_type        varchar(30) not null,   -- tenant_user, platform_user, support_team
    tenant_user_public_id   uuid,
    platform_user_id        bigint      references platform.platform_users(id),
    role                    varchar(30) not null default 'participant',
    last_read_message_id    bigint,
    joined_at               timestamptz not null default now(),
    unique (ticket_id, participant_type, tenant_user_public_id, platform_user_id)
);

create table platform.support_messages (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    ticket_id               bigint      not null references platform.support_tickets(id),
    sender_type             varchar(30) not null,   -- tenant_user, platform_user, system
    tenant_user_public_id   uuid,
    platform_user_id        bigint      references platform.platform_users(id),
    message_type            varchar(30) not null default 'text',
                              -- text, image, audio, file, system
    body                    text,
    metadata_json           jsonb,
    created_at              timestamptz not null default now(),
    deleted_at              timestamptz,
    unique (public_id)
);

create index idx_support_messages_ticket_created on platform.support_messages(ticket_id, created_at);

create table platform.support_attachments (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    message_id              bigint      not null references platform.support_messages(id),
    attachment_type         varchar(30) not null,   -- image, audio, file
    original_filename       varchar(240) not null,
    mime_type               varchar(120),
    storage_provider        varchar(40) not null default 'cloudflare_r2',
    bucket_name             varchar(120) not null,
    object_key              text        not null,
    public_url              text,
    size_bytes              bigint,
    extension               varchar(20),
    duration_seconds        integer,
    thumbnail_object_key    text,
    metadata_json           jsonb,
    created_at              timestamptz not null default now(),
    unique (public_id)
);

create index idx_support_attachments_message on platform.support_attachments(message_id);
