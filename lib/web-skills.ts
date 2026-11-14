export const webSkillGroups=[
 {label:'HTML・CSS・画面実装',items:['HTML','CSS','SCSS','Sass','レスポンシブ対応','Bootstrap','Tailwind CSS','BEM','アクセシビリティ']},
 {label:'動き・フロントエンド',items:['JavaScript','TypeScript','jQuery','GSAP','React','Next.js','Vue','Nuxt.js','Astro']},
 {label:'デザインツール',items:['Figma','Adobe XD','Photoshop','Illustrator','Canva']},
 {label:'WordPress・CMS',items:['WordPress','PHP','オリジナルテーマ','テーマカスタマイズ','カスタム投稿','ACF','Contact Form 7','WooCommerce','microCMS','Movable Type']},
 {label:'EC・ノーコード',items:['Shopify','Liquid','カラーミーショップ','BASE','STORES','EC-CUBE','STUDIO','Webflow','Wix','ペライチ']},
 {label:'公開・運用・改善',items:['Git','GitHub','FTP','サーバー移行','ドメイン・DNS','SSL','SEO','GA4','Google Tag Manager','Search Console','表示速度改善']}
];
// Group selections use OR: any member skill is enough; individual selections stay precise.
export const skillBundles=[
 {label:'Web制作全般',members:['HTML','CSS','JavaScript','jQuery','WordPress','Webflow','STUDIO','Wix','Shopify','Web制作','ホームページ制作','website development']},
 {label:'デザイン全般',members:[...webSkillGroups[2].items,'Webデザイン','UIデザイン','UXデザイン','グラフィック','web design','graphic design']},
 {label:'コーディング全般',members:[...webSkillGroups[0].items,...webSkillGroups[1].items,'コーディング','markup']},
 {label:'HTML・CSS系',members:webSkillGroups[0].items},
 {label:'JavaScript・フロントエンド系',members:webSkillGroups[1].items},
 {label:'WordPress・CMS系',members:webSkillGroups[3].items.filter(x=>x!=='PHP')},
 {label:'ECサイト系',members:['Shopify','Liquid','WooCommerce','カラーミーショップ','BASE','STORES','EC-CUBE','ECサイト','ecommerce']},
 {label:'ノーコード系',members:['STUDIO','Webflow','Wix','ペライチ','ノーコード','no-code']},
 {label:'サイト運用・改善系',members:['FTP','サーバー移行','ドメイン・DNS','SSL','SEO','GA4','Google Tag Manager','Search Console','表示速度改善','サイト運用','website maintenance']}
];
export function skillSearchTerm(skill:string){const bundle=skillBundles.find(g=>g.label===skill);return bundle?'('+bundle.members.map(x=>'"'+x+'"').join(' OR ')+')':skill}
const aliases:Record<string,string[]>={HTML:['HTML5'],CSS:['CSS3'],SCSS:['Sass'],Sass:['SCSS'],'Tailwind CSS':['tailwind'],Vue:['Vue.js'],'Next.js':['NextJS'],'Nuxt.js':['NuxtJS'],'Adobe XD':['AdobeXD'],'Photoshop':['フォトショップ'],'Illustrator':['イラストレーター'],'WordPress':['ワードプレス'],'ACF':['Advanced Custom Fields'],'Contact Form 7':['CF7','コンタクトフォーム7'],'GA4':['Google Analytics','Googleアナリティクス'],'Google Tag Manager':['GTM','タグマネージャー'],'Search Console':['サーチコンソール'],'レスポンシブ対応':['responsive','レスポンシブ'],'オリジナルテーマ':['独自テーマ','custom theme'],'テーマカスタマイズ':['テーマ修正','theme customization'],'カスタム投稿':['custom post'],'サーバー移行':['server migration'],'ドメイン・DNS':['DNS','ドメイン'],'表示速度改善':['Core Web Vitals','PageSpeed','速度改善'],'アクセシビリティ':['accessibility','WCAG']};
export function matchesSkill(j:{title?:string;description?:string;skills?:string[]},skill:string):boolean{
 if(!skill)return true;const bundle=skillBundles.find(g=>g.label===skill);if(bundle)return bundle.members.some(member=>matchesSkill(j,member));const text=[j.title,j.description,...(j.skills||[])].join(' ').normalize('NFKC').toLowerCase();
 return [skill,...(aliases[skill]||[])].some(x=>{const term=x.normalize('NFKC').toLowerCase();if(/^[a-z0-9 .+#-]+$/.test(term)){const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp('(^|[^a-z0-9])'+escaped+'(?=$|[^a-z0-9])','i').test(text)}return text.includes(term)});
}
