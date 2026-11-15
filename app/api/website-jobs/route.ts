import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../lib/tavily-allowance';
import {TavilyTestError,tavilyResponseError} from '../../../lib/tavily-test';
import {env} from 'cloudflare:workers';
import seeds from '../../../data/researched-website-jobs.json';
import {boundedJson,BodyLimitError} from '../../../lib/request-body';
import {emptySearch} from '../../../lib/grounded-search';
import {verifyJobUrls,filterWebsiteJobs,jobDetailUrl} from '../../../lib/verified-website-jobs';
import {getChatGPTUser} from '../../chatgpt-auth';
import {readSettings,vaultOwner} from '../../../lib/key-vault';
import {collectWebsiteJobs} from '../../../lib/multi-site-jobs';
import {websiteSearchPlans,verifyTavilyWebsiteResults} from '../../../lib/website-job-search';
import {combineRequestStats} from '../../../lib/website-job-session';
export const dynamic='force-dynamic';
const reply=(d:any,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
/** Max jobs shown in one response batch; remainder goes to overflow (display cap only). */
const BATCH_TARGET=100;
type PlanDiag={sourceFocus:string;label:string;query:string;include_domains:string[];tavilyReturned:number;detailCandidates:number;detailVerified:number;filterMismatched:number;duplicates:number;credits:number};
function parseExclude(raw:unknown){
 if(Array.isArray(raw))return raw.map(u=>jobDetailUrl(String(u||''))).filter(Boolean).slice(0,1000);
 if(typeof raw==='string'&&raw)return raw.split(',').map(u=>jobDetailUrl(u.trim())).filter(Boolean).slice(0,1000);
 return [] as string[];
}
export async function GET(req:Request){
 try{const params=new URL(req.url).searchParams;const fresh=params.get('refresh')==='1';
  if(params.get('discover')==='1'){
   const c={...emptySearch};for(const k of Object.keys(c) as (keyof typeof c)[])c[k]=(params.get(k)||'').slice(0,300);
   const excludeUrls=parseExclude(params.get('exclude')||'');
   const result=await collectWebsiteJobs(c,undefined,AbortSignal.timeout(55000),seeds,BATCH_TARGET,fresh,excludeUrls);
   return reply({
    ...result,
    jobs:result.jobs,
    overflow:result.overflow,
    duplicatesExcluded:result.duplicatesExcluded,
    filterMismatched:result.filterMismatched,
    stats:{
     scanned:result.scanned,
     verified:result.verified,
     matched:result.matched,
     displayed:result.displayed,
     deferred:result.deferred,
     duplicatesExcluded:result.duplicatesExcluded,
     filterMismatched:result.filterMismatched,
     credits:0,
    },
   });
  }
  const requested={market:params.get('market')||'',cat:params.get('cat')||'Web制作全般'};const selected=filterWebsiteJobs(seeds,requested).slice(0,30);const result=await verifyJobUrls(selected.map(j=>j.url),undefined,fresh,selected);result.jobs=filterWebsiteJobs(result.jobs,requested);return reply({...result,checkedAt:Date.now(),source:fresh?'募集元を再確認':'調査済みの個別募集ページ',stale:result.jobs.length===0});
 }catch{return reply({error:'確認済み案件を取得できませんでした。'},503)}
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 let permit:TavilyPermit|undefined;
 try{const data=await boundedJson(req,16000);if(data.initiated!==true&&data.confirmed!==true)return reply({error:'検索ボタンを押してから実行してください。'},400);const user=await getChatGPTUser();const id=await vaultOwner(req,user?.userId);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;
 const saved=secret&&env.DB?await readSettings(env.DB,{...id,owner:'tavily:'+id.owner},secret):null;if(!saved?.key||!saved.consent)return reply({error:'設定・連携でTavilyキーを保存してください。調査済み案件はキーなしで見られます。'},400);
 const conditions={...emptySearch};for(const k of Object.keys(conditions) as (keyof typeof conditions)[])conditions[k]=String(data.conditions?.[k]||'').slice(0,300);
 if(conditions.market==='海外')return reply({error:'海外案件はAPIキー不要の複数サイト検索で探してください。'},400);
 if(conditions.source&&!['クラウドワークス','ランサーズ','ココナラ','クラウディア'].includes(conditions.source))return reply({error:'この掲載元はAPIキー不要検索または外部検索から確認してください。'},400);
 const excludeUrls=new Set(parseExclude(data.excludeUrls));
 const loadMore=data.loadMore===true;
 const planOffset=Math.max(0,Math.min(40,Math.floor(Number(data.planOffset)||0)));
 permit=await authorizeTavily({key:saved.key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:2,minimumCredits:1,env:env as any});
 const signal=AbortSignal.timeout(55000);
 const plans=websiteSearchPlans(conditions,permit.credits,planOffset);
 const all:any[]=[],creditsPerBatch:number[]=[],planLabels:string[]=[],planDiagnostics:PlanDiag[]=[],warnings:string[]=permit.credits<2?['無料枠の残り1クレジットで基本検索を1回実行しました。追加の確認済み募集はAPIキー不要の取得で補完します。']:[];
 let creditsUncertain=false;
 // Domains via include_domains; query holds role/path hints only (no site:). Never log API keys.
 for(let batch=0;batch<plans.length&&batch<permit.credits;batch++){
  const plan=plans[batch];
  try{
   const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+saved.key,'Content-Type':'application/json'},body:JSON.stringify({query:plan.query,search_depth:'basic',auto_parameters:false,max_results:20,time_range:'month',max_age_hours:24,include_domains:plan.domains,include_raw_content:'text',include_answer:false,include_usage:true}),signal:AbortSignal.any([signal,AbortSignal.timeout(18000)]),redirect:'manual'});
   if(!r.ok)throw tavilyResponseError(r.status);const d:any=await r.json();if(!Array.isArray(d.results))throw new TavilyTestError('Tavilyの検索結果の形式を読み取れませんでした。利用履歴をご確認ください。自動再試行はしません。',502);
   const results=d.results as any[];const used=d.usage?.credits??1;
   const detailCandidates=results.filter(item=>!!jobDetailUrl(String(item?.url||''))).length;
   const batchDupes=results.length-new Set(results.map(item=>jobDetailUrl(String(item?.url||''))||String(item?.url||''))).size;
   all.push(...results);creditsPerBatch.push(used);planLabels.push(plan.label+' / '+plan.sourceFocus);
   planDiagnostics.push({sourceFocus:plan.sourceFocus,label:plan.label,query:plan.query,include_domains:plan.domains,tavilyReturned:results.length,detailCandidates,detailVerified:0,filterMismatched:0,duplicates:batchDupes,credits:used});
  }catch(e){if(!creditsPerBatch.length)throw e;creditsUncertain=true;warnings.push('追加のWeb検索に失敗しました。完了した結果を保持しています。未確認の消費はTavilyの利用履歴をご確認ください。');break}
 }
 const seenBefore=excludeUrls.size;
 const freshItems=all.filter(item=>{const url=jobDetailUrl(String(item?.url||''));if(!url)return true;if(excludeUrls.has(url))return false;return true});
 const priorDupes=all.length-freshItems.length;
 const verified=await verifyTavilyWebsiteResults(freshItems,undefined,signal,Math.min(80,freshItems.length||20));
 const alreadyKnown=verified.jobs.filter(j=>excludeUrls.has(j.url));
 const novelVerified=verified.jobs.filter(j=>!excludeUrls.has(j.url));
 const matched=filterWebsiteJobs(novelVerified,conditions);
 const filterMismatched=novelVerified.length-matched.length;
 const duplicatesExcluded=(verified.duplicatesExcluded||0)+priorDupes+alreadyKnown.length;
 // Attribute verified/matched counts back onto plan diagnostics by listing host.
 for(const diag of planDiagnostics){
  const hosts=new Set(diag.include_domains.map(d=>d.replace(/^www\./,'')));
  const inPlan=(url:string)=>{try{return hosts.has(new URL(url).hostname.replace(/^www\./,''))}catch{return false}};
  diag.detailVerified=novelVerified.filter(j=>inPlan(j.url)).length;
  diag.filterMismatched=Math.max(0,diag.detailVerified-matched.filter(j=>inPlan(j.url)).length);
 }
 let batchJobs=matched,overflow:typeof matched=[],fallbackUsed=false,discoveryChecks:any[]=[],deadUrls=verified.excludedUrls;
 let discoverScanned=0,discoverVerified=0,discoverMatched=0,discoverMismatched=0,discoverDupes=0;
 // Always merge APIキー不要 path (separate route) into Tavily results by URL — do not replace prior coverage.
 if(!loadMore&&!signal.aborted){
  const official=await collectWebsiteJobs(conditions,undefined,signal,seeds,BATCH_TARGET,false,[...excludeUrls]);
  discoveryChecks=official.discoveryChecks;deadUrls=[...new Set([...deadUrls,...official.excludedUrls])];
  discoverScanned=official.scanned;discoverVerified=official.verified;discoverMatched=official.matched;discoverMismatched=official.filterMismatched;discoverDupes=official.duplicatesExcluded;
  const unique=new Map(batchJobs.map(j=>[j.url,j]));
  for(const job of [...official.jobs,...official.overflow]){if(excludeUrls.has(job.url)||unique.has(job.url))continue;unique.set(job.url,job)}
  fallbackUsed=unique.size>batchJobs.length;batchJobs=[...unique.values()];
  planDiagnostics.push({sourceFocus:'APIキー不要（公式一覧）',label:'複数サイト補完',query:'(discover)',include_domains:[],tavilyReturned:official.scanned,detailCandidates:official.scanned,detailVerified:official.verified,filterMismatched:official.filterMismatched,duplicates:official.duplicatesExcluded,credits:0});
 }
 const valid=batchJobs.filter(j=>!excludeUrls.has(j.url));
 const jobs=valid.slice(0,BATCH_TARGET);
 overflow=valid.slice(BATCH_TARGET);
 const credits=creditsPerBatch.reduce((a,b)=>a+b,0);
 const bySource:Record<string,{displayed:number;deferred:number}>={};
 for(const j of jobs)bySource[j.source]={displayed:(bySource[j.source]?.displayed||0)+1,deferred:bySource[j.source]?.deferred||0};
 for(const j of overflow)bySource[j.source]={displayed:bySource[j.source]?.displayed||0,deferred:(bySource[j.source]?.deferred||0)+1};
 // Stats cover this request only. verified = body-verified (Tavily + discover), not Tavily-only.
 const combined=combineRequestStats({
  tavilyScanned:all.length,
  tavilyVerified:novelVerified.length,
  tavilyMatched:matched.length,
  tavilyDupes:duplicatesExcluded,
  tavilyMismatch:filterMismatched,
  discoverScanned,
  discoverVerified,
  discoverMatched,
  discoverDupes,
  discoverMismatch:discoverMismatched,
  validCount:valid.length,
 });
 const stats={
  scanned:combined.scanned,
  verified:combined.verified,
  matched:combined.matched,
  displayed:jobs.length,
  deferred:overflow.length,
  duplicatesExcluded:combined.duplicatesExcluded,
  filterMismatched:combined.filterMismatched,
  nonDetailExcluded:verified.nonDetailExcluded||0,
  tavilyScanned:all.length,
  tavilyVerified:novelVerified.length,
  discoverScanned,
  discoverVerified,
  credits,
  keptFromPrevious:seenBefore,
  plans:planLabels,
 };
 return reply({
  freeCreditsBefore:permit.freeCreditsBefore,
  jobs,
  overflow,
  checkedAt:Date.now(),
  credits,
  scanned:stats.scanned,
  verified:stats.verified,
  matched:stats.matched,
  displayed:jobs.length,
  deferred:overflow.length,
  duplicatesExcluded:stats.duplicatesExcluded,
  filterMismatched:stats.filterMismatched,
  stats,
  warnings,
  creditsUncertain,
  excludedUrls:deadUrls,
  excluded:verified.excluded,
  exclusionCounts:verified.exclusionCounts,
  discoveryChecks,
  fallbackUsed,
  loadMore,
  target:BATCH_TARGET,
  source:fallbackUsed?'Web検索＋複数サイトの確認済み募集を統合':'Web検索の個別募集を確認',
  query:plans.map(p=>p.query).join(' || '),
  queries:plans.map(p=>({label:p.label,sourceFocus:p.sourceFocus,query:p.query,domains:p.domains})),
  sourceDiagnostics:planDiagnostics,
  sourceBreakdown:bySource,
  sourceCounts:Object.fromEntries([...new Set(jobs.map(j=>j.source))].map(source=>[source,jobs.filter(j=>j.source===source).length])),
 });
 }catch(e){if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);if(e instanceof SyntaxError)return reply({error:'検索条件の形式が正しくありません。'},400);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);return reply({error:'案件の確認に時間がかかったか、募集元に接続できませんでした。未確認の候補は表示していません。'},502)}finally{await permit?.release()}
}
