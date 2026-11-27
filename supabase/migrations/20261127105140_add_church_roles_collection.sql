alter table public.app_records drop constraint if exists app_records_collection_check;
alter table public.app_records add constraint app_records_collection_check
check (collection = any (array['members','prayers','baptisms','events','sermons','media','announcements','contactMessages','emailHistory','livestream','siteSettings','enabledLangs','churchRoles']::text[]));
