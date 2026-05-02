-- Align AI and AI settings permissions used by controllers.

insert into permissions (code, module, name_ar, description) values
  ('ai.view',     'ai',       'عرض مهام الذكاء الاصطناعي',      null),
  ('ai.create',   'ai',       'إنشاء مهام الذكاء الاصطناعي',    null),
  ('ai.review',   'ai',       'مراجعة نتائج الذكاء الاصطناعي',  null),
  ('settings.ai', 'settings', 'إعدادات الذكاء الاصطناعي',       null)
on conflict (code) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r
join permissions p on p.code in ('ai.view', 'ai.create', 'ai.review', 'settings.ai')
where r.code in ('owner', 'admin')
on conflict do nothing;
