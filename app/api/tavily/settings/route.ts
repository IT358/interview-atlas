import {boundedJson,BodyLimitError} from '../../../../lib/request-body';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {deleteSettings,readSettings,vaultOwner,writeSettings} from '../../../../lib/key-vault';
export const dynamic='force-dynamic';
function reply(data:any,status=200,cookie=''){const headers:Record<string,string>={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};if(cookie)headers['Set-Cookie']=cookie;return Response.json(data,{status,headers})}
async function identity(req:Request){const user=await getChatGPTUser();const id=await vaultOwner(req,user?.userId);return {...id,owner:'tavily:'+id.owner}}
export async function GET(req:Request){try{const id=await identity(req);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;if(!secret||!env.DB)return reply({error:'キー保存機能の設定が完了していません。'},503);const saved=await readSettings(env.DB,id,secret);return reply({saved:!!saved,scope:id.guest?'guest':'account',model:saved?.model||'tavily-basic',consent:saved?.consent||false,updatedAt:saved?.updatedAt||null},200,id.cookie)}catch{return reply({error:'保存済みのTavily設定を読み込めませんでした。'},503)}}
export async function POST(req:Request){

 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 try{const data=await boundedJson(req,6000);const id=await identity(req);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;if(!secret||!env.DB)return reply({error:'キー保存機能の設定が完了していません。'},503);
 const previous=await readSettings(env.DB,id,secret);const key=String(data.key||'').trim()||previous?.key;
 if(!key||key.length<20||key.length>512||/\s/.test(key))return reply({error:'APIキーの文字列を確認してください。'},400,id.cookie);
 const model='tavily-basic';if(!key.startsWith('tvly-'))return reply({error:'TavilyのAPIキー（tvly-で始まる文字列）を入力してください。Geminiのキーは使用できません。'},400,id.cookie);
 if(data.consent!==true)return reply({error:'Tavilyへの送信内容を確認し、同意にチェックしてください。'},400,id.cookie);
 const saved={key,model,consent:true,updatedAt:Date.now()};await writeSettings(env.DB,id,saved,secret);
 return reply({saved:true,scope:id.guest?'guest':'account',model,consent:true,updatedAt:saved.updatedAt},200,id.cookie);
 }catch(e){if(e instanceof BodyLimitError)return reply({error:'入力が長すぎます。'},413);if(e instanceof SyntaxError)return reply({error:'入力形式を確認してください。'},400);return reply({error:'Tavily設定を保存できませんでした。もう一度お試しください。'},500)}
}
export async function DELETE(req:Request){if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);try{const id=await identity(req);if(!env.DB)return reply({error:'キー保存機能の設定が完了していません。'},503);await deleteSettings(env.DB,id);return reply({saved:false},200,id.cookie)}catch{return reply({error:'Tavily設定を削除できませんでした。'},500)}}
