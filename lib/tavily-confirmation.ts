import {getTavilyBrowserConsent,getTavilyBrowserKey} from './browser-keys';

export type TavilyAction={label:string;credits:number;details:string;confirmed?:boolean};
// Called only by an explicit button action. The first POST performs the server
// allowance check; a 402 response guarantees no billable search was submitted.
// The browser key is sent for this request only and is never logged here.
export async function fetchTavilyAction(url:string,payload:Record<string,unknown>,action:TavilyAction,signal?:AbortSignal):Promise<Response>{
 const key=getTavilyBrowserKey();
 const consent=getTavilyBrowserConsent();
 const send=()=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,key,consent,initiated:true,confirmed:action.confirmed===true}),signal});
 let response=await send();
 if(response.status!==402)return response;
 const data:any=await response.clone().json();
 if(data.code==='BILLING_HOLD')throw Error(data.error||'これ以降は課金が必要なので深夜特急の承認待ちです');
 if(data.code!=='TAVILY_CONFIRMATION_REQUIRED')return response;
 // Legacy confirmation path is disabled while billing stays owner-gated.
 throw Error(data.error||'これ以降は課金が必要なので深夜特急の承認待ちです');
}
