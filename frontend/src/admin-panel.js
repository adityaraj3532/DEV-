// Owner "Activity" panel: customers who signed in and everything they did.
import {adminFetch,adminKey,localActivity,customersFromEvents} from './activity.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((n||0)/100);
const when=t=>t?new Date(t).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'—';
const labels={login:'Signed in',logout:'Signed out',view:'Viewed',add_to_cart:'Added to cart',wishlist_add:'Wishlisted',wishlist_remove:'Removed from wishlist',order_placed:'Placed order',repair_booked:'Booked repair'};
const describe=e=>{const d=e.detail||{};return [d.page,d.product,d.order_id,d.total_paise!=null?money(d.total_paise):'',d.item].filter(Boolean).map(esc).join(' · ');};

async function load(){
 try{
  const [summary,customers,activity]=await Promise.all([adminFetch('summary'),adminFetch('customers'),adminFetch('activity?limit=300')]);
  return {source:'server',summary,customers,activity};
 }catch(err){
  if(err.code===401)return {source:'locked'};
  const activity=localActivity(),customers=customersFromEvents(activity),day=Date.now()-86400000;
  return {source:'local',customers,activity:activity.slice(0,300),summary:{customers:customers.length,active_today:customers.filter(c=>c.last_seen>=day).length,online_now:customers.filter(c=>c.last_seen>=Date.now()-900000).length,logins_today:activity.filter(e=>e.type==='login'&&e.at>=day).length,orders:customers.reduce((n,c)=>n+c.orders,0),revenue_paise:customers.reduce((n,c)=>n+c.spent_paise,0),events:activity.length}};
 }
}

function csv(rows){const cols=['email','name','phone','first_seen','last_login','last_seen','logins','orders','spent_paise','events'];
 return [cols.join(','),...rows.map(r=>cols.map(c=>{let v=r[c]??'';if(/_seen|last_login/.test(c)&&v)v=new Date(v).toISOString();v=String(v);if(/^[=+\-@]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}).join(','))].join('\n');}

export async function adminPanel(view,{filterEmail='',filterType=''}={}){
 view.innerHTML='<section class="card"><p>Loading activity…</p></section>';
 const data=await load();
 if(data.source==='locked'){
  view.innerHTML=`<section class="card admin-panel"><h2>Activity — owner access</h2><p>Sign in with an owner email, or enter the admin key printed when the backend started (stored in <code>frontend/data/admin-key.txt</code>, or set with the <code>ADMIN_KEY</code> environment variable).</p><form id="adminKeyForm"><label>Admin key<input name="key" type="password" autocomplete="off" required></label><button>Unlock</button></form></section>`;
  view.querySelector('#adminKeyForm').onsubmit=e=>{e.preventDefault();adminKey.set(new FormData(e.target).get('key').trim());adminPanel(view);};
  return;
 }
 const s=data.summary;
 const customers=data.customers,activity=data.activity.filter(e=>(!filterEmail||e.email===filterEmail)&&(!filterType||e.type===filterType));
 view.innerHTML=`<section class="admin-panel">
 <div class="section-bar"><h2>Customer activity</h2><div class="row"><button id="adminRefresh" class="secondary">Refresh</button><button id="adminExport" class="secondary">Export customers (CSV)</button>${data.source==='server'?'<button id="adminLock" class="secondary">Lock</button>':''}</div></div>
 <p class="muted admin-source">${data.source==='server'?'Live from the backend — includes every device that uses this server.':'Backend not reachable — showing activity recorded in this browser only. Start it with <code>npm start</code>.'}</p>
 <div class="admin-stats">${[['Customers',s.customers],['Online now',s.online_now],['Active today',s.active_today],['Sign-ins today',s.logins_today],['Orders',s.orders],['Order value',money(s.revenue_paise)]].map(([k,v])=>`<div class="card"><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div>
 <section class="card"><h3>Signed-in customers</h3>${customers.length?`<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Last sign-in</th><th>Last active</th><th>Sign-ins</th><th>Orders</th><th>Spent</th><th></th></tr></thead><tbody>${customers.map(c=>`<tr><td><strong>${esc(c.name||'—')}</strong><br><small>${esc(c.email)}</small></td><td>${esc(c.phone||'—')}</td><td>${when(c.last_login)}</td><td>${when(c.last_seen)}</td><td>${c.logins}</td><td>${c.orders}</td><td>${money(c.spent_paise)}</td><td><button class="secondary" data-customer="${esc(c.email)}">Activity</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">No customer has signed in yet.</p>'}</section>
 <section class="card"><div class="section-bar"><h3>Activity feed${filterEmail?' — '+esc(filterEmail):''}</h3><div class="row"><select id="adminType" aria-label="Filter by activity"><option value="">All activity</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}" ${k===filterType?'selected':''}>${v}</option>`).join('')}</select>${filterEmail?'<button id="adminClear" class="secondary">All customers</button>':''}</div></div>
 ${activity.length?`<ul class="admin-feed">${activity.map(e=>`<li><time>${when(e.at)}</time><span class="admin-badge admin-${esc(e.type)}">${esc(labels[e.type]||e.type)}</span><span>${esc(e.name||e.email||'Guest')}${e.detail&&describe(e)?' — '+describe(e):''}</span></li>`).join('')}</ul>`:'<p class="muted">No activity matches.</p>'}</section></section>`;
 view.querySelector('#adminRefresh').onclick=()=>adminPanel(view,{filterEmail,filterType});
 view.querySelector('#adminLock')?.addEventListener('click',()=>{adminKey.set('');adminPanel(view);});
 view.querySelector('#adminClear')?.addEventListener('click',()=>adminPanel(view,{filterType}));
 view.querySelector('#adminType').onchange=e=>adminPanel(view,{filterEmail,filterType:e.target.value});
 view.querySelectorAll('[data-customer]').forEach(b=>b.onclick=()=>adminPanel(view,{filterEmail:b.dataset.customer,filterType}));
 view.querySelector('#adminExport').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv(customers)],{type:'text/csv'}));a.download='customers.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
}
