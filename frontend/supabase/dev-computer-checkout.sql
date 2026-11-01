create table electroshop.checkout_requests(user_id uuid not null references auth.users(id),request_key text not null,body jsonb not null,response jsonb not null,created_at timestamptz not null default now(),primary key(user_id,request_key));
alter table electroshop.checkout_requests enable row level security;
revoke all on electroshop.checkout_requests from anon,authenticated;
create policy dev_rpc_only on electroshop.checkout_requests for all to anon,authenticated using(false) with check(false);
do $patch$
declare definition text;
begin
 select pg_get_functiondef('electroshop.dev_api(text,text,jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'return electroshop.api(p_path,p_method,p_body);',
 'if p_path=''/orders'' and p_method=''POST'' and p_body ? ''checkout_key'' then
 if auth.uid() is null then raise exception ''Please sign in first'';end if;
 if length(coalesce(p_body->>''checkout_key'','''')) not between 16 and 100 then raise exception ''Invalid checkout key'';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||(p_body->>''checkout_key''),0));
 select response into result from electroshop.checkout_requests where user_id=auth.uid() and request_key=p_body->>''checkout_key'';
 if result is not null then
 if exists(select 1 from electroshop.checkout_requests where user_id=auth.uid() and request_key=p_body->>''checkout_key'' and body<>p_body) then raise exception ''Checkout key reused for different order'';end if;
 return result;end if;
 result:=electroshop.api(p_path,p_method,p_body);
 insert into electroshop.checkout_requests(user_id,request_key,body,response) values(auth.uid(),p_body->>''checkout_key'',p_body,result);
 return result;
 end if;
 if p_path like ''/orders/%/cancel'' and p_method=''POST'' then
 if auth.uid() is null then raise exception ''Please sign in first'';end if;
 select data into result from electroshop.orders where id=split_part(p_path,''/'',3) and user_id=auth.uid() for update;
 if result is null then raise exception ''Order not found'';end if;
 if result->>''status''=''Cancelled'' then return result;end if;
 if result->>''status'' not in (''Placed'',''Confirmed'') then raise exception ''This order has already shipped and cannot be cancelled'';end if;
 for v in select value from jsonb_array_elements(result->''items'') loop
 update electroshop.products set data=jsonb_set(data,''{stock}'',to_jsonb((data->>''stock'')::int+(v->>''quantity'')::int)) where id=(v->>''product_id'')::bigint;
 end loop;
 result:=result||jsonb_build_object(''status'',''Cancelled'',''history'',coalesce(result->''history'',''[]'')||jsonb_build_array(jsonb_build_object(''status'',''Cancelled'',''note'',''Cancelled by customer before shipping'',''actor'',''Customer'',''at'',extract(epoch from now())::bigint)));
 update electroshop.orders set data=result where id=result->>''id'';return result;
 end if;
 return electroshop.api(p_path,p_method,p_body);');
 execute definition;
end;$patch$;
