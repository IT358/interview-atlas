'use client';
import {professionFamilies,professions,professionForCategory} from '../lib/professions';
import {categoryPath} from '../lib/job-categories';
import CategoryPicker from './category-picker';
export default function ProfessionPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){
 const exact=professionForCategory(value),path=categoryPath(value);
 const family=professionFamilies.find(f=>f.id===exact?.family||f.category===value)||professionFamilies.find(f=>f.category===path.family?.value)||professionFamilies.find(f=>f.id===(value.includes('AI')?'ai':path.family?.value==='コーディング全般'||path.family?.value==='アプリ・システム全般'?'dev':'web'))!;
 const all=!value;const options=all?professions:professions.filter(p=>p.family===family.id);
 return <div className="profession-picker"><div className="profession-selects"><div><label htmlFor="profession-family">分野</label><select id="profession-family" value={all?'all':family.id} onChange={e=>onChange(e.target.value==='all'?'':professionFamilies.find(f=>f.id===e.target.value)!.category)}><option value="all">すべての分野</option>{professionFamilies.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div><div><label htmlFor="profession-role">職種</label><select id="profession-role" value={exact?.id||''} onChange={e=>onChange(professions.find(p=>p.id===e.target.value)?.category||(all?'':family.category))}><option value="">{all?'29職種をまとめて探す':family.label+'をまとめて探す'}</option>{options.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div></div><div className="profession-shortcuts" aria-label={family.label+'の職種'}>{(all?[]:options).map(p=><button type="button" key={p.id} aria-pressed={exact?.id===p.id} onClick={()=>onChange(exact?.id===p.id?family.category:p.category)}>{p.label}</button>)}</div><details className="granular-categories"><summary>仕事内容をもっと細かく選ぶ</summary><CategoryPicker value={value} onChange={onChange}/></details></div>;
}
