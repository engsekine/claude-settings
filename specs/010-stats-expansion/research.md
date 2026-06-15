# Research: 統計の拡充

Phase 0 の技術選定。spec.md に NEEDS CLARIFICATION はないため、実装方式の決定 4 点を記録する。

## R-001: 集計 RPC の設計 — 既存 `get_dive_stats()` の変更 vs 新規 RPC 追加

**Decision**: 既存 `get_dive_stats()` は変更せず、時系列集計用に新規 RPC を 2 つ追加する。

- `get_dive_yearly_counts()` — 年別本数。`(year, dive_count)` の複数行
- `get_dive_monthly_stats(months_back integer default 12)` — 月別本数 / 平均水温 / 月内最大深度。`(month, dive_count, avg_water_temp_c, max_depth_m)` の複数行

**Rationale**:

- 既存 RPC は「単一行の累計値」、本 feature は「複数行の時系列」で戻り値の形が根本的に異なる。1 つの関数に混ぜると呼び出し側が常に両方のコストを払う
- 既存 RPC のシグネチャ変更は dashboard の既存コード（`queries.ts` / `packages/supabase/src/types.ts`）への破壊的変更になる。追加のみなら既存コードは無風
- 月別 1 RPC に本数・水温・深度をまとめるのは、3 系列とも同じ `group by month` であり 1 回のスキャンで取れるため（3 RPC に分けると同じ集計を 3 回走らせることになる）
- ユーザー入力の「get_dive_stats RPC の拡張で対応」は「DB 側集計方式の踏襲」と解釈する（年別・月別という別軸の集計は同一関数では表現できないため）

**Alternatives considered**:

- 既存 `get_dive_stats()` に列追加 → 時系列（複数行）を返せず不成立
- 粒度パラメータ付きの単一 RPC `get_dive_trends(granularity)` → 戻り値の意味が引数で変わり型安全性が下がる。year/month で列構成も異なる
- クライアント（Server Component）で `dives` 全行を取得して集計 → 行数増加に弱く、既存 RPC を導入した経緯（specs/003-dashboard）に逆行

## R-002: グラフ描画 — 自作 SVG（Server Component）vs チャートライブラリ

**Decision**: チャートライブラリは追加せず、`BarChart` / `LineChart` を SVG の Server Component として自作する。

**Rationale**:

- 必要なのは「棒グラフ 2 種 + 折れ線 2 種、ツールチップ・ズームなし」の静的表示のみで、ライブラリの機能の大半が不要
- recharts / visx / chart.js 等は React の client 境界（hooks / canvas / イベント）を要求し、`'use client'` 化が必須になる。Constitution II（Server Components First）に反し、バンドルサイズも増える
- 自作 SVG なら `role="img"` + `aria-label` + 代替テーブルという a11y 設計（Constitution V / FR-009）を完全に制御できる
- データ点は最大でも年数 + 12 ヶ月 × 3 程度で、描画ロジックは座標変換のみの純粋計算。テスト容易

**Alternatives considered**:

- recharts — 実績豊富だが client 必須・~100KB 超。静的表示には過剰
- @tremor/react / shadcn charts（recharts ラッパー）— 同上
- CSS のみ（div の高さで棒グラフ）— 棒グラフは可能だが折れ線が表現できず、2 方式が混在する

## R-003: 歯抜け期間の 0 埋め — SQL（generate_series）vs TypeScript 純粋関数

**Decision**: RPC は「データのある年・月のみ」を返し、歯抜けの補完（年: 0 本、月: 0 本 + 水温・深度 null）は `features/dashboard/lib/trends.ts` の純粋関数で行う。

**Rationale**:

- Vitest で境界ケース（単一年 / 年跨ぎ / 全欠測 / うるう月跨ぎ）を高速に網羅でき、Test-First（Constitution III）に乗せやすい
- SQL 側を単純な `group by` に保て、RPC のレビュー・保守が容易
- 「直近 12 ヶ月」の基準日（JST の今日）はアプリ層の関心事（`todayInJst()` が既に存在）。SQL に持ち込むと TZ の扱いが二重管理になる

**Alternatives considered**:

- `generate_series` + left join で SQL 側 0 埋め — 可能だが、月別 RPC に「基準日」引数が必要になり TZ 解釈が DB 側に漏れる。テストもマイグレーション適用が前提になり重い

## R-004: グラフの代替表現（FR-009）— `<details>` + table vs sr-only テキスト

**Decision**: 各グラフカードに `<details><summary>データを表で見る</summary>` + データテーブルを置く。SVG 本体は `role="img"` + 要約 `aria-label`（例: 「年別ダイビング本数。2024 年 18 本、2025 年 24 本、2026 年 11 本」）。

**Rationale**:

- `<details>` は native HTML のみで開閉でき、Client Component 化が不要（Constitution II）
- スクリーンリーダー利用者だけでなく、正確な数値を知りたい全ユーザーに役立つ（spec SC-005 の読み取りやすさにも寄与）
- WAI の複雑な画像の代替手段パターン（隣接するデータテーブル）に合致

**Alternatives considered**:

- sr-only のテキスト説明のみ — 晴眼ユーザーが数値を確認できず、データ量が多いと読み上げが冗長
- SVG 内 `<title>`/`<desc>` のみ — 支援技術のサポートが不均一で単独では不十分

## R-005（確認事項）: 月別「直近 12 ヶ月」と年別「全期間」の整合

spec の Assumptions どおり、月別は直近 12 ヶ月固定・年別は全期間とする。**最大深度・水温の推移も同じ月別 RPC 由来のため直近 12 ヶ月を対象とする**（spec Assumptions に明記済み）。年の切り替え UI（月別を年単位で見る）・全期間の深度推移は本 feature のスコープ外（必要になれば後続 feature で Client 化を検討）。

## R-006: 直近 12 ヶ月にログがないユーザーの月別表示（/speckit-analyze I1 の解消）

**Decision**: ダイブログを 1 件以上持つユーザーには、直近 12 ヶ月の全月が 0 本でも月別グラフを「12 要素の 0 本列」として表示する。セクション全体の空状態（FR-007）は**年別集計（全期間対象）が空配列かどうか**で判定する。これに合わせて `fillMonthlyGaps` は rows が空でも常に `months` 要素を返す無条件 0 埋めとする。

**Rationale**:

- FR-003（歯抜け禁止）と FR-007（空状態）の優先関係を「ログ全体の有無」で一意に決められ、表示ロジックの分岐が単純になる
- 年別は全期間を対象とするため「空配列 ⇔ ログ 0 件」が常に成立し、追加クエリなしで判定できる
- 古いログのみのユーザーに空状態（記録ゼロ扱い）を見せるのは事実と異なり、0 本の推移を見せる方が「最近潜れていない」という正しい情報になる

**Alternatives considered**:

- 月別集計の中身で空状態を判定 — 「古いログのみ」のユーザーで年別グラフと月別空状態が同居し、表示が矛盾して見える
- `fillMonthlyGaps(rows=[])` を `[]` のままにし呼び出し側で分岐 — 純粋関数の戻り値が条件付きになり、契約が複雑化する
