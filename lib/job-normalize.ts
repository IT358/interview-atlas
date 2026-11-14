import {jobCategories} from './job-categories';
export function plain(value:any){return String(value||'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();}
export function evidence(text:string,pattern:RegExp){const match=text.match(pattern);if(!match)return '';return text.slice(Math.max(0,match.index!-60),Math.min(text.length,match.index!+match[0].length+120));}
export function conditions(text:string){
 const required=evidence(text,/(?:at least|minimum(?: of)?|\b\d+\+?)\s*\d*\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional\s+|commercial\s+|relevant\s+)?experience|proven (?:professional |commercial )?experience|prior (?:professional |commercial )experience/i);
 const novice=evidence(text,/no (?:prior |professional |previous )?experience (?:is )?(?:required|necessary)|beginners? (?:are )?welcome|実務未経験可/i);
 const yes=evidence(text,/(?:video|phone|zoom|telephone|live coding)\s+(?:call|interview|meeting)|daily stand[ -]?ups?|verbal communication|spoken English/i);
 const no=evidence(text,/no (?:calls?|meetings?|interviews?) (?:required|needed)|(?:text|chat)[ -]only communication|asynchronous communication only/i);
 return {experience:required?'経験必須':novice?'未経験可':'記載なし',experienceEvidence:required||novice,speaking:yes?'必要':no?'不要':'記載なし',speakingEvidence:yes||no};
}
export function category(text:string){return jobCategories({title:text})[0]||'Webアプリ開発・修正'}
export function development(title:string){
 if(/(?:PM|PMO|PdM)(?:ポジション|募集|$)|プロジェクトマネージャー|コンサルティング|品質管理|運用保守案件|business develop|content (?:writer|developer)|course (?:writer|developer)|instructor|tutor|mentor|customer support|instructional|learning developer|eLearning|marketing automation|email designer|assessment content|programmer submission/i.test(title))return false;
 if(/ワイヤーフレーム|デザインカンプ|レスポンシブ|アニメーション実装|表示崩れ|表示速度改善|アクセシビリティ対応|Web制作|ウェブ制作|HP制作|ホームページ制作|サイト制作|LP制作|コーディング|マークアップ|Webデザイ|ウェブデザイ|UI.?UX|バナー制作|画像制作|ロゴ制作|グラフィック|web design|website design|UI designer|UX designer|graphic designer|banner designer|HTML.{0,10}(?:coder|developer)|CSS.{0,10}developer/i.test(title))return true;
 return /(?:アプリ|システム|サービス|サイト|プラットフォーム).{0,25}(?:開発|エンジニア)|(?:フルスタック|フロントエンド|バックエンド|AIリード|AI|生成AI).{0,15}エンジニア|software (?:engineer|developer)|full[ -]?stack|front[ -]?end|back[ -]?end|(?:web|mobile|application|app|wordpress|shopify|magento|drupal|hubspot|java|python|php|rust|react|vue|angular|\.net|flutter|ios|android|unity|tririga|zoho)[\w .+/#&()–-]{0,35}(?:developer|engineer|designer|builder)|(?:AI|machine learning|LLM|automation|data|prompt)[\w -]{0,25}(?:engineer|developer)|(?:developer|engineer)[, -]+(?:front|back|full)|open source contributor/i.test(title);
}
export function languageConditions(title:string,text:string){
 const other=evidence(title+' '+text,/(?:French|German|Dutch|Spanish|Portuguese|Italian|Polish|Japanese|Mandarin|Arabic)[ -]speaking|(?:fluent|native|proficien(?:t|cy))(?:[\w ,/-]{0,30})(?:French|German|Dutch|Spanish|Portuguese|Italian|Polish|Japanese|Mandarin|Arabic)/i);
 const english=evidence(text,/(?:fluent|fluency|proficien(?:t|cy)|professional|written|spoken|speaking|verbal|excellent|strong|good|working)[\w ,/-]{0,35}English|English[\w ,/()-]{0,35}(?:required|fluency|proficien|communication|language|speaking|level|skills)|(?:apply|application|resume|CV)[\w ,/-]{0,25}in English/i);
 return {english:other?'他言語要件あり':english?'英語の記載あり':'未確認',englishEvidence:other||english};
}
export function safeUrl(value:any,hosts?:string[]){try{const u=new URL(String(value));if(u.protocol!=='https:')return '';if(hosts&&!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))return '';return u.href}catch{return ''}}
export function himalayaJob(j:any,now=Date.now()){
 const description=plain(j.description).slice(0,24000),title=plain(j.title);if(!development(title))return null;
 if(!['Contractor','Part Time'].includes(j.employmentType))return null;
 const expires=Number(j.expiryDate)*1000;if(!Number.isFinite(expires)||expires<=now)return null;
 const url=safeUrl(j.applicationLink,['himalayas.app']);const guid=safeUrl(j.guid,['himalayas.app']);if(!url||!guid)return null;
 const location=j.locationRestrictions||[];const locationEvidence=evidence(title+' '+description,/(?:must (?:be |reside |live )|(?:U\.S\.|US|UK|United States|United Kingdom|Canada|Australia)[ -]based|based in |residents? of |only (?:in|within) )/i);
 const skills=['React','Next.js','JavaScript','TypeScript','Python','PHP','WordPress','Flutter','Swift','Kotlin','Node.js','OpenAI','SQL','Figma'].filter(v=>(title+' '+description).toLowerCase().includes(v.toLowerCase()));
 return {id:guid,source:'Himalayas',title,company:plain(j.companyName),url,guid,description,category:category(title+' '+(j.categories||[]).join(' ')),contract:j.employmentType==='Contractor'?'業務委託':'パート・アルバイト',country:'記載なし',residence:location.length?location.join(', '):locationEvidence?'本文に居住条件あり・要確認':'Worldwide（API上）',locationEvidence,worldwide:!location.length&&!locationEvidence,timezoneRestrictions:j.timezoneRestrictions||[],...conditions(description),...languageConditions(title,description),skills,currency:j.currency||'',minSalary:typeof j.minSalary==='number'?j.minSalary:null,maxSalary:typeof j.maxSalary==='number'?j.maxSalary:null,period:j.salaryPeriod||'annual',published:Number(j.pubDate)*1000||now,expires,checkedAt:now,status:'募集中（掲載元API）'};
}
export function residenceMatches(job:any,value:string){
 if(!value.trim())return true;const term=value.trim();if(/^worldwide$/i.test(term))return !!job.worldwide;if(job.worldwide)return true;
 const aliases:Record<string,string>={'日本':'Japan','タイ':'Thailand','アメリカ':'United States','米国':'United States','イギリス':'United Kingdom','英国':'United Kingdom','カナダ':'Canada','オーストラリア':'Australia','ニュージーランド':'New Zealand','シンガポール':'Singapore','インド':'India','フィリピン':'Philippines','ドイツ':'Germany','フランス':'France'};
 let query=aliases[term]||term;if(/^[A-Za-z]{2}$/.test(term)){try{query=new Intl.DisplayNames(['en'],{type:'region'}).of(term.toUpperCase())||term}catch{}}
 const text=[job.residence,job.locationEvidence].join(' ').replace(/U\.S\.|\bUSA\b/g,'United States').replace(/U\.K\.|\bUK\b/g,'United Kingdom').toLowerCase();return text.includes(query.toLowerCase());
}
export function jobicyJob(j:any,active:boolean,now=Date.now()){
 const title=plain(j.jobTitle),description=plain(j.jobDescription).slice(0,24000),types=(Array.isArray(j.jobType)?j.jobType:[]).join(' ');
 if(!active||!development(title)||!/(?:contract|freelance|part[ -]?time)/i.test(types))return null;
 const url=safeUrl(j.url,['jobicy.com']);if(!url||!Number.isSafeInteger(j.id)||j.id<=0)return null;
 const residence=plain(j.jobGeo)||'記載なし';const locationEvidence=evidence(title+' '+description,/(?:must (?:be |reside |live )|(?:U\.S\.|US|UK|United States|United Kingdom|Canada|Australia)[ -]based|based in |residents? of |only (?:in|within) )/i);const published=Date.parse(j.pubDate);if(!Number.isFinite(published))return null;
 return {id:'jobicy:'+j.id,providerId:j.id,source:'Jobicy',title,description,company:plain(j.companyName),url,category:category(title),contract:/part[ -]?time/i.test(types)?'パート・アルバイト':'業務委託',country:'記載なし',residence,worldwide:/^(anywhere|worldwide|global)$/i.test(residence)&&!locationEvidence,locationEvidence,...conditions(description),...languageConditions(title,description),skills:['React','Next.js','JavaScript','TypeScript','Python','PHP','WordPress','Flutter','Swift','Kotlin','OpenAI','SQL'].filter(v=>description.toLowerCase().includes(v.toLowerCase())),currency:j.salaryCurrency||'',minSalary:typeof j.salaryMin==='number'?j.salaryMin:null,maxSalary:typeof j.salaryMax==='number'?j.salaryMax:null,period:j.salaryPeriod==='yearly'?'annual':j.salaryPeriod||'annual',published,expires:now+26*3600000,deadlineUnknown:true,checkedAt:now,status:'募集中（掲載元API）'};
}

export function arbeitnowJob(j:any,source:string,now=Date.now()){
 const title=plain(j.title),description=plain(j.description).slice(0,24000);
 const types=(Array.isArray(j.job_types)?j.job_types:[]).join(' ');
 // A generic “contract” can mean fixed-term employment; accept only explicit freelance/part-time evidence.
 const part=/part[ _-]?time|teilzeit/i.test(types),freelance=/freelanc|self[ -]employed|independent contractor|selbstständig|freiberuf/i.test(types);
 if(!development(title)||(!part&&!freelance))return null;
 const host=source==='Arbeitnow UK'?'arbeitnow.co.uk':'arbeitnow.com';const url=safeUrl(j.url,[host]);
 const published=Number(j.created_at)*1000;if(!url||!Number.isFinite(published)||published<=0||published>now+86400000)return null;
 const location=plain(j.location)||'記載なし';const locationEvidence=evidence(description,/(?:must (?:be |reside |live )|(?:U\.S\.|US|UK|United States|United Kingdom|Canada|Australia)[ -]based|based in |residents? of |only (?:in|within) )/i);
 return {id:url,source,title,description,company:plain(j.company_name),url,category:category(title),contract:part?'パート・アルバイト':'業務委託',contractEvidence:types,country:'記載なし',residence:locationEvidence?'本文に居住条件あり・要確認':'記載なし',workplace:location,worldwide:false,locationEvidence,remote:j.remote===true,...conditions(description),...languageConditions(title,description),skills:['React','Next.js','JavaScript','TypeScript','Python','PHP','WordPress','Flutter','Swift','Kotlin','OpenAI','SQL'].filter(v=>(title+' '+description).toLowerCase().includes(v.toLowerCase())),currency:'',minSalary:null,maxSalary:null,period:'unknown',published,expires:now+26*3600000,deadlineUnknown:true,checkedAt:now,status:'募集中（掲載元API）'};
}
