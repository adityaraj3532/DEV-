// Scroll effects: progress bar, sticky-header state, staggered reveal of cards as they enter view.
const SELECTOR='.card,.product-card,.ad-banner,.section-bar,.metric-grid>*,.store-promise,.category-tabs';

const SUN='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON='<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
function storedTheme(){try{return localStorage.getItem('theme');}catch{return null;}}
export function applyTheme(theme,doc=globalThis.document){
  doc.documentElement.dataset.theme=theme;
  const b=doc.getElementById('themeToggle');
  if(b){b.innerHTML=theme==='dark'?SUN:MOON;b.setAttribute('aria-label',theme==='dark'?'Switch to light theme':'Switch to dark theme');b.setAttribute('aria-pressed',String(theme==='dark'));}
}
function setupTheme(doc){
  const prefersDark=globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const btn=doc.createElement('button');btn.id='themeToggle';btn.className='theme-toggle';btn.type='button';
  const bell=doc.getElementById('headerOffers');if(bell)bell.before(btn);else doc.querySelector('header')?.append(btn);
  applyTheme(storedTheme()||(prefersDark?'dark':'light'),doc);
  btn.onclick=()=>{const next=doc.documentElement.dataset.theme==='dark'?'light':'dark';doc.documentElement.classList.add('theme-switching');applyTheme(next,doc);try{localStorage.setItem('theme',next);}catch{}setTimeout(()=>doc.documentElement.classList.remove('theme-switching'),450);};
}

export function startMotion(doc=globalThis.document){
  if(!doc)return;
  setupTheme(doc);
  if(typeof IntersectionObserver==='undefined')return;
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
