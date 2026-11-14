#!/usr/bin/env node
/**
 * Independent Cloudflare production build (R2-free).
 * Differs from `npm run build`:
 * - Does not read .openai/hosting.json for bindings
 * - Emits dist/server/wrangler.production.json (no R2, billing=0, run_worker_first)
 * - Secrets stay out of the generated config (set via `wrangler secret` later)
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareProductionWrangler,assertProductionArtifact,GENERATED_CONFIG} from './production-wrangler.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
process.chdir(root);

const env={...process.env,ATLAS_PRODUCTION_BUILD:'1'};
const build=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{stdio:'inherit',env});
if(build.status)process.exit(build.status??1);

const {config,path:out,d1Ready}=prepareProductionWrangler();
assertProductionArtifact(config,{requireDeployReady:false});

console.log('Production Worker build complete.');
console.log('Generated: '+out);
console.log('R2: none');
console.log('OWNER_BILLING_APPROVED: '+config.vars.OWNER_BILLING_APPROVED);
console.log('assets.run_worker_first: '+config.assets.run_worker_first);
console.log('D1 id ready for deploy: '+(d1Ready?'yes':'no (placeholder — set ATLAS_D1_DATABASE_ID then re-run prepare or check:production)'));
console.log('Next: npm run check:production  (fails until a real D1 id is set)');
console.log('Deploy later with: wrangler deploy --config '+GENERATED_CONFIG.replace(root+'/',''));
