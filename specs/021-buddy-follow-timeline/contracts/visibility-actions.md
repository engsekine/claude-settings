# Contract: ログ公開/非公開トグル

`features/dives/server/actions.ts` に追加。所有者のみ。

## `setDiveVisibility(diveId: string, isPublic: boolean)`

| 項目 | 内容 |
|---|---|
| 入力 | `diveId`, `isPublic` |
| 権限 | dive 所有者のみ（既存 update RLS `auth.uid() = user_id`） |
| 動作（公開化） | `is_public = true`。`public_slug` が NULL なら一意な slug を生成して設定 |
| 動作（非公開化） | `is_public = false`。`public_slug` は保持（再公開時に同一 URL）だが、`get_public_dive` と RLS が `is_public=false` を返さないため共有リンクは即無効 |
| 出力 | `{ ok: true, isPublic, publicSlug }` / `{ ok: false, error }` |
| 再検証 | 対象 dive 詳細・所有者プロフィール・フォロワーのタイムライン |

### slug 生成

- 衝突しない一意値（既存 `public_slug` は unique 制約）。生成方式はタスクで確定（ランダム英数 or nanoid 相当）。`idx_dives_public_slug` 既存。

## 公開範囲（FR-010・確定仕様）

| 閲覧者 | 公開ログ | 非公開ログ |
|---|---|---|
| 所有者 | ○ | ○ |
| 認証ユーザー（リンク/一覧/タイムライン/検索経由） | ○（RLS `is_public=true`） | ✗ |
| 匿名（共有リンク） | ○（`get_public_dive(slug)` のみ） | ✗ |

## 受け入れ基準（spec 対応）

- FR-007〜011 / SC-002（非公開漏れ 0）/ SC-005（非公開化 5 秒以内に全経路遮断）
