# 本番反映（第4弾：BYOK）の指示（2026-11-15、司令塔Claudeより。本人の承認後に実施）

対象の変更（ローカルで確認済み）：Tavily / Gemini キーをサーバー保存から「各自のブラウザ保存（BYOK）」へ切り替え。サーバー保存キーは検索・評価に使われず、設定APIのPOSTは拒否、レガシー保存は削除可能に。キーなし検索・AI検索ロック・OWNER_BILLING_APPROVED=0 は維持。

## 手順1：事前確認
- npm run check:types / npm run build / verify-free-mode / verify-tavily-registration / verify-tavily-search-consent / verify-tavily-test-route / verify-website-results-route / verify-national-companies / verify-website-job-session / verify-multi-site / verify-interview-practice をすべて実行。1つでも失敗したら止めて報告する

## 手順2：コミット / push
- 変更をまとめて1コミット（メッセージ案：Switch Tavily and Gemini keys to browser-only BYOK）
- origin/main へ push。ハッシュを報告に記録する

## 手順3：本番デプロイ
- 既存の手順（build:production → prepare:production-wrangler → check:production -- --refresh → wrangler deploy）
- 新しい Version ID を記録する（前回：cca9a620-e656-4cde-bf11-fbc179d73dd8）
- 止める条件：デプロイエラー、Secrets の変更・再入力の要求、D1マイグレーションの要求、OWNER_BILLING_APPROVED を 0 から変える必要。その場合は変更せず報告する。Secrets の値は読まない・書かない

## 手順4：本番確認
1. ゲート：access なしで HTTP 401、access 付きで本体表示
2. 設定画面：キー入力欄の近くに「キーはこのブラウザにだけ保存されます。サーバーには保存されません」の文言があること。サーバー保存キーが残っている場合は「サーバーに保存されたキーを削除する」が表示されること（削除の実行はしない。本人の操作に委ねる）
3. キーなし検索1回：従来どおり動くこと（表示件数と文言の一致、復元）
4. キーあり検索：ブラウザにキーを入れていない状態で「追加で探す」を選ぶと、「追加検索には、あなたのキーを入れてください」の案内が出て、検索が実行されないこと（サーバー保存キーで勝手に検索されないことの確認）
5. 模擬面談：練習を開始でき、回答の型が表示されること（記録は保存しない）
6. Tavily実検索とGemini実評価は実行しない（本人が自分のブラウザにキーを入れて後日確認する）

## 報告
CURSOR_REPORT_本番反映4_2026-11-15.md に：事前確認、コミットハッシュ、push の有無、新 Version ID、本番確認の各結果を書く。キーの値やアクセストークンは書かない。
