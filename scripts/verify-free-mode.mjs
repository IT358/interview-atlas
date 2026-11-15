import assert from 'node:assert/strict';
import {build} from 'esbuild';
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
  // Gemini settings save is allowed (interview eval only); must not return EXTERNAL_API_LOCKED.
  {
    const result=await build({entryPoints:['app/api/ai/settings/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});
    const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
    const response=await route.POST(new Request('https://test.local/',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({key:'fake-key-value-long-enough-12345',consent:true})}));
    const body=await response.json();
    assert.notEqual(body.code,'EXTERNAL_API_LOCKED','ai/settings must allow Gemini key save');
  }
  // Interview evaluate is unlocked from FREE_TEST_MODE cost lock.
  {
    const result=await build({entryPoints:['app/api/workspace/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});
    const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
    const form=new FormData();form.set('action','evaluate');form.set('id','fake-session');
    const response=await route.POST(new Request('https://test.local/api/workspace',{method:'POST',headers:{Origin:'https://test.local'},body:form}));
    const body=await response.json();
    assert.notEqual(body.code,'EXTERNAL_API_LOCKED','evaluate must not be cost-locked');
  }
  assert.equal(networkCalls,0);
  console.log('Free-mode checks passed: AI search stays locked; Gemini settings/evaluate are not EXTERNAL_API_LOCKED; zero external API calls.');
}finally{globalThis.fetch=originalFetch}
