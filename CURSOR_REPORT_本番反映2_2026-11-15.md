# 本番反映2 報告（2026-11-15）

対象: `CURSOR_TASK_本番反映2_2026-11-15.md`  
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
| `node scripts/verify-free-mode.mjs` | 成功（AI検索ロック維持、Gemini評価は EXTERNAL_API_LOCKED ではない） |
| `node scripts/verify-interview-practice.mjs` | 成功 |

---

## 手順2：コミット / push

| 項目 | 値 |
|---|---|
| ハッシュ | `07510fb3f1b791889094037cd8d7c2efc8bd51e0`（短縮 `07510fb`） |
| メッセージ | Improve interview practice, enable AI evaluation, clarify search modes, expand price models, remove dead code |
| push | **あり**（`origin/main`：`f8ae7bb..07510fb`） |

---

## 手順3：本番デプロイ

流れ: `build:production` → `prepare:production-wrangler` → `check:production -- --refresh`（`ATLAS_D1_DATABASE_ID` を一時指定）→ `wrangler deploy --config dist/server/wrangler.production.json`

| 項目 | 結果 |
|---|---|
| 成否 | **成功** |
| 前回 Version ID | `57551389-7087-4232-a873-ef6635f7ca1f` |
| 今回 Version ID | `8025d229-274d-40ee-8966-fc8c90b33f18` |
| バインド | D1 `interview-atlas-db`、Assets、`OWNER_BILLING_APPROVED=0`、R2なし |
| 止める条件 | 未該当（エラーなし / Secrets再入力なし / マイグレーション要求なし / billing変更なし） |

---

## 手順4：本番確認

### 1. ゲート — PASS
- access なし: HTTP 401、「このURLは招待制です」「深夜特急の承認待ち」
- access 付き（既存セッション）: 本体表示

### 2. 検索画面 — PASS
- 「探し方」直下: 「ふだんはキーなしで十分です。キーありは…無料枠を少し使います。」
- ③「この条件で探す」: a11y/CDP で visible、白文字 / 緑背景（`rgb(255,255,255)` / `rgb(32,62,50)`）

### 3. キーなし検索1回＋リロード — PASS
実測（Web制作・かんたん検索）:

| 指標 | 値 |
|---|---|
| 見つかりました | 76件 |
| いま表示中 | 30件 |
| まだ見ていない | 46件 |
| 整合 | 30+46=76 |

リロード後: 「前回の結果 30件を復元しました。まだ見ていない案件が 46件あります。」／見出し「Web制作30件」／表示中30・まだ見ていない46

### 4. 制作会社・単価予想 — PASS
- 初期値: `all` / 「全て（作業を問わない）」
- optgroup: 全体 / コーディング / デザイン / WordPress・EC / 運用

### 5. 面談練習 — PASS（保存なし）
- 「面談練習をはじめる」でセッション開始
- 質問下に「回答の型：結論 → 根拠 → 実例 → 次の一手」を確認
- 「終了」で離脱。練習記録は保存していない

### 6. 設定・Gemini — PASS（実評価は未実行）
- 「面談のAI評価を設定する（任意・Gemini）」表示
- 「APIキー：未保存」「APIキーを入力して「保存」を押してください。」
- 実評価・キー入力は未実施（本人作業）

### 7. Tavily検索
- 今回は実行していない（指示どおり）

---

## まとめ

本番 Version `8025d229` を反映済み。面談実務化・AI評価解放（評価のみ）・UI改善・最適化第1波を含む。課金ガード（`OWNER_BILLING_APPROVED=0`）と Tavily 未実行を維持。
