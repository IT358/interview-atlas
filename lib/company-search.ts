export const companyTypes=['Web制作会社','Webデザイン会社','ホームページ制作会社','広告・デザイン会社','システム開発会社'];
export const companyPurposes=['協業・外注パートナー募集','制作会社全般'];
export const prospectStages=['未確認','連絡先確認済み','下書き作成','連絡済み','返信あり','商談中','受注','見送り','営業不可'];
export type CompanyConditions={region:string;type:string;service:string;purpose:string;q:string};
export const emptyCompany:CompanyConditions={region:'',type:'Web制作会社',service:'',purpose:companyPurposes[0],q:''};
export function companyQuery(c:CompanyConditions){return [c.region||'日本',c.type,c.service,c.purpose===companyPurposes[0]?'協業 外注 パートナー募集':'公式サイト',c.q].filter(Boolean).join(' ').slice(0,1800)}
export function safeCompanyUrl(value:string){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
export function companyDomain(value:string){try{return new URL(value).hostname.toLowerCase().replace(/^www\./,'')}catch{return ''}}
export function prospectDraft(name:string,profile:{name?:string;skills?:string;portfolio?:string},service:string){return `${name||'ご担当者'}様\n\n突然のご連絡失礼いたします。${profile.name||'［あなたのお名前］'}と申します。\n${service||'Web制作'}の制作・実装について、協業のご相談でご連絡いたしました。\n\n対応可能な内容：${profile.skills||'［実際に対応できる内容を記入］'}\n制作例：${profile.portfolio||'［共有可能な制作例のURLを記入］'}\n\n外部パートナーを募集されていましたら、条件や制作体制についてお話を伺えますと幸いです。\nご検討のほどよろしくお願いいたします。\n\n${profile.name||'［あなたのお名前］'}`}

export const companyRegions=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
