# Quickstart: CI/CD 整備（GitHub Actions）

実装後にワークフローが期待どおり動くことを検証する手順。設計は [plan.md](plan.md) を参照。

## 前提

- リポジトリが GitHub 上にあり、Actions が有効
- `gh` CLI でログイン済み（`gh auth status`）

## ローカルでの事前検証

```bash
# ワークフロー YAML の構文チェック（push 前）
gh workflow list 2>/dev/null || true
npx action-validator .github/workflows/ci.yml 2>/dev/null || echo 'actionlint があればそちらで: actionlint'

# CI が呼ぶコマンドがローカルで通ること（SC-003 の前提）
npm run check --workspace service-front
npm run lint:markup --workspace service-front
npm run type-check --workspace service-front
npm run test:coverage --workspace service-front
npx supabase db lint
```

## 検証シナリオ

### 1. グリーンな PR（US1 正常系）

1. 適当なブランチで空コミットを作り PR を作成 → `gh pr checks --watch`
2. `lint` / `markup-lint` / `type-check` / `unit-test` / `db-lint` の 5 チェックが全て成功する
3. 結果表示まで 10 分以内（SC-001）

### 2. 壊れた PR（US1 異常系 / SC-002）

1. 型エラーを 1 行入れて push → `type-check` のみ失敗、他は成功（独立判別 = FR-004 / FR-006）
2. 失敗ジョブのログから該当ファイル・行が特定できる
3. 修正 push → 失敗チェックが成功に変わる
4. 連続で 2 回 push → 1 回目の実行がキャンセルされる（FR-003 / SC-004。Actions 一覧で "Canceled" を確認）

### 3. 再実行（FR-009)

1. 失敗したジョブを GitHub UI（または `gh run rerun --failed`）から再実行できる

### 4. main マージ（US2 / US3）

1. PR をマージ → main で `ci.yml` が再実行される
2. `full-test.yml` が起動し、Supabase 起動 → シード → E2E / a11y、Storybook テストが完了する
3. 失敗時は `playwright-report` artifact がダウンロードできる

### 5. branch protection（手動設定）

`docs/ci.md` の手順に従い required checks を設定 → 壊れた PR のマージボタンが無効化されることを確認

## 期待結果サマリー

- 上記シナリオ全項目がパス
- リポジトリシークレットの登録ゼロのまま全ワークフローが動作（FR-008）
- `gh run list` で重複実行（同一 PR の並走）が発生していない
