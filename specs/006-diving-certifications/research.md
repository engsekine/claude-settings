# Research: ダイビングライセンス保有資格管理

技術選定・設計判断の記録。Technical Context に NEEDS CLARIFICATION はないが、スキーマ設計と保有期間計算について複数の選択肢があったため判断理由を残す。

## R1. 指導団体の持ち方: `text` + CHECK 制約（マスタテーブルは作らない）

- **Decision**: `agency text not null check (agency in ('padi', 'naui', 'ssi', 'bsac', 'cmas', 'other'))` で保持する。表示ラベル（PADI / NAUI / ...）はフロントの `constants.ts` でマッピングする
- **Rationale**: 指導団体は件数が少なく不変に近い列挙値。`rules/sql.md` は enum 型を避けて `text` + CHECK を推奨しており、`user_details.gender` も同方式（小文字値）で実装済み。マスタテーブル（`agencies`）は 3NF 的には正しいが、属性が名前 1 つしかなく JOIN コストと管理コストに見合わない
- **Alternatives considered**:
  - `agencies` マスタテーブル + FK — 属性が増える（ロゴ・URL 等）将来要件が出たら移行する。現時点では過剰
  - PostgreSQL `enum` 型 — ALTER が困難なため `rules/sql.md` で禁止

## R2. 資格ランクの持ち方: 自由入力 `text`（選択式にしない）

- **Decision**: `rank text not null`（最大 60 文字）の自由入力とする
- **Rationale**: ランク名は団体ごとに体系が異なり（PADI: Open Water Diver / Advanced Open Water Diver / Rescue Diver / Divemaster、SSI: 同名でも基準差あり、CMAS: ★〜★★★★）、スペシャルティ資格（Enriched Air Diver 等）も無数にある。全団体×全ランクのマスタ管理は現実的でなく、自由入力 + ユーザー内ユニーク制約で重複だけ防ぐのが最小コスト
- **Alternatives considered**:
  - 団体別ランクの選択式 — 網羅不能。選択肢にないランクを持つユーザーが登録できなくなる
  - 主要ランクの選択 + その他自由入力 — UI が複雑になる割に防げる誤入力が少ない。v2 で検討

## R3. 保有期間は保存せず、取得日から表示時に計算する

- **Decision**: 保有期間（経過年月）はカラムに持たず、`acquired_on` から純粋関数で導出して表示する。計算ロジックは `features/certifications/lib/heldPeriod.ts` の純粋関数（外部ライブラリ不使用）に閉じ込め、単体テストを必ず付ける
- **Rationale**: 保有期間は時間経過で変わる導出値であり、保存すると毎日陳腐化する。`rules/sql.md` の「計算可能な値を冗長に保存しない」に準拠。プロジェクトに date-fns / dayjs は未導入で、年月差の切り捨て計算は `Date` の年月演算で十分なため依存追加もしない
- **Alternatives considered**:
  - DB の view / generated column で計算 — `current_date` に依存する値は generated column にできず、view は取得経路を複雑にするだけ
  - date-fns 導入 — 計算が「年月差の切り捨て」1 種類のみで導入根拠が弱い

## R4. 「取得日 ≧ 生年月日」の検証はアプリケーション層（Server Action）で行う

- **Decision**: 未来日付の拒否はユーザーのローカル日付基準で yup + Server Action が行い、DB の CHECK 制約は `acquired_on <= current_date + 1` の安全網とする（DB の `current_date` は UTC 基準のため、JST の午前中の「今日」が弾かれるのを防ぐ）。生年月日との比較は `user_details.birth_on` を参照するクロステーブル検証のため、Server Action 内で行う。`user_details` が取得できない場合は登録・更新を拒否する
- **Rationale**: PostgreSQL の CHECK 制約は他テーブルを参照できない。トリガで強制する手もあるが、生年月日の後変更との整合まで守る要件はなく、登録・更新時のアプリ検証で十分
- **Alternatives considered**:
  - BEFORE INSERT/UPDATE トリガで検証 — 守る価値に対して複雑。エラーメッセージのハンドリングもしづらい

## R5. 重複登録の防止: 複合ユニーク制約 + Server Action でのエラーハンドリング

- **Decision**: `unique (user_id, agency, rank)` を DB に定義し（`certifications_user_id_agency_rank_key`）、Server Action で一意制約違反（PostgreSQL エラーコード 23505）を捕捉してユーザー向けメッセージに変換する
- **Rationale**: `rules/sql.md`「制約は DB 側で表現する」に準拠。アプリ側の事前チェックだけでは同時実行で破れる
- **Alternatives considered**:
  - アプリ側の事前 SELECT のみ — レースコンディションで重複が入りうるため不採用

## R6. 画面構成: `settings` 配下に regulators（機材管理）と同型の 3 画面

- **Decision**: `/settings/certifications`（一覧）・`/settings/certifications/new`（新規）・`/settings/certifications/[id]/edit`（編集）の 3 ルート。一覧は Server Component、フォームと削除ボタンのみ Client Component
- **Rationale**: 既存の `settings/equipment`（`features/regulators`）が「ユーザー所有エンティティの CRUD を settings 配下で行う」同型機能として確立済み。構成・命名・RLS・テスト構成をそのまま踏襲することで実装コストとレビューコストを最小化する
- **Alternatives considered**:
  - プロフィール編集（`settings/profile`）への埋め込み — 1:N の資格リストを 1:1 のプロフィールフォームに同居させるとフォーム状態管理が複雑化。独立画面のほうが User Story 単位の独立テストも容易
