# Implementation Plan: ログのエクスポート（PDF / CSV）

**Branch**: `worktree-014-log-export` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/014-log-export/spec.md`

## Summary

ダイブログを **CSV（バックアップ用・全項目）** と **PDF（紙ログ提出用・ログブック体裁 + 写真サムネイル）** でダウンロードできるようにする。出力対象は (1) 全件、(2) 一覧（機能 013）の現在の検索・フィルタ条件、(3) 一覧での複数選択、(4) ダイブ詳細からの単一ログ、の 4 通り。スキーマ変更は不要で、既存 `dives` / `dive_photos` テーブルと本人限定 RLS の下でデータを読み取り、整形して返すのみ。

技術アプローチ: ダウンロードはヘッダー（`Content-Disposition`）制御が必要なため **Route Handler**（`GET /dives/export`）で実装する。フィルタ解析は既存 `parseDiveFilter`（`lib/search-params.ts`）を再利用し、選択／単一出力のために `ids` パラメータを追加する。CSV は純粋関数で UTF-8(BOM) + RFC 4180 エスケープして生成。PDF は `@react-pdf/renderer` でサーバー側に描画し、写真は Storage から取得したサムネイルを埋め込む。出力トリガーは原則プレーンな `<a href>`（サーバー完結）で、複数選択のみ最小限の Client Component を追加する。

## Technical Context

**Language/Version**: TypeScript（strict）/ Next.js App Router（React Compiler 有効）

**Primary Dependencies**: `@react-pdf/renderer`（**新規**・サーバー PDF 生成）、Supabase JS（クエリ + Storage download）、Tailwind CSS（一覧の選択 UI）。CSV は外部ライブラリを使わず自前の純粋関数で生成

**Storage**: Supabase（PostgreSQL + Storage）。本機能は **スキーマ・マイグレーションなし**。既存 `dives` 全カラムを読み取り、PDF サムネイルは既存 private バケット `dive-photos` の `thumb_path` を `download()` で取得

**Testing**: Vitest（CSV 直列化・ファイル名・パラメータ解析・PDF 描画データ整形などの純粋関数）、Storybook + Playwright/axe-core（追加する選択 UI・エクスポートメニュー）

**Target Platform**: Web（認証済みエリア配下）。Route Handler `src/app/(authenticated)/dives/export/route.ts`

**Project Type**: Web application（service-front 単一 Next.js アプリ + Supabase）

**Performance Goals**: 100 件規模で CSV / PDF とも 10 秒以内（SC-002）。CSV は単一クエリ + 直列化。PDF はサムネイルを並列 `download()` し、1 ダイブあたりのサムネイル枚数を上限化（既定 4 枚、cover 優先）して総バイト数と時間を抑える

**Constraints**: 本人のログのみ（既存 RLS）。CSV は文字化け・列ずれなし、PDF は A4 で判読可能。WCAG 2.1 AA。サブスク等の課金ゲートは設けない（FR-010c）

**Scale/Scope**: 1 ユーザー数百〜数千本規模。変更は `src/features/dives/` 内に集約 + Route Handler 1 本 + 一覧/詳細への導線追加

## Constitution Check

*GATE: Phase 0 前に通過必須。Phase 1 後に再評価。*

| 原則 | 判定 | 根拠 |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md（clarify 済み）→ 本 plan → tasks の順で進行。スキーマ変更なし |
| II. Server Components First | PASS | エクスポートは Route Handler（サーバー）で生成。全件・フィルタ・単一出力はプレーン `<a href>`（クライアント JS 不要）。複数選択のみ最小の Client Component を一覧に追加 |
| III. Test-First | PASS | CSV エスケープ/BOM/列定義、ファイル名生成、`ids`+filter のパラメータ解析、PDF 描画データ整形をすべて純粋関数に切り出し Vitest を先に書く。追加 UI は story + a11y 同梱 |
| IV. Security & RLS by Default | PASS | マイグレーションなし。Route Handler は認証済みサーバークライアントを使い、RLS により本人のログ・写真のみ取得（`ids` を渡しても他人の行は返らない）。`format`/`ids` は許可値・件数上限で検証 |
| V. Accessibility（WCAG 2.1 AA） | PASS | エクスポート操作は `<button>`/`<a>` にアクセシブル名を付与。形式選択はメニュー（disclosure: `aria-expanded`/`aria-controls`）。複数選択は各行のカード全体を `label` でチェックボックスに関連付け（選択モード中は詳細リンクを無効化し誤遷移を防止）+ 選択数のテキスト提示。0 件時は `role="status"` で案内 |
| VI. Coding Standards | PASS | TS strict・`any` 禁止、Feature-based 構成、Tailwind utility-first、snake_case→camelCase マッピング流用、命名規約準拠。新規依存 `@react-pdf/renderer` は PDF 生成のため導入（research で代替比較） |

**違反なし** → Complexity Tracking なし。新規依存の追加理由は research.md に記録。

## Project Structure

### Documentation (this feature)

```text
specs/014-log-export/
├── plan.md              # 本ファイル
├── spec.md              # 要件（clarify 済み）
├── research.md          # Phase 0 出力（PDF 方式・CSV エンコード・ダウンロード方式の決定）
├── data-model.md        # Phase 1 出力（読み取りモデル・CSV 列・PDF 描画データ）
├── quickstart.md        # Phase 1 出力（検証手順）
├── contracts/
│   └── export-endpoint.md  # GET /dives/export の I/O 契約 + CSV 列契約
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # /speckit-tasks で生成（本コマンドでは作らない）
```

### Source Code (repository root: `service-front/`)

変更・追加は `src/features/dives/` に集約し、Route Handler を 1 本追加、一覧/詳細に導線を足す。

```text
src/features/dives/
├── lib/
│   ├── export-csv.ts            # [新規] Dive[] → CSV 文字列（UTF-8 BOM / RFC4180 / 列定義）
│   ├── export-csv.test.ts       # [新規]
│   ├── export-filename.ts       # [新規] 形式・日付・スコープからファイル名生成
│   ├── export-filename.test.ts  # [新規]
│   ├── export-params.ts         # [新規] format / ids / filter のパース + 件数上限検証
│   └── export-params.test.ts    # [新規]
├── server/
│   ├── export-query.ts          # [新規] filter / ids で全カラム取得（ページング無し・本人RLS）
│   └── export-thumbs.ts         # [新規] 対象ログの thumb をまとめて download → Buffer/データ
├── pdf/
│   ├── build-pdf-data.ts        # [新規] Dive[] + サムネイル → PDF 描画用データ（純粋）
│   ├── build-pdf-data.test.ts   # [新規]
│   └── DiveLogPdf.tsx           # [新規] @react-pdf/renderer ドキュメント定義（ログブック体裁）
└── components/client/
    ├── ExportMenu/              # [新規] CSV/PDF 形式選択 → 現在の条件で export URL を開く
    │   ├── ExportMenu.tsx / .test.tsx / .stories.tsx / index.ts
    ├── DiveList/DiveList.tsx    # [変更] 選択モード（行チェックボックス）+ 選択数 + 選択エクスポート
    └── DiveCard/DiveCard.tsx    # [変更] 選択モード中はリンクを無効化し、カード全体をチェックボックスの label にする（誤遷移防止）

src/features/dives/components/server/DiveDetail/DiveDetail.tsx  # [変更] 単一ログの PDF/CSV 出力リンク

src/app/(authenticated)/dives/
├── export/route.ts              # [新規] GET ハンドラ。format に応じ CSV/PDF を返す
└── page.tsx                     # [変更] 一覧に ExportMenu を配置（現在の searchParams を引き継ぐ）

src/features/dives/index.ts      # [変更] 追加 public API を re-export
```

**Structure Decision**: 既存の Feature-based 構成（`src/features/dives/`）に閉じる。ダウンロードのヘッダー制御のため App Router の Route Handler を採用し、生成ロジック（CSV 直列化・PDF 描画データ）は I/O から分離した純粋関数に置いてテスト容易性を確保する。
