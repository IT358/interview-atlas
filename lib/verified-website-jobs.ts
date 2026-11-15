import {freelanceWork,projectProfessions,professions,normalizeProfessionCategory,projectExperience} from './professions';
import {jobCategories,matchesCategory,matchesKeywords,categoryMembers} from './job-categories';
import {matchesSkill} from './web-skills';
import {plain} from './job-normalize';
import type {SearchConditions} from './grounded-search';
export type WebsiteJob=Record<string,any>;
export function jobDetailUrl(value:string){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return '';const host=u.hostname.replace(/^www\./,'');if(host==='crowdworks.jp'&&/^\/public\/jobs\/\d+\/?$/.test(u.pathname)||host==='lancers.jp'&&/^\/work\/detail\/\d+\/?$/.test(u.pathname)||host==='coconala.com'&&/^\/requests\/\d+\/?$/.test(u.pathname)||host==='craudia.com'&&/^\/work_detail\/[a-z0-9]+\/?$/i.test(u.pathname)||host==='freelancer.com'&&/^\/projects\/[a-z0-9_/-]+$/i.test(u.pathname)){u.hostname=['lancers.jp','freelancer.com','craudia.com'].includes(host)?'www.'+host:host;u.pathname=u.pathname.replace(/\/$/,'');u.search='';u.hash='';return u.href}return ''}catch{return ''}}
function decode(s:string){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&amp;/g,'&')}
export function websiteWork(title:string,text:string){
 if(/記事(?:作成|執筆|入稿)|ライタ[ー－]|アンケート|インタビュー|動画編集|営業リスト|提案パートナー|紹介パートナー|営業提案|システム(?:の)?(?:構築|開発)|営業(?:パートナー|代行|担当|スタッフ|メンバー)|アポインター|アポ獲得|テレアポ|成約リターン|顧客紹介|データ入力|Webアプリ|スマホアプリ|iOS|Android|バックエンド|software engineer|\b(?:mobile|android|ios|application|app|platform|system|dashboard|software|scraper|sales|leads|data entry|article|logo|video)\b/i.test(title))return false;
 return /ホームページ|HP\s*(?:制作|作成|改修|修正|更新|リニューアル)|Web.?サイト|ウェブサイト|コーポレートサイト|サイト(?:制作|作成|構築|改修|修正|更新|リニューアル|運用|保守)|WordPress|Shopify|LP(?:制作|デザイン|コーディング)|ランディングページ|コーディング|(?:Web|ウェブ)\s*(?:制作|デザイン)|商品ページ(?:制作|作成|デザイン|更新)|楽天.{0,12}(?:ページ|制作)|EC.{0,12}(?:運営|デザイン|制作|構築)|website|web[ -]?(?:design|development)|landing[ -]?page|woocommerce|webflow|html|css/i.test(title)&&/(?:依頼|お願い|募集|作業|制作|構築|納品|deliver|project|need|looking for|build|develop|design)/i.test(text);
}
export function parseWebsitePage(url:string,html:string,now=Date.now(),sourceTitle=''):{job?:WebsiteJob;reason?:string}{
 const canonical=jobDetailUrl(url);if(!canonical)return {reason:'個別募集ページ以外'};
 if(new URL(canonical).hostname==='coconala.com')return parseCoconalaPage(canonical,html,now);
 if(new URL(canonical).hostname.replace(/^www\./,'')==='craudia.com')return parseCraudiaPage(canonical,html,now);
 const h1=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
 const title=plain(decode((h1||html.split('\n').find(x=>/^\s*#\s/.test(x))||sourceTitle||'').replace(/<span\b[^>]*class=["'][^"']*subtitle[^"']*["'][^>]*>[\s\S]*?<\/span>/gi,''))).replace(/^#\s*/,'').replace(/のお仕事.*$/,'').trim();
 const main=html.includes('<h1')?html.slice(html.indexOf('<h1')):html;
 const text=plain(decode(main.replace(/\*{1,2}|`/g,'').split(/クライアント情報|最近応募したクラウドワーカー|関連する仕事|おすすめの仕事/)[0]));
 const statusText=text.split(/仕事の詳細|依頼詳細|依頼内容/)[0];
 if(/(?:募集|受付|応募)(?:は|を|が)?(?:終了(?!日時|日|予定)|締め切りました|締切済|停止)|この仕事の募集は終了|選定中|募集期間終了/.test(statusText))return {reason:'募集終了・受付停止'};

 let schema:any=null;for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const data=JSON.parse(m[1]);const list=Array.isArray(data)?data:data['@graph']||[data];schema=list.find((v:any)=>v['@type']==='JobPosting')||schema}catch{}}
 const date=text.match(/(?:応募期限|募集締切|募集終了日時|締切日時|提案締切)\s*[|：:]?\s*(\d{4})[年\/-]\s*(\d{1,2})[月\/-]\s*(\d{1,2})日?/);
 const day=date?`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`:String(schema?.validThrough||'').slice(0,10);
 const deadlineAt=/^\d{4}-\d{2}-\d{2}$/.test(day)?Date.parse(day+'T23:59:59+09:00'):NaN;
 if(!Number.isFinite(deadlineAt))return {reason:'応募期限を確認できない'};
 if(deadlineAt<now)return {reason:'応募期限切れ'};
 const details=plain(decode(schema?.description||text.split(/仕事の詳細|依頼詳細|依頼内容/)[1]||''));
 if(details.length<80)return {reason:'募集本文を読み取れない'};
 if(!freelanceWork(title,details))return {reason:'対象職種の依頼ではない'};
 if(!/仕事の依頼|仕事の概要|JobPosting|プロジェクト/.test(html))return {reason:'募集情報を確認できない'};
 const summary=text.split('仕事の詳細')[0];
 const pay=summary.match(/(固定報酬制|時間単価制)\s*[|：:]?\s*([^]+?)(?:納品希望日|稼働時間|掲載日|期間)/)?.[2]?.trim()||'記載なし・要相談';
 const money=[...pay.matchAll(/([\d,.]+)\s*円/g)].map(m=>Number(m[1].replace(/,/g,''))).filter(n=>n>0);
 const period=/文字単価/.test(pay)?'character':/時間単価制/.test(summary)?'hourly':'fixed';
 const minSalary=/^[〜～~]/.test(pay)?null:money[0]||null,maxSalary=money.length>1?money[1]:money[0]||null;
 const skills=['HTML','CSS','SCSS','JavaScript','PHP','WordPress','Figma','Shopify','STUDIO','Wix','React','Next.js'].filter(s=>new RegExp(s.replace('.','\\.'),'i').test(title+' '+details));
 const cats=[...new Set([...jobCategories({title,description:details}),...projectProfessions(title,details).map(p=>p.category)])];
 return {job:{id:canonical,url:canonical,title,company:String(schema?.hiringOrganization?.name||plain(html.match(/<span[^>]*class=["']client_name["'][^>]*>([\s\S]*?)<\/span>/i)?.[1])||'発注者は募集元で確認'),source:new URL(canonical).hostname.includes('crowdworks')?'クラウドワークス':'ランサーズ',market:'日本',eligibilityNote:/学生限定/.test(title)?'学生限定（詳しい応募資格は募集元で確認）':details.match(/現役大学生.{0,25}(?:限定|募集|の方)|(?:大学生|大学院生).{0,15}限定/)?.[0]||'',country:'日本',contract:'業務委託',category:cats[0]||'Web制作全般',categories:cats,skills,description:details.slice(0,260)+'…（募集元で全文を確認）',searchText:details.slice(0,20000),salaryText:pay,currency:'JPY',minSalary,maxSalary,period,deadline:day,expires:deadlineAt,published:Date.parse(String(schema?.datePosted||''))||0,checkedAt:now,verifiedAt:now,verification:'個別募集ページ・依頼本文・応募期限を確認',verificationEvidence:'応募期限 '+day+' / '+(schema?'募集元の構造化データあり':'募集元本文を確認'),experience:projectExperience(title,details),speaking:'記載なし',remote:/完全在宅|フルリモート/.test(details),status:'本文確認・応募期限内',locationEvidence:'日本国内のプラットフォーム。海外在住での応募可否は募集元で確認。'}};
}
export function liveWebsiteJob(j:WebsiteJob,now=Date.now()){return !!jobDetailUrl(j.url)&&j.verifiedAt>now-24*3600000&&((Number(j.expires)>now)||(j.source==='Freelancer.com'&&j.recruitmentState==='active'))&&freelanceWork(j.title,j.searchText||j.description)}
export function matchesFreelanceCategory(j:WebsiteJob,cat:string){
 if(!cat)return true;const normalized=normalizeProfessionCategory(cat),members=categoryMembers(normalized);if(normalized==='Web制作全般')return websiteWork(j.title||'',j.searchText||j.description||'')&&freelanceWork(j.title||'',j.searchText||j.description||'');const desired=professions.filter(p=>members.includes(p.category));
 const actual=projectProfessions(j.title||'',j.searchText||j.description||'');
 if(desired.length)return actual.some(p=>desired.some(want=>want.id===p.id));
 return matchesCategory({...j,description:j.searchText||j.description},normalized);
}
export function filterWebsiteJobs(jobs:WebsiteJob[],c:Partial<SearchConditions>,opts?:{allowStale?:boolean}){
 const alive=(j:WebsiteJob)=>opts?.allowStale?!!jobDetailUrl(j.url)&&((Number(j.expires)>Date.now())||(j.source==='Freelancer.com'&&j.recruitmentState==='active')):liveWebsiteJob(j);
 return jobs.filter(j=>alive(j)&&matchesKeywords({...j,description:j.searchText||j.description},c.q||'')&&matchesFreelanceCategory(j,c.cat||'')&&matchesSkill(j,c.skill||'')&&(!c.exp||j.experience===c.exp)&&(!c.call||j.speaking===c.call)&&(!c.period||j.period===c.period)&&(!c.minimum||j.currency==='JPY'&&Number(j.minSalary)>=Number(c.minimum))&&(!c.work||j.remote===true)&&(!c.source||j.source===c.source)&&(!c.market||j.market===c.market)).sort((a,b)=>c.sort==='deadline'?(a.expires||Infinity)-(b.expires||Infinity):c.sort==='salary'?(a.currency||'').localeCompare(b.currency||'')||(a.period||'').localeCompare(b.period||'')||(b.minSalary||0)-(a.minSalary||0):(b.published||0)-(a.published||0))
}
export async function fetchWebsiteJob(url:string,bucket?:R2Bucket,force=false,fallback?:WebsiteJob,signal?:AbortSignal):Promise<{job?:WebsiteJob;reason?:string}>{
 const valid=jobDetailUrl(url);if(!valid)return {reason:'個別募集ページ以外'};
 const cacheKey='verified-freelance-jobs/v5/'+new URL(valid).hostname+'/'+new URL(valid).pathname.split('/').filter(Boolean).at(-1)+'.json';
 let previous:any=null;if(bucket){try{const obj=await bucket.get(cacheKey);if(obj)previous=await obj.json()}catch{}}
 if(!force&&previous?.checkedAt>Date.now()-3*3600000)return previous.result;
 if(!force&&!previous&&fallback&&fallback.verifiedAt>Date.now()-3*3600000&&liveWebsiteJob(fallback))return {job:fallback};
 try{
  const r=await fetch(valid,{redirect:'manual',headers:{Accept:'text/html'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(9000)]):AbortSignal.timeout(9000)});
  if(!r.ok||!r.headers.get('content-type')?.includes('text/html'))throw Error('募集元へ接続できない');
  const reader=r.body?.getReader();if(!reader)throw Error('Empty');const chunks:Uint8Array[]=[];let bytes=0;while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>(new URL(valid).hostname==='coconala.com'?2000000:1200000)){await reader.cancel();throw Error('本文が長すぎる')}chunks.push(value)}
  const merged=new Uint8Array(bytes);let p=0;for(const x of chunks){merged.set(x,p);p+=x.length}
  const result=parseWebsitePage(valid,new TextDecoder().decode(merged));if(bucket){try{await bucket.put(cacheKey,JSON.stringify({checkedAt:Date.now(),result}))}catch{}}return result;
 }catch{if(previous?.result?.job&&liveWebsiteJob(previous.result.job))return {job:{...previous.result.job,verification:'前回の本文確認を利用（今回の接続は未確認）'}};if(!previous&&fallback&&liveWebsiteJob(fallback))return {job:{...fallback,verification:'前回の本文確認を利用（今回の接続は未確認）'}};return {reason:'募集元本文を取得できない'}}
}
export async function verifyJobUrls(urls:string[],bucket?:R2Bucket,force=false,fallbacks:WebsiteJob[]=[],signal?:AbortSignal){const results:{job?:WebsiteJob;reason?:string}[]=[];let index=0;await Promise.all(Array.from({length:5},async()=>{while(index<urls.length){const i=index++;results[i]=await fetchWebsiteJob(urls[i],bucket,force,fallbacks.find(j=>j.url===urls[i]),signal)}}));return {jobs:results.flatMap(r=>r.job?[r.job]:[]),checks:results.map((r,i)=>({url:urls[i],reason:r.reason})),excluded:results.filter(r=>!r.job).length,reasons:results.filter(r=>r.reason).map(r=>r.reason)}}

function parseCraudiaPage(url:string,html:string,now:number):{job?:WebsiteJob;reason?:string}{
 const title=plain(decode(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'')).replace(/（[a-z0-9]+）\s*$/i,'').trim();
 const deadlineHtml=plain(decode(html.match(/<td\b[^>]*class=["'][^"']*project_deadline[^"']*["'][^>]*>([\s\S]*?)<\/td>/i)?.[1]||''));
 if(/募集終了/.test(deadlineHtml)||/募集終了/.test(plain(decode(html)).slice(0,2500)))return {reason:'募集終了・受付停止'};
 const date=deadlineHtml.match(/（\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日まで\s*）/)||plain(decode(html)).match(/募集期間[^\n]{0,80}?(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日まで/);
 const day=date?`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`:'';const expires=Date.parse(day+'T23:59:59+09:00');
 if(!Number.isFinite(expires))return {reason:'応募期限を確認できない'};if(expires<now)return {reason:'応募期限切れ'};
 const details=plain(decode(divContent(html,'project_detail_content')));
 if(details.length<80)return {reason:'募集本文を読み取れない'};if(!freelanceWork(title,details))return {reason:'対象職種の依頼ではない'};
 const salaryText=plain(decode(divContent(html,'project_budget')))||'掲載元で確認';const nums=[...salaryText.matchAll(/([\d,.]+)\s*円/g)].map(m=>Number(m[1].replace(/,/g,''))).filter(n=>n>0);
 const period=/時間制|時給|想定時給/.test(salaryText+' '+deadlineHtml)?'hourly':'fixed';
 const categories=[...new Set([...jobCategories({title,description:details}),...projectProfessions(title,details).map(p=>p.category)])];
 const updated=plain(decode(html)).match(/更新日[：:]\s*(\d{1,2})月\s*(\d{1,2})日/);
 const published=updated?Date.parse(`${new Date().getFullYear()}-${updated[1].padStart(2,'0')}-${updated[2].padStart(2,'0')}T00:00:00+09:00`):0;
 return {job:{id:url,url,title,company:'発注者は募集元で確認',source:'クラウディア',market:'日本',country:'発注者の国は未確認',contract:'業務委託',category:categories[0]||'Web制作全般',categories,skills:['HTML','CSS','JavaScript','WordPress','PHP','Figma','Shopify','STUDIO','Wix','React','Next.js'].filter(s=>new RegExp(s.replace('.','\\.'),'i').test(details+' '+title)),description:details.slice(0,400)+'…（募集元で全文を確認）',searchText:details.slice(0,20000),eligibilityNote:/学生限定/.test(title)?'学生限定（詳しい応募資格は募集元で確認）':details.match(/現役大学生.{0,25}(?:限定|募集|の方)|(?:大学生|大学院生).{0,15}限定/)?.[0]||'',salaryText,currency:'JPY',minSalary:nums[0]||null,maxSalary:nums.at(-1)||null,period,deadline:day,expires,published:Number.isFinite(published)?published:0,checkedAt:now,verifiedAt:now,verification:'個別募集ページ・依頼本文・応募期限を確認',verificationEvidence:'クラウディア公開募集 / 応募期限 '+day,experience:projectExperience(title,details),speaking:'記載なし',remote:/在宅|リモート/.test(title+' '+details),status:'本文確認・応募期限内'}};
}
function parseCoconalaPage(url:string,html:string,now:number):{job?:WebsiteJob;reason?:string}{
 const title=plain(decode(html.match(/<h1\b[^>]*class=["'][^"']*c-requestTitle_heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''));
 const content=divContent(html,'c-detailRowContentText');
 const details=plain(decode(content));const text=plain(decode(html.replace(/<script[\s\S]*?<\/script>/gi,'').split('この募集内容に似ている仕事')[0]));
 const date=text.match(/締切日\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);const day=date?date[1]+'-'+date[2].padStart(2,'0')+'-'+date[3].padStart(2,'0'):'';const expires=Date.parse(day+'T23:59:59+09:00');
 if(!Number.isFinite(expires))return {reason:'応募期限を確認できない'};if(expires<now)return {reason:'応募期限切れ'};
 if(/募集終了|募集は終了|受付終了/.test(text.slice(0,2500))||!/>\s*応募する\s*</.test(html))return {reason:'募集終了・受付停止'};
 if(details.length<80)return {reason:'募集本文を読み取れない'};if(!freelanceWork(title,details))return {reason:'対象職種の依頼ではない'};
 const salaryText=plain(divContent(html,'d-requestBudget'))||'掲載元で確認';const nums=[...salaryText.matchAll(/([\d,.]+)\s*(万)?\s*円/g)].map(m=>Number(m[1].replace(/,/g,''))*(m[2]?10000:1));
 const categories=[...new Set([...jobCategories({title,description:details}),...projectProfessions(title,details).map(p=>p.category)])];const posted=text.match(/掲載日\s*(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
 return {job:{id:url,url,title,company:'発注者は募集元で確認',source:'ココナラ',market:'日本',country:'発注者の国は未確認',contract:'業務委託',category:categories[0],categories,skills:['HTML','CSS','JavaScript','WordPress','PHP','Figma','Shopify','STUDIO','Wix'].filter(s=>new RegExp(s,'i').test(details+' '+title)),description:details.slice(0,400)+'…（募集元で全文を確認）',searchText:details.slice(0,20000),eligibilityNote:/学生限定/.test(title)?'学生限定（詳しい応募資格は募集元で確認）':details.match(/現役大学生.{0,25}(?:限定|募集|の方)|(?:大学生|大学院生).{0,15}限定/)?.[0]||'',salaryText,currency:'JPY',minSalary:nums[0]||null,maxSalary:nums.at(-1)||null,period:'fixed',deadline:day,expires,published:posted?Date.parse(posted[1]+'-'+posted[2].padStart(2,'0')+'-'+posted[3].padStart(2,'0')+'T00:00:00+09:00'):0,checkedAt:now,verifiedAt:now,verification:'個別募集ページ・依頼本文・応募期限を確認',verificationEvidence:'ココナラ公開募集 / 締切日 '+day,experience:projectExperience(title,details),speaking:'記載なし',remote:false,status:'本文確認・応募期限内'}};
}

function divContent(html:string,name:string){
 const pattern=new RegExp('<div\\b[^>]*class=["\'][^"\']*'+name+'[^"\']*["\'][^>]*>','i');const opening=pattern.exec(html);if(!opening)return '';const start=opening.index+opening[0].length;const tags=/<\/?div\b[^>]*>/gi;tags.lastIndex=start;let depth=1;let token:RegExpExecArray|null;while((token=tags.exec(html))){depth+=token[0].startsWith('</')?-1:1;if(depth===0)return html.slice(start,token.index)}return '';
}
