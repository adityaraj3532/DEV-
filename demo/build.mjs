import {build} from 'esbuild';
import {copyFile,mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/entry.js'],outfile:'dist/app.js',bundle:true,format:'iife',target:['es2022'],minify:true,legalComments:'eof'});
await copyFile('src/index.html','dist/index.html');
