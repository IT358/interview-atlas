import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
const database=new DatabaseSync(':memory:');
for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())database.exec(readFileSync('drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint',''));
const databaseBinding={prepare(sql){if(globalThis.fixture?.storageFailure)throw Error("storage unavailable");assert(!/CREATE|ALTER|DROP/i.test(sql),'Request must not change schema');let args=[];return {bind(...v){args=v;return this},async run(){const result=database.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}},async first(){return database.prepare(sql).get(...args)||null}}}};
globalThis.fixture={user:'owner',row:null,calls:0,keyUpdated:1,db:databaseBinding};
const b=await build({entryPoints:['app/api/tavily/test/route.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'route-fixtures',setup(b){b.onResolve({filter:/cloudflare:workers|chatgpt-auth$|key-vault$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path.includes('chatgpt-auth')?`export async function getChatGPTUser(){return globalThis.fixture.user?{userId:globalThis.fixture.user}:null}`:a.path.includes('key-vault')?`export async function vaultOwner(r,id){return {owner:'account:'+id}};export async function readSettings(){return {key:'fixture-only',consent:true,updatedAt:globalThis.fixture.keyUpdated}}`:`export const env={USER_KEY_ENCRYPTION_KEY:'fixture',BUCKET:{},DB:globalThis.fixture.db};`}))}}]});
const route=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
const original=globalThis.fetch;globalThis.fetch=async(url)=>{assert(url.endsWith('/search'),'Must not gate paid plans on /usage');globalThis.fixture.calls++;return Response.json({results:[],usage:{credits:1}})};
const request=(data,origin='https://fixture.local')=>new Request('https://fixture.local/api/tavily/test',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(data)});
try{
 const execute={confirmed:true,requestId:crypto.randomUUID()};
 assert.equal((await route.POST(request(execute,'https://other.local'))).status,403);
 globalThis.fixture.user=null;assert.equal((await route.POST(request(execute))).status,401);globalThis.fixture.user='owner';
 assert.equal((await route.POST(request({...execute,confirmed:false}))).status,400);
 assert.equal((await route.POST(request({confirmed:true,requestId:'invalid'}))).status,400);
 assert.equal(globalThis.fixture.calls,0);
 const responses=await Promise.all([route.POST(request(execute)),route.POST(request(execute))]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal(globalThis.fixture.calls,1);
 assert.equal((await route.POST(request(execute))).status,409);assert.equal(globalThis.fixture.calls,1);
 globalThis.fixture.user='other';assert.equal((await route.POST(request(execute))).status,200);assert.equal(globalThis.fixture.calls,2);
 globalThis.fixture.storageFailure=true;
 assert.equal((await route.POST(request({confirmed:true,requestId:crypto.randomUUID()}))).status,503);assert.equal(globalThis.fixture.calls,2);
 console.log('Route fixtures passed: origin/login/explicit consent, concurrent duplicate sends once, owner separation, storage failure sends nothing.');
}finally{globalThis.fetch=original;delete globalThis.fixture}
