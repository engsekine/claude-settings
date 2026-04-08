# 個人設定（全プロジェクト共通）

## 言語・コミュニケーション
- 日本語で回答する
- 技術的なコードコメントも日本語
- 説明は「なぜ」→「どうやるか」の順番で

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

## コード規約

プロジェクトのコーディング規約は `rules/coding/` を参照してください。

| ファイル | 内容 |
|---------|------|
| `rules/coding/react.md` | React コーディング規約 |
| `rules/coding/typescript.md` | TypeScript コーディング規約 |
| `rules/coding/html.md` | HTML コーディング規約 |
| `rules/coding/css.md` | CSS コーディング規約 |
| `rules/coding/php.md` | PHP コーディング規約 |
| `rules/coding/accessibility.md` | アクセシビリティ コーディング規約（WCAG 2.1 AA準拠） |
| `rules/coding/naming.md` | リーダブルコード - 命名規則と要点整理 |
| `rules/coding/skills.md` | 修正履歴から学んだスキル集 |


## 利用可能なコマンド

### チェック系
| コマンド | 説明 |
|---------|------|
| `/review [ベースブランチ]` | 変更差分の総合チェック（typo → 表記ゆれ → 影響範囲 → 共通化） |
| `/check:commonize` | 変更差分に含まれる共通化できそうなコードをチェックする |

### 修正系
| コマンド | 説明 |
|---------|------|
| `/fix:code-fix [ファイル]` | コード規約に基づいてコードを修正する |
| `/fix:update [ブランチ]` | パッケージバージョンをアップデートする |

### 生成系
| コマンド | 説明 |
|---------|------|
| `/generate:markup <画像> <ファイル>` | スクリーンショットをもとにマークアップする |
| `/generate:summary` | PRディスクリプションを生成する |
| `/generate:capture` | 現在開いているページをスクリーンショット撮影 |
