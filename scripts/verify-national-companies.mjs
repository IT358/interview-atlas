import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function mod(file,plugins=[]){const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,plugins});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const research=await mod('lib/company-research.ts'),search=await mod('lib/company-search.ts');
const c={...search.emptyCompany};
assert.equal(new Set(Array.from({length:47},(_,i)=>research.companyResearchRegion(c,i))).size,47);
assert(research.companyResearchQuery(c,0).includes('北海道'));assert(research.companyResearchQuery(c,46).includes('沖縄県'));
const general={title:'会社概要 | 株式会社テスト制作',url:'https://example.co.jp/about/',raw_content:'株式会社テスト制作はホームページ制作とWebサイトのデザイン、HTML CSSコーディング、WordPress構築を事業として提供しています。'.repeat(8)};
assert.equal(research.researchCompanyResult(general,c),null);
const company=research.researchCompanyResult(general,{...c,purpose:'制作会社全般',region:'東京都'});
assert(company);assert.equal(company.company,'株式会社テスト制作');assert(company.recruitmentStatus.includes('未確認'));assert.equal(company.region,'所在地は公式で確認');assert.equal(company.searchRegion,'東京都');
assert.equal(research.researchCompanyResult({...general,url:'https://imitsu.jp/list/web-design/'},{...c,purpose:'制作会社全般'}),null);
let calls=0,requests=[];const original=globalThis.fetch;
globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.tavily.com/search');assert.equal(options.redirect,'manual');requests.push(JSON.parse(options.body));return Response.json({results:[general,general],usage:{credits:1}})};
const KEY='tvly-fixture-request-only-key-12345';
const plugins=[{name:'fixtures',setup(b){b.onResolve({filter:/cloudflare:workers|chatgpt-auth$|key-vault$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path.includes('chatgpt-auth')?`export async function getChatGPTUser(){return {userId:'fixture'}}`:a.path.includes('key-vault')?`export async function vaultOwner(){return {owner:'fixture',cookie:''}};export async function readSettings(){throw new Error('server vault must not be used')}`:`export const env={USER_KEY_ENCRYPTION_KEY:'fixture',OWNER_BILLING_APPROVED:'1',BUCKET:{get:async()=>null,put:async()=>{}},DB:{prepare(){return {bind(){return this},async run(){return {meta:{changes:1}}}}}}};`}))}}];
try{
 const route=await mod('app/api/tavily/companies/route.ts',plugins);
 const request=(batchIndex,confirmed=true)=>new Request('https://fixture.local/api/tavily/companies',{method:'POST',headers:{origin:'https://fixture.local','Content-Type':'application/json'},body:JSON.stringify({confirmed,key:KEY,consent:true,batchIndex,conditions:{...c,purpose:'制作会社全般'}})});
 assert.equal((await route.POST(request(46,false))).status,400);assert.equal(calls,0);
 assert.equal((await route.POST(new Request('https://fixture.local/api/tavily/companies',{method:'POST',headers:{origin:'https://fixture.local','Content-Type':'application/json'},body:JSON.stringify({confirmed:true,batchIndex:46,conditions:{...c,purpose:'制作会社全般'}})}))).status,400,'missing browser key');
 const r=await route.POST(request(46)),d=await r.json();assert.equal(r.status,200);assert.equal(d.region,'沖縄県');assert.equal(d.results.length,1);assert.equal(d.results[0].searchRegion,'沖縄県');assert.equal(d.credits,1);assert.equal(calls,1);
 assert.equal((await route.POST(request(47))).status,400);assert.equal(calls,1);assert.equal(requests[0].search_depth,'basic');assert.equal(requests[0].max_results,20);
 console.log('National company checks passed: 47 distinct prefectures, valid final batch, one confirmed basic request, duplicate exclusion, general businesses separated from partner recruitment, and search region never presented as verified address. Fixtures only.');
}finally{globalThis.fetch=original}
