// Server-side shop: the single source of truth for products, orders, returns, reviews,
// promotions, repairs, categories and each signed-in user's cart/wishlist/profile.
// The request rules below were moved from the browser (src/local-app.js api()) so they are enforced here.
import {existsSync,readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {point,sendRequest,respondRequest,withdrawRequest,shareLocation,canDrive} from '../src/delivery.js';
import {validatePromotion} from '../src/promotions.js';
import {createRepair,updateRepair} from '../src/repairs.js';
import {addLaptopSamples} from '../src/laptop-catalog.js';
import {validatePricing} from '../src/pricing.js';
import {cleanDetails} from '../src/product-details.js';

const seed=[
{id:1,name:'Everyday Pro Laptop',category:'Laptop',description:'15.6-inch display · 16GB RAM · 512GB SSD. Sample product.',price_paise:5499900,stock:6,image_url:'',active:1},
{id:2,name:'Studio Wireless Headphones',category:'Headphone',description:'Noise cancellation · 40-hour battery · soft ear cushions.',price_paise:399900,stock:15,image_url:'',active:1},
{id:3,name:'Creator USB Microphone',category:'Microphone',description:'Clear vocals for streaming, podcasts, and online classes.',price_paise:249900,stock:8,image_url:'',active:1},
{id:4,name:'Mirrorless Creator Camera',category:'Camera',description:'4K video · interchangeable lens · compact creator kit.',price_paise:6299900,stock:3,image_url:'',active:1}
];
const extraProducts=[
['Dell Inspiron 15','Laptop','Dell',49999,7],['HP Pavilion','Laptop','HP',59999,4],['Lenovo IdeaPad Slim','Laptop','Lenovo',42999,6],
['Samsung 25W USB-C Charger','Charger','Samsung',1299,20],['Anker 65W GaN Charger','Charger','Anker',3499,12],['Apple 20W USB-C Adapter','Charger','Apple',1899,10],
['Sony Alpha Camera Kit','Camera','Sony',72999,3],['Nikon Creator Camera','Camera','Nikon',68999,2],
['Sony Wireless Headphones','Headphone','Sony',8999,9],['boAt Rockerz Headphones','Headphone','boAt',1999,18],
['JBL Portable Speaker','Speaker','JBL',4499,10],['boAt Bluetooth Speaker','Speaker','boAt',1499,15],['Sony Wireless Speaker','Speaker','Sony',6999,5]
];
export function canReturn(order,item){return order.status==='Delivered'&&item.returnable&&order.delivered_at&&Date.now()/1000<=order.delivered_at+(item.return_days||7)*86400;}
const ICONS=['box','laptop','camera','headphones','speaker','mic','charger'];
const denied=(m,status=403)=>Object.assign(Error(m),{status});

export function createShop(dir,{partners=[]}={}){
 // partners: [{email,name}] (plain email strings are accepted too)
 partners=partners.map(p=>typeof p==='string'?{email:p.toLowerCase(),name:p.split('@')[0]}:{email:p.email.toLowerCase(),name:p.name||p.email.split('@')[0]});
 const partnerEmails=partners.map(p=>p.email);
 mkdirSync(dir,{recursive:true});
 const file=join(dir,'shop.json');
 let state=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{products:structuredClone(seed),orders:[]};
 state.promotions??=[];state.reviews??=[];state.returns??=[];state.repairs??=[];state.customers??={};state.customCategories??=[];
 if(!state.catalogVersion){
state.products.forEach(p=>p.brand=p.brand||({Laptop:'ASUS',Headphone:'JBL',Microphone:'Maono',Camera:'Canon'})[p.category]||'Other');
extraProducts.forEach((a,i)=>state.products.push({id:100+i,name:a[0],category:a[1],brand:a[2],price_paise:a[3]*100,stock:a[4],description:'Sample product for preview. Replace with your shop’s product details.',image_url:'',active:1}));
state.catalogVersion=2;
 }
 addLaptopSamples(state);
 const save=()=>{const tmp=file+'.tmp';writeFileSync(tmp,JSON.stringify(state));renameSync(tmp,file);};
 save();

 /** What each role is allowed to see. */
 function snapshot(user){
  const me=user?.email?.toLowerCase(),role=user?.role;
  const own=r=>me&&String(r.email||'').toLowerCase()===me;
  const base={catalogVersion:state.catalogVersion,customCategories:state.customCategories,
   products:role==='admin'?state.products:state.products.filter(p=>p.active),
   promotions:role==='admin'?state.promotions:state.promotions.filter(p=>p.published),
   reviews:state.reviews.map(r=>own(r)?r:(({email,...x})=>x)(r)),
   orders:[],returns:[],repairs:[],customers:{}};
  if(!user)return base;
  base.customers[me]=state.customers[me]||{wishlist:[],later:[],cart:{}};
  if(role==='admin')Object.assign(base,{orders:state.orders,returns:state.returns,repairs:state.repairs,deliveryPickup:state.deliveryPickup,delivery_partners:partners});
  else if(role==='delivery')base.orders=state.orders.filter(o=>o.assigned_to===me&&!['Placed','Cancelled'].includes(o.status));
  else Object.assign(base,{orders:state.orders.filter(own),returns:state.returns.filter(own),repairs:state.repairs.filter(own)});
  return base;
 }

 function handle(user,path,method='GET',body={}){
  body??={};
  if(path==='/state')return snapshot(user);
  if(path==='/products')return state.products.filter(p=>p.active);
  if(path.startsWith('/reviews/')&&method==='GET')return state.reviews.filter(r=>r.product_id===+path.split('/').pop()).map(({email,...r})=>r);
  if(!user)throw denied('Please sign in',401);
  // A user's own cart, wishlist, saved-for-later, profile, addresses and avatar.
  if(path==='/me'&&method==='PUT'){
   if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Invalid data');
   if(JSON.stringify(body).length>200000)throw Error('Saved data is too large.');
   state.customers[user.email.toLowerCase()]=body;save();return {};
  }
  if(path==='/repairs'&&method==='POST'){const r=createRepair(body,user.email);state.repairs.unshift(r);save();return r;}
  if(path.startsWith('/repairs/')&&method==='PUT'){
   if(user.role!=='admin')throw denied('Owner access required');
   const i=state.repairs.findIndex(x=>x.id===path.split('/').pop());if(i<0)throw Error('Repair not found');
   state.repairs[i]=updateRepair(state.repairs[i],body,user.role);save();return state.repairs[i];
  }
  if(path.startsWith('/admin/')&&user.role!=='admin')throw denied('Owner access required');
  if(path==='/admin/promotions'&&method==='PUT'){
   if(!Array.isArray(body.promotions)||body.promotions.length>200)throw Error('Invalid promotions');
   state.promotions=body.promotions.map(p=>({...validatePromotion(p),published:!!p.published,featured:!!p.featured}));save();return {};
  }
  if(path==='/admin/categories'&&method==='POST'){
   const name=String(body.name||'').trim().replace(/\s+/g,' ');
   if(name.length<2||name.length>40)throw Error('Enter a category name from 2 to 40 characters.');
   if(state.customCategories.some(c=>c.name.toLowerCase()===name.toLowerCase()))throw Error('This category already exists.');
   const c={id:'CAT-'+Date.now().toString(36)+Math.random().toString(36).slice(2,8),name,icon:ICONS.includes(body.icon)?body.icon:'box'};
   state.customCategories.push(c);save();return c;
  }
  if(path.startsWith('/reviews/')&&method==='GET')return (state.reviews||[]).filter(r=>r.product_id===+path.split('/').pop()).map(({email,...r})=>r);
  if(path.startsWith('/admin/products')&&['POST','PUT'].includes(method)&&body.returnable&&(!Number.isInteger(body.return_days)||body.return_days<1||body.return_days>30))throw Error('Set a return window between 1 and 30 days.');
  if(['POST','PUT'].includes(method)&&path.startsWith('/admin/products'))delete body.id;
  if(['POST','PUT'].includes(method)&&path.startsWith('/admin/products'))Object.assign(body,cleanDetails(body));
  if(['POST','PUT'].includes(method)&&path.startsWith('/admin/products')&&('price_paise' in body||'mrp_paise' in body)){const old=state.products.find(p=>p.id===+path.split('/').pop());Object.assign(body,validatePricing(body.price_paise??old?.price_paise,'mrp_paise' in body?body.mrp_paise:old?.mrp_paise));}
if(path==='/admin/products'&&method==='POST'){const p={...body,id:Date.now(),active:1};state.products.push(p);save();return p;}
  if(path.startsWith('/admin/products/')){const p=state.products.find(p=>p.id===+path.split('/').pop());if(!p)throw Error('Product not found');if(method==='DELETE')p.active=0;else Object.assign(p,body);save();return {};}
  if(path==='/returns'&&method==='POST'){
   const order=state.orders.find(o=>o.id===body.order_id&&o.email.toLowerCase()===user.email.toLowerCase());const item=order?.items.find(i=>i.product_id===+body.product_id);
   if(!order||!item)throw Error('You can only return items from your own order.');
   if(!canReturn(order,item))throw Error('This item is not eligible for return, or its return window has closed.');
   if((state.returns||[]).some(r=>r.order_id===order.id&&r.product_id===item.product_id))throw Error('A return request already exists for this item.');
   if(!body.reason||body.reason.trim().length<5||body.reason.length>1000)throw Error('Describe the return reason in 5–1000 characters.');
   const r={id:'RETURN-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),order_id:order.id,product_id:item.product_id,name:item.name,quantity:item.quantity,email:user.email,status:'Requested',reason:body.reason.trim(),created:Date.now()/1000,notes:''};(state.returns??=[]).unshift(r);save();return r;
  }
  if(path.startsWith('/admin/returns/')&&method==='PUT'){
   const r=(state.returns||[]).find(r=>r.id===path.split('/').pop());if(!r)throw Error('Return request not found');
   const allowed={Requested:['Approved','Rejected'],Approved:['Received'],Rejected:[],Received:[]};if(!allowed[r.status].includes(body.status))throw Error('This return status change is not allowed.');
   if(!body.notes||body.notes.trim().length<3)throw Error('Add a short note for the customer.');
   if(body.status==='Received'){const p=state.products.find(p=>p.id===r.product_id);if(p)p.stock+=r.quantity;}
   r.status=body.status;r.notes=body.notes.trim().slice(0,1000);r.updated=Date.now()/1000;save();return r;
  }
  if(path==='/reviews'&&method==='POST'){
   const order=state.orders.find(o=>o.id===body.order_id&&o.email.toLowerCase()===user.email.toLowerCase()&&o.status==='Delivered');
   if(!order?.items.some(i=>i.product_id===+body.product_id))throw Error('Only customers with a delivered order for this product can review it.');
   if(!Number.isInteger(body.rating)||body.rating<1||body.rating>5)throw Error('Choose a rating from 1 to 5.');
   if(!body.text||body.text.trim().length<3||body.text.length>2000)throw Error('Write a review in 3–2000 characters.');
   if(body.photo&&(!/^data:image\/jpeg;base64,/.test(body.photo)||body.photo.length>800000))throw Error('Choose a smaller JPG, PNG, or WebP photo.');
   const reviews=state.reviews??=[],old=reviews.find(r=>r.product_id===+body.product_id&&r.email.toLowerCase()===user.email.toLowerCase());
   const review={id:old?.id||'REVIEW-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),product_id:+body.product_id,order_id:order.id,email:user.email,display_name:String(body.display_name||'Customer').trim().slice(0,60)||'Customer',rating:body.rating,text:body.text.trim(),photo:body.photo||'',created:old?.created||Date.now()/1000,updated:Date.now()/1000};
   if(old)Object.assign(old,review);else reviews.unshift(review);save();return {message:'Review published'};
  }
  if(path==='/orders'&&method==='POST'){
   if(!Array.isArray(body.items)||!body.items.length||body.items.length>50)throw Error('Your cart is empty.');
   const seen=new Set();for(const i of body.items){if(!Number.isInteger(i?.quantity)||i.quantity<1||i.quantity>50||!Number.isInteger(i.product_id)||seen.has(i.product_id))throw Error('Invalid cart. Refresh your cart.');seen.add(i.product_id);}
   body.items=body.items.map(i=>({product_id:i.product_id,quantity:i.quantity}));
   const destination=point(body.destination,true);
   const items=body.items.map(i=>{const p=state.products.find(p=>p.id===i.product_id&&p.active);if(!p||p.stock<i.quantity)throw Error('Insufficient stock. Refresh your cart.');return {...i,name:p.name,price_paise:p.price_paise,returnable:!!p.returnable,return_days:p.returnable?(p.return_days||7):0};});
   let total=items.reduce((s,i)=>s+i.price_paise*i.quantity,0);if(total<100000)total+=4900;
   const o={id:'DEMO-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,5).toUpperCase(),email:user.email,destination,name:body.name,phone:body.phone,address:body.address,items,total_paise:total,status:'Placed',payment_method:body.payment_method||'COD',payment_status:body.payment_method==='Online demo'?'Simulated success — no money charged':'Pay on delivery',payment_reference:body.payment_reference||'',payment_channel:body.payment_method==='Online demo'&&['UPI','Debit / credit card','Net banking'].includes(body.payment_channel)?body.payment_channel:'',history:[{status:'Placed',note:'Order received. Waiting for owner confirmation.',at:Date.now()/1000,actor:'Customer'}],created:Date.now()/1000};
   items.forEach(i=>state.products.find(p=>p.id===i.product_id).stock-=i.quantity);state.orders.unshift(o);save();return o;
  }
  if(path==='/orders')return state.orders.filter(o=>o.email===user.email);
  if(path==='/admin/orders')return state.orders;
  if(path.startsWith('/admin/delivery-requests/')&&method==='POST'){
   const o=state.orders.find(o=>o.id===path.split('/').pop());if(!o)throw Error('Order not found');sendRequest(o,user,body,partnerEmails);o.assigned_name=partners.find(p=>p.email===o.assigned_to)?.name||o.assigned_to;state.deliveryPickup=o.locations.pickup;save();return o;
  }
  if(path.startsWith('/admin/withdraw-delivery/')&&method==='POST'){
   const o=state.orders.find(o=>o.id===path.split('/').pop());if(!o)throw Error('Order not found');withdrawRequest(o,user);save();return o;
  }
  if(path.startsWith('/delivery/requests/')&&method==='POST'){
   const o=state.orders.find(o=>o.id===path.split('/').pop());if(!o)throw Error('Order not found');respondRequest(o,user,body);save();return o;
  }
  if(path.startsWith('/delivery/location/')&&method==='POST'){
   const o=state.orders.find(o=>o.id===path.split('/').pop());if(!o)throw Error('Order not found');shareLocation(o,user,body);o.driver_area=body.source==='manual'?String(body.label||'Area set manually').slice(0,200):'Live GPS position on map';save();return o;
  }
  if(path==='/delivery/orders'){if(user.role!=='delivery')throw Error('Delivery access required');return state.orders.filter(o=>o.assigned_to===user.email.toLowerCase()&&!['Placed','Cancelled'].includes(o.status));}
  if(path.startsWith('/admin/orders/')||path.startsWith('/delivery/orders/')){
   const o=state.orders.find(o=>o.id===path.split('/').pop());if(!o)throw Error('Order not found');
   const isOwner=user.role==='admin';
   if(!isOwner&&(user.role!=='delivery'||o.assigned_to!==user.email.toLowerCase()))throw Error('This delivery is not assigned to you');
   if(o.status==='Placed'&&['assigned_to','courier','tracking','eta'].some(k=>k in body))throw Error('The owner must confirm this order before assigning or updating delivery.');
   if(!isOwner&&o.status!=='Placed'&&!canDrive(o,user))throw Error('Accept the delivery request before updating delivery status.');
   if(o.status==='Placed'&&!isOwner)throw Error('Only the owner can confirm or reject a new order.');
   if('assigned_to' in body)throw Error('Use Send delivery request to invite a delivery partner.');
   if(body.status&&['Shipped','Out for delivery','Delivered','Delivery failed'].includes(body.status)&&o.assigned_to&&o.delivery_request?.status!=='Accepted')throw Error('The delivery partner must accept the request before dispatch.');
   const allowed={Placed:['Confirmed','Cancelled'],Confirmed:['Shipped','Cancelled'],Shipped:['Out for delivery','Delivered','Delivery failed'], 'Out for delivery':['Delivered','Delivery failed'],'Delivery failed':['Out for delivery'],Delivered:[],Cancelled:[]};
   if(body.status&&body.status!==o.status){if(!allowed[o.status]?.includes(body.status)||(!isOwner&&!['Shipped','Out for delivery','Delivered','Delivery failed'].includes(body.status)))throw Error('This status change is not allowed');if(body.status==='Cancelled')o.items.forEach(i=>state.products.find(p=>p.id===i.product_id).stock+=i.quantity);if(body.status==='Delivered')o.delivered_at=Date.now()/1000;o.status=body.status;}
   if('assigned_to' in body)throw Error('Use Send delivery request to invite a delivery partner.');
   if('courier' in body)o.courier=body.courier;
   if('tracking' in body)o.tracking=body.tracking;
   if('eta' in body)o.eta=body.eta;
   o.history??=[{status:'Placed',note:'Order received. Waiting for owner confirmation.',at:o.created,actor:'Customer'}];
   o.history.push({status:o.status,note:body.note||'Delivery information updated',at:Date.now()/1000,actor:isOwner?'Shop owner':'Delivery partner'});save();return {};
  }
  throw Object.assign(Error('Not found'),{status:404});
 }
 return {handle,snapshot,state:()=>state};
}
