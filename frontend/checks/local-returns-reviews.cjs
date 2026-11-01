const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/local-app.js','utf8');const code=source.slice(source.indexOf('function canReturn('),source.indexOf('\nfunction action('));
const buyer={email:'buyer@demo.com',role:'customer'},owner={email:'owner@demo.com',role:'admin'};
const ctx={user:buyer,state:{products:[{id:1,name:'Camera',price_paise:10000,stock:5,active:1,returnable:true,return_days:7},{id:2,name:'Charger',price_paise:1000,stock:3,active:1,returnable:false}],orders:[],reviews:[],returns:[]},save(){}};vm.createContext(ctx);vm.runInContext(code,ctx);
(async()=>{
const o=await ctx.api('/orders','POST',{items:[{product_id:1,quantity:1},{product_id:2,quantity:1}]});ctx.state.products[0].returnable=false;assert.equal(o.items[0].returnable,true,'Checkout freezes return policy');
await assert.rejects(()=>ctx.api('/reviews','POST',{order_id:o.id,product_id:1,rating:5,text:'Good'}),/delivered/);
ctx.user=owner;for(const status of ['Confirmed','Shipped','Delivered'])await ctx.api('/admin/orders/'+o.id,'PUT',{status});assert.ok(o.delivered_at);
ctx.user={email:'stranger@demo.com',role:'customer'};await assert.rejects(()=>ctx.api('/returns','POST',{order_id:o.id,product_id:1,reason:'Faulty item'}),/own order/);await assert.rejects(()=>ctx.api('/reviews','POST',{order_id:o.id,product_id:1,rating:5,text:'Good'}),/delivered/);
ctx.user=buyer;await assert.rejects(()=>ctx.api('/returns','POST',{order_id:o.id,product_id:2,reason:'Wrong charger'}),/not eligible/);
const r=await ctx.api('/returns','POST',{order_id:o.id,product_id:1,reason:'The camera is faulty'});await assert.rejects(()=>ctx.api('/returns','POST',{order_id:o.id,product_id:1,reason:'Faulty camera'}),/already exists/);
await assert.rejects(()=>ctx.api('/admin/returns/'+r.id,'PUT',{status:'Approved',notes:'Return it'}),/Owner access/);
ctx.user=owner;const stock=ctx.state.products[0].stock;await ctx.api('/admin/returns/'+r.id,'PUT',{status:'Approved',notes:'Bring it to our shop'});assert.equal(ctx.state.products[0].stock,stock);await ctx.api('/admin/returns/'+r.id,'PUT',{status:'Received',notes:'Camera received'});assert.equal(ctx.state.products[0].stock,stock+1);await assert.rejects(()=>ctx.api('/admin/returns/'+r.id,'PUT',{status:'Received',notes:'Received again'}),/not allowed/);
ctx.user=buyer;await ctx.api('/reviews','POST',{order_id:o.id,product_id:1,rating:4,text:'Useful camera, service was helpful',display_name:'Demo Buyer',photo:'data:image/jpeg;base64,AA=='});await ctx.api('/reviews','POST',{order_id:o.id,product_id:1,rating:5,text:'Updated review after use',display_name:'Demo Buyer'});assert.equal(ctx.state.reviews.length,1);assert.equal(ctx.state.reviews[0].rating,5);await assert.rejects(()=>ctx.api('/reviews','POST',{order_id:o.id,product_id:1,rating:6,text:'Wrong rating'}),/1 to 5/);
ctx.user=null;const publicReviews=await ctx.api('/reviews/1');assert.equal(publicReviews.length,1);assert.equal(publicReviews[0].email,undefined,'Public reviews do not expose buyer email');
ctx.user=buyer;o.delivered_at=Date.now()/1000-8*86400;assert.equal(ctx.canReturn(o,o.items[0]),false,'Return window closes after policy duration');
console.log('PASS: return policy snapshot, ownership and expiry checks, non-returnable rejection, return approval and one-time restock, delivered-purchase-only reviews, edit deduplication, public review privacy');
})().catch(e=>{console.error(e);process.exit(1)});
