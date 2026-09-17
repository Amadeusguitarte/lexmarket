create or replace function public.enforce_document_limit() returns trigger
language plpgsql set search_path=public as $$
begin
 perform 1 from cases where id=new.case_id for update;
 if (select count(*) from documents where case_id=new.case_id)>=30 then raise exception 'Document limit reached'; end if;
 return new;
end $$;
create trigger document_limit before insert on public.documents for each row execute function public.enforce_document_limit();
revoke all on function public.enforce_document_limit() from public,anon,authenticated;
