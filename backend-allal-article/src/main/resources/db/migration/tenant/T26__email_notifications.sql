-- T26: Email notification outbox + default settings

create table if not exists email_outbox (
    id              bigint generated always as identity primary key,
    event_code      varchar(80)  not null,
    subject         varchar(500) not null,
    recipients_json jsonb        not null,
    body_html       text,
    payload_json    jsonb,
    status          varchar(30)  not null default 'pending',
    error_message   text,
    attempts        int          not null default 0,
    sent_at         timestamptz,
    created_at      timestamptz  not null default now()
);

create index if not exists ix_email_outbox_status on email_outbox(status, created_at);
create index if not exists ix_email_outbox_event on email_outbox(event_code, created_at);

-- Seed default email-notification settings (off by default; admin opts in via UI)
insert into settings (key, group_name, value_json)
values (
    'notifications.email',
    'notifications',
    jsonb_build_object(
        'enabled',           false,
        'recipientUserIds',  '[]'::jsonb,
        'extraEmails',       '[]'::jsonb,
        'events', jsonb_build_object(
            'productCreated',      true,
            'productPriceChanged', true,
            'productLowStock',     true,
            'bulkImportCompleted', true
        ),
        'bulkAttachThresholdRows', 10
    )
)
on conflict (key) do nothing;
