-- Dev Computer increment 1: extend the existing isolated shop without changing unrelated tables.
create table if not exists electroshop.promotions(id uuid primary key default gen_random_uuid(), data jsonb not null, updated_at timestamptz not null default now());
create table if not exists electroshop.audit_logs(id bigint generated always as identity primary key, actor_id uuid, entity text not null, record_id text, action text not null, details jsonb not null default '{}', created_at timestamptz not null default now());
create index if not exists dev_audit_created on electroshop.audit_logs(created_at desc);
alter table electroshop.promotions enable row level security;
alter table electroshop.audit_logs enable row level security;
revoke all on electroshop.promotions,electroshop.audit_logs from anon,authenticated;
create policy dev_rpc_only on electroshop.promotions for all to anon,authenticated using(false) with check(false);
create policy dev_rpc_only on electroshop.audit_logs for all to anon,authenticated using(false) with check(false);
create or replace function electroshop.record_change() returns trigger language plpgsql security definer set search_path='' as $$
declare d jsonb:='{}'; rid text;
begin
 rid:=case when TG_OP='DELETE' then old.id::text else new.id::text end;
 if TG_TABLE_NAME='products' then
  d:=jsonb_build_object('stock_before',case when TG_OP='INSERT' then 0 else (old.data->>'stock')::int end,'stock_after',case when TG_OP='DELETE' then 0 else (new.data->>'stock')::int end,'reason',coalesce(nullif(current_setting('dev_computer.reason',true),''),TG_OP));
 elsif TG_TABLE_NAME='orders' then d:=jsonb_build_object('status',case when TG_OP='DELETE' then old.data->>'status' else new.data->>'status' end);
 end if;
 insert into electroshop.audit_logs(actor_id,entity,record_id,action,details) values(auth.uid(),TG_TABLE_NAME,rid,TG_OP,d);
 return coalesce(new,old);
