import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
const load=async(file)=>{const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))};
const {freeTavilyCredits,authorizeTavily}=await load('lib/tavily-allowance.ts');
const {fetchTavilyAction}=await load('lib/tavily-confirmation.ts');
const database=new DatabaseSync(':memory:');database.exec(readFileSync('drizzle/0002_simple_young_avengers.sql','utf8'));
const db={prepare(sql){let args=[];return {bind(...v){args=v;return this},async run(){return {meta:{changes:Number(database.prepare(sql).run(...args).changes)}}}}}};
const usage=(used=0,extra={})=>({key:{usage:0,limit:999999},account:{current_plan:'Researcher',plan_usage:used,plan_limit:1000,paygo_usage:0,...extra}});
assert.equal(freeTavilyCredits(usage(998)),2);
assert.equal(freeTavilyCredits(usage(1000)),0);
for(const data of [{key:{usage:0,limit:1000}},usage(0,{current_plan:'Bootstrap',plan_limit:15000}),usage(0,{plan_usage:'0'}),usage(0,{paygo_usage:1}),usage(0,{paygo_usage:undefined})])assert.equal(freeTavilyCredits(data),null);
let usageCalls=0;
const options={key:'fixture-only',db,initiated:true,credits:2,request:async(url,init)=>{assert.equal(url,'https://api.tavily.com/usage');assert(!init.body);usageCalls++;return Response.json(usage(998))}};
await assert.rejects(()=>authorizeTavily({...options,initiated:false}),e=>e.code==='TAVILY_ACTION_REQUIRED');assert.equal(usageCalls,0);
const permit=await authorizeTavily(options);assert.equal(permit.freeCreditsBefore,2);
await assert.rejects(()=>authorizeTavily(options),e=>e.code==='TAVILY_ACTION_BUSY');assert.equal(usageCalls,1);
await permit.release();
for(const data of [usage(999),usage(1000),{},usage(0,{current_plan:'Project'})])await assert.rejects(()=>authorizeTavily({...options,request:async()=>Response.json(data)}),e=>e.status===402&&e.code==='BILLING_HOLD');
await assert.rejects(()=>authorizeTavily({...options,request:async()=>{throw Error('offline')}}),e=>e.status===402&&e.code==='BILLING_HOLD');
await assert.rejects(()=>authorizeTavily({...options,request:async()=>new Response('',{status:401})}),e=>e.status===400&&e.code==='TAVILY_INVALID_KEY');
const reset=await authorizeTavily({...options,request:async()=>Response.json(usage(0))});assert.equal(reset.freeCreditsBefore,1000);await reset.release();
const lastCredit=await authorizeTavily({...options,minimumCredits:1,request:async()=>Response.json(usage(999))});assert.equal(lastCredit.credits,1);await lastCredit.release();
const again=await authorizeTavily(options);await again.release();
await assert.rejects(()=>authorizeTavily({...options,confirmed:true,request:async()=>{throw Error('blocked')}}),e=>e.code==='BILLING_HOLD');
const paid=await authorizeTavily({...options,confirmed:true,env:{OWNER_BILLING_APPROVED:'1'},request:async()=>{throw Error('Do not gate confirmed paid action on usage')}});assert.equal(paid.freeCreditsBefore,null);

const originalFetch=globalThis.fetch,originalWindow=globalThis.window;
try{
 let sends=[],prompts=0;
 globalThis.window={confirm(){prompts++;return true}};
 globalThis.fetch=async(url,init)=>{const body=JSON.parse(init.body);sends.push(body);return !body.confirmed?Response.json({code:'BILLING_HOLD',error:'これ以降は課金が必要なので深夜特急の承認待ちです'},{status:402}):Response.json({jobs:[],credits:2})};
 const action=()=>({label:'案件検索',credits:2,details:'検索条件を送信'});
 await assert.rejects(()=>fetchTavilyAction('/api/website-jobs',{conditions:{q:'React'}},action()),/深夜特急/);assert.equal(prompts,0);assert.equal(sends.length,1);assert.equal(sends[0].confirmed,false);
}finally{globalThis.fetch=originalFetch;globalThis.window=originalWindow}
console.log('Allowance fixtures passed: free credits, billing hold without owner approval, owner-approved paid bypass, no device paid prompt. No real credits used.');
