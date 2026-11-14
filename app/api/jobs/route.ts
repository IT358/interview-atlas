import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {readCatalog,refreshFeeds} from '../../../lib/job-feed';
export const dynamic='force-dynamic';
const reply=(d:any,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'no-store'}});
// Read-through cache: only fixed public upstream sources; visitors cannot supply URLs or records.
export async function GET(){try{const results=await refreshFeeds(env.DB!);return reply({results,...await readCatalog(env.DB!)})}catch{return reply({error:'案件データを読み込めませんでした。',jobs:[],sources:[]},503)}}
export async function POST(req:Request){
 const configured=(env as any).JOB_REFRESH_TOKEN;const token=req.headers.get('x-job-refresh-token');const service=!!configured&&token===configured;
 if(!service){const user=await getChatGPTUser();if(!user)return reply({error:'更新にはログインが必要です。自動更新済みの案件はログインなしで閲覧できます。'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'不正なアクセス'},403);}
 try{return reply({results:await refreshFeeds(env.DB!),...await readCatalog(env.DB!)})}catch{return reply({error:'更新処理に失敗しました。保存済みの案件は保持されています。'},503)}
}
