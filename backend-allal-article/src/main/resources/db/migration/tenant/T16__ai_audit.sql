-- T16: AI jobs and audit logs

create table ai_jobs (
    id              bigint generated always as identity primary key,
    public_id       uuid        not null default gen_random_uuid(),
    job_type        varchar(80) not null,
    job_status      varchar(40) not null default 'queued',
    provider        varchar(50),
    model           varchar(80),
    initiated_by    bigint      references users(id),
    source_file_id  bigint      references media_assets(id),
    options_json    jsonb,
    summary_json    jsonb,
    started_at      timestamptz,
    finished_at     timestamptz,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now(),
    unique (public_id)
);

create table ai_job_items (
    id                  bigint generated always as identity primary key,
    ai_job_id           bigint      not null references ai_jobs(id),
    item_status         varchar(40) not null default 'pending',
    raw_input_json      jsonb,
    parsed_output_json  jsonb,
    review_decision     varchar(30) not null default 'pending',
    error_message       text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now()
);

create table audit_logs (
    id              bigint generated always as identity primary key,
    actor_user_id   bigint      references users(id),
    entity_type     varchar(80) not null,
    entity_id       bigint,
    action          varchar(120) not null,
    old_values_json jsonb,
    new_values_json jsonb,
    meta_json       jsonb,
    ip_address      varchar(50),
    user_agent      text,
    correlation_id  varchar(80),
    created_at      timestamptz not null default now()
);

create index idx_audit_entity     on audit_logs(entity_type, entity_id);
create index idx_audit_actor      on audit_logs(actor_user_id);
create index idx_audit_created_at on audit_logs(created_at);
