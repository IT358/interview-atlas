import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';

async function load(file,defines={},plugins=[]){
 const b=await build({entryPoints:[file],bundle:true,platform:'node',format:'esm',write:false,define:defines,plugins});
 return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
}

const shareProd=await load('lib/share-access.ts',{'import.meta.env.PROD':'true','import.meta.env.DEV':'false'});
assert.equal(shareProd.shareGateActive({}),true);
assert.equal(shareProd.requestHasShareAccess(new Request('https://app.example/'),{}),false);
assert.equal(shareProd.requestHasShareAccess(new Request('https://app.example/?access=short'),{SHARE_ACCESS_TOKEN:'short'}),false);
const token='a'.repeat(24);
assert.equal(shareProd.requestHasShareAccess(new Request('https://app.example/?access='+token),{SHARE_ACCESS_TOKEN:token}),true);
assert.equal(shareProd.requestHasShareAccess(new Request('https://app.example/',{headers:{cookie:'atlas-share='+encodeURIComponent(token)}}),{SHARE_ACCESS_TOKEN:token}),true);
assert.equal(shareProd.requestHasShareAccess(new Request('https://app.example/?access=wrong-token-value-xxxx'),{SHARE_ACCESS_TOKEN:token}),false);

const shareDev=await load('lib/share-access.ts',{'import.meta.env.PROD':'false','import.meta.env.DEV':'true'});
assert.equal(shareDev.shareGateActive({}),false);
assert.equal(shareDev.shareGateActive({SHARE_ACCESS_TOKEN:token}),true);

const authPlugins=[{name:'fixture',setup(b){b.onResolve({filter:/^cloudflare:workers$|^next\/headers$|^next\/navigation$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'js',contents:a.path==='cloudflare:workers'?`export const env={};`:a.path==='next/headers'?`export async function headers(){return new Headers({'oai-authenticated-user-id':'spoofed','oai-authenticated-user-email':'spoof@example.test'})}`:`export function redirect(){throw Error('no')}`}))}}];
const auth=await load('app/chatgpt-auth.ts',{},authPlugins);
assert.equal(auth.sitesAuthHeadersTrusted({}),false);
assert.equal(auth.sitesAuthHeadersTrusted({TRUST_SITES_AUTH_HEADERS:'0'}),false);
assert.equal(auth.sitesAuthHeadersTrusted({TRUST_SITES_AUTH_HEADERS:'1'}),true);
assert.equal(await auth.getChatGPTUser(),null);

const vault=await load('lib/key-vault.ts');
const secret=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0003_r2_free_key_vault.sql','utf8'));
const d1={prepare(sql){let args=[];return {bind(...v){args=v;return this},async first(){return db.prepare(sql).get(...args)||null},async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}}}}};
const guestA=await vault.vaultOwner(new Request('https://fixture.local'));
const guestB=await vault.vaultOwner(new Request('https://fixture.local'));
assert.notEqual(guestA.owner,guestB.owner);
const payload={key:'tvly-guest-a-only-fake-key-value',model:'tavily-basic',consent:true,updatedAt:Date.now()};
await vault.writeSettings(d1,{owner:guestA.owner},payload,secret);
assert.deepEqual(await vault.readSettings(d1,{owner:guestA.owner,guest:true},secret),payload);
assert.equal(await vault.readSettings(d1,{owner:guestB.owner,guest:true},secret),null);
assert.equal(await vault.readSettings(d1,{owner:'guest:'+'c'.repeat(64),guest:true},secret),null);
const sealed=await vault.sealSettings(payload,guestA.owner,secret);
await assert.rejects(vault.openSettings(sealed,guestB.owner,secret));
db.close();

console.log('PASS: prod share deny when unset/invalid, guest vault isolation, Sites auth header distrust');
