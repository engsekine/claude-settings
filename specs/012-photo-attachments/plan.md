# Implementation Plan: ダイブログへの写真添付

**Branch**: `012-photo-attachments` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-photo-attachments/spec.md`

## Summary

ダイブログ（`dives`）に静止画を 0〜10 枚添付できるようにする。写真は **Supabase Storage の専用プライベートバケット**に保存し、メタデータ（キャプション・表示順・代表フラグ）は新規テーブル `dive_photos` で管理する。アップロードは **ブラウザから Storage へ原本を直接アップロード → Server Action がサーバー側で画像処理（自動回転適用・全 EXIF/GPS 除去・HEIC→WebP 変換・表示用 / サムネイル生成）→ メタ行 INSERT** という流れにし、Next.js Server Action のボディサイズ制約を回避しつつ変換・メタ除去をサーバー側の信頼できる経路に集約する（FR-009 / FR-016 / FR-017）。本人のみ管理可・公開ログの写真のみ未認証者が閲覧可、という制御は **Storage の RLS ポリシー** と `dive_photos` の RLS で二重に担保する（FR-005 / FR-007 / FR-008）。表示は `dives` feature を拡張した Server Component（ギャラリー）+ Client Component（アップローダ）で行う。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ Next.js App Router（React Server Components + React Compiler）

**Primary Dependencies**: Next.js / React / Tailwind CSS / Supabase JS（`@repo/supabase`：server / browser クライアント）/ React Hook Form + yup（既存フォーム規約）/ サーバー側画像処理ライブラリ `sharp`（**新規追加** — HEIC デコード・EXIF 除去・リサイズ・WebP 変換。research.md R1 参照）

**Storage**: Supabase Storage 新規プライベートバケット `dive-photos`（`supabase/config.toml` で定義）。新規テーブル `public.dive_photos`（`dives` に N:1）。`dives` は既存（`is_public` / `public_slug` を参照）

**Testing**: Vitest + React Testing Library（純粋関数・コンポーネント）、Storybook、Playwright（axe-core a11y）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）。撮影端末は iPhone（HEIC）を含む

**Project Type**: Web application（`service-front` モノレポ内 Next.js アプリ + `supabase/` マイグレーション + `packages/supabase` 型）

**Performance Goals**: SC-002（約 5MB 写真の添付完了 10 秒以内）/ SC-006（写真付き一覧 2 秒以内）。一覧・カードはサムネイル（小サイズ WebP）を `next/image` で遅延読込

**Constraints**: 1 ログ最大 10 枚 / 1 ファイル最大 10MB（変換前）。RLS で本人のみ管理・公開ログのみ公開読取。GPS は保存前に常時除去（公開・非公開・本人問わず復元不可）。WCAG 2.1 AA（各画像に代替テキスト・キーボード操作可能なアップローダ）

**Scale/Scope**: 新規テーブル 1・新規バケット 1・新規マイグレーション 2（テーブル + Storage ポリシー）。新規コンポーネント 3（アップローダ / ギャラリー / サムネイル）+ 既存 DiveDetail・DiveForm の拡張。新規 Server Action 群 1 モジュール。ユーザー 1 人あたり数百〜数千枚を上限の目安

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` v1.0.0 基準。

| 原則 | 判定 | 備考 |
|---|---|---|
| I. Spec-Driven Development | ✅ | spec.md → 本 plan → tasks.md の順で進行。clarify 済み（Session 2026-06-16） |
| II. Server Components First | ⚠️→✅ | 表示（ギャラリー・サムネイル）は Server Component。**アップローダのみ Client Component**（ファイル選択・進捗・プレビューにインタラクションが必須なため最小範囲で `'use client'`）。Complexity Tracking に記録 |
| III. Test-First | ✅ | 画像パス生成・バリデーション・EXIF 除去ユーティリティは純粋関数として Vitest 先行。コンポーネントは test + story + a11y 同梱 |
| IV. Security & RLS by Default | ✅ | `dive_photos` で RLS 有効化（本人 CRUD + 公開ログ行の anon SELECT）。Storage `objects` にも RLS ポリシー。スキーマ変更はマイグレーション経由のみ。関数を作る場合 `set search_path = ''` |
| V. Accessibility | ✅ | 各写真に `alt`（キャプション or ログ情報由来）、アップローダは `<input type="file">` を `<label>` 関連付け + 進捗を `aria-live`、削除/並び替えはキーボード操作可能（accessibility.md） |
| VI. Coding Standards | ✅ | SQL は snake_case / 3NF（`dive_photos` 分離）、コンポーネントは専用フォルダ構成、`any` 禁止、Tailwind utility-first |

