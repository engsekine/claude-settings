# Quickstart: ダイブログへの写真添付の検証

本 feature が end-to-end で動くことを確認するための検証ガイド。実装コードは含めない（詳細は [data-model.md](./data-model.md) / [contracts/](./contracts/) 参照）。

## 前提

- Supabase ローカル環境が起動できる（`supabase start`）
- マイグレーション適用済み: `dive_photos` テーブル + Storage ポリシー、`config.toml` の `dive-photos` バケット定義
- `sharp` が `service-front` に追加済み（画像処理を行う Server Action は Node.js ランタイム）
- `next.config` の `images.remotePatterns` に Storage ホストを許可済み
- 認証済みユーザー A と、別ユーザー B の 2 アカウント

## セットアップ

```bash
# DB リセット + マイグレーション + seed 適用
supabase db reset

# バケットが作成されていることを確認
supabase storage ls            # dive-photos が存在する

# アプリ起動
cd service-front && pnpm dev
```

## 検証シナリオ

### US1: 添付して見返す（MVP）

1. ユーザー A でログイン → 任意のダイブログ詳細を開く
2. アップローダから JPEG を 1 枚添付 → 詳細にサムネイル/画像が表示される（AC1）
   - **期待**: 5MB 程度の写真が 10 秒以内に表示される（SC-002）
3. ログ新規作成時に写真も選んで保存 → ログと写真が同時に保存される（AC2）
4. 詳細を再読込 → 添付済みの写真がすべて表示される（AC3）
5. **回転確認**: 向き情報付き（横向きで撮影した）写真が正しい向きで表示される（FR-016）
6. **HEIC 確認**: iPhone の HEIC を添付 → WebP に変換されブラウザで表示される（FR-017）

### 所有権 / 認証（FR-005 / FR-007）

7. ユーザー B でログインし、A の写真に対する `deleteDivePhoto` 等を試みる → 失敗する（AC4）
8. 未認証で写真添付 URL/操作を試みる → ログインへリダイレクト（AC5）

### US2: 公開ページでの共有（公開ページ実装が前提）

> 公開ページのルートは本 feature のスコープ外（research R4）。ルート未実装の間は Storage RLS と `photoQueries` のレベルで以下を検証する。

9. A が写真付きログを `is_public=true` にする
10. 署名 URL 経由 / 公開クエリで anon が display/thumb を取得できる（AC1）
11. 非公開ログ（`is_public=false`）の display/thumb を anon が取得しようとする → 取得不可（AC2 / FR-007 / INV-3）
12. 公開中ログを `is_public=false` に切替 → 以降 anon は取得不可（AC3 / FR-008）
13. `orig/` を anon が取得しようとする → 常に不可（INV-2）

### プライバシー（FR-009 / SC-005）

14. GPS 付き写真を添付 → 保存された display/thumb をダウンロードし、EXIF に GPS が無いことを確認（INV-4）

### US3: 整理（FR-010〜FR-013）

15. 複数枚添付 → 並び替え → 指定順で表示（AC1）
16. 1 枚を代表写真に指定 → ログ一覧/カードのサムネイルがその写真になる（AC2）
17. 代表写真を削除 → 残りの先頭が自動的に代表になる（Edge Case）
18. キャプションを付与 → 写真に添えて表示（AC3）
19. 1 枚を削除 → その写真だけ消え、他とログ本体は残る（AC4）

### エッジケース

20. 11 枚目を添付しようとする → 上限エラー（FR-003）
21. 動画/破損ファイルを添付 → 形式エラー（FR-004）
22. アップロード途中で通信を切る → ログ本体・既存写真は無事、失敗分のみ未保存（FR-015）

## 自動テストでの検証

- 純粋関数: `photoStorage`（パス生成）・`photoValidation`（枚数/容量/MIME）を Vitest
- `imageProcessing`: 既知の GPS 付き / HEIC / 回転付きサンプルで、出力 WebP のメタ除去・向き・寸法を検証
- コンポーネント: `DivePhotoUploader` / `DivePhotoGallery` / `PhotoThumbnail` の test + story + Playwright a11y（axe-core）
- RLS: 公開 / 非公開 dive の写真に対する anon SELECT 可否（INV-2/3）を統合的に確認
