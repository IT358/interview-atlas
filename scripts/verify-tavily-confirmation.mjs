import assert from 'node:assert/strict';
import {build} from 'esbuild';
const b=await build({entryPoints:['lib/tavily-test.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {runConfirmedTavilyTest}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
let calls=[];
const result=await runConfirmedTavilyTest('fixture-only',async(url,options)=>{calls.push({url,options});return Response.json({results:[],usage:{credits:1}})});
assert.equal(result.ok,true);assert.equal(result.credits,1);assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.tavily.com/search');
assert.equal(calls[0].options.redirect,'manual');const payload=JSON.parse(calls[0].options.body);assert.equal(payload.search_depth,'basic');assert.equal(payload.auto_parameters,false);assert.equal(payload.max_results,1);
for(const [status,expected] of [[401,400],[403,403],[429,429],[432,429],[433,429],[500,502]]){let count=0;await assert.rejects(()=>runConfirmedTavilyTest('fixture-only',async()=>{count++;return new Response('',{status})}),e=>e.status===expected);assert.equal(count,1)}
for(const response of [()=>{throw Error('offline')},()=>new Response('bad json'),()=>Response.json({})]){let count=0;await assert.rejects(()=>runConfirmedTavilyTest('fixture-only',async()=>{count++;return response()}),e=>e.status===502);assert.equal(count,1)}
console.log('Provider fixtures passed: one basic call, no usage/plan gate, accurate key/quota errors, malformed/network failures and no retries. No live API calls.');
