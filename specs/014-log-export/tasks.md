---
description: "Task list for ログのエクスポート（PDF / CSV）"
---

# Tasks: ログのエクスポート（PDF / CSV）

**Input**: Design documents from `specs/014-log-export/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/export-endpoint.md

**Tests**: 本プロジェクトは Constitution III（Test-First）によりテスト必須。純粋関数は Vitest を先に書き、追加 UI は story + a11y を同梱する。

**Organization**: ユーザーストーリー単位でフェーズを分け、各ストーリーを独立して実装・テスト・デリバリーできるようにする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可（別ファイル・未完タスクへの依存なし）
- **[Story]**: 紐づくユーザーストーリー（US1 / US2 / US3）
- パスはリポジトリルート `service-front/` 起点

## Path Conventions

- 機能コードは `service-front/src/features/dives/` に集約
- Route Handler は `service-front/src/app/(authenticated)/dives/export/route.ts`
- ルート変更は `service-front/src/app/(authenticated)/dives/`

---

## Phase 1: Setup（共通基盤）

**Purpose**: PDF 生成に必要な依存とフォント資産を用意する

- [x] T001 `service-front/package.json` に `@react-pdf/renderer` を追加し `pnpm install` する（サーバー専用 import 前提・クライアントバンドルに含めない）
- [x] T002 [P] 日本語埋め込み用フォント（Noto Sans JP 等の TTF）を `service-front/src/features/dives/pdf/fonts/` に配置し、ライセンス表記を確認する

---

## Phase 2: Foundational（全ストーリーの前提・ブロッキング）

**Purpose**: パラメータ解析・対象取得・ファイル名・Route Handler の骨格。CSV/PDF どちらのストーリーからも使う共通土台

- [x] T003 [P] `service-front/src/features/dives/lib/export-params.test.ts` を作成（`format` の許可値検証、`parseDiveFilter` 流用、`ids` の UUID 形式・最大 500 件・フィルタより優先、不正時の扱い）
- [x] T004 `service-front/src/features/dives/lib/export-params.ts` を実装（`format` / `ids` / filter の解析 + 検証。`contracts/export-endpoint.md` の対象決定ロジックに従う）
- [x] T005 [P] `service-front/src/features/dives/lib/export-filename.test.ts` を作成（全件 `dive-logs_YYYYMMDD`、単一 `dive-log_<date>_<安全化名>`、拡張子、ASCII 安全化）
- [x] T006 `service-front/src/features/dives/lib/export-filename.ts` を実装
- [x] T007 [P] `service-front/src/features/dives/server/export-query.test.ts` を作成（filter 適用・`ids` の in 句・最大 500・`dive_date` desc / `id` desc・全カラム取得）
- [x] T008 `service-front/src/features/dives/server/export-query.ts` に `fetchDivesForExport`（filter または ids で全カラム + dive_site 結合を取得。フィルタ適用ロジックは `lib/list-query.ts` と共通化、本人 RLS 下）を実装
- [x] T009 `service-front/src/app/(authenticated)/dives/export/route.ts` に GET ハンドラ骨格を実装（認証 → `export-params` 解析 → `fetchDivesForExport` → `format` 分岐の枠 + `400`（format/ids 不正）・0 件ハンドリングの土台）

**Checkpoint**: パラメータ解析・対象取得・ファイル名・ルート枠が揃い、CSV/PDF 生成を差し込める状態

---

## Phase 3: User Story 1 - ダイブログを CSV で一括バックアップ（P1）🎯 MVP

**Goal**: 全件（およびフィルタ結果）の CSV を文字化け・列ずれなくダウンロードできる

**Independent Test**: ログを数件持つユーザーが `/dives` から CSV を出力し、ヘッダー + 全行・全項目が文字化け/列ずれなく開ける。0 件ならヘッダー行のみ

- [x] T010 [P] [US1] `service-front/src/features/dives/lib/export-csv.test.ts` を作成（UTF-8 BOM 付与、RFC 4180 エスケープ（`,` `"` 改行）、列順、`certification_dive`→はい/空、`tank_type` 日本語ラベル、`location` 表示名解決、0 件＝ヘッダーのみ）
- [x] T011 [US1] `service-front/src/features/dives/lib/export-csv.ts` を実装（`contracts/export-endpoint.md` の CSV 列契約に従う DiveExportRow 列定義 + 直列化）
- [x] T012 [US1] `service-front/src/app/(authenticated)/dives/export/route.ts` の `format=csv` 分岐を実装（`Content-Type: text/csv; charset=utf-8` + `Content-Disposition: attachment` + BOM + 本文）
- [x] T013 [P] [US1] `service-front/src/features/dives/components/client/ExportMenu/ExportMenu.tsx`（+ `index.ts`）を作成（CSV を選ぶと現在の `searchParams` を引き継いだ `/dives/export?format=csv&...` を開く。disclosure パターン・アクセシブル名）
- [x] T014 [US1] `/generate-with-tests service-front/src/features/dives/components/client/ExportMenu/ExportMenu.tsx` を実行し `ExportMenu.test.tsx` / `ExportMenu.stories.tsx` を生成
- [x] T015 [US1] `service-front/src/app/(authenticated)/dives/page.tsx` に `ExportMenu` を配置（現在の `searchParams` を渡す）し、`service-front/src/features/dives/index.ts` に新規 public API を re-export

**Checkpoint**: US1 単体で「全件/フィルタ CSV ダウンロード」が成立（MVP デリバリー可能）

---

## Phase 4: User Story 2 - 紙ログ提出用の PDF を出力（P2）

**Goal**: ログブック体裁 + 写真サムネイルの PDF をダウンロードでき、詳細から単一ログも出力できる

