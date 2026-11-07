import assert from 'node:assert/strict';
import {parseFeatures,parseSpecs,featuresToText,specsToText,productDetailFields,cleanDetails,highlightsFor,savings} from '../src/product-details.js';
assert.deepEqual(parseFeatures('- Fast charging\n• 40h battery\n\n  Foldable  design \n'),['Fast charging','40h battery','Foldable design']);
assert.equal(parseFeatures(Array.from({length:30},(_,i)=>'f'+i).join('\n')).length,12);
assert.deepEqual(parseSpecs('Battery: 40 hours\nno colon line\nDriver size:  40mm\nBattery: dup\n: empty key'),{Battery:'40 hours','Driver size':'40mm'});
assert.equal(parseSpecs('Url: http://x.y/z:1').Url,'http://x.y/z:1'); // only the first colon splits
const f=productDetailFields({features:'A\nB',specifications:'K: V',warranty:'  1 year  ',in_the_box:'Charger'});
assert.deepEqual(f,{features:['A','B'],specifications:{K:'V'},warranty:'1 year',in_the_box:'Charger'});
assert.deepEqual(parseFeatures(featuresToText(f.features)),f.features);
assert.deepEqual(parseSpecs(specsToText(f.specifications)),f.specifications);
// server-side cleaning
assert.deepEqual(cleanDetails({name:'x'}),{});
assert.deepEqual(cleanDetails({features:['  a ','',7],warranty:'w'.repeat(500)}).features,['a','7']);
assert.equal(cleanDetails({warranty:'w'.repeat(500)}).warranty.length,200);
assert.deepEqual(cleanDetails({specifications:{'<b>K</b>':'v',E:''}}),{specifications:{'<b>K</b>':'v'}}); // stored as text; the page escapes on display
assert.deepEqual(cleanDetails({specifications:null}),{specifications:{}});
assert.throws(()=>cleanDetails({features:'not a list'}));
assert.throws(()=>cleanDetails({specifications:['a']}));
assert.equal(Object.keys(cleanDetails({specifications:Object.fromEntries(Array.from({length:50},(_,i)=>['k'+i,'v']))}).specifications).length,20);
// highlights
assert.deepEqual(highlightsFor({features:['Own list'],description:'x · y'}),['Own list']);
assert.deepEqual(highlightsFor({description:'Noise cancellation · 40-hour battery · soft ear cushions.'}),['Noise cancellation','40-hour battery','soft ear cushions']);
assert.deepEqual(highlightsFor({description:'Sample product for preview. Replace with your shop details.'}),[]);
assert.deepEqual(highlightsFor({description:'Intel Core i5 · 512GB SSD',sample_listing:true}),['Intel Core i5','512GB SSD']);
assert.equal(savings({price_paise:80000,mrp_paise:100000}),20000);assert.equal(savings({price_paise:80000}),0);
console.log('PASS: product details - features/specs parsing, server cleaning, derived highlights, savings');
