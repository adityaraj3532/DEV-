create policy shop_rpc_only on electroshop.roles for all to anon,authenticated using(false) with check(false);
create policy shop_rpc_only on electroshop.products for all to anon,authenticated using(false) with check(false);
create policy shop_rpc_only on electroshop.customers for all to anon,authenticated using(false) with check(false);
create policy shop_rpc_only on electroshop.orders for all to anon,authenticated using(false) with check(false);
create policy shop_rpc_only on electroshop.reviews for all to anon,authenticated using(false) with check(false);
create policy shop_rpc_only on electroshop.returns for all to anon,authenticated using(false) with check(false);
