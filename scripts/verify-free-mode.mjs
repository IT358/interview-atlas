import assert from 'node:assert/strict';
import {build} from 'esbuild';
let networkCalls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{networkCalls++;throw Error('External traffic must stay blocked')};
const plugins=[{name:'isolated-cost-test',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\/headers$|^next\/navigation$/},a=>({path:a.path,namespace:'cost-test'}));b.onLoad({filter:/.*/,namespace:'cost-test'},a=>({contents:a.path==='cloudflare:workers'?`export const env=new Proxy({},{get(){throw Error('Storage must not be accessed by a blocked operation')}});`:a.path==='next/headers'?`export async function headers(){return new Headers({'oai-authenticated-user-id':'cost-test','oai-authenticated-user-email':'cost-test@example.test'})}`:`export function redirect(){throw Error('Unexpected redirect')}`,loader:'js'}))}}];
try{
 for(const file of ['app/api/ai/search/route.ts','app/api/ai/settings/route.ts','app/api/workspace/route.ts']){
  const result=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,plugins});
  const route=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const form=new FormData();form.set('action','evaluate');form.set('id','fake-session');
  const request=file.includes('workspace')?new Request('https://test.local/api/workspace',{method:'POST',headers:{Origin:'https://test.local'},body:form}):new Request('https://test.local/',{method:'POST',headers:{Origin:'https://test.local','Content-Type':'application/json'},body:JSON.stringify({key:'fake-key',consent:true})});
  const response=await route.POST(request);assert.equal(response.status,403,file);assert.equal((await response.json()).code,'EXTERNAL_API_LOCKED',file);
 }
 assert.equal(networkCalls,0);console.log('Free-mode checks passed: 3 AI operations blocked before network/storage; zero external API calls.');
}finally{globalThis.fetch=originalFetch}
