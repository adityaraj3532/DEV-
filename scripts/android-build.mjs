import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../frontend/android/',import.meta.url));
const win=process.platform==='win32';
const result=spawnSync(win?'cmd.exe':'sh',win?['/d','/s','/c','gradlew.bat assembleDebug']:['./gradlew','assembleDebug'],{cwd,stdio:'inherit'});
if(result.error)console.error(result.error.message);
process.exit(result.status??1);
