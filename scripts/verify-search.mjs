import assert from 'node:assert/strict';
import {build} from 'esbuild';
const modules = await Promise.all(['job-categories','grounded-search','web-skills'].map(async name=>{
 const result=await build({entryPoints:['lib/'+name+'.ts'],bundle:true,platform:'node',format:'esm',write:false});
 return import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
}));
const [category,search,skills]=modules;
const fixtures=[
 {title:'企業ホームページのリニューアル',description:'WordPressとContact Form 7で修正。実務未経験可。',company:'テスト会社'},
 {title:'FigmaからLPのコーディング',description:'HTML CSS SCSSでレスポンシブ対応'},
 {title:'iOS Androidアプリ開発',description:'Flutterのエンジニア募集'},
 {title:'Web designer',description:'Figma UI UX web design'},
 {title:'バックエンドAPI開発',description:'Node.js TypeScriptでWebアプリ開発'}
];
assert.equal(category.matchesCategory(fixtures[0],'Web制作全般'),true);
assert.equal(category.matchesCategory(fixtures[0],'CMS・EC・ノーコード全般'),true);
assert.equal(category.matchesCategory(fixtures[0],'WordPress制作・修正'),true);
assert.equal(category.matchesCategory(fixtures[0],'iOS・Androidアプリ開発・修正'),false);
assert.equal(category.matchesCategory(fixtures[1],'コーディング全般'),true);
assert.equal(category.matchesCategory(fixtures[1],'HTML・CSS実装全般'),true);
assert.equal(category.matchesCategory(fixtures[2],'アプリ・システム全般'),true);
assert.equal(category.matchesCategory(fixtures[3],'デザイン制作全般'),true);
assert.equal(category.matchesCategory(fixtures[4],'Webアプリ・API全般'),true);
assert.equal(category.matchesKeywords(fixtures[0],'wordpress 修正'),true);
assert.equal(category.matchesKeywords(fixtures[0],'WordPress Shopify'),false);
assert.equal(category.matchesKeywords(fixtures[1],'ＨＴＭＬ　ｃｓｓ'),true);
assert.equal(category.matchesCategory({title:'募集',category:'Web制作全般'},'Web制作全般'),true);
for(const family of category.categoryTree){
 assert.equal(category.categoryPath(family.value).family.value,family.value);
 for(const branch of family.branches){
  assert.equal(category.categoryPath(branch.value).branch.value,branch.value);
  for(const leaf of branch.items){assert.equal(category.categoryPath(leaf).family.value,family.value);assert(category.categoryMembers(family.value).includes(leaf));assert(category.categoryMembers(branch.value).includes(leaf));}
 }
}
assert.equal(skills.matchesSkill(fixtures[0],'Contact Form 7'),true);
const c={...search.emptySearch,cat:'CMS・EC・ノーコード全般',q:'修正',exp:'未経験可',call:'不要',market:'日本',skill:'WordPress',minimum:'10000',period:'fixed'};
const query=search.searchTerms(c);
for(const word of ['修正','WordPress','未経験可','英語通話不要','10000'])assert(query.includes(word));
assert(query.includes(' OR '));
const url=new URL(search.googleSearchUrl(c));
assert.equal(url.origin,'https://www.google.com');assert.equal(url.searchParams.get('q'),query);
assert.equal(category.matchesCategory(fixtures[0],c.cat)&&category.matchesKeywords(fixtures[0],c.q)&&skills.matchesSkill(fixtures[0],c.skill),true);
console.log('Search checks passed: broad / branch / leaf, parent coverage, keyword AND, full-width text, combined filters and external query.');
assert.equal(category.matchesCategory({title:'登録案件',category:'CMS・EC・ノーコード全般'},'Web制作全般'),true);
assert.equal(category.matchesCategory({title:'Artist portfolios'},'iOS・Androidアプリ開発・修正'),false);
const tavilyBuild=await build({entryPoints:['lib/tavily-search.ts'],bundle:true,platform:'node',format:'esm',write:false});
const tavily=await import('data:text/javascript;base64,'+Buffer.from(tavilyBuild.outputFiles[0].text).toString('base64'));
const originalFetch=globalThis.fetch;let sent;
try{
 globalThis.fetch=async (url,options)=>{sent={url,headers:options.headers,body:JSON.parse(options.body)};return Response.json({results:[{title:'掲載案件',url:'https://example.com/job',content:'元の募集文'},{title:'除外',url:'javascript:alert(1)'}],usage:{credits:1}})};
 const result=await tavily.runTavilySearch(c,'tvly-test-placeholder-only',new AbortController().signal);
 assert.equal(sent.url,'https://api.tavily.com/search');assert.equal(sent.body.search_depth,'basic');assert.equal(sent.body.auto_parameters,false);assert.equal(sent.body.query,query);assert.equal(result.results.length,1);assert.equal(result.results[0].url,'https://example.com/job');assert.equal(result.credits,1);
 for(const status of [401,429,432]){
  globalThis.fetch=async()=>new Response('',{status});
  await assert.rejects(tavily.runTavilySearch(c,'tvly-test-placeholder-only',new AbortController().signal),/Tavily/);
 }
}finally{globalThis.fetch=originalFetch}
console.log('Provider contract checks passed: query, basic credits, safe results, invalid key and quota errors. No live API credits used.');
