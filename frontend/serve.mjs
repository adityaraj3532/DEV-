import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,sep,extname} from 'node:path';
import {createStore,cleanEvent} from './server/store.mjs';

const root=fileURLToPath(new URL('./dist/',import.meta.url));
const dataDir=process.env.DATA_DIR||fileURLToPath(new URL('./data/',import.meta.url));
const port=+process.env.PORT||8080,host=process.env.HOST||'127.0.0.1';
const store=createStore(dataDir);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};

// Simple per-IP rate limit for the public event endpoint.
const hits=new Map();
function limited(ip){const now=Date.now(),h=hits.get(ip)||{n:0,t:now};if(now-h.t>60000){h.n=0;h.t=now;}h.n++;hits.set(ip,h);return h.n>120;}
const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
function readBody(req){return new Promise((ok,fail)=>{let size=0,chunks=[];req.on('data',c=>{size+=c.length;if(size>8192){fail(Error('Body too large'));req.destroy();}else chunks.push(c);});req.on('end',()=>{try{ok(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{fail(Error('Invalid JSON'));}});req.on('error',fail);});}

async function api(req,res,url){
 if(url.pathname==='/api/health')return json(res,200,{ok:true});
 if(url.pathname==='/api/events'&&req.method==='POST'){
  if(limited(req.socket.remoteAddress))return json(res,429,{error:'Too many requests'});
  const event=store.record(cleanEvent(await readBody(req)));
  return json(res,201,{id:event.id});
 }
 if(url.pathname.startsWith('/api/admin/')){
  if(!store.checkKey(req.headers['x-admin-key']))return json(res,401,{error:'Admin key required'});
  if(url.pathname==='/api/admin/summary')return json(res,200,store.summary());
  if(url.pathname==='/api/admin/customers')return json(res,200,store.customers());
  if(url.pathname==='/api/admin/activity')return json(res,200,store.list(Object.fromEntries(url.searchParams)));
 }
 json(res,404,{error:'Not found'});
}

createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')){try{await api(req,res,url);}catch(e){json(res,400,{error:e.message});}return;}
 try{
  const pathname=decodeURIComponent(url.pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403);res.end('Forbidden');return;}
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found. Run npm run build first.');}
}).listen(port,host,()=>{
 console.log(`Dev Computer: http://localhost:${port} (Ctrl+C to stop)`);
 console.log(`Owner portal: http://localhost:${port}/?portal=admin  ->  Activity`);
 console.log(`Admin key: ${process.env.ADMIN_KEY?'from ADMIN_KEY env':store.keyFile}`);
});
