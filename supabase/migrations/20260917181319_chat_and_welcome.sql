alter table public.profiles add column if not exists avatar_url text;
alter table public.messages add column if not exists delivered_at timestamptz;
alter table public.messages add column if not exists read_at timestamptz;
create table public.chat_attachments (
 id uuid primary key, case_id uuid not null references public.cases on delete cascade,
 lawyer_id uuid not null references public.profiles, sender_id uuid not null references public.profiles,
 name text not null, path text not null unique, mime text not null, size integer not null check(size between 1 and 10485760),
 created_at timestamptz not null default now()
);
alter table public.messages add column attachment_id uuid references public.chat_attachments(id);
create table public.chat_activity (
 case_id uuid references public.cases on delete cascade, lawyer_id uuid references public.profiles,
 user_id uuid references public.profiles, last_seen_at timestamptz not null default now(), typing_until timestamptz,
 primary key(case_id,lawyer_id,user_id)
);
create index chat_attachments_thread on public.chat_attachments(case_id,lawyer_id);
create index messages_unread on public.messages(case_id,lawyer_id,sender_id) where read_at is null;
create schema if not exists private;
-- This narrowly scoped helper reads tables intentionally closed to the browser.
-- It checks the current authenticated identity, live access and lawyer verification.
create or replace function private.can_read_chat(p_case uuid,p_lawyer uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
 select 1 from public.cases c join public.access_requests a on a.case_id=c.id
 join public.profiles p on p.id=a.lawyer_id
 where c.id=p_case and a.lawyer_id=p_lawyer and a.state='granted'
 and p.role='lawyer' and p.verification='verified'
 and (c.owner_id=auth.uid() or p_lawyer=auth.uid()))
$$;
revoke all on function private.can_read_chat(uuid,uuid) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.can_read_chat(uuid,uuid) to authenticated;
alter table public.chat_attachments enable row level security;
alter table public.chat_activity enable row level security;
revoke all on public.chat_attachments,public.chat_activity from anon,authenticated;
grant all on public.chat_attachments,public.chat_activity to service_role;
-- Writes and attachment downloads remain server mediated. Realtime only reads.
grant select on public.messages,public.chat_activity,public.proposals to authenticated;
create policy chat_messages_read on public.messages for select to authenticated using(private.can_read_chat(case_id,lawyer_id));
create policy chat_activity_read on public.chat_activity for select to authenticated using(private.can_read_chat(case_id,lawyer_id));
create policy chat_proposals_read on public.proposals for select to authenticated using(private.can_read_chat(case_id,lawyer_id));
alter publication supabase_realtime add table public.messages,public.chat_activity,public.proposals;
alter table public.proposals drop constraint proposals_case_id_lawyer_id_key;
create index proposals_thread on public.proposals(case_id,lawyer_id,created_at);
create unique index one_pending_proposal_per_lawyer on public.proposals(case_id,lawyer_id) where status='pending';
create or replace function public.submit_proposal(p_case uuid,p_lawyer uuid,p_payload jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare c cases; begin
 select * into c from cases where id=p_case for update;
 if not found or c.status<>'published' or c.owner_id=p_lawyer then raise exception 'Case unavailable'; end if;
 if not exists(select 1 from profiles where id=p_lawyer and role='lawyer' and verification='verified') or
 not exists(select 1 from access_requests where case_id=p_case and lawyer_id=p_lawyer and state='granted') then raise exception 'Access required'; end if;
 update proposals set status='declined' where case_id=p_case and lawyer_id=p_lawyer and status='pending';
 insert into proposals(case_id,lawyer_id,scope,exclusions,amount,days,payment_terms)
 values(p_case,p_lawyer,p_payload->>'scope',p_payload->>'exclusions',(p_payload->>'amount')::bigint,(p_payload->>'days')::integer,p_payload->>'payment_terms');
end $$;
revoke all on function public.submit_proposal(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_proposal(uuid,uuid,jsonb) to service_role;
