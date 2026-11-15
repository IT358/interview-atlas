// FREE_TEST_MODE keeps Tavily/AI-search locks. Interview Gemini evaluate is owner-enabled separately.
export const FREE_TEST_MODE = true;
export const COST_LOCK_MESSAGE = '追加支出を防ぐため、この操作は停止中です。調査済み情報の検索・保存・管理は使えます。有効化には所有者による費用と上限の確認が必要です。';
export const BILLING_HOLD_MESSAGE = 'これ以降は課金が必要なので深夜特急の承認待ちです';
export const BILLING_HOLD_CODE = 'BILLING_HOLD';
export function costLockResponse(){return Response.json({error:COST_LOCK_MESSAGE,code:'EXTERNAL_API_LOCKED'},{status:403,headers:{'Cache-Control':'private, no-store'}})}
export function billingHoldResponse(extra:Record<string,unknown>={}){return Response.json({error:BILLING_HOLD_MESSAGE,code:BILLING_HOLD_CODE,...extra},{status:402,headers:{'Cache-Control':'private, no-store'}})}
export function ownerBillingApproved(env?:{OWNER_BILLING_APPROVED?:string}|null){return String(env?.OWNER_BILLING_APPROVED||'').trim()==='1'}
