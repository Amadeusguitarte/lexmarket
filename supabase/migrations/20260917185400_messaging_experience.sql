begin;
alter table public.documents add column preview_shared boolean not null default false;
create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles on delete cascade,
 case_id uuid references public.cases on delete cascade, lawyer_id uuid references public.profiles,
 kind text not null,title text not null,created_at timestamptz not null default now(),read_at timestamptz
);
create index notifications_recipient on public.notifications(recipient_id,created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon,authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
create policy own_notifications on public.notifications for select to authenticated using(recipient_id=(select auth.uid()));
alter publication supabase_realtime add table public.notifications;
create or replace function private.can_read_chat(p_case uuid,p_lawyer uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.cases c join public.access_requests a on a.case_id=c.id join public.profiles p on p.id=a.lawyer_id where c.id=p_case and a.lawyer_id=p_lawyer and a.state in ('requested','granted') and p.role='lawyer' and p.verification='verified' and (c.owner_id=auth.uid() or p_lawyer=auth.uid()))
$$;
create function public.notify_case_activity() returns trigger language plpgsql security invoker set search_path=public as $$
declare owner_id uuid; recipient uuid; label text; begin
 select c.owner_id into owner_id from cases c where c.id=new.case_id;
 if tg_table_name='access_requests' then
  if tg_op='INSERT' then
   insert into messages(case_id,lawyer_id,sender_id,body) values(new.case_id,new.lawyer_id,new.lawyer_id,new.note);
   label:='Un profesional se interesó en tu caso';recipient:=owner_id;
  elsif new.state is distinct from old.state then label:=case when new.state='granted' then 'El cliente autorizó tu acceso al expediente' else 'El cliente retiró el acceso al expediente' end;recipient:=new.lawyer_id;
  else return new; end if;
 elsif tg_table_name='messages' then
  recipient:=case when new.sender_id=owner_id then new.lawyer_id else owner_id end;label:='Tienes un mensaje nuevo';
 elsif tg_table_name='proposals' then
  recipient:=owner_id;label:='Recibiste una propuesta de honorarios';
 end if;
 insert into notifications(recipient_id,case_id,lawyer_id,kind,title) values(recipient,new.case_id,new.lawyer_id,tg_table_name,label);
 return new;
end $$;
revoke all on function public.notify_case_activity() from public,anon,authenticated;
create trigger notify_interest after insert or update of state on public.access_requests for each row execute function public.notify_case_activity();
create trigger notify_message after insert on public.messages for each row execute function public.notify_case_activity();
create trigger notify_proposal after insert on public.proposals for each row execute function public.notify_case_activity();
create function public.notify_review_activity() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if tg_table_name='profiles' then
  if new.verification is distinct from old.verification then insert into notifications(recipient_id,kind,title) values(new.id,'profile','La revisión de tu perfil se actualizó');end if;
 elsif new.status is distinct from old.status then
  insert into notifications(recipient_id,case_id,kind,title) values(new.owner_id,new.id,'case',case new.status when 'published' then 'Tu caso ya está publicado' when 'draft' then 'Tu caso volvió a borrador: revisa las observaciones' when 'engaged' then 'El acompañamiento está confirmado' else 'Tu caso cambió de estado' end);
 end if;return new;
end $$;
revoke all on function public.notify_review_activity() from public,anon,authenticated;
create trigger notify_case_review after update of status on public.cases for each row execute function public.notify_review_activity();
create trigger notify_profile_review after update of verification on public.profiles for each row execute function public.notify_review_activity();
commit;
