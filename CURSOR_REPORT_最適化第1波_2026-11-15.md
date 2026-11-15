# 最適化・第1波 報告（2026-11-15）

## 削除したもの

対象は主に `components/jobs-hub.tsx`（約7.8KB削減、おおよそ80行相当）。ファイル削除はなし。

| 削除内容 | 理由 |
|---|---|
| 「制作進捗」セクション（14タスク・進捗UI・補助メニュー項目） | 企業向けAIチャットボットのハードコード。中核機能ではない |
| `tasks` / `states` / `task()` / portfolio の `useEffect` / `kind:'portfolio'` 保存UI | 上記専用。既存の portfolio レコード・`atlas-portfolio` ローカルデータは削除せず、UIから到達不能にしただけ |
| 旧カタログ用 `/api/jobs` クライアント読込（`feed` / `read` / `refresh`） | discover は既に `WebsiteJobs` のみ。`read()` は画面から一度も呼ばれておらず、feed は空のまま |
| 旧 Tavily Web検索UI（`searchMode==='ai'` / `searchTavily` / `aiResult` 表示） | 保存画面では `section==='saved'` で即 return され、discover に旧フォームもなく到達不能 |
| 為替換算表示・未使用の countries / skills / sourceOptions 等 | feed 依存の死コード |

## 消さなかったものと理由

| 残したもの | 理由 |
|---|---|
| 模擬面談・録音・音声・AI評価まわり | 指示どおり第1波では手を入れない |
| 制作会社営業（company-hub / company-research） | 存廃は本人判断待ち。消さない |
| `WebsiteJobs`（新検索） | 現行の「仕事を探す」本体 |
| 保存・応募の一覧・詳細・ステータス・下書き・ICS・練習導線 | 稼働中の中核。旧フィードには依存していない |
| URL登録 / 日本サイト / 海外サイト / 収集元 | 補助として使用中 |
| `app/api/jobs` / `lib/job-feed.ts` | MCP 等のサーバ側が参照。クライアント未使用でもルート削除は第1波の範囲外 |
| `lib/tavily-search.ts` / `/api/tavily/search` | website-jobs 追加検索やサーバ経路で継続利用 |
| portfolio の保存データそのもの | コストロック方針どおり、キー・ユーザデータを消さない |

## 旧検索と「保存・応募」の依存一覧

### 保存・応募が実際に使うもの
1. `personal`（ログイン時は workspace の `application`/`job`、ゲストは `atlas-personal-v2`）
2. `save` / `saveSelected` / `removeSelected` → `/api/workspace`
3. 絞り込みフォーム（検索語・分野・応募状況・スキル・報酬）→ ボタン押下後に反映
4. 詳細パネル（ステータス、メモ、応募文、面談日時、練習への受け渡し）
5. discover からの保存は `WebsiteJobs` → `onSave` → 同じ `save()`

### 旧カタログ（`/api/jobs` feed）への依存
- **一覧表示：なし**（保存一覧は personal のみ）
- **追加検索合算：なし**（旧 AI Web検索は件数非加算かつ到達不能だった）
- **為替レート：弱い依存だったが未使用**（`read()` 未呼び出しで rate 常に空）

### 移行手順案（まだ実施しない）
1. 保存一覧を `WebsiteJobs` と同じ案件型・表示部品に寄せる（詳細パネルは共通化）
2. 絞り込み条件を website 条件セットに寄せ、`emptySearch` 旧フィールドを段階削除
3. MCP / 監視用途が不要なら `app/api/jobs` と `lib/job-feed.ts` を別タスクで退役
4. 退役前に「保存済み案件の再取得・再検証」が必要か本人確認

## 確認結果

- `npm run check:types`：成功
- `npm run build`：成功
- `node scripts/verify-website-job-session.mjs`：成功
- `node scripts/verify-multi-site.mjs`：成功
- ローカル画面：仕事を探す / 保存・応募 / 制作会社へ営業 / 設定 を開いて表示確認
- 補助メニューに「制作進捗」が無いことを確認
- Tavily実API：未実行
- 本番デプロイ / git commit・push：未実施
