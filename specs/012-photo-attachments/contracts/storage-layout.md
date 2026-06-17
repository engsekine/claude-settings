# Contract: Storage Layout & RLS

Supabase Storage の private バケット `dive-photos` のパス規約と `storage.objects` RLS の契約。詳細な SQL は [data-model.md](../data-model.md) を参照（本書は不変条件の宣言）。

## バケット

| 項目 | 値 |
|---|---|
| 名前 | `dive-photos` |
| 公開 | private（`public = false`） |
| ファイルサイズ上限 | 10MiB（変換前原本。FR-003） |
| 許可 MIME | `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif` |

## パス規約（不変条件）

```
{user_id}/{dive_id}/{kind}/{photo_id}.{ext}
```

- 階層 1 = `user_id`（UUID）。所有権の判定キー。
- 階層 2 = `dive_id`（UUID）。公開可否の判定キー。
- 階層 3 = `kind` ∈ {`orig`, `display`, `thumb`}。
- `photo_id` = `dive_photos.id` と一致。`display`/`thumb` の `ext` は常に `webp`。

## アクセス契約

| 主体 | orig | display | thumb |
|---|---|---|---|
| 所有者（authenticated, パス先頭が自分の user_id） | RW | RW | RW |
| 他の認証ユーザー | × | ×（公開 dive を除く） | ×（公開 dive を除く） |
| anon（未認証） | × | 公開 dive のみ R | 公開 dive のみ R |

- 「公開 dive」= `public.dives.is_public = true`（パス階層 2 の `dive_id` で判定。`public.is_public_dive_photo(name)`）。
- 非公開化（`is_public=false`）した瞬間、display/thumb への anon SELECT は false になる（FR-007 / FR-008）。
- `orig` は anon に対し常に不可。原本は処理完了後に削除されるため通常存在しない（research R2）。

## 表示 URL

- 本人ページ・公開ページとも、サーバー側で RLS が許可する範囲の **短期署名 URL** を発行して `next/image` に渡す。
- `next.config` の `images.remotePatterns` に Storage ホストを許可する（research R6）。

## 不変条件チェック（受け入れ観点）

- INV-1: 任意のオブジェクトについて、パス先頭の `user_id` と `dive_photos.user_id` が一致する。
- INV-2: anon が `orig/` を取得できない。
- INV-3: 非公開 dive の `display`/`thumb` を anon が取得できない（FR-007）。
- INV-4: 保存された `display`/`thumb` の EXIF に GPS が含まれない（FR-009 / SC-005）。
