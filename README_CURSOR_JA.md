# Cursorで編集する手順

2026年11月13日の修正版です。29職種の検索、制作会社調査、Tavilyの無料残量に応じた確認処理を含みます。

公開中のアプリ： https://interview-atlas.vibrantmorningglory1.chatgpt.site

## 1. フォルダを開く

1. ZIPを解凍します。
2. Cursorで「File → Open Folder…」を選びます。
3. `package.json` がある `interview-atlas-cursor-2026-11-13` フォルダを開きます。
4. 「Terminal → New Terminal」でターミナルを開きます。

Node.jsは22.13以上が必要です。ターミナルで `node -v` を実行して確認できます。この書き出しはNode.js 24で検証しています。Node.jsがなければ公式サイトからLTS版を入れてください。

## 2. 初回だけ準備する

フォルダ内のターミナルで、順番に実行します。

```bash
npm ci
npm run setup:local
```

`setup:local` はPC内だけに暗号化キーとDBを用意します。DB初期化の確認が表示されたら、対象が `--local` であることを確認して `y` を入力してください。Cloudflareの本番DB作成やログインは不要です。再実行しても既存の暗号化キーは書き換えません。

## 3. 起動する

```bash
npm run dev
```

ターミナルに表示されるURLをブラウザで開きます。通常は http://localhost:5173/ です。停止はターミナルで `Control + C`。ファイルを保存すると開発画面に反映されます。

これはReact／TypeScriptとVinext（Next.js互換）＋Cloudflare Workersの構成です。HTMLを直接ダブルクリックして使うアプリではありません。

## 4. どこを編集するか

| 編集したいところ | ファイル |
| --- | --- |
| 画面全体・メニュー | `app/page.tsx` |
| 色・余白・スマホ表示 | `app/globals.css` |
| 案件の検索画面 | `components/website-jobs.tsx` |
| 29職種と検索語 | `lib/professions.ts` |
| 大分類・小分類 | `lib/job-categories.ts` |
| 掲載元とAPI案内 | `lib/freelance-sites.ts` |
| 案件の取得と検証 | `lib/multi-site-jobs.ts`、`lib/verified-website-jobs.ts` |
| 案件検索のサーバー処理 | `app/api/website-jobs/route.ts` |
| Tavily無料残量の判定 | `lib/tavily-allowance.ts` |
| 不足・残量不明時の端末確認 | `lib/tavily-confirmation.ts` |
| 制作会社の調査画面 | `components/company-research.tsx` |
| 調査済みの制作会社 | `data/researched-companies.json` |

## 5. キーと保存データ

- APIキーなしの案件検索・制作会社一覧から試せます。募集元の障害や期限切れ、条件によって件数は変わります。
- Tavilyを使う場合は、ローカル画面の「設定・連携」から自分のキーを登録してください。本番の保存キーは同梱していません。
- ローカル画面のサインインは開発用の仮ユーザーです。本番のChatGPTアカウント・DB・録音・応募メモとは別です。
- `.dev.vars` と `.wrangler` はPC内の秘密情報・保存データです。共有やGitへの追加はしないでください。暗号化キーを変更すると、そのキーで保存したAPIキーを復号できなくなります。
- キーを登録しただけではTavily検索を実行しません。検索・調査・接続テストのボタンを押した後だけ実行します。
- 無料残量を公式APIで確認できる間は追加確認なし。案件検索は最大2クレジット、残り1クレジットなら1回に縮小。不足・残量不明時だけ、開始した端末で確認します。
- 他のアプリと同じTavilyキーを使うと残量が変わるため、無料利用の保証をするカウンターではありません。

## 6. 編集後の確認

```bash
npm run check:types
npm run check:tavily
npm run build
```

Tavilyの検証スクリプトはテスト用の応答を使い、実際のAPIキーやクレジットを使いません。

## 7. 公開中のサイトへ反映するとき

このZIPを手元で編集しても、Sitesの非公開サイトは自動では更新されません。ChatGPTを経由せずに運用・更新する場合は、[HOSTING_CLOUDFLARE_JA.md](HOSTING_CLOUDFLARE_JA.md) の独立公開ガイドを参照してください。独立公開には認証・保存先の移行が必要です。既存Sitesの更新を希望する場合は、修正したソースをZIPにまとめてこのチャットに添付し、反映したい内容を伝えてください。`.dev.vars`、`.env`、`.wrangler`、`node_modules`、`dist` は添付しないでください。現在のサイトの所有者限定設定を保って反映するのが前提です。

Git履歴・リポジトリ認証情報・本番DB・APIキー・録音・個人の応募記録は含めていません。ローカル開発用サーバーを外部公開しないでください。

## CursorのAIに最初に伝える文

> README_CURSOR_JA.md と AGENTS.md を読み、このアプリの構成を確認してください。まず npm ci、npm run setup:local、npm run dev でローカル起動してください。変更は小さく行い、検索ボタンを押したときだけ検索する動作、Tavilyの無料残量に応じた確認、所有者限定の公開範囲、APIキーの保護を維持してください。自動デプロイや有料サービスの新規契約は行わないでください。

## 参考URL

- Cursor公式： https://cursor.com/docs/get-started/quickstart
- Node.js公式： https://nodejs.org/en/download
- Cloudflare D1のローカル開発： https://developers.cloudflare.com/d1/best-practices/local-development/
- Tavilyのクレジット説明： https://docs.tavily.com/documentation/api-credits

## 書き出しの情報

アプリ本体は公開反映済みソースのコミット `23f62386d85305e2a9d6d1a29bb1b842302f67f4` と同じです。この配布版には、起動ガイド、ローカル準備用スクリプト・設定、npmの確認コマンド、最新の所有者方針を反映した開発指示を追加しています。
