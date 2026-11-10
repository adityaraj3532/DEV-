import {build} from 'esbuild';
try{process.loadEnvFile(new URL('./.env',import.meta.url));}catch{}
const apiUrl=(process.env.API_URL||'').trim();
if(apiUrl&&!/^https:\/\/[^\s/]+/.test(apiUrl))throw Error('API_URL must be an https:// address (Android blocks plain http).');
console.log(apiUrl?'Backend for this build: '+apiUrl:'Backend: same server as the website');
import {copyFile,mkdir,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/entry.js'],outfile:'dist/app.js',bundle:true,format:'iife',target:['es2022'],minify:true,define:{__API_URL__:JSON.stringify(apiUrl)},legalComments:'eof'});
await copyFile('src/index.html','dist/index.html');

await copyFile('node_modules/leaflet/dist/leaflet.css','dist/leaflet.css');

await writeFile('dist/theme.css',(await readFile('src/theme.css','utf8'))+'\n'+(await readFile('src/checkout.css','utf8'))+'\n'+(await readFile('src/motion.css','utf8'))+'\n'+(await readFile('src/theme-dark.css','utf8')));
await cp('src/assets','dist/assets',{recursive:true});
