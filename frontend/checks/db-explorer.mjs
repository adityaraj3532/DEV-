import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createShop} from '../server/shop.mjs';
import {createStore,cleanEvent} from '../server/store.mjs';
import {createAuth} from '../server/auth.mjs';
import {createExplorer} from '../server/db-explorer.mjs';
import {closeAll} from '../server/db.mjs';

const dir=mkdtempSync(join(tmpdir(),'db-explorer-'));
try{
 const shop=createShop(dir),store=createStore(dir),auth=createAuth(dir),db=createExplorer(dir);
 const asha={email:'asha@example.com',role:'customer'},p=shop.snapshot(null).products.find(x=>x.stock>0);
 const order=shop.handle(asha,'/orders','POST',{name:'Asha',phone:'9876543210',address:'1 MG Road, Pune',items:[{product_id:p.id,quantity:1}]});
 store.record(cleanEvent({type:'login',email:'asha@example.com',name:'Asha'}));
 const {code}=auth.requestCode({name:'Asha',email:'asha@example.com'});auth.verifyCode({email:'asha@example.com',code});

 const tables=db.tables().map(t=>t.name);
 for(const t of ['orders','order_items','products','customers','activity','orders_readable','customers_readable'])assert.ok(tables.includes(t),t);
 assert.ok(!tables.includes('sessions'),'sessions are hidden');
 assert.equal(db.rows('orders').rows[0].id,order.id);
 assert.equal(db.rows('order_items').rows[0].product_id,p.id);
 assert.equal(db.query("SELECT total_rupees FROM orders_readable").rows[0].total_rupees,order.total_paise/100);
 assert.equal(db.query("SELECT name FROM customers_readable").rows[0].name,'Asha');

 // Read-only: nothing typed in the SQL box can change data
 for(const bad of ["DELETE FROM orders","UPDATE products SET stock=0","DROP TABLE orders","INSERT INTO categories VALUES('x','y','z')","SELECT 1; DELETE FROM orders","PRAGMA table_info(orders)","ATTACH 'x.db' AS x","SELECT * FROM sessions"])
  assert.throws(()=>db.query(bad),undefined,bad);
 assert.throws(()=>db.query("WITH x AS (SELECT 1) DELETE FROM orders"),/SQL error|not allowed/,'CTE writes blocked by read-only connection');
 assert.throws(()=>db.rows('sessions'),/Unknown table/);
 assert.equal(db.rows('orders').total,1,'data unchanged');
 console.log('PASS: database tables and readable views, row browsing, read-only SQL (writes, multi-statements, PRAGMA, ATTACH and sessions blocked)');
}finally{closeAll();rmSync(dir,{recursive:true,force:true});}
