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

## コンポーネント作成時のフォルダ構成

新しい React コンポーネントを作成するときは **必ず専用フォルダに配置**し、以下の構造に揃える。

```
<対象パス>/<ComponentName>/
├── <ComponentName>.tsx          ← コンポーネント本体
├── <ComponentName>.test.tsx     ← Vitest 単体テスト
├── <ComponentName>.stories.tsx  ← Storybook story
└── index.ts                     ← 再 export 専用
                                   例: export { ComponentName } from './ComponentName';
```

### 配置のルール

| 対象 | 配置例 |
|---|---|
| 汎用コンポーネント | `src/shared/components/<group>/<ComponentName>/...` |
| 機能固有コンポーネント | `src/features/<feature>/components/<ComponentName>/...` |
| Client コンポーネント | `src/features/<feature>/components/client/<ComponentName>/...` |
| Server コンポーネント | `src/features/<feature>/components/server/<ComponentName>/...` |

### import パスの方針

- **外部からは index.ts 経由で import**: `import { Foo } from '@/shared/components/Foo'`（中の `Foo/Foo.tsx` を直接指さない）
- **コンポーネント内部の sibling 参照は親ディレクトリ経由**: `import { Bar } from '../Bar'`（`./Bar` ではなく `../Bar` で隣のフォルダの index.ts を解決）
- **types / hooks / stores 等の上位参照**: フォルダ階層分の `..` を正確に。例えば `Foo/Foo.tsx` から `../../../types` で `features/<feature>/types/` に届く

### 既存コンポーネントの配置例

| パス | 構造 |
|---|---|
| `src/shared/components/layout/Header/` | Header.tsx + Header.test.tsx + Header.stories.tsx + index.ts |
| `src/shared/components/layout/Breadcrumbs/` | 同上 |
| `src/shared/components/layout/Footer/` | 同上 |
| `src/shared/components/form/FormField/` | 同上 |
| `src/features/dives/components/client/DiveSearchBar/` | 同上 |

新規作成・移動の際はこれらを参照モデルとする。

## テスト生成ルール

新しいコンポーネントを以下のパスに作成した直後は、必ず `/generate-with-tests <作成したファイルの絶対パス>` を実行してテスト類を並列生成すること。

- `src/shared/components/**/*.tsx`
- `src/features/*/components/**/*.tsx`

