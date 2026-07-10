# Quickstart: ダイビング申し込みシートのテキスト出力

**Feature**: [spec.md](./spec.md) | 検証対象の契約: [contracts/application-sheet-page.md](./contracts/application-sheet-page.md)

## 前提

- ルートで `npm install` 済み
- Supabase ローカル環境が起動済み（`npx supabase start`）で、マイグレーション適用済み（`npx supabase db reset`）
- テストユーザーでログインできる（プロフィール・資格・ダイブログ登録済みのユーザーと未登録ユーザーの 2 種を用意すると P2/エッジケースまで検証できる）

## 起動

```bash
npm run dev --workspace=service-front
# http://localhost:3000
```

## 検証シナリオ

### 1. P1: 入力 → 生成 → コピー

1. ログイン後 `http://localhost:3000/application-sheet` を開く
2. 未入力のままプレビューを確認 → 全項目が「（ ）」空欄の定型文で表示される（FR-005）
3. 各項目を入力するとプレビューに即時反映される（FR-004）
4. レンタル器材「有」→ 品目を選択すると該当行に ○ が付く（FR-003）
5. 「コピー」を押す → クリップボードに全文が入り、完了メッセージが表示される（FR-006）

### 2. P1: レンタル「無」とトグル（FR-011 / FR-012）

1. レンタル器材「無」を選択 → 品目・サイズ欄の入力が求められない
2. デフォルトでは品目一覧も空欄のまま全文出力される
3. 「未該当ブロックを省略する」トグルを ON → 品目一覧・サイズ欄が出力から消える

### 3. P2: 自動入力（FR-007〜009）

1. プロフィール・資格・ログ登録済みユーザーで画面を開く → 氏名・生年月日・年齢・性別・身長・体重・ランク・経験本数・最終ダイブ年月が自動入力されている
2. 自動入力値を修正 → 出力に修正後の値が反映される（FR-008）
3. 未登録ユーザーで開く → 該当項目は空欄でエラーにならない（FR-009）

### 4. P3: 保存と復元（FR-010）

1. 携帯電話・緊急連絡先などを入力して「保存」を押す
2. 画面を離れて再訪問 → 前回値が復元されている
3. レンタル品目の選択・省略トグルは復元されない（毎回リセット）

## 自動テスト

```bash
# 単体（buildSheetText・コンポーネント・Server Action）
cd service-front && npx vitest run --project unit src/features/application-sheet

# a11y（Playwright + axe）
npm run test:e2e --workspace=service-front -- tests/a11y/application-sheet.spec.ts

# 静的チェック
npx biome check .
```

## 期待結果サマリー

- 生成テキストが [出力テキスト契約](./contracts/application-sheet-page.md#出力テキスト契約fr-004--sc-002) の並び・体裁と一致する
- 未認証で `/application-sheet` にアクセスすると `/login` へリダイレクトされる
- axe 違反 0 件（WCAG 2.1 AA）
