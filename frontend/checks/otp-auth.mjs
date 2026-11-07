import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createAuth} from '../server/auth.mjs';
const dir=mkdtempSync(join(tmpdir(),'devc-otp-'));
try{
 let t=1_000_000;const auth=createAuth(dir,{now:()=>t});
 const who={name:'Asha',email:'Asha@Example.com',phone:'9876543210'};
 assert.throws(()=>auth.requestCode({...who,email:'owner@demo.com'}),/reserved/);
 assert.throws(()=>auth.requestCode({...who,email:'bad'}));
 const {code}=auth.requestCode(who);assert.match(code,/^\d{6}$/);
 assert.throws(()=>auth.requestCode(who),/wait/);                       // resend cooldown
 const wrong=code==='000000'?'111111':'000000';
 assert.throws(()=>auth.verifyCode({email:'asha@example.com',code:wrong}),/Incorrect code/);
 const {token,customer}=auth.verifyCode({email:'asha@example.com',code});
 assert.equal(customer.email,'asha@example.com');
 assert.throws(()=>auth.verifyCode({email:'asha@example.com',code}),/expired|not requested/); // single use
 assert.equal(auth.session(token).name,'Asha');assert.equal(auth.session('nope'),null);
 assert.ok(!readFileSync(join(dir,'sessions.json'),'utf8').includes(token));  // only hashes stored
 assert.equal(createAuth(dir,{now:()=>t}).session(token).email,'asha@example.com'); // survives restart
 // expiry and attempt limit
 t+=31000;const second=auth.requestCode(who).code;t+=11*60000;
 assert.throws(()=>auth.verifyCode({email:'asha@example.com',code:second}),/expired/);
 t+=31000;const third=auth.requestCode(who).code;const bad=third==='123456'?'654321':'123456';
 for(let i=0;i<5;i++)assert.throws(()=>auth.verifyCode({email:'asha@example.com',code:bad}));
 assert.throws(()=>auth.verifyCode({email:'asha@example.com',code:third}),/Too many/);
 auth.logout(token);assert.equal(auth.session(token),null);
 t+=31*86400000;
 // DEV_OTP: a fixed code works for any email, but only after a requestCode, and never when unset.
 let dt=5_000_000;const dev=createAuth(dir,{now:()=>dt,devOtp:'123456'});
 assert.throws(()=>dev.verifyCode({email:'dev@example.com',code:'123456'}),/not requested/); // needs requestCode first
 dev.requestCode({name:'Dev User',email:'dev@example.com'});
 assert.throws(()=>dev.verifyCode({email:'dev@example.com',code:'000000'}),/Incorrect/); // other codes still rejected
 const out=dev.verifyCode({email:'dev@example.com',code:'123456'});assert.equal(out.customer.email,'dev@example.com');assert.match(out.token,/.{20}/);
 const noDev=createAuth(dir,{now:()=>dt});noDev.requestCode({name:'No Dev',email:'n@example.com'});
 assert.throws(()=>noDev.verifyCode({email:'n@example.com',code:'123456'}),/Incorrect/); // disabled when not set
 const badDev=createAuth(dir,{now:()=>dt,devOtp:'12'});badDev.requestCode({name:'Bad Dev',email:'bad@example.com'}); // too-short devOtp is ignored
 assert.throws(()=>badDev.verifyCode({email:'bad@example.com',code:'12'}),/Incorrect/);
 console.log('PASS: OTP sign-in codes, cooldown, single use, expiry, attempt limit, hashed persistent sessions, logout, dev code');
}finally{rmSync(dir,{recursive:true,force:true});}
