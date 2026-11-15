export const SHARE_COOKIE='atlas-share';
const timingSafeEqual=(a:string,b:string)=>{if(a.length!==b.length)return false;let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);return out===0};
export function shareToken(env?:{SHARE_ACCESS_TOKEN?:string}|null){return String(env?.SHARE_ACCESS_TOKEN||'').trim()}
export function shareEnabled(env?:{SHARE_ACCESS_TOKEN?:string}|null){return shareToken(env).length>=16}
/** Production always gates; local/dev only gates when a token is configured. */
export function shareGateActive(env?:{SHARE_ACCESS_TOKEN?:string}|null){
 if(import.meta.env.PROD)return true;
 return shareEnabled(env);
}
export function requestHasValidShareQuery(req:Request,env?:{SHARE_ACCESS_TOKEN?:string}|null){
 const expected=shareToken(env);
 if(!expected||expected.length<16)return false;
 const query=new URL(req.url).searchParams.get('access')||'';
 return timingSafeEqual(query,expected);
}
export function requestHasShareAccess(req:Request,env?:{SHARE_ACCESS_TOKEN?:string}|null){
 const expected=shareToken(env);
 if(!expected||expected.length<16)return false;
 const cookie=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(SHARE_COOKIE+'='))?.slice(SHARE_COOKIE.length+1)||'';
 const query=new URL(req.url).searchParams.get('access')||'';
 return timingSafeEqual(decodeURIComponent(cookie),expected)||timingSafeEqual(query,expected);
}
export function shareCookieHeader(token:string,secure:boolean){
 return `${SHARE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${secure?'; Secure':''}`;
}
export function shareGateHtml(){
 return `<!doctype html><html lang="ja"><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>アクセス制限 | Interview Atlas</title><body style="margin:0;font-family:DM Sans,Noto Sans JP,sans-serif;background:#f6f7f4;color:#23313c;display:grid;place-items:center;min-height:100vh;padding:24px"><main style="max-width:420px;background:#fff;border:1px solid #dbe4dd;border-radius:16px;padding:28px 24px;box-shadow:0 3px 16px #183c2511"><p style="margin:0 0 8px;font-size:12px;color:#536a5e;letter-spacing:.08em">URL LIMITED ACCESS</p><h1 style="margin:0 0 12px;font-size:22px;letter-spacing:-.4px">このURLは招待制です</h1><p style="margin:0;line-height:1.8;font-size:14px;color:#4d664f">共有リンク（access付き）から開いてください。課金が必要になった操作は止まり、<strong>深夜特急の承認待ち</strong>と表示されます。</p></main></body></html>`;
}
