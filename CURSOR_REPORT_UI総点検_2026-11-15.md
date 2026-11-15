# CURSOR_REPORT_UI総点検_2026-11-15

## 結論
指摘1（フォーカス輪郭の浮き・二重線）と指摘2（select矢印の不揃い）を `app/globals.css` で直し、サイト全体の input / select / textarea の高さ・角丸・矢印・フォーカスを統一した。本番デプロイ・git commit/push はしていない。

## 欠陥リスト
- 総数: **9**（`tmp-screenshots/ui-audit-2026-11-15/DEFECTS.md`）
- 修正: D01〜D05
- 残: D06（hub-searchの弱いフォーカス）、D08（全状態網羅スクショ未完）、D09（ツールバーselectが48px化でやや大きめ・要観察）
- 対象外: D07（招待ゲートはフォームなしの直HTML）

## 指摘1：フォーカス輪郭
### 原因
1. 全要素共通 `button,a,input,select,textarea{outline-offset:4px}` が輪郭を要素から離していた
2. 追加の `focus-visible` も `outline-offset:3px` を指定し、枠線＋浮いた輪郭の二重線になっていた
3. website検索だけフォーカス色がグレー `#4b5563` でブランド緑と不一致

### 直し方
- `outline-offset:0` に変更
- フォーム部品の `:focus-visible` は **外outlineをやめ**、`border-color:#3b7655` ＋ `box-shadow: inset 0 0 0 2px #3b7655` に統一（角丸に沿い、浮きなし、二重線感を抑制）
- ボタン / リンク / summary は見える外リング（半透明緑）を維持
- フォーカス自体は削除していない

## 指摘2：select 矢印
### 原因
- website検索以外は `appearance:auto` のネイティブ矢印のまま
- padding-right が12px程度で矢印とテキストが窮屈

### 直し方
- `.shell`（およびゲート用クラス）配下の全 `select` で `appearance:none`
- 共通SVGシェブロン（12×8、右inset 18px）＋ `padding-right:44px`
- 高さ48px・角丸8px・枠色 `#d1d5db` を input/select で共有

## 修正したもの（その他）
- 模擬面談「案件の種類」、保存・応募、制作会社、設定、プロフィールのフォーム部品を website検索と同じ見た目に寄せた
- 既存の website専用 field ルールの focus も inset 方式に揃えた

## 残したものと理由
| 項目 | 理由 |
|------|------|
| hub-search 内 input の弱いフォーカス | 枠なし検索UIのためリングを消している。枠を足すとレイアウト構造が変わる |
| 全画面×全状態の網羅スクショ | 指摘1・2と主要画面のPC/SPを優先。hover/open/error等は未網羅 |
| 招待ゲートのCSS統一 | フォーム部品がなく、サーバー直HTMLのため対象外 |
| ツールバーselectの48px化 | 統一を優先。狭い箇所での圧迫感があれば別途微調整 |

## 確認結果
| 確認 | 結果 |
|------|------|
| npm run check:types | 成功 |
| npm run build | 成功 |
| verify-website-job-session | 成功 |
| verify-multi-site | 成功 |
| 計算スタイル（修正後） | `outline-offset:0px` / select `appearance:none` / `padding-right:44px` / focus `inset 0 0 0 2px #3b7655` |

## スクショ
- 修正前: `tmp-screenshots/ui-audit-2026-11-15/before/`
- 修正後: `tmp-screenshots/ui-audit-2026-11-15/after/`
- 欠陥表: `tmp-screenshots/ui-audit-2026-11-15/DEFECTS.md`

## 制約遵守
- ブランド配色・文言・レイアウト構造は維持（見た目整えのみ）
- デプロイなし / git commit・push なし
