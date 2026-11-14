import assert from 'node:assert/strict';
import {build} from 'esbuild';
const original=globalThis.fetch;let calls=0,providerCalls=0,remaining=1000,unknown=false;
globalThis.fetch=async(url)=>{calls++;if(String(url).endsWith('/usage'))return Response.json(unknown?{}:{account:{current_plan:'Researcher',plan_limit:1000,plan_usage:1000-remaining,paygo_usage:0}});if(String(url).startsWith('https://api.tavily.com/'))providerCalls++;return Response.json({results:[],usage:{credits:1}})};
const plugins=[{name:'fixtures',setup(b){b.onResolve({filter:/cloudflare:workers|chatgpt-auth$|key-vault$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path.includes('chatgpt-auth')?`export async function getChatGPTUser(){return {userId:'fixture'}}`:a.path.includes('key-vault')?`export async function vaultOwner(){return {owner:'fixture'}};export async function readSettings(){return {key:'tvly-fixture-only',consent:true}}`:`export const env={USER_KEY_ENCRYPTION_KEY:'fixture',BUCKET:{get:async()=>null,put:async()=>{}},DB:{prepare(){return {bind(){return this},async run(){return {meta:{changes:1}}}}}}};`}))}}];
try{
 for(const file of ['app/api/tavily/search/route.ts','app/api/tavily/companies/route.ts','app/api/website-jobs/route.ts']){
  const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,plugins});
  const route=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
  const request=(data,origin='https://fixture.local')=>new Request('https://fixture.local/api/search',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
  const before=calls,beforeProvider=providerCalls;
  assert.equal((await route.POST(request({confirmed:true},'https://other.local'))).status,403,file);
  assert.equal((await route.POST(request({}))).status,400,file);assert.equal(calls,before,file);
  assert.equal((await route.POST(request({confirmed:true,conditions:{type:'Web制作会社',purpose:'協業・外注パートナー募集'}}))).status,200,file);assert.equal(providerCalls,beforeProvider+(file==='app/api/website-jobs/route.ts'?2:1),file);
  const planned=file==='app/api/website-jobs/route.ts'?2:1,conditions={type:'Web制作会社',purpose:'協業・外注パートナー募集'};
  remaining=planned;unknown=false;let searched=providerCalls;assert.equal((await route.POST(request({initiated:true,conditions}))).status,200,file+' free boundary');assert.equal(providerCalls,searched+planned);
  if(planned===2){remaining=1;searched=providerCalls;const last=await route.POST(request({initiated:true,conditions}));assert.equal(last.status,200);assert.equal(providerCalls,searched+1,'last free credit uses only one search');assert.equal((await last.json()).freeCreditsBefore,1)}
  searched=providerCalls;remaining=0;let r=await route.POST(request({initiated:true,conditions}));assert.equal(r.status,402);assert.equal((await r.json()).code,'TAVILY_CONFIRMATION_REQUIRED');assert.equal(providerCalls,searched,'insufficient allowance must send no search');
  unknown=true;r=await route.POST(request({initiated:true,conditions}));assert.equal(r.status,402);assert.equal(providerCalls,searched,'unknown allowance must send no search');
  assert.equal((await route.POST(request({initiated:true,confirmed:true,conditions}))).status,200);assert.equal(providerCalls,searched+planned,'device-confirmed action must work when usage unavailable');
 }
 console.log('All three Tavily search routes: explicit action required, cross-origin rejected, exact free boundary skips confirmation, insufficient/unknown allowance sends no search, confirmed fallback works. Fixtures only.');
}finally{globalThis.fetch=original}
