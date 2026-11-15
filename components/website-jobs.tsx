'use client';
import {useEffect,useRef,useState} from 'react';
import {Search,SlidersHorizontal,ArrowUpRight,Bookmark,Check,RotateCcw,Globe2,ArrowRight,BriefcaseBusiness,ShieldCheck} from 'lucide-react';
import {fetchTavilyAction} from '../lib/tavily-confirmation';
import ProfessionPicker from './profession-picker';
import SourceConnections from './source-connections';
import {emptySearch,googleSearchUrl} from '../lib/grounded-search';
import {filterWebsiteJobs} from '../lib/verified-website-jobs';
import {freelanceSites,directSiteNames} from '../lib/freelance-sites';
import {professions,professionFamilies,professionForCategory,projectProfessions} from '../lib/professions';
import {mergeSearchBatch,mergeUniqueJobs,sessionMatchTotals} from '../lib/website-job-session';
const yen=(n:number)=>new Intl.NumberFormat('ja-JP').format(n);
const initial={...emptySearch,cat:'Web制作全般',market:''};
const periodName:Record<string,string>={fixed:'固定報酬',hourly:'時給',character:'文字単価'};
function scopeLabel(cat:string){return professionForCategory(cat)?.label||professionFamilies.find(f=>f.category===cat)?.label||cat||'全分野'}
export default function WebsiteJobs({tavilyReady,onSettings,onSave}:{tavilyReady:boolean;onSettings:()=>void;onSave:(j:any)=>Promise<void>;onRegister:(j:any)=>void}){
 const [hydrated,setHydrated]=useState(false);
 const [conditions,setConditions]=useState({...initial}),[applied,setApplied]=useState({...initial}),[mode,setMode]=useState('live'),[appliedMode,setAppliedMode]=useState('researched');
 const [catalog,setCatalog]=useState<any[]>([]),[jobs,setJobs]=useState<any[]>([]),[overflow,setOverflow]=useState<any[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState('案件を読み込んでいます…'),[diagnostics,setDiagnostics]=useState<any>(null);
 const [action,setAction]=useState(''),[savedConditions,setSavedConditions]=useState<any>(null),[selected,setSelected]=useState(''),[saving,setSaving]=useState(''),[savedUrls,setSavedUrls]=useState<string[]>([]);
 const [planOffset,setPlanOffset]=useState(0),[creditsSpent,setCreditsSpent]=useState(0);
 const abort=useRef<AbortController|null>(null),revision=useRef(0);
 const [handoffReady,setHandoffReady]=useState(false);
 useEffect(()=>{
  let live=true;const current=revision.current;const ctl=new AbortController();let fromTavily=false;let restored=false;
  try{
   const saved=JSON.parse(localStorage.getItem('atlas-search-preset')||'null');if(saved)setSavedConditions(saved);
   // Keep search results across reload (sessionStorage survives refresh). Only clear one-shot navigation handoffs.
   const reload=(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type==='reload';
   if(reload){sessionStorage.removeItem('atlas-website-return');sessionStorage.removeItem('atlas-tavily-handoff')}
   else{
    const back=JSON.parse(sessionStorage.getItem('atlas-website-return')||'null');sessionStorage.removeItem('atlas-website-return');if(back?.conditions){setConditions({...initial,...back.conditions});setMode(back.mode==='web'?'web':'live')}
    const handoff=JSON.parse(sessionStorage.getItem('atlas-tavily-handoff')||'null');sessionStorage.removeItem('atlas-tavily-handoff');if(handoff?.focus){fromTavily=true;setMode(handoff.mode==='web'?'web':'live');setHandoffReady(true);setMessage('追加検索の準備ができました。分野を選んで「この条件で探す」を押してください。')}
   }
   const kept=JSON.parse(sessionStorage.getItem('atlas-website-results')||'null');
   if(kept?.jobs?.length&&current===revision.current){
    restored=true;
    const restoredApplied={...initial,...(kept.applied||{})};
    const restoredMode=kept.mode==='web'||kept.appliedMode==='web'?'web':kept.mode==='researched'||kept.appliedMode==='researched'?'researched':'live';
    const restoredJobs=kept.jobs||[];
    const restoredOverflow=Array.isArray(kept.overflow)?kept.overflow:[];
    // Message must match the result heading: count only jobs that remain displayable after the same filter.
    const visibleCount=filterWebsiteJobs(restoredJobs,restoredApplied,{allowStale:true}).length;
    setJobs(restoredJobs);setOverflow(restoredOverflow);setCatalog(Array.isArray(kept.catalog)&&kept.catalog.length?kept.catalog:restoredJobs);
    setApplied(restoredApplied);setConditions(kept.conditions?{...initial,...kept.conditions}:restoredApplied);
    setMode(restoredMode);setAppliedMode(kept.appliedMode||(restoredMode==='web'?'web':restoredMode==='researched'?'researched':'live'));
    setDiagnostics(kept.diagnostics||null);setPlanOffset(Number(kept.planOffset)||0);setCreditsSpent(Number(kept.creditsSpent)||0);
    if(visibleCount>0){
     setMessage(`前回の結果 ${visibleCount}件を復元しました。${restoredOverflow.length?`まだ見ていない案件が ${restoredOverflow.length}件あります。`:''}`);
    }else{
     setMessage(`前回の保存 ${restoredJobs.length}件を読み込みましたが、応募期限切れや情報不足のため、いま表示できる案件は0件です。「この条件で探す」で新しく探してください。`);
    }
   }
  }catch{}
  setHydrated(true);
  if(restored){setLoading(false);return()=>{live=false;ctl.abort();revision.current++;abort.current?.abort()}}
  fetch('/api/website-jobs?cat=Web制作全般',{signal:ctl.signal}).then(async r=>{const d:any=await r.json();if(!r.ok)throw Error(d.error||'案件を読み込めませんでした。');if(!live)return;setCatalog(d.jobs||[]);if(current===revision.current){setJobs(d.jobs||[]);setOverflow([]);if(!fromTavily)setMessage(d.jobs?.length?`いま ${d.jobs.length}件あります。分野を選んで「この条件で探す」を押すと、新しい募集を確認できます。`:'分野を選んで「この条件で探す」を押してください。')}}).catch(e=>{if(live&&e.name!=='AbortError')setMessage(e.message||'案件を読み込めませんでした。')}).finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;ctl.abort();revision.current++;abort.current?.abort()};
 },[]);
 useEffect(()=>{
  if(!hydrated||loading)return;
  try{sessionStorage.setItem('atlas-website-results',JSON.stringify({jobs,overflow,catalog,conditions,applied,mode,appliedMode,diagnostics,planOffset,creditsSpent,savedAt:Date.now()}))}catch{}
 },[hydrated,loading,jobs,overflow,catalog,conditions,applied,mode,appliedMode,diagnostics,planOffset,creditsSpent]);
 useEffect(()=>{
  if(!handoffReady||!hydrated)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target=document.getElementById('website-search-handoff')||document.getElementById('website-search-composer');
  const form=document.getElementById('website-search-composer');
  const input=document.getElementById('website-keyword') as HTMLInputElement|null;
  const timer=window.setTimeout(()=>{
   target?.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
   form?.classList.add('search-composer-ready');
   input?.focus({preventScroll:true});
   window.setTimeout(()=>form?.classList.remove('search-composer-ready'),1800);
  },reduce?0:120);
  return()=>window.clearTimeout(timer);
 },[handoffReady,hydrated]);
 // Session-held jobs stay visible across the same tab even after the 24h live window; expired deadlines still drop.
 const shown=filterWebsiteJobs(appliedMode==='researched'?catalog:jobs,applied,{allowStale:true}),dirty=JSON.stringify(conditions)!==JSON.stringify(applied);
 const role=professionForCategory(conditions.cat),skillOptions=role?.skills||[...new Set(professions.filter(p=>professionFamilies.find(f=>f.category===conditions.cat)?.id===p.family).flatMap(p=>p.skills))];
 function invalidate(){revision.current++;abort.current?.abort();setBusy(false);setAction('')}
 function change(k:string,v:string){invalidate();setPlanOffset(0);if(k==='market'&&v==='海外'&&mode==='web'){setMode('live');setConditions(c=>({...c,market:v,source:''}));setMessage('海外の案件は「かんたん検索」で探します。');return}setConditions(c=>({...c,[k]:v,...(k==='market'?{source:''}:{}),...(k==='cat'?{skill:''}:{})}))}
 function switchMode(next:string){invalidate();setPlanOffset(0);setMode(next);if(next==='web'&&conditions.source==='Freelancer.com')setConditions(c=>({...c,source:''}));setMessage('探し方を変えました。「この条件で探す」を押すと反映されます。')}
 function remember(){setAction('save');try{localStorage.setItem('atlas-search-preset',JSON.stringify(conditions));setSavedConditions({...conditions});setMessage('いまの条件をこの端末に覚えました。')}catch{setMessage('条件を覚えられませんでした。')}}
 function reset(){invalidate();setPlanOffset(0);setConditions({...initial});setAction('reset');setMessage('条件を最初の状態に戻しました。「この条件で探す」で反映します。')}
 function showResults(){requestAnimationFrame(()=>document.getElementById('website-results')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}))}
 function settings(){try{sessionStorage.setItem('atlas-website-return',JSON.stringify({conditions,mode}))}catch{}onSettings()}
 function modeLabel(m:string){return m==='web'?'追加で探す（キーあり）':m==='researched'?'いまの結果だけ見る':'かんたん検索（キーなし）'}
 function userSummary(found:number,shownNow:number,carry:number,spent:number,freeCredits?:number,warnings?:string[]){
  // found=条件一致の合計、shownNow=いま画面に出している件数（サマリーの「表示中」と揃える）
  const parts=[`${found}件見つかりました`,`いま${shownNow}件を表示中です`];
  if(carry)parts.push(`まだ見ていない案件 ${carry}件`);
  if(spent)parts.push(`追加検索で ${spent}クレジット使用`);
  if(typeof freeCredits==='number')parts.push(`検索前の無料残量 ${freeCredits.toLocaleString('ja-JP')}クレジット`);
  if(warnings?.length)parts.push(warnings.join(' '));
  return parts.join(' · ');
 }
 function mergeUnique(...lists:any[][]){return mergeUniqueJobs(...lists)}
 function sessionTotals(list:any[],c:typeof conditions,carry:any[]){return sessionMatchTotals(list,c,carry)}
 async function load(refresh=false,e?:React.FormEvent,loadMore=false){
  e?.preventDefault();if(busy)return;const useWeb=mode==='web'&&!refresh;
  if(useWeb&&!tavilyReady){setMessage('追加検索にはキー設定が必要です。まずは「かんたん検索（キーなし）」で探せます。');return}
  // 新規discoverは置換。Tavily追加検索は既存・繰越・planOffset・累計APIを保持する。
  if(!loadMore){
   invalidate();
   if(!useWeb){setOverflow([]);setPlanOffset(0);setCreditsSpent(0)}
  }
  const rev=revision.current;setAction(loadMore?'more':'search');setSelected('');
  if(mode==='researched'&&!refresh){setApplied({...conditions});setAppliedMode(mode);setDiagnostics(null);setMessage(`いま持っている結果から ${filterWebsiteJobs(catalog,conditions).length}件が条件に合います。新しい募集は「かんたん検索」で探してください。`);showResults();return}
  // Drain deferred overflow first — display-cap holdback, not exclusions. No API cost.
  if(loadMore&&overflow.length){
   const promote=overflow.slice(0,30),rest=overflow.slice(30);
   const merged=mergeUnique(jobs,promote);setJobs(merged);setOverflow(rest);
   const saved=mergeUnique(catalog,merged).slice(-1000);setCatalog(saved);
   const totals=sessionTotals(saved,conditions,rest);
   const diag={...(diagnostics||{}),scanned:0,verified:0,matched:totals.matched,displayed:totals.displayed,batchDisplayed:promote.length,deferred:rest.length,duplicatesExcluded:0,filterMismatched:0,credits:0,overflow:rest,source:'表示上限で繰り越した確認済み募集',accumulated:totals.accumulated,sourceCounts:totals.sourceCounts};
   setDiagnostics(diag);setApplied({...conditions});
   const visibleNow=filterWebsiteJobs(merged,conditions,{allowStale:true}).length;
   setMessage(`${scopeLabel(conditions.cat)}：あと ${promote.length}件を表示しました。${userSummary(totals.matched,visibleNow,rest.length,creditsSpent)}`);showResults();setBusy(false);setAction('');return;
  }
  const ctl=new AbortController();abort.current=ctl;const timer=setTimeout(()=>ctl.abort(),65000);setBusy(true);setMessage(`${scopeLabel(conditions.cat)}の案件を${loadMore||useWeb?'追加で':''}確認しています…`);
  try{
   const offset=loadMore||useWeb?planOffset:0;
   const excludeUrls=(loadMore||useWeb)?mergeUnique(jobs,catalog,overflow).map(j=>j.url).slice(0,1000):[];
   const additive=useWeb||loadMore;
   const params=new URLSearchParams({...conditions,discover:'1',refresh:refresh?'1':'0'});
   if(excludeUrls.length)params.set('exclude',excludeUrls.join(','));
   const r=useWeb?await fetchTavilyAction('/api/website-jobs',{conditions,loadMore:additive&&excludeUrls.length>0,excludeUrls,planOffset:offset},{label:loadMore?'ほかの案件も見る':'追加で探す',credits:2,details:loadMore?'すでに表示したURLを除き、別の検索を最大2回行います。':'分野に合わせて検索し、いまある案件は残したまま追加します。'},ctl.signal):await fetch('/api/website-jobs?'+params.toString(),{signal:ctl.signal});
   const d:any=await r.json();if(!r.ok)throw Error(d.error||'検索できませんでした。');if(rev!==revision.current)return;
   const next=d.jobs||[],held=d.overflow||[];
   // live新規discoverは置換。Tavily/追加取得は catalog を含めて統合し既存有効を落とさない。
   const {merged,nextOverflow,saved}=mergeSearchBatch({additive,catalog,jobs,next,overflow,held,excludedUrls:d.excludedUrls||[]});
   const spent=creditsSpent+(d.credits||0);setCreditsSpent(spent);
   if(useWeb){const usedPlans=Array.isArray(d.queries)?d.queries.length:2;setPlanOffset(offset+usedPlans)}
   const totals=sessionTotals(saved,conditions,nextOverflow);
   setJobs(filterWebsiteJobs(merged,conditions));setOverflow(nextOverflow);setCatalog(saved);
   setApplied({...conditions});setAppliedMode(useWeb?'web':'live');
   const batchVerified=d.verified??d.stats?.verified??0;
   const batchScanned=d.scanned??d.stats?.scanned??0;
   const visibleNow=filterWebsiteJobs(merged,conditions,{allowStale:true}).length;
   setDiagnostics({...d,scanned:batchScanned,verified:batchVerified,matched:totals.matched,displayed:totals.displayed,batchDisplayed:next.length,deferred:nextOverflow.length,overflow:nextOverflow,accumulated:totals.accumulated,sourceCounts:totals.sourceCounts,creditsSpent:spent});
   setMessage(`${scopeLabel(conditions.cat)}：${userSummary(totals.matched,visibleNow,nextOverflow.length,spent,d.freeCreditsBefore,d.warnings)}`);showResults();
  }catch(e:any){if(rev===revision.current){setAction('');setMessage(e.name==='AbortError'?'確認に時間がかかっています。前の結果はそのまま残しています。少し待ってからもう一度探してください。':e.message)}}finally{clearTimeout(timer);if(rev===revision.current)setBusy(false)}
 }
 async function save(j:any){setSaving(j.url);try{await onSave(j);setSavedUrls(u=>[...new Set([...u,j.url])]);setMessage('保存しました。「保存・応募」から確認できます。')}catch(e:any){setMessage(e.message||'保存できませんでした。')}finally{setSaving('')}}
 const freeBefore=typeof diagnostics?.freeCreditsBefore==='number'?diagnostics.freeCreditsBefore:undefined;
 return <div className="website-workspace profession-workspace search-flow">
  <div className="explore-intro search-hero"><div><h1>仕事を探す</h1><p>① 分野を選ぶ → ② 条件を決める → ③ 探す → ④ 保存する</p></div><span className="mode-chip">{mode==='web'?'追加検索':mode==='researched'?'結果のみ':'キーなし'}</span></div>
  <div id="website-search-handoff">
  <div className="quick-presets" aria-label="よく使う職種"><span>よく選ばれる分野</span>{[['WordPress','WordPress制作・修正'],['AI・自動化','AI・自動化全般'],['Webライター','Webライティング'],['QAテスター','QA・テスト']].map(([label,cat])=><button type="button" key={cat} aria-pressed={conditions.cat===cat} onClick={()=>change('cat',cat)}>{label}</button>)}{savedConditions&&<button type="button" aria-pressed={action==='preset'} onClick={()=>{invalidate();setConditions({...initial,...savedConditions});setAction('preset')}}><Bookmark size={13}/>覚えた条件</button>}</div>
  <form id="website-search-composer" className={'panel hub-filters search-composer dense flow-composer'+(handoffReady?' search-composer-arrive':'')} onSubmit={e=>load(false,e)}><fieldset className="search-controls" disabled={!hydrated}>
   <section className="flow-step" aria-labelledby="flow-step-1"><div className="flow-step-head"><span className="flow-num">1</span><h2 id="flow-step-1">探したい仕事を選ぶ</h2></div>
   <ProfessionPicker value={conditions.cat} onChange={v=>change('cat',v)}/></section>
   <section className="flow-step" aria-labelledby="flow-step-2"><div className="flow-step-head"><span className="flow-num">2</span><h2 id="flow-step-2">条件を絞る</h2></div>
   <div className="search-basics flow-basics"><div><label htmlFor="website-market">地域</label><select id="website-market" value={conditions.market} onChange={e=>change('market',e.target.value)}><option value="">日本・海外</option><option value="日本">日本</option><option value="海外">海外</option></select></div><div><label htmlFor="website-source">掲載サイト</label><select id="website-source" value={conditions.source} onChange={e=>change('source',e.target.value)}><option value="">すべての対応サイト</option>{(mode==='web'?['クラウドワークス','ココナラ','ランサーズ','クラウディア']:directSiteNames.filter(name=>!conditions.market||freelanceSites.find(s=>s.name===name)?.market===conditions.market)).map(name=><option key={name}>{name}</option>)}</select></div><div><label htmlFor="website-mode">探し方</label><select id="website-mode" value={mode} onChange={e=>switchMode(e.target.value)}><option value="live">かんたん検索（キーなし）</option><option value="web">追加で探す（キーあり）</option><option value="researched">いまの結果だけ見る</option></select></div></div>
   <details className="extra-filters advanced-search"><summary><SlidersHorizontal size={16}/>もっと細かく指定する <small>キーワード・経験・報酬・スキル</small></summary>
   <div className="filter-grid flow-extra"><div className="keyword-field"><label htmlFor="website-keyword">キーワード <small>任意</small></label><input id="website-keyword" value={conditions.q} onChange={e=>change('q',e.target.value)} maxLength={300} placeholder="例：React、英日翻訳、Instagram"/></div><div><label htmlFor="website-exp">経験</label><select id="website-exp" value={conditions.exp} onChange={e=>change('exp',e.target.value)}><option value="">指定なし</option><option>未経験可</option><option>経験必須</option><option>条件併記・要確認</option><option>記載なし</option></select></div><div><label htmlFor="website-pay-unit">報酬の種類</label><select id="website-pay-unit" value={conditions.period} onChange={e=>change('period',e.target.value)}><option value="">指定なし</option>{Object.entries(periodName).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div><div><label htmlFor="website-pay">最低報酬 <small>円のみ</small></label><select id="website-pay" value={conditions.minimum} onChange={e=>change('minimum',e.target.value)}><option value="">指定なし</option>{[10000,30000,50000,100000].map(n=><option key={n} value={n}>{yen(n)}円以上</option>)}</select></div><div><label htmlFor="website-skill">スキル</label><select id="website-skill" value={conditions.skill} onChange={e=>change('skill',e.target.value)}><option value="">指定なし</option>{[...new Set([...(skillOptions.length?skillOptions:['HTML','CSS','React','Python','Figma','SEO']),conditions.skill].filter(Boolean))].map(s=><option key={s}>{s}</option>)}</select></div></div>
   {mode==='web'&&<p className="advanced-hint">{!tavilyReady?'追加検索にはキー設定が必要です。':'追加検索はボタンを押したときだけ実行します。無料枠がなくなると止まります。'} <button type="button" className="text-button" onClick={settings}>キー設定を開く</button></p>}
   </details></section>
   <section className="flow-step flow-cta" aria-labelledby="flow-step-3"><div className="flow-step-head"><span className="flow-num">3</span><h2 id="flow-step-3">検索する</h2></div>
   <div className="active-scope flow-scope" aria-live="polite">{[scopeLabel(conditions.cat),conditions.market||'日本・海外',modeLabel(mode),conditions.exp,conditions.skill,conditions.minimum&&yen(Number(conditions.minimum))+'円〜'].filter(Boolean).map(x=><span key={x}>{x}</span>)}</div>
   <button type="submit" className="primary search-go search-cta" data-active={action==='search'&&(!dirty||busy)} aria-busy={busy} disabled={busy}><Search size={18}/>{busy?'確認中…':'この条件で探す'}</button>
   <div className="composer-tools flow-tools"><button type="button" data-active={action==='save'} onClick={remember}><Bookmark size={14}/>条件を覚える</button><button type="button" data-active={action==='reset'} onClick={reset}><RotateCcw size={14}/>条件を消す</button></div>
   </section>
  </fieldset></form>
  </div>
  <div className={'search-status'+(busy?' is-busy':'')}><ShieldCheck size={17}/><p className="search-feedback" role="status">{message}</p></div>
  <div className="results-toolbar" id="website-results"><div><span className="tiny-label">けんさく結果</span><h2>{scopeLabel(applied.cat)}<strong>{shown.length}</strong><small>件</small></h2></div><select aria-label="並べ替え" value={applied.sort} onChange={e=>setApplied(c=>({...c,sort:e.target.value}))}><option value="new">新しい順</option><option value="deadline">期限が近い順</option><option value="salary">報酬が高い順</option></select></div>
  <div className="result-summary-bar" aria-label="結果のまとめ">
   <div className="result-summary-main"><span>表示中 <b>{shown.length}</b>件</span>{overflow.length>0&&<span>まだ見ていない <b>{overflow.length}</b>件</span>}{creditsSpent>0&&<span className="credit-note">追加検索 <b>{creditsSpent}</b>クレジット使用</span>}{typeof freeBefore==='number'&&<span className="credit-note">無料残量（検索前） <b>{freeBefore.toLocaleString('ja-JP')}</b></span>}</div>
   <div className="result-context tight"><p>{[applied.market||'日本・海外',applied.source||'複数サイト',applied.q&&'「'+applied.q+'」'].filter(Boolean).join(' / ')}{dirty&&<b>上の条件はまだ反映されていません</b>}</p><button type="button" className="text-button" disabled={busy} onClick={()=>load(true)}>内容を更新<RotateCcw size={13}/></button></div>
  </div>
  {diagnostics?.sourceCounts&&<div className="result-source-counts" aria-label="サイト別の件数">{Object.entries(diagnostics.sourceCounts).map(([name,count])=><span key={name}>{name}<b>{String(count)}件</b></span>)}</div>}
  {loading&&<div className="panel empty" role="status">案件を読み込んでいます…</div>}
  {!loading&&!shown.length&&<div className="panel empty search-empty"><Search size={30}/><h3>条件に合う案件が見つかりませんでした</h3><p>条件を減らすか、「追加で探す」を試してください。</p><a className="secondary" href={googleSearchUrl(conditions)} target="_blank" rel="noreferrer">同じ条件でGoogle検索<ArrowUpRight size={16}/></a></div>}
  <div className="verified-job-grid" aria-busy={busy||loading}>{shown.map(j=>{const roles=projectProfessions(j.title,j.searchText||j.description);const statusLabel=j.recruitmentState==='active'?'受付中':j.verification?.includes('今回の接続は未確認')?'前回確認':'確認済み';const skills=(j.skills||[]).slice(0,4);return <article className="panel verified-job-card compare-card" key={j.url}>
   <div className="job-card-top"><span className="source-mark" aria-hidden="true">{j.source==='クラウドワークス'?'CW':j.source==='ココナラ'?'Co':j.source==='クラウディア'?'Cr':j.source==='ランサーズ'?'La':'Fr'}</span><div><b>{j.source}</b><small>{j.market||'地域は掲載ページで確認'}</small></div><span className="job-type">{periodName[j.period]||'報酬単位は掲載ページで確認'}</span></div>
   <h3><a href={j.url} target="_blank" rel="noreferrer">{j.title}</a></h3>
   <p className="job-budget">{j.salaryText||'報酬：記載なし'}</p>
   <p className="job-client">{j.company||'発注者：記載なし'}</p>
   <dl className="compare-metrics" aria-label="比較しやすいポイント"><div><dt>必要スキル</dt><dd>{skills.length?skills.join(' · '):'記載なし'}</dd></div><div><dt>経験</dt><dd>{j.experience||'記載なし'}</dd></div><div><dt>応募期限</dt><dd>{j.deadline||'掲載ページで確認'}</dd></div><div><dt>状態</dt><dd>{statusLabel}</dd></div></dl>
   {j.eligibilityNote&&<p className="eligibility-note">応募条件：{j.eligibilityNote}</p>}
   <div className="job-role-tags">{roles.slice(0,2).map(r=><span key={r.id}>{r.label}</span>)}</div>
   <p className="job-summary">{j.researchNote||j.description||'概要：記載なし'}</p>
   <div className="actions"><button className="primary" disabled={!!saving||savedUrls.includes(j.url)} data-active={savedUrls.includes(j.url)} onClick={()=>save(j)}>{savedUrls.includes(j.url)?<Check size={15}/>:<Bookmark size={15}/>} {savedUrls.includes(j.url)?'保存済み':saving===j.url?'保存中…':'保存する'}</button><a className="secondary" href={j.url} target="_blank" rel="noreferrer">応募ページを開く<ArrowUpRight size={15}/></a><button className="text-button" data-active={selected===j.url} aria-expanded={selected===j.url} onClick={()=>setSelected(selected===j.url?'':j.url)}>確認メモ</button></div>
   {selected===j.url&&<div className="notice">{j.verification||'確認メモなし'}<br/>{j.verificationEvidence||''}<br/>{j.locationEvidence||'住んでいる場所・通話・応募資格は掲載ページで確認してください。'}</div>}
  </article>})}</div>
  {!loading&&(appliedMode==='live'||(appliedMode==='web'&&(tavilyReady||overflow.length>0)))&&<div className="load-more-panel"><button type="button" className="secondary load-more-btn" disabled={busy||dirty} data-active={action==='more'} onClick={()=>load(false,undefined,true)}><Search size={15}/>{busy&&action==='more'?'確認中…':'ほかの案件も見る'}</button><p className="advanced-hint">{overflow.length?`まずは残っている ${overflow.length}件を表示します（追加検索のクレジットは使いません）。`:appliedMode==='web'?'表示中の案件を残したまま、追加で探します（最大2クレジット/回）。':'表示中の案件以外から、もう一度探します。'}</p></div>}
  <div className="results-footnote">
   <details className="tech-stats"><summary>くわしい検索の内訳（必要なときだけ）</summary>
   {(appliedMode==='web'||appliedMode==='live')&&diagnostics&&<div className="result-source-counts tech" aria-label="くわしい統計"><span>取得候補<b>{String(diagnostics.scanned??0)}</b></span><span>本文確認<b>{String(diagnostics.verified??diagnostics.stats?.verified??0)}</b></span><span>条件一致<b>{String(diagnostics.matched??diagnostics.stats?.matched??shown.length)}</b></span><span>重複除外<b>{String(diagnostics.duplicatesExcluded??0)}</b></span><span>条件不一致<b>{String(diagnostics.filterMismatched??0)}</b></span><span>今回の新規<b>{String(diagnostics.batchDisplayed??0)}</b></span><span>保存中<b>{String(catalog.length)}</b></span><span>累計API<b>{String(creditsSpent)}</b></span></div>}
   <p>1回あたり最大30件を表示します。それ以上は「ほかの案件も見る」で続きを出せます。同じタブなら再読み込み後も結果が残ります。ブラウザを閉じると消えます。</p>
   {diagnostics?.sourceDiagnostics?.length>0&&<details><summary>サイト別の診断</summary><ul>{diagnostics.sourceDiagnostics.map((s:any,i:number)=><li key={i}>{s.sourceFocus}／{s.label}：返却 {s.tavilyReturned??0} · 個別URL {s.detailCandidates??0} · 確認 {s.detailVerified??0} · 不一致 {s.filterMismatched??0} · 重複 {s.duplicates??0} · 消費 {s.credits??0}</li>)}</ul></details>}
   {diagnostics?.queries?.length>0&&<details><summary>使った検索語句</summary><ul>{diagnostics.queries.map((q:any,i:number)=><li key={i}>{q.label}（{q.sourceFocus}{q.domains?.length?` / ${q.domains.join(',')}`:''}）<br/><small>{q.query}</small></li>)}</ul></details>}
   {diagnostics?.discoveryChecks?.length>0&&<details><summary>取得元の確認</summary><ul>{diagnostics.discoveryChecks.map((c:any)=><li key={c.source}>{c.source}：{c.reason||`${c.verified??c.candidates}件を確認`}</li>)}</ul></details>}
   {diagnostics?.exclusionCounts&&Object.keys(diagnostics.exclusionCounts).length>0&&<details><summary>除外した理由</summary><ul>{Object.entries(diagnostics.exclusionCounts).map(([reason,count])=><li key={reason}>{reason}：{String(count)}件</li>)}</ul></details>}
   </details>
  </div>
  <details className="panel source-directory"><summary><Globe2 size={18}/>ほかのサイトから探す<small>日本・海外 {freelanceSites.length}サイト</small></summary><SourceConnections tavilyReady={tavilyReady} q={conditions.q} category={conditions.cat} onSettings={settings}/></details>
  <details className="panel profession-directory"><summary><BriefcaseBusiness size={18}/>29職種一覧</summary><div>{professionFamilies.map(f=><section key={f.id}><h3>{f.label}</h3>{professions.filter(p=>p.family===f.id).map(p=><button type="button" key={p.id} aria-pressed={conditions.cat===p.category} onClick={()=>change('cat',p.category)}>{p.label}<ArrowRight size={13}/></button>)}</section>)}</div></details>
 </div>;
}
