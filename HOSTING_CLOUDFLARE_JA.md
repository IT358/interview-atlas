# ChatGPTを経由せずに更新・運用する公開先

## 推奨：自分のCloudflare Workers

このアプリはCloudflare Workers・D1・R2を使う構成です。独立公開するなら、既存の構成を活かせるCloudflare Workersが第一候補です。

流れは「Cursorで編集 → 自分のGitHubの非公開リポジトリへpush → Cloudflare Workersでビルド・デプロイ」です。Git連携を設定すれば、以後はpushした変更を自動反映できます。手動でWranglerからデプロイする方法もあります。

この運用はChatGPTへの編集依頼やSitesへの再反映を経由しません。CursorのAI利用料、Cloudflareの運営費、Tavilyなどの外部API利用料は、それぞれ別の契約です。AIを使わず手動で編集した作業に、AIモデルの利用料は発生しません。

## このZIPの状態

このZIPは「Cursorで編集・ローカル検証する配布版」です。Cloudflareの独立本番環境への移行は、まだ行っていません。ZIPをアップロードするだけでは、本番用ログインや個人データの保存先まで自動移行しません。

現在のSitesの所有者限定ログインとユーザー識別はSitesに依存しています。独立公開する際は、以下の初回作業が必要です。

1. 自分のCloudflareアカウントで、Workers・D1・R2の料金と利用枠を確認します。現在のSitesの公開範囲は変更しません。
2. 自分の非公開GitHubリポジトリへソースだけを登録します。`.dev.vars`、`.env`、`.wrangler`、`.sites-runtime`、`node_modules`、`dist` は登録しません。
3. 本番専用D1と非公開R2を用意し、DB・BUCKETのバインディングとSQLマイグレーションを設定します。`wrangler.local.json` のゼロ埋めIDはローカル専用です。本番IDとして使わないでください。
4. 本番用の `USER_KEY_ENCRYPTION_KEY` をCloudflareのSecretとして設定します。値はGitへ入れません。初回の新環境には本番データや保存済みAPIキーがないため、アプリ画面から再登録します。
5. Cloudflare Accessなどで、所有者のメールアドレスだけを許可する入口を作ります。Worker本体・全API・別のworkers.dev URL・プレビューURLにも保護を適用するか、迂回できるURLを無効にします。
6. `app/chatgpt-auth.ts` のSites専用ログインを、移行先の認証に置き換えます。Cloudflare Accessの場合はJWTの署名・issuer・audience・有効期限を検証して利用者IDを決めます。ブラウザから任意に送れる `oai-authenticated-user-*` ヘッダーを本番で信用しないでください。DB内のユーザー別保存・キー保管にも同じ検証済みIDを使います。
7. 自分のD1・R2・Secrets・認証を使う本番用Wrangler設定を作り、ビルド出力を指定します。既存 `.openai/hosting.json` のSite IDは、この自分のCloudflare環境のデプロイ先ではありません。
8. 非公開状態で、未ログインのAPI拒否、所有者ログイン、案件検索、保存、Tavilyの残量判定、スマホ表示を確認します。
9. 最後にCloudflareのGit連携を設定します。以後はCursorで編集・確認し、Gitへpushして反映します。

アカウントの契約・請求設定・認証設定が必要な段階では、本人が内容を確認して行ってください。このガイドは自動的にアカウントや有料サービスを作成するものではありません。

## 料金の考え方（2026年11月13日に公式資料を確認）

| 項目 | 無料枠・費用の扱い |
| --- | --- |
| Workers Free | 動的リクエストは1日10万回、1実行のCPU時間10ms。件数とCPU上限の両方に注意。 |
| Workers Paid | 月額最低5米ドルから。含まれる量を超えた使用量は別途。 |
| D1 Free | 1日500万行読み込み・10万行書き込み、合計5GBの無料枠。 |
| R2 Standard | 月10GB-month、Class A 100万操作・Class B 1,000万操作の無料枠。超過分は別料金。 |
| 独自ドメイン | 希望する場合はドメイン料金が別途。 |
| Tavily等 | ホスティングと別枠。アプリを置く場所を変えてもAPI無料枠は増えません。 |
| CursorのAI | 自分のCursor契約や使用するAPI設定に従います。 |

このアプリはSSRと複数募集ページの解析を行います。Workers Freeの10ms CPU枠内で安定稼働するかは独立環境での実測が必要です。無料枠だけで全機能が必ず動くとは保証していません。CPU超過時は処理の分割・キャッシュ・機能縮小、または本人が料金を確認した上でPaidプランを検討します。

## CursorのAIに移行を依頼する文

> README_CURSOR_JA.md、HOSTING_CLOUDFLARE_JA.md、AGENTS.mdを読み、このアプリを自分のCloudflare Workersへ独立デプロイできるよう準備してください。まず変更内容と費用が発生する設定を説明し、ローカルで実装・検証してください。Sites専用認証をそのまま公開せず、検証済みの認証と所有者だけのアクセス制御を実装してください。D1・R2・Secretsを本番とローカルで分け、APIキーや個人データをGitへ入れないでください。アカウント契約、有料化、公開範囲変更、本番デプロイは私の確認前に行わないでください。準備完了後はGitHubとCloudflareの連携で更新できる手順を示してください。

## 公式リンク

- Cloudflare管理画面： https://dash.cloudflare.com/
- Workers料金： https://developers.cloudflare.com/workers/platform/pricing/
- Git連携： https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/
- Cloudflare Access： https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/
- D1料金： https://developers.cloudflare.com/d1/platform/pricing/
- R2料金： https://developers.cloudflare.com/r2/pricing/
