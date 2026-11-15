/**
 * Ensures ASSETS is only consulted for static paths so /api/* never receives HTML.
 * No real network, secrets, or deploy.
 */
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundled=await build({entryPoints:['lib/static-asset-path.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {isStaticAssetPath}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));

assert.equal(isStaticAssetPath('/_next/static/css/index.abc.css'), true);
assert.equal(isStaticAssetPath('/_next/static/chunks/framework-x.js'), true);
assert.equal(isStaticAssetPath('/tavily-guide/step-1.svg'), true);
assert.equal(isStaticAssetPath('/favicon.svg'), true);
assert.equal(isStaticAssetPath('/vinext-client-entry-manifest.json'), true);
assert.equal(isStaticAssetPath('/api/tavily/settings'), false);
assert.equal(isStaticAssetPath('/api'), false);
assert.equal(isStaticAssetPath('/'), false);
assert.equal(isStaticAssetPath('/mcp'), false);
assert.equal(isStaticAssetPath('/../etc/passwd.css'), false);

const htmlDoc='<!DOCTYPE html><html><body>asset-html</body></html>';
let assetsHits=0;
let handlerHits=0;
const env={
 ASSETS:{
  async fetch(req){
   assetsHits++;
   return new Response(htmlDoc,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
  },
 },
 SHARE_ACCESS_TOKEN:'a'.repeat(32),
};
const handler={
 async fetch(){
  handlerHits++;
  return Response.json({ok:true,via:'handler'});
 },
};

async function route(request){
 const url=new URL(request.url);
 // share gate: require cookie matching token (simplified)
 const cookie=request.headers.get('cookie')||'';
 if(!cookie.includes('atlas-share=')){
  return new Response('<!DOCTYPE html><html>gate</html>',{status:401,headers:{'Content-Type':'text/html; charset=utf-8'}});
 }
 if(env.ASSETS && isStaticAssetPath(url.pathname)){
  const assetResponse=await env.ASSETS.fetch(request);
  if(assetResponse.status!==404)return assetResponse;
 }
 return handler.fetch(request);
}

const cookie='atlas-share='+encodeURIComponent(env.SHARE_ACCESS_TOKEN);
const api=await route(new Request('https://fixture.local/api/tavily/settings',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:'{}'}));
assert.equal(api.status,200);
assert.match(api.headers.get('content-type')||'',/json/i);
const apiBody=await api.json();
assert.equal(apiBody.via,'handler');
assert.equal(assetsHits,0,'ASSETS must not run for /api/*');
assert.equal(handlerHits,1);

const css=await route(new Request('https://fixture.local/_next/static/css/index.abc.css',{headers:{cookie}}));
assert.equal(css.status,200);
assert.match(await css.text(),/<!DOCTYPE/);
assert.equal(assetsHits,1,'ASSETS runs for static CSS');

const unauth=await route(new Request('https://fixture.local/api/tavily/settings'));
assert.equal(unauth.status,401);
assert.match(unauth.headers.get('content-type')||'',/html/i);

// Regression: old behavior (ASSETS for every path) would break JSON clients
assetsHits=0;handlerHits=0;
async function brokenRoute(request){
 const cookieHdr=request.headers.get('cookie')||'';
 if(!cookieHdr.includes('atlas-share='))return new Response('gate',{status:401});
 if(env.ASSETS){
  const assetResponse=await env.ASSETS.fetch(request);
  if(assetResponse.status!==404)return assetResponse;
 }
 return handler.fetch(request);
}
const broken=await brokenRoute(new Request('https://fixture.local/api/tavily/settings',{headers:{cookie}}));
assert.equal(broken.status,200);
const brokenText=await broken.text();
assert.match(brokenText,/^<!DOCTYPE/);
assert.throws(()=>JSON.parse(brokenText),/Unexpected token/);

console.log('PASS: static-only ASSETS routing; /api stays JSON; unauth gate HTML 401; old ASSETS-first path reproduces JSON parse failure.');
