import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../lib/tavily-allowance';
import {TavilyTestError,tavilyResponseError} from '../../../lib/tavily-test';
import {env} from 'cloudflare:workers';
import seeds from '../../../data/researched-website-jobs.json';
import {boundedJson,BodyLimitError} from '../../../lib/request-body';
import {emptySearch} from '../../../lib/grounded-search';
import {verifyJobUrls,filterWebsiteJobs} from '../../../lib/verified-website-jobs';
import {getChatGPTUser} from '../../chatgpt-auth';
import {readSettings,vaultOwner} from '../../../lib/key-vault';
import {collectWebsiteJobs} from '../../../lib/multi-site-jobs';
import {websiteSearchQuery,verifyTavilyWebsiteResults,discoverOfficialWebsiteUrls} from '../../../lib/website-job-search';
export const dynamic='force-dynamic';
const reply=(d:any,status=200)=>Response.json(d,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(req:Request){
 try{const params=new URL(req.url).searchParams;const fresh=params.get('refresh')==='1';
  if(params.get('discover')==='1'){const c={...emptySearch};for(const k of Object.keys(c) as (keyof typeof c)[])c[k]=(params.get(k)||'').slice(0,300);const result=await collectWebsiteJobs(c,undefined,AbortSignal.timeout(55000),seeds,30,fresh);return reply(result)}
  const requested={market:params.get('market')||'',cat:params.get('cat')||'Web制作全般'};const selected=filterWebsiteJobs(seeds,requested).slice(0,30);const result=await verifyJobUrls(selected.map(j=>j.url),undefined,fresh,selected);result.jobs=filterWebsiteJobs(result.jobs,requested);return reply({...result,checkedAt:Date.now(),source:fresh?'募集元を再確認':'調査済みの個別募集ページ',stale:result.jobs.length===0});
 }catch{return reply({error:'確認済み案件を取得できませんでした。'},503)}
}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 let permit:TavilyPermit|undefined;
 try{const data=await boundedJson(req,12000);if(data.initiated!==true&&data.confirmed!==true)return reply({error:'検索ボタンを押してから実行してください。'},400);const user=await getChatGPTUser();const id=await vaultOwner(req,user?.userId);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;
 const saved=secret&&env.DB?await readSettings(env.DB,{...id,owner:'tavily:'+id.owner},secret):null;if(!saved?.key||!saved.consent)return reply({error:'設定・連携でTavilyキーを保存してください。調査済み案件はキーなしで見られます。'},400);
 const conditions={...emptySearch};for(const k of Object.keys(conditions) as (keyof typeof conditions)[])conditions[k]=String(data.conditions?.[k]||'').slice(0,300);
 if(conditions.market==='海外')return reply({error:'海外案件はAPIキー不要の複数サイト検索で探してください。'},400);
 if(conditions.source&&!['クラウドワークス','ランサーズ','ココナラ','クラウディア'].includes(conditions.source))return reply({error:'この掲載元はAPIキー不要検索または外部検索から確認してください。'},400);
 permit=await authorizeTavily({key:saved.key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:2,minimumCredits:1,env:env as any});
 const signal=AbortSignal.timeout(55000),query=websiteSearchQuery(conditions);const all:any[]=[],creditsPerBatch:number[]=[],warnings:string[]=permit.credits<2?['無料枠の残り1クレジットで基本検索を1回実行しました。追加の確認済み募集はAPIキー不要の取得で補完します。']:[];let creditsUncertain=false;
 // Two basic searches from one button action, never a retry of a failed request.
 for(let batch=0;batch<permit.credits;batch++){
  try{const suffix=batch===0?'':' 業務委託 継続 新着 応募';
  const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+saved.key,'Content-Type':'application/json'},body:JSON.stringify({query:query+suffix,search_depth:'basic',auto_parameters:false,max_results:20,time_range:'month',max_age_hours:24,include_domains:conditions.source==='クラウドワークス'?['crowdworks.jp']:conditions.source==='ココナラ'?['coconala.com']:conditions.source==='ランサーズ'?['lancers.jp']:conditions.source==='クラウディア'?['craudia.com']:['crowdworks.jp','lancers.jp','coconala.com','craudia.com'],include_raw_content:'text',include_answer:false,include_usage:true}),signal:AbortSignal.any([signal,AbortSignal.timeout(18000)]),redirect:'manual'});
  if(!r.ok)throw tavilyResponseError(r.status);const d:any=await r.json();if(!Array.isArray(d.results))throw new TavilyTestError('Tavilyの検索結果の形式を読み取れませんでした。利用履歴をご確認ください。自動再試行はしません。',502);all.push(...d.results);creditsPerBatch.push(d.usage?.credits??1);
  }catch(e){if(!creditsPerBatch.length)throw e;creditsUncertain=true;warnings.push('2回目のWeb検索に失敗しました。完了した結果を保持しています。2回目の消費は未確認のため、Tavilyの利用履歴をご確認ください。');break}
 }
 const verified=await verifyTavilyWebsiteResults(all,undefined,signal);const matched=filterWebsiteJobs(verified.jobs,conditions);let jobs=matched,fallbackUsed=false,discoveryChecks:any[]=[],excludedUrls=verified.excludedUrls;
 if(jobs.length<30&&!signal.aborted){const official=await collectWebsiteJobs(conditions,undefined,signal,seeds,30);discoveryChecks=official.discoveryChecks;excludedUrls=[...new Set([...excludedUrls,...official.excludedUrls])];const unique=new Map(jobs.map(j=>[j.url,j]));for(const job of official.jobs)if(unique.size<30)unique.set(job.url,job);fallbackUsed=unique.size>jobs.length;jobs=[...unique.values()]}
 return reply({freeCreditsBefore:permit.freeCreditsBefore,jobs:jobs.slice(0,30),checkedAt:Date.now(),credits:creditsPerBatch.reduce((a,b)=>a+b,0),scanned:all.length,warnings,creditsUncertain,excludedUrls,excluded:verified.excluded,exclusionCounts:verified.exclusionCounts,discoveryChecks,fallbackUsed,target:30,source:fallbackUsed?'Web検索＋複数サイトの確認済み募集で補完':'Web検索の個別募集を確認',query,sourceCounts:Object.fromEntries([...new Set(jobs.map(j=>j.source))].map(source=>[source,jobs.filter(j=>j.source===source).length]))});
 }catch(e){if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);if(e instanceof SyntaxError)return reply({error:'検索条件の形式が正しくありません。'},400);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);return reply({error:'案件の確認に時間がかかったか、募集元に接続できませんでした。未確認の候補は表示していません。'},502)}finally{await permit?.release()}
}
