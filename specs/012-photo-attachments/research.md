# Research: ダイブログへの写真添付

Phase 0。Technical Context の未確定点と技術選定を解決する。clarify（Session 2026-06-16）で形式・GPS 除去・上限値は確定済みのため、本書は **実現方式（HOW）** に集中する。

## R1: 画像処理（HEIC→WebP 変換・EXIF/GPS 除去・回転適用・サムネイル）をどこで行うか

- **Decision**: サーバー側で `sharp`（libvips バックエンド）を使い、Server Action（Node.js ランタイム）から一括処理する。具体的には「Orientation を適用してピクセル回転 → 全メタデータ除去 → 表示用 WebP（**長辺上限 2048px**・品質 80）+ サムネイル WebP（**長辺 480px**・品質 75）を生成」。長辺が上限未満の画像は拡大しない（`withoutEnlargement`）。HEIC/HEIF 入力は sharp が対応（libheif）。
- **Rationale**:
  - GPS 除去（FR-009 / SC-005=0 件）はサーバーの信頼境界で行うべき。クライアント任せだと検証不能。
  - `sharp` は回転適用・メタデータ全削除・リサイズ・WebP 変換を 1 パイプラインで実行でき、FR-016 / FR-017 を同時に満たす。
  - WebP 化で公開ページ・一覧の転送量を抑え SC-002 / SC-006 に寄与。
- **Alternatives considered**:
  - **クライアント変換（heic2any + canvas）**: バンドル増・端末性能依存・HEIC デコード不安定。canvas 再エンコードで EXIF は落ちるが回転を先に適用する制御が煩雑。却下。
  - **Supabase Storage の画像変換（image transformation）**: 表示時リサイズには使えるが、HEIC 入力の保証・保存前の GPS 恒久除去には不適。却下（ただし表示時の追加リサイズには将来併用可）。
  - **MIME 検証**: クライアントの `file.type` は信頼しないため、サーバーで sharp の `metadata()` が成功する＝デコード可能な画像であることをもって実質的な形式検証とする（マジックバイトの別途検査は不要と判断）。

## R2: アップロード方式（Server Action 経由 vs ブラウザから Storage 直アップロード）

- **Decision**: **ブラウザから Storage へ原本を直接アップロード**（browser Supabase client + RLS）し、その後 **メタと処理指示を Server Action に JSON で渡す**。Server Action は原本を取得して R1 の処理を行い、表示用/サムネイルを保存・原本削除・`dive_photos` へ INSERT する。
- **Rationale**:
  - Next.js Server Action / Route のボディサイズ既定（〜1MB 程度）では 10MB×複数枚を直接受けられない。直アップロードなら大容量転送が Storage に直行する。
  - 進捗表示・部分失敗の再試行（Edge Cases）がクライアントで扱いやすい。
  - 認証ユーザーの直アップロードは Storage RLS（本人パスのみ INSERT）で安全に制限できる。
- **Alternatives considered**:
  - **Server Action に FormData で全バイト送信**: ボディ上限の引き上げが必要で、サーバーメモリ・タイムアウトの懸念。複数ファイルの部分成功が扱いにくい。却下。
  - **原本を保存せず Server Action 内でストリーム処理**: 上限問題が残るため不採用。
  - **後始末**: 原本（`orig/`）は処理成功後に削除。Server Action が失敗した場合に備え、`orig/` に取り残された未参照オブジェクト（`dive_photos` に行がない）は定期クリーンアップ対象とする（運用 TODO、本 feature では孤児が残っても公開はされない設計）。

## R3: Storage バケット構成と RLS（本人管理・公開ログのみ公開読取）

- **Decision**: 単一の **private バケット `dive-photos`**。パスは `{user_id}/{dive_id}/{kind}/{photo_uuid}.{ext}`（kind = `orig` | `display` | `thumb`）。`storage.objects` に RLS ポリシーを定義する:
  - **本人**: 自分の `{user_id}/...` 配下を INSERT / SELECT / UPDATE / DELETE 可（`(select auth.uid())::text = (storage.foldername(name))[1]`）。
  - **anon（公開）**: `display/` と `thumb/` のオブジェクトのうち、パス 2 階層目の `dive_id` が指す `public.dives.is_public = true` の行に属するものだけ SELECT 可。`orig/` は anon から常に不可。
  - 公開読取は `storage.foldername(name)` でパス分解し `public.dives` を参照する `security definer` 判定関数（`set search_path = ''`）経由にする（ポリシー式の可読性・再利用のため）。
