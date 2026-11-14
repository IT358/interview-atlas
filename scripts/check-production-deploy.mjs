#!/usr/bin/env node
/**
 * Validates generated production wrangler config before any Cloudflare deploy.
 * Exit 1 when D1 id is missing/placeholder, or when R2 / billing / gate policy is wrong.
 */
import {existsSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 assertProductionArtifact,
 GENERATED_CONFIG,
 PLACEHOLDER_D1_ID,
 prepareProductionWrangler,
 isPlaceholderD1Id,
} from './production-wrangler.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
process.chdir(root);

const artifactOnly=process.argv.includes('--artifact-only');
const refresh=process.argv.includes('--refresh')||!!process.env.ATLAS_D1_DATABASE_ID;

if(refresh||!existsSync(GENERATED_CONFIG)){
 prepareProductionWrangler();
}

const config=JSON.parse(readFileSync(GENERATED_CONFIG,'utf8'));
try{
 assertProductionArtifact(config,{requireDeployReady:!artifactOnly});
}catch(e){
 console.error(String(e.message||e));
 if(e.code==='D1_ID_REQUIRED'){
  console.error('Example: ATLAS_D1_DATABASE_ID=<your-d1-uuid> npm run check:production -- --refresh');
  console.error('Do not commit the real database id. Keep secrets in Wrangler Secrets only.');
 }
 process.exit(1);
}

const audioSource=readFileSync('lib/runtime-features.ts','utf8');
if(!/export const SERVER_AUDIO_STORAGE\s*=\s*false\s*;/.test(audioSource)){
 console.error('SERVER_AUDIO_STORAGE must remain false for the R2-free trial.');
 process.exit(1);
}

const share=spawnSync(process.execPath,['--input-type=module','-e',`
import {build} from 'esbuild';
const b=await build({entryPoints:['lib/share-access.ts'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env.PROD':'true','import.meta.env.DEV':'false'}});
const m=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
if(!m.shareGateActive({})) throw new Error('shareGateActive must be true in production');
if(m.requestHasShareAccess(new Request('https://app.example/'),{})) throw new Error('unset token must deny');
if(m.requestHasShareAccess(new Request('https://app.example/?access=bad-token-value'),{SHARE_ACCESS_TOKEN:'a'.repeat(24)})) throw new Error('invalid token must deny');
console.log('Share gate (prod): deny when unset/invalid');
`],{stdio:'inherit'});
if(share.status)process.exit(share.status??1);

const auth=spawnSync(process.execPath,['--input-type=module','-e',`
import {build} from 'esbuild';
const plugins=[{name:'f',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\\/headers$|^next\\/navigation$/},a=>({path:a.path,namespace:'f'}));b.onLoad({filter:/.*/,namespace:'f'},a=>({loader:'js',contents:a.path.includes('workers')?'export const env={};':a.path.includes('headers')?'export async function headers(){return new Headers({\\'oai-authenticated-user-id\\':\\'spoof\\',\\'oai-authenticated-user-email\\':\\'spoof@example.test\\'})}':'export function redirect(){throw Error(\\'no\\')}' }))}}];
const b=await build({entryPoints:['app/chatgpt-auth.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});
const m=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
if(m.sitesAuthHeadersTrusted({})) throw new Error('Sites headers must not be trusted by default');
if(await m.getChatGPTUser()) throw new Error('getChatGPTUser must return null without TRUST_SITES_AUTH_HEADERS');
console.log('Sites auth headers: not trusted');
`],{stdio:'inherit'});
if(auth.status)process.exit(auth.status??1);

console.log('PASS: production artifact');
console.log('- config:', GENERATED_CONFIG.replace(root+'/',''));
console.log('- R2: none');
console.log('- OWNER_BILLING_APPROVED:', config.vars.OWNER_BILLING_APPROVED);
console.log('- assets.run_worker_first:', config.assets.run_worker_first);
console.log('- D1 id:', isPlaceholderD1Id(config.d1_databases[0].database_id)?PLACEHOLDER_D1_ID+ ' (blocked)':'set');
console.log('- SERVER_AUDIO_STORAGE: false');
if(artifactOnly)console.log('(artifact-only: deploy readiness D1 check skipped)');
else console.log('Deploy readiness: OK');
