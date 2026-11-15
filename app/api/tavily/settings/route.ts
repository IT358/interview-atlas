import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../../chatgpt-auth';
import {deleteSettings,readSettings,vaultOwner} from '../../../../lib/key-vault';
export const dynamic='force-dynamic';
function reply(data:any,status=200,cookie=''){const headers:Record<string,string>={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'};if(cookie)headers['Set-Cookie']=cookie;return Response.json(data,{status,headers})}
async function identity(req:Request){const user=await getChatGPTUser();const id=await vaultOwner(req,user?.userId);return {...id,owner:'tavily:'+id.owner}}
export async function GET(req:Request){
 try{
  const id=await identity(req);const secret=(env as any).USER_KEY_ENCRYPTION_KEY;
  if(!secret||!env.DB)return reply({serverSaved:false,saved:false,scope:id.guest?'guest':'account',storage:'browser'},200,id.cookie);
  const saved=await readSettings(env.DB,id,secret);
  return reply({serverSaved:!!saved,saved:!!saved,scope:id.guest?'guest':'account',storage:'browser',updatedAt:saved?.updatedAt||null},200,id.cookie);
 }catch{return reply({error:'サーバー保存キーの有無を確認できませんでした。'},503)}
}
// Keys stay in the browser only. POST never writes to the vault.
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 return reply({error:'キーはこのブラウザにだけ保存してください。サーバーへのキー保存は終了しました。',code:'BROWSER_KEY_ONLY'},400);
}
export async function DELETE(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 try{const id=await identity(req);if(!env.DB)return reply({error:'キー削除機能の設定が完了していません。'},503);await deleteSettings(env.DB,id);return reply({serverSaved:false,saved:false},200,id.cookie)}catch{return reply({error:'サーバーに保存されたTavilyキーを削除できませんでした。'},500)}
}
