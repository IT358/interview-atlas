/** Extract a one-shot API key from a request body. Never log the returned value. */
export class RequestApiKeyError extends Error{
 status:number;
 constructor(message:string,status=400){
  super(message);
  this.name='RequestApiKeyError';
  this.status=status;
 }
}

export function tavilyKeyFromRequest(data:unknown){
 const body=(data&&typeof data==='object'?data:{}) as Record<string,unknown>;
 const key=String(body.key||'').trim();
 if(!key||key.length<20||key.length>512||/\s/.test(key)||!key.startsWith('tvly-')){
  throw new RequestApiKeyError('あなたのTavilyキーをこのブラウザの設定に入れてから実行してください。');
 }
 if(body.consent!==true){
  throw new RequestApiKeyError('Tavilyへの送信内容への同意が必要です。設定で確認してください。');
 }
 return key;
}

export function geminiKeyFromRequest(data:{key?:unknown;consent?:unknown;model?:unknown}){
 const key=String(data.key||'').trim();
 if(!key||key.length<20||key.length>512||/\s/.test(key)){
  throw new RequestApiKeyError('あなたのGeminiキーをこのブラウザの設定に入れてから実行してください。');
 }
 if(data.consent!==true&&data.consent!=='true'){
  throw new RequestApiKeyError('Googleへの送信内容への同意が必要です。設定で確認してください。');
 }
 const model=String(data.model||'gemini-2.5-flash').trim();
 if(!/^gemini-[a-z0-9.-]{1,80}$/.test(model)){
  throw new RequestApiKeyError('モデルIDを確認してください。');
 }
 return {key,model};
}
