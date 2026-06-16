-- ========================================
-- dive_sites テーブル（共有マスタ）
-- ダイビングのポイント（ダイブサイト）を表す参照用マスタ。
-- 全ユーザーで共有し、ログから任意参照される。書き込みは seed / service role のみ。
-- 仕様: specs/011-dive-sites-master/data-model.md
-- ========================================

create table public.dive_sites (
    id uuid primary key default gen_random_uuid(),

    -- ポイント名。名称で一意（同名サイトの重複登録を防ぐ）
    name text not null unique check (length(trim(name)) > 0 and char_length(name) <= 100),
    -- エリア / 地域（例: 伊豆）。表示で名称と組み合わせる
    area text check (area is null or char_length(area) <= 60),
    -- 国コード（初期は国内中心）
    country text not null default 'JP' check (char_length(country) <= 2),
    -- 任意の説明
    description text check (description is null or char_length(description) <= 500),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.dive_sites is 'ダイビングのポイント（ダイブサイト）の共有マスタ。全ユーザーで共有し dives から任意参照される';
comment on column public.dive_sites.name is 'ポイント名。一意（同名サイトの重複登録不可）。trim 後 1 文字以上・100 文字以内';
comment on column public.dive_sites.area is 'エリア / 地域（例: 伊豆）。表示で名称と組み合わせる（任意）';
comment on column public.dive_sites.country is '国コード（ISO 3166-1 alpha-2 相当。既定は日本 = JP）';
comment on column public.dive_sites.description is 'サイトの説明（任意）';

alter table public.dive_sites enable row level security;

-- 共有マスタのため認証済みユーザーは全件参照できる。
-- 追加・編集・削除のポリシーは設けない（= デフォルト deny）。書き込みは seed / service role のみ。
-- 管理 UI による書き込みは別機能「管理画面」+ 管理者ロールで追加する。
create policy "authenticated can read dive sites"
    on public.dive_sites for select
    to authenticated
    using (true);

-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
create trigger dive_sites_handle_updated_at
    before update on public.dive_sites
    for each row
    execute function public.handle_updated_at();
