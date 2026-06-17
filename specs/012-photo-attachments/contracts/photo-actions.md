# Contract: Photo Server Actions

`service-front/src/features/dives/server/photoActions.ts`（`'use server'`）。既存 `actions.ts` の `ActionResult<T>`（`actionSuccess` / `actionFailure`）パターンに準拠する。全 Action は冒頭で `auth.getUser()` により認証を確認し、対象 dive / photo の所有権（`auth.uid() == user_id`）を検証する。失敗時は `actionFailure(message)` を返し `console.error` に記録。成功時は該当パスを `revalidatePath` する。

> 大容量バイト列は Action に渡さない。原本はクライアントが browser client で Storage に直アップロードし、Action にはパス等の小さな JSON のみ渡す（research R2）。

## addDivePhoto

ブラウザが Storage に上げた原本を処理し、表示用/サムネイルを生成して `dive_photos` に登録する。

```typescript
interface AddDivePhotoInput {
  diveId: string;
  origPath: string;   // dive-photos/{user_id}/{dive_id}/orig/{uuid}.{ext}
  caption?: string;   // 任意（<=200 文字）
}
addDivePhoto(input: AddDivePhotoInput): Promise<ActionResult<{ photoId: string }>>
```

- 事前条件: 認証済み・`diveId` が本人の dive・`origPath` のパス先頭が本人 `user_id`・既存枚数 + 1 <= 10（FR-003）・原本が許可 MIME（sharp で `metadata()` 可能）。
- 処理: 回転適用 → 全メタ除去 → display/thumb WebP 生成・保存 → 原本削除 → `dive_photos` INSERT（`sort_order` = 末尾、ログ初の 1 枚なら `is_cover=true`）。
- 失敗時: 上限超過 / 非対応形式 / 所有権なし / 処理失敗 を区別したメッセージ。処理失敗時は生成済み中間オブジェクトを後始末。
- 事後条件: 詳細ページ revalidate。返り値に `photoId`。

## deleteDivePhoto

```typescript
deleteDivePhoto(photoId: string): Promise<ActionResult>
```

- 対象写真の `display`/`thumb`（残存すれば `orig`）Storage オブジェクトを削除し、`dive_photos` 行を削除（FR-013）。
- 削除対象が `is_cover` だった場合、同 dive の残り写真のうち最小 `sort_order` を `is_cover=true` に昇格（FR-011 / Edge Case）。残り 0 枚なら昇格なし。
- 他の写真・ログ本体には影響しない。

## reorderDivePhotos

```typescript
reorderDivePhotos(diveId: string, orderedPhotoIds: string[]): Promise<ActionResult>
```

- `orderedPhotoIds` の並びで `sort_order` を 0..n-1 に一括更新（FR-010）。
- 事前条件: `orderedPhotoIds` が当該 dive の写真 ID 集合と一致（過不足はエラー）。

## setCoverPhoto

```typescript
setCoverPhoto(diveId: string, photoId: string): Promise<ActionResult>
```

- 当該 dive の全写真の `is_cover=false` にしてから対象を `is_cover=true`（部分ユニーク制約に整合）。FR-011。

## updatePhotoCaption

```typescript
updatePhotoCaption(photoId: string, caption: string): Promise<ActionResult>
```

- `caption`（<=200 文字、yup `photo.schema.ts` で検証）を更新（FR-012）。空文字で未設定に戻せる。

## 共通エラーモデル

| ケース | 返り値 |
|---|---|
| 未認証 | `actionFailure('ログインが必要です')`（実際の文言は既存 actions.ts に合わせる） |
| 所有権なし / 対象が存在しない | `actionFailure('対象が見つかりません')`（情報漏洩を避け 404 相当の一般文言） |
| 枚数上限超過 | `actionFailure('写真は 1 ログにつき最大 10 枚までです')` |
| 非対応形式 / 破損 | `actionFailure('対応していない画像形式です')` |
| 容量超過 | `actionFailure('画像は 1 枚あたり最大 10MB までです')` |
