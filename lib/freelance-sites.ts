import {professionForCategory} from './professions';
import {categorySearchTerm} from './job-categories';
import {japanPortals} from './japan-portals';
const overseas=['Upwork','Freelancer.com','PeoplePerHour','Guru','Workana','Contra'];
const primarySites=[
 {name:'クラウドワークス',mode:'自動取得',url:'https://crowdworks.jp/public/jobs/category/14',host:'crowdworks.jp'},
 {name:'ココナラ',mode:'自動取得',url:'https://coconala.com/requests/categories/22?recruiting=true',host:'coconala.com'},
 {name:'Freelancer.com',mode:'自動取得',url:'https://www.freelancer.com/jobs/website-design/',host:'freelancer.com'},
 {name:'ランサーズ',mode:'Web追加検索・外部確認',url:'https://www.lancers.jp/work/search/web',host:'lancers.jp'},
 {name:'クラウディア',mode:'自動取得',url:'https://www.craudia.com/work_list/category2/302',host:'craudia.com'},
 {name:'@SOHO',mode:'外部確認・自動取得未接続',url:'https://atsoho.com/jobs/new',host:'atsoho.com'},
 {name:'Wantedly',mode:'外部確認・自動取得未接続',url:'https://www.wantedly.com/project_categories/design_and_art/freelance',host:'wantedly.com'},
 {name:'Anycrew',mode:'外部確認・自動取得未接続',url:'https://app.any-crew.com/',host:'any-crew.com'},
 {name:'ママワークス',mode:'外部確認・自動取得未接続',url:'https://mamaworks.jp/jobs/engineering',host:'mamaworks.jp'},
 {name:'Upwork',mode:'外部確認・API未接続',url:'https://www.upwork.com/freelance-jobs/website-development/',host:'upwork.com'},
 {name:'PeoplePerHour',mode:'外部確認',url:'https://www.peopleperhour.com/freelance-jobs/technology-programming/website-development',host:'peopleperhour.com'},
 {name:'Guru',mode:'外部確認',url:'https://www.guru.com/d/jobs/',host:'guru.com'},
 {name:'Workana',mode:'外部確認',url:'https://www.workana.com/en/jobs?skills=wordpress',host:'workana.com'},
 {name:'Contra',mode:'外部確認・ログインの場合あり',url:'https://contra.com/features/find-freelance-jobs',host:'contra.com'},
 {name:'レバテッククリエイター',mode:'外部確認・自動取得未接続',url:'https://creator.levtech.jp/project/occ-1/',host:'creator.levtech.jp'},
 {name:'Workship',mode:'外部確認・自動取得未接続',url:'https://goworkship.com/',host:'goworkship.com'},
 {name:'クラウドリンクス',mode:'外部確認・自動取得未接続',url:'https://crowdlinks.jp/worker/projects/',host:'crowdlinks.jp'},
 {name:'シュフティ',mode:'外部確認',url:'https://app.shufti.jp/jobs/search',host:'shufti.jp'},
 {name:'複業クラウド',mode:'外部確認',url:'https://talent.aw-anotherworks.com/',host:'aw-anotherworks.com'},
];
const registry=[...primarySites,...japanPortals.filter(([name])=>!primarySites.some(s=>s.name===name)).map(([name,url])=>({name,mode:'外部確認・自動取得未接続',url,host:new URL(url).hostname}))];
export const freelanceSites=registry.map(s=>({...s,market:overseas.includes(s.name)?'海外':'日本',apiStatus:s.name==='Freelancer.com'?'公式の公開案件API：接続済み':s.name==='Upwork'?'公式APIあり・申請／承認とOAuth連携が必要。現在は未接続。':s.mode==='自動取得'?'公開募集ページ：取得対応／一般向け案件検索API：未確認':'一般向け案件検索API：未確認。公式サイトで連携可否を確認してください。',setupUrl:s.name==='Freelancer.com'?'https://developers.freelancer.com/':s.name==='Upwork'?'https://support.upwork.com/hc/en-us/articles/115015857647-How-to-request-an-API-key-from-Upwork':''}));
export function externalFreelanceSearch(name:string,q:string,category:string){const site=freelanceSites.find(s=>s.name===name);const overseas=['Upwork','Freelancer.com','PeoplePerHour','Guru','Workana','Contra'].includes(name);const term=categorySearchTerm(category,overseas);return 'https://www.google.com/search?q='+encodeURIComponent(['site:'+site?.host,q,term||'freelance jobs',overseas?'freelance project':'仕事 募集','-inurl:services -inurl:menu'].filter(Boolean).join(' '))}
export const directSiteNames=freelanceSites.filter(s=>s.mode==='自動取得').map(s=>s.name);

export function sourceListingUrl(name:string,category:string){const p=professionForCategory(category);if(name==='クラウドワークス'&&p?.cw.length)return 'https://crowdworks.jp/public/jobs/category/'+p.cw[0];if(name==='ココナラ')return p?.coco.length?'https://coconala.com/requests/categories/'+p.coco[0]+'?recruiting=true':'https://coconala.com/requests';if(name==='クラウディア')return 'https://www.craudia.com/work_list/category2/302?s_accepting=1';if(name==='Freelancer.com')return 'https://www.freelancer.com/jobs/';return freelanceSites.find(s=>s.name===name)?.url||''}
