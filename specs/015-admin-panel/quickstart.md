# Quickstart: 運営管理画面（admin-front）検証ガイド

admin-front が機能要件を満たすことを end-to-end で確認するための実行・検証手順。実装詳細は [plan.md](./plan.md) / [data-model.md](./data-model.md) / [contracts/](./contracts/) を参照（ここでは重複させない）。

## 前提

- モノレポルートで依存インストール済み（`npm install`、workspaces に `admin-front` 登録済み）。
- ローカル Supabase 起動済み（`supabase start`）。
- 本機能のマイグレーション適用済み（`admin_users` / `admin_audit_logs` / `deleted_at` / admin RLS ポリシー）。
- 初期管理者を `seed.sql` または手動で投入済み（`auth.users` に 1 件 + `public.admin_users` に対応行 `role='superadmin'`）。
- admin-front の環境変数: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`（service-front と同一プロジェクト）、admin 専用 Cookie 名（例 `sb-divelog-admin-auth-token`）。

## 起動

```bash
# admin-front を別ポートで起動（service-front: 3000 / admin-front: 3001 想定）
npm run dev -w admin-front   # 例: next dev -p 3001
```

- service-front（`npm run dev -w service-front`）と同時起動し、両アプリが同一 Supabase を参照することを確認。

## 検証シナリオ

### S1. 認証・権限境界（US1 / SC-001）

1. 未ログインで `http://localhost:3001/users` にアクセス → `/login` にリダイレクトされる。
2. **一般利用者**（`admin_users` に行がないアカウント）でログイン試行 → 拒否され、`(admin)` 配下に入れない。
3. **管理者**でログイン → ダッシュボード（`/`）に遷移。
4. ログアウト → 再度 `(admin)` URL にアクセスすると `/login` に戻る。
5. 期待: 全 `(admin)` URL・全データ操作で非管理者が到達できる経路が 0 件。

### S2. 一覧・検索・詳細（US2 / FR-006〜009）

1. サイドバーで「ユーザー」を選択 → 一覧がページング表示され主要項目が見える。
2. キーワード検索 → 一致レコードのみ表示、件数が分かる。
3. 1 件の詳細を開く → 全項目 + 関連サマリ（ダイブログ件数等）が表示。
4. 該当 0 件の検索 → 「データがありません」が表示されレイアウトが崩れない。

### S3. 作成・編集・削除（US3 / FR-010〜016）

ダイブサイト（マスタ）で一連を検証:

1. 新規作成フォームで必須項目を入力 → 作成され一覧に出現。
2. 編集して保存 → 一覧・詳細に反映。
3. 必須未入力 / 文字数超過で保存 → 保存されず不正項目が示される。
4. 削除（ソフトデリート）→ `ConfirmDialog` を経て一覧から除外。復元 → 復帰。
5. 他データから参照されているサイトの物理削除 → 削除がブロックされ、参照件数が提示される。
6. service-front 側で当該ソフトデリート済みデータが**利用者に表示されない**ことを確認（クロスアプリ影響）。

### S4. ダッシュボード（US4 / FR / SC）

1. ダッシュボードに登録ユーザー数・ダイブログ総数など主要 KPI が数値表示。
2. 指標カードを選択 → 対応一覧に遷移。

### S5. 監査ログ（US5 / FR-018）

1. S3 の各操作後、操作ログ一覧に「実行者・対象・操作種別・日時」が時系列で記録される。
2. 監査ログの更新・削除が拒否される（RLS）。

## 自動テストでの検証

```bash
# admin-front の単体・story・a11y / E2E
npm run test        -w admin-front   # Vitest（権限ガード・検証・監査記録ロジック）
npm run test:storybook -w admin-front
npm run test:a11y   -w admin-front   # Playwright + axe-core（WCAG 2.1 AA）
npm run test:e2e    -w admin-front   # S1〜S5 のシナリオ

# RLS 単体: 非管理者セッションで管理対象テーブルへの read/write が拒否/0 件
# service-front 回帰: ソフトデリート済みが利用者側に出ない
npm run test -w service-front
```

## 成功判定（spec Success Criteria 対応）

| 検証 | 対応 SC |
|---|---|
| S1 で非管理者の到達経路 0 件 | SC-001 |
| S2 でメニュー→検索→詳細が 30 秒以内 | SC-002 |
| S3 を初回・マニュアルなしで完了 | SC-003 |
| S2/S3 が数万件規模で約 2 秒以内 | SC-004 |
| S3-6 で利用者表示と整合・不整合 0 件 | SC-005 |
| S3-4/5 で破壊的操作前に確認表示 | SC-006 |