**違反**: II に対しアップローダの Client 化が必要（下記 Complexity Tracking）。それ以外は準拠。

## Project Structure

### Documentation (this feature)

```text
specs/012-photo-attachments/
├── spec.md              # 機能仕様（clarify 済み）
├── plan.md              # This file
├── research.md          # Phase 0: 画像処理・アップロード方式・Storage RLS の調査と決定
├── data-model.md        # Phase 1: dive_photos テーブル + Storage バケット + RLS
├── quickstart.md        # Phase 1: 動作検証ガイド
├── contracts/
│   ├── photo-actions.md      # Server Action 入出力契約
│   └── storage-layout.md     # バケット / パス設計 / RLS ポリシー契約
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト（既存）
└── tasks.md             # /speckit-tasks の出力（本コマンドでは作らない）
```

### Source Code (repository root)

```text
service-front/src/features/dives/
├── components/
│   ├── client/
│   │   └── DivePhotoUploader/                  # 新規(Client): ファイル選択・クライアント検証・原本アップロード・進捗
│   │       ├── DivePhotoUploader.tsx
│   │       ├── DivePhotoUploader.test.tsx
│   │       ├── DivePhotoUploader.stories.tsx
│   │       └── index.ts
│   └── server/
│       ├── DivePhotoGallery/                   # 新規(Server): ログ詳細・公開ページ共通の写真ギャラリー
│       │   ├── DivePhotoGallery.tsx
│       │   ├── DivePhotoGallery.test.tsx
│       │   ├── DivePhotoGallery.stories.tsx
│       │   └── index.ts
│       └── DiveDetail/
│           └── DiveDetail.tsx                  # 変更: ギャラリーを差し込む
├── server/
│   ├── photoActions.ts                         # 新規: addDivePhoto / deleteDivePhoto / reorderDivePhotos / setCoverPhoto / updatePhotoCaption
│   └── photoQueries.ts                         # 新規: ログ詳細・公開ページ用に写真一覧 + 表示 URL を取得
├── lib/
│   ├── photoStorage.ts                         # 新規(純粋): バケット名・パス生成・拡張子判定
│   ├── photoValidation.ts                      # 新規(純粋): 枚数 / 容量 / MIME のクライアント＆サーバー共通検証
│   ├── imageProcessing.ts                      # 新規(サーバー): sharp による回転適用・EXIF除去・WebP変換・サムネイル生成
│   └── *.test.ts                               # 上記純粋関数の Vitest
├── schemas/
│   └── photo.schema.ts                         # 新規: キャプション等のメタ入力スキーマ(yup)
├── types.ts                                    # 変更: DivePhoto / DivePhotoView を追加
└── index.ts                                    # 変更: 公開コンポーネント・型を re-export

service-front/src/shared/components/media/
└── PhotoThumbnail/                             # 新規(Server): next/image ラッパ（alt 必須・遅延読込・アスペクト保持）
    ├── PhotoThumbnail.tsx
    ├── PhotoThumbnail.test.tsx
    ├── PhotoThumbnail.stories.tsx
    └── index.ts

packages/supabase/src/types.ts                  # 変更: dive_photos テーブルの Row/Insert/Update 型を追加

supabase/
├── config.toml                                 # 変更: [storage.buckets.dive-photos] を定義（private / file_size_limit / allowed_mime_types）
└── migrations/
    ├── <ts>_create_dive_photos.sql             # 新規: dive_photos テーブル + RLS + インデックス + updated_at トリガ
    └── <ts>_create_dive_photos_storage_policies.sql  # 新規: storage.objects への RLS ポリシー（本人 CRUD + 公開ログ anon SELECT）
```

**Structure Decision**: 写真はダイブログに強く結合する（添付先・所有権・公開可否がすべて `dives` に従属）ため、新規 feature を切らず **既存 `dives` feature の拡張**として実装する（spec の v1 スコープは dives 限定）。ドメイン非依存の画像表示部品（`next/image` ラッパ）のみ `src/shared/components/media/PhotoThumbnail/` に置く。Storage 操作・画像処理は `dives/lib` と `dives/server` に閉じ込め、UI 層は受け取った表示 URL を描画するだけにする。

## 設計詳細

### データフロー（添付）

