import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../../lib/tavily-allowance';
import {TavilyTestError,tavilyResponseError} from '../../../../lib/tavily-test';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {RequestApiKeyError,tavilyKeyFromRequest} from '../../../../lib/request-api-key';
import {env} from 'cloudflare:workers';
import {emptyCompany,companyTypes,companyPurposes,companyRegions} from '../../../../lib/company-search';
import {companyResearchQuery,companyResearchRegion,researchCompanyResult} from '../../../../lib/company-research';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 let permit:TavilyPermit|undefined;
 try{const data=await boundedJson(req,12000);if(data.initiated!==true&&data.confirmed!==true)return reply({error:'検索ボタンを押してから実行してください。'},400);
 const key=tavilyKeyFromRequest(data);
 const conditions={...emptyCompany};for(const field of Object.keys(conditions) as (keyof typeof conditions)[])conditions[field]=String(data.conditions?.[field]||'').slice(0,500);
 if(conditions.region&&!companyRegions.includes(conditions.region))return reply({error:'地域を選び直してください。'},400);
 if(!companyTypes.includes(conditions.type)||!companyPurposes.includes(conditions.purpose))return reply({error:'会社の種類・探し方を選び直してください。'},400);
 const batch=Number(data.batchIndex||0);if(!Number.isInteger(batch)||batch<0||batch>46)return reply({error:'調査回数の指定が不正です。'},400);
 permit=await authorizeTavily({key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:1,env:env as any});
 const query=companyResearchQuery(conditions,batch),region=companyResearchRegion(conditions,batch);
 const r=await fetch('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({query,search_depth:'basic',auto_parameters:false,max_results:20,include_raw_content:'text',include_answer:false,include_usage:true}),signal:AbortSignal.timeout(25000),redirect:'manual'});
 if(!r.ok)throw tavilyResponseError(r.status);
 const d:any=await r.json();if(!Array.isArray(d.results))return reply({error:'Tavilyの応答形式を確認できませんでした。利用履歴をご確認ください。'},502);const unique=new Map<string,any>();for(const row of d.results||[]){const company=researchCompanyResult(row,{...conditions,region});if(company&&!unique.has(company.domain))unique.set(company.domain,company)}
 return reply({results:[...unique.values()],credits:d.usage?.credits??1,checkedAt:Date.now(),scanned:d.results?.length||0,excluded:(d.results?.length||0)-unique.size,query,batchIndex:batch,region});
 }catch(e:any){if(e instanceof RequestApiKeyError)return reply({error:e.message},e.status);if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);return reply({error:e.name==='TimeoutError'?'Tavilyの検索がタイムアウトしました。時間を置いて再検索してください。':e.message?.startsWith('Tavily')||e.message?.startsWith('あなたの')?e.message:'Tavily検索に接続できませんでした。時間を置いて再検索してください。'},502)}finally{await permit?.release()}
}
