'use client';
import {useState} from 'react';
import {categoryPath,categoryTree} from '../lib/job-categories';

export default function CategoryPicker({value,onChange,websiteOnly=false}:{value:string;onChange:(value:string)=>void;websiteOnly?:boolean}){
 const {family,branch,leaf}=categoryPath(value);
 const [expanded,setExpanded]=useState(!!branch);
 return <fieldset className="category-picker">
  <legend>仕事内容を選ぶ</legend>
  <p>大分類だけでも検索できます。必要なときだけ、中分類・小分類で絞り込めます。</p>
  <div className={expanded?"category-grid":"category-grid compact"}>
   <div><label htmlFor="category-family"><span>1</span> 大分類</label>
    <select id="category-family" value={family?.value||''} onChange={e=>onChange(e.target.value)}>
     <option value="">全分野</option>{categoryTree.filter(g=>!websiteOnly||['Web制作全般','デザイン制作全般','開発エンジニア全般'].includes(g.value)).map(g=><option key={g.value} value={g.value}>{g.label}</option>)}
    </select>
   </div>
   <div hidden={!expanded}><label htmlFor="category-branch"><span>2</span> 中分類 <small>任意</small></label>
    <select id="category-branch" disabled={!family} value={branch?.value||''} onChange={e=>onChange(e.target.value||family?.value||'')}>
     <option value="">{family?'この大分類をまとめて探す':'大分類を選んでください'}</option>{family?.branches.map(b=><option key={b.value} value={b.value}>{b.label}</option>)}
    </select>
   </div>
   <div hidden={!expanded}><label htmlFor="category-leaf"><span>3</span> 小分類 <small>任意</small></label>
    <select id="category-leaf" disabled={!branch} value={leaf} onChange={e=>onChange(e.target.value||branch?.value||'')}>
     <option value="">{branch?'この中分類をまとめて探す':'中分類を選ぶと選択できます'}</option>{branch?.items.map(item=><option key={item}>{item}</option>)}
    </select>
   </div>
  </div>
  <button className="text-button" type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'詳細分類を閉じる':'中分類・小分類で絞る ＋'}</button>
  <div className="category-current" aria-live="polite">検索範囲：<strong>{family?.label||'全分野'}{branch?' › '+branch.label:''}{leaf?' › '+leaf:''}</strong>{family&&!branch&&<span>関連する小分類をすべて含みます</span>}</div>
 </fieldset>;
}
