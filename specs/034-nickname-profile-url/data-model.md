# Data Model: プロフィール URL のニックネーム化（034-nickname-profile-url）

**テーブルの追加・変更はなし**。ニックネームの一意性・正規化は導入済みの式インデックスに依拠する。

## 既存資産（依拠するもの・変更しない）

| 対象 | 内容 |
|---|---|
| `user_details.nickname` | `text not null check (length(trim(nickname)) > 0)`。表示用ニックネーム |
| `user_details_nickname_key` | `create unique index ... on public.user_details (lower(trim(nickname)))`（021 で導入）。一意性と照合の正規化基準 |
| `is_nickname_taken` RPC | 登録・変更時の重複チェック（既存） |
| `get_user_public_profiles` RPC | uuid → 公開プロフィール（nickname 含む）の解決（既存）。ID 形式 URL の転送先ニックネーム取得に利用 |

## get_user_id_by_nickname（新規 RPC）

マイグレーション: `supabase/migrations/<ts>_create_get_user_id_by_nickname_fn.sql`

```sql
-- ニックネーム → user_id の解決（034 / FR-001・FR-002）。
-- 照合は一意インデックス user_details_nickname_key と同じ正規化（lower(trim())）で行い、
-- インデックスを利用する。user_details の RLS（本人のみ read）を越えるため security definer とし、
-- 返すのは user_id のみ（nickname は URL として既に公開情報のため漏えいの拡大はない）。
create or replace function public.get_user_id_by_nickname(p_nickname text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select user_id
    from public.user_details
    where lower(trim(nickname)) = lower(trim(p_nickname))
    limit 1;
$$;

comment on function public.get_user_id_by_nickname(text) is
    'プロフィール URL のニックネーム解決（034）。一意インデックスと同じ正規化で照合し user_id を返す';

-- 既定で PUBLIC に付与される EXECUTE を剥奪してから authenticated のみに付与する
revoke all on function public.get_user_id_by_nickname(text) from public;
grant execute on function public.get_user_id_by_nickname(text) to authenticated;
```

- **戻り値**: 該当ユーザーの `user_id`。不在時は null（呼び出し側で `notFound()`）
- **anon に grant しない**: プロフィールページは認証必須（proxy の `/users` ガード）のため

## アプリ側の定数（DB 外・profile-path モジュールで一元管理）

| 定数 | 値 | 用途 |
|---|---|---|
| `RESERVED_USER_SEGMENTS` | `['search']` | `/users/` 配下の予約パス。ニックネーム登録拒否（FR-006）と URL 安全判定（FR-005）で共用 |
| 禁止文字 | `/ ? # % \` + 制御文字 | URL 判別・エンコードを壊す文字。登録拒否と URL 安全判定で共用 |
| uuid 判別パターン | `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i` | slug の ID / ニックネーム判別（Decision 1）と登録拒否（FR-006） |

## 状態遷移

なし（データの追加・変更を伴わない。ニックネーム変更は既存機能のまま）。
