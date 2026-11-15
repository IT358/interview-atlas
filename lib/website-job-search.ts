import {professions,professionForCategory,professionFamilies,freelanceWork} from './professions';
import {matchesFreelanceCategory} from './verified-website-jobs';
import {categoryMembers,categorySearchTerm} from './job-categories';
import {skillSearchTerm} from './web-skills';
import type {SearchConditions} from './grounded-search';
import {jobDetailUrl,parseWebsitePage,verifyJobUrls,websiteWork,type WebsiteJob} from './verified-website-jobs';

/** Path hints only — listing domains go to Tavily include_domains, not site: in the query. */
const PATH_HINTS:Record<string,string>={
 'クラウドワークス':'inurl:/public/jobs/',
 'ランサーズ':'inurl:/work/detail/',
 'ココナラ':'inurl:/requests/',
 'クラウディア':'inurl:/work_detail/',
};
const ALL_PATH_HINT='(inurl:/public/jobs/ OR inurl:/work/detail/ OR inurl:/requests/ OR inurl:/work_detail/)';
const SOURCE_DOMAINS:Record<string,string[]>={
 'クラウドワークス':['crowdworks.jp'],
 'ランサーズ':['lancers.jp'],
 'ココナラ':['coconala.com'],
 'クラウディア':['craudia.com'],
};
const ALL_DOMAINS=['crowdworks.jp','lancers.jp','coconala.com','craudia.com'];
export type WebsiteSearchPlan={query:string;domains:string[];label:string;sourceFocus:string};
function pathHint(source:string){return PATH_HINTS[source]||ALL_PATH_HINT}
export function domainsForSource(source:string){return SOURCE_DOMAINS[source]||ALL_DOMAINS}
function buildWebsiteQuery(c:Partial<SearchConditions>,focus:string,source=''){
 return [pathHint(source),c.q,skillSearchTerm(c.skill||''),focus,c.exp,'仕事 依頼 募集 応募期限','-inurl:search -inurl:category -inurl:menu -まとめ -相場'].filter(Boolean).join(' ').slice(0,1800);
}
/** Single combined query (compat). Prefer websiteSearchPlans for multi-batch collection. */
export function websiteSearchQuery(c:Partial<SearchConditions>){
 return buildWebsiteQuery(c,categorySearchTerm(c.cat||'Web制作全般'),c.source||'');
}
function focusTermsForCategory(cat:string){
 const exact=professionForCategory(cat);
 const family=professionFamilies.find(f=>f.category===cat)||(exact?professionFamilies.find(f=>f.id===exact.family):undefined);
 const rolePool=exact?[exact]:family?professions.filter(p=>p.family===family.id):[];
 const focuses:string[]=[];
 if(exact){
  focuses.push(exact.ja);
  for(const skill of exact.skills.slice(0,2))focuses.push(skillSearchTerm(skill)||skill);
  focuses.push(exact.label+' 募集');
 }else if(rolePool.length){
  for(const role of rolePool.slice(0,6))focuses.push(role.ja);
  const skills=[...new Set(rolePool.flatMap(p=>p.skills))].slice(0,4);
  for(const skill of skills)focuses.push(skillSearchTerm(skill)||skill);
 }else focuses.push(categorySearchTerm(cat)||cat);
 return [...new Set(focuses.map(x=>x.trim()).filter(Boolean))];
}
/** Expand a field/profession into distinct Tavily plans (role/skills × listing domains). */
export function websiteSearchPlans(c:Partial<SearchConditions>,limit=4,offset=0):WebsiteSearchPlan[]{
 const cat=c.cat||'Web制作全般';
 const uniqueFocus=focusTermsForCategory(cat);
 const source=c.source||'';
 const sourceRotation=['クラウドワークス','ランサーズ','ココナラ','クラウディア'];
 const pool:WebsiteSearchPlan[]=[];
 if(source){
  // Single listing site: path hint + include_domains stay tied to that site only.
  for(const focus of uniqueFocus){
   pool.push({query:buildWebsiteQuery(c,focus,source),domains:domainsForSource(source),label:focus,sourceFocus:source});
  }
 }else{
  // All sites: first cover every domain with OR path hints (never apply /public/jobs/ alone to Lancers/Coconala).
  for(const focus of uniqueFocus){
   pool.push({query:buildWebsiteQuery(c,focus,''),domains:[...ALL_DOMAINS],label:focus,sourceFocus:'取得対応サイトすべて'});
  }
  // Then deepen per listing site with the matching path hint only (for load-more rotation).
  for(let i=0;i<Math.max(uniqueFocus.length,sourceRotation.length);i++){
   const focus=uniqueFocus[i%uniqueFocus.length]||cat;
   const sourceFocus=sourceRotation[i%sourceRotation.length];
   pool.push({query:buildWebsiteQuery(c,focus,sourceFocus),domains:domainsForSource(sourceFocus),label:focus,sourceFocus});
  }
 }
 if(!pool.length)pool.push({query:websiteSearchQuery(c),domains:domainsForSource(source),label:cat,sourceFocus:source||'取得対応サイトすべて'});
 const start=((offset%pool.length)+pool.length)%pool.length;
 const picked:WebsiteSearchPlan[]=[];
 for(let i=0;i<Math.min(limit,pool.length);i++)picked.push(pool[(start+i)%pool.length]);
 return picked;
}
export function sourceHostLabel(host:string){
 const h=host.replace(/^www\./,'');
 return h==='crowdworks.jp'?'クラウドワークス':h==='lancers.jp'?'ランサーズ':h==='coconala.com'?'ココナラ':h==='craudia.com'?'クラウディア':h;
}
export function listingCategories(c:Partial<SearchConditions>){
 if(!c.cat)return [14,173,370,18,37,39,132,66,51];
 const exact=professionForCategory(c.cat||'');if(exact)return exact.cw;
 const family=professionFamilies.find(f=>f.category===c.cat);if(family&&family.id!=='web')return [...new Set(professions.filter(p=>p.family===family.id).flatMap(p=>p.cw))].slice(0,6);
 const members=categoryMembers(c.cat||'Web制作全般');
 if(c.skill==='WordPress'||members.length===1&&members.includes('WordPress制作・修正'))return [20];
 if(members.includes('HTML・CSSコーディング')&&!members.includes('HP・企業サイト制作'))return [16];
 if(members.length===1&&members.includes('LP制作'))return [17];
 if(members.includes('Webデザイン')&&!members.includes('HP・企業サイト制作'))return [15];
 if(members.length===1&&members.includes('サイト修正・運用'))return [285];
 return [14,15,16,17,20,285];
}
// These URLs identify candidates only. Every candidate still needs its full detail page.
export function urlsFromOfficialListing(html:string,now=Date.now(),c:Partial<SearchConditions>={}){
 const raw=html.match(/\bid=["']vue-container["'][^>]*\bdata="([^"]+)"/)?.[1];
 if(!raw)return [];
 let data:any;try{data=JSON.parse(raw.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'))}catch{return []}
 const rows=data?.searchResult?.job_offers;if(!Array.isArray(rows))return [];
 return rows.slice(0,100).flatMap((r:any)=>{const j=r?.job_offer;if(!Number.isSafeInteger(j?.id)||j.id<=0||j.status!=='released'||!freelanceWork(String(j.title||''),String(j.description_digest||''))||!matchesFreelanceCategory({title:j.title,description:j.description_digest},c.cat||'')||!/^\d{4}-\d{2}-\d{2}$/.test(j.expired_on)||Date.parse(j.expired_on+'T23:59:59+09:00')<now)return [];return [{url:'https://crowdworks.jp/public/jobs/'+j.id,published:Date.parse(j.last_released_at)||0,title:String(j.title),description:String(j.description_digest)}]});
}
export async function discoverOfficialWebsiteUrls(c:Partial<SearchConditions>,bucket?:R2Bucket,signal?:AbortSignal,diagnostics:{source:string;status:number|null;candidates:number;reason?:string}[]=[]){
 if(c.source==='ランサーズ')return [];
 const lists=await Promise.all(listingCategories(c).map(async id=>{
  const key='profession-discovery/v2/'+id+'.json';
  try{
   let value:any=null;try{const cached=bucket?await bucket.get(key):null;value=cached?await cached.json():null}catch{}
   if(value?.checkedAt>Date.now()-15*60000&&Array.isArray(value.rows)){diagnostics.push({source:({14:'ホームページ作成',16:'コーディング',20:'WordPress',15:'Webデザイン',17:'LP制作',285:'サイト修正'} as Record<number,string>)[id],status:200,candidates:value.rows.length});return value.rows;}
   const r=await fetch('https://crowdworks.jp/public/jobs/category/'+id,{headers:{Accept:'text/html'},redirect:'manual',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
   if(!r.ok){diagnostics.push({source:({14:'ホームページ作成',16:'コーディング',20:'WordPress',15:'Webデザイン',17:'LP制作',285:'サイト修正'} as Record<number,string>)[id],status:r.status,candidates:0,reason:'募集元への接続エラー'});return []}const html=await r.text();if(html.length>1200000){diagnostics.push({source:({14:'ホームページ作成',16:'コーディング',20:'WordPress',15:'Webデザイン',17:'LP制作',285:'サイト修正'} as Record<number,string>)[id],status:r.status,candidates:0,reason:'本文サイズ超過'});return []}
   const rows=urlsFromOfficialListing(html);diagnostics.push({source:({14:'ホームページ作成',16:'コーディング',20:'WordPress',15:'Webデザイン',17:'LP制作',285:'サイト修正'} as Record<number,string>)[id],status:r.status,candidates:rows.length,reason:rows.length?undefined:'一覧から応募期限内の候補を読み取れない'});if(rows.length&&bucket){try{await bucket.put(key,JSON.stringify({rows,checkedAt:Date.now()}))}catch{}}return rows;
  }catch{diagnostics.push({source:({14:'ホームページ作成',16:'コーディング',20:'WordPress',15:'Webデザイン',17:'LP制作',285:'サイト修正'} as Record<number,string>)[id],status:null,candidates:0,reason:'募集元の応答を取得できない'});return []}
 }));
 const found=new Map<string,{url:string;published:number;title:string;description:string}>();for(const r of lists.flat())if(jobDetailUrl(r.url)&&!found.has(r.url))found.set(r.url,r);
 return [...found.values()].filter(j=>matchesFreelanceCategory(j,c.cat||'')).sort((a,b)=>b.published-a.published).slice(0,45).map(r=>r.url);
}
export async function verifyTavilyWebsiteResults(items:any[],bucket?:R2Bucket,signal?:AbortSignal,maxCandidates=60){
 const found=new Map<string,any>();const checks:{url:string;reason?:string}[]=[];
 const cap=Math.max(20,Math.min(80,maxCandidates));
 for(const item of items.slice(0,cap)){const url=jobDetailUrl(item.url);if(!url)checks.push({url:String(item.url||''),reason:'個別募集ページ以外'});else if(found.has(url))checks.push({url,reason:'重複した募集'});else found.set(url,item)}
 const direct=await verifyJobUrls([...found.keys()],bucket,false,[],signal);const jobs:WebsiteJob[]=[];
 const retryReasons=['募集元本文を取得できない','応募期限を確認できない','募集本文を読み取れない','募集情報を確認できない'];
 for(const check of direct.checks){const existing=direct.jobs.find(j=>j.url===check.url);if(existing){jobs.push(existing);continue}
  const item=found.get(check.url);
  if(retryReasons.includes(check.reason||'')&&typeof item?.raw_content==='string'&&item.raw_content.length>500){const parsed=parseWebsitePage(check.url,item.raw_content,Date.now(),String(item.title||''));if(parsed.job){jobs.push({...parsed.job,verification:'募集元本文・応募期限を確認（Tavily取得本文）'});continue}checks.push({url:check.url,reason:parsed.reason});}
  else checks.push(check);
 }
 const exclusionCounts:Record<string,number>={};for(const c of checks)if(c.reason)exclusionCounts[c.reason]=(exclusionCounts[c.reason]||0)+1;
 return {jobs,exclusionCounts,excluded:checks.filter(c=>c.reason).length,duplicatesExcluded:exclusionCounts['重複した募集']||0,nonDetailExcluded:exclusionCounts['個別募集ページ以外']||0,excludedUrls:checks.filter(c=>['応募期限切れ','募集終了・受付停止','対象職種の依頼ではない','Webサイト制作の依頼ではない'].includes(c.reason||'')).map(c=>c.url)};
}
