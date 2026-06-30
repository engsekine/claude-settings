# Contract: フォロー Server Actions

`features/social/server/actions.ts`。フォロー作成・解除。`follower_id` は常に `(select auth.uid())` をサーバー側で確定し、クライアント値を信用しない。

## `followUser(followeeId: string)`

| 項目 | 内容 |
|---|---|
| 入力 | `followeeId`: フォロー対象ユーザー ID（uuid） |
| 前提 | 認証済み。`followeeId !== 自分`、未フォロー |
| 動作 | `user_follows (follower_id=auth.uid(), followee_id)` を INSERT |
| 出力（成功） | `{ ok: true, isFollowing: true }` |
| 出力（失敗） | `{ ok: false, error }`（`self_follow` / `already_following` / `not_found` / `unauthenticated`） |
| 冪等性 | 既にフォロー中なら成功扱い（`isFollowing: true`）で副作用なし |
| 再検証 | プロフィール `/users/[followeeId]` と TOP のタイムラインを revalidate |

### 検証

- 自己フォロー: DB CHECK `user_follows_no_self_check` + Action 事前チェックで拒否
- 重複: PK 競合を捕捉し冪等成功に変換
- 未認証: RLS insert ポリシーで拒否（Action でも 401 相当を返す）

## `unfollowUser(followeeId: string)`

| 項目 | 内容 |
|---|---|
| 入力 | `followeeId`: 解除対象ユーザー ID |
| 動作 | `delete from user_follows where follower_id=auth.uid() and followee_id` |
| 出力（成功） | `{ ok: true, isFollowing: false }` |
| 冪等性 | 未フォローでも成功扱い |
| 再検証 | 同上 |

## 受け入れ基準（spec 対応）

- FR-012 / FR-013 / FR-014（自己・重複不可）/ SC-003（3 秒以内反映・件数整合）
