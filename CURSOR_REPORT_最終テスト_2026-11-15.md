# 最終機能テスト報告（2026-11-15）

対象指示: `CURSOR_TASK_最終テスト_2026-11-15.md`  
環境: ローカル `http://127.0.0.1:5173/`（access 付き）。`OWNER_BILLING_APPROVED=0`。  
制約遵守: 本番デプロイなし / git commit・push なし / Tavily 実APIは未実行（キー未保存のため項目6スキップ）/ 秘密値は本報告に記載しない。

準備: テスト開始前に当該タブの `sessionStorage.atlas-website-results` を削除し、まっさらな状態から実施。

---

## 1. ゲート — PASS

| 確認 | 結果 |
|---|---|
| access なし | HTTP 401。本文に「このURLは招待制です」「深夜特急の承認待ち」 |
| access 付き | 302→本体。タイトル「Interview Atlas」、画面「仕事を探す」 |

---

## 2. 初回表示 — PASS

- 流れ表示: 「① 分野を選ぶ → ② 条件を決める → ③ 探す → ④ 保存する」
- ステップ UI: 「1 探したい仕事を選ぶ」「2 条件を絞る」「3 検索する」
- ③ボタン: アクセシビリティ名 / CDP `textContent` =「この条件で探す」。`color: rgb(255,255,255)` / `background: rgb(32,62,50)` / visible
- スクショ: `tmp-screenshots/final-test-pc-initial.png`, `final-test-pc-cta.png`, `final-test-sp-cta.png`  
  ※PCスクショの自動説明は白文字×濃緑を読み落とすことがある。SPスクショと CDP/a11y では文字確認済み。

---

## 3. かんたん検索（キーなし）Web制作 1回 — PASS

実測（検索直後）:

| 指標 | 値 |
|---|---|
| 取得候補 (scanned) | 149 |
| 本文確認 (verified) | 142 |
| 条件一致 (matched) | 90 |
| 重複除外 | 0 |
| 条件不一致 | 52 |
| 今回の新規 / 初回表示 | 30 |
| まだ見ていない (overflow) | 60 |
| 保存中 (catalog) | 90 |
| 累計API | 0 |
| ソース内訳 | Freelancer.com 45 + クラウドワークス 36 + ココナラ 9 = 90 |

整合性:
- 候補 ≧ 検証 ≧ 有効 ≧ 表示: **149 ≧ 142 ≧ 90 ≧ 30**
- 検証内訳: 90 + 52 = 142
- 表示+繰越: 30 + 60 = 90

画面文言: 見出し「Web制作 30件」、サマリー「表示中 30件 / まだ見ていない 60件」。  
スクショ: `final-test-pc-results-web.png`

### 見つけた表示の違和感（修正せず記録）
フィードバック文が「いま **90件**を表示中 · まだ見ていない案件 60件」なのに対し、サマリーは「表示中 **30件**」。件数の定義（一致合計 vs 画面表示）が混ざって見える。矛盾というより文言の曖昧さ。司令塔判断待ち。

---

## 4. 追加取得（繰越） — PASS

- 「ほかの案件も見る」実行
- 表示中 30→**60**、まだ見ていない 60→**30**
- ヒント:「まずは残っている 30件を表示します（追加検索のクレジットは使いません）」
- `creditsSpent` は引き続き **0**（API再消費なし）

---

## 5. 条件変更→新規検索 — PASS

- 分野を「AI・自動化」に変更して再検索（キーなし）
- 旧結果タイトル（例: Website Debugging…）は消失
- 新実測: scanned 121 / verified 82 / matched 27 / filterMismatched 55 / displayed 27 / overflow 0 / credits 0
- 整合: 121 ≧ 82 ≧ 27 ≧ 27、27+55=82
- ソース: Freelancer.com 9 + クラウドワークス 16 + ココナラ 2 = 27
- スクショ: `final-test-pc-results-ai.png`, `final-test-pc-results.png`

---

## 6. Tavily追加検索 — SKIP

- `/api/tavily/settings` 時点で `saved=false`, `consent=false`（キー未設定）
- 指示どおり「未設定ならスキップ」。Tavily 実APIは叩いていない。

---

## 7. 再読み込み復元 — PASS

- ハードリロード後メッセージ:「前回の結果 **27件**を復元しました。」
- 見出し/サマリー:「AI・自動化 **27件**」「表示中 **27件**」→ **一致**
- 条件復元: 分野「AI・自動化」、探し方「かんたん検索（キーなし）」、統計（121/82/27 等）も保持
- スクショ: `final-test-sp-cta.png`（復元メッセージ＋27件が同時に見える）

---

## 8. 保存・応募 — PASS

- 結果1件を保存（Python Chatbot Coursework Tutoring Support）
- 「保存・応募」画面: 保存した案件 **1件**、タイトル表示あり
- 応募リンク「掲載元で確認・応募」の URL 形式: `https://www.freelancer.com/projects/...`（掲載元の案件ページ）。リンク先は未オープン
- スクショ: `final-test-pc-saved.png`

---

## 9. 課金ガード — PASS（表示・設定確認まで）

| 確認 | 結果 |
|---|---|
| `.dev.vars` の `OWNER_BILLING_APPROVED` | `0` |
| access なしゲート | 「深夜特急の承認待ち」文言あり |
| 設定画面 | 「無料がなくなるか、残量が確認できないときは検索を止めます。」 |
| 有料操作の実行 | **していない**（キー未設定のため Tavily も未実行） |

ライブで 402「これ以降は課金が必要なので深夜特急の承認待ちです」を起こす有料操作は、指示どおり実行していない。コード上の `BILLING_HOLD_MESSAGE` とゲート文言は確認済み。

スクショ: `final-test-pc-settings.png`

---

## 10. PC/SP表示 — PASS

| 画面 | ファイル | 横スクロール |
|---|---|---|
| PC 1440×900 検索 | `final-test-pc-search.png` | なし（scrollWidth=clientWidth=1440） |
| PC 結果 | `final-test-pc-results.png` | なし |
| PC CTA | `final-test-pc-cta.png` | なし |
| SP 390×844 検索 | `final-test-sp-search.png` | なし（390=390） |
| SP CTA | `final-test-sp-cta.png` | なし。③「この条件で探す」視認可 |
| SP 結果 | `final-test-sp-results.png` | なし |

文字切れ・ボタン欠けの致命傷は見当たらず。

---

## 総合

| # | 項目 | 判定 |
|---|---|---|
| 1 | ゲート | PASS |
| 2 | 初回表示・③ボタン文字 | PASS |
| 3 | かんたん検索（Web制作）統計整合 | PASS |
| 4 | 繰越「ほかの案件も見る」 | PASS |
| 5 | 条件変更→新規検索 | PASS |
| 6 | Tavily追加 | SKIP（キー未設定） |
| 7 | 再読み込み復元 | PASS |
| 8 | 保存・応募リンク | PASS |
| 9 | 課金ガード（表示） | PASS |
| 10 | PC/SP | PASS |

### 修正せず報告した問題
1. 検索成功時のフィードバック「いま N件を表示中」が、一致合計 N を指し、サマリーの「表示中」（ページ表示件数）とずれることがある（例: 90 vs 30）。
2. PCスクショ自動説明は緑ボタン上の白文字を読み落とすことがある（実描画は CDP/a11y/SPスクショで確認）。

本番反映の可否は司令塔判断。本作業ではデプロイ・git 操作は行っていない。
