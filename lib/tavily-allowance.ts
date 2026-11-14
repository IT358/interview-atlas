// Account usage comes from Tavily, never a browser-local search counter.
import {BILLING_HOLD_CODE,BILLING_HOLD_MESSAGE,ownerBillingApproved} from './cost-policy';
export type TavilyPermit={credits:number;freeCreditsBefore:number|null;release:()=>Promise<void>};
export class TavilyAllowanceError extends Error {
 constructor(message:string,public status=402,public code='TAVILY_CONFIRMATION_REQUIRED',public freeCreditsRemaining:number|null=null){super(message)}
}
const number=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
export function freeTavilyCredits(data:any):number|null{
 const account=data?.account,plan=String(account?.current_plan||'').trim().toLowerCase();
 const used=number(account?.plan_usage),limit=number(account?.plan_limit),paygo=number(account?.paygo_usage);
 // A key limit is a spending cap, not the account's free allowance.
 if(!['researcher','free'].includes(plan)||used===null||limit===null||limit>1000||limit===0||paygo===null||paygo>0)return null;
 return Math.max(0,Math.floor(limit-used));
}
function billingHold(remaining:number|null=null){return new TavilyAllowanceError(BILLING_HOLD_MESSAGE,402,BILLING_HOLD_CODE,remaining)}
export async function authorizeTavily({key,db,initiated,confirmed,credits,minimumCredits=credits,request=fetch,env}:{key:string;db:any;initiated?:boolean;confirmed?:boolean;credits:number;minimumCredits?:number;request?:typeof fetch;env?:{OWNER_BILLING_APPROVED?:string}|null}):Promise<TavilyPermit>{
 if(initiated!==true&&confirmed!==true)throw new TavilyAllowanceError('検索・実行ボタンを押してから実行してください。',400,'TAVILY_ACTION_REQUIRED');
 // Paid or unverified use waits for the owner's explicit billing approval.
 if(confirmed===true){
  if(!ownerBillingApproved(env))throw billingHold();
  return {credits,freeCreditsBefore:null,release:async()=>{}};
 }
 let release=async()=>{};
 try{
  // Serialize this app's automatic free actions for the same provider key.
  // The existing receipt table also holds short-lived, token-owned leases.
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));
  const owner='tavily:allowance:'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  const token=crypto.randomUUID(),now=Date.now();
  const claim=await db.prepare('INSERT INTO tavily_test_confirmations(owner,token,key_updated,expires,used,last_run) VALUES(?,?,0,?,1,?) ON CONFLICT(owner) DO UPDATE SET token=excluded.token,expires=excluded.expires,last_run=excluded.last_run WHERE tavily_test_confirmations.expires<=?').bind(owner,token,now+120000,now,now).run();
  if(!claim.meta.changes)throw new TavilyAllowanceError('同じTavilyキーの検索を実行中です。完了後に検索ボタンを押してください。',409,'TAVILY_ACTION_BUSY');
  release=async()=>{try{await db.prepare('DELETE FROM tavily_test_confirmations WHERE owner=? AND token=?').bind(owner,token).run()}catch{/* The lease expires even if storage is temporarily unavailable. */}};
  const response=await request('https://api.tavily.com/usage',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(8000),redirect:'manual',cache:'no-store'});
  if(response.status===401)throw new TavilyAllowanceError('APIキーが正しくありません。Tavilyからコピーし直して保存してください。',400,'TAVILY_INVALID_KEY');
  if(!response.ok)throw billingHold();
  const remaining=freeTavilyCredits(await response.json());
  if(remaining===null)throw billingHold();
  if(remaining<minimumCredits)throw billingHold(remaining);
  return {credits:Math.min(credits,remaining),freeCreditsBefore:remaining,release};
 }catch(e){
  await release();
  if(e instanceof TavilyAllowanceError)throw e;
  throw billingHold();
 }
}
