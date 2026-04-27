-- T13: Full accounting module

-- Fiscal years and periods
create table fiscal_years (
    id          bigint generated always as identity primary key,
    public_id   uuid        not null default gen_random_uuid(),
    name        varchar(100) not null,
    start_date  date        not null,
    end_date    date        not null,
    status      varchar(30) not null default 'open',  -- open, closing, closed
    closed_at   timestamptz,
    closed_by   bigint      references users(id),
    close_reason text,
    created_by  bigint      references users(id),
    created_at  timestamptz not null default now(),
    unique (public_id),
    unique (start_date, end_date)
);

create table accounting_periods (
    id              bigint generated always as identity primary key,
    fiscal_year_id  bigint    not null references fiscal_years(id),
    period_number   smallint  not null,
    name            varchar(80) not null,
    start_date      date      not null,
    end_date        date      not null,
    status          varchar(30) not null default 'open',  -- open, closed, locked
    closed_at       timestamptz,
    closed_by       bigint    references users(id),
    unique (fiscal_year_id, period_number)
);

-- Account chart infrastructure
create table account_classes (
    id                  bigint generated always as identity primary key,
    code                varchar(10) not null unique,
    name_ar             varchar(150) not null,
    name_fr             varchar(150),
    financial_statement varchar(40) not null,   -- balance_sheet, income_statement
    normal_balance      varchar(10) not null,   -- debit, credit
    sort_order          integer     not null default 0
);

create table account_templates (
    id              bigint generated always as identity primary key,
    code            varchar(60) not null unique,
    name_ar         varchar(160) not null,
    name_fr         varchar(160),
    country_code    varchar(2)  not null default 'DZ',
    code_scheme     varchar(40) not null default '4_digit_grouped',
    code_length     smallint    not null default 4,
    code_pattern    varchar(120) not null default '^[0-9]{4}$',
    is_default      boolean     not null default false,
    version         integer     not null default 1,
    created_at      timestamptz not null default now()
);

create table account_template_items (
    id                      bigint generated always as identity primary key,
    template_id             bigint      not null references account_templates(id),
    code                    varchar(30) not null,
    name_ar                 varchar(200) not null,
    name_fr                 varchar(200),
    parent_code             varchar(30),
    classification          varchar(30) not null,
    financial_statement     varchar(40),
    normal_balance          varchar(10) not null,
    is_postable             boolean     not null default true,
    is_control              boolean     not null default false,
    requires_subledger      boolean     not null default false,
    subledger_type          varchar(30),
    report_section          varchar(60),
    statement_line_code     varchar(60),
    statement_sort_order    integer     not null default 0,
    cash_flow_section       varchar(60),
    sort_order              integer     not null default 0,
    unique (template_id, code)
);

create table chart_template_deployments (
    id                  bigint generated always as identity primary key,
    template_id         bigint      not null references account_templates(id),
    template_version    integer     not null,
    status              varchar(30) not null default 'draft',
                          -- draft, in_progress, completed, failed, upgraded
    deployed_at         timestamptz,
    deployed_by         bigint      references users(id),
    accounts_created    integer     not null default 0,
    health_check_json   jsonb,
    notes               text,
    created_at          timestamptz not null default now()
);

-- Main accounts table
create table accounts (
    id                      bigint generated always as identity primary key,
    public_id               uuid        not null default gen_random_uuid(),
    code                    varchar(30) not null unique,
    name_ar                 varchar(200) not null,
    name_fr                 varchar(200),
    parent_id               bigint      references accounts(id),
    account_class_id        bigint      references account_classes(id),
    template_item_id        bigint      references account_template_items(id),
    template_version        integer,
    is_template_locked      boolean     not null default false,
    is_custom               boolean     not null default false,
    level                   smallint    not null default 1,
    path                    varchar(500),
    classification          varchar(30) not null,
    financial_statement     varchar(40),
    normal_balance          varchar(10) not null,
    report_section          varchar(60),
    statement_line_code     varchar(60),
    statement_sort_order    integer     not null default 0,
    cash_flow_section       varchar(60),
    is_postable             boolean     not null default true,
    is_control              boolean     not null default false,
    requires_subledger      boolean     not null default false,
    subledger_type          varchar(30),
    is_reconcilable         boolean     not null default false,
    allow_manual_posting    boolean     not null default true,
    currency                varchar(3)  not null default 'DZD',
    status                  varchar(30) not null default 'active',
    locked_reason           text,
    locked_at               timestamptz,
    locked_by               bigint      references users(id),
    sort_order              integer     not null default 0,
    created_by              bigint      references users(id),
    updated_by              bigint      references users(id),
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now(),
    deleted_at              timestamptz,
    unique (public_id),
    check (code ~ '^[0-9]{4,6}$'),
    check (not is_postable or level >= 2),
    check (not requires_subledger or subledger_type is not null),
    check (status in ('active', 'inactive', 'locked', 'archived'))
);

