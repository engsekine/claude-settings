# ドキュメント

> **⚠️ 移行済み（2026-06-10）**: `docs/specs/` 配下の仕様書は **spec-kit 形式** でリポジトリルートの [`specs/`](../specs/) に移行しました。現在の正は `specs/NNN-feature-name/`（spec.md / plan.md / tasks.md / data-model.md / screens/）です。本ディレクトリの `specs/` はアーカイブとして残しており、新規参照・更新はしません。新機能は `/speckit-specify` から始めてください（プロジェクト原則: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)）。
>
> [product.md](product.md)（プロダクト全体方針）は引き続き本ディレクトリで管理します。

このリポジトリは「ダイビングログアプリ」のプロダクトです。本ディレクトリにはプロダクト方針と仕様書を配置します。

## 構成

| ファイル / ディレクトリ | 内容 |
|------------------------|------|
| [product.md](product.md) | プロダクト全体方針 |
| [specs/features/](specs/features/) | 機能単位の仕様（実装順に連番管理） |
| [specs/screens/](specs/screens/) | 画面単位の仕様（参照ドキュメント） |
| [specs/tables/](specs/tables/) | テーブル単位のスキーマ定義（参照ドキュメント） |

## specs/features/ — 機能仕様

実装単位の連番で機能ごとに **要件 → 設計 → タスク** の 3 点セットを管理します。

| ファイル | 内容 | いつ書く |
|---------|------|---------|
| `requirements.md` | 要件（何を作るか、なぜ作るか） | 機能着手の最初 |
| `design.md` | 設計（どう作るか、技術選定、データモデル） | 要件確定後 |
| `tasks.md` | タスク（実装単位の分解、進捗管理） | 設計確定後 |

### 命名規則

```
specs/features/
├── 001-auth/                  ← 連番 + ケバブケースの機能名
├── 002-dive-log-crud/
└── 003-xxx/                   ← 新機能はここから
```

- 連番は `001`, `002`, ... と 3 桁ゼロ埋め
- 機能名はケバブケース（`dive-log-crud`, `user-profile` など）
- 一度採番した番号は欠番にしない（再採番しない）

### 新機能を追加するときの手順

1. `specs/features/NNN-feature-name/` を作成
2. `requirements.md` を書いて方針合意
3. `design.md` を書いて技術選定・データモデル確定
4. `tasks.md` で実装タスクを分解
5. 実装開始

実装着手前に必ず該当機能の 3 ファイルを参照してください。

## specs/screens/ — 画面仕様

画面単位の仕様図・項目定義・遷移を管理します。複数の機能にまたがる横断的な参照ドキュメントのため、連番ではなく **画面名（ケバブケース）** で配置します。

```
specs/screens/
├── dive-log-list.md           ← 一覧画面
├── dive-log-detail.md         ← 詳細画面
└── ...
```

- 1 画面 1 ファイルを基本とする
- 画面名はルーティングや UI の通称に合わせる（`dive-log-list`, `login` など）
- 実装した機能（`specs/features/NNN/`）へのリンクを冒頭に張ってトレーサビリティを保つ
- 新規作成時は [`specs/screens/_template.md`](specs/screens/_template.md) をコピーして使う（`_` 始まりのファイルは画面仕様本体ではないテンプレ・補助ドキュメント）

## specs/tables/ — テーブル仕様

DB テーブル単位のスキーマ定義書を管理します。マイグレーション SQL から人間が読みやすい形に再構成したリファレンスで、カラム / 制約 / インデックス / RLS / トリガー / ER をまとめます。

```
specs/tables/
├── users.md
├── user_details.md
├── dives.md
└── ...
```

- 1 テーブル 1 ファイル、ファイル名はテーブル名そのまま（`snake_case`）
- マイグレーションへのパスと、紐づく機能仕様（`specs/features/NNN/`）へのリンクを必ず張る
- スキーマ変更は **マイグレーション SQL が真実**。本ドキュメントはマイグレーションを反映して更新する（逆ではない）
- 新規作成時は [`specs/tables/_template.md`](specs/tables/_template.md) をコピーして使う
