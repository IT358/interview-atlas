import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../../lib/tavily-allowance';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {RequestApiKeyError,tavilyKeyFromRequest} from '../../../../lib/request-api-key';
import {vaultOwner} from '../../../../lib/key-vault';
import {runConfirmedTavilyTest,TavilyTestError} from '../../../../lib/tavily-test';
export const dynamic='force-dynamic';
function reply(data:any,status=200,cookie=''){const headers:Record<string,string>={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};if(cookie)headers['Set-Cookie']=cookie;return Response.json(data,{status,headers})}
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'このアプリの画面から操作してください。'},403);
 let stage='prepare';let permit:TavilyPermit|undefined;let cookie='';
 try{
  const data=await boundedJson(req,2000);
  if((data.initiated!==true&&data.confirmed!==true)||typeof data.requestId!=='string'||!/^[-a-f0-9]{36}$/.test(data.requestId))return reply({error:'接続テストのボタンを押して実行してください。'},400);
  const key=tavilyKeyFromRequest(data);
  const user=await getChatGPTUser();const identity=await vaultOwner(req,user?.userId);cookie=identity.cookie;
  permit=await authorizeTavily({key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:1,env:env as any});
  const db=env.DB!,now=Date.now();
  // Claim this action before sending: a duplicate request never repeats the search. Do not store the key.
  const accepted=await db.prepare('INSERT INTO tavily_test_confirmations(owner,token,key_updated,expires,used,last_run) VALUES(?,?,?,?,1,?) ON CONFLICT(owner) DO NOTHING').bind(identity.owner+':test:'+data.requestId,data.requestId,0,now+86400000,now).run();
  if(!accepted.meta.changes)return reply({error:'この接続テストは受付済みです。重複して実行しません。結果が不明な場合は公式画面の利用履歴をご確認ください。'},409,cookie);
  stage='external';
  return reply(await runConfirmedTavilyTest(key),200,cookie);
 }catch(e){if(e instanceof RequestApiKeyError)return reply({error:e.message},e.status,cookie);if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status,cookie);if(e instanceof BodyLimitError)return reply({error:'入力が長すぎます。'},413,cookie);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400,cookie);if(e instanceof TavilyTestError)return reply({error:e.message},e.status,cookie);console.error('tavily_test_failure',{stage,code:stage==='prepare'?'CONFIRMATION_STORAGE_FAILED':'EXTERNAL_CHECK_FAILED'});return reply({error:stage==='prepare'?'アプリ内の実行受付に失敗しました。Tavilyへの検索送信は行っていません。':'Tavilyの通信確認に失敗しました。自動再試行はしません。',code:stage==='prepare'?'CONFIRMATION_STORAGE_FAILED':'EXTERNAL_CHECK_FAILED'},stage==='prepare'?503:502,cookie)}finally{await permit?.release()}
}
