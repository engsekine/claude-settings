# Quickstart: 統計の拡充の動作検証

実装完了後に feature が end-to-end で動くことを確認する手順。詳細仕様は [spec.md](./spec.md)、RPC 契約は [contracts/dive-trends-rpc.md](./contracts/dive-trends-rpc.md) を参照。

## 前提

- ローカル Supabase が起動済み（`supabase start`）でマイグレーション適用済み（`supabase db reset` または `supabase migration up`）
- `service-front` の依存インストール済み（`npm install`）
- テストユーザーでログイン可能であること

## 1. マイグレーション・RPC の確認

```bash
supabase db reset
# psql で RPC の存在と RLS 越しの挙動を確認
psql "$DATABASE_URL" -c "select * from public.get_dive_yearly_counts();"
psql "$DATABASE_URL" -c "select * from public.get_dive_monthly_stats(12);"
```

**期待結果**: 認証コンテキストなし（`auth.uid()` が null）では 0 行。エラーにならない。

## 2. 単体テスト（純粋関数・コンポーネント）

```bash
cd service-front
npm run test -- src/features/dashboard/lib/trends.test.ts
npm run test -- src/shared/components/chart
npm run test -- src/features/dashboard/components/server/DiveTrends src/features/dashboard/components/server/TrendChartCard
```

**期待結果**: すべて green。特に以下が含まれること:

- `fillYearlyGaps`: 歯抜け年が 0 本で補完される / 空配列は空配列のまま / 単一年
- `fillMonthlyGaps`: 12 要素になる / 年跨ぎ（例: 基準 2026-06 → 2025-07 始まり）/ 欠測月の水温・深度が null
- `LineChart`: value null で線が分断される / 単一点で破綻しない

## 3. Storybook / a11y

```bash
npm run storybook        # BarChart / LineChart / TrendChartCard / DiveTrends の各 story を目視確認
npm run test:e2e         # Playwright + axe-core（TOP ページに violation がないこと）
```

## 4. 画面での確認シナリオ

`npm run dev` で起動し、テストユーザーでログインして `/` を開く。

| # | 事前データ | 期待結果 | 対応 spec |
|---|---|---|---|
| 1 | 複数年・複数月のログ | 「統計の推移」セクションに年別本数・月別本数（直近 12 ヶ月）・水温・最大深度の 4 グラフが表示される | US1 / US2 / US3 |
| 2 | ログのない月が期間内にある | 月別本数グラフでその月が 0 本として表示される（歯抜けにならない） | FR-003 |
| 3 | 水温未入力ログのみ | 水温カードだけ「水温を記録すると傾向が表示される」空状態。他 3 グラフは表示 | US3-AC3 |
| 4 | 水温入力・未入力が混在する月 | その月の平均水温が入力済みログのみで計算される（0℃ 側に引っ張られない） | FR-006 |
| 5 | ログ 0 件 | グラフの代わりに記録を促す空状態 + CTA。エラーにならない | FR-007 / SC-004 |
| 6 | ログ 1 件のみ | 各グラフが単一点／単一棒で表示され、崩れない | Edge Case |
| 7 | 任意 | 各グラフカードの「データを表で見る」を開くとデータテーブルが表示される。キーボード（Tab + Enter）のみで開閉できる | FR-009 |
| 8 | 未認証で `/` を開く | `/login` にリダイレクト | US1-AC5 |
| 9 | 別ユーザーのログが存在する状態 | 自分のログのみが集計されている | FR-008 |
| 10 | 2 年以上前のログのみ（直近 12 ヶ月は 0 本） | 空状態にならず、年別グラフにデータ・月別グラフは 12 ヶ月すべて 0 本の列で表示される | FR-003 / research.md R-006 |

## 5. パフォーマンス確認（SC-002）

数百件のログを投入した状態で `/` の表示が体感 2 秒以内であること。RPC の返却行数が年別 = 年数・月別 ≤ 12 行であることを確認する。
