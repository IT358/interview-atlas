export type AiSettings={key:string;model:string;consent:boolean;updatedAt:number};
export const GUEST_COOKIE='__Host-atlas-guest';
const enc=new TextEncoder();const dec=new TextDecoder();
function b64(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes))}
function unb64(s:string){return Uint8Array.from(atob(s),v=>v.charCodeAt(0))}
export async function vaultOwner(req:Request,userId?:string|null){
 if(userId)return {owner:'account:'+userId,guest:false,cookie:''};
 const old=req.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(GUEST_COOKIE+'='))?.slice(GUEST_COOKIE.length+1);
 const token=old&&/^[a-f0-9]{64}$/.test(old)?old:[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
 return {owner:'guest:'+token,guest:true,cookie:old===token?'':`${GUEST_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000`};
}
export async function vaultPath(owner:string){const hash=await crypto.subtle.digest('SHA-256',enc.encode(owner));return '_private-ai/'+[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('')}
async function encryptionKey(secret:string){const bytes=unb64(secret);if(bytes.length!==32)throw Error('Vault unavailable');return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt'])}
export async function sealSettings(data:AiSettings,owner:string,secret:string){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(owner)},await encryptionKey(secret),enc.encode(JSON.stringify(data)));return JSON.stringify({version:1,iv:b64(iv),ciphertext:b64(new Uint8Array(encrypted))})}
export async function openSettings(raw:string,owner:string,secret:string):Promise<AiSettings>{const data=JSON.parse(raw);if(data.version!==1)throw Error('Invalid vault version');const value=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(data.iv),additionalData:enc.encode(owner)},await encryptionKey(secret),unb64(data.ciphertext));return JSON.parse(dec.decode(value))}
export async function readSettings(bucket:R2Bucket,identity:{owner:string;guest:boolean},secret:string){const path=await vaultPath(identity.owner);const obj=await bucket.get(path);if(!obj)return null;const data=await openSettings(await obj.text(),identity.owner,secret);if(identity.guest&&Date.now()-data.updatedAt>15552000000){await bucket.delete(path);return null}return data}
