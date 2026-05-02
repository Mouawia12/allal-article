-- Align accounting permissions used by controllers with seeded RBAC data.

insert into permissions (code, module, name_ar, description) values
  ('accounting.manage',          'accounting', 'إدارة المحاسبة',        null),
  ('accounting.journals.create', 'accounting', 'إنشاء قيود محاسبية',    null),
  ('accounting.journals.post',   'accounting', 'ترحيل قيود محاسبية',    null)
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in (
  'accounting.manage',
  'accounting.journals.create',
  'accounting.journals.post'
)
where r.code in ('owner', 'admin')
on conflict do nothing;
