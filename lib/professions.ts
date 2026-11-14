/** The requested 29 professions: one source for UI, discovery, matching and external queries. */
export type Profession={id:string;label:string;category:string;family:string;ja:string;en:string;pattern:RegExp;cw:number[];coco:number[];skills:string[]};
export const professionFamilies=[
 {id:'web',label:'Web制作',description:'サイト制作・CMS・EC・保守',category:'Web制作全般'},
 {id:'dev',label:'開発・エンジニア',description:'コーディング・Web・スマホアプリ',category:'開発エンジニア全般'},
 {id:'ai',label:'AI・自動化',description:'チャットボット・RAG・API・データ収集',category:'AI・自動化全般'},
 {id:'design',label:'デザイン',description:'Web・UI/UX・画像・ブランド・資料',category:'デザイン制作全般'},
 {id:'content',label:'ライティング・翻訳',description:'記事執筆・翻訳・ローカライズ',category:'ライティング・翻訳全般'},
 {id:'growth',label:'マーケティング',description:'SEO・SNS・Web広告',category:'マーケティング全般'},
 {id:'data',label:'データ・調査・QA',description:'分析・オンライン調査・品質検証',category:'データ・調査・QA全般'}
];
export const professions:Profession[]=[
 {id:'website',label:'ホームページ制作',category:'HP・企業サイト制作',family:'web',ja:'ホームページ制作',en:'website development',pattern:/ホームページ|企業サイト|コーポレートサイト|HP\s*(?:制作|作成|修正|改修)|website|corporate site/i,cw:[14],coco:[22],skills:['HTML','CSS','WordPress','STUDIO']},
 {id:'lp',label:'LP制作',category:'LP制作',family:'web',ja:'LP制作 ランディングページ',en:'landing page',pattern:/ランディングページ|\bLP\b|LP制作|LPデザイン|landing[ -]?page/i,cw:[17],coco:[22],skills:['Figma','HTML','CSS']},
 {id:'wordpress',label:'WordPressエンジニア',category:'WordPress制作・修正',family:'web',ja:'WordPress 構築 修正',en:'WordPress',pattern:/wordpress|ワードプレス|\bSWELL\b|Divi/i,cw:[20],coco:[22],skills:['WordPress','PHP','ACF','WooCommerce']},
 {id:'coder',label:'Webコーダー',category:'HTML・CSSコーディング',family:'dev',ja:'HTML CSS コーディング',en:'HTML CSS coding',pattern:/コーディング|コーダー|マークアップ|HTML|CSS|markup|Figma to HTML|PSD to HTML/i,cw:[16],coco:[22],skills:['HTML','CSS','SCSS','JavaScript']},
 {id:'frontend',label:'フロントエンドエンジニア',category:'フロントエンド開発',family:'dev',ja:'フロントエンド 開発',en:'frontend',pattern:/フロントエンド|front[ -]?end|React(?! Native)|Next\.js|Vue(?:\.js)?|Angular/i,cw:[173, 2],coco:[813, 231],skills:['React','Next.js','TypeScript','Vue']},
 {id:'backend',label:'バックエンドエンジニア',category:'バックエンド開発',family:'dev',ja:'バックエンド 開発',en:'backend',pattern:/バックエンド|back[ -]?end|server[ -]?side|Laravel|Django|FastAPI|Rails|Node\.?js|サーバーサイド/i,cw:[173, 83, 12],coco:[232, 231],skills:['PHP','Python','Node.js','SQL','Laravel']},
 {id:'fullstack',label:'フルスタックエンジニア',category:'フルスタック開発',family:'dev',ja:'フルスタック 開発',en:'full stack',pattern:/フルスタック|full[ -]?stack|MERN|MEAN stack/i,cw:[173, 83, 2],coco:[813, 232],skills:['React','Next.js','Node.js','SQL']},
 {id:'mobile',label:'スマホアプリ開発者',category:'iOS・Androidアプリ開発・修正',family:'dev',ja:'スマホアプリ 開発',en:'mobile app development',pattern:/スマホアプリ|スマートフォンアプリ|\biOS\b|\bAndroid\b|Flutter|SwiftUI|React Native|mobile (?:app|application)/i,cw:[81,3,4,82],coco:[237],skills:['Flutter','React Native','Swift','Kotlin']},
 {id:'ecommerce',label:'ECサイト構築エンジニア',category:'ECサイト制作',family:'web',ja:'ECサイト 構築 Shopify',en:'ecommerce',pattern:/ECサイト|ネットショップ|Shopify|e[ -]?commerce|WooCommerce|EC-CUBE|Magento/i,cw:[2, 14, 20],coco:[22],skills:['Shopify','Liquid','WooCommerce','EC-CUBE']},
 {id:'maintenance',label:'Webサイト保守・運用',category:'サイト修正・運用',family:'web',ja:'Webサイト 保守 更新',en:'website maintenance',pattern:/(?:サイト|ホームページ|Web).{0,14}(?:保守|運用|更新|修正|改修|移行)|website (?:maintenance|update|fix)|site migration/i,cw:[285],coco:[22],skills:['WordPress','PHP','Git','SSL']},
 {id:'chatbot',label:'AIチャットボット開発者',category:'AIチャットボット開発',family:'ai',ja:'AI チャットボット 開発',en:'chatbot',pattern:/チャットボット|chat[ -]?bot|AI (?:assistant|chat)|対話AI/i,cw:[370, 173],coco:[1002, 28],skills:['OpenAI','Python','TypeScript','LangChain']},
 {id:'automation',label:'AI業務自動化エンジニア',category:'AI業務自動化',family:'ai',ja:'AI 業務 自動化 開発',en:'AI automation',pattern:/業務自動化|業務効率化|AI.{0,20}(?:自動化|システム開発)|自動化.{0,20}(?:AI|開発|構築)|automation|\bn8n\b|\bRPA\b|Zapier|自動投稿システム/i,cw:[370, 369, 13],coco:[1002, 28],skills:['Python','n8n','Make','Zapier','GAS']},
 {id:'rag',label:'RAGアプリ開発者',category:'RAGアプリ開発',family:'ai',ja:'RAG 検索拡張生成 開発',en:'RAG',pattern:/\bRAG\b|検索拡張生成|retrieval[ -]augmented|ベクトル検索|vector (?:search|database)|ナレッジ検索/i,cw:[370, 173],coco:[1002, 28],skills:['Python','LangChain','Embeddings','Vector DB']},
 {id:'api',label:'API連携エンジニア',category:'API連携開発',family:'ai',ja:'API 連携 開発',en:'API integration',pattern:/API.{0,12}(?:連携|統合|接続|integration|integrat)|API連携|webhook|OAuth|API integration/i,cw:[173, 83],coco:[231, 232],skills:['REST API','OAuth','Webhook','Node.js']},
 {id:'scraping',label:'データ収集・スクレイピング開発者',category:'データ収集・スクレイピング開発',family:'ai',ja:'スクレイピング データ収集 開発',en:'web scraping',pattern:/スクレイピング|scrap(?:ing|er)|クローラー|crawler|クロール|データ収集.{0,12}(?:自動|開発|ツール)/i,cw:[282],coco:[231],skills:['Python','Playwright','Scrapy','BeautifulSoup']},
 {id:'webdesign',label:'Webデザイナー',category:'Webデザイン',family:'design',ja:'Webデザイン 制作',en:'website design',pattern:/(?:Web|ウェブ|サイト|ホームページ).{0,6}(?:デザイン|デザイナー)|web[ -]?design|website design|website redesign/i,cw:[15],coco:[22],skills:['Figma','Photoshop','Adobe XD']},
 {id:'uiux',label:'UI/UXデザイナー',category:'UI・UXデザイン',family:'design',ja:'UI UX デザイン',en:'UI UX design',pattern:/UI.?UX|\bUI\b|\bUX\b|product design|プロダクトデザイ/i,cw:[77,112],coco:[683],skills:['Figma','Adobe XD','プロトタイピング']},
 {id:'banner',label:'バナー・SNS画像デザイナー',category:'バナー・画像制作',family:'design',ja:'バナー SNS画像 制作',en:'banner design',pattern:/バナー|SNS画像|投稿画像|Instagram.{0,12}(?:画像|デザイン)|banner|social media (?:post|graphic)|SNS投稿デザイン/i,cw:[18, 26],coco:[353],skills:['Canva','Photoshop','Illustrator']},
 {id:'brand',label:'ロゴ・ブランドデザイナー',category:'ロゴ・グラフィック制作',family:'design',ja:'ロゴ ブランド デザイン',en:'logo branding',pattern:/ロゴ|ブランディング|ブランドデザイン|\blogo\b|brand(?:ing| identity)|visual identity/i,cw:[26],coco:[351],skills:['Illustrator','Photoshop','Figma']},
 {id:'presentation',label:'資料デザイナー',category:'資料・スライドデザイン',family:'design',ja:'資料 スライド デザイン',en:'presentation design',pattern:/資料.{0,8}(?:デザイン|デザイナー)|スライド(?:制作|作成|デザイン)|営業資料|提案資料|PowerPoint|パワーポイント|ピッチデック|presentation|pitch deck|slide design/i,cw:[202],coco:[427],skills:['PowerPoint','Google Slides','Canva']},
 {id:'thumbnail',label:'YouTubeサムネイル制作者',category:'YouTubeサムネイル制作',family:'design',ja:'YouTube サムネイル 制作',en:'YouTube thumbnail',pattern:/サムネイル|サムネ制作|thumbnail/i,cw:[18,57,26],coco:[353],skills:['Photoshop','Canva']},
 {id:'writing',label:'Webライター',category:'Webライティング',family:'content',ja:'Webライター 記事執筆',en:'article writing',pattern:/ライター|ライティング|記事(?:作成|執筆|制作)|文章(?:作成|執筆)|ブログ執筆|writer|writing|copywriting|blog (?:post|article)/i,cw:[37, 36, 318],coco:[372],skills:['SEO','Google Docs','WordPress']},
 {id:'translation',label:'翻訳・ローカライズ担当',category:'翻訳・ローカライズ',family:'content',ja:'翻訳 ローカライズ',en:'translation',pattern:/翻訳|ローカライズ|ローカリゼーション|translat|locali[sz]ation/i,cw:[39, 154, 155, 163],coco:[290],skills:['英語','日本語','中国語','タイ語','CATツール']},
 {id:'seo',label:'SEOコンサルタント',category:'SEOコンサルティング',family:'growth',ja:'SEO コンサルティング 改善',en:'SEO',pattern:/\bSEO\b|検索エンジン最適化|search engine optimi[sz]ation/i,cw:[132],coco:[310],skills:['SEO','Search Console','GA4','Ahrefs']},
 {id:'social',label:'SNS運用代行',category:'SNS運用',family:'growth',ja:'SNS 運用 代行',en:'social media management',pattern:/(?:SNS|Instagram|インスタ|X|Threads|TikTok).{0,12}(?:運用|投稿管理|集客)|social media (?:manag|market)|community manag/i,cw:[133, 303],coco:[],skills:['Instagram','X','TikTok','Canva']},
 {id:'ads',label:'Web広告運用者',category:'Web広告運用',family:'growth',ja:'Web広告 運用',en:'Google Ads',pattern:/(?:広告|リスティング|Google広告|Meta広告).{0,15}(?:運用|配信|管理)|Google Ads|Facebook Ads|Meta Ads|PPC|paid (?:ads|advertising|media)|ad campaign/i,cw:[292, 131],coco:[313],skills:['Google Ads','Meta Ads','GA4','Google Tag Manager']},
 {id:'analysis',label:'データアナリスト',category:'データ分析',family:'data',ja:'データ 分析 統計',en:'data analysis',pattern:/データ(?:分析|解析|アナリスト)|統計解析|集計.{0,10}分析|data analy|Power BI|Tableau|BIダッシュボード/i,cw:[66, 134],coco:[623, 314],skills:['SQL','Python','Excel','Tableau','Power BI']},
 {id:'research',label:'オンラインリサーチャー',category:'オンラインリサーチ',family:'data',ja:'市場調査 リサーチ',en:'web research',pattern:/リサーチ|市場調査|競合調査|情報収集|調査業務|オンライン調査|(?:web|online|market|internet|desk) research/i,cw:[86, 100, 307],coco:[274],skills:['Excel','Google Sheets','市場調査']},
 {id:'qa',label:'QAテスター',category:'QA・テスト',family:'data',ja:'QA テスト 検証',en:'software testing',pattern:/\bQA\b|テスター|テスト(?:設計|実施|業務|エンジニア)|動作確認|クローズドテスト|(?:software|app|website|manual|automation) test|quality assurance/i,cw:[51, 178],coco:[814],skills:['Playwright','Cypress','テスト設計','Postman']}
];
export function normalizeProfessionCategory(value:string){return professions.find(p=>p.label===value||p.id===value)?.category||value}
export function professionForCategory(value:string){const cat=normalizeProfessionCategory(value);return professions.find(p=>p.category===cat)}
const excluded=/動画編集|ビデオ編集|video (?:creation|production)|YouTube動画編集|video edit|アンケート回答|質問・アンケート|モニター募集|オンラインインタビュー|インタビュー依頼|商品購入|レビュー投稿|口コミ投稿|営業代行|営業パートナー|提案パートナー|アポインター|テレアポ|販売代理|成人向け出演|data entry|lead generation|appointment sett/i;
export function projectProfessions(title:string,description:string){
 const t=title.normalize('NFKC'),body=description.normalize('NFKC');if(excluded.test(t))return [];
 let found=professions.filter(p=>p.pattern.test(t));
 // Titles describe the requested deliverable. Tool names in a brief do not turn a writer into an AI engineer.
 if(!found.length)found=professions.filter(p=>p.pattern.test(body.slice(0,1600)));
 const editorial=found.some(p=>p.id==='writing'||p.id==='translation');
 if(found.some(p=>p.id==='chatbot')&&/RAG.{0,14}(?:実装|構築|開発|導入)|(?:実装|構築|開発).{0,14}RAG|(?:implement|build|develop).{0,20}\bRAG\b/i.test(body.slice(0,1600))&&!found.some(p=>p.id==='rag'))found.push(professions.find(p=>p.id==='rag')!);
 if(editorial)found=found.filter(p=>!['website','wordpress','frontend','backend','mobile','chatbot','automation','rag','api','scraping','research'].includes(p.id));
 if(found.some(p=>p.id==='qa'))found=found.filter(p=>p.id!=='mobile');
 if(found.some(p=>p.id==='mobile'))found=found.filter(p=>!['website','wordpress','maintenance','webdesign'].includes(p.id));
 if(found.some(p=>['chatbot','automation','rag','scraping','api'].includes(p.id)))found=found.filter(p=>!['social','writing','research'].includes(p.id));
 if(found.some(p=>p.id==='writing'))found=found.filter(p=>p.id!=='seo');
 return found;
}
export function freelanceWork(title:string,description:string){return description.length>=60&&projectProfessions(title,description).length>0&&/(?:依頼|お願い|募集|作業|制作|構築|納品|業務|担当|deliver|project|need|looking for|build|develop|design|seek|hire|require|help)/i.test(description)}
export function professionQuery(value:string,overseas=false){const p=professionForCategory(value);if(p)return overseas?p.en:p.ja;const f=professionFamilies.find(f=>f.category===value);if(f){const subset=professions.filter(p=>p.family===f.id);return '('+subset.map(p=>overseas?p.en:p.ja).join(' OR ')+')'}return ''}
export function projectExperience(title:string,description:string){
 const text=title+' '+description;
 const novice=/実務未経験(?:でも)?(?:可|OK|歓迎)|実務経験(?:不問|不要)|実務経験(?:が)?な(?:くても|しでも)|no (?:prior |professional |previous )?experience (?:is )?(?:required|necessary)/i.test(text);
 const hard=/実務経験.{0,12}(?:必須|[1-9]\d*\s*年以上)|(?:at least|minimum of)\s*\d+\s*years?.{0,20}experience|proven (?:professional |commercial )?experience/i.test(text);
 const required=hard||/実務経験(?:が|の)?ある方|実務経験をお持ち|(?:必須条件|応募条件).{0,80}実務経験/i.test(text);
 return novice&&hard?'条件併記・要確認':novice?'未経験可':required?'経験必須':'記載なし';
}
