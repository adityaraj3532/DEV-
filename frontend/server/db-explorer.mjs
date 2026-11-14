// Owner-only database explorer: list tables, browse rows, run read-only SQL.
// Queries use a separate READ-ONLY connection, so nothing typed here can change or delete data.
import {openDb,openReadOnly} from './db.mjs';

const HIDDEN=new Set(['sessions']); // sign-in tokens (hashed) are never shown
const MAX_ROWS=500,MAX_CELL=300;

// Plain-English descriptions shown in the Database page.
export const DESCRIPTIONS={
 orders_readable:'Every order, newest first, with prices in rupees and normal dates. Start here.',
 customers_readable:'Everyone who signed in: sign-ins, orders, money spent, last activity.',
 activity_readable:'Everything people did (sign-ins, pages viewed, add to cart, orders), newest first.',
 products_readable:'Your catalogue with prices in rupees and whether each item is on sale.',
 orders:'Raw orders table. Money is in paise (₹1 = 100 paise). "data" holds the full order as JSON.',
 order_items:'One row per product in each order (order_id links to orders.id).',
 products:'Raw products table. price_paise is in paise.',
 customers:'Raw customer table. Times are milliseconds since 1970 (use customers_readable for dates).',
 activity:'Raw activity log. "at" is milliseconds since 1970; "detail" is JSON.',
 returns:'Return requests from customers.',
 reviews:'Product reviews (rating 1–5).',
 promotions:'Offers and events you created.',
 repairs:'Repair bookings and their status.',
 categories:'Custom product categories you added.',
 saved_user_data:'Each signed-in person’s cart, wishlist, saved addresses and profile (JSON).',
 settings:'Small app settings.'
};

const cell=v=>typeof v==='string'&&v.length>MAX_CELL?v.slice(0,MAX_CELL)+'… ('+v.length+' characters)':typeof v==='bigint'?Number(v):v;
const tidy=row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,cell(v)]));

export function createExplorer(dir){
 const db=openDb(dir);
 function tables(){
  return db.prepare("SELECT name,type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type DESC,name").all()
   .filter(t=>!HIDDEN.has(t.name))
   .map(t=>({name:t.name,type:t.type,rows:db.prepare(`SELECT COUNT(*) AS n FROM "${t.name}"`).get().n,
    columns:db.prepare(`SELECT name,type FROM pragma_table_info(?)`).all(t.name).map(c=>({...c})),description:DESCRIPTIONS[t.name]||''}));
 }
 function rows(name,limit=50,offset=0){
  const t=tables().find(t=>t.name===name);if(!t)throw Error('Unknown table');
  limit=Math.min(200,Math.max(1,+limit||50));offset=Math.max(0,+offset||0);
  const order=t.type==='table'?' ORDER BY rowid DESC':'';
  return {table:t.name,total:t.rows,limit,offset,rows:db.prepare(`SELECT * FROM "${t.name}"${order} LIMIT ? OFFSET ?`).all(limit,offset).map(tidy)};
 }
 function query(sqlText){
  const sql=String(sqlText||'').trim().replace(/;\s*$/,'');
  if(!sql)throw Error('Type a query first.');
  if(sql.length>5000)throw Error('Query is too long.');
  if(sql.includes(';'))throw Error('Run one query at a time (remove the extra ";").');
  if(!/^(select|with)\b/i.test(sql))throw Error('Only SELECT queries are allowed here (this page can read data, not change it).');
  if(/\b(attach|detach|pragma|load_extension|vacuum)\b/i.test(sql))throw Error('That command is not allowed here.');
  if(/\bsessions\b/i.test(sql))throw Error('The sessions table is private.');
  const ro=openReadOnly(dir);
  try{
   const started=Date.now(),out=[];
   for(const r of ro.prepare(sql).iterate()){out.push(tidy(r));if(out.length>=MAX_ROWS)break;}
   return {rows:out,truncated:out.length>=MAX_ROWS,ms:Date.now()-started};
  }catch(e){throw Error('SQL error: '+e.message);}
  finally{ro.close();}
 }
 return {tables,rows,query};
}
