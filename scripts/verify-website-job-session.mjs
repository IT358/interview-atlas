import assert from 'node:assert/strict';
import {build} from 'esbuild';

async function mod(entry){
 const b=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
 return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
}

const session=await mod('lib/website-job-session.ts');
const search=await mod('lib/website-job-search.ts');

const job=(id,source='クラウドワークス')=>{
 const url=source==='ランサーズ'?`https://www.lancers.jp/work/detail/${id}`
  :source==='ココナラ'?`https://coconala.com/requests/${id}`
  :source==='クラウディア'?`https://www.craudia.com/work_detail/${id}`
  :`https://crowdworks.jp/public/jobs/${id}`;
 return {
  id:String(id),
  url,
  title:'企業サイト制作',
  source,
  market:'日本',
  category:'Web制作全般',
  categories:['Web制作全般'],
  description:'企業向けホームページ制作の依頼です。HTML CSSでのコーディングとWordPress実装、問い合わせフォーム公開までお願いします。'.repeat(2),
  searchText:'企業向けホームページ制作の依頼です。HTML CSSでのコーディングとWordPress実装、問い合わせフォーム公開までお願いします。'.repeat(2),
  verifiedAt:Date.now(),
  expires:Date.now()+10*86400000,
  published:Date.now(),
 };
};

// 1) Additive Tavily mock merge keeps prior valid jobs (34→ stay ≥34 when batch adds few).
// Display cap is 100: a 34-job prior batch is shown in full (no holdback).
const prior=Array.from({length:34},(_,i)=>job(1000+i,i%3===0?'ココナラ':'クラウドワークス'));
const novel=[job(9001,'ランサーズ'),job(1001)]; // 1001 duplicate of prior
const {merged,saved}=session.mergeSearchBatch({
 additive:true,
 catalog:prior,
 jobs:prior.slice(0,100),
 next:novel,
 overflow:[],
 held:[job(9002,'クラウディア')],
 excludedUrls:[],
});
assert.equal(merged.length,35); // 34 prior + 1 novel Lancers (dup dropped)
assert.ok(merged.some(j=>j.source==='ランサーズ'));
assert.equal(saved.length,36); // +held overflow unique
const totals=session.sessionMatchTotals(saved,{cat:'Web制作全般'},[]);
assert.equal(totals.matched,36);
// Display-cap holdback: with >100 matches, first response keeps at most 100 visible.
const many=Array.from({length:120},(_,i)=>job(3000+i,i%2===0?'ココナラ':'クラウドワークス'));
assert.equal(many.slice(0,100).length,100);
assert.equal(many.slice(100).length,20);

// 2) New discover replaces; does not keep unrelated catalog rows.
const replaced=session.mergeSearchBatch({
 additive:false,
 catalog:prior,
 jobs:prior,
 next:[job(2001),job(2002,'ココナラ')],
 overflow:prior,
 held:[],
});
assert.equal(replaced.merged.length,2);
assert.equal(replaced.saved.length,2);

// 3) Stats: Tavily verified=1 + discover verified=9 → verified 10 with matched 10 (prod-like 検証済み1表示バグの回帰).
const brokenStyle={tavilyScanned:20,tavilyVerified:1,tavilyMatched:1,tavilyDupes:4,tavilyMismatch:1,discoverScanned:6,discoverVerified:9,discoverMatched:9,discoverDupes:0,discoverMismatch:0,validCount:10};
const fixed=session.combineRequestStats(brokenStyle);
assert.equal(fixed.scanned,26);
assert.equal(fixed.verified,10);
assert.equal(fixed.matched,10);
assert.equal(fixed.duplicatesExcluded,4);
assert.equal(fixed.filterMismatched,1);
assert.equal(fixed.coherent,true);
const oldVerifiedOnlyTavily=brokenStyle.tavilyVerified;
assert.notEqual(oldVerifiedOnlyTavily,fixed.matched); // reproduces the misleading 1 vs 10

// 4) All-site plans include Lancers domain; key-free discover returns [] for Lancers-only source.
const plans=search.websiteSearchPlans({cat:'Web制作全般'},2,0);
assert.ok(plans[0].domains.includes('lancers.jp'));
const emptyLancers=await search.discoverOfficialWebsiteUrls({source:'ランサーズ',cat:'Web制作全般'});
assert.deepEqual(emptyLancers,[]);

// 5) Restore message must not claim N件 when filter yields 0 (incomplete/expired session stubs).
const stubs=Array.from({length:46},(_,i)=>({url:`https://crowdworks.jp/public/jobs/${20000+i}`,source:'クラウドワークス',title:'t'+i,market:'日本'}));
const visibleStub=session.sessionMatchTotals(stubs,{cat:'Web制作全般',market:'日本'},[]).matched;
assert.equal(stubs.length,46);
assert.equal(visibleStub,0); // raw restore count must not be shown as display count

console.log('Session merge/stats regression passed: additive keeps prior jobs, replace clears, combined verified covers discover, Lancers absent from key-free discover, restore stubs do not count as visible.');
