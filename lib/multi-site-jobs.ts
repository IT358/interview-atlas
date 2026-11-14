import {professions,professionFamilies,professionForCategory} from './professions';
import {discoverOfficialWebsiteUrls} from './website-job-search';
import {fetchFreelancerProjects} from './freelancer-projects';
import {filterWebsiteJobs,jobDetailUrl,verifyJobUrls,type WebsiteJob} from './verified-website-jobs';
import type {SearchConditions} from './grounded-search';
export type SourceCheck={source:string;status:number|null;candidates:number;verified?:number;reason?:string};
export function coconalaCategories(cat:string){
 if(!cat)return [];
 const exact=professionForCategory(cat);if(exact)return exact.coco;
 const family=professionFamilies.find(f=>f.category===cat);
 return family?[...new Set(professions.filter(p=>p.family===family.id).flatMap(p=>p.coco))].slice(0,3):[22];
}
export function craudiaCategories(cat:string){
 if(!cat)return [302,303,304,305,314,322];
 const exact=professionForCategory(cat);
 if(exact){
  if(exact.category.includes('WordPress'))return [314];
  if(exact.category.includes('LP'))return [305];
  if(exact.category.includes('HTML')||exact.category.includes('コーディング'))return [304];
  if(exact.category.includes('デザイン'))return [303];
  if(exact.category.includes('修正')||exact.category.includes('運用'))return [322];
  if(exact.family==='web'||exact.category.includes('サイト')||exact.category.includes('Web'))return [302,303,304,305,314,322];
 }
 const family=professionFamilies.find(f=>f.category===cat);
 if(family?.id==='web'||cat.includes('Web制作'))return [302,303,304,305,314,322];
 if(family?.id==='design')return [303,305];
 return [302,303,304,305,314,322];
}
async function craudiaUrls(c:Partial<SearchConditions>,bucket?:R2Bucket,signal?:AbortSignal){
 const ids=craudiaCategories(c.cat||'');
 const pages=await Promise.all(ids.map(async id=>{
  const key='craudia-profession-discovery/v1/'+id+'.json';
  try{const obj=bucket?await bucket.get(key):null;const d:any=obj?await obj.json():null;if(d?.checkedAt>Date.now()-15*60000&&Array.isArray(d.urls))return d.urls as string[]}catch{}
  const r=await fetch('https://www.craudia.com/work_list/category2/'+id+'?s_accepting=1',{redirect:'manual',headers:{Accept:'text/html','User-Agent':'Mozilla/5.0'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
  if(!r.ok)throw Error('クラウディアの募集一覧に接続できませんでした。');const html=await r.text();if(html.length>2000000)throw Error('募集一覧のサイズ超過');
  const found=[...new Set([...html.matchAll(/href=["'](?:https:\/\/(?:www\.)?craudia\.com)?(\/work_detail\/[a-z0-9]+)["']/gi)].map(m=>jobDetailUrl('https://www.craudia.com'+m[1])).filter(Boolean))].slice(0,12);
  if(bucket&&found.length){try{await bucket.put(key,JSON.stringify({checkedAt:Date.now(),urls:found}))}catch{}}return found;
 }));
 return [...new Set(pages.flat())].slice(0,24);
}
async function coconalaUrls(c:Partial<SearchConditions>,bucket?:R2Bucket,signal?:AbortSignal){
 const ids=coconalaCategories(c.cat||'');
 const pages=ids.length?ids:[0];
 const urls=await Promise.all(pages.map(async id=>{
 const key='coconala-profession-discovery/v2/'+id+'.json';
 try{const obj=bucket?await bucket.get(key):null;const d:any=obj?await obj.json():null;if(d?.checkedAt>Date.now()-15*60000&&Array.isArray(d.urls))return d.urls as string[]}catch{}
 const r=await fetch(id?'https://coconala.com/requests/categories/'+id+'?recruiting=true':'https://coconala.com/requests?recruiting=true',{redirect:'manual',headers:{Accept:'text/html'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(12000)]):AbortSignal.timeout(12000)});
 if(!r.ok)throw Error('ココナラの募集一覧に接続できませんでした。');const html=await r.text();if(html.length>2000000)throw Error('募集一覧のサイズ超過');
 const found=[...new Set([...html.matchAll(/href=["'](?:https:\/\/coconala\.com)?(\/requests\/\d+)["']/g)].map(m=>jobDetailUrl('https://coconala.com'+m[1])).filter(Boolean))].slice(0,12);
 if(bucket&&found.length){try{await bucket.put(key,JSON.stringify({checkedAt:Date.now(),urls:found}))}catch{}}return found;
 }));return [...new Set(urls.flat())].slice(0,20);
}
export function balancedJobs(groups:WebsiteJob[][],c:Partial<SearchConditions>,target=30){
 const filtered=groups.map(rows=>filterWebsiteJobs(rows,c));const found=new Map<string,WebsiteJob>();let i=0;
 while(found.size<target&&filtered.some(rows=>rows.length>i)){for(const rows of filtered){const j=rows[i];if(j&&!found.has(j.url)&&found.size<target)found.set(j.url,j)}i++}
 return filterWebsiteJobs([...found.values()],c);
}
export async function collectWebsiteJobs(c:Partial<SearchConditions>,bucket?:R2Bucket,signal?:AbortSignal,seeds:WebsiteJob[]=[],target=30,force=false){
 const checks:SourceCheck[]=[],tasks:Promise<WebsiteJob[]>[]=[];const excludedUrls=new Set<string>();let scanned=0;
 const recordExclusions=(r:{checks:{url:string;reason?:string}[]})=>{for(const check of r.checks)if(['応募期限切れ','募集終了・受付停止','対象職種の依頼ではない','Webサイト制作の依頼ではない'].includes(check.reason||''))excludedUrls.add(check.url)};
 const allowed=(name:string,market:string)=>(!c.source||c.source===name)&&(!c.market||c.market===market);
 if(allowed('クラウドワークス','日本'))tasks.push((async()=>{try{const urls=await discoverOfficialWebsiteUrls(c,bucket,signal);scanned+=urls.length;const r=await verifyJobUrls(urls,bucket,force,seeds,signal);recordExclusions(r);checks.push({source:'クラウドワークス',status:200,candidates:urls.length,verified:r.jobs.length,reason:r.jobs.length?undefined:'条件に合う個別募集を確認できない'});return r.jobs}catch{checks.push({source:'クラウドワークス',status:null,candidates:0,reason:'募集元に接続できない'});return []}})());
 if(allowed('ココナラ','日本'))tasks.push((async()=>{try{const urls=await coconalaUrls(c,bucket,signal);scanned+=urls.length;const r=await verifyJobUrls(urls,bucket,force,seeds,signal);recordExclusions(r);checks.push({source:'ココナラ',status:200,candidates:urls.length,verified:r.jobs.length,reason:r.jobs.length?undefined:'条件に合う個別募集を確認できない'});return r.jobs}catch{checks.push({source:'ココナラ',status:null,candidates:0,reason:'募集元に接続できない'});return []}})());
 if(allowed('クラウディア','日本'))tasks.push((async()=>{try{const urls=await craudiaUrls(c,bucket,signal);scanned+=urls.length;const r=await verifyJobUrls(urls,bucket,force,seeds,signal);recordExclusions(r);checks.push({source:'クラウディア',status:200,candidates:urls.length,verified:r.jobs.length,reason:r.jobs.length?undefined:'条件に合う個別募集を確認できない'});return r.jobs}catch{checks.push({source:'クラウディア',status:null,candidates:0,reason:'募集元に接続できない'});return []}})());
 if(allowed('Freelancer.com','海外'))tasks.push((async()=>{try{const r=await fetchFreelancerProjects(bucket,signal,c);scanned+=r.scanned;checks.push({source:'Freelancer.com',status:200,candidates:r.scanned,verified:r.jobs.length});return r.jobs}catch{checks.push({source:'Freelancer.com',status:null,candidates:0,reason:'公式APIに接続できない'});return []}})());
 const groups=await Promise.all(tasks);let jobs=balancedJobs(groups,c,target),catalogFallback=false;
 if(jobs.length<target){
  const candidates=filterWebsiteJobs(seeds,c).filter(j=>!excludedUrls.has(j.url)&&!jobs.some(v=>v.url===j.url)).slice(0,30);
  if(candidates.length){const verified=await verifyJobUrls(candidates.map(j=>j.url),bucket,false,candidates,signal);recordExclusions(verified);const previous=verified.jobs.filter(j=>!excludedUrls.has(j.url)).map(j=>({...j,verification:'前回の本文確認を利用（今回の接続は未確認）'}));if(previous.length){jobs=balancedJobs([jobs,previous],c,target);catalogFallback=true}}
 }

 return {jobs,scanned,excludedUrls:[...excludedUrls],discoveryChecks:checks,checkedAt:Date.now(),credits:0,catalogFallback,target,source:catalogFallback?'複数サイト検索（直近の本文確認結果を補完）':'複数サイトの個別募集・公式APIを確認',sourceCounts:Object.fromEntries([...new Set(jobs.map(j=>j.source))].map(source=>[source,jobs.filter(j=>j.source===source).length]))};
}
