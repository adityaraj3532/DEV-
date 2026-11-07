// File-backed activity store for the local Node backend. No external dependencies.
import {mkdirSync,readFileSync,writeFileSync,appendFileSync,existsSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';

export const EVENT_TYPES=['login','logout','view','add_to_cart','wishlist_add','wishlist_remove','order_placed','repair_booked'];
const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const text=(v,max)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max);

/** Validates and normalises an incoming event. Throws on bad input. */
export function cleanEvent(body,now=Date.now()){
 if(!body||typeof body!=='object')throw Error('Invalid event');
 const type=text(body.type,32);
 if(!EVENT_TYPES.includes(type))throw Error('Unknown event type');
 const email=text(body.email,254).toLowerCase();
 if(email&&!EMAIL.test(email))throw Error('Invalid email');
 const detail={};
 if(body.detail&&typeof body.detail==='object')for(const [k,v] of Object.entries(body.detail).slice(0,12)){
  if(!/^[a-z_]{1,32}$/.test(k))continue;
  detail[k]=typeof v==='number'&&Number.isFinite(v)?v:text(v,200);
 }
 return {id:'EV-'+randomBytes(6).toString('hex'),type,email:email||null,name:text(body.name,80)||null,phone:text(body.phone,20)||null,session:text(body.session,40)||null,device:text(body.device,160)||null,detail,at:now};
}

export function createStore(dir){
 mkdirSync(dir,{recursive:true});
 const customersFile=join(dir,'customers.json'),activityFile=join(dir,'activity.jsonl'),keyFile=join(dir,'admin-key.txt');
 let customers=existsSync(customersFile)?JSON.parse(readFileSync(customersFile,'utf8')):{};
 let activity=existsSync(activityFile)?readFileSync(activityFile,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean):[];
 let adminKey=process.env.ADMIN_KEY||(existsSync(keyFile)?readFileSync(keyFile,'utf8').trim():'');
 if(!adminKey){adminKey=randomBytes(18).toString('base64url');writeFileSync(keyFile,adminKey+'\n',{mode:0o600});}
 const saveCustomers=()=>{const tmp=customersFile+'.tmp';writeFileSync(tmp,JSON.stringify(customers,null,1));renameSync(tmp,customersFile);};

 function record(event){
  activity.push(event);
  if(activity.length>50000)activity=activity.slice(-40000);
  appendFileSync(activityFile,JSON.stringify(event)+'\n');
  if(event.email){
   const c=customers[event.email]??={email:event.email,name:null,phone:null,first_seen:event.at,last_seen:event.at,last_login:null,logins:0,orders:0,spent_paise:0,events:0};
   c.last_seen=event.at;c.events++;
   if(event.name)c.name=event.name;
   if(event.phone)c.phone=event.phone;
   if(event.device)c.device=event.device;
   if(event.type==='login'){c.logins++;c.last_login=event.at;}
   if(event.type==='order_placed'){c.orders++;c.spent_paise+=Math.max(0,Math.round(+event.detail.total_paise||0));}
   saveCustomers();
  }
  return event;
 }
 const checkKey=k=>{const a=Buffer.from(String(k||'')),b=Buffer.from(adminKey);return a.length===b.length&&timingSafeEqual(a,b);};
 function list({email,type,limit=200}={}){
  let rows=activity;
  if(email)rows=rows.filter(e=>e.email===String(email).toLowerCase());
  if(type)rows=rows.filter(e=>e.type===type);
  return rows.slice(-Math.min(1000,Math.max(1,+limit||200))).reverse();
 }
 function summary(){
  const day=Date.now()-86400000,online=Date.now()-15*60000;
  const all=Object.values(customers);
  return {customers:all.length,active_today:all.filter(c=>c.last_seen>=day).length,online_now:all.filter(c=>c.last_seen>=online).length,
   logins_today:activity.filter(e=>e.type==='login'&&e.at>=day).length,orders:all.reduce((n,c)=>n+c.orders,0),revenue_paise:all.reduce((n,c)=>n+c.spent_paise,0),events:activity.length};
 }
 return {record,list,summary,checkKey,customers:()=>Object.values(customers).sort((a,b)=>b.last_seen-a.last_seen),adminKey:()=>adminKey,keyFile};
}
