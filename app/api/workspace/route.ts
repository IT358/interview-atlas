import {SERVER_AUDIO_STORAGE} from '../../../lib/runtime-features';
import {readSettings,vaultOwner} from '../../../lib/key-vault';
import {buildInterviewEvaluationPrompt} from '../../../lib/interview-evaluation';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import {boundedForm,objectData,BodyLimitError,byteRange} from '../../../lib/request-body';
export const dynamic='force-dynamic';
const reply=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(req:Request){
 try{
 const user=await getChatGPTUser(); if(!user)return reply({error:'ログインしてください'},401);
 const db=env.DB!; const url=new URL(req.url); const id=url.searchParams.get('audio');
 if(id){
 if(!SERVER_AUDIO_STORAGE||!env.BUCKET)return reply({error:'音声のサーバ保存は現在利用できません。'},503);
 const rec=await db.prepare('SELECT id FROM records WHERE id=? AND owner=?').bind(id,user.userId).first();if(!rec)return reply({error:'見つかりません'},404);
 const path=user.userId+'/'+id;const head=await env.BUCKET.head(path);if(!head)return reply({error:'音声なし'},404);
 let range;try{range=byteRange(req.headers.get('range'),head.size)}catch{return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+head.size}})}
 const file=await env.BUCKET.get(path,range?{range:{offset:range.offset,length:range.length}}:undefined);if(!file)return reply({error:'音声なし'},404);
 const headers:Record<string,string>={'Content-Type':file.httpMetadata?.contentType||'audio/webm','Cache-Control':'private, no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Content-Length':String(range?range.length:head.size)};
 if(range)headers['Content-Range']='bytes '+range.offset+'-'+range.end+'/'+head.size;
 return new Response(file.body,{status:range?206:200,headers});
 }
 const prospectOnly=url.searchParams.get('kind')==='prospect';
 const result=prospectOnly?await db.prepare("SELECT * FROM records WHERE owner=? AND kind='prospect' ORDER BY created DESC LIMIT 1000").bind(user.userId).all():await db.prepare("SELECT * FROM records WHERE owner=? AND kind!='prospect' ORDER BY created DESC LIMIT 300").bind(user.userId).all();
 return reply({records:result.results.map((r:any)=>({...JSON.parse(r.data),id:r.id,kind:r.kind,created:r.created})),name:user.displayName});
 }catch{return reply({error:'記録を読み込めませんでした。時間をおいて再確認してください。'},503);}
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'ログインしてください'},401);
 if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);
 try{
 const form=await boundedForm(req);const action=String(form.get('action'));const db=env.DB!;
 if(action==='save'){
  const kind=String(form.get('kind'));if(!['session','profile','job','application','portfolio','prospect'].includes(kind))return reply({error:'種類が不正'},400);
  const input=objectData(String(form.get('data')||'{}'));
  if(kind==='prospect'){const count=await db.prepare("SELECT COUNT(*) as n FROM records WHERE owner=? AND kind='prospect'").bind(user.userId).first<{n:number}>();if((count?.n||0)>=1000)return reply({error:'営業先の保存上限1,000件に達しました。'},400);}
  const id=kind==='profile'?'profile-'+user.userId:crypto.randomUUID();const file=form.get('audio');
  if(file instanceof File){if(!SERVER_AUDIO_STORAGE||!env.BUCKET)return reply({error:'音声のサーバ保存は現在利用できません。文字回答のみ保存できます。'},503);if(kind!=='session')return reply({error:'音声は練習記録にのみ保存できます'},400);if(file.size>12*1024*1024||!file.type.startsWith('audio/'))return reply({error:'音声は12MB以下で保存してください'},400);const size=await db.prepare("SELECT COUNT(*) as n FROM records WHERE owner=? AND kind='session'").bind(user.userId).first<{n:number}>();if((size?.n||0)>=30)return reply({error:'保存上限30件です。不要な記録を削除してください'},400);await env.BUCKET.put(user.userId+'/'+id,file.stream(),{httpMetadata:{contentType:file.type}});}
  if(kind==='session')input.hasAudio=SERVER_AUDIO_STORAGE&&file instanceof File;const data=JSON.stringify(input);
  try{await db.prepare('INSERT INTO records(id,owner,kind,data,created) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(id,user.userId,kind,data,Date.now()).run();}catch(e){if(SERVER_AUDIO_STORAGE&&file instanceof File&&env.BUCKET)await env.BUCKET.delete(user.userId+'/'+id);throw e;}return reply({id});
 }
 const id=String(form.get('id'));const record=await db.prepare('SELECT * FROM records WHERE id=? AND owner=?').bind(id,user.userId).first<any>();if(!record)return reply({error:'記録がありません'},404);
 if(action==='update'){if(record.kind==='session')return reply({error:'練習記録は直接編集できません'},400);const input=objectData(String(form.get('data')||'{}'));const data=JSON.stringify(input);await db.prepare('UPDATE records SET data=? WHERE id=? AND owner=?').bind(data,id,user.userId).run();return reply({ok:true});}
 if(action==='delete'){if(SERVER_AUDIO_STORAGE&&env.BUCKET)await env.BUCKET.delete(user.userId+'/'+id);await db.prepare('DELETE FROM records WHERE id=? AND owner=?').bind(id,user.userId).run();return reply({ok:true});}
 if(action==='save-evaluation'){
  if(record.kind!=='session')return reply({error:'練習記録を選んでください'},400);
  const data=JSON.parse(record.data);const evaluation=String(form.get('evaluation')||'').trim();
  if(!evaluation||evaluation.length>50000)return reply({error:'評価文を確認してください（1〜50000文字）。'},400);
  data.evaluation=evaluation;await db.prepare('UPDATE records SET data=? WHERE id=? AND owner=?').bind(JSON.stringify(data),id,user.userId).run();return reply({evaluation});
 }
 if(action==='evaluate'){
  if(record.kind!=='session')return reply({error:'練習記録を選んでください'},400);
  const identity=await vaultOwner(req,user.userId);const saved=(env as any).USER_KEY_ENCRYPTION_KEY&&env.DB?await readSettings(env.DB,identity,(env as any).USER_KEY_ENCRYPTION_KEY):null;
  if(saved&&saved.consent!==true)return reply({error:'設定でGoogleへの送信内容に同意し、キーを保存してください。'},400);
  const key=String(form.get('key')||saved?.key||'');if(!key)return reply({error:'設定でAPIキーを入力してください'},400);
  const model=String(form.get('model')||saved?.model||'gemini-2.5-flash');if(!/^gemini-[a-z0-9.-]+$/.test(model))return reply({error:'モデル名が不正'},400);
  const data=JSON.parse(record.data);
  const parts:any[]=[{text:buildInterviewEvaluationPrompt({title:data.title,brief:data.brief,jobUrl:data.jobUrl,questions:data.questions,answers:data.answers,lang:data.lang,mode:data.mode})}];
  if(SERVER_AUDIO_STORAGE&&env.BUCKET){const audio=await env.BUCKET.get(user.userId+'/'+id);if(audio){const bytes=new Uint8Array(await audio.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));parts.push({inlineData:{mimeType:audio.httpMetadata?.contentType?.split(';')[0]||'audio/webm',data:btoa(s)}})}}
  const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts}],generationConfig:{maxOutputTokens:5000}}),signal:AbortSignal.timeout(55000)});
  if(!res.ok)return reply({error:res.status===429?'無料枠の上限です。音声練習を続け、後から再評価できます。':'AI接続に失敗しました。キー・モデル・利用地域・無料枠を確認してください。'},res.status===429?429:502);
  const result:any=await res.json();const evaluation=result.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||'').join('');if(!evaluation)return reply({error:'評価を取得できませんでした'},502);
  data.evaluation=evaluation;await db.prepare('UPDATE records SET data=? WHERE id=? AND owner=?').bind(JSON.stringify(data),id,user.userId).run();return reply({evaluation});
 }
 return reply({error:'未対応の操作'},400);
 }catch(e){if(e instanceof BodyLimitError)return reply({error:e.message},413);if(e instanceof SyntaxError)return reply({error:'入力データの形式が正しくありません'},400);return reply({error:'処理に失敗しました。記録を確認してから再実行してください。'},500);}
}
