# Phase 0 Research: 運営管理画面（admin-front）

spec.md の NEEDS CLARIFICATION とアーキテクチャ上の不確実性を解決する。各項目は Decision / Rationale / Alternatives の形式で記録する。

## R1. 管理者アカウントの識別方式（FR-005）

**Decision**: 利用者プロフィール（`public.users` / `user_details`）とは分離した専用テーブル `public.admin_users`（`id uuid references auth.users(id)`）で管理者を識別する。認証は同一 Supabase Auth（`auth.users`）を用い、`admin_users` への登録有無で管理者か判定する。

**Rationale**:
- ユーザー回答で「専用の管理者アカウント体系（利用者セッションと完全分離）」を選択。
- 別 Supabase プロジェクトは spec の Assumptions（同一プロジェクトで利用者データを操作）と矛盾するため不採用。同一 Auth + 別テーブルが「分離」と「同一データ操作」を両立する現実解。
- `auth.users` を共有すれば `auth.uid()` がそのまま使え、RLS（R2）の判定基盤になる。
- 利用者向け `public.users` にロール列を足す案より、管理者識別子を独立エンティティに切り出すほうが責務が明確（3NF・マスタ/取引分離の方針に沿う）。

**Alternatives considered**:
- (A) `public.users.is_admin` フラグ: 最小実装だが「専用体系」要件を満たさず、利用者テーブルに運営概念が混ざる。
- (C) Supabase Studio のみ運用: 管理画面を作らない選択で本 spec の主目的に反する。

**セッション分離**: admin-front は service-front と**別の認証 Cookie 名**（例: `sb-divelog-admin-auth-token`）を使う。同一 Supabase プロジェクト・同一ホスト（localhost）では Cookie 名が同じだとポートを越えて共有され、利用者セッションが admin-front に流れ込むため。`@repo/supabase` の Cookie 名は現状ハードコード定数（`AUTH_COOKIE_NAME`）なので、クライアント生成時に Cookie 名を受け取れるよう小改修する。

## R2. 全ユーザーデータへのアクセス権限（Constitution IV）

**Decision**: `public.is_admin()`（security definer, `set search_path = ''`）を判定基準とする **admin 専用 RLS ポリシー**を各管理対象テーブルに追加する。admin-front も anon key + 管理者セッションで接続し、RLS を防御層として維持する。service role キーによる全面バイパスは採らない。

```sql
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.admin_users a
    where a.id = (select auth.uid()) and a.deleted_at is null
  );
$$;

-- 各管理対象テーブルに追加（例: dives）
create policy "admins manage all dives"
  on public.dives for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
```

**Rationale**:
- ユーザー回答で「is_admin ベースの RLS ポリシー追加」を選択。
- Constitution IV「Security & RLS by Default」に最も整合。`is_admin()` の判定ミスがあってもポリシー全体が deny 側に倒れる（fail-safe）。
- service role はクライアントに 1 度でも漏れると全 RLS を無効化できるため、運用リスクが大きい。
- `auth` 関数はサブクエリに包む（`(select auth.uid())` / `(select public.is_admin())`）— sql.md の `auth_rls_initplan` 対策。
- 既存の「本人のみ」ポリシーは残し、admin ポリシーを**追加**する（OR 評価で本人 or 管理者がアクセス可能）。

**Alternatives considered**:
- service role + アプリ層ゲート: 実装は単純だが鍵漏洩時の被害が甚大。Constitution IV の精神に反する。

## R3. 管理対象スコープ（FR-017）

**Decision**: 主要エンティティは用途特化画面、それ以外は汎用テーブルエディタの**併用**。

- **特化画面（MVP）**: `users`（+ `user_details` 関連表示）, `dives`, `dive_sites`
- **汎用テーブルエディタ**: 上記以外（`certifications`, `certification_tags`, `dive_plans`, `plan_packing_items`, `regulators`, `dive_photos` 等）。テーブル定義（カラム・型・制約）をメタ情報として受け取り、一覧 + 編集フォームを動的生成する。

**Rationale**:
- ユーザー回答で「特化＋汎用の併用」を選択。WordPress 的体裁（FR-019）とも親和。
- 運営頻度が高く関連データ表示が要る主要 3 種は特化で UX を作り込み、低頻度のマスタ類は汎用で網羅する。

