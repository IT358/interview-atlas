export type TavilyAction={label:string;credits:number;details:string;confirmed?:boolean};
// Called only by an explicit button action. The first POST performs the server
// allowance check; a 402 response guarantees no billable search was submitted.
export async function fetchTavilyAction(url:string,payload:Record<string,unknown>,action:TavilyAction,signal?:AbortSignal):Promise<Response>{
 const send=()=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,initiated:true,confirmed:action.confirmed===true}),signal});
 let response=await send();
 if(response.status!==402)return response;
 const data:any=await response.clone().json();
 if(data.code!=='TAVILY_CONFIRMATION_REQUIRED')return response;
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 const accepted=window.confirm(`${data.error}\n\n${action.label}を実行しますか？\n最大${action.credits}回・${action.credits}クレジット。料金が発生する場合があります。\n\n${action.details}\n\nOK：今回だけ実行／キャンセル：検索を送信しない`);
 if(!accepted)throw Error('キャンセルしました。この回のTavily検索は送信していません。');
 if(signal?.aborted)throw new DOMException('Aborted','AbortError');
 action.confirmed=true;
 return send();
}
