-- T29: Geographic coordinates (latitude/longitude) for customers and suppliers

alter table customers add column latitude  double precision;
alter table customers add column longitude double precision;

alter table suppliers add column latitude  double precision;
alter table suppliers add column longitude double precision;
