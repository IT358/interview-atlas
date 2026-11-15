import {fetchTavilyAction} from './tavily-confirmation';
import {tavilyResponseError} from './tavily-test';
import {searchTerms,type SearchConditions} from './grounded-search';
export async function runTavilySearch(c:SearchConditions,key:string,signal:AbortSignal){return runTavilyQuery(searchTerms(c),key,signal)}
export async function runTavilyQuery(query:string,key:string,signal:AbortSignal){
 if(!key.startsWith('tvly-'))throw Error('あなたのTavilyキーをこのブラウザの設定に入れてください。Geminiのキーは使えません。');
 const response=await fetch('https://api.tavily.com/search',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({query,search_depth:'basic',auto_parameters:false,topic:'general',max_results:10,include_answer:false,include_raw_content:false,include_images:false,include_usage:true}),signal});
 if(!response.ok)throw tavilyResponseError(response.status);
 const data:any=await response.json();if(!Array.isArray(data.results))throw Error('Tavilyからの検索結果の形式を読み取れませんでした。');
 const results=data.results.flatMap((r:any)=>{try{const url=new URL(r.url);if(url.protocol!=='https:'&&url.protocol!=='http:')return [];return [{title:String(r.title||url.hostname).slice(0,400),url:url.href,content:String(r.content||'').slice(0,1500),score:typeof r.score==='number'?r.score:null,publishedDate:typeof r.published_date==='string'?r.published_date:null}]}catch{return []}}).slice(0,10);
 return {provider:'Tavily',results,checkedAt:Date.now(),credits:typeof data.usage?.credits==='number'?data.usage.credits:null,query};
}
export async function searchTavily(c:SearchConditions,signal:AbortSignal){const r=await fetchTavilyAction('/api/tavily/search',{conditions:c},{label:'Tavily検索',credits:1,details:'検索語・カテゴリ・案件条件をTavilyへ送信します。'},signal);const d:any=await r.json();if(!r.ok)throw Error(d.error||'Tavily検索に接続できませんでした。');return d}
