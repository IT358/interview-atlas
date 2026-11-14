import {professions,professionFamilies,normalizeProfessionCategory,professionQuery,projectProfessions} from './professions';
/** Shared categories for acquisition, saved records and search. Labels are never proof of eligibility. */
export const categoryGroups=[
 {label:'Web制作',items:['Web制作全般','HP・企業サイト制作','LP制作','WordPress制作・修正','ECサイト制作','サイト修正・運用','サイトリニューアル','採用サイト制作','サービスサイト制作','ポートフォリオサイト制作','多言語サイト制作','ノーコードサイト制作','サイト移行']},
 {label:'デザイン制作',items:['デザイン制作全般','Webデザイン','UI・UXデザイン','バナー・画像制作','ロゴ・グラフィック制作','ワイヤーフレーム制作','デザインカンプ制作','デザインの修正']},
 {label:'コーディング',items:['コーディング全般','HTML・CSSコーディング','JavaScript実装','フロントエンド開発','デザインデータからのコーディング','レスポンシブ対応','アニメーション実装','フォーム実装','表示崩れ・バグ修正','表示速度改善','アクセシビリティ対応']},
 {label:'アプリ・システム',items:['アプリ・システム全般','Webアプリ開発・修正','iOS・Androidアプリ開発・修正','バックエンド・API開発','AI連携・チャットボット・業務自動化']}
];
for(const family of professionFamilies){let group=categoryGroups.find(g=>g.items[0]===family.category);if(!group){group={label:family.label,items:[family.category]};categoryGroups.push(group)}for(const p of professions.filter(p=>p.family===family.id))if(!group.items.includes(p.category))group.items.push(p.category)}
export const categories=[...new Set(categoryGroups.flatMap(g=>g.items))];
const rules:[string,RegExp,string][]=[
 ['サイトリニューアル',/リニューアル|redesign/i,'website redesign'],
 ['採用サイト制作',/採用サイト|recruitment website/i,'recruitment website development'],
 ['サービスサイト制作',/サービスサイト|service website/i,'service website development'],
 ['ポートフォリオサイト制作',/ポートフォリオサイト|portfolio website/i,'portfolio website development'],
 ['多言語サイト制作',/多言語サイト|multilingual/i,'multilingual website development'],
 ['ノーコードサイト制作',/ノーコード|STUDIO|webflow|wix|ペライチ/i,'no code website development'],
 ['サイト移行',/サイト移行|サーバー移行|site migration/i,'website migration'],
 ['ワイヤーフレーム制作',/ワイヤーフレーム|wireframe/i,'wireframe design'],
 ['デザインカンプ制作',/デザインカンプ|design comp|mockup/i,'website mockup design'],
 ['デザインの修正',/デザイン修正|design revision/i,'web design revision'],
 ['デザインデータからのコーディング',/デザインデータ|Figma.{0,15}(?:HTML|コーディング)|PSD.{0,10}HTML|design to code/i,'Figma to HTML coding'],
 ['レスポンシブ対応',/レスポンシブ|responsive/i,'responsive website coding'],
 ['アニメーション実装',/アニメーション|GSAP|web animation/i,'website animation GSAP'],
 ['フォーム実装',/フォーム実装|お問い合わせフォーム|Contact Form 7|contact form/i,'website contact form implementation'],
 ['表示崩れ・バグ修正',/表示崩れ|バグ修正|bug fix|layout fix/i,'website bug layout fixes'],
 ['表示速度改善',/表示速度|速度改善|PageSpeed|Core Web Vitals/i,'website performance optimization'],
 ['アクセシビリティ対応',/アクセシビリティ|accessibility|WCAG/i,'website accessibility WCAG'],
 ['HP・企業サイト制作',/ホームページ|企業サイト|コーポレートサイト|HP制作|website|corporate site/i,'website development corporate website'],
 ['LP制作',/ランディングページ|LP制作|LPコーディング|landing page/i,'landing page design development'],
 ['WordPress制作・修正',/wordpress|ワードプレス/i,'WordPress development customization'],
 ['ECサイト制作',/ECサイト|ネットショップ|shopify|e[ -]?commerce|magento|woocommerce/i,'ecommerce Shopify development'],
 ['サイト修正・運用',/(?:サイト|ホームページ|web).{0,15}(?:修正|更新|運用|改修)|website maintenance/i,'website maintenance updates'],
 ['Webデザイン',/web.{0,8}(?:デザイン|デザイナ|design)|website design|サイトデザイン/i,'web design website designer'],
 ['UI・UXデザイン',/UI.?UX|\bUI\b|\bUX\b|product design|プロダクトデザイ/i,'UI UX product design'],
 ['バナー・画像制作',/バナー|画像制作|サムネイル|banner|thumbnail/i,'banner image design'],
 ['ロゴ・グラフィック制作',/ロゴ|グラフィック|チラシ|パンフレット|logo|graphic design/i,'logo graphic design'],
 ['HTML・CSSコーディング',/HTML|CSS|SCSS|Sass|マークアップ|コーディング|markup|PSD.{0,10}HTML/i,'HTML CSS coding markup'],
 ['JavaScript実装',/javascript|jquery|JavaScript実装/i,'JavaScript jQuery implementation'],
 ['フロントエンド開発',/フロントエンド|front[ -]?end|react(?! native)|next\.js|vue|angular/i,'frontend development'],
 ['iOS・Androidアプリ開発・修正',/スマホ|スマートフォン|\bios\b|android|flutter|react native|\bmobile\b/i,'mobile app development iOS Android'],
 ['バックエンド・API開発',/バックエンド|back[ -]?end|API開発|API連携|server[ -]?side/i,'backend API development'],
 ['AI連携・チャットボット・業務自動化',/生成AI|AI連携|\bAI\b|machine learning|\bLLM\b|chatbot|チャットボット|automation|自動化|openai/i,'AI chatbot automation development'],
 ['Webアプリ開発・修正',/Webアプリ|システム開発|web app|software|full[ -]?stack/i,'web app software development']
];
export type CategoryBranch={label:string;value:string;items:string[]};
export const categoryTree:{label:string;value:string;branches:CategoryBranch[]}[]=[
 {label:'Web制作・HP制作',value:'Web制作全般',branches:[
  {label:'HP・サイト制作',value:'HP・サイト制作全般',items:['HP・企業サイト制作','LP制作','サイトリニューアル','採用サイト制作','サービスサイト制作','ポートフォリオサイト制作','多言語サイト制作']},
  {label:'CMS・EC・ノーコード',value:'CMS・EC・ノーコード全般',items:['WordPress制作・修正','ECサイト制作','ノーコードサイト制作']},
  {label:'サイト運用・移行',value:'サイト運用・移行全般',items:['サイト修正・運用','サイト移行']}
 ]},
 {label:'Webデザイン・画像制作',value:'デザイン制作全般',branches:[
  {label:'Web・UIデザイン',value:'Web・UIデザイン全般',items:['Webデザイン','UI・UXデザイン','ワイヤーフレーム制作','デザインカンプ制作','デザインの修正']},
  {label:'画像・グラフィック',value:'画像・グラフィック全般',items:['バナー・画像制作','ロゴ・グラフィック制作']}
 ]},
 {label:'コーディング',value:'コーディング全般',branches:[
  {label:'HTML・CSSの画面実装',value:'HTML・CSS実装全般',items:['HTML・CSSコーディング','デザインデータからのコーディング','レスポンシブ対応']},
  {label:'JavaScript・フロントエンド',value:'JavaScript・フロントエンド全般',items:['JavaScript実装','フロントエンド開発','アニメーション実装','フォーム実装']},
  {label:'不具合修正・品質改善',value:'不具合修正・品質改善全般',items:['表示崩れ・バグ修正','表示速度改善','アクセシビリティ対応']}
 ]},
 {label:'アプリ・システム開発',value:'アプリ・システム全般',branches:[
  {label:'Webアプリ・API',value:'Webアプリ・API全般',items:['Webアプリ開発・修正','バックエンド・API開発']},
  {label:'モバイルアプリ',value:'モバイルアプリ全般',items:['iOS・Androidアプリ開発・修正']},
  {label:'AI・業務自動化',value:'AI・業務自動化全般',items:['AI連携・チャットボット・業務自動化']}
 ]}
];
// Seven primary fields; older category values remain searchable for saved records.
const codingTree=categoryTree.find(g=>g.value==='コーディング全般')!;
const oldAppTree=categoryTree.find(g=>g.value==='アプリ・システム全般')!;
const webTree=categoryTree.find(g=>g.value==='Web制作全般')!;
const designTree=categoryTree.find(g=>g.value==='デザイン制作全般')!;
categoryTree.splice(0,categoryTree.length,webTree,designTree,{label:'開発・エンジニア',value:'開発エンジニア全般',branches:[...codingTree.branches,{label:'Webアプリ・バックエンド',value:'Webアプリ・API全般',items:['Webアプリ開発・修正','バックエンド開発','フルスタック開発']},{label:'モバイルアプリ',value:'モバイルアプリ全般',items:['iOS・Androidアプリ開発・修正']}]});
for(const family of professionFamilies){
 let node=categoryTree.find(g=>g.value===family.category);
 if(!node){node={label:family.label,value:family.category,branches:[]};categoryTree.push(node)}
 const missing=professions.filter(p=>p.family===family.id&&!categoryTree.some(g=>g.branches.some(b=>b.items.includes(p.category))));
 if(missing.length)node.branches.push({label:family.label+'の職種',value:family.category+'・職種別',items:missing.map(p=>p.category)});
}
export function categoryPath(value:string){
 value=normalizeProfessionCategory(value);
 const aliases:Record<string,string>={'コーディング全般':'開発エンジニア全般','アプリ・システム全般':'開発エンジニア全般','AI連携・チャットボット・業務自動化':'AI・自動化全般','AI・業務自動化全般':'AI・自動化全般','バックエンド・API開発':'バックエンド開発'};value=aliases[value]||value;
 const family=categoryTree.find(g=>g.value===value||g.branches.some(b=>b.value===value||b.items.includes(value)));
 const branch=family?.branches.find(b=>b.value===value||b.items.includes(value));
 return {family,branch,leaf:branch?.items.includes(value)?value:''};
}
export function categoryMembers(value:string):string[]{
 value=normalizeProfessionCategory(value);
 if(value==='コーディング全般')return categoryGroups.find(g=>g.items[0]===value)?.items||[value];
 if(value==='アプリ・システム全般')return [value,...categoryMembers('開発エンジニア全般'),...categoryMembers('AI・自動化全般')];
 if(value==='バックエンド・API開発')return ['バックエンド開発','API連携開発'];
 if(['AI連携・チャットボット・業務自動化','AI・業務自動化全般'].includes(value))return categoryMembers('AI・自動化全般');
 const {family,branch}=categoryPath(value);
 if(family?.value===value)return [value,...family.branches.flatMap(b=>b.items)];
 if(branch?.value===value)return branch.items;
 return [value];
}
export function jobCategories(j:{title?:string;description?:string;category?:string;categories?:string[]}){
 const title=(j.title||'').normalize('NFKC');
 const text=[title,(j.description||'').slice(0,24000)].join(' ').normalize('NFKC');
 const found=rules.filter(([,r])=>r.test(text)).map(([label])=>label);
 found.push(...projectProfessions(title,j.description||'').map(p=>p.category));
 // Retain an explicit category when the listing has no detectable wording.
 if(!found.length&&j.category&&(categories.includes(j.category)||categoryPath(j.category).family))found.push(...categoryMembers(j.category));
 if(j.category==='HP・LP・WordPress制作・修正'&&!found.length)found.push('Web制作全般');
 if(/web制作|ウェブ制作|サイト制作|webflow|hubspot/i.test(text))found.push('Web制作全般');
 if(/デザイン制作|デザイナー|designer/i.test(title)&&!found.length)found.push('デザイン制作全般');
 for(const g of categoryGroups)if(g.items.some(x=>found.includes(x)))found.push(g.items[0]);
 return [...new Set(found)];
}
export function matchesCategory(j:Parameters<typeof jobCategories>[0],cat:string){
 if(!cat)return true;const found=jobCategories(j);return categoryMembers(cat).some(member=>found.includes(member));
}
export function matchesKeywords(j:{title?:string;company?:string;description?:string;note?:string;skills?:string[]},q:string){
 const text=[j.title,j.company,j.description,j.note,...(j.skills||[])].join(' ').normalize('NFKC').toLowerCase();
 return q.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean).every(term=>text.includes(term));
}
export function categorySearchTerm(cat:string,overseas=false){
 if(!cat)return '';
 cat=normalizeProfessionCategory(cat);const professionTerm=professionQuery(cat,overseas);if(professionTerm)return professionTerm;
 const broad:Record<string,string>={'Web制作全般':overseas?'website development':'(Web制作 OR ホームページ制作 OR LP制作 OR WordPress制作 OR ECサイト制作)','デザイン制作全般':overseas?'web UI graphic design':'(Webデザイン OR UIデザイン OR バナー制作 OR グラフィック制作)','コーディング全般':overseas?'frontend HTML CSS coding':'(コーディング OR HTML CSS OR JavaScript実装 OR フロントエンド)','アプリ・システム全般':overseas?'web mobile app software development':'(Webアプリ開発 OR スマホアプリ開発 OR システム開発 OR AI連携)'};
 if(broad[cat])return broad[cat];
 const members=categoryMembers(cat);
 const terms=members.map(member=>overseas?rules.find(([label])=>label===member)?.[2]||member:member);
 return terms.length>1?'('+terms.join(' OR ')+')':terms[0];
}
