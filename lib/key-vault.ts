export type AiSettings={key:string;model:string;consent:boolean;updatedAt:number};
export const GUEST_COOKIE='__Host-atlas-guest';
const enc=new TextEncoder();const dec=new TextDecoder();
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes))}
function unb64(s:string){const normalized=s.replace(/-/g,'+').replace(/_/g,'/');const padded=normalized+'='.repeat((4-normalized.length%4)%4);return Uint8Array.from(atob(padded),v=>v.charCodeAt(0))}
export async function vaultOwner(req:Request,userId?:string|null){
 if(userId)return {owner:'account:'+userId,guest:false,cookie:''};
 const secure=new URL(req.url).protocol==='https:';
 const cookieName=secure?GUEST_COOKIE:'atlas-guest';
 const old=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'=')||v.startsWith(GUEST_COOKIE+'='))?.split('=')[1];
 const token=old&&/^[a-f0-9]{64}$/.test(old)?old:[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const cookie=old===token?'':secure?`${GUEST_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000`:`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000`;
 return {owner:'guest:'+token,guest:true,cookie};
}
/** Stable vault row key; never accept owner from the client body/query. */
export async function vaultPath(owner:string){const hash=await crypto.subtle.digest('SHA-256',enc.encode(owner));return '_private-ai/'+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function encryptionKey(secret:string){const bytes=unb64(secret);if(bytes.length!==32)throw Error('Vault unavailable');return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function sealSettings(data:AiSettings,owner:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(owner)},await encryptionKey(secret),enc.encode(JSON.stringify(data)));return JSON.stringify({version:1,iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))})}
export async function openSettings(raw:string,owner:string,secret:string):Promise<AiSettings>{const data=JSON.parse(raw);if(data.version!==1)throw Error('Invalid vault version');const value=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(data.iv),additionalData:enc.encode(owner)},await encryptionKey(secret),unb64(data.ciphertext));return JSON.parse(dec.decode(value))}
export async function readSettings(db:D1Database,identity:{owner:string;guest:boolean},secret:string){
 const row=await db.prepare('SELECT payload, updated_at FROM key_vault WHERE owner=?').bind(identity.owner).first<{payload:string;updated_at:number}>();
 if(!row)return null;
 const data=await openSettings(row.payload,identity.owner,secret);
 if(identity.guest&&Date.now()-data.updatedAt>15552000000){await db.prepare('DELETE FROM key_vault WHERE owner=?').bind(identity.owner).run();return null}
 return data;
}
export async function writeSettings(db:D1Database,identity:{owner:string},data:AiSettings,secret:string){
 const payload=await sealSettings(data,identity.owner,secret);
 await db.prepare('INSERT INTO key_vault(owner, payload, updated_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at').bind(identity.owner,payload,data.updatedAt).run();
}
export async function deleteSettings(db:D1Database,identity:{owner:string}){
 await db.prepare('DELETE FROM key_vault WHERE owner=?').bind(identity.owner).run();
}
