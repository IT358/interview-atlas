import assert from 'node:assert/strict';
import {build} from 'esbuild';
import fs from 'node:fs';
let networkCalls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{networkCalls++;throw Error('External traffic must stay blocked')};
const plugins=[{name:'isolated-cost-test',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\/headers$|^next\/navigation$/},a=>({path:a.path,namespace:'cost-test'}));b.onLoad({filter:/.*/,namespace:'cost-test'},a=>({contents:a.path==='cloudflare:workers'?`export const env=new Proxy({TRUST_SITES_AUTH_HEADERS:'1'},{get(t,p){if(p==='TRUST_SITES_AUTH_HEADERS')return t[p];throw Error('Storage must not be accessed by a blocked operation')}});`:a.path==='next/headers'?`export async function headers(){return new Headers({'oai-authenticated-user-id':'cost-test','oai-authenticated-user-email':'cost-test@example.test'})}`:`export function redirect(){throw Error('Unexpected redirect')}`,loader:'js'}))}}];
try{
  // Grounded AI search stays locked in free-test mode.
  {
    const result=await build({entryPoints:['app/api/ai/search/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});
    const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
    const response=await route.POST(new Request('https://test.local/',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({key:'fake-key',consent:true})}));
    assert.equal(response.status,403,'ai/search must stay locked');
    assert.equal((await response.json()).code,'EXTERNAL_API_LOCKED');
  }
  // Settings POST must refuse server-side key storage (BYOK / browser-only).
  for(const file of ['app/api/ai/settings/route.ts','app/api/tavily/settings/route.ts']){
    const result=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,plugins});
    const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
    const response=await route.POST(new Request('https://test.local/',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({key:'fake-key-value-long-enough-12345',consent:true})}));
    const body=await response.json();
    assert.equal(response.status,400,file+' must reject server key save');
    assert.equal(body.code,'BROWSER_KEY_ONLY',file+' must return BROWSER_KEY_ONLY');
    assert.notEqual(body.code,'EXTERNAL_API_LOCKED',file+' must not be cost-locked');
  }
  // Interview evaluate is unlocked from FREE_TEST_MODE cost lock and must not read vault keys.
  {
    const src=fs.readFileSync('app/api/workspace/route.ts','utf8');
    assert.ok(!src.includes('readSettings'),'evaluate path must not use server-stored keys');
    assert.ok(src.includes('geminiKeyFromRequest'),'evaluate must take request key');
    const result=await build({entryPoints:['app/api/workspace/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});
    const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
    const form=new FormData();form.set('action','evaluate');form.set('id','fake-session');
    const response=await route.POST(new Request('https://test.local/api/workspace',{method:'POST',headers:{Origin:'https://test.local'},body:form}));
    const body=await response.json();
    assert.notEqual(body.code,'EXTERNAL_API_LOCKED','evaluate must not be cost-locked');
  }
  // Search/eval routes must not fall back to vault keys.
  for(const file of ['app/api/tavily/search/route.ts','app/api/tavily/companies/route.ts','app/api/website-jobs/route.ts','app/api/tavily/test/route.ts','app/api/ai/search/route.ts']){
    const src=fs.readFileSync(file,'utf8');
    assert.ok(!src.includes('readSettings'),file+' must not read server-stored keys');
  }
  assert.equal(networkCalls,0);
  console.log('Free-mode checks passed: AI search locked; settings refuse server key save (BYOK); evaluate unlocked; no vault key use on search/eval; zero external API calls.');
}finally{globalThis.fetch=originalFetch}
