# CURSOR_REPORT_UI総点検の続き_2026-11-15

## 結論
残件 D06・D08・D09 を完了。撮影中に発見した D10（select矢印が `background` ショートハンドで消える）も修正した。指摘1・2の修正は維持。デプロイ・git操作なし。Tavily実API未実行。

## D08：撮影を網羅した画面×状態

保存先: `tmp-screenshots/ui-audit-2026-11-15/after/`（d08-* / d06-* / d09-*）

| 画面 | PC 1440×900 | SP 390×844 | 撮った状態 |
|------|-------------|------------|------------|
| 仕事を探す | d08-jobs-pc-initial / loading-or-result / hover-and-select-open / d09-toolbar-* | d08-jobs-sp-initial-disabled-field / d08-sp-sidebar-open | 初期・読み込み中・結果・ホバー・プルダウン開放風・disabled（分野）・ツールバー |
| 保存・応募 | d08-saved-pc-empty / d08-saved-pc-toast | d08-saved-sp | 空〜結果混在・トースト・初期 |
| 制作会社へ営業 | d08-company-pc-initial | （PC優先、SPはナビ共通） | 初期 |
| 模擬面談 | d08-practice-pc | d08-practice-sp | 初期（select含む） |
| 練習の記録 | d08-history-pc | — | 初期（記録あり） |
| 設定 | d08-settings-pc-disabled | d08-settings-sp | disabled入力・disabled保存ボタン |
| プロフィール | d08-profile-pc-filled-focus | （SPはプロフィール入力の継続表示あり） | 入力済み・フォーカス |
| サイドバー/モバイルナビ | （PCサイドバー各画面） | d08-sp-sidebar-open / 下部ナビ各遷移 | 展開・カレント |
| 招待ゲート | d08-invite-gate | 同HTML（フォームなし） | 初期 |
| hub-search（D06） | d06-hub-search-focus-within | — | focus-within |

未撮影の細部: ネイティブOSのselectポップアップ実体（ブラウザ制約で size 属性による開放風で代替）、全画面のホバーをピクセル単位で網羅した連続コマは一部に限定。

## DEFECTS.md 追記と修正結果
- **D06** → 修正済（下記）
- **D08** → 撮影完了
- **D09** → 修正済（下記）
- **D10（新規）** → `.hub-filters select{background:#fff}` 等がカスタム矢印を消していた。`.shell .hub-filters select` 等で `background-image` を再指定し修正。category-branch/leaf も `bg:true` を確認

## D06 の結論
**直した。** input に枠は足していない。

方法:
- `.shell .hub-search:focus-within` でコンテナの `border-color` を緑、`background` を薄い緑、`box-shadow: inset 0 -2px 0` の下線アクセント
- input 自体は `border:0` / `box-shadow:none` のまま

補足: 現行JSXでは `hub-search` クラスは未マウント（最適化第1波でUI整理済み）。CSSパターンは残っており、デモ注入で focus-within の視覚を確認（`d06-hub-search-focus-within.png`）。

## D09 の結論
**圧迫あり → compact variant を適用。**

- 圧迫箇所: `.results-toolbar` の並べ替え select（仕事を探す結果・保存案件結果）
- 計測: 共通48px適用時 select高さ48px・toolbar高さ約80px（`d09-toolbar-select-48px-pressure.png`）
- 対応: `.results-toolbar select` および `select.field-compact` を高さ40pxに。矢印・角丸・insetフォーカスは共通仕様のまま
- `website-jobs.tsx` / `jobs-hub.tsx` の並べ替え select に `className="field-compact"` を付与
- フォーム本体の48px統一は維持（`d09-toolbar-select-40px-compact.png`）

## 確認結果
| 確認 | 結果 |
|------|------|
| npm run check:types | 成功 |
| npm run build | 成功 |
| verify-website-job-session | 成功 |
| verify-multi-site | 成功 |

## 制約遵守
- ブランド・文言・レイアウト構造は維持（見た目整えのみ）
- 本番デプロイなし / git commit・push なし
- Tavily実API未実行
