import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../src/supabase-config.json',import.meta.url),'utf8'));
const response=await fetch(config.url+'/functions/v1/dev-computer-checkout',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({payment_method:'COD',checkout_key:'anonymous-test-key'})});
assert.equal(response.status,401,'Checkout Edge Function must reject missing JWT');
console.log('PASS: deployed checkout Edge Function rejects anonymous requests');
