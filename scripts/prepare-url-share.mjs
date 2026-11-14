#!/usr/bin/env node
import {randomBytes} from 'node:crypto';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
const token=randomBytes(24).toString('base64url');
const note=[
 '# URL share (Workers Free only). Never commit this file.',
 '# SHARE_ACCESS_TOKEN: required for invite links (?access=...). Keep secret.',
 '# OWNER_BILLING_APPROVED: leave unset/0. Set to 1 ONLY after owner final approval of cost/cap/payer.',
 'SHARE_ACCESS_TOKEN='+token,
 'OWNER_BILLING_APPROVED=0',
].join('\n')+'\n';
if(!existsSync('.dev.vars')){
 writeFileSync('.dev.vars','# Local development only. Never share this file.\nUSER_KEY_ENCRYPTION_KEY='+randomBytes(32).toString('base64')+'\n'+note,{mode:0o600});
}else{
 const current=readFileSync('.dev.vars','utf8');
 let next=current;
 if(!/^SHARE_ACCESS_TOKEN=/m.test(next))next+='\nSHARE_ACCESS_TOKEN='+token+'\n';
 if(!/^OWNER_BILLING_APPROVED=/m.test(next))next+='OWNER_BILLING_APPROVED=0\n';
 if(next!==current)writeFileSync('.dev.vars',next,{mode:0o600});
}
writeFileSync('.share-invite.local.txt',[
 'Invite link shape (after Workers Free deploy):',
 'https://<your-worker>.workers.dev/?access='+token,
 '',
 'Rules:',
 '- Free tier only. No Cloudflare Paid upgrade without owner final confirmation.',
 '- Billing hold message: これ以降は課金が必要なので深夜特急の承認待ちです',
 '- Set OWNER_BILLING_APPROVED=1 only after owner approval of cost/cap/payer.',
 '',
 'This file is local-only. Do not commit or send the raw token alone.',
].join('\n')+'\n',{mode:0o600});
console.log('共有トークンを .dev.vars に用意しました（値は表示しません）。');
console.log('次: Cloudflare無料アカウントで Workers / D1 / R2 を用意し、Paidに上げずデプロイします。');
console.log('招待URLの形は .share-invite.local.txt を見てください。');
