import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../chatgpt-auth';
import {readCatalog,refreshFeeds} from '../../lib/job-feed';
export const dynamic='force-dynamic';
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Authentication required'},{status:401});
 let r:any;try{r=await req.json()}catch{return Response.json({error:'Invalid JSON'},{status:400})}
 const out=(result:any)=>Response.json({jsonrpc:'2.0',id:r.id??null,result});
 if(r.method==='server/discover')return out({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(r.method==='initialize')return out({protocolVersion:'2026-07-28',capabilities:{tools:{}},serverInfo:{name:'interview-atlas',version:'2.0.0'}});
 if(r.method==='notifications/initialized')return new Response(null,{status:202});
 if(r.method==='tools/list')return out({tools:[{name:'job_catalog_status',description:'Read public job catalog counts and source refresh state. No private records are included.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true}},{name:'refresh_job_catalog',description:'Refresh the public development contract and part-time job catalog from fixed allowed APIs and Japanese public listing pages. Enforces per-source refresh intervals (3 or 24 hours) and never sends email or changes private user records.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,idempotentHint:true,destructiveHint:false}}]});
 if(r.method==='tools/call'){try{if(!['job_catalog_status','refresh_job_catalog'].includes(r.params?.name))throw Error('Unknown tool');const results=r.params.name==='refresh_job_catalog'?await refreshFeeds(env.DB!):undefined;const data=await readCatalog(env.DB!);return out({content:[{type:'text',text:JSON.stringify({count:data.jobs.length,results,sources:data.sources,asOf:data.asOf})}]})}catch(e:any){return out({isError:true,content:[{type:'text',text:e.message||'Failed'}]})}}
 return Response.json({jsonrpc:'2.0',id:r.id??null,error:{code:-32601,message:'Method not found'}});
}
