import {plain,category,safeUrl,development} from './job-normalize';
export const JAPAN_SOURCE='ZOOA（日本）';
export function parseJapanPage(html:string,now=Date.now()){
 const jobs:any[]=[];
 for(const match of html.matchAll(/<a\s+class="jb-card"\s+href="(\/jobs\/[a-z0-9]+)"[^>]*>([\s\S]*?)<\/a>/g)){
  const card=match[2],title=plain(card.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);if(!development(title))continue;
  const url=safeUrl('https://freelance.zooa.co.jp'+match[1],['freelance.zooa.co.jp']);if(!url)continue;
  const skills=[...card.matchAll(/<span class="jb-tag">([\s\S]*?)<\/span>/g)].map(m=>plain(m[1]));
  const location=plain(card.match(/<span>勤務地<\/span>\s*<strong>([\s\S]*?)<\/strong>/)?.[1])||'記載なし';
  const pay=plain(card.match(/<span>単価<\/span>\s*<strong>([\s\S]*?)<\/strong>/)?.[1])||'応相談';
  const upper=pay.match(/^[〜～~]\s*(\d+(?:\.\d+)?)万円\/月/),lower=pay.match(/^(\d+(?:\.\d+)?)万円[〜～~]\/月/);
  jobs.push({id:url,url,source:JAPAN_SOURCE,market:'日本',title,company:'発注企業は掲載元で確認',description:'公開一覧の基本情報のみ取得。募集文・必須経験・契約条件は掲載元で確認してください。',category:category(title+' '+skills.join(' ')),contract:'業務委託',country:'記載なし',residence:'記載なし',workplace:location,worldwide:false,remote:location.includes('リモート')||location.includes('テレワーク'),experience:'記載なし',speaking:'記載なし',english:'未確認',skills,currency:'JPY',minSalary:lower?Number(lower[1])*10000:null,maxSalary:upper?Number(upper[1])*10000:null,salaryText:pay,period:'monthly',published:0,checkedAt:now,expires:now+26*3600000,deadlineUnknown:true,status:'掲載中（公開一覧・応募要確認）'});
 }
 return jobs;
}
export async function fetchJapanJobs(now:number){
 const pages=await Promise.all([1,2,3].map(async page=>{const r=await fetch('https://freelance.zooa.co.jp/jobs'+(page>1?'?page='+page:''),{headers:{Accept:'text/html'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('日本の掲載元 HTTP '+r.status);const html=await r.text();if(!html.includes('jb-card'))throw Error('公開一覧の形式が変わりました');return {jobs:parseJapanPage(html,now),fetched:[...html.matchAll(/class="jb-card"/g)].length};}));
 const jobs=[...new Map(pages.flatMap(p=>p.jobs).map(j=>[j.id,j])).values()];if(!jobs.length)throw Error('開発案件を取得できませんでした');
 return {jobs,fetched:pages.reduce((n,p)=>n+p.fetched,0),pages:pages.length};
}
