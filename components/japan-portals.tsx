'use client';
import {useState} from 'react';
import {japanPortals} from '../lib/japan-portals';
export {japanPortals} from '../lib/japan-portals';
export default function JapanPortals({onRegister}:{onRegister:(name:string)=>void}){
 const [query,setQuery]=useState(''),[sort,setSort]=useState('name'),[kind,setKind]=useState(''),[keyword,setKeyword]=useState('React アプリ開発');
 const rows=japanPortals.filter(p=>(!kind||p[2]===kind)&&(!query||p.join(' ').toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>sort==='type'?a[2].localeCompare(b[2],'ja')||a[0].localeCompare(b[0],'ja'):a[0].localeCompare(b[0],'ja'));
 return <section className="panel"><div className="section-title"><h2>日本の案件サイト</h2><span>{japanPortals.length}サイト</span></div>
 <p className="hub-description">公式サイトへのリンクと、Googleによるサイト内検索をまとめています。クラウドワークス・ココナラの自動取得は案件検索画面で利用できます。ほかの取得元は公式サイトで確認してください。ZOOAの国内公開案件は「案件を探す」→「日本の案件」で確認できます。日本の全サイトを網羅する一覧ではありません。</p>
 <div className="notice">小規模なアプリ案件は「直接応募」から確認できます。未経験可・英語通話不要・海外在住可は案件ごとに確認してください。エージェントへの登録だけで応募できるとは限りません。</div>
 <div className="filter-grid"><select aria-label="国内サイト名の選択" value={query} onChange={e=>setQuery(e.target.value)}><option value="">サイト名：すべて</option>{japanPortals.map(p=><option key={p[0]}>{p[0]}</option>)}</select><select aria-label="国内サイトの並べ替え" value={sort} onChange={e=>setSort(e.target.value)}><option value="name">サイト名順</option><option value="type">種類順</option></select><select aria-label="国内サイトの種類" value={kind} onChange={e=>setKind(e.target.value)}><option value="">種類：すべて</option>{[...new Set(japanPortals.map(p=>p[2]))].map(k=><option key={k}>{k}</option>)}</select><select aria-label="掲載サイト内を検索するキーワード" value={keyword} onChange={e=>setKeyword(e.target.value)}>{['React アプリ開発','Next.js','AI チャットボット','アプリ 改修 未経験','Flutter','PHP','Python'].map(k=><option key={k}>{k}</option>)}</select></div>
 <div className="actions" style={{margin:'14px 0',flexWrap:'wrap'}}>{['React アプリ開発','Next.js','AI チャットボット','アプリ 改修 未経験','Flutter'].map(k=><button key={k} className="secondary" onClick={()=>setKeyword(k)}>{k}</button>)}</div>
 <p className="hub-description">{rows.length}サイト表示 · リンク確認：2026年11月11日</p>
 <div className="portal-grid">{rows.map(([name,url,type,description])=><article className="portal-card" key={name}><div className="tags"><span>{type}</span><span>外部リンク・自動取得未接続</span></div><h3>{name}</h3><p>{description}</p><div className="actions" style={{flexWrap:'wrap'}}><a className="secondary" href={url} target="_blank" rel="noreferrer">公式サイト ↗</a><a className="secondary" href={'https://www.google.com/search?q='+encodeURIComponent('site:'+new URL(url).hostname+' '+keyword)} target="_blank" rel="noreferrer">Googleでサイト内検索 ↗</a><button className="secondary" onClick={()=>onRegister(name)}>見つけた案件を登録</button></div></article>)}</div>
 {!rows.length&&<p className="notice">一致するサイトがありません。検索条件を変更してください。</p>}
 <p className="hub-description">掲載元で案件URLと募集文をコピーし、「見つけた案件を登録」へ進むと、応募状況・メモ・面談練習を管理できます。募集終了や重複掲載は掲載元でご確認ください。</p></section>
}