**Independent Test**: ユーザーが `/dives` から PDF を出力し、各ダイブがログ欄として整形され写真サムネイルが表示される。詳細画面からはその 1 本のみの PDF が出る。未入力/写真なしでも崩れない

- [x] T016 [US2] `service-front/src/features/dives/pdf/registerFont.ts` を実装（Phase 1 のフォントを `Font.register` で日本語登録。サーバー専用）
- [x] T017 [P] [US2] `service-front/src/features/dives/pdf/build-pdf-data.test.ts` を作成（`is_cover` 優先 → `sort_order`、1 ログ最大 4 枚、取得失敗サムネイルの除外、写真なしの空欄、表示名解決）
- [x] T018 [US2] `service-front/src/features/dives/pdf/build-pdf-data.ts` を実装（`Dive[]` + サムネイルバイト → `DivePdfEntry[]` の純粋関数）
- [x] T019 [US2] `service-front/src/features/dives/server/export-thumbs.ts` を実装（対象ログの `dive_photos.thumb_path` を Storage `download()` で並列取得 → `Uint8Array`、cover 優先・1 ログ最大 4 枚、失敗はスキップ）
- [x] T020 [US2] `service-front/src/features/dives/pdf/DiveLogPdf.tsx` を実装（`@react-pdf/renderer`：A4・各ダイブ 1 ログ欄・主要項目ラベル/値・サムネイル領域・空欄維持・欄をまたがず改ページ・0 件案内ページ）
- [x] T021 [US2] `service-front/src/app/(authenticated)/dives/export/route.ts` の `format=pdf` 分岐を実装（`export-thumbs` → `build-pdf-data` → `renderToBuffer` → `Content-Type: application/pdf` + `Content-Disposition`）
- [x] T022 [US2] `ExportMenu` に PDF 選択肢を追加し、テスト/story を同期更新（`ExportMenu.test.tsx` / `ExportMenu.stories.tsx`）
- [x] T023 [US2] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` に「この 1 本を PDF 出力」リンク（`/dives/export?format=pdf&ids=<id>`）を追加し、`DiveDetail.test.tsx` / `DiveDetail.stories.tsx` を同期更新

**Checkpoint**: US2 単体で「PDF（全件/フィルタ/単一）」が成立。US1 と独立して検証可能

---

## Phase 5: User Story 3 - 対象を絞ってエクスポート（P3）

**Goal**: 一覧の現在のフィルタ引き継ぎ（既存 ExportMenu で担保）に加え、一覧で複数選択した分のみを出力できる

**Independent Test**: 一覧でフィルタ適用中にエクスポートするとその結果のみが含まれ、一覧で 3 件選択してエクスポートすると選択分のみが含まれる。0 件/0 選択時は案内が出る

- [x] T024 [US3] `service-front/src/features/dives/components/client/DiveList/DiveList.tsx` に選択モード（行チェックボックス・全選択・選択数のテキスト表示。各行 `label` 関連付け）を追加
- [x] T025 [US3] `DiveList` に「選択分をエクスポート（CSV/PDF）」操作を追加（選択 `ids` で `/dives/export?ids=...&format=...` を開く。`ExportMenu` を選択 ids 付きで再利用可）
- [x] T026 [US3] 0 件/0 選択時の案内（`role="status"` で「対象ログがありません」）を `DiveList`／`ExportMenu` に実装（FR-009 / US3 シナリオ 3）
- [x] T027 [US3] `service-front/src/features/dives/components/client/DiveList/DiveList.test.tsx` と `DiveList.stories.tsx` を更新（選択モード・選択数・0 選択案内・選択 ids でのエクスポート起動）

**Checkpoint**: US1/US2/US3 すべてが個別に検証可能

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: a11y・性能・仕様同期の最終確認

- [ ] T028 [P] `/dives` と `/dives/[id]` の Playwright + axe-core a11y テストを更新（ExportMenu・選択モード・単一出力リンクを含む）
- [ ] T029 [P] quickstart.md の S1〜S6 を手動検証（特に S6: 他人の `ids` 混入で 0 件混入＝SC-005）
- [ ] T030 [P] 100 件規模で CSV / PDF の生成が 10 秒以内か計測（SC-002）。超過時は PDF サムネイル枚数/並列度を調整
- [ ] T031 `/sync-spec specs/014-log-export` と `/review 014-log-export` を実行し、実装と spec/contract のズレを解消

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** が全ストーリーの前提
- **US1 (P3)** は Foundational 完了後すぐ着手可（MVP）
- **US2 (P4)** は Foundational に依存（US1 とは独立。Route の format 分岐で共存）
- **US3 (P5)** は Foundational（`ids` 対応）+ US1 の `ExportMenu` に依存
- **Polish (P6)** は対象ストーリー完了後

```
Setup(T001-T002) → Foundational(T003-T009)
                        ├─ US1(T010-T015) ── MVP
                        ├─ US2(T016-T023)
                        └─ US3(T024-T027, ExportMenu[T013]依存)
                              → Polish(T028-T031)
```

## Parallel Opportunities

- Setup: T002 は T001 と並列可
- Foundational: テスト作成 T003 / T005 / T007 は並列可（別ファイル）。実装 T004/T006/T008 はそれぞれのテスト後
- US1: T010（テスト）と T013（ExportMenu 雛形）は並列可
- US2: T017（build-pdf-data テスト）は T016/T019 と並列可
- Polish: T028 / T029 / T030 は並列可

## Implementation Strategy

- **MVP = User Story 1（CSV）**: Setup → Foundational → US1 まででバックアップ用途を提供しデリバリー可能
- 以降 US2（PDF・紙提出）、US3（選択/絞り込み）を増分で追加
- 各ストーリー完了時に Checkpoint で独立検証してからマージ
