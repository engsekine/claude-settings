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

## アーキテクチャガイドライン（明示的に指定した場合のみ参照）

アーキテクチャドキュメントは `arch/` に配置されていますが、**デフォルトでは参照しません**。
必要な場合は、プロジェクトの `.claude/CLAUDE.md` で以下のように明示的に指定してください。

### 参照の優先順位

1. **プロジェクトローカル**: `.claude/arch/` (存在する場合)
2. **グローバル設定**: `~/.claude/arch/` (symlink元)

プロジェクト固有のアーキテクチャがある場合は、プロジェクトの `.claude/arch/` が優先されます。

### 利用可能なアーキテクチャ

#### フロントエンド

| ファイル | 内容 | 適用対象 |
|---------|------|---------|
| `arch/frontend/feature-based.md` | Feature-based + shared/ アーキテクチャ | React/Next.js プロジェクト |
| `arch/frontend/atomic-design.md` | Atomic Design パターン | コンポーネント設計重視のプロジェクト |
| `arch/frontend/bulletproof-react.md` | Bulletproof React パターン | 大規模Reactアプリ |

#### バックエンド

| ファイル | 内容 | 適用対象 |
|---------|------|---------|
| `arch/backend/clean-architecture.md` | Clean Architecture | ドメイン駆動設計のプロジェクト |
| `arch/backend/ddd.md` | Domain-Driven Design | 複雑なビジネスロジック |
| `arch/backend/layered.md` | レイヤードアーキテクチャ | MVC/Controller-Service-Repository |

#### フルスタック

| ファイル | 内容 | 適用対象 |
|---------|------|---------|
| `arch/fullstack/monorepo.md` | Monorepo構成(Turborepo/nx) | FE/BE統合プロジェクト |
| `arch/fullstack/micro-frontend.md` | Micro Frontend | 大規模分散フロントエンド |

### 適用例

#### フロントエンドプロジェクト

```markdown
## プロジェクト固有の設定

- このプロジェクトは `arch/frontend/feature-based.md` に記載された Feature-based アーキテクチャに従う
```

#### バックエンドプロジェクト

```markdown
## プロジェクト固有の設定

- このプロジェクトは `arch/backend/clean-architecture.md` に記載された Clean Architecture に従う
```

#### フルスタックプロジェクト

```markdown
## プロジェクト固有の設定

- フロントエンド: `arch/frontend/feature-based.md`
- バックエンド: `arch/backend/layered.md`
- Monorepo構成: `arch/fullstack/monorepo.md`
```

### プロジェクト側での設定

プロジェクト側で `.claude/arch/` を使う場合は、以下を `.gitignore` に追加:

```gitignore
# アーキテクチャドキュメントはプロジェクト固有
.claude/arch/
```

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
