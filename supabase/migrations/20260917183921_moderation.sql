begin;
alter table public.cases drop constraint cases_status_check;
alter table public.cases add constraint cases_status_check check(status in ('draft','review','published','engaged','closed'));
alter table public.cases add column moderation_note text;
create or replace function public.publish_case(p_case uuid,p_owner uuid,p_publish boolean) returns void
language plpgsql security invoker set search_path=public as $$
declare c cases; begin
 select * into c from cases where id=p_case and owner_id=p_owner for update;
 if not found or c.status not in ('draft','review','published') then raise exception 'Case is not editable'; end if;
 if p_publish and (c.status<>'draft' or length(trim(c.public_summary))<30) then raise exception 'Summary or draft required'; end if;
 delete from listings where case_id=c.id;
 update cases set status=case when p_publish then 'review' else 'draft' end,moderation_note=null,updated_at=now() where id=c.id;
 insert into events(case_id,actor_id,title) values(c.id,p_owner,case when p_publish then 'Caso enviado a revisión' else 'Publicación retirada para editar' end);
end $$;
create or replace function public.review_case(p_case uuid,p_actor uuid,p_result text,p_note text,p_version timestamptz) returns void
language plpgsql security invoker set search_path=public as $$
declare c cases; begin
 if p_result not in ('approved','changes_requested','rejected','removed') or length(trim(p_note))<20 then raise exception 'Invalid review'; end if;
 select * into c from cases where id=p_case for update;
 if not found or c.updated_at<>p_version or not (c.status='review' or (c.status='published' and p_result='removed')) then raise exception 'Refresh before reviewing'; end if;
 if c.status='review' and p_result='removed' then raise exception 'Not published'; end if;
 delete from listings where case_id=c.id;
 if p_result='approved' then
 insert into listings(case_id,title,category,city,service,summary,urgency) values(c.id,c.title,c.category,c.city,c.service,c.public_summary,c.urgency);
 end if;
 update cases set status=case when p_result='approved' then 'published' else 'draft' end,moderation_note=p_note,updated_at=now() where id=c.id;
 insert into audit_log(actor_id,action,target_id,note) values(p_actor,'case.'||p_result,c.id,json_build_object('method','manual','reason',p_note,'version',c.updated_at,'snapshot',json_build_object('title',c.title,'summary',c.public_summary,'category',c.category,'city',c.city))::text);
 insert into events(case_id,actor_id,title,detail) values(c.id,p_actor,case when p_result='approved' then 'Publicación aprobada' when p_result='removed' then 'Publicación retirada' when p_result='rejected' then 'Publicación rechazada' else 'Necesitamos algunos ajustes' end,p_note);
end $$;
revoke all on function public.review_case(uuid,uuid,text,text,timestamptz),public.publish_case(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.review_case(uuid,uuid,text,text,timestamptz),public.publish_case(uuid,uuid,boolean) to service_role;
create or replace function public.review_professional(p_target uuid,p_actor uuid,p_result text,p_note text) returns void
language plpgsql security invoker set search_path=public as $$
declare p profiles; begin
 if p_result not in ('verified','rejected') or length(trim(p_note))<20 then raise exception 'Invalid review'; end if;
 select * into p from profiles where id=p_target and role='lawyer' for update;
 if not found then raise exception 'Professional not found'; end if;
 update profiles set verification=p_result,verified_at=case when p_result='verified' then now() else null end,verification_note=p_note where id=p_target;
 insert into audit_log(actor_id,action,target_id,note) values(p_actor,'professional.'||p_result,p_target,json_build_object('method','manual','reason',p_note,'snapshot',json_build_object('name',p.name,'license',p.license,'previous_status',p.verification))::text);
end $$;
revoke all on function public.review_professional(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_professional(uuid,uuid,text,text) to service_role;
commit;
