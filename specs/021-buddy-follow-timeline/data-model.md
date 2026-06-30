# Data Model: バディ・フォロー・タイムライン

対象 DB: Supabase（PostgreSQL）。命名・型・RLS は `.claude/rules/sql.md` と constitution IV に準拠。新規 2 テーブル + 既存 `dives` への RLS / index 追加 + 関数 1 つ。

## 1. 新規テーブル `public.dive_log_buddies`

ダイブログと同行者（バディ）の関連。1 件ごとに「登録ユーザー参照」または「フリーテキスト名」のいずれか一方を保持する（dives × users / フリーテキストの多対多を 1NF で正規化）。

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|-------|----|------|----------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 主キー |
| `dive_id` | `uuid` | NO | — | 対象ダイブログ。`dives(id)` 参照・`on delete cascade` |
| `buddy_user_id` | `uuid` | YES | — | 登録ユーザーのバディ。`users(id)` 参照・`on delete set null`（退会時はフリーテキスト名へフォールバック） |
| `buddy_name` | `text` | YES | — | フリーテキスト名（未登録者 or 退会フォールバック）。1〜100 文字 |
| `removed_by_buddy` | `boolean` | NO | `false` | タグ付けされた本人が自分のタグを除去したか（FR-024a/b） |
| `created_at` | `timestamptz` | NO | `now()` | 作成日時 |

### 制約

| 種別 | 内容 |
|------|------|
| 主キー | `dive_log_buddies_pkey (id)` |
| 外部キー | `dive_log_buddies_dive_id_fkey`: `dive_id` → `dives(id)` `on delete cascade` |
| 外部キー | `dive_log_buddies_buddy_user_id_fkey`: `buddy_user_id` → `users(id)` `on delete set null` |
| CHECK | `dive_log_buddies_target_check`: 登録ユーザー or フリーテキストのいずれか一方のみ（後述） |
| CHECK | `dive_log_buddies_name_len_check`: `buddy_name` は trim 後 1〜100 文字 |
| 部分ユニーク | `dive_log_buddies_dive_user_key (dive_id, buddy_user_id) where buddy_user_id is not null`（同一ログに同一登録ユーザーを重複タグ不可・再タグ付けブロック FR-024b） |

退会フォールバック補足: `on delete set null` で `buddy_user_id` が NULL になると `target_check` を満たさなくなり得るため、退会処理は「`buddy_user_id` を NULL にし `buddy_name` に当時の nickname を補完する」トリガで整合を保つ（下記 `handle_buddy_user_deleted`）。

### インデックス

```sql
create index idx_dive_log_buddies_dive_id on public.dive_log_buddies (dive_id);
create index idx_dive_log_buddies_buddy_user_id on public.dive_log_buddies (buddy_user_id);
```

### DDL（マイグレーション `20260630100000_create_dive_log_buddies.sql`）

```sql
create table public.dive_log_buddies (
    id uuid primary key default gen_random_uuid(),
    dive_id uuid not null references public.dives(id) on delete cascade,
    buddy_user_id uuid references public.users(id) on delete set null,
    buddy_name text,
    removed_by_buddy boolean not null default false,
    created_at timestamptz not null default now(),
    constraint dive_log_buddies_target_check check (
        (buddy_user_id is not null and buddy_name is null)
        or (buddy_user_id is null and buddy_name is not null)
    ),
    constraint dive_log_buddies_name_len_check check (
        buddy_name is null or (length(trim(buddy_name)) between 1 and 100)
    )
);

create unique index dive_log_buddies_dive_user_key
    on public.dive_log_buddies (dive_id, buddy_user_id)
    where buddy_user_id is not null;

create index idx_dive_log_buddies_dive_id on public.dive_log_buddies (dive_id);
create index idx_dive_log_buddies_buddy_user_id on public.dive_log_buddies (buddy_user_id);

comment on table public.dive_log_buddies is 'ダイブログの同行バディ。登録ユーザー参照またはフリーテキスト名のいずれか一方を保持';
comment on column public.dive_log_buddies.removed_by_buddy is 'タグ付けされた本人が自分のタグを除去したか。true の行は表示せず、所有者も削除不可（再タグ付けブロック）';

-- 自己バディ防止トリガ（buddy_user_id = ログ所有者を禁止）
create or replace function public.prevent_self_buddy()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.buddy_user_id is not null
       and new.buddy_user_id = (select d.user_id from public.dives d where d.id = new.dive_id) then
        raise exception 'cannot tag the dive owner as a buddy';
    end if;
    return new;
end;
$$;

create trigger dive_log_buddies_prevent_self_buddy
    before insert or update on public.dive_log_buddies
    for each row execute function public.prevent_self_buddy();

alter table public.dive_log_buddies enable row level security;

-- SELECT: 親 dive が閲覧可能（所有者 or 公開）、または自分宛タグ（本人による管理用）
create policy "read buddies of viewable dives"
    on public.dive_log_buddies for select
    using (
        exists (
            select 1 from public.dives d
            where d.id = dive_id
              and (d.user_id = (select auth.uid()) or d.is_public = true)
        )
        or buddy_user_id = (select auth.uid())
    );

-- INSERT: dive 所有者のみ
create policy "dive owner can add buddies"
    on public.dive_log_buddies for insert
    with check (
        exists (
            select 1 from public.dives d
            where d.id = dive_id and d.user_id = (select auth.uid())
        )
    );

-- UPDATE: タグ付けされた本人が自分宛タグを除去（removed_by_buddy 更新）
create policy "buddy can opt out own tag"
    on public.dive_log_buddies for update
    using (buddy_user_id = (select auth.uid()))
    with check (buddy_user_id = (select auth.uid()));

-- DELETE: dive 所有者のみ、かつ本人除去済みでない行
create policy "dive owner can delete non-optout buddies"
    on public.dive_log_buddies for delete
    using (
        removed_by_buddy = false
        and exists (
            select 1 from public.dives d
            where d.id = dive_id and d.user_id = (select auth.uid())
        )
    );
```

