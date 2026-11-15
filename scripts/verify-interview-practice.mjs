import assert from 'node:assert/strict';
import {build} from 'esbuild';

const bundled=await build({
  entryPoints:['lib/interview-practice.ts'],
  bundle:true,
  platform:'node',
  format:'esm',
  write:false,
});
const mod=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const {buildPracticeTurns,extractBriefHints}=mod;

const general=buildPracticeTurns({lang:'ja',source:'general'});
assert.equal(general.length,10);
assert.equal(general.filter(t=>t.kind==='main').length,5);
assert.equal(general.filter(t=>t.kind==='followup').length,5);
assert.ok(general[0].question.includes('貢献'));
assert.ok(general[1].kind==='followup');

const brief='WordPressでコーポレートサイトのLPを制作。リモート、Slack連絡。';
const hints=extractBriefHints(brief);
assert.equal(hints.tech,'WordPress');
assert.equal(hints.deliverable,'LP');
const job=buildPracticeTurns({lang:'ja',source:'job',brief});
assert.equal(job.length,10);
assert.ok(job[0].question.includes('LP'));
assert.ok(job[2].question.includes('WordPress'));
assert.ok(!job.some(t=>/虚偽|創作してください/.test(t.question)));

const emptyJob=buildPracticeTurns({lang:'ja',source:'job',brief:''});
assert.equal(emptyJob[0].question,general[0].question,'empty brief falls back to general');

console.log('Interview practice checks passed: 10-turn job/general sets, hint extraction, no fabrication prompts.');
