-- ========================================
-- get_dive_stats() RPC
-- 自分のダイブの累計統計を DB 側で集計する（行数増加に耐えるため）
-- security invoker + RLS により呼び出しユーザーのデータのみ集計される
-- 仕様: specs/003-dashboard/plan.md 累計統計クエリ節
-- ========================================

create or replace function public.get_dive_stats()
returns table (
    total_dives bigint,
    total_bottom_time_min bigint,
    max_depth_m numeric,
    visited_locations bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
    select
        count(*),
        coalesce(sum(bottom_time_min), 0),
        coalesce(max(max_depth_m), 0),
        count(distinct location)
    from public.dives
    where user_id = (select auth.uid());
$$;

comment on function public.get_dive_stats() is 'TOP ダッシュボードの累計統計（本数 / 潜水時間 / 最大水深 / 訪問スポット数）';
