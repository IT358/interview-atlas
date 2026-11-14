import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function mod(file){const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const core=await mod('lib/verified-website-jobs.ts'),f=await mod('lib/freelancer-projects.ts'),multi=await mod('lib/multi-site-jobs.ts');
const now=Date.now(),future=new Date(now+10*86400000).toISOString().slice(0,10);
const description='I need a responsive website built for our business. Please design and develop the pages, implement HTML and CSS and prepare the final website for delivery. '.repeat(3);
const project=(i)=>({id:i,title:'Business Website Design '+i,seo_url:'website-design/business-website-'+i,status:'active',frontend_project_status:'open',type:'fixed',description,budget:{minimum:100,maximum:200},currency:{code:'USD'},submitdate:Math.floor(now/1000),jobs:[{name:'Website Design'},{name:'HTML'}],upgrades:{fulltime:false}});
const rows=f.freelancerProjects({status:'success',result:{projects:Array.from({length:45},(_,i)=>project(i+1))}},now);assert.equal(rows.length,45);assert.equal(rows[0].deadline,null);assert.equal(rows[0].expires,null);assert.equal(core.liveWebsiteJob(rows[0],now),true);assert(rows[0].salaryText.startsWith('USD'));assert.equal(core.filterWebsiteJobs(rows,{minimum:'10000'}).length,0);
for(const patch of [{status:'closed'},{frontend_project_status:'closed'},{deleted:true},{nonpublic:true},{hireme:true},{upgrades:{fulltime:true}},{seo_url:'../private'}])assert.equal(f.freelancerProjects({status:'success',result:{projects:[{...project(1),...patch}]}},now).length,0);
assert.equal(core.filterWebsiteJobs(f.freelancerProjects({status:'success',result:{projects:[{...project(1),title:'Mobile app website dashboard'}]}},now),{cat:'Web制作全般'}).length,0);
const body='企業のホームページ制作を依頼します。デザインとコーディングをお願いします。WordPress実装と公開まで、制作物を納品してください。'.repeat(3)+' 現役大学生・大学院生限定です。';
const html=`<h1 class="c-requestTitle_heading">Webサイト制作</h1><div class="d-requestBudget"><div><span>50万</span>円</div>〜<div><span>100万</span>円</div></div>締切日 ${future.replace(/(\d+)-(\d+)-(\d+)/,'$1年$2月$3日')}<button><span>応募する</span></button><div class="c-detailRowContentText nl2br extra">${body}</div>`;
const coco=core.parseWebsitePage('https://coconala.com/requests/12345',html,now).job;assert(coco);assert.equal(coco.minSalary,500000);assert.equal(coco.maxSalary,1000000);assert(coco.eligibilityNote.includes('大学生'));assert.equal(core.websiteWork('Webサイトへのタグ設置の提案パートナー募集',body),false);assert.equal(core.websiteWork('WordPress会員投稿システムの構築',body),false);assert.equal(core.jobDetailUrl('https://coconala.com/services/12345'),'');
const cw={...coco,url:'https://crowdworks.jp/public/jobs/12345',id:'cw',source:'クラウドワークス'};
const balanced=multi.balancedJobs([[cw],[coco],rows],{},30);assert.equal(balanced.length,30);assert.equal(new Set(balanced.map(j=>j.url)).size,30);assert.equal(new Set(balanced.map(j=>j.source)).size,3);assert.equal(multi.balancedJobs([[cw],rows],{market:'日本'},30).length,1);
assert.equal(core.liveWebsiteJob({...rows[0],verifiedAt:now-25*3600000},now),false);
console.log('Multi-site checks passed: 30 distinct genuine project records, three-source balance, open-state evidence without fabricated deadline, nested JPY budgets, source/market/currency filters, private/deleted/full-time/app exclusions and 24-hour verification expiry. Fixtures only.');
// A definitive closure on this search must never be filled back from the research seed.
const oldFetch=globalThis.fetch;try{
 const listed=JSON.stringify({searchResult:{job_offers:[{job_offer:{id:12345,status:'released',expired_on:future,title:'企業ホームページ制作',description_digest:body,last_released_at:new Date().toISOString()}}]}}).replaceAll('"','&quot;');
 globalThis.fetch=async(url)=>String(url).includes('/category/')?new Response(`<div id="vue-container" data="${listed}"></div>`):new Response(`<h1>企業ホームページ制作</h1>この仕事の募集は終了しました。応募期限 ${future} 仕事の詳細 ${body}`,{headers:{'Content-Type':'text/html'}});
 const closedSeed={...cw,title:'企業ホームページ制作'};
 const collected=await multi.collectWebsiteJobs({cat:'HP・企業サイト制作',source:'クラウドワークス',market:'日本'},undefined,undefined,[closedSeed],30,true);
 assert.equal(collected.jobs.length,0);assert(collected.excludedUrls.includes(closedSeed.url));
}finally{globalThis.fetch=oldFetch}
console.log('Confirmed-closure regression passed: fresh closed evidence overrides research fallback.');
