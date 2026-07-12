# Contract: ルーティング・解決・リンク生成（034-nickname-profile-url）

## ルート（`[id]` → `[slug]` リネーム。パス構造は不変）

| ルート | slug = uuid 形式 | slug = ニックネーム |
|---|---|---|
| `/users/[slug]` | nickname を解決し、URL 安全なら `/users/<nickname>` へ redirect（FR-004）。URL 不可 nickname はそのまま表示（FR-005）。不在は notFound | `get_user_id_by_nickname` で解決して表示（FR-001/002）。不在は notFound（FR-008） |
| `/users/[slug]/followers` | 同上（`/users/<nickname>/followers` へ redirect） | 同上 |
| `/users/[slug]/following` | 同上 | 同上 |
| `/users/search` | 変更なし（静的ルートが `[slug]` より優先） | — |

- slug は `decodeURIComponent` してから判別・解決する
- 3 ページ共通の「解決 → notFound / 転送 → プロフィール取得」は `requireProfileBySlug(slug, subPath)` に集約し、
  React の `cache()` でリクエスト内メモ化する（generateMetadata と page 本体の二重フェッチ防止）
- 表示内容・アクセス制御は現行と同一（FR-009。取得後は既存のプロフィール表示ロジックに合流する）
- `generatePageMetadata` の slug（canonical）はニックネーム URL を正とする

## profilePath ヘルパー（`shared/lib/profile-path/`）

```ts
profilePath({ userId, nickname }: { userId: string; nickname?: string | null }): string
// nickname が URL 安全 → `/users/${encodeURIComponent(nickname)}`
// それ以外（nickname なし・禁止文字・予約語・uuid 形式）→ `/users/${userId}`

isUrlSafeNickname(nickname: string): boolean
// 禁止文字（/ ? # % \ ・制御文字）を含まない・RESERVED_USER_SEGMENTS でない・uuid 形式でない

isUuid(value: string): boolean
```

- 判定規則は schema の登録禁止（FR-006）と同一定数を共有する（規則の二重管理をしない）

## リンク生成の変更箇所（FR-003）

| 箇所 | 現状 | 変更後 |
|---|---|---|
| `AuthNav`（ヘッダーのマイプロフィール） | `/users/${user.id}` | `profilePath({ userId: user.id, nickname: user.user_metadata.nickname })` |
| `Timeline` / `FollowList` / `FollowCounts` / ユーザー検索結果 | `/users/${userId}` | `profilePath`（nickname は表示用に取得済み） |
| `DiveDetail`（バディ） | `/users/${buddy.userId}` | `profilePath`（buddy.name が nickname） |
| `notificationTarget`（followed） | `/users/${actorId}` | `profilePath`（通知一覧が actor nickname を保持） |
| `Breadcrumbs`（followers/following） | `/users/${id}` | 解決済みプロフィールから profilePath |
| `revalidatePath`（social actions） | `/users/${followeeId}` | `revalidatePath('/users/[slug]', 'page')` で動的ルート全体を再検証（ニックネーム URL / ID URL の両表示をカバー） |

## ニックネーム登録・変更の追加制約（FR-006）

`shared/schemas/user-profile.ts`（サインアップ・Google 補完・アカウント設定で共有）:

| 拒否条件 | エラーメッセージ（案） |
|---|---|
| `/ ? # % \` または制御文字を含む | ニックネームに / ? # % \ は使用できません |
| uuid 形式に一致 | このニックネームは使用できません |
| 予約語（search。大文字小文字問わず） | このニックネームは使用できません |

- 既存データへの遡及適用はしない（FR-005 のフォールバックで救済）

## アカウント設定（nickname 変更時の同期・Decision 4）

- `updateProfile` 成功時に `auth.updateUser({ data: { nickname } })` で user_metadata を同期する
- 同期失敗は致命的でない（AuthNav が ID URL にフォールバックしリダイレクトで正規化される）ため、プロフィール更新自体は成功として扱い、エラーはログに残す