create index idx_accounts_parent          on accounts(parent_id);
create index idx_accounts_template_item   on accounts(template_item_id);
create index idx_accounts_classification  on accounts(classification);
create index idx_accounts_path            on accounts(path);
create index idx_accounts_report_section  on accounts(report_section);
create index idx_accounts_statement_line  on accounts(statement_line_code);

create table subledger_entities (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    subledger_type      varchar(30) not null,
    entity_type         varchar(50) not null,
    entity_id           bigint      not null,
    display_name        varchar(200) not null,
    control_account_id  bigint      not null references accounts(id),
    status              varchar(30) not null default 'active',
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (public_id),
    unique (subledger_type, entity_type, entity_id)
);

-- Journal infrastructure
create table journal_books (
    id                  bigint generated always as identity primary key,
    code                varchar(40) not null unique,
    name_ar             varchar(120) not null,
    book_type           varchar(40) not null,
    default_prefix      varchar(20) not null,
    year_format         varchar(20) not null default 'YYYY',
    allows_manual       boolean     not null default true,
    requires_approval   boolean     not null default false,
    is_system           boolean     not null default false,
    is_active           boolean     not null default true,
    created_at          timestamptz not null default now()
);

create table number_sequences (
    id              bigint generated always as identity primary key,
    sequence_key    varchar(80) not null unique,
    prefix          varchar(30) not null,
    next_number     bigint      not null default 1,
    padding         smallint    not null default 5,
    fiscal_year_id  bigint      references fiscal_years(id),
    updated_at      timestamptz not null default now()
);

create table journals (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    journal_number      varchar(50) not null unique,
    journal_book_id     bigint      not null references journal_books(id),
    fiscal_year_id      bigint      not null references fiscal_years(id),
    period_id           bigint      references accounting_periods(id),
    journal_date        date        not null,
    journal_type        varchar(30) not null,
    source_type         varchar(50),
    source_id           bigint,
    status              varchar(30) not null default 'draft',
    description         text,
    currency            varchar(3)  not null default 'DZD',
    exchange_rate       numeric(18,8) not null default 1,
    total_debit         numeric(18,4) not null default 0,
    total_credit        numeric(18,4) not null default 0,
    reversed_journal_id bigint      references journals(id),
    reversal_journal_id bigint      references journals(id),
    created_by          bigint      references users(id),
    approved_by         bigint      references users(id),
    posted_at           timestamptz,
    posted_by           bigint      references users(id),
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    unique (public_id)
);

create index idx_journals_source   on journals(source_type, source_id);
create index idx_journals_date     on journals(journal_date, status);
create index idx_journals_fy       on journals(fiscal_year_id, period_id);

create table journal_items (
    id                  bigint generated always as identity primary key,
    journal_id          bigint      not null references journals(id),
    line_number         integer     not null,
    account_id          bigint      not null references accounts(id),
    debit               numeric(18,4) not null default 0,
    credit              numeric(18,4) not null default 0,
    description         text,
    subledger_entity_id bigint      references subledger_entities(id),
    source_line_type    varchar(50),
    source_line_id      bigint,
    currency            varchar(3)  not null default 'DZD',
    exchange_rate       numeric(18,8) not null default 1,
    amount_currency     numeric(18,4),
    sort_order          smallint    not null default 0,
    check (debit >= 0 and credit >= 0),
    check (debit = 0 or credit = 0),
    unique (journal_id, line_number)
);

-- Analytical dimensions
create table dimension_types (
    id          bigint generated always as identity primary key,
    code        varchar(50) not null unique,
    name_ar     varchar(120) not null,
    is_required boolean     not null default false,
    is_active   boolean     not null default true
);

