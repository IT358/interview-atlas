'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,KeyRound} from 'lucide-react';
import {fetchTavilyAction} from '../lib/tavily-confirmation';
import TavilyStepIllustration from './tavily-step-illustration';
const KEY_PAGE='https://app.tavily.com/';
const KEY_HELP='https://help.tavily.com/articles/9170796666-how-can-i-create-an-api-key';
const steps=[['公式サイトを開く','まずはTavilyにログインします。初めての人は無料登録へ。'],['APIキーをコピー','API Keysは「このアプリ専用の合いかぎ」の置き場です。'],['アプリに貼って保存','キーをここに貼ります。友達やチャットには送らないでください。'],['接続を確認','保存と接続成功は別です。実際の通信結果を確認します。']];
function KeyPageLink({className='primary',label='APIキー取得ページを別ウィンドウで開く'}:{className?:string;label?:string}){
 return <a className={className+' wizard-key-jump'} href={KEY_PAGE} target="_blank" rel="noopener noreferrer"><KeyRound size={16} aria-hidden="true"/>{label}<ArrowUpRight size={16} aria-hidden="true"/></a>;
}
export default function TavilyConnectGuide({onReady,onGoJobs}:{onReady?:(saved:boolean,consent:boolean)=>void;onGoJobs?:()=>void}){
 const running=useRef(false),handoff=useRef<number|null>(null);
 const [step,setStep]=useState(0),[key,setKey]=useState(''),[saved,setSaved]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[consent,setConsent]=useState(false),[verified,setVerified]=useState(false);
 useEffect(()=>{let live=true;fetch('/api/tavily/settings').then(async r=>{const d:any=await r.json();if(!live)return;if(!r.ok)throw Error(d.error);setSaved(!!d.saved);onReady?.(!!d.saved,!!d.consent);setMessage(d.saved?'キーは保存済みです。接続テストはまだ行っていません。':'キーはまだ保存されていません。')}).catch(e=>{if(live)setMessage(e.message||'保存状態を読み込めませんでした。')}).finally(()=>{if(live)setReady(true)});return()=>{live=false;if(handoff.current)window.clearTimeout(handoff.current)};},[]);
 async function save(){if(busy)return;if(!/^tvly-[A-Za-z0-9_-]{12,500}$/.test(key.trim())){setMessage('tvly-から始まるキーを貼ってください。前後の空白は自動で取り除きます。');return}setBusy(true);try{const r=await fetch('/api/tavily/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:key.trim(),consent:true})});const d:any=await r.json();if(!r.ok)throw Error(d.error);setSaved(true);onReady?.(true,true);setVerified(false);setKey('');setStep(3);setMessage('キーを暗号化して保存しました。まだTavilyへの接続は実行していません。')}catch(e:any){setMessage(e.message||'保存できませんでした。キーは入力欄に残っています。')}finally{setBusy(false)}}
 async function disconnect(){if(!confirm('このアプリに保存したTavilyキーを削除しますか？Tavily側の契約・キーは削除されません。'))return;setBusy(true);try{const r=await fetch('/api/tavily/settings',{method:'DELETE'});const d:any=await r.json();if(!r.ok)throw Error(d.error);setSaved(false);onReady?.(false,false);setVerified(false);setKey('');setMessage('このアプリの保存キーを削除しました。Tavilyの有料契約は解約されません。')}catch(e:any){setMessage(e.message||'削除できませんでした。')}finally{setBusy(false)}}
 function goJobs(immediate=false){
  try{sessionStorage.setItem('atlas-tavily-handoff',JSON.stringify({mode:'web',focus:true,at:Date.now()}))}catch{}
  const run=()=>onGoJobs?.();
  if(immediate){run();return}
  if(handoff.current)window.clearTimeout(handoff.current);
  handoff.current=window.setTimeout(run,700);
 }
 async function test(){
  if(running.current)return;
  if(!saved){setMessage('先にステップ3でキーを保存してください。');setStep(2);return}
  running.current=true;setBusy(true);setMessage('Tavilyへの接続テストを1回実行しています…');
  try{const r=await fetchTavilyAction('/api/tavily/test',{requestId:crypto.randomUUID()},{label:'接続テスト',credits:1,details:'検索語「WordPress」をTavilyへ送信します。'});const d:any=await r.json();if(!r.ok)throw Error(d.error);setVerified(true);setMessage('では営業するための検索をしましょう。案件を探す画面へ移ります。');goJobs()}
  catch(e:any){setVerified(false);setMessage(e.message||'接続の応答を受け取れませんでした。消費の有無は不明です。公式画面の利用履歴をご確認ください。自動再試行はしません。')}
  finally{running.current=false;setBusy(false)}
 }

 return <section className="tavily-wizard" aria-label="Tavilyのかんたん接続ガイド"><div className="wizard-heading"><div><span className="tiny-label">4つのステップで準備</span><h3>Tavilyをつなごう</h3><p>検索のお手伝いを頼むための「合いかぎ」を用意します。</p></div><span className="pill">{verified?'接続確認済み':saved?'保存済み・接続未確認':'未接続'}</span></div><div className="wizard-key-banner"><div><strong>APIキーはまだですか？</strong><p>下のボタンで公式の取得ページを<strong>別ウィンドウ</strong>で開きます。この画面はそのまま残せます。</p><code className="wizard-key-url">{KEY_PAGE}</code></div><KeyPageLink/></div><ol className="wizard-steps">{steps.map(([title],i)=><li key={title}><button type="button" aria-current={step===i?'step':undefined} className={step===i?'current':''} onClick={()=>setStep(i)}><span>{i+1}</span>{title}</button></li>)}</ol><div className="wizard-content"><figure><TavilyStepIllustration step={step}/><figcaption>説明用イラストです。公式画面の見た目は変わることがあります。</figcaption></figure><div><h4>{step+1}. {steps[step][0]}</h4><p>{steps[step][1]}</p>{step===0&&<><p>無料・有料どちらのプランでも使えます。利用前に公式画面で、ご自身の料金・残量を確認できます。</p><div className="actions wizard-step-links"><KeyPageLink label="Tavily公式（APIキー取得）を別ウィンドウで開く"/><a className="secondary" href={KEY_HELP} target="_blank" rel="noopener noreferrer">キーの作り方ヘルプ ↗</a></div></>}{step===1&&<><p>ログイン後「API Keys」を探し、コピーのマークを押します。キーは通常 tvly- で始まります。</p><div className="actions wizard-step-links"><KeyPageLink label="API Keys画面を別ウィンドウで開く"/><a className="secondary" href={KEY_HELP} target="_blank" rel="noopener noreferrer">公式：キーの場所を見る ↗</a></div></>}{step===2&&<div className="wizard-paste"><p className="wizard-paste-hint">キーがまだなら、先に取得ページを別ウィンドウで開いてコピーしてください。</p><KeyPageLink className="secondary" label="取得ページを別ウィンドウで開く"/><label htmlFor="wizard-tavily-key">コピーしたAPIキー</label><input id="wizard-tavily-key" type="password" autoComplete="off" spellCheck={false} value={key} maxLength={512} onChange={e=>setKey(e.target.value)} placeholder="tvly-から始まる文字"/><small>スマホ：長押し→貼り付け／Mac：⌘V／Windows：Ctrl＋V。キーはURLやlocalStorageに保存しません。</small><label className="checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>キーをこのアプリに暗号化保存し、検索・実行ボタンを押したときに条件をTavilyへ送ることを確認しました</label><button type="button" className="primary" disabled={busy||!ready||!key.trim()||!consent} onClick={save}>{busy?'保存中…':'キーを安全に保存'}</button></div>}{step===3&&<><p>接続テストは基本検索1回・1クレジットです。下のボタンを押したときだけ実行します。無料残量が足りる間は確認なし、不足・残量不明の場合だけこの端末で確認します。</p><p>無料・有料プランを理由に接続を止めません。料金はご自身のTavily契約・残量に従います。</p><div className="actions wizard-step-links"><button type="button" className="primary" disabled={busy||!ready} onClick={test}>{busy?'接続テスト中…':verified?'もう一度接続テスト':'接続テストを実行'}</button><KeyPageLink className="secondary" label="料金・残量・キー画面を別ウィンドウで開く"/></div>
 {verified&&<button type="button" className="primary wizard-go-companies" onClick={()=>goJobs(true)}>案件を探すへ進む</button>}
 {saved&&<button type="button" className="secondary" disabled={busy} onClick={disconnect}>このアプリの接続を解除</button>}</>}</div></div><p className="wizard-message" role="status">{message}</p><div className="wizard-navigation"><button type="button" className="secondary" disabled={step===0} onClick={()=>setStep(s=>s-1)}>前へ</button><span>{step+1} / 4</span>{step===3&&verified?<button type="button" className="primary" onClick={()=>goJobs(true)}>案件を探す</button>:<button type="button" className="primary" disabled={step===3} onClick={()=>setStep(s=>s+1)}>次へ</button>}</div></section>;
}