end;$$;
revoke all on function electroshop.record_change() from public,anon,authenticated;
create trigger dev_product_audit after insert or update or delete on electroshop.products for each row execute function electroshop.record_change();
create trigger dev_order_audit after insert or update on electroshop.orders for each row execute function electroshop.record_change();
create trigger dev_promotion_audit after insert or update or delete on electroshop.promotions for each row execute function electroshop.record_change();
-- Extend core validation and product payloads; optimistic stock check prevents stale edits overwriting reservations.
do $patch$
declare definition text;
begin
 select pg_get_functiondef('electroshop.api(text,text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'''Laptop'',''Charger'',''Camera'',''Headphone'',''Speaker'',''Microphone'',''Other''','''Laptop'',''Desktop'',''Monitor'',''PC Component'',''Keyboard'',''Mouse'',''Printer'',''Networking'',''Software'',''Refurbished'',''Accessory'',''Charger'',''Camera'',''Headphone'',''Speaker'',''Microphone'',''Other''');
 definition:=replace(definition,'v=jsonb_build_object(''name'',trim(p_body->>''name'')',
 'if p_method=''PUT'' then
 select data into prod from electroshop.products where id=split_part(p_path,''/'',4)::bigint and active for update;
 if prod is null then raise exception ''Product not found''; end if;
 if coalesce(p_body->>''expected_stock'','''') !~ ''^[0-9]+$'' or (p_body->>''expected_stock'')::int<>(prod->>''stock'')::int then raise exception ''Stock changed on another device. Refresh before editing.''; end if;
 end if;
 if length(coalesce(p_body->>''specifications'',''''))>6000 or length(coalesce(p_body->>''sku'',''''))>80 then raise exception ''Specifications or SKU too long''; end if;
 v=jsonb_build_object(''specifications'',coalesce(p_body->>''specifications'',''''),''sku'',trim(coalesce(p_body->>''sku'','''')),''name'',trim(p_body->>''name'')');
 execute definition;
end;$patch$;
create or replace function electroshop.dev_api(p_path text,p_method text default 'GET',p_body jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; v jsonb; pid bigint; promotion_id uuid; stock int; delta int; today text:=to_char(timezone('Asia/Kolkata',now()),'YYYY-MM-DD');
begin
 if octet_length(p_body::text)>100000 then raise exception 'Request too large'; end if;
 if p_path='/snapshot' and p_method='GET' then
  result:=electroshop.api(p_path,p_method,p_body);
  return result||jsonb_build_object('promotions',coalesce((select jsonb_agg(data||jsonb_build_object('id',id) order by updated_at desc) from electroshop.promotions where electroshop.current_role()='admin' or (data->>'published'='true' and (coalesce(data->>'start','')='' or data->>'start'<=today) and (coalesce(data->>'end','')='' or data->>'end'>=today))),'[]'::jsonb));
 end if;
 if p_path like '/admin/promotions%' or p_path like '/admin/inventory/%' or p_path='/admin/audit' then
  if auth.uid() is null or electroshop.current_role()<>'admin' then raise exception 'Owner access required'; end if;
  if p_path='/admin/audit' and p_method='GET' then return coalesce((select jsonb_agg(to_jsonb(a)) from (select id,entity,record_id,action,details,created_at from electroshop.audit_logs order by id desc limit 100) a),'[]'::jsonb);end if;
  if p_path like '/admin/inventory/%' and p_method='POST' then
   pid:=split_part(p_path,'/',4)::bigint;
   if coalesce(p_body->>'delta','') !~ '^-?[0-9]+$' or length(trim(coalesce(p_body->>'reason',''))) not between 3 and 300 then raise exception 'Enter a whole-number stock adjustment and a reason';end if;
   delta:=(p_body->>'delta')::int;if delta=0 or abs(delta)>100000 then raise exception 'Invalid adjustment';end if;
   select (data->>'stock')::int into stock from electroshop.products where id=pid and active for update;
   if stock is null or stock+delta not between 0 and 100000 then raise exception 'Invalid stock balance';end if;
   perform set_config('dev_computer.reason',trim(p_body->>'reason'),true);
   update electroshop.products set data=jsonb_set(data,'{stock}',to_jsonb(stock+delta)) where id=pid;
   return jsonb_build_object('stock',stock+delta);
  end if;
  if p_path like '/admin/promotions%' then
   if p_path<>'/admin/promotions' then promotion_id:=split_part(p_path,'/',4)::uuid;end if;
   if p_method='DELETE' then delete from electroshop.promotions where id=promotion_id;return '{"message":"Deleted"}';end if;
   if p_method not in ('POST','PUT') then raise exception 'Invalid method';end if;
   if coalesce(p_body->>'kind','') not in ('Offer','Event') or length(trim(coalesce(p_body->>'title',''))) not between 1 and 100 or length(trim(coalesce(p_body->>'description',''))) not between 3 and 1000 or length(coalesce(p_body->>'terms',''))>1500 then raise exception 'Invalid promotion';end if;
   if coalesce(p_body->>'image','')<>'' and p_body->>'image' !~ '^https://' then raise exception 'Invalid image';end if;
   if (coalesce(p_body->>'start','')<>'' and (p_body->>'start')::date::text<>p_body->>'start') or (coalesce(p_body->>'end','')<>'' and (p_body->>'end')::date::text<>p_body->>'end') or (coalesce(p_body->>'start','')<>'' and coalesce(p_body->>'end','')<>'' and p_body->>'start'>p_body->>'end') then raise exception 'Invalid dates';end if;
   v:=jsonb_build_object('title',trim(p_body->>'title'),'kind',p_body->>'kind','description',trim(p_body->>'description'),'terms',coalesce(p_body->>'terms',''),'image',left(coalesce(p_body->>'image',''),2000),'start',coalesce(p_body->>'start',''),'end',coalesce(p_body->>'end',''),'featured',coalesce((p_body->>'featured')::boolean,false),'published',coalesce((p_body->>'published')::boolean,false));
   if p_method='POST' then insert into electroshop.promotions(data) values(v) returning id into promotion_id;else update electroshop.promotions set data=v,updated_at=now() where id=promotion_id;if not found then raise exception 'Promotion not found';end if;end if;
   return v||jsonb_build_object('id',promotion_id);
  end if;
  raise exception 'Unknown operation';
 end if;
 return electroshop.api(p_path,p_method,p_body);
end;$$;
revoke all on function electroshop.dev_api(text,text,jsonb) from public;
grant execute on function electroshop.dev_api(text,text,jsonb) to anon,authenticated;
create or replace function public.dev_computer_api(p_path text,p_method text default 'GET',p_body jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select electroshop.dev_api(p_path,p_method,p_body);$$;
revoke all on function public.dev_computer_api(text,text,jsonb) from public;
grant execute on function public.dev_computer_api(text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
