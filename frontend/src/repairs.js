export const repairStatuses=['Requested','Received','Diagnosing','Awaiting approval','Repairing','Ready for pickup','Completed','Cancelled'];
export function createRepair(input,email,now=Date.now()){
 const item=String(input.item||'').trim(),problem=String(input.problem||'').trim();
 if(item.length<2||item.length>120||problem.length<10||problem.length>2000)throw Error('Enter an item name and a problem description (at least 10 characters).');
 if(!email)throw Error('Enter the customer portal first.');
 if(!/^data:image\/(jpeg|png|webp);base64,/.test(input.photo||''))throw Error('Upload a photo of the item.');
 return {id:'REP-'+now.toString(36).toUpperCase()+'-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase(),email,item,problem,photo:input.photo,status:'Requested',price_paise:null,created:now,messages:[],history:[{status:'Requested',at:now}]};
}
export function updateRepair(record,input,role,now=Date.now()){
 if(role!=='admin')throw Error('Only the owner can update a repair.');
 if(!repairStatuses.includes(input.status))throw Error('Choose a valid repair status.');
 const price=input.price===''?null:Math.round(Number(input.price)*100);
 if(price!==null&&(!Number.isSafeInteger(price)||price<0||price>100000000))throw Error('Enter a valid repair price.');
 const text=String(input.message||'').trim();if(text.length>1000)throw Error('Keep messages under 1000 characters.');
 const next={...record,status:input.status,price_paise:price,history:[...record.history,{status:input.status,at:now}],messages:[...record.messages]};
 if(text)next.messages.push({text,at:now});
 if(input.status==='Ready for pickup'&&record.status!=='Ready for pickup')next.messages.push({text:'Your '+record.item+' is ready for pickup at Dev Computer.',at:now});
 return next;
}
