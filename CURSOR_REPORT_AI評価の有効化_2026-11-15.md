# AI評価の有効化 報告（2026-11-15）

対象: `CURSOR_TASK_AI評価の有効化_2026-11-15.md`  
制約遵守: 本番デプロイなし / git commit・push なし / Tavily実APIなし / `OWNER_BILLING_APPROVED=0` / キー値は未記載・未入力。

---

## 変更点

| 箇所 | 内容 |
|---|---|
| `app/api/workspace/route.ts` | `FREE_TEST_MODE` による evaluate ロックを解除。評価プロンプトを4軸・全セッション版に統一。`save-evaluation`（ChatGPT貼り戻し保存）を追加 |
| `app/api/ai/settings/route.ts` | Geminiキー保存の `FREE_TEST_MODE` ロックを解除（既存 vault のみ使用） |
| `app/api/ai/search/route.ts` | **変更なし**（FREE_TEST_MODE のままロック） |
| `lib/interview-evaluation.ts` | 評価プロンプト／同意文／ChatGPT用クリップボード文を共通化 |
| `app/page.tsx` | 評価ボタンを実評価導線に変更、実行前確認、キー未設定時は設定へ案内、Gemini設定を FREE_TEST_MODE 設定画面に表示、ChatGPTコピー＆貼り戻しを併設 |
| `scripts/verify-free-mode.mjs` | AI検索はロック維持、settings/evaluate は `EXTERNAL_API_LOCKED` にならないことを検証 |
| `lib/cost-policy.ts` | `FREE_TEST_MODE=true` 維持。文言を汎用化（Tavily等のロック用） |

Tavily 課金ガード・`OWNER_BILLING_APPROVED`・無料枠表示の仕組みは維持。

---

## 同意・費用表示の文面

### 実行直前（confirm）
```
この評価では、回答と募集文が Google（Gemini）に送信されます。
費用はご自身の API キーの契約・料金体系に従います（無料枠の範囲なら費用はかかりません）。
ボタンを押したときだけ実行します。自動では評価しません。

評価を実行しますか？
```

### 記録画面の常時注記
評価の実行前に確認：回答と募集文は Google（Gemini）に送信されます。費用はご自身のAPIキーの契約・料金体系に従います（無料枠の範囲なら費用なし）。ボタンを押したときだけ実行し、自動では評価しません。

### 設定（Gemini欄）
回答と募集文がGoogle（Gemini）に送信されます。費用はご自身のAPIキーの契約・料金体系に従います（無料枠の範囲なら費用なし）。評価はボタンを押したときだけ実行します。

---

## 確認結果

| 確認 | 結果 |
|---|---|
| `npm run check:types` | 成功 |
| `npm run build` | 成功 |
| `verify-website-job-session` | 成功 |
| `verify-multi-site` | 成功 |
| `verify-free-mode` | 成功（AI search は `EXTERNAL_API_LOCKED`、settings/evaluate は非ロック） |
| キー未設定時の案内 | PASS。設定に Gemini 入力欄・「APIキー：未保存」。評価ボタンは「設定でキーを用意して評価」→設定へ。実評価は走らない |
| `/api/ai/search` | 引き続きロック（`EXTERNAL_API_LOCKED`） |
| 実評価1回 | **SKIP**（ローカル `ai/settings` は `saved=false`。キーの新規作成・代理入力はしない。本人キー入力後に実施） |

スクショ: `tmp-screenshots/ai-eval-settings-nokey-2026-11-15.png`

---

## 補足
- ChatGPT「評価を依頼する文章をコピー」＋貼り戻し保存はキーなしでも利用可能（ログインして練習記録がある場合）
- 面談実務化第1段階（案件ドリブン質問・深掘り等）は本タスクでは未実装。評価プロンプト側は第1段階仕様に合わせてある
