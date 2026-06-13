# Quickstart: ブランク日数の表示の動作検証

実装完了後に機能が end-to-end で動くことを確認する手順。要件は [spec.md](spec.md)、設計は [plan.md](plan.md) を参照。

## 前提

- Supabase ローカル環境が起動済み（`supabase start`）、`make supabase-seed` 済み
- worktree 内で `npm install` 済み（`make front-*` は本体ツリーのコンテナで動くため、worktree では `npx` を直接使う）

## 自動テスト（worktree 内）

```bash
cd service-front
npx vitest run --project unit src/features/dashboard
npx vitest run --project storybook src/features/dashboard
npx tsc --noEmit
```

期待結果: `blankDays.test.ts` / `BlankDays.test.tsx` / 既存 dashboard テストがすべてグリーン。

## 手動検証シナリオ

テストユーザー（test@example.com / password123）でログインして TOP（`/`）を開く。

### 1. ブランク日数の表示（FR-001 / FR-002）

1. 45 日前の日付のダイブログを 1 件登録する → TOP のヒーローに「最後に潜ってから 45日」相当の表示が出る
2. さらに 10 日前のログを追加する → 表示が「10日」に更新される（最新日付基準。FR-006）

### 2. 境界値（FR-003 / FR-004）

1. 当日の日付でログを登録する → 「0日」と表示され、マイナスや空欄にならない
2. 全ログを削除する → ブランク日数は表示されず「まだダイブログがありません」の案内に戻る
3. 未来の日付でログを登録する → 「0日」と表示される（マイナスにならない）

### 3. アクセシビリティ

```bash
cd service-front
npx playwright test tests/a11y  # TOP を含む既存 a11y スキャン
```

期待結果: TOP で axe-core 違反 0 件。ブランク日数がスクリーンリーダーで一続きの文として読み上げられる。
