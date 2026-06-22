-- ========================================
-- get_dive_yearly_counts() RPC
-- 年別のダイビング本数を DB 側で集計する（行数増加に耐えるため）
-- 記録のある年のみ返す。歯抜け年の 0 埋めはアプリ層（lib/trends.ts）で行う
-- security invoker + RLS により呼び出しユーザーのデータのみ集計される
-- 仕様: specs/010-stats-expansion/data-model.md
-- ========================================

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

comment on function public.get_dive_yearly_counts() is '統計の推移（年別ダイビング本数）。記録のある年のみ返す';
