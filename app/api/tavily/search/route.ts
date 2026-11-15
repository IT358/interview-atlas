import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../../lib/tavily-allowance';
import {TavilyTestError} from '../../../../lib/tavily-test';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {RequestApiKeyError,tavilyKeyFromRequest} from '../../../../lib/request-api-key';
import {env} from 'cloudflare:workers';
import {emptySearch} from '../../../../lib/grounded-search';
import {runTavilySearch} from '../../../../lib/tavily-search';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 let permit:TavilyPermit|undefined;
 try{const data=await boundedJson(req,12000);if(data.initiated!==true&&data.confirmed!==true)return reply({error:'検索ボタンを押してから実行してください。'},400);
 const key=tavilyKeyFromRequest(data);
 const conditions={...emptySearch};for(const field of Object.keys(conditions) as (keyof typeof conditions)[])conditions[field]=String(data.conditions?.[field]||'').slice(0,500);
 permit=await authorizeTavily({key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:1,env:env as any});
 return reply(await runTavilySearch(conditions,key,AbortSignal.timeout(25000)));
 }catch(e:any){if(e instanceof RequestApiKeyError)return reply({error:e.message},e.status);if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);return reply({error:e.name==='TimeoutError'?'Tavilyの検索がタイムアウトしました。時間を置いて再検索してください。':e.message?.startsWith('Tavily')||e.message?.startsWith('あなたの')?e.message:'Tavily検索に接続できませんでした。時間を置いて再検索してください。'},502)}finally{await permit?.release()}
}
