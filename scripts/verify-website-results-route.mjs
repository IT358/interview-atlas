import assert from 'node:assert/strict';
import {build} from 'esbuild';
const future=new Date(Date.now()+10*86400000).toISOString().slice(0,10),jp=future.replace(/(\d+)-(\d+)-(\d+)/,'$1年$2月$3日');
const text='企業サイトを制作する依頼です。HTML CSSでの修正とWordPressの実装、問い合わせフォームの公開をお願いします。'.repeat(5);
const detail=`<h1>企業HP修正</h1>ホームページ作成の仕事の依頼 仕事の概要 固定報酬制 50,000円 納品希望日 - 掲載日 2026年11月12日 応募期限 ${future} 仕事の詳細 ${text}`;
const list=JSON.stringify({searchResult:{job_offers:[{job_offer:{id:12345,title:'企業HP修正',description_digest:text,status:'released',expired_on:future,last_released_at:new Date().toISOString()}}]}}).replaceAll('"','&quot;');
const coco=`<h1 class="c-requestTitle_heading">企業サイト制作</h1>締切日 ${jp}<button><span>応募する</span></button><div class="d-requestBudget">50,000円</div><div class="c-detailRowContentText nl2br">${text}</div>`;
const english='I need a responsive website designed and developed with HTML and CSS. Please deliver the completed website and transfer the source code to our business. '.repeat(3);
const projects=Array.from({length:40},(_,i)=>({id:i+1,title:'Business Website Design '+i,seo_url:'website-design/business-site-'+i,status:'active',frontend_project_status:'open',type:'fixed',description:english,budget:{minimum:100,maximum:200},currency:{code:'USD'},submitdate:Math.floor(Date.now()/1000),jobs:[{name:'HTML'}]}));
const original=globalThis.fetch;let calls=0,failSecond=false,payloads=[];
globalThis.fetch=async(url,options)=>{
 if(url==='https://api.tavily.com/search'){calls++;payloads.push(JSON.parse(options.body));if(failSecond&&calls===2)return new Response('',{status:503});return Response.json({results:Array.from({length:20},(_,i)=>({url:'https://crowdworks.jp/public/jobs/category/'+i,title:'一覧'})),usage:{credits:1}})}
 if(String(url).startsWith('https://www.freelancer.com/api/'))return Response.json({status:'success',result:{projects}});
 if(/^https:\/\/crowdworks.jp\/public\/jobs\/category\/\d+$/.test(url)){assert.equal(options.redirect,'manual');return new Response(`<div id="vue-container" data="${list}"></div>`,{headers:{'Content-Type':'text/html'}})}
 if(String(url).includes('coconala.com/requests/categories/'))return new Response('<a href="/requests/77777">企業サイト制作</a>');
 if(url==='https://coconala.com/requests/77777')return new Response(coco,{headers:{'Content-Type':'text/html'}});
 assert.equal(url,'https://crowdworks.jp/public/jobs/12345');return new Response(detail,{headers:{'Content-Type':'text/html'}});
};
const plugins=[{name:'fixtures',setup(b){b.onResolve({filter:/cloudflare:workers|chatgpt-auth$|key-vault$|researched-website-jobs\.json$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path.endsWith('.json')?'export default []':a.path.includes('chatgpt-auth')?`export async function getChatGPTUser(){return {userId:'fixture'}}`:a.path.includes('key-vault')?`export async function vaultOwner(){return {owner:'fixture'}};export async function readSettings(){return {key:'tvly-fixture-only',consent:true}}`:`export const env={USER_KEY_ENCRYPTION_KEY:'fixture',BUCKET:{get:async()=>null,put:async()=>{}}};`}))}}];
try{
 const b=await build({entryPoints:['app/api/website-jobs/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins});const route=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
 const request=confirmed=>new Request('https://fixture.local/api/website-jobs',{method:'POST',headers:{origin:'https://fixture.local','Content-Type':'application/json'},body:JSON.stringify({confirmed,conditions:{cat:'Web制作全般'}})});
 assert.equal((await route.POST(request(false))).status,400);assert.equal(calls,0);
 const r=await route.POST(request(true)),d=await r.json();assert.equal(r.status,200);assert.equal(d.jobs.length,30);assert.equal(new Set(d.jobs.map(j=>j.url)).size,30);assert.equal(d.credits,2);assert.equal(calls,2);assert.equal(d.excluded,40);assert.equal(Object.keys(d.sourceCounts).length,3);
 for(const p of payloads){assert.equal(p.time_range,'month');assert.equal(p.max_results,20);assert.equal(p.search_depth,'basic');assert.equal(p.auto_parameters,false)}
 const free=await route.GET(new Request('https://fixture.local/api/website-jobs?discover=1'));const fd=await free.json();assert.equal(fd.jobs.length,30);assert.equal(fd.credits,0);assert.equal(calls,2);
 calls=0;failSecond=true;const partial=await (await route.POST(request(true))).json();assert.equal(partial.jobs.length,30);assert.equal(partial.credits,1);assert.equal(partial.warnings.length,1);assert.equal(partial.creditsUncertain,true);assert.equal(calls,2);
 console.log('Route checks passed: 30 unique projects across three sites, consent before any provider call, two planned basic searches, key-free collection, and second-search failure preserves results/actual credits without retries. Fixtures only.');
}finally{globalThis.fetch=original}
