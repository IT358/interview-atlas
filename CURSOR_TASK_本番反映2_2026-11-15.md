# 本番反映（第2弾）の指示（2026-11-15、司令塔Claudeより。本人の承認後に実施）

対象の変更（すべてローカルで確認済み）：
- 面談練習の実務化（案件ドリブン質問・深掘り・回答の型・評価コピー＆貼り戻し・対象案件名）
- AI評価の有効化（評価のみ解放、4軸プロンプト、実行前同意。Tavilyガードと OWNER_BILLING_APPROVED=0 は維持）
- UI改善（探し方の説明、単価予想に「全て」デフォルト＋根拠付き4件追加・optgroup）
- 最適化第1波（制作進捗と旧検索の到達不能コード削除。保存・応募は無依存を確認済み）

## 手順1：事前確認
- npm run check:types / npm run build / verify-website-job-session / verify-multi-site / verify-free-mode / verify-interview-practice をすべて実行。1つでも失敗したら止めて報告する

## 手順2：コミット / push
- git status で変更一覧を確認し、まとめて1コミットにする（メッセージ案：Improve interview practice, enable AI evaluation, clarify search modes, expand price models, remove dead code）
- origin が設定済みなら origin/main へ push する。リモートを新規作成しない
- コミットハッシュと push の有無を報告に記録する

## 手順3：本番デプロイ
- 既存の手順で実施する（build:production → prepare:production-wrangler → check:production -- --refresh → wrangler deploy）
- 新しい Version ID を記録する（前回：57551389-7087-4232-a873-ef6635f7ca1f）
- 止める条件：デプロイコマンドのエラー、Secrets の変更・再入力の要求、D1マイグレーションの要求、OWNER_BILLING_APPROVED を 0 から変える必要が生じた場合。その場合は変更せずに報告する。Secrets の値は読まない・書かない

## 手順4：本番確認
1. ゲート：access なしで HTTP 401、access 付きで本体表示
2. 検索画面：「探し方」の直下に説明文が表示される。③ボタン「この条件で探す」が見える（CDP/a11yでも確認）
3. キーなし検索1回：件数の整合（見つかりました／表示中／まだ見ていない）と、リロード復元
4. 制作会社：単価予想の初期値が「全て（作業を問わない）」で、選択肢がグループ表示される
5. 面談練習：練習を開始でき、質問の下に「回答の型」が出る。**テスト用の練習記録は保存しない**（開始と表示の確認まで）
6. 設定：Gemini欄が表示され、キー未保存なら「未保存」の案内が出る。実評価は本人がキー入力後に行うため、ここでは実行しない
7. Tavily検索は今回は実行しない（前回本番で確認済み。クレジットを消費しない）

## 報告
CURSOR_REPORT_本番反映2_2026-11-15.md に：事前確認の結果、コミットハッシュ、push の有無、新 Version ID、本番確認の各結果を書く。キーの値やアクセストークンは書かない。
