import {authorizeTavily,TavilyAllowanceError,type TavilyPermit} from '../../../../lib/tavily-allowance';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {readSettings,vaultOwner} from '../../../../lib/key-vault';
import {runConfirmedTavilyTest,TavilyTestError} from '../../../../lib/tavily-test';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'このアプリの画面から操作してください。'},403);
 const user=await getChatGPTUser();if(!user)return reply({error:'保存したキーで確認するため、同じChatGPTアカウントでログインしてください。'},401);
 let stage='prepare';let permit:TavilyPermit|undefined;
 try{
  const data=await boundedJson(req,2000);
  if((data.initiated!==true&&data.confirmed!==true)||typeof data.requestId!=='string'||!/^[-a-f0-9]{36}$/.test(data.requestId))return reply({error:'接続テストのボタンを押して実行してください。'},400);
  const identity=await vaultOwner(req,user.userId),secret=(env as any).USER_KEY_ENCRYPTION_KEY;
  const saved=secret?await readSettings(env.BUCKET!,{...identity,owner:'tavily:'+identity.owner},secret):null;
  if(!saved?.key||!saved.consent)return reply({error:'先にステップ3で、ご自身のTavilyキーを保存してください。'},400);
  permit=await authorizeTavily({key:saved.key,db:env.DB,initiated:data.initiated,confirmed:data.confirmed,credits:1});
  const db=env.DB!,now=Date.now();
  // Claim this action before sending: a duplicate request never repeats the search.
  const accepted=await db.prepare('INSERT INTO tavily_test_confirmations(owner,token,key_updated,expires,used,last_run) VALUES(?,?,?,?,1,?) ON CONFLICT(owner) DO NOTHING').bind(identity.owner+':test:'+data.requestId,data.requestId,saved.updatedAt,now+86400000,now).run();
  if(!accepted.meta.changes)return reply({error:'この接続テストは受付済みです。重複して実行しません。結果が不明な場合は公式画面の利用履歴をご確認ください。'},409);
  stage='external';
  return reply(await runConfirmedTavilyTest(saved.key));
 }catch(e){if(e instanceof TavilyAllowanceError)return reply({error:e.message,code:e.code,freeCreditsRemaining:e.freeCreditsRemaining},e.status);if(e instanceof BodyLimitError)return reply({error:'入力が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);if(e instanceof TavilyTestError)return reply({error:e.message},e.status);console.error('tavily_test_failure',{stage,code:stage==='prepare'?'CONFIRMATION_STORAGE_FAILED':'EXTERNAL_CHECK_FAILED'});return reply({error:stage==='prepare'?'アプリ内の実行受付に失敗しました。Tavilyへの検索送信は行っていません。':'Tavilyの通信確認に失敗しました。自動再試行はしません。',code:stage==='prepare'?'CONFIRMATION_STORAGE_FAILED':'EXTERNAL_CHECK_FAILED'},stage==='prepare'?503:502)}finally{await permit?.release()}
}
