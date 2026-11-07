import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
import {createStore,cleanEvent} from './server/store.mjs';
import {createAuth} from './server/auth.mjs';
import {mailerFromEnv} from './server/mailer.mjs';
import {createShop} from './server/shop.mjs';

// Settings can live in frontend/.env (git-ignored). Real environment variables win.
try{process.loadEnvFile(fileURLToPath(new URL('./.env',import.meta.url)));}catch{}

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const dataDir=process.env.DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url));
const port=+process.env.PORT||8080,host=process.env.HOST||'127.0.0.1';
const mailer=mailerFromEnv();
// DEV_OTP is a fixed sign-in code for local development. It is ignored once real email (SMTP) is set up,
// so it can never apply on the hosted shop. Never set it in production.
const devOtp=mailer.mode==='smtp'?'':(process.env.DEV_OTP||'');
const store=createStore(dataDir),auth=createAuth(dataDir,{devOtp});
// Staff roles come only from server configuration; everyone else who signs in is a customer.
const emails=v=>String(v||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
const ownerEmails=emails(process.env.OWNER_EMAILS),deliveryEmails=emails(process.env.DELIVERY_EMAILS);
const roleOf=email=>ownerEmails.includes(email)?'admin':deliveryEmails.includes(email)?'delivery':'customer';
const shop=createShop(dataDir,{partners:deliveryEmails});
const sessionUser=token=>{const s=auth.session(token);return s?{email:s.email,name:s.name,phone:s.phone,role:roleOf(s.email)}:null;};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};

// Simple per-IP rate limit for the public event endpoint.
const hits=new Map();
function limited(ip,max=120){const now=Date.now(),h=hits.get(ip)||{n:0,t:now};if(now-h.t>60000){h.n=0;h.t=now;}h.n++;hits.set(ip,h);return h.n>max;}
// Behind a hosting proxy (Render, Railway, Nginx…) set TRUST_PROXY=1 so limits apply per real visitor.
const clientIp=req=>process.env.TRUST_PROXY==='1'?String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress:req.socket.remoteAddress;
// The Android app runs at https://localhost (Capacitor); extra origins via CORS_ORIGINS=comma,list.
const allowedOrigins=new Set(['https://localhost','capacitor://localhost','http://localhost',...String(process.env.CORS_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)]);
function cors(req,res){const o=req.headers.origin;if(o&&allowedOrigins.has(o)){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, x-admin-key');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Max-Age','600');}}
const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
function readBody(req,limit=8192){return new Promise((ok,fail)=>{let size=0,chunks=[];req.on('data',c=>{size+=c.length;if(size>limit){fail(Error('Body too large'));req.destroy();}else chunks.push(c);});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{fail(Error('Invalid JSON'));}});req.on('error',fail);});}

async function api(req,res,url){
 if(url.pathname==='/api/health')return json(res,200,{ok:true});
 const token=(req.headers.authorization||'').replace(/^Bearer /,'');
 if(url.pathname==='/api/auth/request-otp'&&req.method==='POST'){
  if(limited('otp:'+clientIp(req),20))return json(res,429,{error:'Too many requests. Try again in a minute.'});
  const {code,profile}=auth.requestCode(await readBody(req));
  try{await mailer.send({to:profile.email,subject:'Your Dev Computer sign-in code',text:`Hi ${profile.name},\n\nYour Dev Computer sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't request it, ignore this email.`});}
  catch(e){console.error('Email send failed:',e.message);return json(res,502,{error:'Could not send the email. Please try again later.'});}
  return json(res,200,{message:mailer.mode==='smtp'?`We sent a 6-digit code to ${profile.email}. Check your inbox and spam folder.`:'Development mode: the 6-digit code was printed in the server terminal (configure SMTP to email it).'});
 }
 if(url.pathname==='/api/auth/verify-otp'&&req.method==='POST'){
  if(limited('verify:'+clientIp(req),30))return json(res,429,{error:'Too many attempts. Try again in a minute.'});
  const result=auth.verifyCode(await readBody(req));
  store.record(cleanEvent({type:'login',email:result.customer.email,name:result.customer.name,phone:result.customer.phone,device:req.headers['user-agent'],detail:{verified:'email OTP'}}));
  return json(res,200,{...result,customer:{...result.customer,role:roleOf(result.customer.email)}});
 }
 if(url.pathname==='/api/auth/me'){const u=sessionUser(token);return u?json(res,200,u):json(res,401,{error:'Signed out'});}
 if(url.pathname==='/api/auth/logout'&&req.method==='POST'){const s=auth.session(token);if(s)store.record(cleanEvent({type:'logout',email:s.email,device:req.headers['user-agent']}));auth.logout(token);return json(res,200,{});}
 if(url.pathname==='/api/events'&&req.method==='POST'){
  if(limited(clientIp(req)))return json(res,429,{error:'Too many requests'});
  const body=await readBody(req),s=auth.session(token);
  if(['login','logout'].includes(body.type))return json(res,202,{}); // recorded by the auth endpoints
  // Identity comes only from a verified session; anything else is recorded as a guest.
  const event=store.record(cleanEvent({...body,email:s?.email||null,name:s?.name||null,phone:s?.phone||null}));
  return json(res,201,{id:event.id});
 }
 if(url.pathname.startsWith('/api/admin/')){
  if(!store.checkKey(req.headers['x-admin-key'])&&sessionUser(token)?.role!=='admin')return json(res,401,{error:'Admin key required'});
  if(url.pathname==='/api/admin/summary')return json(res,200,store.summary());
  if(url.pathname==='/api/admin/customers')return json(res,200,store.customers());
  if(url.pathname==='/api/admin/activity')return json(res,200,store.list(Object.fromEntries(url.searchParams)));
 }
 if(url.pathname.startsWith('/api/shop/')){
  const user=sessionUser(token),path=url.pathname.slice('/api/shop'.length);
  if(req.method!=='GET'&&limited('shop:'+clientIp(req),240))return json(res,429,{error:'Too many requests. Try again in a minute.'});
  const body=req.method==='GET'||req.method==='DELETE'?{}:await readBody(req,3_000_000);
  return json(res,200,shop.handle(user,path,req.method,body)??{});
 }
 json(res,404,{error:'Not found'});
}

createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){cors(req,res);if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}try{await api(req,res,url);}catch(e){json(res,e.status||400,{error:e.message});}return;}
 try{
  const pathname=decodeURIComponent(url.pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found. Run npm run build first.');}
}).listen(port,host,()=>{
 console.log(`Dev Computer: http://localhost:${port} (Ctrl+C to stop)`);
 console.log(`Owner portal: http://localhost:${port}/?portal=admin  ->  Activity`);
 console.log(`Email: ${mailer.mode==='smtp'?'SMTP '+process.env.SMTP_HOST:'development mode (sign-in codes print here)'}`);
 if(devOtp)console.log(`DEV_OTP active: sign in with code ${devOtp} for any email (development only; ignored once SMTP is set).`);
 console.log(`Owners: ${ownerEmails.join(', ')||'none - set OWNER_EMAILS'} · Delivery: ${deliveryEmails.join(', ')||'none - set DELIVERY_EMAILS'}`);
 console.log(`Admin key: ${process.env.ADMIN_KEY?'from ADMIN_KEY env':store.keyFile}`);
});
