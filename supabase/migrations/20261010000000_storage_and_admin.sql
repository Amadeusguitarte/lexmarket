-- Ensure storage bucket 'case-files' is properly registered in Supabase
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-files',
  'case-files',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
  ];

-- Performance indexes for administrative filtering and document lookups
create index if not exists idx_cases_status_updated on public.cases (status, updated_at desc);
create index if not exists idx_documents_case_id_created on public.documents (case_id, created_at desc);
create index if not exists idx_audit_log_target on public.audit_log (target_id, created_at desc);
