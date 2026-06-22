-- ========================================
-- get_dive_monthly_stats(months_back) RPC
-- 月別の本数 / 平均水温 / 月内最大深度を DB 側で集計する
-- 記録のある月のみ返す。0 件月の補完・空状態判定はアプリ層（lib/trends.ts）で行う
-- avg(water_temp_c) は null（水温未入力）を自動除外するため 0℃ と混同しない（FR-006）
-- security invoker + RLS により呼び出しユーザーのデータのみ集計される
-- 仕様: specs/010-stats-expansion/data-model.md
-- ========================================

create or replace function public.get_dive_monthly_stats(months_back integer default 12)
returns table (
    month text,
    dive_count bigint,
    avg_water_temp_c numeric,
    max_depth_m numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        to_char(dive_date, 'YYYY-MM'),
        count(*),
        round(avg(water_temp_c), 1),
        max(max_depth_m)
    from public.dives
    where user_id = (select auth.uid())
      and dive_date >= date_trunc('month', current_date) - make_interval(months => greatest(months_back, 1) - 1)
    group by 1
    order by 1;
$$;

comment on function public.get_dive_monthly_stats(integer) is '統計の推移（月別の本数 / 平均水温 / 最大深度）。現在月から遡って months_back ヶ月分のうち記録のある月のみ返す';
