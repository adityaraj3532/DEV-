// Customer list and activity log, stored in the SQLite database (server/db.mjs).
import {mkdirSync,readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs';
import {openDb,transaction} from './db.mjs';
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
 const db=openDb(dir),customersFile=join(dir,'customers.json'),activityFile=join(dir,'activity.jsonl'),keyFile=join(dir,'admin-key.txt');
 let adminKey=process.env.ADMIN_KEY||(existsSync(keyFile)?readFileSync(keyFile,'utf8').trim():'');
 if(!adminKey){adminKey=randomBytes(18).toString('base64url');writeFileSync(keyFile,adminKey+'\n',{mode:0o600});}

 const insertEvent=db.prepare('INSERT OR IGNORE INTO activity(id,at,type,email,name,phone,session,device,detail) VALUES(?,?,?,?,?,?,?,?,?)');
 const upsertCustomer=db.prepare(`INSERT INTO customers(email,name,phone,first_seen,last_seen,last_login,logins,orders,spent_paise,events,device)
  VALUES(@email,@name,@phone,@at,@at,@login_at,@login,@order,@spent,1,@device)
  ON CONFLICT(email) DO UPDATE SET name=COALESCE(excluded.name,customers.name),phone=COALESCE(excluded.phone,customers.phone),
  last_seen=excluded.last_seen,last_login=COALESCE(excluded.last_login,customers.last_login),logins=customers.logins+excluded.logins,
  orders=customers.orders+excluded.orders,spent_paise=customers.spent_paise+excluded.spent_paise,events=customers.events+1,
  device=COALESCE(excluded.device,customers.device)`);

 // One-time import of the older file-based data (files are kept, renamed *.imported).
 const empty=!db.prepare('SELECT 1 FROM activity LIMIT 1').get()&&!db.prepare('SELECT 1 FROM customers LIMIT 1').get();
 if(empty&&existsSync(activityFile)){
  const events=readFileSync(activityFile,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);
  transaction(db,()=>{for(const e of events)insertEvent.run(e.id,e.at,e.type,e.email??null,e.name??null,e.phone??null,e.session??null,e.device??null,JSON.stringify(e.detail||{}));});
  try{renameSync(activityFile,activityFile+'.imported');}catch{}
 }
 if(empty&&existsSync(customersFile)){
  const all=Object.values(JSON.parse(readFileSync(customersFile,'utf8')));
  const st=db.prepare('INSERT OR REPLACE INTO customers(email,name,phone,first_seen,last_seen,last_login,logins,orders,spent_paise,events,device) VALUES(?,?,?,?,?,?,?,?,?,?,?)');
  transaction(db,()=>{for(const c of all)st.run(c.email,c.name??null,c.phone??null,c.first_seen??null,c.last_seen??null,c.last_login??null,c.logins||0,c.orders||0,c.spent_paise||0,c.events||0,c.device??null);});
  try{renameSync(customersFile,customersFile+'.imported');}catch{}
 }

 const toEvent=r=>({...r,detail:(()=>{try{return JSON.parse(r.detail||'{}');}catch{return {};}})()});
 function record(event){
  transaction(db,()=>{
   insertEvent.run(event.id,event.at,event.type,event.email,event.name,event.phone,event.session,event.device,JSON.stringify(event.detail||{}));
   if(event.email)upsertCustomer.run({email:event.email,name:event.name||null,phone:event.phone||null,at:event.at,device:event.device||null,
    login:event.type==='login'?1:0,login_at:event.type==='login'?event.at:null,order:event.type==='order_placed'?1:0,
    spent:event.type==='order_placed'?Math.max(0,Math.round(+event.detail?.total_paise||0)):0});
  });
  return event;
 }
 const checkKey=k=>{const a=Buffer.from(String(k||'')),b=Buffer.from(adminKey);return a.length===b.length&&timingSafeEqual(a,b);};
 function list({email,type,limit=200}={}){
  const where=[],args=[];
  if(email){where.push('email=?');args.push(String(email).toLowerCase());}
  if(type){where.push('type=?');args.push(String(type));}
  const n=Math.min(1000,Math.max(1,+limit||200));
  return db.prepare('SELECT * FROM activity'+(where.length?' WHERE '+where.join(' AND '):'')+' ORDER BY at DESC, rowid DESC LIMIT '+n).all(...args).map(toEvent);
 }
 function summary(){
  const day=Date.now()-86400000,online=Date.now()-15*60000,one=(sql,...a)=>Object.values(db.prepare(sql).get(...a))[0]||0;
  return {customers:one('SELECT COUNT(*) FROM customers'),active_today:one('SELECT COUNT(*) FROM customers WHERE last_seen>=?',day),
   online_now:one('SELECT COUNT(*) FROM customers WHERE last_seen>=?',online),logins_today:one("SELECT COUNT(*) FROM activity WHERE type='login' AND at>=?",day),
   orders:one('SELECT SUM(orders) FROM customers'),revenue_paise:one('SELECT SUM(spent_paise) FROM customers'),events:one('SELECT COUNT(*) FROM activity')};
 }
 const customers=()=>db.prepare('SELECT * FROM customers ORDER BY last_seen DESC').all().map(r=>({...r}));
 return {record,list,summary,checkKey,customers,adminKey:()=>adminKey,keyFile};
}
