// Scroll effects: progress bar, sticky-header state, staggered reveal of cards as they enter view.
const SELECTOR='.card,.product-card,.ad-banner,.section-bar,.metric-grid>*,.store-promise,.category-tabs';

export function startMotion(doc=globalThis.document){
  if(!doc||typeof IntersectionObserver==='undefined')return;
  const bar=doc.createElement('div');bar.id='scrollProgress';doc.body.prepend(bar);
  const onScroll=()=>{
    const el=doc.documentElement,max=el.scrollHeight-el.clientHeight;
    bar.style.setProperty('--p',max>0?(el.scrollTop/max).toFixed(4):0);
    doc.body.classList.toggle('scrolled',el.scrollTop>10);
  };
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  const io=new IntersectionObserver(entries=>{
    for(const e of entries)if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
  },{rootMargin:'0px 0px -8% 0px',threshold:.08});
  const scan=()=>{
    let i=0;
    doc.querySelectorAll(SELECTOR).forEach(el=>{
      if(el.classList.contains('reveal')||el.closest('.reveal:not(.in)'))return;
      el.classList.add('reveal');el.style.setProperty('--d',Math.min(i++,8)*70+'ms');io.observe(el);
    });
  };
  let queued=false;
  new MutationObserver(()=>{if(!queued){queued=true;setTimeout(()=>{queued=false;scan();},16);}})
    .observe(doc.body,{childList:true,subtree:true});
  scan();
  // Safety net: never leave on-screen content hidden if the observer is throttled.
  setInterval(()=>doc.querySelectorAll('.reveal:not(.in)').forEach(el=>{
    const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in');
  }),1500);
}

if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>startMotion());
  else startMotion();
}
