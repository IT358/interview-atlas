# 本番反映3 報告（2026-11-15）

対象: `CURSOR_TASK_本番反映3_2026-11-15.md`  
本番URL: `https://interview-atlas.koyaandm.workers.dev/`  
Secrets の値・アクセストークンは未記載。Secrets の変更・再登録は未実施。`OWNER_BILLING_APPROVED` は `0` のまま。

---

## 手順1：事前確認

| コマンド | 結果 |
|---|---|
| `npm run check:types` | 成功 |
| `npm run build` | 成功 |
| `node scripts/verify-website-job-session.mjs` | 成功 |
| `node scripts/verify-multi-site.mjs` | 成功 |
| `node scripts/verify-free-mode.mjs` | 成功 |
| `node scripts/verify-interview-practice.mjs` | 成功 |
| `node scripts/verify-website-results-route.mjs` | 成功 |

---

## 手順2：コミット / push

| 項目 | 値 |
|---|---|
| ハッシュ | `f834b759a5ae4a15214819cda529037a3746d088`（短縮 `f834b75`） |
| メッセージ | Unify form UI and focus states, show up to 100 jobs, add page-count price tiers |
| push | **あり**（`origin/main`：`07510fb..f834b75`） |

---

## 手順3：本番デプロイ

流れ: `build:production` → `prepare:production-wrangler` → `check:production -- --refresh`（`ATLAS_D1_DATABASE_ID` を一時指定）→ `npx wrangler deploy --config dist/server/wrangler.production.json`

| 項目 | 結果 |
|---|---|
| 成否 | **成功** |
| 前回 Version ID | `8025d229-274d-40ee-8966-fc8c90b33f18` |
| 今回 Version ID | `cca9a620-e656-4cde-bf11-fbc179d73dd8` |
| バインド | D1 `interview-atlas-db`、Assets、`OWNER_BILLING_APPROVED=0`、R2なし |
| 止める条件 | 未該当（エラーなし / Secrets再入力なし / マイグレーション要求なし / billing変更なし） |

---

## 手順4：本番確認

### 1. ゲート — PASS
- access なし: HTTP 401、「このURLは招待制です」「深夜特急の承認待ち」
- access 付き（既存セッション）: 本体表示（タイトル「Interview Atlas | 案件検索・応募・面談練習」）

### 2. フォーム見た目 — PASS
- CSS: `index.BIlIizl_.css` を配信
- select: `appearance: none` / `outline-offset: 0`、chevron の `background-image: url(data:image/svg+xml...)` あり（ショートハンドで消えていない）
- フォーカス時も `outline-offset: 0`（浮いた二重線なし）

### 3. キーなし検索1回＋リロード — PASS
実測（Web制作・かんたん検索）:

| 指標 | 値 |
|---|---|
| 見つかりました | 76件 |
| いま表示中 | 76件 |
| まだ見ていない | なし（繰越0） |
| 見出し | Web制作76件 |
| 応募ボタン数 | 76 |
| 整合 | 76=76、繰越なし |

リロード後: 「前回の結果 76件を復元しました。」／見出し「Web制作76件」／表示中76件

### 4. 制作会社・単価予想 — PASS
- 初期値: `all` / 「全て（作業を問わない）」
- 範囲表示: `5,000〜300,000円`
- optgroup「コーディング」に「10ページ前後のコーディング」「20ページ以上のサイト制作（コーディング）」あり

### 5. 保存・応募 — PASS
- 「保存案件を検索」で保存案件：1件を表示（「Secure WooCommerce Upgrade & UX Refresh」）

### 6. Tavily検索とGemini実評価
- 今回は実行していない（指示どおり）

---

## まとめ

本番 Version `cca9a620` を反映済み。UI総点検・表示上限100件・単価のページ数区分を含む。課金ガード（`OWNER_BILLING_APPROVED=0`）と Tavily / Gemini 実評価の未実行を維持。
