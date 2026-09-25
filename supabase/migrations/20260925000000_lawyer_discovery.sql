-- Lawyer discovery system, profile extensions, reviews, and case invitations.
alter table public.profiles add column if not exists years_of_experience integer not null default 0;
alter table public.profiles add column if not exists education text not null default '';
alter table public.profiles add column if not exists languages text[] not null default '{"Español"}';
alter table public.profiles add column if not exists virtual_available boolean not null default true;
alter table public.profiles add column if not exists in_person_available boolean not null default true;
alter table public.profiles add column if not exists featured boolean not null default false;

create table if not exists public.lawyer_invites (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases on delete cascade,
  lawyer_id uuid not null references public.profiles on delete cascade,
  client_id uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique(case_id, lawyer_id)
);

create index if not exists lawyer_invites_lawyer on public.lawyer_invites(lawyer_id, status);
create index if not exists lawyer_invites_client on public.lawyer_invites(client_id);

alter table public.lawyer_invites enable row level security;
revoke all on public.lawyer_invites from anon, authenticated;
grant select on public.lawyer_invites to authenticated;
grant all on public.lawyer_invites to service_role;

create policy lawyer_invites_read on public.lawyer_invites for select to authenticated
  using (client_id = (select auth.uid()) or lawyer_id = (select auth.uid()));

alter publication supabase_realtime add table public.lawyer_invites;

-- Helper trigger for lawyer invitations notification
create or replace function public.notify_lawyer_invite() returns trigger language plpgsql security invoker set search_path=public as $$
declare
  client_name text;
  case_title text;
begin
  select name into client_name from profiles where id = new.client_id;
  select title into case_title from cases where id = new.case_id;
  insert into notifications(recipient_id, case_id, lawyer_id, kind, title)
  values (
    new.lawyer_id,
    new.case_id,
    new.lawyer_id,
    'invite',
    coalesce(client_name, 'Un cliente') || ' te invitó a revisar su caso: ' || coalesce(case_title, 'Caso legal')
  );
  return new;
end $$;

revoke all on function public.notify_lawyer_invite() from public, anon, authenticated;
drop trigger if exists notify_invite_created on public.lawyer_invites;
create trigger notify_invite_created after insert on public.lawyer_invites for each row execute function public.notify_lawyer_invite();
