-- Align purchase permissions used by controllers with seeded RBAC data.

insert into permissions (code, module, name_ar, description) values
  ('purchases.confirm', 'purchases', 'تأكيد أمر شراء', null),
  ('purchases.cancel',  'purchases', 'إلغاء أمر شراء', null)
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in ('purchases.confirm', 'purchases.cancel')
where r.code in ('owner', 'admin')
on conflict do nothing;
