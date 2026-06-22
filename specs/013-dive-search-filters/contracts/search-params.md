# Contract: `/dives` 検索 URL クエリパラメータ

**Feature**: 013-dive-search-filters | **Date**: 2026-06-18

`/dives` 一覧画面のフィルタ状態を表現する URL クエリパラメータの契約。Server（`page.tsx` の `searchParams`）と Client（`DiveList` の `router.replace`）の双方がこの契約に従い、`lib/search-params.ts` の純粋関数が変換を担う。

## パラメータ一覧

| パラメータ | 例 | 意味 | 検証（不正時は無視） |
|---|---|---|---|
| `number` | `number=12` | ダイブ番号一致 | 0〜9999 の整数 |
| `date_from` | `date_from=2025-07-01` | 期間の開始日（含む） | `YYYY-MM-DD` |
| `date_to` | `date_to=2025-08-31` | 期間の終了日（含む） | `YYYY-MM-DD` |
| `depth_min` | `depth_min=18` | 最大水深の下限（含む） | 0〜300 の数値 |
| `depth_max` | `depth_max=40` | 最大水深の上限（含む） | 0〜300 の数値 |
| `type` | `type=boat` | ダイブタイプ一致 | `DIVE_TYPE_OPTIONS` の value |
| `q` | `q=伊豆` | ポイント名部分一致（既存） | 120 文字以内 |

- 値が空・未指定のパラメータは URL に出力しない（`filterToSearchParams` が省略）。
- 未知のパラメータは無視する。
- 不正な値（範囲外・形式不一致・列挙外）はそのパラメータのみ無視し、他は有効として扱う（パース時は寛容、フォーム入力時は FR-006 でエラー表示）。

## クエリ意味論（フィルタ → DB クエリ）

```text
number    → eq('dive_number', n)
type      → eq('dive_type', type)
date_from → gte('dive_date', date_from)
date_to   → lte('dive_date', date_to)
depth_min / depth_max のいずれか指定 → not('max_depth_m','is',null)
depth_min → gte('max_depth_m', depth_min)
depth_max → lte('max_depth_m', depth_max)
q         → or(location ilike, dive_site_id in (名前一致サイト))   ※011 実装を踏襲
```

- すべて AND で合成（複数指定時は全条件を満たす行のみ）。
- 並び順・ページネーション（`(dive_date, id)` 降順キーセット）は既存どおり。

## 例

| URL | 意味 |
|---|---|
| `/dives` | フィルタなし・全件（日付降順） |
| `/dives?date_from=2025-07-01&date_to=2025-08-31` | 2025 年 7〜8 月に潜ったログ |
| `/dives?depth_min=30&type=deep` | 最大水深 30m 以上かつダイブタイプ=ディープ（水深未記録は除外） |
| `/dives?q=大瀬崎&depth_max=20` | ポイント名「大瀬崎」かつ最大水深 20m 以下 |

## 復元・共有（FR-010 / SC-004）

- 上記 URL を再読み込み・共有すると、`page.tsx` が `searchParams` をパースして同じ絞り込み結果を SSR で再現する。
- `DiveList` はマウント時に `initialFilter`（= URL 由来）で初期化し、SSR 取得済みデータをそのまま初期表示に使う。
