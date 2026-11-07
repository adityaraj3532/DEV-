import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore,cleanEvent} from '../server/store.mjs';
const dir=mkdtempSync(join(tmpdir(),'devc-'));
try{
 delete process.env.ADMIN_KEY;
 const s=createStore(dir);
 assert.throws(()=>cleanEvent({type:'hack'}));
 assert.throws(()=>cleanEvent({type:'login',email:'bad'}));
 const e=cleanEvent({type:'login',email:'A@Shop.in',name:'Asha <b>',phone:'9876543210',detail:{page:'x'.repeat(500),'bad key':1}});
 assert.equal(e.email,'a@shop.in');assert.equal(e.detail.page.length,200);assert.ok(!('bad key' in e.detail));
 s.record(e);s.record(cleanEvent({type:'order_placed',email:'a@shop.in',detail:{total_paise:150000}}));
 const [c]=s.customers();assert.equal(c.logins,1);assert.equal(c.orders,1);assert.equal(c.spent_paise,150000);assert.equal(c.name,'Asha <b>');
 assert.equal(s.list({type:'login'}).length,1);assert.equal(s.summary().customers,1);
 assert.ok(s.checkKey(s.adminKey()));assert.ok(!s.checkKey('wrong'));assert.ok(!s.checkKey(''));
 const again=createStore(dir);assert.equal(again.customers()[0].orders,1);assert.equal(again.list().length,2);assert.equal(again.adminKey(),s.adminKey());
 console.log('activity store ok');
}finally{rmSync(dir,{recursive:true,force:true});}
