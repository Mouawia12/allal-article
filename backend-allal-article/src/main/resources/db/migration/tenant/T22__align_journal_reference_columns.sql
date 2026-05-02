-- Keep older tenant schemas compatible with the current Journal entity.
-- T13 originally stored source_type/source_id; the application now reads
-- reference_type/reference_id/reference_number.
alter table journals
    add column if not exists reference_type varchar(60),
    add column if not exists reference_id bigint,
    add column if not exists reference_number varchar(80);

update journals
set reference_type = source_type
where reference_type is null
  and source_type is not null;

update journals
set reference_id = source_id
where reference_id is null
  and source_id is not null;

create index if not exists idx_journals_reference on journals(reference_type, reference_id);

alter table journal_items
    add column if not exists cost_center varchar(60);
