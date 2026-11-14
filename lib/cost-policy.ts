// Existing AI evaluation policy. Tavily uses per-action device confirmation.
export const FREE_TEST_MODE = true;
export const COST_LOCK_MESSAGE = '追加支出を防ぐため、AI評価は停止中です。調査済み情報の検索・保存・管理は使えます。有効化には所有者による費用と上限の確認が必要です。';
export function costLockResponse(){return Response.json({error:COST_LOCK_MESSAGE,code:'EXTERNAL_API_LOCKED'},{status:403,headers:{'Cache-Control':'private, no-store'}})}
