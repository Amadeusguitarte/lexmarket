create or replace function public.submit_proposal(p_case uuid,p_lawyer uuid,p_payload jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare c cases; begin
 select * into c from cases where id=p_case for update;
 if not found or c.status<>'published' or c.owner_id=p_lawyer then raise exception 'Case unavailable'; end if;
 if not exists(select 1 from profiles where id=p_lawyer and role='lawyer' and verification='verified') or
    not exists(select 1 from access_requests where case_id=p_case and lawyer_id=p_lawyer and state='granted') then raise exception 'Access required'; end if;
 insert into proposals(case_id,lawyer_id,scope,exclusions,amount,days,payment_terms)
 values(p_case,p_lawyer,p_payload->>'scope',p_payload->>'exclusions',(p_payload->>'amount')::bigint,(p_payload->>'days')::integer,p_payload->>'payment_terms');
end $$;
revoke all on function public.submit_proposal(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_proposal(uuid,uuid,jsonb) to service_role;
