'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,KeyRound,CheckCircle2,AlertCircle,Loader2} from 'lucide-react';
import {fetchTavilyAction} from '../lib/tavily-confirmation';

const KEY_PAGE='https://app.tavily.com/';
const KEY_HELP='https://help.tavily.com/articles/9170796666-how-can-i-create-an-api-key';

type StatusKind='idle'|'loading'|'success'|'error';

export default function TavilyConnectGuide({onReady,onGoJobs}:{onReady?:(saved:boolean,consent:boolean)=>void;onGoJobs?:()=>void}){
 const running=useRef(false);
 const [key,setKey]=useState('');
 const [saved,setSaved]=useState(false);
 const [ready,setReady]=useState(false);
 const [busy,setBusy]=useState(false);
 const [consent,setConsent]=useState(true);
 const [verified,setVerified]=useState(false);
 const [status,setStatus]=useState<{kind:StatusKind;text:string}>({kind:'idle',text:''});

 useEffect(()=>{
  let live=true;
  setStatus({kind:'loading',text:'保存状態を確認しています…'});
  fetch('/api/tavily/settings').then(async r=>{
   const d:any=await r.json();
   if(!live)return;
   if(!r.ok)throw Error(d.error||'保存状態を読み込めませんでした。');
   setSaved(!!d.saved);
   onReady?.(!!d.saved,!!d.consent);
   setStatus({kind:d.saved?'success':'idle',text:d.saved?'キーは暗号化保存済みです。接続テストは未実行でも、キー不要の検索は使えます。':'キー未登録でも、APIキー不要の案件検索・保存・応募管理は使えます。'});
  }).catch(e=>{
   if(live)setStatus({kind:'error',text:(e.message||'保存状態を読み込めませんでした。')+' 再読み込みするか、下から再試行してください。'});
  }).finally(()=>{if(live)setReady(true)});
  return()=>{live=false};
 },[]);

 async function save(){
  if(busy)return;
  const trimmed=key.trim();
  if(!/^tvly-[A-Za-z0-9_-]{12,500}$/.test(trimmed)){
   setStatus({kind:'error',text:'tvly- から始まるキーを貼ってください。前後の空白は自動で取り除きます。'});
   return;
  }
  if(!consent){
   setStatus({kind:'error',text:'保存と送信内容の確認にチェックしてください。'});
   return;
  }
  setBusy(true);
  setStatus({kind:'loading',text:'暗号化して保存しています…'});
  try{
   const r=await fetch('/api/tavily/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:trimmed,consent:true})});
   const d:any=await r.json();
   if(!r.ok)throw Error(d.error||'保存できませんでした。');
   setSaved(true);
   onReady?.(true,true);
   setVerified(false);
   setKey('');
   setStatus({kind:'success',text:'保存しました。キー文字列は再表示しません。追加検索や接続テストは実行ボタンを押したときだけ動きます。'});
  }catch(e:any){
   setStatus({kind:'error',text:(e.message||'保存できませんでした。')+' キーは入力欄に残っています。形式を確認して再試行してください。'});
  }finally{setBusy(false)}
 }

 async function disconnect(){
  if(!confirm('このアプリに保存したTavilyキーを削除しますか？Tavily側の契約・キーは削除されません。'))return;
  setBusy(true);
  setStatus({kind:'loading',text:'保存キーを削除しています…'});
  try{
   const r=await fetch('/api/tavily/settings',{method:'DELETE'});
   const d:any=await r.json();
   if(!r.ok)throw Error(d.error||'削除できませんでした。');
   setSaved(false);onReady?.(false,false);setVerified(false);setKey('');
   setStatus({kind:'success',text:'アプリ内の保存キーを削除しました。キー不要の検索はそのまま使えます。'});
  }catch(e:any){
   setStatus({kind:'error',text:(e.message||'削除できませんでした。')+' もう一度お試しください。'});
  }finally{setBusy(false)}
 }

 async function test(){
  if(running.current)return;
  if(!saved){setStatus({kind:'error',text:'先にキーを保存してください。'});return}
  running.current=true;setBusy(true);
  setStatus({kind:'loading',text:'接続テストを1回実行しています…'});
  try{
   const r=await fetchTavilyAction('/api/tavily/test',{requestId:crypto.randomUUID()},{label:'接続テスト',credits:1,details:'検索語「WordPress」をTavilyへ送信します。'});
   const d:any=await r.json();
   if(!r.ok)throw Error(d.error||'接続テストに失敗しました。');
   setVerified(true);
   setStatus({kind:'success',text:'接続を確認しました。案件検索へ進んで追加検索を使えます。'});
  }catch(e:any){
   setVerified(false);
   setStatus({kind:'error',text:(e.message||'接続の応答を受け取れませんでした。')+' 自動再試行はしません。Tavilyの利用履歴を確認するか、キー不要検索を使ってください。'});
  }finally{running.current=false;setBusy(false)}
 }

 const StatusIcon=status.kind==='loading'?Loader2:status.kind==='success'?CheckCircle2:status.kind==='error'?AlertCircle:null;

 return (
  <section className="tavily-compact" aria-label="Tavilyキー設定">
   <div className="tavily-compact-head">
    <div>
     <h3>Tavilyキー（任意）</h3>
     <p>キー不要の検索・保存・応募管理はそのまま使えます。追加Web検索だけキーが必要です。</p>
    </div>
    <span className={'status-pill '+(verified?'ok':saved?'saved':'off')}>{verified?'接続確認済み':saved?'保存済み': '未登録'}</span>
   </div>

   <ul className="capability-list" aria-label="キーなしでも使える機能">
    <li>APIキー不要の案件検索</li>
    <li>案件の保存と応募ステータス管理</li>
    <li>読み込み済み結果の絞り込み</li>
   </ul>

   <div className="tavily-compact-actions">
    <a className="secondary" href={KEY_PAGE} target="_blank" rel="noopener noreferrer"><KeyRound size={16} aria-hidden="true"/>公式でキーを取得<ArrowUpRight size={15} aria-hidden="true"/></a>
    <a className="text-button" href={KEY_HELP} target="_blank" rel="noopener noreferrer">作り方ヘルプ</a>
   </div>

   <label htmlFor="tavily-key-input">APIキー</label>
   <input
    id="tavily-key-input"
    type="password"
    autoComplete="off"
    spellCheck={false}
    value={key}
    maxLength={512}
    disabled={busy||!ready}
    onChange={e=>setKey(e.target.value)}
    placeholder={saved?'保存済み（変更するときだけ新しいキーを入力）':'tvly- から始まるキー'}
    aria-describedby="tavily-key-hint"
   />
   <small id="tavily-key-hint">キーは画面・URL・ログに再表示しません。暗号化して保存します。</small>

   <label className="checkbox">
    <input type="checkbox" checked={consent} disabled={busy} onChange={e=>setConsent(e.target.checked)}/>
    検索・接続テストボタンを押したときだけ条件をTavilyへ送ることに同意します
   </label>

   <div className="actions tavily-compact-buttons">
    <button type="button" className="primary" disabled={busy||!ready||(!key.trim()&&!saved)||!consent} onClick={save}>
     {busy&&status.kind==='loading'?'保存中…':saved&&!key.trim()?'保存内容を更新':'キーを保存'}
    </button>
    {saved&&<>
     <button type="button" className="secondary" disabled={busy||!ready} onClick={test}>{busy?'処理中…':verified?'再テスト':'接続テスト（任意・1回）'}</button>
     <button type="button" className="text-button" disabled={busy} onClick={disconnect}>保存を削除</button>
    </>}
    <button type="button" className="secondary" onClick={()=>onGoJobs?.()}>案件検索へ戻る</button>
   </div>

   <p className={'inline-status '+status.kind} role="status" aria-live="polite">
    {StatusIcon&&<StatusIcon size={16} aria-hidden="true" className={status.kind==='loading'?'spin':undefined}/>}
    <span>{status.text||'　'}</span>
   </p>
  </section>
 );
}
