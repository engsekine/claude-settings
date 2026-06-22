# Research: ログのエクスポート（PDF / CSV）

Phase 0。Technical Context の未確定点（PDF 生成方式・CSV エンコード・ダウンロード方式・写真埋め込み・絞り込み連携）を解決する。

## R1. ダウンロードの実現方式（Route Handler vs Server Action）

- **Decision**: App Router の **Route Handler**（`GET /dives/export`）でファイルを返す。`Content-Type` と `Content-Disposition: attachment; filename=...` を設定し、本文に CSV 文字列または PDF バイト列を載せる。
- **Rationale**: Server Action は値の返却向きで、ダウンロード用のレスポンスヘッダー制御やバイナリ返却に不向き。Route Handler は `Response` を直接返せて `<a href>` で起動でき、クライアント JS 不要（Server Components First に合致）。認証ページ配下に置けば既存の認証・RLS がそのまま効く。
- **Alternatives considered**:
  - Server Action + クライアントで Blob 化 → DL: クライアント JS と一時データ受け渡しが増え冗長。却下。
  - 署名付き一時 URL を別ストレージに発行: 生成物を保存する必要がなくオーバースペック。却下。

## R2. CSV のエンコード・整形

- **Decision**: **UTF-8 + BOM（`﻿`）** で出力。区切りはカンマ、改行は `\r\n`、各値は **RFC 4180** に従い、`,` `"` 改行のいずれかを含む値を `"` で囲み内部の `"` を `""` にエスケープ。先頭にヘッダー行。外部 CSV ライブラリは使わず純粋関数（`export-csv.ts`）で実装。
- **Rationale**: BOM 付き UTF-8 は Excel（日本語版含む）で文字化けせず開ける（FR-006）。RFC 4180 準拠でメモ内のカンマ・改行による列ずれを防ぐ（FR-005）。列数・項目が固定で軽量なため自前実装で十分かつ依存を増やさない。
- **Alternatives considered**:
  - Shift_JIS 出力: 文字範囲が狭く絵文字・一部記号で破綻。却下。
  - `papaparse` 等の導入: 生成だけなら過剰。却下。

## R3. PDF 生成方式

- **Decision**: **`@react-pdf/renderer`** を新規導入し、サーバー側で React 定義（`DiveLogPdf.tsx`）を `renderToBuffer` して PDF バイト列を生成、Route Handler で返す。日本語フォントは `Font.register` で同梱 TTF（例: Noto Sans JP）を登録する。
- **Rationale**: ログブック体裁（各ダイブ＝1 ログ欄、ラベル＋値、写真サムネイル）を宣言的に組め、画像（Buffer/データ URI）埋め込みに対応し、A4・ページ送りを制御できる（FR-007 / SC-004）。FR-002 が要求する「ダウンロード可能な PDF ファイル」をサーバー単体で生成できる。
- **Alternatives considered**:
  - 印刷用 HTML ページ + `@media print`（ブラウザの「PDF として保存」）: 依存ゼロだが、ユーザー操作依存で「ファイルとしてダウンロード」にならず FR-002 を満たさない。日本語フォント埋め込み・余白制御もブラウザ任せ。却下（将来の簡易プレビューとしては再検討余地あり）。
  - `puppeteer`/ヘッドレスブラウザで HTML→PDF: 実行環境が重く、サーバーレス/CI との相性が悪い。却下。
  - `pdf-lib` で低レベル組版: テキスト折返し・レイアウトを手組みする必要があり工数大。却下。
- **Note**: 新規依存の追加は constitution の Technology Stack を逸脱しないが、bundle/ビルドへの影響を tasks 段階で確認する。サーバー専用 import に限定し、クライアントバンドルに含めない。

## R4. PDF への写真サムネイル埋め込み

- **Decision**: 対象ログの `dive_photos.thumb_path` を **Storage `download()` でバイト取得**し、`@react-pdf/renderer` の `<Image>` にデータとして渡す。1 ダイブあたり **最大 4 枚**（`is_cover` を先頭、続いて `sort_order` 昇順）に上限化する。取得失敗した画像はスキップしレイアウトを維持する（Edge Case）。
- **Rationale**: サーバー側はブラウザ用ホスト差し替え（`toBrowserSignedUrl`）が不要で、`download()` の生バイトを直接埋め込める。枚数上限で PDF サイズと生成時間（SC-002 の 10 秒）を抑える。cover 優先で代表写真を確実に載せる。
- **Alternatives considered**:
  - `createSignedUrls` の URL を `<Image src>` に渡す: サーバーからの fetch 往復が増え、内部/公開ホストの差異も考慮が必要。`download()` のほうが堅実。却下。
  - 全枚数を埋め込む: 10 枚 × ログ数でサイズ・時間が膨らむ。却下（上限化を採用）。
- **CSV 側**: 写真は含めない（FR-007a / 仕様の Clarification）。

## R5. 絞り込み・選択・単一出力のパラメータ設計

- **Decision**: Route Handler は次のクエリを受ける。
  - `format=csv|pdf`（必須・許可値検証）
  - 機能 013 と同じフィルタキー（`number` / `date_from` / `date_to` / `depth_min` / `depth_max` / `type` / `q`）を **既存 `parseDiveFilter` で解析**して引き継ぐ（FR-010）
  - `ids=<uuid>,<uuid>,...`（任意）。指定時はフィルタより優先し、その ID 群のみ対象（複数選択・単一出力で共用、FR-010a/010b）。**件数上限**（既定 500）と UUID 形式を検証
- **Rationale**: 一覧の URL クエリ（013 が既に同期）をそのまま付与すれば「今見えている条件」で出力でき、二重の絞り込み UI が不要（Assumptions）。`ids` は単一・複数選択の両ユースケースを 1 つの仕組みで賄える。すべて RLS 下のクエリ条件なので他人のデータは原理的に返らない。
- **Alternatives considered**:
  - POST + body で条件送信: GET の `<a href>` 起動が使えずクライアント JS 必須になる。却下（`ids` 件数上限で URL 長は許容範囲）。
  - エクスポート専用の絞り込みフォーム: 013 と重複。却下。

## R6. 取得クエリ（ページングの扱い）

- **Decision**: エクスポートは**全該当行を一括取得**する専用クエリ `fetchDivesForExport`（`server/export-query.ts`）を新設。`DIVE_LIST_COLUMNS` ではなく**全カラム + dive_site 結合**を取得し、`dive_date` 降順・`id` 降順で安定ソート。`ids` 指定時は `in('id', ids)`、フィルタ指定時は `list-query.ts` と同じ条件適用ロジックを共有する。件数上限（500）を `limit` で担保。
- **Rationale**: 一覧はキーセットページングだが、エクスポートは「全件まとめて 1 ファイル」が要件。上限 500 件は SC-002（100 件 10 秒）に対し安全側で、URL/メモリ的にも妥当。フィルタ適用ロジックは `list-query.ts` から共通化して二重実装を避ける。
- **Alternatives considered**:
  - 既存 `fetchDiveListPage` をループしてページ連結: カーソル管理が複雑。却下（専用クエリで単純化）。

## まとめ（未解決の NEEDS CLARIFICATION）

なし。spec の Clarifications で写真・課金・出力単位・絞り込み連携が確定済み。CSV/PDF の技術詳細は本 research で決定。
