import {websiteWork,jobDetailUrl,type WebsiteJob} from './verified-website-jobs';
import {freelanceWork,projectProfessions,professionForCategory,professionFamilies} from './professions';
import type {SearchConditions} from './grounded-search';
import {categorySearchTerm} from './job-categories';
import {jobCategories} from './job-categories';
import {conditions,plain} from './job-normalize';
export function freelancerProjects(data:any,now=Date.now()):WebsiteJob[]{
 if(data?.status!=='success'||!Array.isArray(data.result?.projects))return [];
 return data.result.projects.flatMap((p:any)=>{
  if(!['fixed','hourly'].includes(p.type)||p.status!=='active'||p.frontend_project_status!=='open'||p.deleted||p.nonpublic||p.hireme||p.upgrades?.fulltime||p.upgrades?.nonpublic||p.service_offering_id||!Number.isSafeInteger(p.id))return [];
  const title=plain(p.title),description=plain(p.description),seo=String(p.seo_url||'');
  if(!freelanceWork(title,description)||description.length<80||!/^[a-zA-Z0-9_/-]+$/.test(seo)||seo.includes('..'))return [];
  const url=jobDetailUrl('https://www.freelancer.com/projects/'+seo);if(!url)return [];
  const skillNames=(p.jobs||[]).map((j:any)=>String(j.name||'')).filter(Boolean).slice(0,25),eligibility=conditions(description);
  const money=(n:any)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?n:null;
  const minSalary=money(p.budget?.minimum),maxSalary=money(p.budget?.maximum),currency=/^[A-Z]{3}$/.test(p.currency?.code)?p.currency.code:'通貨未確認';
  const salaryText=minSalary!==null?`${currency} ${minSalary.toLocaleString('ja-JP')}${maxSalary!==null&&maxSalary!==minSalary?'〜'+maxSalary.toLocaleString('ja-JP'):''}`:'報酬は掲載元で確認';
  const categories=[...new Set([...jobCategories({title,description}),...projectProfessions(title,description).map(p=>p.category)])];
  return [{id:url,url,title,company:'発注者は募集元で確認',source:'Freelancer.com',sourceId:String(p.id),market:'海外',country:'発注者の国は未確認',contract:'業務委託',category:categories[0],categories,skills:skillNames,description:description.slice(0,400)+'…（募集元で全文を確認）',searchText:description.slice(0,20000),salaryText,currency,minSalary,maxSalary,period:p.type==='hourly'?'hourly':'fixed',deadline:null,expires:null,recruitmentState:'active',availabilityEvidence:'Freelancer公式API: active / open',published:Number(p.submitdate||p.time_submitted||0)*1000,checkedAt:now,verifiedAt:now,verification:'公式API・依頼本文・応募受付中を確認',verificationEvidence:'公式APIで公開募集と受付中を確認。bidperiodから応募期限は推測しません。',experience:eligibility.experience,speaking:eligibility.speaking,remote:false,status:'公式APIで応募受付中',locationEvidence:'応募可能な居住地・通話条件は募集元で確認してください。'}];
 });
}
export async function fetchFreelancerProjects(bucket?:R2Bucket,signal?:AbortSignal,c:Partial<SearchConditions>={}){
 const broad:Record<string,string>={web:'website',dev:'developer',ai:'AI',design:'design',content:'writing',growth:'marketing',data:'data'};
 const family=professionFamilies.find(f=>f.category===c.cat);const query=professionForCategory(c.cat||'')?.en||(family?broad[family.id]:c.cat?categorySearchTerm(c.cat,true):'');
 const key='freelancer-profession-projects/v2/'+encodeURIComponent((query||'all').slice(0,180))+'.json';
 try{const cached=bucket?await bucket.get(key):null;const d:any=cached?await cached.json():null;if(d?.checkedAt>Date.now()-15*60000&&Array.isArray(d.jobs))return {jobs:d.jobs,scanned:d.scanned,cached:true}}catch{}
 const r=await fetch('https://www.freelancer.com/api/projects/0.1/projects/active/?query='+encodeURIComponent(query)+'&limit=100&offset=0&full_description=true&job_details=true',{headers:{Accept:'application/json'},redirect:'manual',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Freelancer.comの公式APIに接続できませんでした。');const data:any=await r.json();const jobs=freelancerProjects(data),scanned=Array.isArray(data.result?.projects)?data.result.projects.length:0;
 if(!Array.isArray(data.result?.projects))throw Error('Freelancer.comの応答形式を確認できませんでした。');
 if(bucket){try{await bucket.put(key,JSON.stringify({checkedAt:Date.now(),jobs,scanned}))}catch{}}
 return {jobs,scanned,cached:false};
}
