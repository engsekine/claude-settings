# 個人設定（全プロジェクト共通）

## 言語・コミュニケーション
- 日本語で回答する
- 技術的なコードコメントも日本語
- 説明は「なぜ」→「どうやるか」の順番で
- ユーザーの入力が `?` で終わる場合は質問として扱い、ファイルの変更（Edit/Write）を行わず回答のみ返す

## コミットメッセージ規約
- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメントのみ
- `refactor:` リファクタリング（機能変更なし）
- `test:` テストの追加・修正
- `chore:` ビルド設定・依存パッケージ更新

## 好みのスタイル
- TypeScript strict mode
- async/awaitのみ
- 関数型スタイル優先（副作用は明示的に）
- テストはVitestまたはpytest

## 作業前の確認事項
変更を始める前に必ず:
1. 現状を把握する（既存コードを読む）
2. 計画を立ててから実装する
3. テストを書いてから実装コードを変更する

## フレームワーク・ライブラリの公式ドキュメント参照

実装時は必ず最新の公式ドキュメントを参照すること。

### Next.js
- 実装前に [Next.js公式ドキュメント](https://nextjs.org/docs) を参照する
- App Router を使用する
- Server Components をデフォルトとし、Client Components は `'use client'` で明示的に指定する
- データフェッチは Server Components で行う
- 動的ルーティング、ミドルウェア、APIルートの実装時も公式ドキュメントに従う

## プロジェクト仕様

仕様書は `docs/` 配下。実装着手前に該当機能の `requirements.md` / `design.md` / `tasks.md` を必ず確認すること。詳細な運用ルールは [docs/README.md](../docs/README.md) を参照。

## コード規約

プロジェクトのコーディング規約は `rules/` を参照してください。

| ファイル | 内容 |
|---------|------|
| `rules/react.md` | React コーディング規約 |
| `rules/typescript.md` | TypeScript コーディング規約 |
| `rules/html.md` | HTML コーディング規約 |
| `rules/css.md` | CSS コーディング規約 |
| `rules/php.md` | PHP コーディング規約 |
| `rules/sql.md` | SQL コーディング規約 |
| `rules/accessibility.md` | アクセシビリティ コーディング規約（WCAG 2.1 AA準拠） |
| `rules/readable-code.md` | リーダブルコード - 命名規則と要点整理 |


## 利用可能なスキル

| スキル | 説明 |
|---------|------|
| `/review [ベースブランチ]` | 変更差分の総合チェック（typo・表記ゆれ・影響範囲・共通化） |
| `/check-typo` | 変更差分に含まれるタイポ・不要な文字変更をチェックする |
| `/check-diff-impact` | 変更差分の影響を受けるURLを特定する |
| `/code-fix [ファイル]` | コード規約に基づいてコードを修正する |
| `/summary` | PRディスクリプションを生成する |
| `/suggest-commit` | 変更差分からコミット名を提案する |
| `/reply-review <コメント>` | レビューコメントへの返信ドラフトを生成する |
| `/empirical-prompt-tuning` | プロンプトやskillを実行・評価し反復改善する |
