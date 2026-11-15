'use client';
import {useEffect,useState} from 'react';
import {clearTavilyBrowserKey,getTavilyBrowserKey,hasTavilyBrowserKey,saveTavilyBrowserKey} from '../lib/browser-keys';

const BROWSER_HINT='キーはこのブラウザにだけ保存されます。サーバーには保存されません';

export default function TavilySettings({onReady,onSearch}:{onReady:(saved:boolean,consent:boolean)=>void;onSearch:()=>void}){
 const [key,setKey]=useState(''),[saved,setSaved]=useState(false),[serverSaved,setServerSaved]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(true),[ready,setReady]=useState(false),[message,setMessage]=useState('読み込み中…'),[error,setError]=useState(false);
 async function load(){
  setBusy(true);setError(false);
  try{
   const browserReady=hasTavilyBrowserKey();
   setSaved(browserReady);setConsent(browserReady);onReady(browserReady,browserReady);
   const r=await fetch('/api/tavily/settings');const d:any=await r.json();
   if(r.ok)setServerSaved(!!(d.serverSaved??d.saved));
   setReady(true);
   setMessage(browserReady?'このブラウザにキーが入っています。そのまま案件検索を利用できます。':'APIキーなしでも取得済み案件とGoogle検索を使えます。');
  }catch(e:any){setError(true);setMessage(e.message||'設定を読み込めませんでした。')}finally{setBusy(false)}
 }
 useEffect(()=>{load()},[]);
 function save(){
  setBusy(true);setError(false);setMessage('このブラウザに保存しています…');
  try{
   const trimmed=key.trim();
   if(!trimmed&&!saved)throw Error('キーを入力してください。');
   if(trimmed&&!/^tvly-[A-Za-z0-9_-]{12,500}$/.test(trimmed))throw Error('tvly- から始まるキーを入力してください。');
   if(!consent)throw Error('送信内容への同意が必要です。');
   if(trimmed)saveTavilyBrowserKey(trimmed,true);
   else if(saved)saveTavilyBrowserKey(getTavilyBrowserKey(),true);
   setSaved(true);setKey('');onReady(true,true);setMessage('このブラウザに保存しました。「案件検索へ戻る」からWeb検索を始められます。');
  }catch(e:any){setError(true);setMessage(e.message||'保存できませんでした。')}finally{setBusy(false)}
 }
 function remove(){
  if(!confirm('このブラウザに保存したTavilyキーを削除しますか？Tavily側のキーは削除されません。'))return;
  clearTavilyBrowserKey();setSaved(false);setKey('');setConsent(false);onReady(false,false);setMessage('このブラウザのキーを削除しました。APIキーなしの検索は引き続き使えます。');
 }
 async function deleteServerKey(){
  if(!confirm('サーバーに残っている古いTavilyキーを削除しますか？このブラウザのキーは消えません。'))return;
  setBusy(true);setError(false);
  try{
   const r=await fetch('/api/tavily/settings',{method:'DELETE'});const d:any=await r.json();
   if(!r.ok)throw Error(d.error||'削除できませんでした。');
   setServerSaved(false);setMessage('サーバーに保存されていたキーを削除しました。');
  }catch(e:any){setError(true);setMessage(e.message||'削除できませんでした。')}finally{setBusy(false)}
 }
 return <section className="panel form-panel tavily-panel" id="tavily-setup">
  <div className="section-title"><h2>Web検索の設定</h2><span className="pill">{!ready?'未確認':saved?'Tavily：このブラウザに保存済み':'Tavily：未設定'}</span></div>
  <p>Web全体から候補を集めるときだけ、あなたのTavilyキーをこのブラウザに入れます。サーバーには送りません。</p>
  <ol className="setup-steps">
   <li><b>1. Tavilyを開いてログイン</b><p>初めてなら無料アカウントを作成します。下のボタンは<strong>別ウィンドウ</strong>で開きます。</p><a className="primary" href="https://app.tavily.com/" target="_blank" rel="noopener noreferrer">APIキー取得ページを別ウィンドウで開く ↗</a><p><code>https://app.tavily.com/</code></p></li>
   <li><b>2. API Keysでキーをコピー</b><p><code>tvly-</code>で始まるキーをコピーし、この画面に戻ります。</p><a className="secondary" href="https://help.tavily.com/articles/9170796666-how-can-i-create-an-api-key" target="_blank" rel="noopener noreferrer">キーの場所ヘルプを別ウィンドウで開く ↗</a></li>
   <li><b>3. 下の欄に貼り付けて、このブラウザに保存</b><p>スマホは長押し → 貼り付け。Macは⌘V、WindowsはCtrl＋Vです。</p></li>
  </ol>
  <label htmlFor="tavily-key">Tavily APIキー</label><input id="tavily-key" type="password" autoComplete="off" spellCheck={false} maxLength={512} disabled={busy||!ready} value={key} onChange={e=>setKey(e.target.value)} placeholder={saved?'このブラウザに保存済み・変更するときだけ入力':'tvly-… をここに貼り付け'}/>
  <small id="tavily-browser-hint">{BROWSER_HINT}</small>
  <label className="checkbox"><input type="checkbox" disabled={busy||!ready} checked={consent} onChange={e=>setConsent(e.target.checked)}/> 検索語・カテゴリ・案件条件をTavilyへ送信することを確認しました</label>
  <div className="actions"><button className="primary" disabled={busy||!ready||!consent||(!key&&!saved)} onClick={save}>{busy?'処理中…':'このブラウザに保存'}</button><button className="secondary" onClick={onSearch}>案件検索へ戻る</button>{saved&&<button className="secondary" disabled={busy} onClick={remove}>このブラウザのキーを削除</button>}{serverSaved&&<button className="secondary" disabled={busy} onClick={deleteServerKey}>サーバーに保存されたキーを削除する</button>}{!ready&&!busy&&<button className="secondary" onClick={load}>設定を再読み込み</button>}</div>
  <p role={error?'alert':'status'} className={error?'notice':'search-feedback'}>{message}</p>
  <p className="hub-description">保存先はこのブラウザだけです。別の端末・別ブラウザには同期されません。</p>
  <details className="extra-filters"><summary>利用枠・料金について</summary><p>基本検索1回で1クレジット・最大20候補。Webサイト案件の追加検索は最大2回・2クレジットで30件を目標に確認します。制作会社の追加調査は1操作で最大10回・10クレジット、新規100社を目標に収集します。全国47都道府県を続きから調べ、累計1,000社まで保持できます。無料枠は月1,000クレジットです。検索・実行ボタンを押したときだけ送信し、公式APIで無料残量が足りることを確認できる間は、毎回の確認を省きます。不足・残量不明の場合だけこの端末で確認します。他アプリとの同時利用で残量が変わる場合があります。無料で使う場合は、有料プランや従量課金を有効にしないでください。利用枠・料金はTavilyの画面で確認できます。</p><div className="actions"><a href="https://www.tavily.com/pricing" target="_blank" rel="noreferrer">公式の料金・無料枠 ↗</a><a href="https://docs.tavily.com/documentation/api-credits" target="_blank" rel="noreferrer">検索回数の数え方 ↗</a></div></details>
 </section>;
}
