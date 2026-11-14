import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createShop} from '../server/shop.mjs';

const dir=mkdtempSync(join(tmpdir(),'shop-server-'));
try{
 const owner={email:'owner@shop.in',role:'admin'},asha={email:'asha@example.com',role:'customer'},ravi={email:'ravi@example.com',role:'customer'},driver={email:'driver@shop.in',role:'delivery'};
 const shop=createShop(dir,{partners:['driver@shop.in']});
 const product=shop.snapshot(null).products.find(p=>p.stock>=3);
 assert.ok(product,'catalogue is seeded on the server');

 // Guests can browse but not act
 assert.throws(()=>shop.handle(null,'/orders','POST',{items:[{product_id:product.id,quantity:1}]}),/sign in/);
 assert.equal(shop.snapshot(null).orders.length,0);

 // Order validation
 for(const items of [[],[{product_id:product.id,quantity:0}],[{product_id:product.id,quantity:-2}],[{product_id:product.id,quantity:1.5}],[{product_id:product.id,quantity:1},{product_id:product.id,quantity:1}],[{product_id:String(product.id),quantity:1}]])
  assert.throws(()=>shop.handle(asha,'/orders','POST',{name:'Asha',phone:'9876543210',address:'1 MG Road',items}),undefined,JSON.stringify(items));
 const before=product.stock;
 const order=shop.handle(asha,'/orders','POST',{name:'Asha',phone:'9876543210',address:'1 MG Road, Pune',payment_method:'Cash on delivery',items:[{product_id:product.id,quantity:2,price_paise:1}]});
 assert.equal(order.items[0].price_paise,product.price_paise,'price comes from the server, not the client');
 assert.equal(shop.snapshot(owner).products.find(p=>p.id===product.id).stock,before-2);

 // Role filtering
 assert.equal(shop.snapshot(asha).orders.length,1);
 assert.equal(shop.snapshot(ravi).orders.length,0,'customers only see their own orders');
 assert.equal(shop.snapshot(owner).orders.length,1,'owner sees every order');
 assert.deepEqual(shop.snapshot(owner).delivery_partners,[{email:'driver@shop.in',name:'driver'}]);
 assert.equal(shop.snapshot(asha).delivery_partners,undefined);
 assert.equal(shop.snapshot(driver).orders.length,0,'unconfirmed orders are hidden from delivery');

 // Owner-only routes
 assert.throws(()=>shop.handle(asha,'/admin/orders'),/Owner access/);
 assert.throws(()=>shop.handle(asha,'/admin/products','POST',{name:'Hack',price_paise:1,stock:1}),/Owner access/);
 assert.throws(()=>shop.handle(asha,'/admin/promotions','PUT',{promotions:[]}),/Owner access/);
 assert.throws(()=>shop.handle(asha,'/admin/categories','POST',{name:'Monitors'}),/Owner access/);
 const added=shop.handle(owner,'/admin/products','POST',{id:1,name:'Office Monitor',category:'Other',price_paise:999900,stock:4});
 assert.notEqual(added.id,1,'client cannot choose product ids');

 // Delivery partner list comes from the server
 shop.handle(owner,'/admin/orders/'+order.id,'PUT',{status:'Confirmed'});
 const loc={pickup:{lat:18.52,lng:73.85},dropoff:{lat:18.53,lng:73.86},pickup_address:'Dev Computer, FC Road'};
 assert.throws(()=>shop.handle(owner,'/admin/delivery-requests/'+order.id,'POST',{...loc,assigned_to:'delivery@demo.com'}),/delivery partner/);
 shop.handle(owner,'/admin/delivery-requests/'+order.id,'POST',{...loc,assigned_to:'Driver@Shop.in'});
 assert.equal(shop.snapshot(owner).deliveryPickup.label,'Dev Computer, FC Road');
 assert.equal(shop.snapshot(driver).orders.length,1,'assigned partner sees the order');

 // Promotions and categories
 shop.handle(owner,'/admin/promotions','PUT',{promotions:[{id:'P1',kind:'Offer',title:'Diwali sale',description:'10% off laptops',published:true},{id:'P2',kind:'Event',title:'Draft',description:'Not yet',published:false}]});
 assert.equal(shop.snapshot(asha).promotions.length,1,'drafts are hidden from customers');
 assert.throws(()=>shop.handle(owner,'/admin/promotions','PUT',{promotions:[{kind:'Bad'}]}));
 shop.handle(owner,'/admin/categories','POST',{name:'Monitors',icon:'box'});
 assert.throws(()=>shop.handle(owner,'/admin/categories','POST',{name:'monitors'}),/exists/);

 // Own records only
 shop.handle(asha,'/me','PUT',{cart:{[product.id]:1},wishlist:[product.id],later:[]});
 assert.deepEqual(shop.snapshot(asha).customers['asha@example.com'].wishlist,[product.id]);
 assert.deepEqual(Object.keys(shop.snapshot(ravi).customers),['ravi@example.com'],'no access to other customers');
 assert.throws(()=>shop.handle(asha,'/me','PUT',{blob:'x'.repeat(250000)}),/too large/);

 // Repairs: customers book, only the owner updates
 const repair=shop.handle(asha,'/repairs','POST',{item:'HP laptop',problem:'Screen flickers after boot',photo:'data:image/jpeg;base64,AA=='});
 assert.equal(shop.snapshot(ravi).repairs.length,0);
 assert.throws(()=>shop.handle(asha,'/repairs/'+repair.id,'PUT',{status:'Ready for pickup',price:'500',message:'Done'}),/Owner access/);

 // Reviews never expose other customers' emails
 shop.state().reviews.push({id:'R1',product_id:product.id,email:'asha@example.com',display_name:'Asha',rating:5,text:'Great'});
 assert.equal(shop.snapshot(ravi).reviews[0].email,undefined);
 assert.equal(shop.snapshot(asha).reviews[0].email,'asha@example.com');

 // Persistence across restarts
 const again=createShop(dir,{partners:['driver@shop.in']});
 assert.equal(again.snapshot(owner).orders.length,1);
 assert.equal(again.snapshot(owner).customCategories.length,1);
 assert.ok(again.snapshot(owner).products.some(p=>p.name==='Office Monitor'));
 console.log('PASS: server shop seeding, order validation and server prices, role-filtered snapshots, owner-only routes, delivery partners, promotions, categories, own customer records, repairs, review privacy and persistence');
}finally{rmSync(dir,{recursive:true,force:true});}
