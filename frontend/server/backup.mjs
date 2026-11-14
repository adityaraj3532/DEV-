// Makes a safe copy of the database (works while the server is running).
// Usage (from the project folder):  npm run db:backup
// Copies go to frontend/data/backups/dev-computer-YYYY-MM-DD_HH-MM-SS.db
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {mkdirSync,existsSync,statSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {DB_FILE} from './db.mjs';

try{process.loadEnvFile(fileURLToPath(new URL('../.env',import.meta.url)));}catch{}
const dataDir=process.env.DATA_DIR||fileURLToPath(new URL('../data/',import.meta.url));
const source=join(dataDir,DB_FILE);
if(!existsSync(source)){console.error('No database yet at '+source+'. Start the server once (npm start) to create it.');process.exit(1);}
const dir=join(dataDir,'backups');mkdirSync(dir,{recursive:true});
const stamp=new Date().toISOString().replace('T','_').replace(/:/g,'-').slice(0,19);
const target=join(dir,`dev-computer-${stamp}.db`);
const db=new DatabaseSync(source,{readOnly:true});
db.exec(`VACUUM INTO '${target.replace(/'/g,"''")}'`); // consistent snapshot, even during writes
db.close();
console.log(`Backup saved: ${target} (${Math.round(statSync(target).size/1024)} KB)`);
