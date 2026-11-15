# BYOK（個人キー方式）報告（2026-11-15）

対象: `CURSOR_TASK_BYOK_個人キー方式_2026-11-15.md`  
本番デプロイ・git commit / push は未実施（指示どおり）。実キーでの検索・評価は未実行。キーの値は未記載。

---

## 変更した経路

### 設定の保存先
- 新規 `lib/browser-keys.ts`：Tavily / Gemini キー・同意・モデルを **localStorage のみ** に保存・削除
- UI（`tavily-connect-guide.tsx` / `tavily-settings.tsx` / `app/page.tsx` の Gemini 欄）
  - 「キーをこのブラウザに保存」「このブラウザのキーを削除」
  - 入力欄付近に「キーはこのブラウザにだけ保存されます。サーバーには保存されません」を明示
  - サーバーに古いキーが残っている場合のみ「サーバーに保存されたキーを削除する」を表示

### 検索（Tavily追加検索・接続テスト・会社調査）
- `lib/tavily-confirmation.ts` の `fetchTavilyAction` が、ブラウザキー＋同意をリクエスト本文に付与（ログ出力なし）
- サーバー（`/api/tavily/search` / `test` / `companies` / `website-jobs` POST）は `lib/request-api-key.ts` の `tavilyKeyFromRequest` で **リクエストのキーだけ** を使い、その場限りで処理。`readSettings`（D1 vault）は使わない

### 評価（Gemini）
- クライアントは localStorage のキーを FormData で送信（`consent=true`）
- `/api/workspace` の `evaluate` は `geminiKeyFromRequest` のみ。vault フォールバックなし
- `/api/ai/search` は引き続き FREE_TEST_MODE で `EXTERNAL_API_LOCKED`。解禁時もリクエストキーのみ（vault 不使用）

---

## サーバー保存キーの扱い

| 操作 | 挙動 |
|---|---|
| POST `/api/tavily/settings` / `/api/ai/settings` | **拒否**（`400` / `BROWSER_KEY_ONLY`）。vault へ書き込まない |
| GET | `serverSaved` / `storage:'browser'` を返却。キー本体は返さない |
| DELETE | レガシー vault 行を削除（設定画面の「サーバーに保存されたキーを削除する」） |
| 検索・評価 | サーバー保存キーを読む分岐は削除済み |

キーなし検索（かんたん検索）は従来どおり変更なし。共有ゲート・ワークスペース範囲は未変更。`OWNER_BILLING_APPROVED=0` 維持。

---

## 確認結果

| 項目 | 結果 |
|---|---|
| `npm run check:types` | 成功 |
| `npm run build` | 成功 |
| `verify-free-mode`（BYOK更新） | 成功：AI検索ロック／settings のサーバー保存拒否／evaluate 非ロック／検索経路に `readSettings` なし |
| `verify-tavily-registration` | 成功：POST 拒否・GET は browser storage |
| `verify-tavily-search-consent` | 成功：リクエストキー必須 |
| `verify-tavily-test-route` | 成功 |
| `verify-website-results-route` | 成功 |
| `verify-national-companies` | 成功 |
| `verify-website-job-session` / `verify-multi-site` / `verify-interview-practice` | 成功 |
| ローカルUI | 設定にブラウザ保存文言あり。キーなしで「追加で探す」を選ぶと「追加検索には、あなたのキーを入れてください」＋設定誘導。暗号化保存の文言は無し |

---

## まとめ

共有リンク利用者が各自のキーを各自のブラウザに入れ、実行時だけサーバーへ渡す BYOK に切り替えた。所有者のサーバー保存キーは検索・評価に使われない。実キーでの接続確認は本人作業。
