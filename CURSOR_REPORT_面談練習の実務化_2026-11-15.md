# 面談練習の実務化（第1段階）報告（2026-11-15）

対象: `CURSOR_TASK_面談練習の実務化_2026-11-15.md`  
制約: 本番デプロイなし / git commit・push なし / Tavily実APIなし / `FREE_TEST_MODE=true` 維持 / 既存記録を破壊する変更なし。

※ Gemini アプリ内評価は、別タスク（AI評価の有効化）で本人決定済みのため本報告では触らず維持。本実装の評価の輪は ChatGPT コピー＆貼り戻しを中心に閉じた。

---

## 実装した改善

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | 案件ドリブン質問（5型）。募集文から技術・成果物を差し込み。取れなければ汎用文。一般セットも後方互換 | `lib/interview-practice.ts`, `app/page.tsx` |
| 2 | 各本問の後に深掘り1問（計最大10問）。コーチ／本番とも同一ターン列 | 同上 |
| 3 | 各質問下に「回答の型：結論 → 根拠 → 実例 → 次の一手」 | `app/page.tsx`, `app/globals.css` |
| 4 | 終了時に評価依頼文コピー＋履歴で貼り戻し保存（ゲストは localStorage） | `app/page.tsx`, 既存 `lib/interview-evaluation.ts` |
| 5 | 記録に対象案件名（`jobTitle`）を保存・一覧／詳細に表示 | `app/page.tsx` |

追加確認スクリプト: `scripts/verify-interview-practice.mjs`

---

## 質問生成の実例

対象案件: **WordPress LP制作**  
募集文: `WordPressでコーポレート向けLPを制作。デザインはFigma支給。リモート、Slack連絡、納期2週間。`

生成例（保存セッションより）:
1. （本問）この案件で最初に作る**LP**は何で、着手前に発注者へ何を確認しますか？
2. （深掘り）最初のLPを始める前に、確認漏れが怖い項目は何ですか？
3. （本問）**WordPress**を使った似た制作の経験はありますか？ない場合は、どう代替を示しますか？（実績の創作は不要です）
4. （深掘り）その制作で一番詰まった点と、どう抜けましたか？…

ターン数 10（本問5＋深掘り5）。

---

## 確認結果

| 確認 | 結果 |
|---|---|
| `npm run check:types` | 成功 |
| `npm run build` | 成功 |
| `verify-website-job-session` / `verify-multi-site` / `verify-interview-practice` / `verify-free-mode` | 成功 |
| ローカル通し（案件練習→10問→コピー→保存→貼り戻し） | PASS。対象案件「WordPress LP制作」、評価済み表示 |
| スクショ | `tmp-screenshots/practice-job-history-2026-11-15.png` |
