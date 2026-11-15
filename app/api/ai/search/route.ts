import {FREE_TEST_MODE,costLockResponse} from '../../../../lib/cost-policy';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {RequestApiKeyError,geminiKeyFromRequest} from '../../../../lib/request-api-key';
import {emptySearch,runGroundedSearch} from '../../../../lib/grounded-search';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:Request){
 if(FREE_TEST_MODE)return costLockResponse();
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 try{const data=await boundedJson(req,12000);
 const {key,model}=geminiKeyFromRequest({key:data.key,consent:data.consent===true||!!data.key,model:data.model});
 const conditions={...emptySearch};for(const name of Object.keys(conditions) as (keyof typeof conditions)[])conditions[name]=String(data.conditions?.[name]||'').slice(0,500);
 const result=await runGroundedSearch(conditions,key,model,AbortSignal.timeout(55000));return reply(result);
 }catch(e:any){if(e instanceof RequestApiKeyError)return reply({error:e.message},e.status);if(e instanceof BodyLimitError)return reply({error:'検索条件が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);return reply({error:e.name==='TimeoutError'?'AI検索がタイムアウトしました。時間を置いて再検索してください。':e.message?.includes('無料枠')?e.message:e.message?.startsWith('Google検索')||e.message?.startsWith('この検索')||e.message?.startsWith('APIキー')||e.message?.startsWith('あなたの')||e.message?.startsWith('AI検索に')?e.message:'AI検索に接続できませんでした。キー・モデル・無料枠を確認してください。'},502)}
}
