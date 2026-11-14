// Owner "Database" page: see every table, browse rows, and practise SQL safely (read-only).
import {API,adminKey,storedCustomer} from './activity.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers=()=>({'Content-Type':'application/json','x-admin-key':adminKey.get(),...(storedCustomer()?.token?{Authorization:'Bearer '+storedCustomer().token}:{})});
async function call(path,body){
 const r=await fetch(API+'/api/admin/db/'+path,{method:body?'POST':'GET',headers:headers(),body:body?JSON.stringify(body):undefined});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(r.status===401?'Sign in with an owner email to see the database.':data.error||'Request failed');
 return data;
}

// Ready-made questions to learn from. Click one, then press Run.
const EXAMPLES=[
 ['Latest orders',"SELECT order_id, placed_at, customer_name, status, total_rupees\nFROM orders_readable\nLIMIT 20"],
 ['Orders waiting for you',"SELECT order_id, customer_name, phone, total_rupees\nFROM orders_readable\nWHERE status = 'Placed'"],
 ['Sales per day',"SELECT date(placed_at) AS day, COUNT(*) AS orders, SUM(total_rupees) AS rupees\nFROM orders_readable\nWHERE status != 'Cancelled'\nGROUP BY day\nORDER BY day DESC"],
 ['Best-selling products',"SELECT product_name, SUM(quantity) AS sold\nFROM order_items\nGROUP BY product_name\nORDER BY sold DESC\nLIMIT 10"],
 ['Top customers',"SELECT name, email, orders, spent_rupees\nFROM customers_readable\nORDER BY spent_rupees DESC\nLIMIT 10"],
 ['Low stock',"SELECT name, category, stock\nFROM products_readable\nWHERE stock <= 3 AND on_sale = 'yes'\nORDER BY stock"],
 ['Most viewed pages',"SELECT json_extract(detail, '$.page') AS page, COUNT(*) AS views\nFROM activity\nWHERE type = 'view'\nGROUP BY page\nORDER BY views DESC"],
 ['Today’s activity',"SELECT time, type, who\nFROM activity_readable\nWHERE date(time) = date('now','localtime')"]
];

function table(rows){
 if(!rows.length)return '<p class="muted">No rows.</p>';
 const cols=Object.keys(rows[0]);
 return `<div class="admin-table-wrap"><table class="admin-table db-table"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td title="${esc(r[c])}">${r[c]===null?'<span class="muted">NULL</span>':esc(r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

export async function databasePanel(view){
 view.innerHTML='<section class="card"><p>Loading database…</p></section>';
 let info;
 try{info=await call('tables');}catch(e){view.innerHTML=`<section class="card"><h2>Database</h2><p>${esc(e.message)}</p></section>`;return;}
 const views=info.tables.filter(t=>t.type==='view'),raw=info.tables.filter(t=>t.type==='table');
 const tile=t=>`<button class="db-table-tile secondary" data-table="${esc(t.name)}"><strong>${esc(t.name)}</strong><small>${t.rows} rows${t.type==='view'?' · easy view':''}</small></button>`;
 view.innerHTML=`<section class="admin-panel db-panel">
 <div class="section-bar"><h2>Database</h2><button id="dbRefresh" class="secondary">Refresh</button></div>
 <p class="muted">Your shop is stored in the SQLite file <code>frontend/data/${esc(info.file)}</code>. This page is <strong>read-only</strong>: you can look and ask questions, but nothing here can change or delete data.</p>
 <section class="card"><h3>1 · Start with the easy views</h3><p class="muted">Views are saved questions that show tables in a friendly way (rupees, normal dates).</p><div class="db-tiles">${views.map(tile).join('')}</div>
 <h3>2 · Raw tables</h3><p class="muted">Where the data really lives. Money is in paise (₹1 = 100 paise).</p><div class="db-tiles">${raw.map(tile).join('')}</div></section>
 <section class="card" id="dbBrowse" hidden></section>
 <section class="card"><h3>3 · Ask your own question (SQL)</h3><p class="muted">Pick an example, change it, and press Run. SQL reads like English: <code>SELECT</code> columns <code>FROM</code> a table <code>WHERE</code> a condition.</p>
 <div class="db-examples">${EXAMPLES.map(([t],i)=>`<button class="secondary" data-example="${i}">${esc(t)}</button>`).join('')}</div>
 <textarea id="dbSql" class="db-sql" spellcheck="false" rows="6">${esc(EXAMPLES[0][1])}</textarea>
 <div class="row"><button id="dbRun">Run query</button><span id="dbStatus" class="muted" role="status"></span></div>
 <div id="dbResult"></div></section></section>`;

 const browse=view.querySelector('#dbBrowse');
 async function show(name,offset=0){
  const t=info.tables.find(x=>x.name===name),page=await call(`rows?table=${encodeURIComponent(name)}&limit=50&offset=${offset}`);
  browse.hidden=false;
  browse.innerHTML=`<div class="section-bar"><h3>${esc(name)}</h3><span class="muted">${page.total} rows</span></div>${t?.description?`<p>${esc(t.description)}</p>`:''}
  <details><summary>Columns (${t.columns.length})</summary><p class="muted">${t.columns.map(c=>`<code>${esc(c.name)}</code>${c.type?' '+esc(c.type):''}`).join(' · ')}</p></details>
  ${table(page.rows)}
  <div class="row">${offset>0?'<button class="secondary" id="dbPrev">← Newer</button>':''}${offset+page.rows.length<page.total?'<button class="secondary" id="dbNext">Older →</button>':''}<button class="secondary" id="dbAsk">Query this table</button><span class="muted">Showing ${page.total?offset+1:0}–${offset+page.rows.length}</span></div>`;
  browse.querySelector('#dbPrev')?.addEventListener('click',()=>show(name,Math.max(0,offset-50)));
  browse.querySelector('#dbNext')?.addEventListener('click',()=>show(name,offset+50));
  browse.querySelector('#dbAsk').onclick=()=>{view.querySelector('#dbSql').value=`SELECT *\nFROM ${name}\nLIMIT 20`;view.querySelector('#dbSql').scrollIntoView({block:'center'});};
  browse.scrollIntoView({block:'start',behavior:'smooth'});
 }
 view.querySelectorAll('[data-table]').forEach(b=>b.onclick=()=>show(b.dataset.table).catch(e=>{browse.hidden=false;browse.textContent=e.message;}));
 view.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{view.querySelector('#dbSql').value=EXAMPLES[+b.dataset.example][1];});
 view.querySelector('#dbRefresh').onclick=()=>databasePanel(view);
 view.querySelector('#dbRun').onclick=async()=>{
  const status=view.querySelector('#dbStatus'),out=view.querySelector('#dbResult');status.textContent='Running…';out.innerHTML='';
  try{const r=await call('query',{sql:view.querySelector('#dbSql').value});status.textContent=`${r.rows.length}${r.truncated?'+':''} row${r.rows.length===1?'':'s'} · ${r.ms} ms`;out.innerHTML=table(r.rows);}
  catch(e){status.textContent='';out.innerHTML=`<p class="notice">${esc(e.message)}</p>`;}
 };
}