> 退会フォールバックトリガ `handle_buddy_user_deleted` は data-model 内の補助。実装時に `users` 削除前トリガ、または `dive_log_buddies` の `buddy_user_id` set null と同時に nickname を `buddy_name` へ退避する形で追加する（タスクで詳細化）。

## 2. 新規テーブル `public.user_follows`

「フォローする人 → フォローされる人」の自己参照的な多対多関係。承認不要の一方向フォロー（FR-012）。

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|-------|----|------|----------|------|
| `follower_id` | `uuid` | NO | — | フォローする人。`users(id)` 参照・`on delete cascade` |
| `followee_id` | `uuid` | NO | — | フォローされる人。`users(id)` 参照・`on delete cascade` |
| `created_at` | `timestamptz` | NO | `now()` | フォロー日時 |

### 制約

| 種別 | 内容 |
|------|------|
| 主キー | `user_follows_pkey (follower_id, followee_id)`（重複フォロー不可） |
| 外部キー | `user_follows_follower_id_fkey`: `follower_id` → `users(id)` `on delete cascade` |
| 外部キー | `user_follows_followee_id_fkey`: `followee_id` → `users(id)` `on delete cascade` |
| CHECK | `user_follows_no_self_check`: `follower_id <> followee_id`（自己フォロー不可） |

### インデックス

```sql
-- PK (follower_id, followee_id) が「自分のフォロー一覧」前方一致に効く。
-- 「自分のフォロワー一覧」用に followee_id 単独 index を追加。
create index idx_user_follows_followee_id on public.user_follows (followee_id);
```

### DDL（マイグレーション `20260630100100_create_user_follows.sql`）

```sql
create table public.user_follows (
    follower_id uuid not null references public.users(id) on delete cascade,
    followee_id uuid not null references public.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, followee_id),
    constraint user_follows_no_self_check check (follower_id <> followee_id)
);

create index idx_user_follows_followee_id on public.user_follows (followee_id);

comment on table public.user_follows is '承認不要の一方向フォロー関係。follower が followee をフォロー';

alter table public.user_follows enable row level security;

-- SELECT: 認証ユーザーはフォロー関係を閲覧可（件数・一覧表示に必要）
create policy "authenticated can read follows"
    on public.user_follows for select
    to authenticated
    using (true);

-- INSERT: 自分が follower の関係のみ作成可
create policy "users can follow as themselves"
    on public.user_follows for insert
    with check (follower_id = (select auth.uid()));

-- DELETE: 自分が follower の関係のみ解除可
create policy "users can unfollow own follows"
    on public.user_follows for delete
    using (follower_id = (select auth.uid()));
```

## 3. 既存 `public.dives` への追加（`20260630100200_add_dives_public_read_policy.sql`）

スキーマ（カラム）変更はなし。RLS に公開読み取りを追加し、タイムライン用の部分 index を追加する。

