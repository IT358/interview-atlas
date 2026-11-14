import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const PLACEHOLDER_D1_ID='REPLACE_WITH_YOUR_D1_DATABASE_ID';
export const ZERO_D1_ID='00000000-0000-4000-8000-000000000000';
const root=fileURLToPath(new URL('..',import.meta.url));
export const DIST_SERVER=path.join(root,'dist','server');
export const DIST_CLIENT=path.join(root,'dist','client');
export const GENERATED_CONFIG=path.join(DIST_SERVER,'wrangler.production.json');
const BUILT_CONFIG=path.join(DIST_SERVER,'wrangler.json');

export function isPlaceholderD1Id(id){
 const value=String(id||'').trim();
 return !value||value===PLACEHOLDER_D1_ID||value===ZERO_D1_ID||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function readJson(file){
 if(!existsSync(file))throw new Error('Missing file: '+file);
 return JSON.parse(readFileSync(file,'utf8'));
}

/** Build a deployable Workers config from the vinext build output. No secrets, no R2, no Sites hosting.json. */
export function prepareProductionWrangler({databaseId=process.env.ATLAS_D1_DATABASE_ID||PLACEHOLDER_D1_ID}={}){
 if(!existsSync(path.join(DIST_SERVER,'index.js')))throw new Error('Built Worker missing at dist/server/index.js. Run the production build first.');
 if(!existsSync(DIST_CLIENT))throw new Error('Built assets missing at dist/client. Run the production build first.');
 const built=existsSync(BUILT_CONFIG)?readJson(BUILT_CONFIG):{};
 const id=String(databaseId||'').trim()||PLACEHOLDER_D1_ID;
 const config={
  name:'interview-atlas',
  main:'./index.js',
  compatibility_date:built.compatibility_date||'2026-05-15',
  compatibility_flags:['nodejs_compat'],
  vars:{
   OWNER_BILLING_APPROVED:'0',
  },
  d1_databases:[
   {
    binding:'DB',
    database_name:'interview-atlas-db',
    database_id:id,
    migrations_dir:path.relative(DIST_SERVER,path.join(root,'drizzle')).split(path.sep).join('/'),
   },
  ],
  assets:{
   directory:'../client',
   binding:'ASSETS',
   run_worker_first:true,
   not_found_handling:'none',
  },
 };
 if('r2_buckets' in config)delete config.r2_buckets;
 mkdirSync(DIST_SERVER,{recursive:true});
 writeFileSync(GENERATED_CONFIG,JSON.stringify(config,null,2)+'\n');
 return {config,path:GENERATED_CONFIG,d1Ready:!isPlaceholderD1Id(id)};
}

export function assertProductionArtifact(config,{requireDeployReady=false}={}){
 if(!config||typeof config!=='object')throw new Error('Production wrangler config is missing.');
 if(config.main!=='./index.js'&&config.main!=='index.js')throw new Error('Production main must point at built Worker ./index.js');
 if(Array.isArray(config.r2_buckets)&&config.r2_buckets.length)throw new Error('Production config must not include R2 buckets.');
 if(config.r2_buckets&&!Array.isArray(config.r2_buckets))throw new Error('Production config must not include R2 buckets.');
 const vars=config.vars||{};
 if(String(vars.OWNER_BILLING_APPROVED||'')!=='0')throw new Error('OWNER_BILLING_APPROVED must remain "0" in production config vars.');
 if(vars.SHARE_ACCESS_TOKEN||vars.USER_KEY_ENCRYPTION_KEY||vars.TRUST_SITES_AUTH_HEADERS){
  throw new Error('Secrets and Sites auth trust flags must not be embedded in production config vars.');
 }
 const assets=config.assets||{};
 if(assets.run_worker_first!==true)throw new Error('assets.run_worker_first must be true so the share gate covers static files.');
 if(!existsSync(path.resolve(DIST_SERVER,assets.directory||'../client')))throw new Error('assets.directory does not resolve to built client assets.');
 const d1=config.d1_databases?.[0];
 if(!d1||d1.binding!=='DB')throw new Error('Production config must bind D1 as DB.');
 const migrations=path.resolve(DIST_SERVER,d1.migrations_dir||'');
 if(!existsSync(path.join(migrations,'meta','_journal.json')))throw new Error('migrations_dir does not resolve to drizzle migrations.');
 if(requireDeployReady&&isPlaceholderD1Id(d1.database_id)){
  const err=new Error('Deploy blocked: set a real D1 database id via ATLAS_D1_DATABASE_ID before deploy. Placeholder/zero IDs are not allowed.');
  err.code='D1_ID_REQUIRED';
  throw err;
 }
 return true;
}
