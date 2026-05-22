---
name: generate-with-tests
description: 指定されたコンポーネント / 機能ファイルに対し、Vitest 単体テスト・Storybook story・Playwright a11y テストを並列でまとめて生成する。
user-invocable: true
---

コードと一緒に Vitest / Storybook / Playwright のテストを並列生成するスキル。3 つのサブエージェントを `Agent` ツールで同時起動し、結果を集約してファイル書き込みと整合確認まで行う。

## 入力パターン

- `/generate-with-tests <対象ファイル絶対パス>` — 全 3 種生成
- `/generate-with-tests <絶対パス> --skip-vitest` — Vitest だけ省く
- `/generate-with-tests <絶対パス> --skip-storybook` — Storybook だけ省く
- `/generate-with-tests <絶対パス> --skip-playwright` — Playwright だけ省く

`--skip-*` は複数指定可能。

## 前提確認

1. 対象ファイルが存在する（無ければ「ファイルが見つかりません」と返して終了）
2. 対象が `service-front/src/` または `service-front/.storybook/` 配下である（外なら警告）
3. 対象が `*.test.tsx` `*.stories.tsx` 等のテスト/story ファイル自身ではない

## 手順

### 1. 対象解析（内部処理）

対象ファイルを Read し、以下を抽出する:

- 主要 export（コンポーネント名 / 関数名）
- Props / 引数の型定義
- ファイルの分類（コンポーネント / Server Component / page.tsx / Server Action / 純粋関数 等）
- 既存のテスト / story の有無（同一ディレクトリ内を Glob で確認）

**既存テストがある場合の挙動**:
- 既に `.test.tsx` がある → vitest-unit-writer は呼ばずに SKIP 報告
- 既に `.stories.tsx` がある → storybook-story-writer は呼ばずに SKIP 報告
- Playwright は判断ロジックに任せる

### 2. サブエージェント並列起動

`Agent` ツールで以下を **1 メッセージで並列起動**（`--skip-*` 指定されたものは除く）:

#### vitest-unit-writer に渡すプロンプト

```
対象ファイル: <絶対パス>
シンボル名: <ComponentName>
Props 型: <型定義の抜粋>

このコンポーネントに対する Vitest 単体テストを生成してください。
co-locate 先: <同一ディレクトリ>/<ComponentName>.test.tsx
規約は .claude/rules/typescript.md, .claude/rules/react.md および
service-front/vitest.config.ts に従ってください。
```

#### storybook-story-writer に渡すプロンプト

```
対象ファイル: <絶対パス>
シンボル名: <ComponentName>
Props 型: <型定義の抜粋>

このコンポーネントに対する Storybook story を生成してください。
co-locate 先: <同一ディレクトリ>/<ComponentName>.stories.tsx
title 規則:
- shared/* なら 'shared/<subgroup>/<Name>'
- features/<feature>/components/* なら 'features/<feature>/<Name>'
参考: 既存の Header.stories.tsx / Breadcrumbs.stories.tsx / Footer.stories.tsx
```

#### playwright-a11y-writer に渡すプロンプト

```
対象ファイル: <絶対パス>
関連 URL: <既知なら>

判断ロジックに従って分類してから:
- 分類 A（自動スキャン対象） → SKIP で返す
- 分類 B / C → 専用テスト template を生成して返す
- 分類 D / E → SKIP で返す
```

### 3. 結果のパースとファイル書き込み

各サブエージェントが返したテキストから:

- `=== FILE: <絶対パス> ===` 〜 `=== END ===` ブロックを抽出
- `Write` ツールでファイル作成（既存ファイルがあるなら **ユーザーに上書き確認**してから書く）
- `SKIP: <理由>` は理由を保持し最終レポートに含める

### 4. 整合確認

書き込み完了後に以下を実行（service-front 内で）:

```bash
npm run type-check --workspace service-front
```

エラーがあれば該当ファイル・行と共に「⚠️ 型エラー」として報告。

オプションで（軽量なので推奨）:

```bash
npx biome check <生成ファイルパス>
```

### 5. 最終レポート

以下のフォーマットで報告する:

```
📦 生成完了

✅ Vitest    : <絶対パス>
✅ Storybook : <絶対パス>
⏭ Playwright: <SKIP 理由>

🔍 型チェック: 0 件 / lint: 0 件
```

各サブエージェントが返した警告（`⚠️ 警告: ...`）があればまとめて末尾に列挙する。

## エラーハンドリング

| 状況 | 挙動 |
|---|---|
| 対象ファイル無し | 「ファイルが見つかりません: <path>」で終了 |
| サブエージェント失敗 | 該当種別は SKIP 扱い、他は継続。理由をレポート末尾に記載 |
| 型チェック失敗 | 該当ファイルと行番号を表示、ユーザーに修正方針を伺う |
| 既存ファイル上書きが必要 | 必ず確認を取る（自動上書きしない） |

## 注意点

- サブエージェントは **テキストで内容を返すだけ**で、ファイル書き込みはこのスキル側で行う（衝突制御のため）
- 並列起動は **必ず 1 メッセージで `Agent` を 3 回呼ぶ**こと（順次呼ぶと並列化のメリットが消える）
- `--skip-*` が指定されたサブエージェントは起動自体しない（API コール削減）