create table dimensions (
    id                  bigint generated always as identity primary key,
    dimension_type_id   bigint      not null references dimension_types(id),
    code                varchar(60) not null,
    name_ar             varchar(160) not null,
    linked_entity_type  varchar(50),
    linked_entity_id    bigint,
    is_active           boolean     not null default true,
    unique (dimension_type_id, code)
);

create table journal_item_dimensions (
    journal_item_id bigint not null references journal_items(id),
    dimension_id    bigint not null references dimensions(id),
    primary key (journal_item_id, dimension_id)
);

-- Tax tables
create table tax_codes (
    id                  bigint generated always as identity primary key,
    code                varchar(40) not null unique,
    name_ar             varchar(120) not null,
    tax_type            varchar(30) not null,
    direction           varchar(20) not null,
    is_price_inclusive  boolean     not null default false,
    is_active           boolean     not null default true,
    created_at          timestamptz not null default now()
);

create table tax_rates (
    id              bigint generated always as identity primary key,
    tax_code_id     bigint      not null references tax_codes(id),
    rate_percent    numeric(8,4) not null,
    valid_from      date        not null,
    valid_to        date,
    is_inclusive    boolean     not null default false,
    created_at      timestamptz not null default now()
);

create table tax_code_accounts (
    tax_code_id bigint not null references tax_codes(id),
    direction   varchar(20) not null,   -- collected, deductible, payable
    account_id  bigint not null references accounts(id),
    primary key (tax_code_id, direction)
);

-- Accounting settings and auto-entry rules
create table accounting_settings (
    key                     varchar(100) primary key,
    account_id              bigint      references accounts(id),
    label                   varchar(200) not null,
    group_name              varchar(80)  not null,
    is_required             boolean      not null default true,
    allowed_classification  varchar(30),
    requires_control        boolean      not null default false,
    updated_by              bigint       references users(id),
    updated_at              timestamptz  not null default now()
);

