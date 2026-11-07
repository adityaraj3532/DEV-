import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const code=await readFile(new URL('../src/laptop-catalog.js',import.meta.url),'utf8');
const {addLaptopSamples,laptopSamples}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const existing={id:1,name:'My shop laptop',price_paise:12345,stock:2};const state={products:[existing]};
assert.equal(addLaptopSamples(state),true);assert.equal(state.products.length,4);assert.equal(state.products.find(p=>p.id===1),existing);
state.products[0].stock=1;assert.equal(addLaptopSamples(state),false);assert.equal(state.products[0].stock,1);
for(const p of laptopSamples){assert(p.sample_listing);assert(Object.keys(p.specifications).length>=4);assert((await stat(new URL('../src'+p.image_url,import.meta.url))).size>1000);}
const duplicate={products:[{...laptopSamples[0],stock:0,active:0}]};addLaptopSamples(duplicate);assert.equal(duplicate.products.filter(p=>p.id===80101).length,1);assert.equal(duplicate.products.find(p=>p.id===80101).active,0);
console.log('PASS: laptop additions are idempotent, preserve owner products and removed listings, and include bundled pictures');
