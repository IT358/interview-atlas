#!/usr/bin/env node
import {prepareProductionWrangler,assertProductionArtifact} from './production-wrangler.mjs';
const {config,path,d1Ready}=prepareProductionWrangler();
assertProductionArtifact(config,{requireDeployReady:false});
console.log('Wrote '+path);
console.log('D1 ready:', d1Ready?'yes':'no (placeholder)');