```sql
-- 公開ログは認証ユーザーが閲覧可（既存の本人 4 ポリシーは維持）
create policy "authenticated can read public dives"
    on public.dives for select
    to authenticated
    using (is_public = true);

-- タイムライン / 公開ログ一覧（is_public かつ user_id 絞り込み、dive_date 降順）の高速化
create index idx_dives_public_user_date
    on public.dives (user_id, dive_date desc, id desc)
    where is_public = true;
```

> 注意: SELECT は複数ポリシーが OR 結合される。本人ポリシー（`auth.uid() = user_id`）と公開ポリシー（`is_public = true`）の和が閲覧可能集合となり、非公開かつ他人のログは引き続き不可視（SC-002）。

## 4. 匿名共有用関数（`20260630100300_create_get_public_dive_fn.sql`）

未ログインの共有ページ用に、公開ログ 1 件のみを slug で返す。テーブル RLS を anon に広げない（R2）。

```sql
create or replace function public.get_public_dive(p_slug text)
returns table (
    id uuid,
    dive_date date,
    location text,
    max_depth_m numeric,
    bottom_time_min integer,
    notes text,
    owner_nickname text
)
language sql
security definer
set search_path = ''
stable
as $$
    select d.id, d.dive_date, d.location, d.max_depth_m, d.bottom_time_min, d.notes,
           ud.nickname as owner_nickname
    from public.dives d
    join public.user_details ud on ud.user_id = d.user_id
    where d.public_slug = p_slug
      and d.is_public = true;
$$;

revoke all on function public.get_public_dive(text) from public;
grant execute on function public.get_public_dive(text) to anon, authenticated;

comment on function public.get_public_dive(text) is '公開ログ 1 件を slug で返す（is_public=true のみ）。匿名共有ページ用';
```

> 返却列は共有ページに必要な最小限。バディ／写真など追加情報が必要になればタスクで列を拡張する。

## 4b. ユーザー表示名の公開関数（`20260630100400_create_get_user_public_profiles_fn.sql`）

`user_details` は本人のみ SELECT 可（PII: 生年月日・性別・身長体重を含む）。一方、ソーシャル表示（バディ一覧・プロフィール・タイムライン・フォロー一覧）では**他ユーザーの nickname のみ**が必要。そこで nickname だけを返す関数を用意し、PII を晒さずに表示名を解決する。

```sql
create or replace function public.get_user_public_profiles(p_ids uuid[])
returns table (user_id uuid, nickname text)
language sql
security definer
set search_path = ''
stable
as $$
    select ud.user_id, ud.nickname
    from public.user_details ud
    where ud.user_id = any(p_ids);
$$;

revoke all on function public.get_user_public_profiles(uuid[]) from public;
grant execute on function public.get_user_public_profiles(uuid[]) to authenticated;
```

> 実装時に判明したギャップ（US1 のバディ表示で他ユーザー nickname が RLS で読めない）への対応。US1/US3/US4 の表示名解決で共用する。registered なバディ/フォロー/タイムラインの nickname はすべてこの関数経由で取得する。

## 5. アプリ層の型・表示モデル（service-front）

| 表示モデル | 由来 | 主フィールド |
|---|---|---|
| `DiveBuddy` | `dive_log_buddies` | `id` / `userId?`（登録）/ `name`（表示名：nickname or freetext）/ `isRegistered` |
| `FollowState` | `user_follows` 集約 | `isFollowing` / `followerCount` / `followingCount` |
| `TimelineItem` | `dives`(public) + owner | `diveId` / `diveDate` / `location` / `maxDepthM` / `ownerId` / `ownerNickname` |
| `PublicProfile` | `users`/`user_details` + 集約 | `userId` / `nickname` / `followState` / 公開ログ一覧 |

snake_case 行 → camelCase 変換は各 feature の `lib/mappers` で行う（既存 `dive-mapper.ts` と同方針）。numeric は `toNumber`（`@/shared/lib/number`）で正規化。

## 6. エンティティ関係（ER 概要）

```text
users (1) ───< dives (1) ───< dive_log_buddies >─── (0..1) users
  │                                   （buddy_user_id, nullable）
  │
  ├──< user_follows (follower_id)
  └──< user_follows (followee_id)
```

- `dives` 1:N `dive_log_buddies`（cascade）
- `users` 0..1 : N `dive_log_buddies`（buddy_user_id, set null）
- `users` 自己参照 M:N（`user_follows`）
- タイムラインは実テーブルなし（`user_follows` × 公開 `dives` の導出）
