// Extra product information the owner can enter: key features, specifications, warranty and box contents.
// Shared by the server (validation) and the app (forms and display).

const LIMITS={features:12,featureLen:200,specs:20,specKey:60,specValue:300,warranty:200,box:300};
const clean=(v,max)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

/** One feature per line (leading bullets removed). */
export function parseFeatures(text){
 return String(text??'').split(/\r?\n/).map(l=>clean(l.replace(/^\s*[-•*·]+\s*/,''),LIMITS.featureLen)).filter(Boolean).slice(0,LIMITS.features);
}
/** "Name: value" per line. Lines without a colon are ignored. */
export function parseSpecs(text){
 const out={};
 for(const line of String(text??'').split(/\r?\n/)){
  const i=line.indexOf(':');if(i<1)continue;
  const k=clean(line.slice(0,i),LIMITS.specKey),v=clean(line.slice(i+1),LIMITS.specValue);
  if(k&&v&&!(k in out)&&Object.keys(out).length<LIMITS.specs)out[k]=v;
 }
 return out;
}
export const featuresToText=f=>(Array.isArray(f)?f:[]).join('\n');
export const specsToText=s=>Object.entries(s&&typeof s==='object'?s:{}).map(([k,v])=>`${k}: ${v}`).join('\n');

/** Owner form values -> product fields. */
export function productDetailFields(f){
 return {features:parseFeatures(f.features),specifications:parseSpecs(f.specifications),warranty:clean(f.warranty,LIMITS.warranty),in_the_box:clean(f.in_the_box,LIMITS.box)};
}

/** Server-side: sanitises whichever detail fields the request contains (never trusts the client). */
export function cleanDetails(body){
 const out={};
 if('features' in body){
  if(!Array.isArray(body.features))throw Error('Features must be a list.');
  out.features=body.features.map(x=>clean(x,LIMITS.featureLen)).filter(Boolean).slice(0,LIMITS.features);
 }
 if('specifications' in body){
  const s=body.specifications;if(s==null)out.specifications={};
  else{
   if(typeof s!=='object'||Array.isArray(s))throw Error('Specifications must be name and value pairs.');
   out.specifications={};
   for(const [k,v] of Object.entries(s)){const key=clean(k,LIMITS.specKey),val=clean(v,LIMITS.specValue);if(key&&val&&Object.keys(out.specifications).length<LIMITS.specs)out.specifications[key]=val;}
  }
 }
 if('warranty' in body)out.warranty=clean(body.warranty,LIMITS.warranty);
 if('in_the_box' in body)out.in_the_box=clean(body.in_the_box,LIMITS.box);
 return out;
}

/** Key features to show: the owner's list, or highlights derived from a "a · b · c" style description. */
export function highlightsFor(p){
 if(Array.isArray(p?.features)&&p.features.length)return p.features;
 if(/^Sample product/i.test(p?.description||''))return [];
 return String(p?.description||'').split(/\s*·\s*|(?<=[.!?])\s+/).map(s=>s.replace(/[.\s]+$/,'').trim()).filter(s=>s.length>=4&&s.length<=90).slice(0,6);
}

/** Money saved, in paise (0 when there is no offer). */
export function savings(p){const m=Number(p?.mrp_paise),x=Number(p?.price_paise);return Number.isFinite(m)&&x>0&&m>x?m-x:0;}
