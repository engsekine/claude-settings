# claudeの最適設定を研究するリポジトリ

## セットアップ

このリポジトリのコマンド・スキル・エージェント設定をグローバルの Claude に反映するには、シンボリックリンクを作成します。

```bash
make link
```

`~/.claude/commands`, `~/.claude/skills`, `~/.claude/agents` がこのリポジトリの `.claude/` 配下にリンクされます。

### その他の make コマンド

| コマンド | 説明 |
|---------|------|
| `make link` | グローバル `~/.claude/` へシンボリックリンクを作成 |
| `make unlink` | シンボリックリンクを削除 |
| `make re` | リンクし直す（unlink → link） |
| `make status` | 現在のリンク状態を確認 |

### devcontainer で使う

以下のコマンドを実行すると、プロジェクトの `.devcontainer/devcontainer.json` にコピペできる `mounts` 設定が出力されます。

```bash
make devcontainer
```

出力された JSON を `.devcontainer/devcontainer.json` の `mounts` に追加してください。

> コンテナのユーザーが `root` 以外（例: `vscode`, `node`）の場合は `target` のパスを変更してください。
> 例: `target=/home/vscode/.claude/commands,...`

#### `devcontainer.json` の変更をgitに追わせない

`mounts` はホストのパスが含まれるため人によって異なります。チームでリポジトリを共有している場合は、ローカルの変更をgitに追跡させない設定が便利です。

```bash
git update-index --skip-worktree .devcontainer/devcontainer.json
```

これにより `devcontainer.json` への変更が `git diff` や `git status` に表示されなくなります。

解除する場合:

```bash
git update-index --no-skip-worktree .devcontainer/devcontainer.json
```

> **`.gitignore` との違い**: `skip-worktree` はすでにgit管理されているファイルのローカル変更を無視します。チームのベース設定はgitで共有しつつ、個人のmounts設定だけを追跡対象から外したい場合に使います。

#### 未追跡ファイルをローカルでだけ除外する（`.git/info/exclude`）

`.gitignore` をリポジトリにコミットしたくない場合や、自分だけのローカルルールを追加したい場合は `.git/info/exclude` に記述します。

```bash
# .git/info/exclude に追記
echo ".devcontainer/devcontainer.json" >> .git/info/exclude
```

`.gitignore` と同じ記法で書けますが、このファイル自体はgit管理されないためチームに影響しません。

| 方法 | 対象ファイルの状態 | チームへの影響 |
|------|-----------------|--------------|
| `.gitignore` | 未追跡ファイル | あり（gitで共有） |
| `.git/info/exclude` | 未追跡ファイル | なし（ローカルのみ） |
| `skip-worktree` | すでにgit管理されているファイル | なし（ローカルのみ） |

---

