# Quickstart: ダイブサイト（ポイント）マスタ

本機能の動作を端から端まで検証する手順。詳細なスキーマは [data-model.md](data-model.md)、設計判断は [research.md](research.md) を参照。

## 前提

- 認証済みユーザーでログインできること（001-auth / 002-dive-log-crud が動作）
- ローカル Supabase が起動し、マイグレーションとシードが適用されていること

## セットアップ

```bash
# リポジトリルートで
npx supabase db reset          # マイグレーション + seed.sql（初期ダイブサイト）を適用
supabase gen types ...         # @repo/supabase の Database 型を再生成（dive_sites / dives.dive_site_id 反映）

# service-front を起動
npm run dev --workspace service-front
```

## 検証シナリオ

### S1: サイトを検索して選び、ログを記録（US1 / FR-002・002a・002b）

1. `/dives/new` を開く
2. ポイント欄でサイト検索に「大瀬」と入力 → 候補が絞り込まれ「伊豆 / 大瀬崎」が表示される
3. 「伊豆 / 大瀬崎」を選択して保存
4. **期待**: ログ詳細・一覧に「伊豆 / 大瀬崎」が統一表記で表示される（`dive_site_id` 紐付け・`location` は null）

### S2: マスタに無いポイントを自由入力（US1 / FR-010・同居）

1. `/dives/new` を開き、検索しても該当が無いポイントについて、サイトを選ばずポイント名を自由入力して保存
2. **期待**: 自由入力のポイント名でログが記録される（`location` 設定・`dive_site_id` は null）。サイト選択と自由入力の両方を指定するとバリデーションエラー

### S3: サイト別実績を見る（US2 / FR-004・005・006・006a）

1. 同一サイト（例: 伊豆 / 大瀬崎）に異なる日付・透明度のログを複数登録
2. ログ詳細でサイト名リンクを押す → `/dive-sites/[id]` へ遷移
3. **期待**: 潜水本数、平均透明度（透明度未記録ログは除外）、月別本数による「よく潜る時期」が表示される
4. ログ 0 件のサイトの詳細を開く → 本数 0・実績なしの表示で破綻しない

### S4: 既存ログの互換（FR-011 / 段階移行）

1. マイグレーション前から存在する自由入力ログ（`location` のみ）を一覧・詳細で表示
2. **期待**: 従来どおりポイント名が表示・検索でき、破綻しない（`dive_site_id` は null のまま）

### S5: アクセス制御（RLS）

1. 一般ユーザーで `dive_sites` への INSERT/UPDATE/DELETE 相当の操作経路が存在しないこと（書き込みは seed / service role のみ）
2. `/dive-sites/[id]` の実績が他人のログを含まず、本人のログのみで集計されること

## 自動テスト

```bash
npm run test:coverage --workspace service-front   # Vitest（siteStats / siteLabel / dive.schema / Server Actions）
npm run test-storybook --workspace service-front  # Storybook（SearchSelect / DiveSiteDetail 等）
# Playwright a11y はダイブサイト詳細・ログ作成（検索選択）を対象に追加
```

## スコープ外（本機能では未実装）

- 管理画面でのダイブサイト追加・編集・統合（US3）→ 別機能「管理画面」+ 管理者ロールに依存。本機能ではマスタは `seed.sql` で投入する
- 既存自由入力ログのサイトへの一括移行 → 将来「管理画面」での統合機能に委ねる

## 将来メモ

- マスタが数千件規模に育ったら、`SearchSelect` の全件取得をサーバサイド検索に切り替える（[research.md R2](research.md)）
