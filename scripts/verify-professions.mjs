import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function mod(file){const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const [p,cat,core,discovery,freelancer,external]=await Promise.all(['lib/professions.ts','lib/job-categories.ts','lib/verified-website-jobs.ts','lib/website-job-search.ts','lib/freelancer-projects.ts','lib/freelance-sites.ts'].map(mod));
assert.equal(p.professions.length,29);assert.equal(new Set(p.professions.map(p=>p.id)).size,29);assert.equal(cat.categoryTree.length,7);
const now=Date.now(),future=new Date(now+864000000).toISOString().slice(0,10),jp=future.replace(/(\d+)-(\d+)-(\d+)/,'$1年$2月$3日');
const original=globalThis.fetch;let request;
globalThis.fetch=async(url)=>{request=String(url);return Response.json({status:'success',result:{projects:[]}})};
try{for(const role of p.professions){
 assert(cat.categoryPath(role.category).family,role.label+' must be selectable');assert(discovery.listingCategories({cat:role.category}).length,role.label+' must have domestic discovery');
 const body=`${role.label}の業務を担当していただける方を募集します。対象範囲を確認して、必要な作業と納品、修正対応をお願いします。報酬をお支払いする業務委託の依頼です。担当者との連絡、制作物の確認と納品が必要です。`;
 const title=role.label+'の業務委託募集';
 assert(p.projectProfessions(title,body).some(p=>p.id===role.id),role.label+' classification');
 const html=`<h1>${title}</h1>仕事の概要 固定報酬制 50,000円 納品希望日 - 掲載日 2026年11月13日 応募期限 ${future} 仕事の詳細 ${body}`;
 const row=core.parseWebsitePage('https://crowdworks.jp/public/jobs/12345',html,now).job;assert(row,role.label+' individual source page');assert.equal(core.filterWebsiteJobs([row],{cat:role.category}).length,1,role.label+' exact search');
 assert.equal(core.filterWebsiteJobs([row],{cat:role.category,q:'存在しない検索語'}).length,0);
 const coco=`<h1 class="c-requestTitle_heading">${title}</h1>締切日 ${jp}<button>応募する</button><div class="d-requestBudget">50,000円</div><div class="c-detailRowContentText">${body}</div>`;
 assert(core.parseWebsitePage('https://coconala.com/requests/12345',coco,now).job,role.label+' Coconala verification');
 const query=discovery.websiteSearchQuery({cat:role.category});assert(query.includes(role.ja),role.label+' Japanese source query');
 const google=new URL(external.externalFreelanceSearch('Upwork','remote',role.category));assert(google.searchParams.get('q').includes(role.en),role.label+' overseas external search');
 await freelancer.fetchFreelancerProjects(undefined,undefined,{cat:role.category});assert.equal(new URL(request).searchParams.get('query'),role.en,role.label+' live API query');
 const data={status:'success',result:{projects:[{id:1,title:role.en+' project',description:'We need help with '+role.en+'. Please deliver the project files and provide the work described in this freelance project. We are looking for a freelancer who can complete the task and submit the requested deliverables.',seo_url:'sample/project-123',type:'fixed',status:'active',frontend_project_status:'open',budget:{minimum:100,maximum:300},currency:{code:'USD'}}]}};
 const overseas=freelancer.freelancerProjects(data,now);assert.equal(core.filterWebsiteJobs(overseas,{cat:role.category}).length,1,role.label+' overseas project matching');
 }}finally{globalThis.fetch=original}
const ids=(title,body='この業務を担当し、指定の制作物を納品する方を募集します。'.repeat(4))=>p.projectProfessions(title,body).map(p=>p.id);
assert.deepEqual(ids('ChatGPTを使ったSEO記事執筆・WordPress入稿'),['writing']);
assert(!ids('AIを使った記事作成').includes('automation'));assert(!ids('Google広告バナー画像の制作').includes('ads'));
assert(!ids('AndroidアプリのQAテスター募集').includes('mobile'));assert(ids('AndroidアプリのQAテスター募集').includes('qa'));
assert(!ids('React Webアプリ開発').includes('mobile'));assert.equal(ids('Artist portfolios').includes('mobile'),false);
for(const title of ['動画編集者募集','アンケート回答者募集','Web制作の営業パートナー募集','AI Video Production','オンラインインタビュー参加者募集'])assert.equal(p.freelanceWork(title,'Please help with website design and AI automation for this project. '.repeat(5)),false,title);
assert.equal(p.projectExperience('Webデザイナー募集','実務未経験OK。実務経験がなくても応募できます。'),'未経験可');
assert.equal(p.projectExperience('経験者募集','実務経験3年以上が必須です。'),'経験必須');
assert.equal(p.projectExperience('応募条件','実務未経験可。ただし実務経験3年以上が必須。'),'条件併記・要確認');
console.log('29-profession checks passed: seven unique category trees, all roles selectable, domestic discovery, Japanese queries, exact filters, overseas API queries/results, Coconala detail verification, keyword AND and cross-role exclusions. Fixtures only.');
