-- ========================================
-- certification_tags テーブル
-- 資格に付与するスペシャリティタグ（1 資格 : 多タグ）
-- カンマ区切り・配列カラムを避け 1NF を守るため子テーブルで保持する
-- 仕様: specs/006-diving-certifications/data-model.md
-- ========================================

create table public.certification_tags (
    certification_id uuid not null references public.certifications(id) on delete cascade,
    tag text not null check (length(trim(tag)) > 0 and char_length(tag) <= 30),
    primary key (certification_id, tag)
);

comment on table public.certification_tags is '資格に付与するスペシャリティタグ。更新は削除 + 再挿入で行う';
comment on column public.certification_tags.tag is 'タグ名（自由入力）。trim 後 1 文字以上・30 文字以内';

alter table public.certification_tags enable row level security;

-- 所有者判定は親 certifications の user_id に委譲する。
-- タグ行は値そのものが主キーで更新操作は行わないため、update ポリシーは意図的に定義しない
create policy "users can read own certification tags"
    on public.certification_tags for select
    using (
        exists (
            select 1 from public.certifications c
            where c.id = certification_id and c.user_id = (select auth.uid())
        )
    );

create policy "users can insert own certification tags"
    on public.certification_tags for insert
    with check (
        exists (
            select 1 from public.certifications c
            where c.id = certification_id and c.user_id = (select auth.uid())
        )
    );

create policy "users can delete own certification tags"
    on public.certification_tags for delete
    using (
        exists (
            select 1 from public.certifications c
            where c.id = certification_id and c.user_id = (select auth.uid())
        )
    );
