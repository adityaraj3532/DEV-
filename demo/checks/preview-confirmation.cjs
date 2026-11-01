const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');
const source=fs.readFileSync('src/preview.js','utf8');const apiCode=source.slice(source.indexOf('async function api('),source.indexOf('\nfunction action('));
const ctx={user:{email:'owner@demo.com',role:'admin'},state:{products:[{id:1,name:'Laptop',price_paise:10000,stock:3,active:1}],orders:[]},save(){},sessionStorage:{setItem(){},removeItem(){}}};vm.createContext(ctx);vm.runInContext(apiCode,ctx);
(async()=>{
const order=await ctx.api('/orders','POST',{name:'Demo',phone:'9876543210',address:'Sample address',payment_method:'Online demo',items:[{product_id:1,quantity:1}]});
assert.equal(order.status,'Placed','Even online-paid demo orders must await approval');
await assert.rejects(()=>ctx.api('/admin/orders/'+order.id,'PUT',{status:'Shipped'}),/not allowed/);
await assert.rejects(()=>ctx.api('/admin/orders/'+order.id,'PUT',{assigned_to:'delivery@demo.com'}),/must confirm/);
await assert.rejects(()=>ctx.api('/admin/orders/'+order.id,'PUT',{status:'Confirmed',assigned_to:'delivery@demo.com'}),/must confirm/);
order.assigned_to='delivery@demo.com';ctx.user={email:'delivery@demo.com',role:'delivery'};
assert.equal((await ctx.api('/delivery/orders')).length,0,'Pending orders hidden from delivery');
await assert.rejects(()=>ctx.api('/delivery/orders/'+order.id,'PUT',{status:'Confirmed'}),/Only the owner/);
ctx.user={email:'owner@demo.com',role:'admin'};await ctx.api('/admin/orders/'+order.id,'PUT',{status:'Confirmed',note:'Accepted'});assert.equal(order.status,'Confirmed');
await ctx.api('/admin/orders/'+order.id,'PUT',{assigned_to:'delivery@demo.com',note:'Assigned'});
ctx.user={email:'delivery@demo.com',role:'delivery'};assert.equal((await ctx.api('/delivery/orders')).length,1);
await ctx.api('/delivery/orders/'+order.id,'PUT',{status:'Shipped',note:'Dispatched'});assert.equal(order.status,'Shipped');
ctx.user={email:'owner@demo.com',role:'admin'};const rejected=await ctx.api('/orders','POST',{items:[{product_id:1,quantity:1}]});await ctx.api('/admin/orders/'+rejected.id,'PUT',{status:'Cancelled'});assert.equal(ctx.state.products[0].stock,2,'Rejecting restores reserved stock');
console.log('PASS: pending order locks, owner-only approval, delivery release after confirmation, rejection stock restoration');
})().catch(e=>{console.error(e);process.exit(1);});
