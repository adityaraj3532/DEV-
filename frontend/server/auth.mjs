// Email one-time-code sign-in and session tokens for customers.
import {existsSync,readFileSync,writeFileSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,randomInt,createHash,timingSafeEqual} from 'node:crypto';

const EMAIL=/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const RESERVED=['owner@demo.com','delivery@demo.com'];
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const CODE_TTL=10*60000,SESSION_TTL=30*86400000,RESEND_AFTER=30000,MAX_SENDS_PER_HOUR=5,MAX_ATTEMPTS=5;

export function cleanProfile(body){
 const name=String(body?.name||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ');
 const email=String(body?.email||'').trim().toLowerCase();
 const phone=String(body?.phone||'').replace(/[\s-]/g,'');
 if(name.length<2||name.length>80)throw Error('Enter your name (2–80 characters).');
 if(!EMAIL.test(email))throw Error('Enter a valid email address.');
 if(RESERVED.includes(email))throw Error('That email is reserved for staff portals.');
 if(phone&&!/^\+?\d{10,13}$/.test(phone))throw Error('Enter a 10-digit phone number, or leave it blank.');
 return {name,email,phone};
}

export function createAuth(dir,{now=Date.now}={}){
 const file=join(dir,'sessions.json');
 const sessions=existsSync(file)?JSON.parse(readFileSync(file,'utf8')):{}; // tokenHash -> {email,name,phone,expires}
 const pending=new Map(); // email -> {codeHash,expires,attempts,profile,sends:[times]}
 const persist=()=>{const t=now();for(const [k,s] of Object.entries(sessions))if(s.expires<t)delete sessions[k];const tmp=file+'.tmp';writeFileSync(tmp,JSON.stringify(sessions),{mode:0o600});renameSync(tmp,file);};

 /** Creates a code for this email. Returns the plain code so the caller can deliver it. */
 function requestCode(body){
  const profile=cleanProfile(body),t=now(),p=pending.get(profile.email);
  const sends=(p?.sends||[]).filter(x=>t-x<3600000);
  if(sends.length&&t-sends[sends.length-1]<RESEND_AFTER)throw Object.assign(Error(`Please wait ${Math.ceil((RESEND_AFTER-(t-sends[sends.length-1]))/1000)} seconds before requesting another code.`),{status:429});
  if(sends.length>=MAX_SENDS_PER_HOUR)throw Object.assign(Error('Too many codes requested for this email. Try again in an hour.'),{status:429});
  const code=String(randomInt(0,1000000)).padStart(6,'0');
  pending.set(profile.email,{codeHash:hash(profile.email+':'+code),expires:t+CODE_TTL,attempts:0,profile,sends:[...sends,t]});
  return {code,profile};
 }

 /** Checks a code; on success returns a new session token and the customer profile. */
 function verifyCode(body){
  const email=String(body?.email||'').trim().toLowerCase(),code=String(body?.code||'').trim(),p=pending.get(email),t=now();
  const fail=m=>Object.assign(Error(m),{status:401});
  if(!p||p.expires<t)throw fail('This code has expired or was not requested. Request a new code.');
  if(p.attempts>=MAX_ATTEMPTS)throw fail('Too many wrong attempts. Request a new code.');
  p.attempts++;
  const a=Buffer.from(hash(email+':'+code)),b=Buffer.from(p.codeHash);
  if(!/^\d{6}$/.test(code)||!timingSafeEqual(a,b))throw fail(`Incorrect code. ${MAX_ATTEMPTS-p.attempts} attempts left.`);
  pending.delete(email);
  const token=randomBytes(32).toString('base64url');
  sessions[hash(token)]={...p.profile,expires:t+SESSION_TTL};persist();
  return {token,customer:p.profile};
 }

 function session(token){if(!token)return null;const s=sessions[hash(token)];if(!s)return null;if(s.expires<now()){delete sessions[hash(token)];persist();return null;}return s;}
 function logout(token){if(token&&sessions[hash(token)]){delete sessions[hash(token)];persist();}}
 return {requestCode,verifyCode,session,logout};
}
