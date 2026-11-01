(async()=>{
 if(new URLSearchParams(location.search).get('mode')==='live'){
  document.querySelectorAll('header a').forEach(a=>{const url=new URL(a.href);url.searchParams.set('mode','live');a.href=url.href;});
  await import('./app.js');
 }else await import('./preview.js');
})().catch(error=>{document.querySelector('#message').textContent=error.message;});
