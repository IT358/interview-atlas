import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {build} from 'esbuild';
async function moduleFor(file){const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const jobs=await moduleFor('lib/verified-website-jobs.ts');const company=await moduleFor('lib/company-research.ts');
const now=Date.parse('2026-11-12T10:00:00+09:00');
const description='企業のホームページを5ページ制作する依頼です。HTML CSSでコーディングとWordPress構築をお願いします。納品物はレスポンシブのサイト一式です。原稿とFigmaのデザインを支給します。実務経験がある方を募集しています。';
function fixture(date='2030-11-25',extra=''){return `<script type="application/ld+json">${JSON.stringify({'@type':'JobPosting',title:'ホームページ作成',description,validThrough:date,hiringOrganization:{name:'テスト発注者'}})}</script><h1>企業ホームページ制作</h1>仕事の概要 固定報酬制 50,000円 〜 100,000円 納品希望日 - 掲載日 2026年11月11日 応募期限 ${date.replace(/(\d+)-(\d+)-(\d+)/,'$1年$2月$3日')} ${extra} 仕事の詳細 ${description} クライアント情報`}
const url='https://crowdworks.jp/public/jobs/13592407';
const valid=jobs.parseWebsitePage(url,fixture(),now);assert(valid.job);assert.equal(valid.job.minSalary,50000);assert.equal(valid.job.maxSalary,100000);assert.equal(valid.job.company,'テスト発注者');
assert.equal(jobs.parseWebsitePage(url,fixture('2020-01-01'),now).reason,'応募期限切れ');
assert.equal(jobs.parseWebsitePage(url,fixture('2030-11-25','この仕事の募集は終了しました'),now).reason,'募集終了・受付停止');
assert.equal(jobs.jobDetailUrl('https://crowdworks.jp/public/jobs/search'),'');assert.equal(jobs.jobDetailUrl('http://crowdworks.jp/public/jobs/123'),'');assert.equal(jobs.jobDetailUrl('https://evil.example/public/jobs/123'),'');assert.equal(jobs.jobDetailUrl('https://crowdworks.jp@evil.example/public/jobs/123'),'');
assert.equal(jobs.websiteWork('WordPressの記事作成・入稿',description),false);assert.equal(jobs.websiteWork('Webアプリ開発',description),false);
const firms=JSON.parse(await fs.readFile('data/researched-companies.json','utf8'));assert.equal(firms.length,100);assert.equal(new Set(firms.map(c=>c.domain)).size,100);assert.equal(firms.filter(c=>c.publishedOutsourcePrice).length,7);
for(const c of firms){assert(c.company&&c.evidence&&c.partnerUrl&&c.checkedAt);assert.equal(new URL(c.url).protocol,'https:');assert.equal(new URL(c.partnerUrl).protocol,'https:');assert.equal(c.recruitmentStatus,'協業募集ページあり');}
assert.notEqual(company.companyResearchQuery({region:'東京都',type:'Web制作会社',service:'',q:'',purpose:''},0),company.companyResearchQuery({region:'東京都',type:'Web制作会社',service:'',q:'',purpose:''},1));
const sample={title:'パートナー募集 | テスト制作株式会社',url:'https://example.co.jp/partner/',raw_content:('テスト制作株式会社はWebサイト制作・WordPressの外部パートナーを募集しています。法人・個人・フリーランスのデザイナーとコーダーの応募を受け付けています。').repeat(8)};
assert(company.researchCompanyResult(sample,{region:'東京都',service:'Web制作全般'}));assert.equal(company.researchCompanyResult({...sample,raw_content:sample.raw_content+' 現在募集を停止しています。'},{}),null);assert.equal(company.researchCompanyResult({...sample,raw_content:''},{}),null);assert.equal(company.researchCompanyResult({...sample,url:'https://www.lancers.jp/work/search'},{}),null);
console.log('Research checks passed: real detail URLs, active deadlines, closed/list/article exclusions,100 unique official firms,7 public pay examples, separate assumptions and batch variants.');
// A fresh negative verification must override a seeded listing, including after reload.
const beforeFetch=globalThis.fetch;const seeded={...valid.job,verifiedAt:Date.now(),expires:Date.now()+86400000};let networkCalls=0;
const cache=new Map();const bucket={get:async key=>cache.has(key)?{json:async()=>cache.get(key)}:null,put:async(key,value)=>cache.set(key,JSON.parse(value))};
try{
 globalThis.fetch=async()=>{networkCalls++;return new Response(fixture('2030-11-25','この仕事の募集は終了しました'),{headers:{'Content-Type':'text/html'}})};
 assert((await jobs.fetchWebsiteJob(url,bucket,false,seeded)).job);assert.equal(networkCalls,0);
 assert.equal((await jobs.fetchWebsiteJob(url,bucket,true,seeded)).reason,'募集終了・受付停止');
 assert.equal((await jobs.fetchWebsiteJob(url,bucket,false,seeded)).job,undefined);assert.equal(networkCalls,1);
}finally{globalThis.fetch=beforeFetch}
console.log('Negative-cache check passed: a closed listing never reappears from the research seed.');