除外対象（テスト生成不要）：
- `*.test.tsx` / `*.stories.tsx` / `*.spec.tsx`（テスト・story ファイル自身）
- `index.ts` / `index.tsx`（re-export ファイル）
- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx`（Next.js 規約ファイル）

`PostToolUse` hook（`.claude/hooks/suggest-test-gen.sh`）が新規コンポーネント作成を検知してリマインダーを出すので、そのリマインダーが見えたら `/generate-with-tests` の実行を忘れずに。

## テスト同期ルール（既存コンポーネント編集時）

既存のコンポーネントを編集した場合、同階層に存在する以下のファイルを確認し、変更内容に合わせて **必ず同期更新する**:

- `<ComponentName>.test.tsx` / `<ComponentName>.test.ts`（Vitest 単体テスト）
- `<ComponentName>.spec.tsx` / `<ComponentName>.spec.ts`（同上）
- `<ComponentName>.stories.tsx`（Storybook story）

判断基準:

| 編集の規模 | 対応方針 |
|---|---|
| Props 追加 / 文言変更 / class 変更などの小修正 | 該当テスト・story を Read → 必要箇所だけ Edit |
| Props 削除 / ロジックの大幅変更 / API 変更 | `/generate-with-tests <path>` で再生成を検討 |
| バグ修正 | 再現する回帰テストを追加 |

`PostToolUse` hook（`.claude/hooks/suggest-test-update.sh`）が編集を検知して該当ファイルを列挙してくれるので、そのリマインダーが見えたら無視せず確認する。

## 仕様書同期ルール（コード変更時）

コード（特に schema・component・migration・route）を編集した場合、`specs/` 配下の関連仕様書（spec-kit 形式）に **必ず同期確認をかける**。実装が真実なので、ズレを見つけたら仕様書側を実装に合わせて更新する。

同期対象の主なマッピング:

| 編集したコード | 確認する仕様書 |
|---|---|
| `src/features/<feature>/schemas/*.schema.ts` | `specs/<NNN>-<feature>/screens/*.md` の項目定義・バリデーション表、`spec.md` の Functional Requirements |
| `src/features/<feature>/components/**/*.tsx` | `specs/<NNN>-<feature>/screens/*.md` の画面要素・状態 |
| `src/features/<feature>/server/{queries,actions}.ts` | `specs/<NNN>-<feature>/plan.md` |
| `src/features/<feature>/lib/*.ts`（自動計算・変換ロジック等） | `specs/<NNN>-<feature>/screens/*.md` の挙動説明 |
| `src/features/<feature>/constants.ts` | `specs/<NNN>-<feature>/screens/*.md` の選択肢一覧 |
| `src/app/<route>/page.tsx` | `specs/<NNN>-<feature>/screens/<screen>.md` |
| `src/proxy.ts` / `src/middleware.ts` | `specs/<NNN>-<feature>/plan.md` のルーティング節 |
| `supabase/migrations/*.sql` | `specs/<NNN>-<feature>/data-model.md` |

判断基準:

| 編集の規模 | 対応方針 |
|---|---|
| 値や文言の微変更（max 値・ラベル・エラーメッセージ等） | 該当仕様書を Read → 該当行だけ Edit |
| カラム / 項目の追加・削除、UI 種別の変更（select↔text 等）、デフォルト値の意味変更 | `/sync-spec` で一括チェック + 修正 |
| 大規模リファクタ | `/sync-spec` で全範囲スキャン後、ユーザーと合意してから書き換え |

`/sync-spec <path>` は対象ファイルを絞ったチェックも可能。コミット前に `/sync-spec` を 1 回回す運用が安全。

## フレームワーク・ライブラリの公式ドキュメント参照

実装時は必ず最新の公式ドキュメントを参照すること。

### Next.js
- 実装前に [Next.js公式ドキュメント](https://nextjs.org/docs) を参照する
- App Router を使用する
- Server Components をデフォルトとし、Client Components は `'use client'` で明示的に指定する
- データフェッチは Server Components で行う
- 動的ルーティング、ミドルウェア、APIルートの実装時も公式ドキュメントに従う

## プロジェクト仕様（spec-kit）

仕様書は **spec-kit 形式** で `specs/NNN-feature-name/` 配下に管理する（spec-kit が正）。実装着手前に該当機能の `spec.md` / `plan.md` / `tasks.md` を必ず確認すること。

| ファイル | 内容 |
|---------|------|
| `spec.md` | 要件（ユーザーストーリー・FR・Success Criteria） |
| `plan.md` | 実装計画（技術選定・構成・設計詳細） |
| `tasks.md` | タスク分解（T001 連番・Phase 構成） |
| `data-model.md` | テーブル定義（カラム・制約・RLS・トリガー） |
| `screens/*.md` | 画面仕様（補助ドキュメント） |

- プロジェクト原則は [.specify/memory/constitution.md](../.specify/memory/constitution.md) を参照
- 新機能は `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` のフローで進める
- 旧仕様書 `docs/specs/` は spec-kit（`specs/`）へ移行完了し削除済み（プロダクト方針は引き続き [docs/product.md](../docs/product.md)）

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
| `/review [<NNN>-<feature>]` | 変更差分の総合チェック（typo・表記ゆれ・影響範囲・共通化。feature 指定で仕様スコープも参照） |
| `/check-typo` | 変更差分に含まれるタイポ・不要な文字変更をチェックする |
| `/check-diff-impact` | 変更差分の影響を受けるURLを特定する |
| `/code-fix [ファイル]` | コード規約に基づいてコードを修正する |
| `/sync-spec [ファイル]` | 変更コードと `specs/` のずれを検出し、仕様書を実装に合わせて修正する |
| `/summary` | PRディスクリプションを生成する |
| `/suggest-commit` | 変更差分からコミット名を提案する |
| `/reply-review <コメント>` | レビューコメントへの返信ドラフトを生成する |
| `/empirical-prompt-tuning` | プロンプトやskillを実行・評価し反復改善する |
| `/generate-with-tests <path>` | コンポーネントに対し Vitest / Storybook / Playwright テストを並列生成する |
| `/pkg-update` | 指定ブランチの package.json パッケージバージョンをアップデートする |
| `/markup` | スクリーンショットをもとにマークアップ（HTML/CSS実装）する |
| `/speckit-specify <説明>` | spec-kit: 機能の spec.md を作成する |
| `/speckit-plan` | spec-kit: plan.md（実装計画）を作成する |
| `/speckit-tasks` | spec-kit: tasks.md（タスク分解）を生成する |
| `/speckit-implement` | spec-kit: tasks.md に従って実装する |
| `/speckit-clarify` / `/speckit-analyze` / `/speckit-checklist` | spec-kit: 仕様の明確化・整合性分析・チェックリスト生成 |

## service-front プロジェクト

### アーキテクチャ

設計の詳細は `arch/feature-based.md` に基づく Feature-based アーキテクチャに従う。
コードを生成するときは `arch/` 配下のドキュメントを参照すること。

### 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Compiler

### 設計方針

- Server Components をデフォルトとする
- Client Components は `'use client'` で明示的に指定する
- データフェッチは Server Components で行う
- ページ作成時は必ず `generatePageMetadata`（`@/shared/config/metadata`）を使用して `metadata` をエクスポートする
- ページには基本的に `Header` と `Footer`（`@/shared/components/layout`）を含める

## spec-kit agent context（自動管理セクション）

以下のマーカー間は spec-kit の agent-context 拡張（`/speckit-plan` 実行時）が自動更新する。手動で編集しない。

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/017-cookie-consent/plan.md
<!-- SPECKIT END -->
