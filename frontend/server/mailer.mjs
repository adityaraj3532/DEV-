// Minimal SMTP client (no dependencies). Configure with environment variables:
//   SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS, SMTP_FROM
// Without SMTP_HOST the mailer runs in development mode and prints codes to the server console.
import net from 'node:net';
import tls from 'node:tls';

export function mailerFromEnv(env=process.env,log=console.log){
 if(!env.SMTP_HOST)return {mode:'console',async send({to,subject,text}){log(`\n[DEV EMAIL] To: ${to}\nSubject: ${subject}\n${text}\n`);}};
 const cfg={host:env.SMTP_HOST,port:+env.SMTP_PORT||587,user:env.SMTP_USER||'',pass:env.SMTP_PASS||'',from:env.SMTP_FROM||env.SMTP_USER};
 if(!cfg.from)throw Error('Set SMTP_FROM (or SMTP_USER) to the sender address.');
 return {mode:'smtp',send:msg=>sendMail(cfg,msg)};
}

const clean=s=>String(s).replace(/[\r\n]/g,' ');

function sendMail(cfg,{to,subject,text}){
 return new Promise((resolve,reject)=>{
  let socket=cfg.port===465?tls.connect({host:cfg.host,port:cfg.port,servername:cfg.host}):net.connect({host:cfg.host,port:cfg.port});
  let buffer='',waiter=null;
  const timer=setTimeout(()=>finish(Error('SMTP timed out')),20000);
  function finish(err){clearTimeout(timer);try{socket.end();}catch{}err?reject(err):resolve();}
  function attach(s){s.setEncoding('utf8');s.on('data',d=>{buffer+=d;const lines=buffer.split('\r\n');const last=lines.filter(Boolean).pop();if(last&&/^\d{3} /.test(last)&&buffer.endsWith('\r\n')){const reply=buffer;buffer='';waiter?.(reply);}});s.on('error',finish);}
  attach(socket);
  const read=()=>new Promise(r=>{waiter=r;});
  async function cmd(line,expect){if(line!=null)socket.write(line+'\r\n');const reply=await read();if(!reply.startsWith(String(expect)))throw Error('SMTP error: '+reply.trim().split('\r\n').pop());return reply;}
  (async()=>{
   await cmd(null,220);
   let ehlo=await cmd('EHLO devcomputer.local',250);
   if(cfg.port!==465&&/STARTTLS/i.test(ehlo)){
    await cmd('STARTTLS',220);
    socket.removeAllListeners('data');
    socket=tls.connect({socket,servername:cfg.host});attach(socket);
    await new Promise((ok,no)=>{socket.once('secureConnect',ok);socket.once('error',no);});
    await cmd('EHLO devcomputer.local',250);
   }else if(cfg.port!==465)throw Error('SMTP server does not offer STARTTLS; refusing to send credentials in plain text.');
   if(cfg.user){await cmd('AUTH LOGIN',334);await cmd(Buffer.from(cfg.user).toString('base64'),334);await cmd(Buffer.from(cfg.pass).toString('base64'),235);}
   const from=clean(cfg.from).match(/<([^>]+)>/)?.[1]||clean(cfg.from);
   await cmd(`MAIL FROM:<${from}>`,250);
   await cmd(`RCPT TO:<${clean(to)}>`,250);
   await cmd('DATA',354);
   const body=String(text).replace(/\r?\n/g,'\r\n').replace(/^\./gm,'..');
   await cmd(`From: ${clean(cfg.from)}\r\nTo: ${clean(to)}\r\nSubject: ${clean(subject)}\r\nDate: ${new Date().toUTCString()}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}\r\n.`,250);
   socket.write('QUIT\r\n');finish();
  })().catch(finish);
 });
}
