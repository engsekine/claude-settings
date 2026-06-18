# Data Model: ログのエクスポート（PDF / CSV）

本機能は **DB スキーマを変更しない**（読み取り専用）。既存テーブルを参照し、出力用の派生モデル（CSV 行・PDF 描画データ）を定義する。

## 参照する既存テーブル

| テーブル | 参照内容 | 定義元 |
|---|---|---|
| `public.dives` | 全カラム（出力対象データ本体）+ `dive_sites` 結合で表示名解決 | [002-dive-log-crud/data-model.md](../002-dive-log-crud/data-model.md) |
| `public.dive_sites` | `id, name, area`（`location` が null のサイト参照ログの名称解決） | 011-dive-sites-master |
| `public.dive_photos` | `thumb_path, is_cover, sort_order, caption`（PDF サムネイル用） | [012-photo-attachments/data-model.md](../012-photo-attachments/data-model.md) |
| Storage バケット `dive-photos` | `thumb_path` のバイト取得（`download()`） | 012-photo-attachments |

RLS は既存のまま。エクスポートは認証済みサーバークライアントで実行され、本人のログ・写真のみ取得される（FR-003）。

## 派生モデル（永続化しない）

### ExportRequest（Route Handler の入力）

エクスポート 1 回分の指定。永続化せず、リクエスト処理中のみ存在する。

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `format` | `'csv' \| 'pdf'` | YES | 出力形式。許可値以外は 400 |
| `filter` | `DiveListFilter` | NO | 機能 013 と同じフィルタ（`parseDiveFilter` で解析）。`ids` 未指定時に適用 |
| `ids` | `string[]`（UUID） | NO | 出力対象ログ ID。指定時はフィルタより優先。最大 500 件・UUID 形式を検証 |

決定ロジック: `ids` があれば「選択／単一出力」、無ければ「フィルタ（=全件 or 一覧条件）出力」。

### DiveExportRow（CSV 1 行に対応）

`Dive`（既存ドメイン型）から導出する CSV 出力用の列順・ラベル定義。内部 ID・公開フラグなどユーザーに不要な項目は除外し、`location` は表示名（自由入力名 or サイト名）に解決する。

| 列ヘッダー（CSV） | 元データ | 備考 |
|---|---|---|
| ダイブ番号 | `dive_number` | null は空 |
| 潜水日 | `dive_date` | `YYYY-MM-DD` |
| エントリー時刻 | `entry_time` | `HH:mm` |
| エキジット時刻 | `exit_time` | `HH:mm` |
| ポイント | 表示名 | `location` or `dive_site.name`（`diveLocationLabel` 流用） |
| エリア | `dive_site.area` | サイト参照時のみ |
| ダイブタイプ | `dive_type` | |
| 天気 | `weather` | |
| 気温(℃) | `air_temp_c` | |
| 水温(℃) | `water_temp_c` | |
| 透明度(m) | `visibility_m` | |
| 波・うねり | `wave` | |
| 流れ | `current_condition` | |
| 最大水深(m) | `max_depth_m` | |
| 平均水深(m) | `avg_depth_m` | |
| 潜水時間(分) | `bottom_time_min` | |
| タンク種類 | `tank_type` | `aluminum`/`steel` を日本語ラベル化 |
| タンク容量(L) | `tank_volume_l` | |
| ガス種類 | `gas_type` | |
| 酸素濃度(%) | `o2_percent` | |
| 開始残圧(bar) | `pressure_start_bar` | |
| 終了残圧(bar) | `pressure_end_bar` | |
| ウェイト(kg) | `weight_kg` | |
| スーツ | `suit_type` | |
| 装備メモ | `equipment_notes` | エスケープ対象（改行含みうる） |
| バディ | `buddy_name` | |
| インストラクター | `instructor_name` | |
| 講習ダイブ | `certification_dive` | 真偽を「はい/空」等で表現 |
| メモ | `notes` | エスケープ対象（改行含みうる） |

> 厳密な列順・ラベル・真偽表現は `contracts/export-endpoint.md` の CSV 列契約を単一の正とし、`export-csv.ts` がそれに従う。

### DivePdfEntry（PDF の 1 ログ欄に対応）

PDF 描画用に、各ダイブと**埋め込み済みサムネイル**を組み合わせた純粋データ（`build-pdf-data.ts` が生成）。

| フィールド | 型 | 説明 |
|---|---|---|
| `dive` | `Dive` | 表示する全項目 |
| `locationLabel` | `string` | 解決済み表示名 |
| `thumbnails` | `{ data: Uint8Array; alt: string }[]` | 最大 4 枚（cover 優先 → sort_order）。取得失敗分は除外 |

## バリデーション・制約（要件由来）

- `format` は `csv` / `pdf` のみ（FR-001 / FR-002）。それ以外は 400
- `ids` は UUID 形式・最大 500 件。範囲外件数は 400 もしくは先頭 500 件に丸めず明示エラー（実装方針は contract に記載）
- 対象 0 件: CSV はヘッダー行のみ返す（FR-009）。PDF は「対象ログがありません」の 1 ページを返す（FR-009 / US3 シナリオ 3）— 空ファイルにしない
- 出力対象は常に本人のログのみ（FR-003、RLS で担保）
- 任意項目の未入力: CSV は空セル、PDF は空欄（FR-008）

## 状態遷移

永続状態を持たない（オンデマンド生成）。状態遷移なし。
