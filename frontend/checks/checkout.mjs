import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('../src/checkout.js',import.meta.url),'utf8');
const m=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const good={name:' Asha  Verma ',phone:'+91 98765-43210',line:'12 MG Road, Indiranagar',landmark:'',city:'Bengaluru',state:'Karnataka',pin:'560038'};
let r=m.validateAddress(good);
assert.deepEqual(r.errors,{});assert.equal(r.address.name,'Asha Verma');assert.equal(r.address.phone,'9876543210');assert.equal(r.address.label,'Home');
r=m.validateAddress({...good,phone:'12345',pin:'060001',state:'Nowhere',line:'x',name:''});
assert.deepEqual(Object.keys(r.errors).sort(),['line','name','phone','pin','state']);
assert.equal(m.formatAddress({...good,landmark:'City Mall'}),'12 MG Road, Indiranagar, near City Mall, Bengaluru, Karnataka 560038');
assert.equal(m.formatAddress({line:'A',city:'B',state:'C',pin:'1'}),'A, B, C 1'); // addresses saved before this change still format
const products=[{id:1,active:1,price_paise:50000},{id:2,active:1,price_paise:80000},{id:3,active:0,price_paise:1}];
let t=m.orderTotals([{product_id:1,quantity:1},{product_id:3,quantity:1}],products);
assert.equal(t.subtotal,50000);assert.equal(t.delivery,4900);assert.equal(t.total,54900);
t=m.orderTotals([{product_id:1,quantity:1},{product_id:2,quantity:1}],products);
assert.equal(t.delivery,0);assert.equal(t.count,2);
assert.equal(m.INDIAN_STATES.length,36);
console.log('PASS: checkout address validation, formatting (incl. older saved addresses), totals and delivery fee');
