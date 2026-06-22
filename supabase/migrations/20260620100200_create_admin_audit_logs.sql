-- ========================================
-- admin_audit_logs テーブル（操作ログ / 監査）
-- 管理画面で行われた全データ変更の記録。追記専用（更新・削除不可）。
-- 仕様: specs/015-admin-panel/data-model.md（FR-018 / US5）
-- ========================================

create table public.admin_audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid not null references public.admin_users(id) on delete restrict,
    action text not null check (action in ('create', 'update', 'soft_delete', 'hard_delete', 'restore')),
    target_table text not null check (char_length(target_table) <= 63),
    target_id text not null,
    -- 変更差分の要約（before/after）。機微情報は最小限に
    changes jsonb,
    created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is '管理画面で行われた全データ変更の監査記録。追記専用で改変・削除不可';
comment on column public.admin_audit_logs.actor_id is '操作を実行した管理者。監査対象のため on delete restrict（物理削除させない）';
comment on column public.admin_audit_logs.action is '操作種別。create / update / soft_delete / hard_delete / restore';
comment on column public.admin_audit_logs.target_table is '対象テーブル名';
comment on column public.admin_audit_logs.target_id is '対象レコードの主キー（複合主キーは文字列化で許容）';
comment on column public.admin_audit_logs.changes is '変更差分の要約（before/after）。個人情報・パスワード等は記録しない';

-- 一覧（時系列）・対象別・実行者別の参照用
create index idx_admin_audit_logs_created_at on public.admin_audit_logs (created_at desc);
create index idx_admin_audit_logs_target on public.admin_audit_logs (target_table, target_id);
create index idx_admin_audit_logs_actor_id on public.admin_audit_logs (actor_id);

alter table public.admin_audit_logs enable row level security;

-- 管理者は監査ログを参照できる
create policy "admins read audit logs"
    on public.admin_audit_logs for select
    to authenticated
    using ((select public.is_admin()));

-- 管理者は自分を actor とする監査ログのみ追記できる
-- update / delete のポリシーは設けない（= default deny）。これにより改変・削除不可（追記専用）。
create policy "admins insert audit logs"
    on public.admin_audit_logs for insert
    to authenticated
    with check ((select public.is_admin()) and actor_id = (select auth.uid()));
