# Data Model: get_dive_yearly_counts() / get_dive_monthly_stats()

010-stats-expansion が追加する DB オブジェクト。**新規テーブル・カラム追加はなし**（既存 `dives` の `dive_date` / `water_temp_c` / `max_depth_m` から導出する集計のみ）。

マイグレーション:

- `supabase/migrations/<ts>_create_get_dive_yearly_counts.sql`
- `supabase/migrations/<ts>_create_get_dive_monthly_stats.sql`

## 参照する既存テーブル

`public.dives`（[specs/002-dive-log-crud/data-model.md](../002-dive-log-crud/data-model.md)）

| 参照カラム | 型 | 備考 |
|---|---|---|
| `dive_date` | `date` | NOT NULL。集計の時間軸 |
| `water_temp_c` | `numeric(4,1)` | nullable。null は水温集計から除外（FR-006） |
| `max_depth_m` | `numeric(5,2)` | NOT NULL |
| `user_id` | `uuid` | RLS（`(select auth.uid()) = user_id`）で本人行のみに絞られる |

## RPC: public.get_dive_yearly_counts()

年別のダイビング本数。**記録のある年のみ**返す（歯抜け年の 0 埋めはアプリ層 `lib/trends.ts` — research.md R-003）。

```sql
create or replace function public.get_dive_yearly_counts()
returns table (
    year integer,
    dive_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        extract(year from dive_date)::integer,
        count(*)
    from public.dives
    where user_id = (select auth.uid())
    group by 1
    order by 1;
$$;
```

| 列 | 型 | 説明 |
|---|---|---|
| `year` | `integer` | 西暦年（例: 2026） |
| `dive_count` | `bigint` | その年の本数（>= 1。0 の年は行が存在しない） |

## RPC: public.get_dive_monthly_stats(months_back integer default 12)

月別の本数 / 平均水温 / 月内最大深度。基準月（現在月）から遡って `months_back` ヶ月分のうち、**記録のある月のみ**返す。

```sql
create or replace function public.get_dive_monthly_stats(months_back integer default 12)
returns table (
    month text,                 -- 'YYYY-MM'
    dive_count bigint,
    avg_water_temp_c numeric,   -- 水温記録ログのみの平均。全件未入力の月は null
    max_depth_m numeric         -- 月内の最大深度
)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        to_char(dive_date, 'YYYY-MM'),
        count(*),
        round(avg(water_temp_c), 1),    -- null は avg が自動除外（FR-006）
        max(max_depth_m)
    from public.dives
    where user_id = (select auth.uid())
      and dive_date >= date_trunc('month', current_date) - make_interval(months => greatest(months_back, 1) - 1)
    group by 1
    order by 1;
$$;
```

| 列 | 型 | 説明 |
|---|---|---|
| `month` | `text` | `YYYY-MM` 形式の年月 |
| `dive_count` | `bigint` | その月の本数 |
| `avg_water_temp_c` | `numeric` | 平均水温（小数 1 桁）。水温入力ログが 0 件の月は `null` |
| `max_depth_m` | `numeric` | その月の最大深度（FR-004 の期間代表値） |

### 設計メモ

- `avg(water_temp_c)` は SQL 標準どおり null を集計対象から除外するため、FR-006（未入力を 0℃ 扱いしない）は追加ロジックなしで満たされる
- `months_back` の既定 12 は spec Assumptions（直近 12 ヶ月）に対応。呼び出し側は固定値 12 のみ渡し、SQL 側でも `greatest(months_back, 1)` で 1 未満を防御する
- 最大深度・平均水温の推移も本 RPC 由来のため対象は直近 12 ヶ月（spec Assumptions / research.md R-005）
- 記録のある月のみ返す（0 件月の補完・空状態判定はアプリ層 — research.md R-006）
- 2 RPC とも `security invoker` + 既存 RLS ポリシー（`dives` の select ポリシー）で本人行のみ集計（FR-008）。`where user_id = (select auth.uid())` は RLS と二重の防御 + インデックス（`idx_dives_user_id_dive_date`）利用のため明示する
- `set search_path = ''` + 全オブジェクトのスキーマ修飾（`.claude/rules/sql.md` 準拠）

## アプリ層の導出モデル（DB 保存なし）

`service-front/src/features/dashboard/types.ts` に追加。0 埋め後の表示用モデル。

```typescript
/** 年別本数（get_dive_yearly_counts + 歯抜け年 0 埋め後） */
export interface YearlyDiveCount {
    year: number;
    diveCount: number;
}

/** 月別統計（get_dive_monthly_stats + 直近 12 ヶ月 0 埋め後） */
export interface MonthlyDiveStat {
    /** 'YYYY-MM' */
    month: string;
    diveCount: number;
    /** 平均水温。記録なし月は null（0 と区別する） */
    avgWaterTempC: number | null;
    /** 月内最大深度。ダイブなし月は null */
    maxDepthM: number | null;
}
```

`packages/supabase/src/types.ts` の `Functions` に両 RPC の Args / Returns 型を追加する（既存 `get_dive_stats` と同形式）。
