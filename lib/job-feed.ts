import {jobCategories} from './job-categories';
import {JAPAN_SOURCE,fetchJapanJobs} from './japan-feed';
import {himalayaJob,jobicyJob,arbeitnowJob,development,languageConditions} from './job-normalize';
async function json(url:string){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('取得元 HTTP '+r.status);return r.json() as Promise<any>}
export async function refreshFeeds(db:D1Database){
 const now=Date.now(),interval=24*3600000;const deadline=now+20000;const results:any[]=[];
 await Promise.all(['Himalayas','Jobicy','Arbeitnow','Arbeitnow UK',JAPAN_SOURCE,'為替'].map(async source=>{
 await db.prepare('INSERT OR IGNORE INTO feed_state(id,attempt,success,status,meta) VALUES(?,0,0,?,?)').bind(source,'未取得','{}').run();
 const lock=await db.prepare('UPDATE feed_state SET attempt=?,status=? WHERE id=? AND attempt<? AND success<?').bind(now,'取得中',source,now-15*60000,now-(['Jobicy','Arbeitnow','Arbeitnow UK',JAPAN_SOURCE].includes(source)?3*3600000:interval)).run();
 if(!lock.meta.changes){results.push({source,status:'保存済みデータを利用（更新間隔・同時実行制限を適用）'});return}
 try{if(source===JAPAN_SOURCE){
 const {jobs,fetched,pages}=await fetchJapanJobs(now);
 const stmts=jobs.map(j=>db.prepare('INSERT INTO catalog(id,source,data,seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,seen=excluded.seen').bind(j.id,source,JSON.stringify(j),now));
 for(let i=0;i<stmts.length;i+=40)await db.batch(stmts.slice(i,i+40));
 await db.prepare('DELETE FROM catalog WHERE source=? AND seen<?').bind(source,now).run();
 const meta={count:jobs.length,fetched,pages,scope:'日本の公開案件一覧を最大3ページ。開発案件のタイトル・スキル・勤務地・単価のみ。募集終了・経験・居住条件は掲載元で確認。'};
 await db.prepare('UPDATE feed_state SET success=?,status=?,meta=? WHERE id=?').bind(now,'公開一覧取得成功（応募可否は要確認）',JSON.stringify(meta),source).run();results.push({source,...meta});
 }else if(source==='Himalayas'){
 const jobs=new Map<string,any>();let fetched=0;const errors:string[]=[];
 const queries=['Contractor','Part Time'].flatMap(type=>['developer','wordpress','web designer','graphic designer','HTML CSS','AI'].map(q=>({type,q})));
 let cursor=0;
 await Promise.all(Array.from({length:3},async()=>{while(cursor<queries.length){const {type,q}=queries[cursor++];
  for(const page of [1,2,3]){try{if(Date.now()>deadline)throw Error('取得時間の上限に達しました。次回の更新で再確認します。');const u=new URL('https://himalayas.app/jobs/api/search');u.searchParams.set('q',q);u.searchParams.set('employment_type',type);u.searchParams.set('sort','recent');u.searchParams.set('page',String(page));const d=await json(u.href);if(!Array.isArray(d.jobs))throw Error('データ形式が不正');fetched+=d.jobs.length;for(const j of d.jobs){const n=himalayaJob(j,now);if(n)jobs.set(n.id,n)}if(d.jobs.length<20)break}catch(e:any){errors.push(type+'/'+q+': '+e.message);break}}
 }}));
 if(fetched===0&&errors.length)throw Error(errors.slice(0,2).join(' / '));
 const stmts=[...jobs.values()].map(j=>db.prepare('INSERT INTO catalog(id,source,data,seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,seen=excluded.seen').bind(j.id,source,JSON.stringify(j),now));for(let i=0;i<stmts.length;i+=40)await db.batch(stmts.slice(i,i+40));
 const meta={count:jobs.size,fetched,errors,scope:'直近の検索結果を最大720件取得。全件網羅ではありません。'};
 await db.prepare('UPDATE feed_state SET success=?,status=?,meta=? WHERE id=?').bind(now,errors.length?'一部取得失敗':'取得成功',JSON.stringify(meta),source).run();results.push({source,...meta});
 }else if(source==='Jobicy'){
 const raw:any[]=[];let next:string|null=null;let pages=0;
 do{const u=new URL('https://jobicy.com/api/jobs');u.searchParams.set('count','100');if(next)u.searchParams.set('cursor',next);const d=await json(u.href);if(d.success===false||!Array.isArray(d.jobs))throw Error('Jobicyのデータ形式・状態が不正');raw.push(...d.jobs);next=typeof d.nextCursor==='string'?d.nextCursor:null;pages++;}while(next&&pages<10&&Date.now()<deadline);
 const candidates=raw.filter(j=>development(String(j.jobTitle||''))&&/(contract|freelance|part[ -]?time)/i.test((j.jobType||[]).join(' '))&&Number.isSafeInteger(j.id)&&j.id>0);
 const old=await db.prepare('SELECT id,data FROM catalog WHERE source=?').bind(source).all();const checkIds=[...new Set([...candidates.map(j=>j.id),...old.results.map((r:any)=>JSON.parse(r.data).providerId)])].filter(id=>Number.isSafeInteger(id)&&id>0);
 const active=new Set<number>();for(let i=0;i<checkIds.length;i+=100){const ids=checkIds.slice(i,i+100);const d=await json('https://jobicy.com/api/jobs/status?ids='+ids.join(','));if(d.success===false||!Array.isArray(d.jobs))throw Error('募集状態を確認できませんでした');for(const j of d.jobs)if(j.status==='active')active.add(j.id);}
 const jobs=candidates.map(j=>jobicyJob(j,active.has(j.id),now)).filter(Boolean);const unique=new Map<string,any>();for(const r of old.results as any[]){const j=JSON.parse(r.data);if(active.has(j.providerId))unique.set(j.id,{...j,checkedAt:now,expires:now+26*3600000})}for(const j of jobs)if(j)unique.set(j.id,j);
 const stmts=[...unique.values()].map(j=>db.prepare('INSERT INTO catalog(id,source,data,seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,seen=excluded.seen').bind(j.id,source,JSON.stringify(j),now));for(let i=0;i<stmts.length;i+=40)await db.batch(stmts.slice(i,i+40));
 // Only explicitly active IDs survive this source's successful status check.
 const remove=old.results.filter((r:any)=>!active.has(JSON.parse(r.data).providerId)).map((r:any)=>db.prepare('DELETE FROM catalog WHERE id=? AND source=?').bind(r.id,source));for(let i=0;i<remove.length;i+=40)await db.batch(remove.slice(i,i+40));
 const meta={count:unique.size,fetched:raw.length,pages,hasMore:!!next,scope:'直近7日・最大1000件。募集状態がactiveの業務委託・パート開発職のみ。'};
 await db.prepare('UPDATE feed_state SET success=?,status=?,meta=? WHERE id=?').bind(now,'取得成功',JSON.stringify(meta),source).run();results.push({source,...meta});
 }else if(source==='Arbeitnow'||source==='Arbeitnow UK'){
 const host=source==='Arbeitnow UK'?'www.arbeitnow.co.uk':'www.arbeitnow.com';const jobs=new Map<string,any>();let fetched=0,pages=0,hasMore=false;
 for(let page=1;page<=3;page++){
  const d=await json('https://'+host+'/api/job-board-api?page='+page);if(!Array.isArray(d.data))throw Error('掲載元のデータ形式が不正');
  fetched+=d.data.length;pages++;for(const raw of d.data){const job=arbeitnowJob(raw,source,now);if(job)jobs.set(job.id,job)}
  hasMore=typeof d.links?.next==='string';if(!hasMore||Date.now()>deadline)break;
 }
 const stmts=[...jobs.values()].map(j=>db.prepare('INSERT INTO catalog(id,source,data,seen) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET source=excluded.source,data=excluded.data,seen=excluded.seen').bind(j.id,source,JSON.stringify(j),now));for(let i=0;i<stmts.length;i+=40)await db.batch(stmts.slice(i,i+40));
 // Only retain positions present in this successful public feed snapshot.
 await db.prepare('DELETE FROM catalog WHERE source=? AND seen<?').bind(source,now).run();
 const meta={count:jobs.size,fetched,pages,hasMore,scope:'公開API最大3ページ。明示された業務委託・パート開発職のみ。居住・英語条件は要確認。'};
 await db.prepare('UPDATE feed_state SET success=?,status=?,meta=? WHERE id=?').bind(now,hasMore?'取得成功（取得上限あり）':'取得成功',JSON.stringify(meta),source).run();results.push({source,...meta});
 }else{const d=await json('https://api.frankfurter.dev/v1/latest?base=JPY');if(!d.rates||!d.date)throw Error('為替形式が不正');await db.prepare('UPDATE feed_state SET success=?,status=?,meta=? WHERE id=?').bind(now,'取得成功',JSON.stringify({date:d.date,base:'JPY',rates:d.rates}),source).run();results.push({source,date:d.date});}
 }catch(e:any){await db.prepare('UPDATE feed_state SET status=? WHERE id=?').bind('取得失敗: '+e.message,source).run();results.push({source,error:e.message})}
 }));
 return results;
}
export async function readCatalog(db:D1Database){
 const rows=await db.prepare('SELECT data FROM catalog ORDER BY seen DESC LIMIT 2000').all();const states=await db.prepare('SELECT * FROM feed_state').all();const now=Date.now();
 const jobs=rows.results.map((r:any)=>JSON.parse(r.data)).filter(j=>j.expires>now&&j.checkedAt>now-26*3600000&&development(j.title)).map(j=>({...j,categories:jobCategories(j),category:jobCategories(j)[0]||j.category,...languageConditions(j.title,j.description)}));
 const sources=states.results.map((r:any)=>{const meta=JSON.parse(r.meta);return {...r,status:r.status==='取得中'&&now-r.attempt>120000?'更新が中断されました。15分の待機後に再試行します。':r.status,meta:['Himalayas','Jobicy','Arbeitnow','Arbeitnow UK',JAPAN_SOURCE].includes(r.id)?{...meta,importedCount:meta.count,count:jobs.filter(j=>j.source===r.id).length}:meta}});
 return {jobs,sources:sources.map((s:any)=>({...s,intervalHours:['Himalayas','為替'].includes(s.id)?24:3,nextRefreshAt:Math.max((s.success||0)+(['Himalayas','為替'].includes(s.id)?24:3)*3600000,(s.attempt||0)+15*60000)})),asOf:now};
}
