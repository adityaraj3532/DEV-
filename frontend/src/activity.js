// Customer sign-in storage and activity tracking.
// Events are kept in this browser and also sent to the local Node backend (/api/events) when it is running.
const CUSTOMER_KEY='devcomputer-customer-v1',LOG_KEY='devcomputer-activity-v1',ADMIN_KEY='devcomputer-admin-key';
const safe=(fn,fallback)=>{try{return fn();}catch{return fallback;}};

export function storedCustomer(){return safe(()=>JSON.parse(localStorage.getItem(CUSTOMER_KEY)||'null'),null);}
export function storeCustomer(c){safe(()=>c?localStorage.setItem(CUSTOMER_KEY,JSON.stringify(c)):localStorage.removeItem(CUSTOMER_KEY));}

export function validateCustomer(f){
 const name=String(f.name||'').trim().replace(/\s+/g,' '),email=String(f.email||'').trim().toLowerCase(),phone=String(f.phone||'').replace(/[\s-]/g,'');
 if(name.length<2||name.length>80)throw Error('Enter your name (2–80 characters).');
 if(!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email))throw Error('Enter a valid email address.');
 if(['owner@demo.com','delivery@demo.com'].includes(email))throw Error('That email is reserved for staff portals.');
 if(phone&&!/^\+?\d{10,13}$/.test(phone))throw Error('Enter a 10-digit phone number, or leave it blank.');
 return {name,email,phone};
}

function session(){return safe(()=>{let s=sessionStorage.getItem('devcomputer-session');if(!s){s='S-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('');sessionStorage.setItem('devcomputer-session',s);}return s;},null);}
let lastView='',lastViewAt=0;

export function track(type,user,detail={}){
 if(user&&user.role!=='customer')return; // only customer activity is recorded
 if(type==='view'){const now=Date.now();if(detail.page===lastView&&now-lastViewAt<30000)return;lastView=detail.page;lastViewAt=now;}
 const event={type,email:user?.email||null,name:user?.name||null,phone:user?.phone||null,session:session(),device:navigator.userAgent.slice(0,160),detail,at:Date.now()};
 safe(()=>{const log=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');log.push(event);localStorage.setItem(LOG_KEY,JSON.stringify(log.slice(-1500)));});
 if(location.protocol.startsWith('http'))fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(event),keepalive:true}).catch(()=>{});
}

export function localActivity(){return safe(()=>JSON.parse(localStorage.getItem(LOG_KEY)||'[]'),[]).slice().reverse();}

/** Builds customer rows from a list of events (used when the backend is not running). */
export function customersFromEvents(events){
 const map={};
 for(const e of [...events].sort((a,b)=>a.at-b.at)){if(!e.email)continue;const c=map[e.email]??={email:e.email,name:null,phone:null,first_seen:e.at,last_seen:e.at,last_login:null,logins:0,orders:0,spent_paise:0,events:0};
  c.last_seen=e.at;c.events++;if(e.name)c.name=e.name;if(e.phone)c.phone=e.phone;if(e.device)c.device=e.device;
  if(e.type==='login'){c.logins++;c.last_login=e.at;}if(e.type==='order_placed'){c.orders++;c.spent_paise+=Math.max(0,+e.detail?.total_paise||0);}}
 return Object.values(map).sort((a,b)=>b.last_seen-a.last_seen);
}

export const adminKey={get:()=>safe(()=>sessionStorage.getItem(ADMIN_KEY)||'',''),set:k=>safe(()=>k?sessionStorage.setItem(ADMIN_KEY,k):sessionStorage.removeItem(ADMIN_KEY))};

export async function adminFetch(path){
 const r=await fetch('/api/admin/'+path,{headers:{'x-admin-key':adminKey.get()}});
 if(r.status===401)throw Object.assign(Error('Admin key required'),{code:401});
 if(!r.ok)throw Error('Backend error '+r.status);
 return r.json();
}
