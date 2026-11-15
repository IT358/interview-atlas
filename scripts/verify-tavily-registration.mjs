import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
const db=new DatabaseSync(':memory:');
db.exec(fs.readFileSync('drizzle/0003_r2_free_key_vault.sql','utf8'));
const d1={prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}}}}};
const b=await build({entryPoints:['app/api/tavily/settings/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'fixture-vault',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\/headers$|^next\/navigation$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='cloudflare:workers'?`export const env={USER_KEY_ENCRYPTION_KEY:btoa('a'.repeat(32)),DB:globalThis.__regDb};`:a.path==='next/headers'?`export async function headers(){return new Headers({'oai-authenticated-user-id':'spoofed','oai-authenticated-user-email':'spoof@example.test'})}`:`export function redirect(){throw Error('Unexpected redirect')}`,loader:'js'}))}}]});
globalThis.__regDb=d1;
const route=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const originalFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Key registration must never call Tavily')};
const url='https://fixture.local/api/tavily/settings';const key='tvly-fake-registration-test-only-12345';
try{
 const request=(origin,payload)=>new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal((await route.POST(request('https://other.local',{key,consent:true}))).status,403);
 const refused=await route.POST(request('https://fixture.local',{key,consent:true}));
 assert.equal(refused.status,400);
 const refusedBody=await refused.json();
 assert.equal(refusedBody.code,'BROWSER_KEY_ONLY');
 assert.ok(!JSON.stringify(refusedBody).includes(key));

 const status=await route.GET(new Request(url));
 const data=await status.json();
 assert.equal(status.status,200);
 assert.equal(data.serverSaved,false);
 assert.equal(data.storage,'browser');
 assert.ok(!JSON.stringify(data).includes(key));
 const setCookie=status.headers.get('set-cookie')||'';
 const guest=setCookie.match(/(?:__Host-)?atlas-guest=([a-f0-9]{64})/)?.[1];
 assert.ok(guest);

 // DELETE for a guest with no vault row still succeeds.
 const cleared=await route.DELETE(new Request(url,{method:'DELETE',headers:{Origin:'https://fixture.local',cookie:'__Host-atlas-guest='+guest}}));
 assert.equal(cleared.status,200);
 assert.equal((await cleared.json()).serverSaved,false);
 assert.equal(calls,0);
 console.log('Tavily BYOK settings passed: POST refuses server save, GET reports browser storage only, DELETE works, zero external API calls.');
}finally{globalThis.fetch=originalFetch;delete globalThis.__regDb;db.close()}
