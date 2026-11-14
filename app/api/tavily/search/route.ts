import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../../lib/tavily-allowance';
import {TavilyTestError,tavilyResponseError} from '../../../../lib/tavily-test';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {emptySearch} from '../../../../lib/grounded-search';
import {runTavilySearch} from '../../../../lib/tavily-search';
import {readSettings,vaultOwner} from '../../../../lib/key-vault';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 let permit:TavilyPermit|undefined;
 try{const data=await boundedJson(req,12000);if(data.initiated!==true&&data.confirmed!==true)return reply({error:'検索ボタンを押してから実行してください。'},400);const user=await getChatGPTUser();const identity=await vaultOwner(req,user?.userId);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;
 const saved=secret?await readSettings(env.BUCKET!,{...identity,owner:'tavily:'+identity.owner},secret):null;
 if(!saved?.key||!saved.consent)return reply({error:'「設定・連携」でTavilyのAPIキーと送信への同意を保存してください。'},400);
 const conditions={...emptySearch};for(const field of Object.keys(conditions) as (keyof typeof conditions)[])conditions[field]=String(data.conditions?.[field]||'').slice(0,500);
 permit=await authorizeTavily({key:saved.key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:1});
 return reply(await runTavilySearch(conditions,saved.key,AbortSignal.timeout(25000)));
 }catch(e:any){if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);return reply({error:e.name==='TimeoutError'?'Tavilyの検索がタイムアウトしました。時間を置いて再検索してください。':e.message?.startsWith('Tavily')||e.message?.startsWith('設定・連携')?e.message:'Tavily検索に接続できませんでした。時間を置いて再検索してください。'},502)}finally{await permit?.release()}
}