create table accounting_rules (
    id              bigint generated always as identity primary key,
    code            varchar(80) not null unique,
    name_ar         varchar(160) not null,
    source_type     varchar(50) not null,
    journal_book_id bigint      references journal_books(id),
    is_active       boolean     not null default true,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create table accounting_rule_items (
    id                  bigint generated always as identity primary key,
    rule_id             bigint      not null references accounting_rules(id),
    line_number         integer     not null,
    side                varchar(10) not null,   -- debit, credit
    account_source      varchar(30) not null,
    setting_key         varchar(100),
    fixed_account_id    bigint      references accounts(id),
    amount_source       varchar(60) not null,
    subledger_source    varchar(60),
    description_template text,
    unique (rule_id, line_number)
);

-- Balances and opening entries
create table opening_balances (
    id              bigint generated always as identity primary key,
    fiscal_year_id  bigint        not null references fiscal_years(id),
    account_id      bigint        not null references accounts(id),
    debit_balance   numeric(18,4) not null default 0,
    credit_balance  numeric(18,4) not null default 0,
    notes           text,
    created_by      bigint        references users(id),
    created_at      timestamptz   not null default now(),
    updated_at      timestamptz   not null default now(),
    unique (fiscal_year_id, account_id)
);

create table subledger_opening_balances (
    id                  bigint generated always as identity primary key,
    fiscal_year_id      bigint        not null references fiscal_years(id),
    control_account_id  bigint        not null references accounts(id),
    subledger_entity_id bigint        not null references subledger_entities(id),
    debit_balance       numeric(18,4) not null default 0,
    credit_balance      numeric(18,4) not null default 0,
    notes               text,
    created_at          timestamptz   not null default now(),
    unique (fiscal_year_id, control_account_id, subledger_entity_id)
);

create table account_balances (
    id              bigint generated always as identity primary key,
    account_id      bigint        not null references accounts(id),
    fiscal_year_id  bigint        not null references fiscal_years(id),
    period_id       bigint        references accounting_periods(id),
    opening_debit   numeric(18,4) not null default 0,
    opening_credit  numeric(18,4) not null default 0,
    period_debit    numeric(18,4) not null default 0,
    period_credit   numeric(18,4) not null default 0,
    closing_debit   numeric(18,4) not null default 0,
    closing_credit  numeric(18,4) not null default 0,
    last_recomputed_at timestamptz,
    unique (account_id, fiscal_year_id, period_id)
);

create unique index idx_account_balances_year on account_balances(account_id, fiscal_year_id) where period_id is null;

-- Bank and cash
create table bank_accounts (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    name                varchar(160) not null,
    bank_name           varchar(160),
    account_number      varchar(80),
    iban                varchar(80),
    currency            varchar(3)  not null default 'DZD',
    ledger_account_id   bigint      not null references accounts(id),
    last_reconciled_at  timestamptz,
    is_active           boolean     not null default true,
    created_at          timestamptz not null default now(),
    unique (public_id)
);

create table cash_boxes (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    name                varchar(120) not null,
    currency            varchar(3)  not null default 'DZD',
    ledger_account_id   bigint      not null references accounts(id),
    responsible_user_id bigint      references users(id),
    is_active           boolean     not null default true,
    created_at          timestamptz not null default now(),
    unique (public_id)
);

create table payment_methods (
    id                  bigint generated always as identity primary key,
    code                varchar(40) not null unique,
    name_ar             varchar(120) not null,
    default_account_id  bigint      references accounts(id),
    requires_reference  boolean     not null default false,
    is_active           boolean     not null default true
);

-- Product and category account mappings
create table category_account_mappings (
    category_id                 bigint not null references categories(id),
    sales_revenue_account_id    bigint references accounts(id),
    sales_return_account_id     bigint references accounts(id),
    inventory_account_id        bigint references accounts(id),
    cogs_account_id             bigint references accounts(id),
    purchase_return_account_id  bigint references accounts(id),
    primary key (category_id)
);

create table product_account_mappings (
    product_id                  bigint not null primary key references products(id),
    sales_revenue_account_id    bigint references accounts(id),
    sales_return_account_id     bigint references accounts(id),
    inventory_account_id        bigint references accounts(id),
    cogs_account_id             bigint references accounts(id)
);

create table inventory_valuation_layers (
    id              bigint generated always as identity primary key,
    product_id      bigint        not null references products(id),
    warehouse_id    bigint        not null references warehouses(id),
    source_type     varchar(50)   not null,
    source_id       bigint        not null,
    qty             numeric(14,3) not null,
    unit_cost       numeric(18,4) not null,
    remaining_qty   numeric(14,3) not null,
    created_at      timestamptz   not null default now()
);

-- Reconciliation
create table reconciliation_matches (
    id                  bigint generated always as identity primary key,
    public_id           uuid        not null default gen_random_uuid(),
    reconciliation_type varchar(30) not null,   -- customer, supplier, bank
    subledger_entity_id bigint      references subledger_entities(id),
    bank_account_id     bigint      references bank_accounts(id),
    fiscal_year_id      bigint      references fiscal_years(id),
    status              varchar(30) not null default 'matched',
    matched_at          timestamptz not null default now(),
    matched_by          bigint      references users(id),
    notes               text,
    unique (public_id),
    check (
        (reconciliation_type in ('customer','supplier') and subledger_entity_id is not null)
        or
        (reconciliation_type = 'bank' and bank_account_id is not null)
    )
);

create index idx_recon_matches_entity on reconciliation_matches(subledger_entity_id) where subledger_entity_id is not null;
create index idx_recon_matches_bank   on reconciliation_matches(bank_account_id) where bank_account_id is not null;
create index idx_recon_matches_fy     on reconciliation_matches(fiscal_year_id);

create table reconciliation_items (
    id              bigint generated always as identity primary key,
    match_id        bigint        not null references reconciliation_matches(id),
    journal_item_id bigint        not null references journal_items(id),
    amount          numeric(18,4) not null,
    side            varchar(10)   not null   -- debit, credit
);

-- Year close
create table year_close_runs (
    id                  bigint generated always as identity primary key,
    fiscal_year_id      bigint      not null references fiscal_years(id),
    run_at              timestamptz not null default now(),
    run_by              bigint      references users(id),
    status              varchar(30) not null,
    closing_journal_id  bigint      references journals(id),
    opening_journal_id  bigint      references journals(id),
    checks_json         jsonb,
    notes               text
);
