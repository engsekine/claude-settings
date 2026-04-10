---
name: pkg-update
description: 指定ブランチの package.json パッケージバージョンをアップデートします。
user-invocable: true
---

指定ブランチの package.json パッケージバージョンをアップデートします。

## 使い方

```
/pkg-update $ARGUMENTS
```

例:
- `/pkg-update feature/my-feature` — 指定ブランチに切り替えてアップデート
- `/pkg-update` — 現在のブランチでアップデート

## $ARGUMENTS

対象ブランチ名（省略時は現在のブランチ）

## 手順

### 1. ブランチの切り替え

引数がある場合:
```bash
git checkout $ARGUMENTS
```

ブランチが存在しない場合は「ブランチが見つかりません: $ARGUMENTS」と出力して終了。

### 2. 最新状態に同期

```bash
git pull origin $(git branch --show-current)
```

### 3. パッケージマネージャーの検出

以下の順で検出する:

| ファイル | コマンド |
|---------|---------|
| `package.json` + `pnpm-lock.yaml` | `pnpm` |
| `package.json` + `yarn.lock` | `yarn` |
| `package.json` | `npm` |

`package.json` が存在しない場合は「package.json が見つかりません」と出力して終了。

### 4. アップデート実行

**npm**:
```bash
npm update
npm audit fix
```

**pnpm**:
```bash
pnpm update
pnpm audit --fix
```

**yarn**:
```bash
yarn upgrade
```

### 5. 変更確認

```bash
git diff --stat
```

アップデートによる差分がある場合は内容を表示する。

### 6. 完了報告

```
アップデート完了
═══════════════════════════
ブランチ: <ブランチ名>
パッケージマネージャー: <npm/pnpm/yarn>

更新されたパッケージ:
- <パッケージ名>: <旧バージョン> → <新バージョン>
...

次のステップ:
  動作確認後 /summary でPR説明文を作成できます
```
