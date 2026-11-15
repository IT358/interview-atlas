# 本番反映報告（2026-11-15）

対象: `CURSOR_TASK_本番反映_2026-11-15.md`  
本番URL: `https://interview-atlas.koyaandm.workers.dev/`  
Secrets の値は未記載。Secrets の変更・再登録は未実施。`OWNER_BILLING_APPROVED` は `0` のまま。

---

## 手順1：文言修正

- `CURSOR_TASK_文言修正_2026-11-15.md` 実施済み
- 報告: `CURSOR_REPORT_文言修正_2026-11-15.md`
- 変更: `components/website-jobs.tsx` のフィードバックを「N件見つかりました · いまM件を表示中です」に分離
- `check:types` / `build` / `verify-website-job-session` / `verify-multi-site` … **すべて成功**
- 実測スクショ: `tmp-screenshots/wording-feedback-2026-11-15.png`

---

## 手順2：コミット / push

| 項目 | 値 |
|---|---|
| ハッシュ | `f8ae7bb1e124b1644af4e701196a7b6c624cee4b`（短縮 `f8ae7bb`） |
| メッセージ | Improve website search UX and clarify found-vs-shown counts. |
| push | **あり**（`origin/main`：`3d9ba33..f8ae7bb`） |

---

## 手順3：本番デプロイ

流れ: `build:production` → `check:production -- --refresh` → `wrangler deploy --config dist/server/wrangler.production.json`

| 項目 | 結果 |
|---|---|
| 成否 | **成功** |
| 前回 Version ID | `806a5ea5-6cde-4941-87bc-f01a7e788095` |
| 今回 Version ID | `57551389-7087-4232-a873-ef6635f7ca1f` |
| バインド | D1 `interview-atlas-db`、Assets、`OWNER_BILLING_APPROVED=0`、R2なし |
| 止める条件 | 未該当（エラーなし / Secrets再入力なし / マイグレーション要求なし / billing変更なし） |

---

## 手順4：本番確認（6項目）

### 1. ゲート — PASS
- access なし: HTTP 401、「招待制」「深夜特急の承認待ち」
- access 付き: 本体表示、「この条件で探す」「分野を選ぶ」あり

### 2. 初回表示・③ボタン — PASS
- 流れ: ①分野→②条件→③探す→④保存
- CDP/a11y: 「この条件で探す」、白文字 / 緑背景、visible

### 3. かんたん検索（キーなし）1回 — PASS
実測（Web制作）:

| 指標 | 値 |
|---|---|
| 取得候補 | 149 |
| 本文確認 | 130 |
| 条件一致 | 78 |
| 表示中 | 30 |
| まだ見ていない | 48 |
| 重複除外 | 0 |
| 条件不一致 | 52 |
| 累計API | 0 |

整合: 149 ≧ 130 ≧ 78 ≧ 30、30+48=78、78+52=130  
文言: `Web制作：78件見つかりました · いま30件を表示中です · まだ見ていない案件 48件`（サマリー「表示中 30件」と一致）

### 4. Tavily検索1回 — SKIP（未実施）
- `/api/tavily/settings` 時点で `saved=false`, `consent=false`（本番にキー未登録）
- キー登録や Secrets 操作は指示どおり行わず、**実APIは叩いていない**
- キー設定後に本人または司令塔で1回だけ再確認が必要

### 5. リロード復元 — PASS
- メッセージ: `前回の結果 30件を復元しました。まだ見ていない案件が 48件あります。`
- サマリー: 表示中 30件 / まだ見ていない 48件 → **件数一致**
- 探し方「かんたん検索（キーなし）」・結果タイトル継続

### 6. 保存・応募 — PASS
- 1件保存: Secure WooCommerce Upgrade & UX Refresh
- 「保存・応募管理」に表示（保存1件）
- 応募URL形式: `https://www.freelancer.com/projects/woocommerce/...`

---

## 途中停止

デプロイまでは停止条件に当たらず完了。  
確認項目4のみ、キー未設定のため Tavily を実行できず SKIP。

## 総合

文言修正 → コミット/push → デプロイ（`57551389-…`）→ 本番確認は Tavily 以外 PASS。
