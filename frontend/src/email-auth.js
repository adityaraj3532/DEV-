// This guard reduces duplicate requests; Supabase remains the rate-limit authority.
export function createEmailSender(auth,storage,now=Date.now){
 const key='electroshop-email-send-after';let sending=false;
 const remaining=()=>Math.max(0,Math.ceil((Number(storage.getItem(key)||0)-now())/1000));
 async function send(rawEmail,options){
  const email=rawEmail.trim().toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter your real email address.');
  if(/@demo\.com$/.test(email))throw Error('Demo accounts are no longer active. Enter your real email address.');
  if(sending)throw Error('A sign-in email request is already being processed.');
  if(remaining())throw Error(`Please wait ${remaining()} seconds before requesting another email. You can still verify a code or link you already received.`);
  sending=true;storage.setItem(key,String(now()+60000));
  try{
   const {error}=await auth.signInWithOtp({email,options});
   if(error){
    if(error.code==='over_email_send_rate_limit'||error.status===429||/email rate limit/i.test(error.message)){
     storage.setItem(key,String(now()+60000));const failure=Error('Supabase has reached its email-sending limit. A new email was not sent. Check your inbox/spam for an earlier email and verify it below. The shop owner must configure custom SMTP or check the project email rate limit. The cooldown does not guarantee that Supabase’s quota has reset.');failure.code='email_limit';throw failure;
    }
    if(error.code==='email_address_not_authorized')throw Error('The project email sender cannot send to this address yet. The shop owner needs to configure custom SMTP in Supabase.');
    throw error;
   }
   storage.setItem(key,String(now()+60000));return {message:'Sign-in email requested. Check your inbox and spam folder. Enter the code or paste the verification link below. Avoid requesting another email while you wait.'};
  }finally{sending=false;}
 }
 return {send,remaining,isSending:()=>sending};
}
