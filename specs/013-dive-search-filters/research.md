# Research: ダイブログ検索・フィルタ強化

**Feature**: 013-dive-search-filters | **Date**: 2026-06-18

spec の clarify で主要な曖昧点（深度 null の扱い・フィルタ UI 形態）は解決済み。本フェーズでは実装方式の選択根拠を記録する。NEEDS CLARIFICATION は残っていない。

## 1. フィルタ状態の URL 同期方式

- **Decision**: フィルタを URL クエリパラメータ（`/dives?date_from=...&depth_min=...` 等）で表現し、Server 側 `page.tsx` の `searchParams` から SSR 初期フェッチ、Client 側 `DiveList` から `router.replace` で更新する。
- **Rationale**: FR-010 / SC-004（再読み込み・共有で結果を復元）を満たすには永続的に表現できる状態が必要。既存のポイント名検索も「URL 等で表現する導出的な状態」と spec が想定しており、URL が最も軽量で共有可能。Server Components First（憲法 II）とも整合し、初期描画を SSR で返せる。
- **Alternatives considered**:
  - `useState` のみ（現状）→ 再読み込み・共有で失われ FR-010 を満たせない。却下。
  - localStorage 永続化 → 共有 URL にならず SC-004 不成立。却下。
  - React Context / グローバルストア → 一覧 1 画面に閉じた状態には過剰。却下。

## 2. 期間・深度の範囲クエリ（Supabase）

- **Decision**: `dive_date` は `.gte(dateFrom)` / `.lte(dateTo)`、`max_depth_m` は `.gte(depthMin)` / `.lte(depthMax)` で両端含む AND 条件として適用。片側のみ指定は開いた範囲。
- **Rationale**: PostgREST の `gte`/`lte` は両端含む範囲を素直に表現でき、既存の `eq`（番号・タイプ）や location/cursor の `or()` と AND で共存する。DB 側で絞るためページネーション・件数が正確。
- **Alternatives considered**: クライアント側フィルタ → キーセットページネーションと両立せず（取得後に間引くと 1 ページ件数が崩れる）。却下。

## 3. 最大水深が NULL のログの扱い

- **Decision**: `depthMin` または `depthMax` のいずれかが指定されたら `.not('max_depth_m', 'is', null)` を付与し、未記録ログを除外する（spec Q1 / FR-002）。
- **Rationale**: SQL の比較は NULL に対し UNKNOWN となり既定で除外されるが、意図を明示しテストで担保するため明示的に `.not(... is null)` を置く。011 の平均透明度における null 除外方針とも一貫。
- **Alternatives considered**: NULL を範囲内として含める → 「30m 以深」に水深不明ログが混ざり絞り込みの意味が崩れる。却下。

## 4. ダイブタイプの選択肢と単一選択

- **Decision**: 既存 `DIVE_TYPE_OPTIONS`（boat / beach / drift / night / deep / wreck / cave / training / other）を流用し、native `select`（先頭「指定しない」）で単一選択。クエリは `.eq('dive_type', value)`。
- **Rationale**: 記録側（DiveForm）と同じ選択肢・DB 値を共有でき表記ゆれが出ない。単一選択は spec Assumptions の確定事項。複数選択は将来拡張。
- **Alternatives considered**: 複数選択（`in`）→ スコープ外（spec で単一に確定）。却下。

## 5. フィルタ入力 UI（折りたたみ詳細パネル）

- **Decision**: 番号・ポイント名は常時表示、期間・深度・ダイブタイプは disclosure（`aria-expanded` / `aria-controls`）の「詳細条件」パネルに格納。折りたたみ時も「N 件適用中」を表示（spec Q2 / FR-012）。
- **Rationale**: 入力が 5 項目増えてもモバイルでバーが過密にならず、WCAG 2.1 AA（憲法 V）の disclosure パターンに沿える。適用中件数の提示で、隠れたフィルタの見落としを防ぐ。
- **Alternatives considered**: 全項目常時表示 → モバイルで縦に長く、主要操作が埋もれる。却下。別画面/モーダル → 一覧との往復が増え振り返り操作のテンポを損なう。却下。

## 6. ページネーション越しのフィルタ維持

- **Decision**: 既存どおり `useDives(filter, ...)` の react-query `queryKey: ['dives', filter]` にフィルタを含め、各ページ取得に同一フィルタを渡す（FR-009）。
- **Rationale**: 現行アーキテクチャがすでにフィルタをキーに含めており、追加フィルタも自動的にページ送りで維持される。新規対応は不要で、テストで担保する。
