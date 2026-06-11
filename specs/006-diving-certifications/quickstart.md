# Quickstart: ダイビングライセンス保有資格管理の動作検証

実装完了後に機能が end-to-end で動くことを確認する手順。詳細なスキーマは [data-model.md](data-model.md)、要件は [spec.md](spec.md) を参照。

## 前提

- ルートで `make supabase-seed` 済み（`supabase/.env.local` にテストユーザー定義あり）
- Supabase ローカル環境が起動済み（`supabase start`）

## セットアップ

```bash
# マイグレーション適用（certifications テーブル作成）
make supabase-migration-up

# フロント開発サーバー起動
make front-dev
```

## 自動テスト

```bash
# スキーマ・保有期間計算・コンポーネント単体テスト
make front-test

# 型チェック・lint を含む全チェック
make front-validate
```

期待結果: `certification.schema.test.ts` / `heldPeriod.test.ts` / 各コンポーネントの `*.test.tsx` がすべてグリーン。

## 手動検証シナリオ

テストユーザーでログインして `/settings/certifications` を開く。

### 1. 登録（User Story 1 / P1）

1. 未登録状態で一覧を開く → 「資格が未登録」の案内と登録導線が表示される
2. 新規登録で「PADI / Open Water Diver / 3 年前の日付」を登録 → 一覧に表示される
3. もう 1 件「PADI / Advanced Open Water Diver / 1 年前の日付」を登録 → 取得日の新しい順（AOW が上）で 2 件表示される
4. 取得日に未来日付を入力 → エラーメッセージが表示され登録されない
5. 同じ「PADI / Open Water Diver」を再登録 → 重複エラーが表示される

### 2. 保有期間表示（User Story 2 / P2)

1. 一覧の各資格に「保有期間 ○年○ヶ月」が表示される（3 年前取得 → 3年○ヶ月）
2. 取得日が当日の資格を登録 → 「0ヶ月」相当の表示になる（マイナス・空欄にならない）

### 3. 編集・削除（User Story 3 / P3）

1. 資格の取得日を変更して保存 → 一覧に新しい取得日と再計算された保有期間が反映される
2. 削除ボタンを押す → 確認ダイアログが出る。キャンセルで削除されない
3. 確認して削除 → 一覧から消える

### 4. セキュリティ（FR-009）

```bash
# 別ユーザーの資格が読めないことを RLS で確認（Supabase Studio の SQL Editor などで）
# anon キー + ユーザー A のトークンで certifications を select し、
# ユーザー B の行が返らないことを確認する
```

### 5. アクセシビリティ

```bash
make front-test-a11y
```

期待結果: 一覧・新規・編集の各画面で axe-core 違反 0 件。フォームエラーが `role="alert"` で通知される。
