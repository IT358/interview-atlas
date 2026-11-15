# UI改善 報告（2026-11-15）

## 実施内容

### 変更1：探し方の説明
- `components/website-jobs.tsx` の「探し方」セレクタ直下に短い説明を追加
- 文案：「ふだんはキーなしで十分です。キーありは、キーなしで取りこぼす案件（ランサーズなど）を追加で探す方法で、無料枠を少し使います。」
- スタイル：`app/globals.css` に `.mode-hint` を追加（既存 `.advanced-hint` と同系）

### 変更2：単価予想の作業内容
- `lib/company-research.ts` の `proposalModels` を拡張（既存4件の範囲・前提は変更なし）
- 先頭に「全て（作業を問わない）」を追加し、デフォルトを `all`（30,000〜300,000円）に変更
- `components/company-research.tsx` のセレクタを `optgroup` 化
- `estimateNote('all')` は全体幅向けの文面で破綻しないよう分岐

## 追加した作業内容と金額根拠

| id | ラベル | 範囲 | 根拠 |
|---|---|---|---|
| all | 全て（作業を問わない） | 30,000〜300,000 | 既存モデルの最小〜最大 |
| coding_page | 1ページの追加・部分修正 | 5,000〜30,000 | Catwork 下層コーディング目安（税抜5,000〜10,000円/ページ）を下限の根拠 |
| design_lp_code | LPデザイン＋コーディング | 80,000〜200,000 | シンシエイト LPデザイン5〜10万円 + Catwork/シンシエイト LP実装目安3〜10万円級の合算仮説 |
| wp_custom | WordPressの修正・カスタマイズ | 10,000〜80,000 | Catwork WPカスタマイズ目安（税抜10,000円〜）を下限の根拠 |
| ops_monthly | サイト保守・運用（月額） | 30,000〜80,000 | 峰の公開例（ECサイト運用などの定型業務：月3万円〜）を下限の根拠 |

既存（変更なし）：coding5 50k–150k / lp 30k–100k / wp 100k–200k / design 120k–300k

グループ：全体 / コーディング / デザイン / WordPress・EC / 運用

## 追加しなかった候補と理由

| 候補 | 理由 |
|---|---|
| バナー・サムネイル制作 | estimateSources 4サイトにバナー／サムネ単価の公開が確認できず |
| ECサイト構築（Shopify等） | 峰はEC「運用」月額のみ。構築・Shopify単価の公開なし |
| Webアプリ・業務ツール開発 | 4ソースにアプリ／業務ツール委託単価なし |
| AI連携・チャットボット実装 | 4ソースに該当単価なし |

このため「アプリ・自動化」グループ自体も未作成。

## 確認結果

- `npm run check:types`：成功
- `npm run build`：成功
- `node scripts/verify-website-job-session.mjs`：成功
- `node scripts/verify-multi-site.mjs`：成功
- Tavily実API：未実行
- 本番デプロイ / git commit・push：未実施（指示どおりローカル確認のみ）

## スクリーンショット

- `tmp-screenshots/ui-hint-search-mode-2026-11-15.png` … 探し方セレクタ直下の説明
- `tmp-screenshots/ui-company-price-model-2026-11-15.png` … 単価予想セレクタ（optgroup・全てデフォルト）を開いた状態