- **Rationale**:
  - private バケット + RLS は constitution IV（RLS by Default）に一致。公開可否を `dives.is_public` 一箇所に集約でき FR-008（非公開化で即遮断）を構造的に満たす。
  - `display`/`thumb` のみ公開し `orig` を遮断することで、原本（万一メタが残っても）が公開されない多層防御。なお R1 で原本は処理後削除するため通常 `orig` は存在しない。
- **Alternatives considered**:
  - **public バケット**: URL を知る誰でも閲覧可能になり FR-007（非公開の遮断）を満たせない。却下。
  - **公開ページで service_role により署名 URL 発行**: RLS を迂回するため、is_public チェック漏れが即漏洩につながる。RLS に寄せる方が安全。却下。
  - **表示 URL の渡し方**: 本人ページ・公開ページとも、サーバーで `createSignedUrl`（短期）を発行して `next/image` に渡す。RLS が許可する範囲でのみ署名できるため、二重に安全。

## R4: 公開ページ依存と段階リリース

- **Decision**: 本 feature では Storage RLS・`dive_photos`・`photoQueries`（公開対応）まで実装し、**公開ページのルート追加（`public_slug` 解決ページ）は 002 公開機能の依存として切り離す**。US1 を MVP として単独リリース可能にする。
- **Rationale**: 公開ページ（`/share/[slug]` 等）は未実装で、本 feature のスコープ外（spec Assumptions）。データ層を公開対応で先行整備しておけば、公開ページ実装時に `DivePhotoGallery` をそのまま再利用して結線できる。
- **Alternatives considered**: 本 feature 内で公開ページごと実装 → スコープ膨張・002 との責務重複。却下。

## R5: 並び替え・代表写真・サムネイル表示（US3 / FR-010〜FR-013 / FR-016）

- **Decision**:
  - 表示順は `dive_photos.sort_order`（integer）。並び替えは Server Action `reorderDivePhotos(diveId, orderedIds[])` で一括更新。
  - 代表写真は `is_cover boolean`。1 ログ内で高々 1 件（部分ユニークインデックス `where is_cover`）。代表写真削除時は残りの最小 `sort_order` を自動昇格（Action 内で担保）。
  - 一覧・カードのサムネイルは `thumb/` を `PhotoThumbnail`（`next/image`）で遅延読込。
  - キャプションは `dive_photos.caption text`（任意、長さ上限を yup + CHECK で制限）。
- **Rationale**: 3NF（`dives` と `dive_photos` を分離）。代表写真の一意性を DB 制約で担保し UI バグの混入を防ぐ。
- **Alternatives considered**: `dives` に `cover_photo_id` を持たせる案 → 双方向参照で循環・整合が複雑。`is_cover` フラグ + 部分ユニークの方が単純。却下。

## R6: next/image とドメイン設定

- **Decision**: 署名 URL（Supabase Storage のホスト）を `next.config` の `images.remotePatterns` に許可する。`PhotoThumbnail` は `alt` を必須 prop にし、キャプションが無い場合はログ情報（日付・ポイント名）由来の代替テキストを生成して渡す（accessibility.md / FR-009 系）。
- **Rationale**: 既存で `next/image` の利用は Header/Footer のみで Storage ドメイン未許可。署名 URL 表示には remotePatterns 追加が必要。`alt` 必須化で a11y 違反を型レベルで防ぐ。
- **Alternatives considered**: `<img>` 直接利用 → 最適化・遅延読込・レイアウトシフト対策を自前化することになり却下。

## まとめ（確定事項）

| 項目 | 決定 |
|---|---|
| 画像処理 | サーバー側 `sharp`（回転適用・全メタ除去・WebP 変換）。表示用=長辺 2048px/q80、サムネイル=長辺 480px/q75、拡大なし。Node.js ランタイム |
| アップロード | ブラウザ → Storage 直アップロード（原本）→ Server Action が処理・メタ INSERT |
| バケット | private `dive-photos`、パス `{user_id}/{dive_id}/{orig|display|thumb}/{uuid}.{ext}` |
| 公開制御 | `storage.objects` RLS + `dives.is_public` 連動。`display`/`thumb` のみ anon SELECT 可、`orig` 不可 |
| 表示 URL | サーバーで短期署名 URL を発行し `next/image` に渡す |
| 代表写真 | `is_cover` + 部分ユニーク。削除時は自動昇格 |
| 公開ページ | 本 feature はデータ層まで。ルートは 002 公開機能の依存（US1 が MVP） |
