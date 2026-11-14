export class TavilyTestError extends Error {constructor(message:string,public status=400){super(message)}}
export function tavilyResponseError(status:number){
 const messages:Record<number,string>={401:'APIキーが正しくありません。Tavilyからコピーし直して保存してください。',403:'Tavily側でこのキーの利用が許可されていません。公式画面でキーの状態を確認してください。',429:'Tavilyの回数制限に達しました。時間を置いてから実行してください。',432:'Tavilyの利用枠に達しました。公式画面で残量と契約をご確認ください。',433:'Tavilyの利用上限に達しました。公式画面で残量と契約をご確認ください。',434:'Tavilyが一時的に利用できません。時間を置いてから実行してください。'};
 return new TavilyTestError(messages[status]||`Tavilyからエラーが返りました（HTTP ${status}）。自動再試行はしません。`,status===401?400:status===403?403:[429,432,433].includes(status)?429:502);
}
export async function runConfirmedTavilyTest(key:string,request:typeof fetch=fetch){
 let result:Response;try{result=await request('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({query:'WordPress',search_depth:'basic',auto_parameters:false,max_results:1,include_answer:false,include_raw_content:false,include_images:false,include_usage:true}),signal:AbortSignal.timeout(15000),redirect:'manual'});}catch{throw new TavilyTestError('Tavilyへの送信中に通信エラーが発生しました。実行・消費の有無は不明です。再実行前に公式画面の利用履歴をご確認ください。自動再試行はしません。',502)}
 if(!result.ok)throw tavilyResponseError(result.status);
 let data:any;try{data=await result.json()}catch{throw new TavilyTestError('Tavilyの応答を読み取れませんでした。消費済みの可能性があります。公式画面の利用履歴をご確認ください。',502)}
 if(!Array.isArray(data.results))throw new TavilyTestError('Tavilyの応答形式を確認できませんでした。再実行前に公式画面の利用履歴をご確認ください。',502);
 return {ok:true,credits:data.usage?.credits??1,checkedAt:Date.now()};
}
