import assert from 'node:assert/strict';
import {build} from 'esbuild';
const load=async file=>{const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))};
const jobs=await load('lib/verified-website-jobs.ts'),search=await load('lib/website-job-search.ts');
const future=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
const description='会社のホームページを制作する依頼です。原稿とデザインを支給します。レスポンシブ対応のHTML CSSとWordPressでの実装、問い合わせフォームの公開をお願いします。'.repeat(5)+' 後半に記載する検索語テスト';
const url='https://crowdworks.jp/public/jobs/12345';
const page=(closed='')=>`<h1><span>会社HP修正</span><span class="subtitle">ホームページ作成の仕事の依頼</span></h1>仕事の概要 固定報酬制 50,000円 納品希望日 - 掲載日 2026年11月12日 応募期限 ${future.replaceAll('-','/')} ${closed} 仕事の詳細 ${description}`;
const parsed=jobs.parseWebsitePage(url,page());assert(parsed.job);assert.equal(parsed.job.title,'会社HP修正');assert.equal(parsed.job.deadline,future);assert.equal(jobs.filterWebsiteJobs([parsed.job],{cat:'Web制作全般',q:'後半に記載する検索語テスト'}).length,1);
assert.equal(jobs.websiteWork('既存サイト改修',description),true);assert.equal(jobs.websiteWork('Web制作',description),true);assert.equal(jobs.websiteWork('WordPressの記事作成',description),false);assert.equal(jobs.websiteWork('Web制作の営業パートナー募集',description),false);assert.equal(jobs.websiteWork('HP制作のアポインター募集',description),false);
const raw=`# 会社HP修正\nホームページ作成の仕事の依頼\n## 仕事の概要\n固定報酬制 | 50,000円\n掲載日 | 2026年11月12日\n**応募期限** | ${future}\n## 仕事の詳細\n${description}`;
assert(jobs.parseWebsitePage(url,raw).job);
const original=globalThis.fetch;let calls=0;
try{
 globalThis.fetch=async()=>{calls++;return new Response('<h1>ページを確認しています</h1>',{headers:{'Content-Type':'text/html'}})};
 const recovered=await search.verifyTavilyWebsiteResults([{url,title:'会社HP修正',raw_content:raw}]);assert.equal(recovered.jobs.length,1);assert.equal(calls,1);
 globalThis.fetch=async()=>new Response(page('この仕事の募集は終了しました'),{headers:{'Content-Type':'text/html'}});
 const closed=await search.verifyTavilyWebsiteResults([{url,title:'会社HP修正',raw_content:raw}]);assert.equal(closed.jobs.length,0);assert.equal(closed.exclusionCounts['募集終了・受付停止'],1);
 const rejected=await search.verifyTavilyWebsiteResults([{url:'https://crowdworks.jp/public/jobs/search',raw_content:raw},{url:'https://www.lancers.jp/menu/detail/12345',raw_content:raw}]);assert.equal(rejected.jobs.length,0);assert.equal(rejected.exclusionCounts['個別募集ページ以外'],2);
}finally{globalThis.fetch=original}
const row=(id,status='released',expired_on=future)=>({job_offer:{id,status,expired_on,title:'企業HP修正',description_digest:description,last_released_at:new Date().toISOString()}});
const data=JSON.stringify({searchResult:{job_offers:[row(12345),row(12346,'closed'),row(12347,'released','2000-01-01'),row('12348')]}}).replaceAll('"','&quot;');
assert.equal(search.urlsFromOfficialListing(`<div id="vue-container" data="${data}"></div>`).length,1);
assert.equal(search.urlsFromOfficialListing('<p>No public listings</p>').length,0);
assert(search.websiteSearchQuery({cat:'Web制作全般'}).includes('inurl:/public/jobs/'));assert(!search.websiteSearchQuery({cat:'Web制作全般'}).includes('site:crowdworks.jp'));assert(!search.websiteSearchQuery({cat:'Web制作全般'}).includes('フリーランス 業務委託 案件'));
const plan=search.websiteSearchPlans({cat:'Web制作全般',source:'クラウドワークス'},1,0)[0];assert.deepEqual(plan.domains,['crowdworks.jp']);assert(plan.query.includes('ホームページ制作'));assert(!plan.query.includes('site:'));
console.log('Website result checks passed: HP修正 and nested titles, date formats, complete-text filtering, raw-content recovery, hard closed exclusions, listing/service rejection and official listing candidate validation.');
