import assert from 'node:assert/strict';
import {build} from 'esbuild';
const b=await build({entryPoints:['app/api/tavily/settings/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'fixture-vault',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\/headers$|^next\/navigation$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='cloudflare:workers'?`const rows=new Map();export const env={USER_KEY_ENCRYPTION_KEY:btoa('a'.repeat(32)),BUCKET:{put:async(k,v)=>rows.set(k,v),get:async k=>rows.has(k)?{text:async()=>rows.get(k)}:null,delete:async k=>rows.delete(k)}};`:a.path==='next/headers'?`export async function headers(){return new Headers({'oai-authenticated-user-id':'fixture','oai-authenticated-user-email':'test@example.test'})}`:`export function redirect(){throw Error('Unexpected redirect')}`,loader:'js'}))}}]});
const route=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const originalFetch=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Key registration must never call Tavily')};
const url='https://fixture.local/api/tavily/settings';const key='tvly-fake-registration-test-only-12345';
try{
 const request=(origin,payload)=>new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal((await route.POST(request('https://other.local',{key,consent:true}))).status,403);
 assert.equal((await route.POST(request('https://fixture.local',{key,consent:false}))).status,400);
 assert.equal((await route.POST(request('https://fixture.local',{key:'wrong',consent:true}))).status,400);
 const saved=await route.POST(request('https://fixture.local',{key,consent:true}));assert.equal(saved.status,200);assert(!JSON.stringify(await saved.json()).includes(key));
 const status=await route.GET(new Request(url));const data=await status.json();assert.equal(data.saved,true);assert(!JSON.stringify(data).includes(key));assert.equal(calls,0);
 console.log('Tavily key registration passed: same-origin and consent checks, invalid-key rejection, stored state, no secret in responses, zero external API calls.');
}finally{globalThis.fetch=originalFetch}
