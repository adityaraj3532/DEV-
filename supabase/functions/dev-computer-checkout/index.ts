import {createClient} from 'npm:@supabase/supabase-js@2.118.0';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return respond({error:'Method not allowed'},405);
 try{
  const authorization=req.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return respond({error:'Sign in required'},401);
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user?.email_confirmed_at)return respond({error:'Verified sign-in required'},401);
  const text=await req.text();if(text.length>100000)return respond({error:'Request too large'},413);
  const body=JSON.parse(text);
  if(typeof body.checkout_key!=='string'||body.checkout_key.length<16)return respond({error:'Checkout key required'},400);
  if(body.payment_method!=='COD')return respond({error:'Only COD is connected. Online payments require a configured provider and server-side verification.'},400);
  const {data,error}=await client.rpc('dev_computer_api',{p_path:'/orders',p_method:'POST',p_body:body});if(error)return respond({error:error.message},400);
  return respond(data);
 }catch{return respond({error:'Invalid checkout request'},400);}
});
