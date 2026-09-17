-- Run once in a new Supabase project. Server-mediated access: no browser DB grants.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 name text not null, role text not null check(role in ('client','lawyer')),
 city text not null default '', bio text not null default '', license text not null default '',
 specialties text[] not null default '{}', verification text not null default 'pending' check(verification in ('pending','verified','rejected')),
 verification_note text, verified_at timestamptz, created_at timestamptz not null default now()
);
create table public.cases (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles,
 title text not null, category text not null, city text not null, service text not null,
 description text not null, public_summary text not null default '', urgency text not null default 'normal',
 status text not null default 'draft' check(status in ('draft','published','engaged','closed')),
 selected_lawyer uuid references public.profiles, ai_result jsonb, ai_consent_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- The listing deliberately contains no private description, files or owner identity.
create table public.listings (
 case_id uuid primary key references public.cases on delete cascade,
 title text not null, category text not null, city text not null, service text not null,
 summary text not null, urgency text not null, created_at timestamptz not null default now()
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 name text not null, path text not null unique, mime text not null, size integer not null,
 state text not null default 'quarantine' check(state in ('quarantine','clean','blocked','failed')),
 extracted_text text, extraction_note text, created_at timestamptz not null default now()
);
create table public.access_requests (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 lawyer_id uuid not null references public.profiles, state text not null default 'requested' check(state in ('requested','granted','revoked')),
 note text not null, created_at timestamptz not null default now(), unique(case_id,lawyer_id)
);
create table public.messages (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 lawyer_id uuid not null references public.profiles, sender_id uuid not null references public.profiles,
 body text not null check(length(body) between 1 and 4000), created_at timestamptz not null default now()
);
create table public.proposals (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 lawyer_id uuid not null references public.profiles, scope text not null, exclusions text not null,
 amount bigint not null check(amount>=0), days integer not null check(days>0), payment_terms text not null,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(), unique(case_id,lawyer_id)
);
create unique index one_accepted_proposal on public.proposals(case_id) where status='accepted';
create table public.events (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 actor_id uuid not null references public.profiles, title text not null, detail text not null default '', created_at timestamptz not null default now()
);
create table public.reviews (
 id uuid primary key default gen_random_uuid(), case_id uuid not null unique references public.cases on delete cascade,
 lawyer_id uuid not null references public.profiles, author_id uuid not null references public.profiles,
 rating integer not null check(rating between 1 and 5), comment text not null, created_at timestamptz not null default now()
);
create table public.jobs (
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.cases on delete cascade,
 document_id uuid references public.documents on delete cascade, kind text not null check(kind in ('scan','organize')),
 state text not null default 'queued' check(state in ('queued','working','done','failed')),
 attempts integer not null default 0, locked_at timestamptz, error text, created_at timestamptz not null default now()
);
create unique index one_active_organization on public.jobs(case_id) where kind='organize' and state in ('queued','working');
create table public.audit_log (
 id bigint generated always as identity primary key, actor_id uuid references public.profiles,
 action text not null, target_id uuid, note text, created_at timestamptz not null default now()
);
create table public.rate_limits (key text primary key, count integer not null, expires_at timestamptz not null);
create index cases_owner on public.cases(owner_id);
create index access_lawyer on public.access_requests(lawyer_id);
create index messages_thread on public.messages(case_id,lawyer_id,created_at);
create index documents_case on public.documents(case_id);
create index jobs_queue on public.jobs(state,created_at);
create index events_case on public.events(case_id,created_at);

-- All application tables are closed to client keys, including guessed REST calls.
do $$ declare t text; begin
 foreach t in array array['profiles','cases','listings','documents','access_requests','messages','proposals','events','reviews','jobs','audit_log','rate_limits'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from anon, authenticated',t);
  execute format('grant all on table public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on all sequences in schema public to service_role;

create or replace function public.take_rate(p_key text,p_limit integer,p_seconds integer) returns boolean
language plpgsql security definer set search_path=public as $$
declare n integer; begin
 insert into rate_limits(key,count,expires_at) values(p_key,1,now()+make_interval(secs=>p_seconds))
 on conflict(key) do update set count=case when rate_limits.expires_at<now() then 1 else rate_limits.count+1 end,
 expires_at=case when rate_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else rate_limits.expires_at end
 returning count into n;
 return n<=p_limit;
end $$;

create or replace function public.publish_case(p_case uuid,p_owner uuid,p_publish boolean) returns void
language plpgsql security definer set search_path=public as $$
declare c cases; begin
 select * into c from cases where id=p_case and owner_id=p_owner for update;
 if not found or c.status not in ('draft','published') then raise exception 'Case is not editable'; end if;
 if p_publish then
  if length(trim(c.public_summary))<30 then raise exception 'Summary required'; end if;
  insert into listings(case_id,title,category,city,service,summary,urgency)
  values(c.id,c.title,c.category,c.city,c.service,c.public_summary,c.urgency)
  on conflict(case_id) do update set title=excluded.title,category=excluded.category,city=excluded.city,service=excluded.service,summary=excluded.summary,urgency=excluded.urgency;
 else delete from listings where case_id=c.id; end if;
 update cases set status=case when p_publish then 'published' else 'draft' end,updated_at=now() where id=c.id;
 insert into events(case_id,actor_id,title) values(c.id,p_owner,case when p_publish then 'Caso publicado' else 'Publicación pausada' end);
end $$;

create or replace function public.accept_proposal(p_id uuid,p_owner uuid) returns void
language plpgsql security definer set search_path=public as $$
declare p proposals; c cases; begin
 select * into p from proposals where id=p_id;
 if not found then raise exception 'Proposal unavailable'; end if;
 select * into c from cases where id=p.case_id and owner_id=p_owner for update;
 if not found or c.status<>'published' or p.status<>'pending' then raise exception 'Proposal unavailable'; end if;
 if not exists(select 1 from profiles where id=p.lawyer_id and verification='verified') or
    not exists(select 1 from access_requests where case_id=c.id and lawyer_id=p.lawyer_id and state='granted') then raise exception 'Professional access unavailable'; end if;
 update proposals set status=case when id=p_id then 'accepted' else 'declined' end where case_id=c.id;
 update cases set status='engaged',selected_lawyer=p.lawyer_id,updated_at=now() where id=c.id;
 update access_requests set state='revoked' where case_id=c.id and lawyer_id<>p.lawyer_id;
 delete from listings where case_id=c.id;
 insert into events(case_id,actor_id,title,detail) values(c.id,p_owner,'Propuesta seleccionada','Confirmen el encargo y el poder que corresponda antes de iniciar actuaciones.');
end $$;

create or replace function public.claim_job() returns setof public.jobs
language plpgsql security definer set search_path=public as $$
begin
 update jobs set state='failed',error='Se agotaron los intentos. Contacta soporte.' where state='working' and locked_at<now()-interval '10 minutes' and attempts>=3;
 return query with candidate as (
  select id from jobs where (state='queued' or (state='working' and locked_at<now()-interval '10 minutes')) and attempts<3
  order by created_at for update skip locked limit 1
 ) update jobs j set state='working',attempts=j.attempts+1,locked_at=now() from candidate c where j.id=c.id returning j.*;
end $$;

revoke all on function public.take_rate(text,integer,integer),public.publish_case(uuid,uuid,boolean),public.accept_proposal(uuid,uuid),public.claim_job() from public,anon,authenticated;
grant execute on function public.take_rate(text,integer,integer),public.publish_case(uuid,uuid,boolean),public.accept_proposal(uuid,uuid),public.claim_job() to service_role;

-- Private bucket: no browser policies. Downloads are proxied after access checks.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('case-files','case-files',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'])
on conflict(id) do nothing;