```text
[Client] DivePhotoUploader
  1. ファイル選択 → photoValidation で枚数/容量/MIME をクライアント検証（UX 即時フィードバック）
  2. browser Supabase client で原本を Storage へ直アップロード
       dive-photos/{user_id}/{dive_id}/orig/{photo_uuid}.{ext}   ← RLS: 本人 INSERT 可
  3. Server Action addDivePhoto({ diveId, origPath, caption? }) を呼ぶ（小さな JSON のみ送る）

[Server] addDivePhoto（'use server'）
  4. auth.getUser → 未認証は actionFailure。dive 所有権（auth.uid == dives.user_id）を確認
  5. サーバー側 photoValidation で再検証（クライアント検証は信頼しない）
  6. imageProcessing（sharp）: 原本を取得し
       - EXIF の Orientation を適用してピクセルを回転（FR-016）
       - 全メタデータを除去（GPS 含む。FR-009 / SC-005）
       - 表示用 WebP（長辺上限）と サムネイル WebP（小サイズ）を生成（HEIC もここで WebP 化。FR-017）
  7. 表示用 / サムネイルを Storage へ保存し、原本を削除
       dive-photos/{user_id}/{dive_id}/display/{photo_uuid}.webp
       dive-photos/{user_id}/{dive_id}/thumb/{photo_uuid}.webp
  8. dive_photos へ INSERT（sort_order は末尾、最初の 1 枚は is_cover=true）
  9. revalidatePath('/dives/[id]') → actionSuccess

[Server] photoQueries（詳細 / 公開ページ）
  - dive_photos を sort_order 昇順で取得し、表示 URL を解決
      * 本人の詳細ページ: 認証セッションで署名 URL or RLS 経由の取得
      * 公開ページ: is_public=true のときのみ Storage RLS（anon SELECT 許可）で公開読取
```

### 公開写真の参照可否（FR-006 / FR-007 / FR-008）

- バケットは **private**。公開可否は「写真パスが属する `dive_id` の `dives.is_public`」に連動させる。
- `storage.objects` の SELECT ポリシーで、`display/` 配下のオブジェクトについて **パスから抽出した `dive_id` の dive が公開中なら anon にも SELECT を許可**する（`orig/` と `thumb/` の公開可否は research.md / data-model.md で確定）。
- 非公開化（`is_public=false`）すると同ポリシーが即座に false を返すため、公開ページからの参照が止まる（FR-008）。アプリ側のキャッシュ無効化（revalidate）も併用。

### 既知の依存と段階リリース

- **公開ページ（`public_slug` のルート）は現状未実装**（spec.md Assumptions / 002 の Phase 2）。本 feature は「公開ログの写真が公開ページに出る」ための **データ・Storage RLS・取得クエリ（photoQueries）を提供**するが、公開ページ自体のレンダリング（ルート追加）は 002 の公開機能に属する依存。
  - したがって **US1（自分のログへの添付・閲覧・整理）= 本 feature 単独で完結する MVP**。
  - **US2（公開ページ表示）= 公開ページ実装が前提**。公開ページが未実装の間も Storage RLS と `photoQueries` は公開対応で用意し、ルートが追加された時点で結線できる状態にする。
- `sharp` 追加に伴い、画像処理を行う Server Action の実行ランタイムは **Node.js ランタイム**（Edge 不可）であることを実装時に明示する。

### バリデーション（FR-003 / FR-004）

| 項目 | 値 | 検証場所 |
|---|---|---|
| 1 ログあたり枚数 | 最大 10 枚 | クライアント（UX）+ サーバー（既存枚数 + 追加枚数で判定） |
| 1 ファイル容量 | 最大 10MB（変換前） | クライアント + サーバー |
| MIME | image/jpeg, image/png, image/webp, image/heic, image/heif | クライアント + サーバー（マジックバイト再確認は research R1 で判断） |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| アップローダを Client Component 化（原則 II の例外） | ファイル選択・選択中プレビュー・アップロード進捗・並び替えは双方向インタラクションが必須で Server Component では実現不可 | 完全 Server + フォーム POST のみだと進捗表示・複数ファイルのプレビュー・部分失敗の再試行が提供できず、SC-001/UX 要件を満たせない。Client 化はアップローダ 1 コンポーネントに限定し、表示系は Server のまま保つ |
| 新規ランタイム依存 `sharp`（サーバー画像処理） | HEIC デコード（FR-017）・EXIF/GPS の確実な除去（FR-009）・回転適用（FR-016）・サムネイル生成をサーバーの信頼境界で一括実行するため | クライアント変換（heic2any + canvas）はバンドル増・端末依存・HEIC デコード不安定で、GPS 除去をクライアントに委ねると信頼できない。Storage の画像変換 API だけでは EXIF 除去・HEIC 入力の保証が不足（research R1） |
