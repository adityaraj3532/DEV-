export function localDate(now=new Date()){
 return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function promotionStatus(p,today=localDate()){
 if(!p.published)return 'Draft';
 if(p.start&&p.start>today)return 'Scheduled';
 if(p.end&&p.end<today)return 'Expired';
 return 'Active';
}
export function validatePromotion(input){
 const p={...input,title:String(input.title||'').trim(),description:String(input.description||'').trim(),terms:String(input.terms||'').trim(),start:input.start||'',end:input.end||''};
 if(!['Offer','Event'].includes(p.kind))throw Error('Choose Offer or Event.');
 if(!p.title||p.title.length>100)throw Error('Enter a title up to 100 characters.');
 if(p.description.length<3||p.description.length>1000)throw Error('Enter announcement text between 3 and 1000 characters.');
 if(p.terms.length>1500)throw Error('Keep terms within 1500 characters.');
 for(const date of [p.start,p.end])if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date))throw Error('Choose a valid date.');
 if(p.start&&p.end&&p.start>p.end)throw Error('End date must be on or after the start date.');
 return p;
}
