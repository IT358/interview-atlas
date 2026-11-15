# 本番反映（第3弾）の指示（2026-11-15、司令塔Claudeより。本人の承認後に実施）

対象の変更（すべてローカルで確認済み）：
- UI総点検一式（フォーカスの浮き・二重線の解消、select矢印の統一、フォーム部品の高さ・角丸の統一、focus-within、ツールバーの compact variant、D10の矢印消失バグ修正）
- 仕事を探すの表示上限 30件 → 100件（BATCH_TARGET と表示まわり。検索母数・Tavilyの挙動は不変）
- 単価予想にページ数区分を追加（10ページ前後 5〜10万円／20ページ以上 10〜20万円）。「全て」は 5,000〜300,000円に再計算済み

## 手順1：事前確認
- npm run check:types / npm run build / verify-website-job-session / verify-multi-site / verify-free-mode / verify-interview-practice / verify-website-results-route をすべて実行。1つでも失敗したら止めて報告する

## 手順2：コミット / push
- 変更をまとめて1コミット（メッセージ案：Unify form UI and focus states, show up to 100 jobs, add page-count price tiers）
- origin/main へ push（リモートの新規作成はしない）。ハッシュを報告に記録する

## 手順3：本番デプロイ
- 既存の手順（build:production → prepare:production-wrangler → check:production -- --refresh → wrangler deploy）
- 新しい Version ID を記録する（前回：8025d229-274d-40ee-8966-fc8c90b33f18）
- 止める条件：デプロイエラー、Secrets の変更・再入力の要求、D1マイグレーションの要求、OWNER_BILLING_APPROVED を 0 から変える必要。その場合は変更せず報告する。Secrets の値は読まない・書かない

## 手順4：本番確認
1. ゲート：access なしで HTTP 401、access 付きで本体表示
2. フォーム見た目：select の矢印が表示され（background ショートハンドで消えていない）、フォーカス時に浮いた二重線が出ないこと。計算スタイルでも outline-offset:0 と appearance:none を確認
3. キーなし検索1回：一致が100件以下なら全件表示・繰越0、フィードバック文とサマリーと見出しの数字が一致。リロード復元も一致
4. 制作会社：単価予想の初期値「全て（作業を問わない）」の範囲表示が 5,000〜300,000円 であること。コーディングのグループに「10ページ前後」「20ページ以上」があること
5. 保存・応募：保存済みが表示できること（回帰確認）
6. Tavily検索とGemini実評価は今回も実行しない（実評価は本人のキー入力後）

## 報告
CURSOR_REPORT_本番反映3_2026-11-15.md に：事前確認、コミットハッシュ、push の有無、新 Version ID、本番確認の各結果を書く。キーの値やアクセストークンは書かない。
