-- T29: Geographic coordinates (latitude/longitude) for customers and suppliers

alter table customers
    add column if not exists latitude  double precision,
    add column if not exists longitude double precision;

alter table suppliers
    add column if not exists latitude  double precision,
    add column if not exists longitude double precision;
