import {companyDomain,companyRegions,type CompanyConditions} from './company-search';
export const proposalModels=[
 {id:'coding5',label:'5ページ前後のコーディング',min:50000,max:150000,scope:'デザイン・原稿支給、レスポンシブ実装。取材・デザイン・有料素材・複雑な機能は含めない仮定。'},
 {id:'lp',label:'LPのコーディング1本',min:30000,max:100000,scope:'完成デザインと素材支給、PC・スマホ対応。構成・コピー・広告運用は別。'},
 {id:'wp',label:'WordPressサイト実装',min:100000,max:200000,scope:'小〜中規模サイトのデザイン構築・WordPress実装。企画や追加機能の範囲によって変動。'},
 {id:'design',label:'複数ページのWebデザイン',min:120000,max:300000,scope:'ページ数・ワイヤー支給・修正回数などを確認する前の予算仮説。'}
];
export const estimateSources=[{name:'Catwork：コーディング外注価格',url:'https://catwork.co.jp/outsourcing/'},{name:'峰：登録フリーランス募集・報酬',url:'https://mine003.com/recruit/'},{name:'MEcreate：WordPress制作の委託報酬',url:'https://mecreate.co.jp/recruit/'},{name:'シンシエイト：デザイン・実装の委託報酬',url:'https://sinciate.co.jp/partner-wanted/'}];
export function estimateNote(modelId:string){const m=proposalModels.find(m=>m.id===modelId)||proposalModels[0];return `単価予想（仮説）：${m.min.toLocaleString('ja-JP')}〜${m.max.toLocaleString('ja-JP')}円 / ${m.label}。${m.scope} 他社の公開外注例から置いた提案準備用の幅で、この会社の発注予算・あなたの受取額を確認したものではありません。税・手数料・実績要件は別途確認。`}
export function companyResearchRegion(c:CompanyConditions,index:number){return c.region||companyRegions[index%companyRegions.length]}
export function companyResearchQuery(c:CompanyConditions,index:number){
 const variants=c.purpose==='制作会社全般'?['会社概要 ホームページ制作','事業内容 Webデザイン','制作実績 WordPress','Web制作 コーディング']:['制作パートナー募集 コーダー','外注パートナー WordPress','協力会社募集 Webデザイン','フリーランス 募集 コーディング','業務委託 パートナー募集','ホームページ制作 外部スタッフ募集','HTML CSS 制作パートナー','LP制作 協力パートナー','Web制作 業務提携募集','サイト運用 保守 パートナー募集'];
 return [companyResearchRegion(c,index),c.type,c.service,variants[index%variants.length],c.q,'公式 -比較 -ランキング -まとめ -一括見積もり'].filter(Boolean).join(' ').slice(0,1500)
}
export function researchCompanyResult(r:any,conditions:CompanyConditions){
 let u:URL;try{u=new URL(r.url);if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')return null}catch{return null}
 const domain=companyDomain(u.href);if(!domain||/^(localhost|\d+(?:\.\d+){3})$/.test(domain)||/\.(?:local|internal)$/.test(domain)||/(?:imitsu|web-kanji|hnavi|lancers|crowdworks|wantedly|indeed|recruit|rikunabi|mynavi|note\.com|youtube|facebook|instagram)\./i.test(domain))return null;
 const title=String(r.title||'').slice(0,300),raw=String(r.raw_content||'');if(raw.length<250)return null;
 const text=raw.slice(0,30000).replace(/\s+/g,' ');
 if(!/(?:Web|ウェブ|ホームページ|コーディング|WordPress|HTML)/i.test(text))return null;
 const general=conditions.purpose==='制作会社全般';
 if(!general&&/現在.{0,20}(?:募集|受付).{0,15}(?:停止|終了|しておりません|行っておりません)|募集を停止|募集は終了|募集を終了|受付を終了|新規.{0,20}受付停止/.test(text))return null;
 if(!general&&!/(?:パートナー|協力会社|外部スタッフ|業務委託|フリーランス).{0,45}(?:募集|協業|応募)|(?:募集).{0,45}(?:パートナー|協力会社|フリーランス)/.test(title+' '+text))return null;
 if(/紹介.{0,15}パートナー|販売代理店|営業代理店/.test(title)&&!/(?:コーダー|デザイナー|エンジニア).{0,30}募集/.test(text))return null;
 const titledCompany=title.split(/[|｜]/).map(s=>s.trim()).find(s=>/(?:株式会社|有限会社|合同会社)/.test(s)&&!/(?:募集|求人|採用)/.test(s));
 const corporate=text.match(/(?:株式会社|有限会社|合同会社)[^\s\n|｜。、「」<>【】]{1,35}/)?.[0];
 const company=titledCompany||corporate||title.split(/[|｜]/).map(s=>s.trim()).filter(s=>s&&!/募集|パートナー|採用|partner|recruit/i.test(s)).at(-1)||'';
 if(!company)return null;
 if(general&&(!(corporate||titledCompany)||!/(?:Web|ウェブ|ホームページ|サイト).{0,15}(?:制作|製作|デザイン)|(?:制作|デザイン).{0,15}(?:Web|ウェブ|ホームページ|サイト)/i.test(text)))return null;
 const m=(title+' '+text).match(/.{0,35}(?:パートナー|協力会社|フリーランス|業務委託).{0,70}(?:募集|応募|協業).{0,50}/);
 return {id:'discovered-'+domain,company:company.slice(0,80),url:u.origin+'/',partnerUrl:u.href,region:'所在地は公式で確認',searchRegion:conditions.region||'',services:[conditions.service||'Web制作全般'],evidence:general?'公式本文に法人名とWebサイト制作事業の記載を確認。外注募集は未確認。':m?.[0]?.slice(0,140)||'募集元本文にWeb制作と外部パートナーの募集記載を確認。',recruitmentStatus:general?'制作事業の記載あり・外注募集は未確認':'募集本文あり（自動判定）',checkedAt:new Date().toISOString(),domain,publishedClientPrice:null,publishedOutsourcePrice:null,note:general?'Tavily取得の公式本文から抽出。協業・外注募集や営業受付の有無は未確認です。所在地・事業内容を公式サイトで確認してください。単価は未公表・未確認。':'Tavily取得の募集元本文から抽出。正式な社名、募集職種・経験・居住条件、営業受付は募集元で確認してください。単価は未公表・未確認。'};
}