**Alternatives considered**:
- 全特化: 全テーブル分の画面実装は MVP には重い。
- 全汎用: 関連データ（ユーザー↔ダイブログ件数等）や安全な編集 UX を作りにくい。

**汎用エディタの安全装置**: 表示/編集可能なテーブル・カラムは**許可リスト**で限定（`auth` スキーマや内部用カラムは露出しない）。型は生成型 `Database['public']['Tables']` から導出し、入力検証はカラムの型・NOT NULL・CHECK を反映する（FR-012）。

## R4. 削除方針と操作ログ（FR-018 / US5）

**Decision**: 原則**ソフトデリート**（`deleted_at timestamptz`）。物理削除は汎用エディタの一部マスタなど限定的に確認付きで許可。全データ変更（create / update / soft-delete / hard-delete / restore）を **`admin_audit_logs`** に記録し、操作ログを必須とする。

**Rationale**:
- ユーザー回答で「ソフトデリート＋操作ログ必須」を選択。
- SC-006（取り消し不能操作の前に確認）・US5（監査）に整合。ソフトデリートなら誤削除の復旧が可能。
- 監査記録は admin Server Action 内で mutation と同一トランザクション的に書く（記録漏れ防止）。

**クロスアプリ影響**: `deleted_at` 導入により **service-front 側の既存クエリ・RLS が `deleted_at is null` を考慮**する必要がある。
- 方針: 各管理対象テーブルに `deleted_at` を追加し、service-front の利用者向け select は `is('deleted_at', null)` を付与（または利用者 RLS の `using` に `deleted_at is null` を追加）。tasks.md で対象クエリを列挙し回帰テストを付ける。

**Alternatives considered**:
- 物理削除のみ: 復旧不能で運営事故リスク。
- 監査ログ後続: US5 は P3 だが、利用者データ書き換えの監査性は初期から必要と判断（ユーザーも必須を選択）。

## R5. admin-front のアプリ構成・ルーティング

**Decision**: モノレポに `admin-front/` を新規 Next.js アプリ（dev ポート 3001 想定）として追加。service-front の Feature-based 構成をそのまま踏襲。ルートグループ `(auth)`（ログイン）/ `(admin)`（要管理者権限）で権限要件を表現。`proxy.ts`（middleware）で**未認証→ログイン誘導 / 認証済み非管理者→拒否**を一次ガードし、各 Server Action / queries でも `is_admin` を再チェックする（多層防御、SC-001）。

**Rationale**:
- ルート `package.json` の `workspaces` に既に `admin-front` が登録済み。意図された構成。
- service-front と同一スタック・規約を使うことで学習コスト・レビューコストを最小化（Constitution VI）。
- middleware 一次ガードのみだと API/Server Action 直叩きに弱いため、データ操作層でも再チェックする。

**Alternatives considered**:
- service-front 内に `/admin` ルートを同居: 「別ポート / 別アプリ」という要求（FR-001）に反し、バンドル・権限境界が曖昧になる。

## R6. WordPress 風 UI シェル

**Decision**: 左サイドバー（管理対象ナビ、`aria-current` で現在地）+ 上部ヘッダー（ログイン者・ログアウト）+ メイン領域（一覧テーブル / 詳細 / 編集フォーム）の 3 ペイン構成。一覧は共通 `DataTable`（サーバーページング・検索・並び替え・空状態）で統一。破壊的操作は `ConfirmDialog`（フォーカストラップ・Esc・`role="dialog"`）を必須通過。

**Rationale**: FR-019（学習コスト最小の WordPress 風）・FR-009（空状態）・FR-020（操作フィードバック）・Constitution V（a11y）を共通部品で一括担保。

**Alternatives considered**: 画面ごとに個別実装 → 一貫性・a11y 品質が崩れやすく非効率。

## R7. パフォーマンス（SC-004: 数万件で 2 秒以内）

**Decision**: サーバー側ページング（`range()` / count）+ 必要カラムのみ select + 検索/並び替えカラムにインデックス。一覧の総件数は `count: 'estimated'` 系を検討（厳密件数が不要な画面）。

**Rationale**: `select *` 回避・適切なインデックスは sql.md の方針通り。数万件規模の一覧で全件取得・クライアントフィルタは破綻するため、DB 側で絞る。

**Alternatives considered**: クライアントページング → スケールせず却下。
