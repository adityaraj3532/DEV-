// Email one-time-code sign-in and session tokens for customers.
import {existsSync,readFileSync,renameSync} from 'node:fs';
import {openDb,transaction} from './db.mjs';
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

export function createAuth(dir,{now=Date.now,devOtp=''}={}){
 // devOtp: a fixed code accepted for any email, for LOCAL DEVELOPMENT ONLY. The caller must pass it
 // only when real email is not configured, never on a hosted shop. It still needs a prior requestCode.
 const devCode=/^\d{6}$/.test(String(devOtp))?String(devOtp):'';
 const db=openDb(dir),file=join(dir,'sessions.json');
 // Sessions live in the database (only a hash of each token is stored). One-time import of the old sessions.json.
 if(existsSync(file)&&!db.prepare('SELECT 1 FROM sessions LIMIT 1').get()){
  const old=JSON.parse(readFileSync(file,'utf8')),st=db.prepare('INSERT OR REPLACE INTO sessions(token_hash,email,name,phone,expires) VALUES(?,?,?,?,?)');
  transaction(db,()=>{for(const [h,s] of Object.entries(old))st.run(h,s.email,s.name??null,s.phone??null,s.expires);});
  try{renameSync(file,file+'.imported');}catch{}
 }
 const getSession=db.prepare('SELECT email,name,phone,expires FROM sessions WHERE token_hash=?'),delSession=db.prepare('DELETE FROM sessions WHERE token_hash=?');
 const pending=new Map(); // email -> {codeHash,expires,attempts,profile,sends:[times]}

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
  const devMatch=devCode&&code===devCode;
  if(!devMatch&&(!/^\d{6}$/.test(code)||!timingSafeEqual(a,b)))throw fail(`Incorrect code. ${MAX_ATTEMPTS-p.attempts} attempts left.`);
  pending.delete(email);
  const token=randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM sessions WHERE expires<?').run(t);
  db.prepare('INSERT INTO sessions(token_hash,email,name,phone,expires) VALUES(?,?,?,?,?)').run(hash(token),p.profile.email,p.profile.name,p.profile.phone||null,t+SESSION_TTL);
  return {token,customer:p.profile};
 }

 function session(token){if(!token)return null;const row=getSession.get(hash(token));if(!row)return null;if(row.expires<now()){delSession.run(hash(token));return null;}return {...row};}
 function logout(token){if(token)delSession.run(hash(token));}
 return {requestCode,verifyCode,session,logout};
}
