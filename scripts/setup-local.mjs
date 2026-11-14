import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<13))throw Error('Node.js 22.13以上が必要です。');
if(!existsSync('.dev.vars')){
 writeFileSync('.dev.vars','# Local development only. Never share this file.\nUSER_KEY_ENCRYPTION_KEY='+randomBytes(32).toString('base64url')+'\n',{flag:'wx',mode:0o600});
 console.log('ローカル専用の暗号化キーを作成しました。値は表示しません。');
}else console.log('.dev.vars は既存のものを保持します。');
const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','wrangler.local.json','--persist-to','.wrangler/state'],{cwd:root,stdio:'inherit'});
if(result.error)throw result.error;
if(result.status!==0)process.exit(result.status??1);
console.log('ローカルDBの準備が完了しました。npm run dev で起動できます。');
